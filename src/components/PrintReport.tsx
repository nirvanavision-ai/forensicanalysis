/**
 * The printed report: every tab's substance in order, then the complete transcript.
 * Rendered only while printing, so the screen view stays light.
 */
import { CONCEPT_BY_ID } from '../data/knowledgeBase';
import { PrintCtx, useCaseUI } from './caseContext';
import { Arguments, Boundaries, Contradictions, Decoder, Explanations, Mechanisms, Reasoning, Relationships, Requests } from './tabs/Audit';
import { Briefing } from './tabs/Briefing';
import { TURN_FLAG_LABEL } from './tabs/Inspector';
import { ConceptCard } from './tabs/Knowledge';
import { Playbook } from './tabs/Playbook';

export function PrintReport() {
  const { c, citedConcepts } = useCaseUI();
  const a = c.analysis;
  const full = c.engine.kind !== 'keyword';
  return (
    <PrintCtx.Provider value={true}>
      <div className="print-only print-report">
        <header style={{ padding: '0 0 8pt', borderBottom: '1px solid #ccc', marginBottom: 12 }}>
          <p className="small" style={{ margin: 0 }}>
            Subtext: interpersonal analysis and strategy
          </p>
          <h1 style={{ margin: '4px 0' }}>{c.title}</h1>
          <p className="small" style={{ margin: 0 }}>
            {c.fictional ? 'Fictional example. ' : ''}
            {c.engine.note} Printed {new Date().toLocaleString()}. Educational analysis of communication, not a diagnosis or legal finding.
          </p>
        </header>
        <h2>1. Executive briefing</h2>
        <Briefing />
        {full ? (
          <div className="print-chapter">
            <h2>2. Logic and mechanism audit</h2>
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
        ) : null}
        <div className="print-chapter">
          <h2>3. Response playbook and sources</h2>
          <Playbook />
        </div>
        {citedConcepts.size ? (
          <div className="print-chapter">
            <h2>4. Knowledge base: concepts cited in this case</h2>
            <p className="small">Each concept’s definition, limits and sources. The app’s Knowledge base tab has the full cards.</p>
            {Array.from(citedConcepts)
              .map((id) => CONCEPT_BY_ID[id])
              .filter(Boolean)
              .map((k) => (
                <div key={k.id} className="print-concept">
                  <ConceptCard c={k} compact brief />
                </div>
              ))}
          </div>
        ) : null}
        <div className="print-chapter">
          <h2>5. Full transcript</h2>
          {c.aliasDisclosures.length ? <p className="small">{c.aliasDisclosures.join(' ')}</p> : null}
          <table className="table">
            <thead>
              <tr>
                <th>Turn</th>
                <th>Time</th>
                <th>Speaker</th>
                <th>What was said</th>
              </tr>
            </thead>
            <tbody>
              {c.transcript.turns.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.timestamp ?? ''}</td>
                  <td>
                    <strong>{t.speaker}</strong>
                    {t.flags.filter((f) => f !== 'annotation').length ? (
                      <div className="xs">{t.flags.filter((f) => f !== 'annotation').map((f) => TURN_FLAG_LABEL[f]).join(', ')}</div>
                    ) : null}
                  </td>
                  <td className="source">{t.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PrintCtx.Provider>
  );
}
