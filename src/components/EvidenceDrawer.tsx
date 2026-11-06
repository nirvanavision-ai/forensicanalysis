import { useEffect, useRef } from 'react';
import { CONCEPT_BY_ID } from '../data/knowledgeBase';
import { DECODER_MOVE_LABEL, TAG_LABEL } from '../lib/taxonomy';
import { isVerified, QUOTE_STATUS_LABEL } from '../lib/verify';
import { useCaseUI } from './caseContext';
import { Highlighted } from './highlight';
import { IconAlert, IconCheck, IconClose } from './icons';
import { ConceptCard } from './tabs/Knowledge';
import { TURN_FLAG_LABEL } from './tabs/Inspector';
import { ConceptLinks, ConfidencePill, Speaker } from './ui';

export type DrawerTarget = { type: 'turn'; turn: string; quote?: string } | { type: 'concept'; id: string };

export function EvidenceDrawer({ target, onClose }: { target: DrawerTarget; onClose: () => void }) {
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headRef.current?.focus();
  }, [target]);
  return (
    <aside className="drawer" aria-labelledby="drawer-h" role="complementary">
      <div className="drawer-head">
        <h2 id="drawer-h" ref={headRef} tabIndex={-1} style={{ outline: 'none' }}>
          {target.type === 'turn' ? `${target.turn} in context` : 'Concept'}
        </h2>
        <button type="button" className="btn btn-quiet btn-small" onClick={onClose} aria-label="Close panel">
          <IconClose />
        </button>
      </div>
      {target.type === 'turn' ? <TurnDetail turn={target.turn} quote={target.quote} /> : <ConceptDetail id={target.id} />}
    </aside>
  );
}

