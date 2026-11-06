import { useState } from 'react';
import { CONCEPT_BY_ID } from '../../data/knowledgeBase';
import type { Analysis } from '../../lib/schema';
import {
  AGREEMENT_SCOPE_LABEL,
  AGREEMENT_SCOPES,
  ARG_ASSESSMENT_LABEL,
  CLAIM_TYPE_LABEL,
  DECODER_MOVE_LABEL,
  OUTCOME_HELP,
  OUTCOME_LABEL,
  OUTCOMES,
  REQUEST_KIND_LABEL,
  TRIAD_CHECKS,
  TRIAD_STATUS_LABEL,
} from '../../lib/taxonomy';
import { useCaseUI } from '../caseContext';
import { RelationshipMap } from '../charts/RelationshipMap';
import { IconArrow } from '../icons';
import { BasisPill, ConceptLinks, ConfidencePill, Empty, Quotes, Section, Speaker, Speakers, ViewToggle } from '../ui';

const NAV = [
  ['decoder', 'Decoder'],
  ['contradictions', 'Contradictions'],
  ['arguments', 'Arguments'],
  ['reasoning', 'Reasoning problems'],
  ['mechanisms', 'Mechanisms'],
  ['relationships', 'Relationship map'],
  ['requests', 'Requests ledger'],
  ['boundaries', 'Boundaries and consent'],
  ['explanations', 'Competing explanations'],
] as const;

export function Audit() {
  const { c } = useCaseUI();
  const a = c.analysis;
  if (c.engine.kind === 'keyword') {
    return (
      <div className="page">
        <Section id="decoder" title="Logic and mechanism audit">
          <p className="measure">The audit needs a full analysis. The offline keyword scan only marks phrases for you to read; it does not reconstruct arguments or judge what a line does. Add a Claude API key in Settings to run the full analysis.</p>
        </Section>
      </div>
    );
  }
  return (
    <div className="page">
      <nav aria-label="Audit sections" className="no-print" style={{ marginBottom: 28 }}>
        <div className="row">
          {NAV.map(([id, label]) => (
            <a key={id} className="btn btn-small" href={`#${id}`}>
              {label}
            </a>
          ))}
        </div>
      </nav>
      <Decoder a={a} />
      <Contradictions a={a} />
      <Arguments a={a} />
      <Reasoning a={a} />
      <Mechanisms a={a} />
      <Relationships a={a} />
      <Requests a={a} />
      <Boundaries a={a} />
      <Explanations a={a} />
    </div>
  );
}

