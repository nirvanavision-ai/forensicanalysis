/**
 * The Claude engine. Runs entirely in the browser with the person's own API key, which is sent
 * only to api.anthropic.com (the page's content-security policy blocks every other host).
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { AnalysisSchema, type Analysis } from './schema';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt';
import type { CaseContext } from './case';
import type { Transcript } from './parser';
import { coerceToSchema } from './coerce';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Most thorough. Takes a few minutes.', serverFallback: true },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Faster and lower cost, still detailed.', serverFallback: true },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', note: 'Quickest, with less depth.', serverFallback: false },
] as const;
export type ModelId = (typeof MODELS)[number]['id'];
export const DEFAULT_MODEL: ModelId = 'claude-opus-5-5';

export type EngineErrorKind =
  | 'auth'
  | 'permission'
  | 'rate_limit'
  | 'overloaded'
  | 'network'
  | 'refusal'
  | 'too_long'
  | 'invalid_output'
  | 'bad_request'
  | 'cancelled'
  | 'unknown';

export class EngineError extends Error {
  constructor(
    public kind: EngineErrorKind,
    message: string,
    public detail?: string,
  ) {
    super(message);
  }
}

export interface Progress {
  phase: 'connecting' | 'thinking' | 'writing' | 'checking' | 'retrying';
  /** Characters of analysis received so far (not a percentage; the final size is unknown). */
  chars: number;
}

export interface EngineResult {
  analysis: Analysis;
  model: string;
  note: string;
  /** Items removed or relabelled because they used labels outside the fixed taxonomy. */
  repairs: string[];
}

const SCHEMA = zodOutputFormat(AnalysisSchema).schema;

function friendly(e: unknown): EngineError {
  if (e instanceof EngineError) return e;
  if (e instanceof Anthropic.APIUserAbortError) return new EngineError('cancelled', 'Analysis cancelled.');
  if (e instanceof Anthropic.AuthenticationError)
    return new EngineError('auth', 'Your API key was not accepted. Check it in Settings and try again.');
  if (e instanceof Anthropic.PermissionDeniedError)
    return new EngineError('permission', 'This API key does not have access to the chosen model. Try another model in Settings.');
  if (e instanceof Anthropic.NotFoundError)
    return new EngineError('permission', 'The chosen model is not available to this API key. Try another model in Settings.');
  if (e instanceof Anthropic.RateLimitError)
    return new EngineError('rate_limit', 'Your API key has reached its rate limit. Wait a minute, then try again.');
  if (e instanceof Anthropic.InternalServerError)
    return new EngineError('overloaded', 'Claude is busy right now. Your transcript is still here; try again in a minute.');
  if (e instanceof Anthropic.APIConnectionError)
    return new EngineError('network', 'Could not reach Claude. Check your internet connection. Offline keyword mode still works.');
  if (e instanceof Anthropic.BadRequestError) return new EngineError('bad_request', 'Claude could not accept this request.', e.message);
  if (e instanceof Anthropic.APIError) return new EngineError('unknown', 'Claude returned an unexpected error.', e.message);
  return new EngineError('unknown', 'Something went wrong while analysing.', e instanceof Error ? e.message : String(e));
}

function extractJson(text: string): unknown {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    // Without enforced structure the model may wrap the object in a code fence.
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new Error('No JSON object in the response');
  }
}

export async function analyseWithClaude(opts: {
  apiKey: string;
  model: ModelId;
  transcript: Transcript;
  context: CaseContext;
  aliasDisclosures: string[];
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
}): Promise<EngineResult> {
  const { apiKey, model, transcript, context, aliasDisclosures, signal, onProgress } = opts;
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2, timeout: 15 * 60 * 1000 });
  const modelInfo = MODELS.find((m) => m.id === model) ?? MODELS[0];
  const userMessage = buildUserMessage(transcript, context, aliasDisclosures);

  const run = async (structured: boolean) => {
    onProgress?.({ phase: structured ? 'connecting' : 'retrying', chars: 0 });
    const content = structured
      ? userMessage
      : `${userMessage}\n\nReturn only one JSON object (no prose, no code fence) that validates against this JSON schema:\n${JSON.stringify(SCHEMA)}`;
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: 64000,
        thinking: { type: 'adaptive' },
        output_config: structured ? { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } } : { effort: 'high' },
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content }],
        ...(modelInfo.serverFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      },
      { signal },
    );
    let chars = 0;
    for await (const ev of stream) {
      if (ev.type === 'content_block_start' && ev.content_block.type === 'thinking') onProgress?.({ phase: 'thinking', chars });
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
        chars += ev.delta.text.length;
        onProgress?.({ phase: 'writing', chars });
      }
    }
    return stream.finalMessage();
  };

  let message;
  try {
    try {
      message = await run(true);
    } catch (e) {
      // If the API rejects the enforced schema (for example a size limit), fall back to the
      // same request with the schema described in the prompt. The output is still validated.
      if (e instanceof Anthropic.BadRequestError && /schema|output_config|format|grammar/i.test(e.message)) {
        message = await run(false);
      } else throw e;
    }
  } catch (e) {
    throw friendly(e);
  }

  if (message.stop_reason === 'refusal') {
    throw new EngineError(
      'refusal',
      'Claude declined to analyse this transcript. Nothing was saved. You can still use offline keyword mode, or remove any part you think may have caused this and try again.',
      message.stop_details?.explanation ?? undefined,
    );
  }
  if (message.stop_reason === 'max_tokens') {
    throw new EngineError('too_long', 'The analysis ran out of room before it finished. Try a shorter excerpt, or split the conversation into parts.');
  }

  onProgress?.({ phase: 'checking', chars: 0 });
  const text = message.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (e) {
    throw new EngineError('invalid_output', 'Claude’s answer could not be read as an analysis. Please try again.', e instanceof Error ? e.message : undefined);
  }
  const repaired = coerceToSchema(parsed, AnalysisSchema);
  const result = AnalysisSchema.safeParse(repaired.value);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new EngineError(
      'invalid_output',
      'Claude’s answer did not match the analysis format. Please try again.',
      first ? `${first.path.join('.')}: ${first.message}` : undefined,
    );
  }

  const fellBack = (message.usage.iterations ?? []).some((it) => it.type === 'fallback_message');
  const servedBy = MODELS.find((m) => m.id === message.model)?.label ?? message.model;
  return {
    analysis: result.data,
    model: message.model,
    repairs: repaired.notes,
    note: fellBack
      ? `Analysed by ${servedBy} after ${modelInfo.label} declined part of the request.`
      : `Analysed by ${servedBy}.`,
  };
}
