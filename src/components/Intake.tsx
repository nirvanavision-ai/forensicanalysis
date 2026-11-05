import { useMemo, useRef, useState } from 'react';
import { DEMOS } from '../data/demos';
import type { CaseContext } from '../lib/case';
import { MODELS, type ModelId, type Progress } from '../lib/claude';
import { docxToText } from '../lib/docx';
import { applyAliases, parseTranscript, type AliasRule } from '../lib/parser';
import type { SavedCaseMeta } from '../lib/storage';
import { GOALS, RELATIONSHIP_TYPES, SOURCE_TYPES, type GoalId } from '../lib/taxonomy';
import { IconShield, IconTrash, IconUpload } from './icons';

export interface Draft {
  raw: string;
  fileName: string;
  context: CaseContext;
  aliases: AliasRule[];
}

const PHASE_TEXT: Record<Progress['phase'], string> = {
  connecting: 'Sending the transcript to Claude…',
  thinking: 'Claude is reading the conversation…',
  writing: 'Writing the analysis…',
  checking: 'Checking every quote against your transcript…',
  retrying: 'Trying again in a simpler format…',
};

export function Intake(props: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  hasKey: boolean;
  model: ModelId;
  busy: Progress | null;
  error: { message: string; detail?: string } | null;
  saved: SavedCaseMeta[];
  hasCurrent: boolean;
  onReturn: () => void;
  onDemo: (key: 'throuple' | 'couple') => void;
  onAnalyse: () => void;
  onKeyword: () => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  onOpenSaved: (id: string) => void;
  onDeleteSaved: (id: string) => void;
  onImport: (file: File) => void;
}) {
  const { draft, setDraft } = props;
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => (draft.raw.trim() ? parseTranscript(draft.raw) : null), [draft.raw]);
  const aliased = useMemo(() => (parsed ? applyAliases(parsed, draft.aliases) : null), [parsed, draft.aliases]);
  const speakers = parsed?.speakers ?? [];
  const ctx = draft.context;
  const setCtx = (patch: Partial<CaseContext>) => setDraft({ ...draft, context: { ...ctx, ...patch } });
  const aliasFor = (name: string) => draft.aliases.find((a) => a.original === name);
  const setAlias = (original: string, alias: string, replaceInText?: boolean) => {
    const rest = draft.aliases.filter((a) => a.original !== original);
    const prev = aliasFor(original);
    setDraft({ ...draft, aliases: [...rest, { original, alias, replaceInText: replaceInText ?? prev?.replaceInText ?? true }] });
  };

  const readFile = async (f: File) => {
    setFileError(null);
    try {
      const lower = f.name.toLowerCase();
      if (lower.endsWith('.json')) {
        const text = await f.text();
        if (/"app"\s*:\s*"subtext"/.test(text)) {
          props.onImport(f);
          return;
        }
        setDraft({ ...draft, raw: text, fileName: f.name });
        return;
      }
      if (lower.endsWith('.docx')) {
        setDraft({ ...draft, raw: await docxToText(f), fileName: f.name });
        return;
      }
      if (/\.(pdf|doc|pages|rtf)$/.test(lower)) {
        setFileError('That file type can’t be read here. Copy the text and paste it in, or save it as plain text first.');
        return;
      }
      setDraft({ ...draft, raw: await f.text(), fileName: f.name });
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'That file could not be read.');
    }
  };

  const canAnalyse = !!aliased && aliased.transcript.turns.length > 0 && !props.busy;

  return (
    <main id="main">
      <div className="intake-hero">
        <div className="intake-hero-inner">
          <div>
            <h1>See what was actually said.</h1>
            <p>
              Paste a conversation that left you confused. Subtext shows what each person asked for, how it was answered, and where it went sideways, with every point tied to the exact words.
            </p>
            {props.hasCurrent ? (
              <button type="button" className="btn" style={{ marginTop: 8 }} onClick={props.onReturn}>
                Back to the current analysis
              </button>
            ) : null}
          </div>
          <div className="demo-strip" aria-label="Fictional examples">
            {DEMOS.map((d) => (
              <button key={d.key} type="button" className="demo-card" onClick={() => props.onDemo(d.key)}>
                <span className="fiction-badge">Fictional example</span>
                <strong>{d.title.replace(/ \(fictional[^)]*\)/, '')}</strong>
                <span className="d">{d.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="intake-body">
        <div className="intake-main">
          <ol className="steps">
            <li>
              <h2 style={{ fontSize: 'var(--t-lg)' }}>Add the conversation</h2>
              <div
                className={`dropzone${drag ? ' drag' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void readFile(f);
                }}
              >
                <label htmlFor="raw" className="visually-hidden">
                  Transcript or messages
                </label>
                <textarea
                  id="raw"
                  className="textarea"
                  value={draft.raw}
                  onChange={(e) => setDraft({ ...draft, raw: e.target.value, fileName: '' })}
                  placeholder={'Paste here. For example:\n\nSam: Can we talk about Saturday?\nJules: Okay. Sure.\n\nChat exports, captions (.srt, .vtt) and transcripts with timestamps all work.'}
                  spellCheck={false}
                />
              </div>
              <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
                <span className="row">
                  <button type="button" className="btn btn-small" onClick={() => fileRef.current?.click()}>
                    <IconUpload /> Upload a file
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="visually-hidden"
                    accept=".txt,.md,.srt,.vtt,.csv,.json,.docx,text/plain"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void readFile(f);
                      e.target.value = '';
                    }}
                  />
                  {draft.raw ? (
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => setDraft({ ...draft, raw: '', fileName: '', aliases: [] })}>
                      Clear
                    </button>
                  ) : null}
                </span>
                <span className="xs muted">Text, captions, chat exports, CSV, JSON or Word (.docx). Read on this device.</span>
              </div>
              {fileError ? (
                <div className="notice notice-error" style={{ marginTop: 10 }} role="alert">
                  {fileError}
                </div>
              ) : null}
              {parsed ? (
                <p className="small" style={{ marginTop: 12 }} aria-live="polite">
                  Found <strong>{parsed.turns.length} turns</strong> from {speakers.length ? speakers.join(', ') : 'no named speakers'}
                  {draft.fileName ? ` in ${draft.fileName}` : ''}. Format: {parsed.format}.
                </p>
              ) : null}
              {parsed?.warnings.length ? (
                <div className="notice notice-warn" style={{ marginTop: 8 }}>
                  {parsed.warnings.join(' ')}
                </div>
              ) : null}
            </li>

            {speakers.length ? (
              <li>
                <h2 style={{ fontSize: 'var(--t-lg)' }}>Replace names (optional)</h2>
                <p className="small muted measure">
                  Aliases are applied on this device before anything is sent anywhere. Replaced names appear in brackets, like [Partner A], and the analysis says that it used aliases.
                </p>
                <div className="grid-2" style={{ gap: 12 }}>
                  {speakers.map((s) => (
                    <div key={s} className="field">
                      <label htmlFor={`alias-${s}`}>Show “{s}” as</label>
                      <input id={`alias-${s}`} className="input" value={aliasFor(s)?.alias ?? ''} placeholder={s} onChange={(e) => setAlias(s, e.target.value)} />
                    </div>
                  ))}
                </div>
                {draft.aliases.some((a) => a.alias.trim()) ? (
                  <label className="check small" style={{ marginTop: 10 }}>
                    <input
                      type="checkbox"
                      checked={draft.aliases.every((a) => a.replaceInText)}
                      onChange={(e) => setDraft({ ...draft, aliases: draft.aliases.map((a) => ({ ...a, replaceInText: e.target.checked })) })}
                    />
                    Also replace these names where people say them
                  </label>
                ) : null}
              </li>
            ) : null}

            <li>
              <h2 style={{ fontSize: 'var(--t-lg)' }}>Add context (optional)</h2>
              <p className="small muted measure">Context helps Subtext orient itself. It is treated as your account, not as evidence.</p>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="rel">Relationship</label>
                  <select id="rel" className="select" value={ctx.relationship} onChange={(e) => setCtx({ relationship: e.target.value as CaseContext['relationship'] })}>
                    {RELATIONSHIP_TYPES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="src">Where it comes from</label>
                  <select id="src" className="select" value={ctx.sourceType} onChange={(e) => setCtx({ sourceType: e.target.value as CaseContext['sourceType'] })}>
                    {SOURCE_TYPES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="me">Which speaker are you?</label>
                  <select id="me" className="select" value={ctx.userSpeaker} onChange={(e) => setCtx({ userSpeaker: e.target.value })}>
                    <option value="">Prefer not to say</option>
                    {(aliased?.transcript.speakers ?? []).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <span className="label" id="goals-l">
                  What would help most?
                </span>
                <div className="toggle-chips" role="group" aria-labelledby="goals-l">
                  {GOALS.map((g) => {
                    const on = ctx.goals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className="toggle-chip"
                        aria-pressed={on}
                        onClick={() => setCtx({ goals: on ? ctx.goals.filter((x) => x !== g.id) : [...ctx.goals, g.id as GoalId] })}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="notes">Anything else Subtext should know</label>
                <textarea id="notes" className="textarea" style={{ minHeight: 90, fontFamily: 'var(--font-ui)' }} value={ctx.notes} onChange={(e) => setCtx({ notes: e.target.value })} />
              </div>
            </li>

            <li>
              <h2 style={{ fontSize: 'var(--t-lg)' }}>Analyse</h2>
              {props.busy ? (
                <div className="panel panel-wash" aria-live="polite">
                  <p style={{ margin: '0 0 10px', fontWeight: 600 }}>{PHASE_TEXT[props.busy.phase]}</p>
                  <div className="progress-line" aria-hidden="true" />
                  <p className="xs muted" style={{ margin: '10px 0' }}>
                    {props.busy.chars ? `${props.busy.chars.toLocaleString()} characters received. ` : ''}A thorough analysis can take a few minutes. You can keep this tab in the background.
                  </p>
                  <button type="button" className="btn btn-small" onClick={props.onCancel}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="row">
                    <button type="button" className="btn btn-primary" disabled={!canAnalyse} onClick={props.hasKey ? props.onAnalyse : props.onOpenSettings}>
                      {props.hasKey ? `Analyse with ${MODELS.find((m) => m.id === props.model)?.label ?? 'Claude'}` : 'Add your Claude key to analyse'}
                    </button>
                    <button type="button" className="btn" disabled={!canAnalyse} onClick={props.onKeyword}>
                      Offline keyword scan
                    </button>
                  </div>
                  <p className="xs muted measure" style={{ marginTop: 10 }}>
                    The full analysis sends the transcript, with your aliases applied, to Anthropic using your own API key. The keyword scan never leaves this device.
                  </p>
                </>
              )}
              {props.error ? (
                <div className="notice notice-error" role="alert" style={{ marginTop: 12 }}>
                  <div>
                    <strong>{props.error.message}</strong>
                    {props.error.detail ? <div className="xs" style={{ marginTop: 4 }}>{props.error.detail}</div> : null}
                  </div>
                </div>
              ) : null}
            </li>
          </ol>
        </div>

        <aside className="stack">
          <div className="panel">
            <h2 style={{ fontSize: 'var(--t-lg)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <IconShield style={{ color: 'var(--teal-ink)' }} /> Your privacy
            </h2>
            <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
              <li>What you paste stays in this tab. Nothing is saved unless you choose to save it.</li>
              <li>A full analysis is sent only to Anthropic, with your own key. This page cannot contact any other site.</li>
              <li>No accounts, no tracking, no analytics, and no notifications.</li>
              <li>
                <strong>Quick exit:</strong> press Esc twice, or use the Exit button. It clears this page and opens a weather search. It does not erase your browser history, so use a private window if that matters.
              </li>
            </ul>
          </div>
          <div className="panel">
            <h2 style={{ fontSize: 'var(--t-lg)' }}>Open a saved analysis</h2>
            {props.saved.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                {props.saved.map((s) => (
                  <li key={s.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                    <button type="button" className="link-btn" onClick={() => props.onOpenSaved(s.id)}>
                      {s.title}
                    </button>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => props.onDeleteSaved(s.id)} aria-label={`Delete ${s.title} from this device`}>
                      <IconTrash />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Nothing is saved on this device.</p>
            )}
            <label className="btn btn-small" style={{ cursor: 'pointer' }}>
              <IconUpload /> Open a Subtext file (.json)
              <input
                type="file"
                accept=".json,application/json"
                className="visually-hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) props.onImport(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          <p className="xs muted" style={{ padding: '0 4px' }}>
            Subtext is an educational tool for understanding communication. It does not diagnose, detect lies or assess risk. If you are in danger, contact local emergency services.
          </p>
        </aside>
      </div>
    </main>
  );
}
