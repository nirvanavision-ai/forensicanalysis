import { useMemo } from 'react';
import { CORE_QUESTIONS, FLAG_LABEL, TAG_LABEL, type TagId } from '../../lib/taxonomy';
import { integrityReport } from '../../lib/verify';
import { useCaseUI } from '../caseContext';
import { ConversationArc } from '../charts/ConversationArc';
import { IconAlert, IconCheck, IconInfo } from '../icons';
import { BasisPill, ConceptLinks, ConfidencePill, Disclosure, Empty, Quotes, Section, Speaker } from '../ui';

const ADDRESSED_LABEL = {
  addressed: 'Addressed',
  partly_addressed: 'Partly addressed',
  not_addressed: 'Not addressed',
  unclear: 'Unclear',
} as const;

export function Briefing() {
  const { c, goTo } = useCaseUI();
  const a = c.analysis;
  const integrity = useMemo(() => integrityReport(c.transcript, a), [c.transcript, a]);
  const concerns = a.flags.filter((f) => f.polarity === 'concern');
  const positives = a.flags.filter((f) => f.polarity === 'positive');
  const keywordOnly = c.engine.kind === 'keyword';

  return (
    <div className="page">
      {keywordOnly ? <KeywordHero /> : (
        <div className="hero">
          <div>
            <p className="small muted" style={{ margin: 0, fontWeight: 700 }}>
              Central finding
            </p>
            <p className="hero-finding">{a.central_finding}</p>
            <p className="measure" style={{ color: 'var(--ink-2)' }}>
              {a.summary}
            </p>
            <p className="xs muted" style={{ marginTop: 14 }}>
              This is an educational reading of the words in the transcript. It is not a diagnosis, a legal finding or a judgement about anyone’s character.
            </p>
          </div>
          <aside className="concern-card" aria-labelledby="concern-h">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 id="concern-h" style={{ fontSize: 'var(--t-md)', margin: 0 }}>
                The concern that started it
              </h2>
              <span className={`status status-${a.original_concern.addressed}`}>{ADDRESSED_LABEL[a.original_concern.addressed]}</span>
            </div>
            <p className="said" style={{ marginTop: 12 }}>
              {a.original_concern.text}
            </p>
            {a.original_concern.raised_by ? (
              <p className="small" style={{ margin: '0 0 8px' }}>
                Raised by <Speaker name={a.original_concern.raised_by} />
              </p>
            ) : null}
            <p className="small">{a.original_concern.explanation}</p>
            <Quotes items={a.original_concern.evidence} />
          </aside>
        </div>
      )}

      <Section
        id="arc"
        title="The conversation at a glance"
        intro="Each bar is one turn, in order. Taller bars have more words. Select any bar or marker to read that moment in context."
      >
        <ConversationArc />
      </Section>

      {!keywordOnly ? (
        <Section
          id="flags"
          title="What the words support"
          intro="Concerns and positive patterns, each tied to the exact words. Positive signs are shown next to concerns, and they never cancel them out."
        >
          <div className="flag-cols">
            <div>
              <p className="col-head">
                <span className="bar" style={{ background: 'var(--coral)' }} aria-hidden="true" />
                Concerns ({concerns.length})
              </p>
              <div className="stack">
                {concerns.length ? concerns.map((f, i) => <FlagCard key={i} f={f} />) : <Empty>No concerns were supported by the words in this transcript.</Empty>}
              </div>
            </div>
            <div>
              <p className="col-head">
                <span className="bar" style={{ background: 'var(--teal)' }} aria-hidden="true" />
                Positive signs ({positives.length})
              </p>
              <div className="stack">
                {positives.length ? positives.map((f, i) => <FlagCard key={i} f={f} />) : <Empty>No positive patterns were identified.</Empty>}
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      <Section id="scope" title="Reality check" intro="What this analysis rests on, kept separate: what the transcript documents, what people reported, what you told Subtext, and what nobody can know from here.">
        <div className="scope-grid">
          <div className="scope-cell">
            <h3>
              <span className="pill pill-basis pill-basis-documented">Documented</span>
            </h3>
            <p className="small">{a.evidence_scope.documented || `${c.transcript.turns.length} turns by ${c.transcript.speakers.join(', ')}.`}</p>
          </div>
          <div className="scope-cell">
            <h3>
              <span className="pill pill-basis pill-basis-reported">Reported events</span>
            </h3>
            {a.evidence_scope.reported_events.length ? (
              <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                {a.evidence_scope.reported_events.map((r, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {r.text} <span className="muted">({r.reported_by})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>None identified.</Empty>
            )}
            <p className="xs muted" style={{ marginTop: 8 }}>
              A transcript shows that something was said, not that it happened as described.
            </p>
          </div>
          <div className="scope-cell">
            <h3>
              <span className="pill pill-basis">Your context</span>
            </h3>
            <p className="small">{a.evidence_scope.context_used || 'None supplied.'}</p>
          </div>
          <div className="scope-cell">
            <h3>
              <span className="pill pill-basis pill-basis-unknown">Missing or uncertain</span>
            </h3>
            {a.evidence_scope.missing.length ? (
              <ul className="small uncertain" style={{ paddingLeft: 18, margin: 0, textDecoration: 'none' }}>
                {a.evidence_scope.missing.map((m, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Nothing noted.</Empty>
            )}
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="panel panel-tight">
            <h3 style={{ fontSize: 'var(--t-md)' }}>Transcript quality</h3>
            <p className="small" style={{ margin: 0 }}>
              {a.evidence_scope.transcript_quality || c.transcript.warnings.join(' ') || 'No issues noted.'}
            </p>
            {c.aliasDisclosures.length ? (
              <p className="small" style={{ marginTop: 8 }}>
                Names replaced before analysis: {c.aliasDisclosures.join('; ')}.
              </p>
            ) : null}
          </div>
          <IntegrityPanel integrity={integrity} />
        </div>
      </Section>

      {!keywordOnly ? (
        <>
          <Section id="questions" title="Answers to the core questions" intro="The same questions are asked of every conversation, so cases can be compared.">
            <div>
              {CORE_QUESTIONS.map((q) => {
                const ans = a.core_questions.find((x) => x.question === q.id);
                return (
                  <Disclosure
                    key={q.id}
                    summary={
                      <span style={{ display: 'flex', flex: 1, justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <span>{q.text}</span>
                        {ans ? <ConfidencePill level={ans.confidence} /> : <span className="pill">Not answered</span>}
                      </span>
                    }
                  >
                    {ans ? (
                      <>
                        <p className="measure">{ans.answer}</p>
                        <Quotes items={ans.evidence} />
                      </>
                    ) : (
                      <Empty>The analysis did not answer this question.</Empty>
                    )}
                  </Disclosure>
                );
              })}
            </div>
          </Section>

          <Section id="findings" title="Key findings">
            <div className="grid-2">
              {a.findings.map((f) => (
                <article key={f.id} className="panel">
                  <div className="row" style={{ marginBottom: 6 }}>
                    <BasisPill basis={f.basis} />
                    <ConfidencePill level={f.confidence} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.statement}</p>
                  <p className="small muted">{f.confidence_reason}</p>
                  <Quotes items={f.evidence} />
                  <div style={{ marginTop: 10 }}>
                    <ConceptLinks ids={f.concepts} />
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <div className="row no-print">
            <button type="button" className="btn" onClick={() => goTo('audit', 'decoder')}>
              Open the decoder
            </button>
            <button type="button" className="btn" onClick={() => goTo('audit', 'boundaries')}>
              Boundaries and consent
            </button>
            <button type="button" className="btn btn-primary" onClick={() => goTo('playbook')}>
              See your options
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FlagCard({ f }: { f: ReturnType<typeof useCaseUI>['c']['analysis']['flags'][number] }) {
  return (
    <article className={`flag flag-${f.polarity}`}>
      <div className="row">
        <span className={`pill pill-${f.polarity}`}>
          {f.polarity === 'concern' ? <IconAlert /> : <IconCheck />}
          {FLAG_LABEL[f.kind]}
        </span>
        <ConfidencePill level={f.confidence} />
      </div>
      <h4>{f.title}</h4>
      {f.by ? (
        <p className="small" style={{ margin: '0 0 4px' }}>
          <Speaker name={f.by} />
        </p>
      ) : null}
      <p className="small" style={{ margin: 0 }}>
        {f.explanation}
      </p>
      <Quotes items={f.evidence} />
    </article>
  );
}

export function IntegrityPanel({ integrity }: { integrity: ReturnType<typeof integrityReport> }) {
  const verified = integrity.exact + integrity.normalized;
  const quoted = integrity.total - integrity.wholeTurn;
  return (
    <div className="panel panel-tight" aria-labelledby="integrity-h">
      <h3 id="integrity-h" style={{ fontSize: 'var(--t-md)' }}>
        Quote check
      </h3>
      {integrity.total === 0 ? (
        <p className="small" style={{ margin: 0 }}>
          No passages are cited yet.
        </p>
      ) : (
        <>
          <p className="small" style={{ margin: 0 }}>
            {integrity.problems.length === 0 ? <IconCheck style={{ color: 'var(--teal)', verticalAlign: '-3px' }} /> : <IconAlert style={{ color: 'var(--coral)', verticalAlign: '-3px' }} />}{' '}
            {verified} of {quoted} quoted passages were found word for word in the cited turn
            {integrity.normalized ? ` (${integrity.normalized} after ignoring punctuation or capitals)` : ''}. {integrity.wholeTurn} citations point to a whole turn.
          </p>
          {integrity.problems.length ? (
            <p className="small" style={{ color: 'var(--coral-ink)', marginTop: 8 }}>
              {integrity.problems.length} citation{integrity.problems.length === 1 ? '' : 's'} could not be matched and {integrity.problems.length === 1 ? 'is' : 'are'} marked wherever {integrity.problems.length === 1 ? 'it appears' : 'they appear'}. Treat {integrity.problems.length === 1 ? 'it' : 'them'} with caution.
            </p>
          ) : null}
        </>
      )}
      <p className="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>
        <IconInfo style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> Checked on this device against the transcript you supplied.
      </p>
    </div>
  );
}

function KeywordHero() {
  const { c, goTo } = useCaseUI();
  const counts = new Map<TagId, number>();
  for (const cue of c.keywordCues) counts.set(cue.tag, (counts.get(cue.tag) ?? 0) + 1);
  const rows = Array.from(counts.entries()).sort((x, y) => y[1] - x[1]);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="hero">
      <div>
        <p className="small muted" style={{ margin: 0, fontWeight: 700 }}>
          Offline keyword scan
        </p>
        <p className="hero-finding">
          Subtext found {c.keywordCues.length} phrase{c.keywordCues.length === 1 ? '' : 's'} that often accompany requests, refusals, apologies, pressure and other moves. These are pointers for you to read, not findings.
        </p>
        <p className="measure" style={{ color: 'var(--ink-2)' }}>
          The keyword scan ran entirely on this device. It cannot tell sarcasm from sincerity or a quoted phrase from a real one, so read each cue in context. For a full analysis, add your Claude API key in Settings.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => goTo('transcript')}>
          Read the transcript with cues
        </button>
      </div>
      <aside className="concern-card">
        <h2 style={{ fontSize: 'var(--t-md)' }}>Cues by type</h2>
        {rows.length ? (
          <div className="bars" role="list">
            {rows.map(([tag, n]) => (
              <div className="bar-row" role="listitem" key={tag}>
                <span>{TAG_LABEL[tag]}</span>
                <span className="bar-track" aria-hidden="true">
                  <span className="bar-fill" style={{ width: `${(n / max) * 100}%`, display: 'block' }} />
                </span>
                <span className="bar-val">{n}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No keyword cues found.</Empty>
        )}
      </aside>
    </div>
  );
}
