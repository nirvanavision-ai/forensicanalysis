import { useMemo, useState } from 'react';
import { CONCEPTS, DOMAINS, EVIDENCE_KIND_HELP, EVIDENCE_KIND_LABEL, type Concept, type EvidenceKind } from '../../data/knowledgeBase';
import { GUARDRAILS } from '../../data/research';
import { SOURCE_BY_ID } from '../../data/sources';
import { useCaseUI } from '../caseContext';
import { IconCheck, IconSearch } from '../icons';
import { Disclosure, Section } from '../ui';

const KINDS = Object.keys(EVIDENCE_KIND_LABEL) as EvidenceKind[];

export function ConceptCard({ c, compact, cited, brief }: { c: Concept; compact?: boolean; cited?: boolean; brief?: boolean }) {
  const details = <ConceptDetails c={c} brief={brief} />;
  return (
    <article className={compact ? '' : 'panel'} id={`concept-${c.id}`}>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="pill" title={EVIDENCE_KIND_HELP[c.kind]}>
          {EVIDENCE_KIND_LABEL[c.kind]}
        </span>
        {c.contested ? <span className="pill pill-tentative">Contested</span> : null}
        {c.researchConfidence ? <span className="pill pill-basis">Research support: {c.researchConfidence.toLowerCase()}</span> : null}
        {cited ? <span className="pill pill-moderate">Cited in this case</span> : null}
      </div>
      <h3>{c.title}</h3>
      <p className="xs muted" style={{ marginTop: -4 }}>
        {c.domain}
      </p>
      <p>{c.definition}</p>
      {compact ? details : <Disclosure summary={<span className="small">How it is used, limits and sources</span>}>{details}</Disclosure>}
    </article>
  );
}

/** `brief` keeps only what a printed appendix needs: the limits and the sources. */
function ConceptDetails({ c, brief }: { c: Concept; brief?: boolean }) {
  return (
    <>
      {!brief && c.application ? (
        <>
          <h4 className="small">How Subtext uses it</h4>
          <p className="small">{c.application}</p>
        </>
      ) : null}
      {!brief && c.lookFor.length ? (
        <>
          <h4 className="small">What to look for in the words</h4>
          <ul className="small" style={{ paddingLeft: 18, marginTop: 0 }}>
            {c.lookFor.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </>
      ) : null}
      {!brief && c.researchNotes?.length ? (
        <>
          <h4 className="small">What the research shows</h4>
          {c.researchNotes.map((n, i) => (
            <p className="small" key={i}>
              {n}
            </p>
          ))}
        </>
      ) : null}
      {c.limitations || c.cannotEstablish?.length ? (
        <>
          <h4 className="small">Limits</h4>
          {c.limitations ? <p className="small uncertain">{c.limitations}</p> : null}
          {c.cannotEstablish?.length ? <p className="small uncertain">It cannot establish: {c.cannotEstablish.join(' ')}</p> : null}
        </>
      ) : null}
      {c.avoidTerms?.length ? <p className="xs muted">Subtext keeps these terms out of its findings: {c.avoidTerms.join(', ')}.</p> : null}
      {c.sources.length ? (
        <>
          <h4 className="small">Sources</h4>
          <ul className="xs" style={{ paddingLeft: 18, marginTop: 0 }}>
            {c.sources.map((id) => {
              const s = SOURCE_BY_ID[id];
              if (!s) return null;
              return (
                <li key={id} style={{ marginBottom: 4 }}>
                  {s.citation}{' '}
                  {s.checked ? (
                    <span className="pill pill-positive" title={s.checkNote ?? 'Bibliographic details confirmed during this build.'}>
                      <IconCheck /> Citation confirmed
                    </span>
                  ) : (
                    <span className="pill" title="Bibliographic details not independently confirmed during this build.">
                      Not yet confirmed
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="xs muted">No single published source; see the limits above.</p>
      )}
    </>
  );
}

export function Knowledge() {
  const { citedConcepts } = useCaseUI();
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('');
  const [kind, setKind] = useState('');
  const [onlyCited, setOnlyCited] = useState(false);
  const needle = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      CONCEPTS.filter(
        (c) =>
          (!domain || c.domain === domain) &&
          (!kind || c.kind === kind) &&
          (!onlyCited || citedConcepts.has(c.id)) &&
          (!needle || `${c.title} ${c.definition} ${c.lookFor.join(' ')}`.toLowerCase().includes(needle)),
      ).sort((x, y) => Number(citedConcepts.has(y.id)) - Number(citedConcepts.has(x.id))),
    [domain, kind, onlyCited, needle, citedConcepts],
  );

  return (
    <div className="page">
      <Section
        id="kb-intro"
        title="Knowledge base"
        intro="The ideas Subtext draws on, with what each can and cannot tell you. Research describes patterns across groups of people. It is used here to suggest questions, never to diagnose anyone or decide what they intended."
      >
        <div className="grid-3">
          {KINDS.map((k) => (
            <div key={k} className="panel panel-tight panel-wash">
              <strong className="small">{EVIDENCE_KIND_LABEL[k]}</strong>
              <p className="xs" style={{ margin: '4px 0 0' }}>
                {EVIDENCE_KIND_HELP[k]}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="kb-cards" title="Concepts" intro={`${CONCEPTS.length} cards.${citedConcepts.size ? ` The ${citedConcepts.size} cited in this case are listed first.` : ''} Open a card to see how Subtext uses the idea, what it cannot show, and its sources.`}>
        <div className="filters no-print">
          <div className="field">
            <label htmlFor="kb-q">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch style={{ position: 'absolute', left: 12, top: 13, color: 'var(--ink-3)' }} />
              <input id="kb-q" className="input" style={{ paddingLeft: 38 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="For example: consent, DARVO, repair" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="kb-d">Area</label>
            <select id="kb-d" className="select" value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All areas</option>
              {DOMAINS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="kb-k">Kind of evidence</label>
            <select id="kb-k" className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">All kinds</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {EVIDENCE_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <label className="check small" style={{ minHeight: 44, alignItems: 'center' }}>
              <input type="checkbox" checked={onlyCited} onChange={(e) => setOnlyCited(e.target.checked)} />
              Cited in this case
            </label>
          </div>
        </div>
        <p className="small muted" aria-live="polite">
          Showing {list.length} of {CONCEPTS.length}
        </p>
        <div className="grid-2">
          {list.map((c) => (
            <ConceptCard key={c.id} c={c} cited={citedConcepts.has(c.id)} />
          ))}
        </div>
      </Section>

      <Section id="guardrails" title="Rules Subtext follows" intro="Drawn from the research review. They apply to every analysis.">
        <ul className="measure" style={{ paddingLeft: 20 }}>
          {GUARDRAILS.map((g) => (
            <li key={g.id} style={{ marginBottom: 8 }}>
              {g.rule}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