export function Decoder({ a }: { a: Analysis }) {
  return (
    <Section
      id="decoder"
      title="The decoder"
      intro="Lines that make a conversation confusing, explained plainly: what each one does, what it leaves unanswered, and the fairest way to read it."
    >
      {a.decoder.length ? (
        <div className="stack">
          {a.decoder.map((d, i) => (
            <article key={i} className="panel">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="row">
                  <span className="pill pill-concern">{DECODER_MOVE_LABEL[d.move]}</span>
                  <Speaker name={d.speaker} />
                </span>
                <ConfidencePill level={d.confidence} />
              </div>
              <Quotes items={[{ turn: d.turn, quote: d.quote }]} />
              <dl className="kv">
                <dt>What it does</dt>
                <dd>{d.what_it_does}</dd>
                <dt>What it leaves unanswered</dt>
                <dd>{d.what_it_leaves_unanswered}</dd>
                <dt>The fairest reading</dt>
                <dd className="uncertain" style={{ textDecoration: 'none' }}>
                  {d.fairer_reading}
                </dd>
              </dl>
              <div style={{ marginTop: 10 }}>
                <ConceptLinks ids={d.concepts} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty>Nothing in this conversation needed decoding.</Empty>
      )}
    </Section>
  );
}

export function Contradictions({ a }: { a: Analysis }) {
  return (
    <Section id="contradictions" title="Contradictions" intro="Statements by the same person that pull against each other, with how both might still be true.">
      {a.contradictions.length ? (
        <div className="stack">
          {a.contradictions.map((x, i) => (
            <article key={i} className="panel">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <Speaker name={x.speaker} />
                <ConfidencePill level={x.confidence} />
              </div>
              <div className="vs">
                <div className="panel panel-tight panel-wash">
                  <span className="xs muted">First</span>
                  <Quotes items={[x.first]} />
                </div>
                <span className="vs-mid" aria-hidden="true">
                  and later
                </span>
                <div className="panel panel-tight panel-wash">
                  <span className="xs muted">Then</span>
                  <Quotes items={[x.second]} />
                </div>
              </div>
              <p style={{ marginTop: 12 }}>{x.explanation}</p>
              <p className="small uncertain" style={{ textDecoration: 'none' }}>
                Could both be true? {x.could_both_be_true}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <Empty>No contradictions were identified.</Empty>
      )}
    </Section>
  );
}

export function Arguments({ a }: { a: Analysis }) {
  return (
    <Section
      id="arguments"
      title="Arguments, taken apart"
      intro="Each main argument laid out in Toulmin’s parts: the grounds offered, the claim, and the warrant that links them. Dashed boxes are warrants the analysis had to infer because nobody said them."
    >
      {a.arguments.length ? (
        <div className="stack">
          {a.arguments.map((g) => (
            <article key={g.id} className="panel">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="row">
                  <Speaker name={g.speaker} />
                  <span className="pill">{CLAIM_TYPE_LABEL[g.claim_type]}</span>
                </span>
                <span className={`pill ${g.assessment === 'supported' ? 'pill-positive' : g.assessment === 'does_not_follow' || g.assessment === 'weak_inference' ? 'pill-concern' : ''}`}>
                  {ARG_ASSESSMENT_LABEL[g.assessment]}
                </span>
              </div>
              <div className="toulmin" style={{ marginTop: 12 }}>
                <div className="tbox">
                  <h5>Grounds</h5>
                  {g.grounds.length ? (
                    g.grounds.map((gr, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <BasisPill basis={gr.basis} />
                        </div>
                        <p style={{ margin: '4px 0' }}>{gr.text}</p>
                        <Quotes items={gr.evidence} />
                      </div>
                    ))
                  ) : (
                    <p className="muted" style={{ margin: 0 }}>
                      None given
                    </p>
                  )}
                </div>
                <div className="tarrow" aria-hidden="true">
                  <IconArrow />
                </div>
                <div className="tbox tclaim">
                  <h5>Claim{g.qualifier ? ` (qualified: ${g.qualifier})` : ''}</h5>
                  <p style={{ margin: 0, fontWeight: 600 }}>{g.claim}</p>
                  {g.rebuttal ? (
                    <p className="small" style={{ margin: '8px 0 0' }}>
                      <span className="muted">Unless: </span>
                      {g.rebuttal}
                    </p>
                  ) : null}
                </div>
                <div className={`tbox twarrant${g.warrant.inferred ? ' inferred' : ''}`}>
                  <h5>{g.warrant.inferred ? 'Warrant (inferred by the analysis, not stated)' : 'Warrant'}</h5>
                  <p style={{ margin: 0 }}>{g.warrant.text}</p>
                  {g.backing ? (
                    <p className="small" style={{ margin: '6px 0 0' }}>
                      <span className="muted">Backing: </span>
                      {g.backing}
                    </p>
                  ) : null}
                </div>
              </div>
              <p style={{ marginTop: 12 }}>
                <strong>Assessment. </strong>
                {g.assessment_reason}
              </p>
              {g.missing.length ? (
                <p className="small uncertain" style={{ textDecoration: 'none' }}>
                  Missing: {g.missing.join(' ')}
                </p>
              ) : null}
              {g.counterevidence.length ? (
                <div className="small">
                  <strong>Against it: </strong>
                  {g.counterevidence.map((ce, i) => (
                    <div key={i}>
                      {ce.text}
                      <Quotes items={ce.evidence} />
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <Empty>No arguments were reconstructed.</Empty>
      )}
    </Section>
  );
}

export function Reasoning({ a }: { a: Analysis }) {
  return (
    <Section id="reasoning" title="Reasoning problems" intro="Named only with a quote, an explanation of how the problem works, and a charitable reading. One unclear sentence is not a fallacy.">
      {a.reasoning_issues.length ? (
        <div className="stack">
          {a.reasoning_issues.map((r) => (
            <article key={r.id} className="panel">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <ConceptLinks ids={[r.concept]} />
                <ConfidencePill level={r.confidence} />
              </div>
              <Quotes items={[{ turn: r.turn, quote: r.quote }]} />
              <dl className="kv">
                <dt>How it works here</dt>
                <dd>{r.how_it_operates}</dd>
                <dt>What it fails to establish</dt>
                <dd>{r.fails_to_establish}</dd>
                <dt>Charitable reading</dt>
                <dd className="uncertain" style={{ textDecoration: 'none' }}>
                  {r.charitable_reading}
                </dd>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <Empty>No reasoning problems were identified.</Empty>
      )}
    </Section>
  );
}

const LOCI = [
  { id: 'conduct', label: 'The conduct itself', help: 'Making harmful conduct seem acceptable' },
  { id: 'agency', label: 'Who is responsible', help: 'Moving responsibility elsewhere' },
  { id: 'outcomes', label: 'What it caused', help: 'Shrinking or ignoring the effects' },
  { id: 'recipient', label: 'The person affected', help: 'Blaming or lowering the person affected' },
] as const;

export function Mechanisms({ a }: { a: Analysis }) {
  const located = a.mechanisms.filter((m) => CONCEPT_BY_ID[m.concept]?.locus);
  return (
    <Section
      id="mechanisms"
      title="Mechanisms"
      intro="What a pattern does in the conversation (its effect), what it might be for (a hypothesis), and what can be said about intent (usually very little). These are kept apart on purpose."
    >
      {located.length ? (
        <div className="panel panel-wash" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 'var(--t-md)' }}>Where the justifications point (Bandura’s moral disengagement)</h3>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
            {LOCI.map((l) => {
              const items = located.filter((m) => CONCEPT_BY_ID[m.concept].locus === l.id);
              return (
                <div key={l.id} className="panel panel-tight">
                  <strong className="small">{l.label}</strong>
                  <p className="xs muted" style={{ margin: '2px 0 8px' }}>
                    {l.help}
                  </p>
                  {items.length ? (
                    items.map((m, i) => (
                      <div key={i} className="small" style={{ marginBottom: 6 }}>
                        <ConceptLinks ids={[m.concept]} />
                      </div>
                    ))
                  ) : (
                    <p className="xs muted" style={{ margin: 0 }}>
                      Nothing found
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {a.mechanisms.length ? (
        <div className="stack">
          {a.mechanisms.map((m, i) => (
            <article key={i} className="panel">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <ConceptLinks ids={[m.concept]} />
                <ConfidencePill level={m.confidence} />
              </div>
              <p style={{ marginTop: 10 }}>{m.observation}</p>
              <div className="grid-3" style={{ marginTop: 8 }}>
                <div className="panel panel-tight panel-wash">
                  <strong className="small">Effect in the conversation</strong>
                  <p className="small" style={{ margin: '4px 0 0' }}>
                    {m.effect}
                  </p>
                </div>
                <div className="panel panel-tight panel-wash">
                  <strong className="small">Possible function</strong>
                  <p className="small" style={{ margin: '4px 0 0' }}>
                    {m.possible_function}
                  </p>
                </div>
                <div className="panel panel-tight panel-wash">
                  <strong className="small">Intent</strong>
                  <p className="small uncertain" style={{ margin: '4px 0 0', textDecoration: 'none' }}>
                    {m.intent}
                  </p>
                </div>
              </div>
              <p className="small" style={{ marginTop: 10 }}>
                <span className="muted">Another reading: </span>
                {m.alternative}
              </p>
              <p className="small uncertain" style={{ textDecoration: 'none' }}>
                Limit: {m.limitation}
              </p>
              <Quotes items={m.evidence} />
            </article>
          ))}
        </div>
      ) : (
        <Empty>No mechanisms were described.</Empty>
      )}
    </Section>
  );
}

export function Relationships({ a }: { a: Analysis }) {
  const { c } = useCaseUI();
  const multi = c.transcript.speakers.length >= 3 || a.participants.length >= 3;
  return (
    <Section
      id="relationships"
      title="Relationship map"
      intro="Who asked, defended, pressured or acknowledged whom. People who were talked about but not present are shown with dashed outlines."
    >
      <RelationshipMap />
      <h3 style={{ marginTop: 28 }}>Agreements, by layer</h3>
      <p className="small muted measure">An individual boundary belongs to one person. A pair or group agreement needs everyone it binds. Each layer is checked separately.</p>
      <div className="grid-3">
        {AGREEMENT_SCOPES.map((s) => {
          const items = a.relationship.agreements.filter((x) => x.scope === s);
          return (
            <div key={s} className="panel panel-tight">
              <strong className="small">{AGREEMENT_SCOPE_LABEL[s]}</strong>
              {items.length ? (
                items.map((x, i) => (
                  <div key={i} className="item">
                    <div className="row" style={{ gap: 6 }}>
                      <Speakers names={x.parties} />
                      <span className="pill">{x.status}</span>
                    </div>
                    <p className="small" style={{ margin: '6px 0 0' }}>
                      {x.text}
                    </p>
                    <Quotes items={x.evidence} />
                  </div>
                ))
              ) : (
                <p className="xs muted">None mentioned</p>
              )}
            </div>
          );
        })}
      </div>
      <h3 style={{ marginTop: 28 }}>{multi ? 'Group dynamics checks' : 'Group dynamics checks (for three or more people)'}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">Result</th>
              <th scope="col">Why</th>
            </tr>
          </thead>
          <tbody>
            {TRIAD_CHECKS.map((t) => {
              const r = a.relationship.triad_checks.find((x) => x.check === t.id);
              return (
                <tr key={t.id}>
                  <td style={{ minWidth: 180 }}>{t.label}</td>
                  <td>
                    <span className={`pill ${r?.status === 'supported' ? 'pill-concern' : r?.status === 'possible' ? 'pill-tentative' : ''}`}>
                      {r ? TRIAD_STATUS_LABEL[r.status] : 'Not checked'}
                    </span>
                  </td>
                  <td>
                    {r?.explanation}
                    {r ? <Quotes items={r.evidence} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function Requests({ a }: { a: Analysis }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const counts = OUTCOMES.map((o) => ({ o, n: a.requests.filter((r) => r.outcome === o).length })).filter((x) => x.n > 0);
  const max = Math.max(1, ...counts.map((x) => x.n));
  return (
    <Section
      id="requests"
      title="Requests ledger"
      intro="Every request, concern, question, boundary and proposal, and what happened to it."
      actions={<ViewToggle value={view} onChange={setView} />}
    >
      {a.requests.length ? (
        <>
          <div className="panel panel-tight" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--t-md)' }}>What happened to them</h3>
            {view === 'chart' ? (
              <div className="bars" role="list">
                {counts.map(({ o, n }) => (
                  <div className="bar-row" role="listitem" key={o} title={OUTCOME_HELP[o]}>
                    <span>{OUTCOME_LABEL[o]}</span>
                    <span className="bar-track" aria-hidden="true">
                      <span className="bar-fill" style={{ width: `${(n / max) * 100}%`, display: 'block' }} />
                    </span>
                    <span className="bar-val">{n}</span>
                  </div>
                ))}
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Outcome</th>
                    <th scope="col">Meaning</th>
                    <th scope="col" className="num">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map(({ o, n }) => (
                    <tr key={o}>
                      <td>{OUTCOME_LABEL[o]}</td>
                      <td>{OUTCOME_HELP[o]}</td>
                      <td className="num">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="table-wrap">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th scope="col">Who</th>
                  <th scope="col">What</th>
                  <th scope="col">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {a.requests.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Who" style={{ minWidth: 140 }}>
                      <Speaker name={r.by} />
                      <div className="xs muted" style={{ marginTop: 4 }}>
                        to {r.to.join(', ')}
                      </div>
                    </td>
                    <td data-label="What">
                      <span className="pill" style={{ marginBottom: 4 }}>
                        {REQUEST_KIND_LABEL[r.kind]}
                      </span>
                      <p style={{ margin: '4px 0' }}>{r.summary}</p>
                      <Quotes items={r.evidence} />
                    </td>
                    <td data-label="Outcome" style={{ minWidth: 180 }}>
                      <strong>{OUTCOME_LABEL[r.outcome]}</strong>
                      {r.response_turns.length ? <div className="xs muted">Response: {r.response_turns.join(', ')}</div> : null}
                      <p className="small" style={{ margin: '4px 0 0' }}>
                        {r.note}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Empty>No requests were recorded.</Empty>
      )}
    </Section>
  );
}

const BOUNDARY_GROUPS: { key: keyof Analysis['boundaries']; title: string; tone?: 'concern' | 'positive' }[] = [
  { key: 'agreed', title: 'Boundaries accepted', tone: 'positive' },
  { key: 'refused', title: 'Refusals' },
  { key: 'stop_requests', title: 'Requests to stop' },
  { key: 'pressure_after_refusal', title: 'Pressure after a no', tone: 'concern' },
  { key: 'scope_changes', title: 'Scope changed after agreement', tone: 'concern' },
  { key: 'promised_changes', title: 'Promised changes' },
  { key: 'reported_distress', title: 'Distress described' },
];

export function Boundaries({ a }: { a: Analysis }) {
  return (
    <Section
      id="boundaries"
      title="Boundaries and consent"
      intro="A boundary does not have to be argued for to count, and consent is not a bargaining position. The same standard applies to everyone in the conversation."
    >
      <div className="grid-2">
        {BOUNDARY_GROUPS.map((g) => {
          const items = a.boundaries[g.key] as { text: string; by: string; evidence: Analysis['findings'][number]['evidence']; response?: string; specific?: boolean }[];
          return (
            <div key={g.key} className={`flag ${g.tone ? `flag-${g.tone}` : ''}`}>
              <h3 style={{ fontSize: 'var(--t-md)' }}>
                {g.title} <span className="muted">({items.length})</span>
              </h3>
              {items.length ? (
                items.map((x, i) => (
                  <div key={i} className="item">
                    <div className="row">
                      <Speaker name={x.by} />
                      {x.specific !== undefined ? <span className="pill">{x.specific ? 'Specific' : 'General'}</span> : null}
                    </div>
                    <p className="small" style={{ margin: '6px 0 0' }}>
                      {x.text}
                    </p>
                    {x.response ? (
                      <p className="small" style={{ margin: '4px 0 0' }}>
                        <span className="muted">Response: </span>
                        {x.response}
                      </p>
                    ) : null}
                    <Quotes items={x.evidence} />
                  </div>
                ))
              ) : (
                <p className="small muted" style={{ margin: 0 }}>
                  None found
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function Explanations({ a }: { a: Analysis }) {
  return (
    <Section
      id="explanations"
      title="Competing explanations"
      intro="More than one story can fit the same words. Each is listed with what it explains, what it leaves unexplained, and what would change the picture."
    >
      {a.competing_explanations.length ? (
        <div className="table-wrap">
          <table className="table table-stack">
            <thead>
              <tr>
                <th scope="col">Explanation</th>
                <th scope="col">Fits</th>
                <th scope="col">Leaves unexplained</th>
                <th scope="col">Would change it</th>
                <th scope="col">Support</th>
              </tr>
            </thead>
            <tbody>
              {a.competing_explanations.map((x, i) => (
                <tr key={i}>
                  <td data-label="Explanation" style={{ minWidth: 200 }}>
                    <strong>{x.explanation}</strong>
                  </td>
                  <td data-label="Fits">{x.supporting}</td>
                  <td data-label="Leaves unexplained">{x.unexplained}</td>
                  <td data-label="Would change it">{x.would_change}</td>
                  <td data-label="Support">
                    <ConfidencePill level={x.support} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No competing explanations were listed.</Empty>
      )}
    </Section>
  );
}