function TurnDetail({ turn, quote }: { turn: string; quote?: string }) {
  const { c, check, goTo } = useCaseUI();
  const turns = c.transcript.turns;
  const i = turns.findIndex((t) => t.id === turn);
  if (i < 0) {
    return (
      <div className="notice notice-error">
        <IconAlert /> The analysis cites {turn}, which is not in this transcript.
        {quote ? <span className="source"> “{quote}”</span> : null}
      </div>
    );
  }
  const status = quote ? check({ turn, quote }) : null;
  const annotations = c.analysis.annotations.filter((a) => a.turn === turn);
  const decoded = c.analysis.decoder.filter((d) => d.turn === turn);
  const cues = c.keywordCues.filter((k) => k.turn === turn);
  const ctx = turns.slice(Math.max(0, i - 2), i + 3);

  return (
    <div>
      {status ? (
        <p className="xs" style={{ margin: '0 0 8px', color: isVerified(status) ? 'var(--teal-ink)' : 'var(--coral-ink)', fontWeight: 700 }}>
          {isVerified(status) ? <IconCheck style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> : <IconAlert style={{ width: 14, height: 14, verticalAlign: '-2px' }} />}{' '}
          {QUOTE_STATUS_LABEL[status.status]}
          {status.foundIn ? ` (found in ${status.foundIn})` : ''}
        </p>
      ) : null}
      <div aria-label="Surrounding turns">
        {ctx.map((t) => (
          <div key={t.id} className={`ctx-turn ${t.id === turn ? 'focus' : 'dim'}`}>
            <div className="row" style={{ gap: 8 }}>
              <span className="xs muted" style={{ fontWeight: 700 }}>
                {t.id}
                {t.timestamp ? ` · ${t.timestamp}` : ''}
              </span>
              <Speaker name={t.speaker} size="sm" />
            </div>
            <p className="source" style={{ margin: '4px 0 0' }}>
              {t.id === turn ? <Highlighted text={t.text} quotes={quote ? [quote] : annotations.map((a) => a.quote)} /> : t.text}
            </p>
            {t.id === turn && t.flags.filter((f) => f !== 'annotation').length ? (
              <div className="turn-tags">
                {t.flags
                  .filter((f) => f !== 'annotation')
                  .map((f) => (
                    <span key={f} className="flag-chip">
                      {TURN_FLAG_LABEL[f]}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-small" style={{ marginTop: 10 }} onClick={() => goTo('transcript', `turn-${turn}`)}>
        Show in the full transcript
      </button>

      {decoded.map((d, k) => (
        <section key={`d${k}`} className="item" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="pill pill-concern">Decoder: {DECODER_MOVE_LABEL[d.move]}</span>
            <ConfidencePill level={d.confidence} />
          </div>
          <p className="said small">“{d.quote}”</p>
          <p className="small">{d.what_it_does}</p>
          <p className="small">
            <span className="muted">Leaves unanswered: </span>
            {d.what_it_leaves_unanswered}
          </p>
          <p className="small uncertain" style={{ textDecoration: 'none' }}>
            Fairest reading: {d.fairer_reading}
          </p>
        </section>
      ))}

      {annotations.length ? (
        <h3 style={{ fontSize: 'var(--t-md)', marginTop: 20 }}>What the analysis notes here</h3>
      ) : null}
      {annotations.map((a, k) => (
        <section key={k} className="item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="tag">{TAG_LABEL[a.tag]}</span>
            <ConfidencePill level={a.confidence} />
          </div>
          {a.quote ? <p className="said small">“{a.quote}”</p> : null}
          <dl className="kv small">
            <dt>Observed</dt>
            <dd>{a.observation}</dd>
            {a.mechanism ? (
              <>
                <dt>Possible mechanism</dt>
                <dd>{a.mechanism}</dd>
              </>
            ) : null}
            {a.interpretation ? (
              <>
                <dt>Reading</dt>
                <dd>{a.interpretation}</dd>
              </>
            ) : null}
            {a.alternative ? (
              <>
                <dt>Another reading</dt>
                <dd>{a.alternative}</dd>
              </>
            ) : null}
            {a.limitation ? (
              <>
                <dt>Cannot show</dt>
                <dd className="uncertain" style={{ textDecoration: 'none' }}>
                  {a.limitation}
                </dd>
              </>
            ) : null}
          </dl>
          <div style={{ marginTop: 8 }}>
            <ConceptLinks ids={a.concepts} />
          </div>
        </section>
      ))}
      {cues.length ? (
        <section className="item">
          <h3 style={{ fontSize: 'var(--t-md)' }}>Keyword cues</h3>
          <p className="xs muted">Phrases that often accompany these moves. A cue is a pointer, not a finding.</p>
          {cues.map((k, j) => (
            <p key={j} className="small" style={{ margin: '4px 0' }}>
              <span className="tag tag-cue">{TAG_LABEL[k.tag]}</span> “{k.match}”
            </p>
          ))}
        </section>
      ) : null}
      {!annotations.length && !decoded.length && !cues.length ? (
        <p className="small muted" style={{ marginTop: 16 }}>
          The analysis makes no specific notes on this turn.
        </p>
      ) : null}
    </div>
  );
}

function ConceptDetail({ id }: { id: string }) {
  const { c, openTurn } = useCaseUI();
  const concept = CONCEPT_BY_ID[id];
  if (!concept) return <p className="muted">This concept is not in the knowledge base.</p>;
  const uses: { turn: string; quote: string; where: string }[] = [];
  for (const a of c.analysis.annotations) if (a.concepts.includes(id)) uses.push({ turn: a.turn, quote: a.quote, where: TAG_LABEL[a.tag] });
  for (const d of c.analysis.decoder) if (d.concepts.includes(id)) uses.push({ turn: d.turn, quote: d.quote, where: 'Decoder' });
  for (const r of c.analysis.reasoning_issues) if (r.concept === id) uses.push({ turn: r.turn, quote: r.quote, where: 'Reasoning problem' });
  for (const m of c.analysis.mechanisms) if (m.concept === id) for (const e of m.evidence) uses.push({ turn: e.turn, quote: e.quote, where: 'Mechanism' });
  return (
    <div>
      <ConceptCard c={concept} compact />
      {uses.length ? (
        <>
          <h3 style={{ fontSize: 'var(--t-md)', marginTop: 16 }}>Where this case uses it</h3>
          {uses.map((u, i) => (
            <button key={i} type="button" className="quote-btn" onClick={() => openTurn(u.turn, u.quote)}>
              <span className="q">{u.quote ? `“${u.quote}”` : 'Whole turn'}</span>
              <span className="tid">
                {u.turn} · {u.where}
              </span>
            </button>
          ))}
        </>
      ) : null}
    </div>
  );
}
