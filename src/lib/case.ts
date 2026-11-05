/**
 * A "case" is everything Subtext holds for one analysed conversation. It is kept in memory
 * only, unless the person explicitly saves it on their device or exports it as a file.
 */
import * as z from 'zod/v4';
import { AnalysisSchema, type Analysis } from './schema';
import type { Transcript } from './parser';
import type { KeywordCue } from './lexical';
import { GOAL_IDS, RELATIONSHIP_TYPES, SOURCE_TYPES, TAG_IDS, type GoalId, type RelationshipType, type SourceType } from './taxonomy';

export interface CaseContext {
  relationship: RelationshipType;
  sourceType: SourceType;
  /** Which speaker label (if any) is the person using Subtext. Optional. */
  userSpeaker: string;
  goals: GoalId[];
  notes: string;
}

export type EngineKind = 'demo' | 'claude' | 'keyword';

export interface CaseFile {
  app: 'subtext';
  version: 1;
  id: string;
  title: string;
  createdAt: string;
  fictional: boolean;
  engine: { kind: EngineKind; model: string; note: string };
  transcript: Transcript;
  aliasDisclosures: string[];
  context: CaseContext;
  analysis: Analysis;
  keywordCues: KeywordCue[];
}

export function defaultContext(): CaseContext {
  return { relationship: 'unspecified', sourceType: 'unspecified', userSpeaker: '', goals: [], notes: '' };
}

const TurnSchema = z.object({
  id: z.string(),
  index: z.number(),
  speaker: z.string(),
  timestamp: z.string().nullable(),
  seconds: z.number().nullable(),
  text: z.string(),
  flags: z.array(z.enum(['inaudible', 'overlap', 'uncertain_attribution', 'redaction', 'annotation'])),
  annotations: z.array(z.string()),
  wordCount: z.number(),
  line: z.number(),
});

export const CaseFileSchema = z.object({
  app: z.literal('subtext'),
  version: z.literal(1),
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  fictional: z.boolean(),
  engine: z.object({ kind: z.enum(['demo', 'claude', 'keyword']), model: z.string(), note: z.string() }),
  transcript: z.object({
    turns: z.array(TurnSchema),
    speakers: z.array(z.string()),
    format: z.string(),
    warnings: z.array(z.string()),
  }),
  aliasDisclosures: z.array(z.string()),
  context: z.object({
    relationship: z.enum(RELATIONSHIP_TYPES.map((r) => r.id) as [RelationshipType, ...RelationshipType[]]),
    sourceType: z.enum(SOURCE_TYPES.map((r) => r.id) as [SourceType, ...SourceType[]]),
    userSpeaker: z.string(),
    goals: z.array(z.enum(GOAL_IDS)),
    notes: z.string(),
  }),
  analysis: AnalysisSchema,
  keywordCues: z.array(z.object({ turn: z.string(), tag: z.enum(TAG_IDS), match: z.string() })),
});

export function parseCaseFile(json: unknown): { ok: true; value: CaseFile } | { ok: false; error: string } {
  const r = CaseFileSchema.safeParse(json);
  if (r.success) return { ok: true, value: r.data as CaseFile };
  const first = r.error.issues[0];
  return { ok: false, error: first ? `${first.path.join('.') || 'file'}: ${first.message}` : 'Unrecognised file' };
}

export function newId(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}
