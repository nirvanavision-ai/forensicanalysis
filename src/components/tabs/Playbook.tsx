import { useContext, useMemo, useState } from 'react';
import { CONCEPT_BY_ID } from '../../data/knowledgeBase';
import { SOURCES, SOURCE_BY_ID, SUPPLIED_KB_GENERAL_SOURCES, type Source } from '../../data/sources';
import { APPROACH_LABEL, GOAL_LABEL, type GoalId } from '../../lib/taxonomy';
import { integrityReport } from '../../lib/verify';
import { PrintCtx, useCaseUI } from '../caseContext';
import { IconCheck, IconShield } from '../icons';
import { ConceptLinks, CopyButton, Disclosure, Empty, Section, Speaker } from '../ui';

export function SafetyNote() {
  return (
    <div className="notice notice-safety" role="note">
      <IconShield style={{ color: 'var(--teal-ink)', marginTop: 2 }} />
      <div>
        <strong>You decide what, if anything, to say.</strong> These are options, not instructions, and none of them assumes it is safe to confront anyone. If you are worried about how someone might react, you don’t have to use any of this. A trained domestic abuse or relationship support service can help you think through next steps and stay safe. Press Esc twice at any time to leave this page quickly.
      </div>
    </div>
  );
}

export function Playbook() {
  const { c } = useCaseUI();
  const a = c.analysis;
  const goalsInPlay = useMemo(() => {
    const seen = new Set<GoalId>();
    for (const g of c.context.goals) if (a.playbook.some((p) => p.goal === g)) seen.add(g);
    for (const p of a.playbook) seen.add(p.goal);
    return Array.from(seen);
  }, [a.playbook, c.context.goals]);
  const [goal, setGoal] = useState<GoalId | 'all'>('all');
  const entries = a.playbook.filter((p) => goal === 'all' || p.goal === goal);

  return (
    <div className="page">
      <Section id="playbook" title="Response playbook" intro="Ways you could respond, each tied to a finding, with what to do if the conversation goes one way or another, and when to stop.">
        <SafetyNote />
        {c.engine.kind === 'keyword' ? (
          <p className="measure" style={{ marginTop: 16 }}>
            Response options need a full analysis. Add a Claude API key in Settings, or explore the fictional examples to see what this looks like.
          </p>
        ) : (
          <>
            <div className="toggle-chips no-print" role="group" aria-label="Show options for" style={{ margin: '18px 0' }}>
              <button type="button" className="toggle-chip" aria-pressed={goal === 'all'} onClick={() => setGoal('all')}>
                All goals
              </button>
              {goalsInPlay.map((g) => (
                <button key={g} type="button" className="toggle-chip" aria-pressed={goal === g} onClick={() => setGoal(g)}>
                  {GOAL_LABEL[g]}
                </button>
              ))}
            </div>
            <div className="stack">
              {entries.map((p, i) => (
                <PlaybookCard key={i} p={p} />
              ))}
              {!entries.length ? <Empty>No options for this goal.</Empty> : null}
            </div>
          </>
        )}
      </Section>

      {a.reformulations.length ? (
        <Section
          id="reformulations"
          title="Stronger and more accountable versions"
          intro="Generated examples, not things anyone said: a stronger version of a weak argument, and what an accountable reply could sound like."
        >
          <div className="grid-2">
            {a.reformulations.map((r, i) => (
              <article key={i} className="panel">
                <div className="row" style={{ marginBottom: 8 }}>
                  <span className="pill">{r.kind === 'stronger_argument' ? 'Stronger argument' : 'Accountable reformulation'}</span>
                  <Speaker name={r.speaker} />
                  <span className="xs muted">instead of {r.turn}</span>
                </div>
                <Draft text={r.text} />
                <p className="small muted" style={{ marginTop: 8 }}>
                  {r.note}
                </p>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <Section id="unknowns" title="What remains unknown" intro="Questions this transcript cannot answer. They matter as much as the findings.">
        {a.unknowns.length ? (
          <ul className="measure uncertain" style={{ paddingLeft: 20, textDecoration: 'none' }}>
            {a.unknowns.map((u, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {u}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>None listed.</Empty>
        )}
      </Section>

      <Method />
      <References />
    </div>
  );
}

function Draft({ text }: { text: string }) {
  return (
    <div style={{ border: '1.5px dashed var(--line-strong)', borderRadius: 'var(--r-md)', padding: '12px 14px', background: 'var(--surface)' }}>
      <p style={{ margin: 0, fontSize: 'var(--t-md)' }}>{text}</p>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        <span className="xs muted">Generated example. Put it in your own words.</span>
        <CopyButton text={text} />
      </div>
    </div>
  );
}

function PlaybookCard({ p }: { p: ReturnType<typeof useCaseUI>['c']['analysis']['playbook'][number] }) {
  return (
    <article className="panel">
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="pill pill-moderate">{GOAL_LABEL[p.goal]}</span>
        <span className="pill">{APPROACH_LABEL[p.approach]}</span>
      </div>
      <p className="small" style={{ color: 'var(--ink-2)' }}>
        <strong>Responds to: </strong>
        {p.finding}
      </p>
      <Draft text={p.script} />
      {p.follow_up ? (
        <p className="small" style={{ marginTop: 12 }}>
          <strong>Then: </strong>
          {p.follow_up}
        </p>
      ) : null}
      {p.branches.length ? (
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">If they…</th>
                <th scope="col">You could…</th>
              </tr>
            </thead>
            <tbody>
              {p.branches.map((b, i) => (
                <tr key={i}>
                  <td style={{ width: '38%' }}>{b.if_they}</td>
                  <td>{b.you_could}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="notice" style={{ marginTop: 12 }}>
        <span>
          <strong>When to stop: </strong>
          {p.stop_condition}
        </span>
      </div>
      <div style={{ marginTop: 10 }}>
        <ConceptLinks ids={p.concepts} />
      </div>
    </article>
  );
}

export function Method() {
  const { c } = useCaseUI();
  const integ = useMemo(() => integrityReport(c.transcript, c.analysis), [c.transcript, c.analysis]);
  const checks = [
    `Read ${c.transcript.turns.length} turns from ${c.transcript.speakers.length} speakers (detected format: ${c.transcript.format}).`,
    c.aliasDisclosures.length ? `Replaced ${c.aliasDisclosures.length} name${c.aliasDisclosures.length === 1 ? '' : 's'} on this device before analysis.` : 'No names were replaced.',
    `Ran the offline keyword scan: ${c.keywordCues.length} cue${c.keywordCues.length === 1 ? '' : 's'}.`,
    c.engine.kind === 'keyword'
      ? 'No AI analysis was run.'
      : `Checked ${integ.total} citations against the transcript: ${integ.exact + integ.normalized} quotes found word for word, ${integ.wholeTurn} whole-turn citations, ${integ.problems.length} not matched.`,
    c.engine.kind === 'claude' ? 'Checked the analysis against Subtext’s fixed format before showing it.' : null,
  ].filter(Boolean) as string[];
  return (
    <Section id="method" title="How this analysis was made" intro="Only checks that were actually run are listed.">
      <div className="grid-2">
        <div className="panel panel-tight">
          <h3 style={{ fontSize: 'var(--t-md)' }}>Source of the analysis</h3>
          <p className="small" style={{ margin: 0 }}>
            {c.engine.kind === 'demo'
              ? 'A fictional example with a hand-written analysis, included to show how Subtext works.'
              : c.engine.kind === 'claude'
                ? `${c.engine.note} Claude answered a fixed set of questions in a fixed format, and could cite research only through the concepts in the knowledge base.`
                : 'The offline keyword scan, which runs entirely on this device.'}
          </p>
          <p className="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Created {new Date(c.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="panel panel-tight">
          <h3 style={{ fontSize: 'var(--t-md)' }}>Checks performed</h3>
          <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
            {checks.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="small muted measure" style={{ marginTop: 14 }}>
        Subtext is an educational tool for understanding communication. It does not diagnose anyone, detect lies, assess risk, or replace advice from a qualified professional. It reads words, not tone, intent or history it was not given.
      </p>
    </Section>
  );
}

function SourceLine({ s }: { s: Source }) {
  return (
    <li style={{ marginBottom: 8 }}>
      {s.citation}
      {s.url && !s.citation.includes(s.url) ? <span className="muted"> {s.url}</span> : null}{' '}
      {s.checked ? (
        <span className="pill pill-positive" title={s.checkNote ?? 'Bibliographic details confirmed during this build.'}>
          <IconCheck /> Confirmed
        </span>
      ) : (
        <span className="pill">Not yet confirmed</span>
      )}
      {s.inSuppliedKB ? <span className="pill pill-basis"> Named in the supplied knowledge base</span> : null}
      {s.note ? <div className="xs muted">{s.note}</div> : null}
      {s.claim ? <div className="xs muted">Finding: {s.claim}</div> : null}
      {s.cannotEstablish ? <div className="xs muted">Cannot establish: {s.cannotEstablish}</div> : null}
    </li>
  );
}

export function References({ all }: { all?: boolean }) {
  const { citedConcepts } = useCaseUI();
  const printing = useContext(PrintCtx);
  const citedSources = useMemo(() => {
    const ids = new Set<string>();
    citedConcepts.forEach((cid) => CONCEPT_BY_ID[cid]?.sources.forEach((s) => ids.add(s)));
    return Array.from(ids)
      .map((id) => SOURCE_BY_ID[id])
      .filter(Boolean)
      .sort((x, y) => x.citation.localeCompare(y.citation));
  }, [citedConcepts]);
  const confirmed = SOURCES.filter((s) => s.checked).length;
  return (
    <Section
      id="references"
      title="References"
      intro="Sources behind the concepts cited in this case. “Confirmed” means the citation details were checked against the publisher, journal or Crossref record during this build. It does not mean the work proves anything about the people in this conversation."
    >
      {citedSources.length ? (
        <ol className="small measure" style={{ paddingLeft: 20 }}>
          {citedSources.map((s) => (
            <SourceLine key={s.id} s={s} />
          ))}
        </ol>
      ) : (
        <Empty>No concepts were cited in this case.</Empty>
      )}
      {all ? (
        <>
          <h3>Full bibliography</h3>
          <ol className="small measure" style={{ paddingLeft: 20 }}>
            {[...SOURCES].sort((x, y) => x.citation.localeCompare(y.citation)).map((s) => (
              <SourceLine key={s.id} s={s} />
            ))}
          </ol>
        </>
      ) : printing ? (
        <p className="small muted">The full bibliography ({SOURCES.length} sources) is in the app’s Response playbook &amp; sources tab.</p>
      ) : (
        <Disclosure summary={`Full bibliography (${SOURCES.length} sources, ${confirmed} confirmed)`}>
          <ol className="small measure" style={{ paddingLeft: 20 }}>
            {[...SOURCES].sort((x, y) => x.citation.localeCompare(y.citation)).map((s) => (
              <SourceLine key={s.id} s={s} />
            ))}
          </ol>
          <p className="small muted">Also named in the supplied knowledge base as general references: {SUPPLIED_KB_GENERAL_SOURCES.join('; ')}.</p>
        </Disclosure>
      )}
    </Section>
  );
}
