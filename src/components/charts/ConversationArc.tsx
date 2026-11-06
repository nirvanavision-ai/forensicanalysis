/**
 * The conversation arc: every turn in order, one lane per speaker, bar height = word count.
 * Above it, the moments the analysis marked (requests, boundaries, pressure, repair...).
 * Below it, the topics. Click any turn or marker to read it in context.
 */
import { useMemo, useRef, useState } from 'react';
import { TIMELINE_LABEL, type TimelineKind } from '../../lib/taxonomy';
import { useCaseUI } from '../caseContext';

type Tone = 'concern' | 'positive' | 'ask' | 'neutral';
const TONE: Record<TimelineKind, Tone> = {
  disclosure: 'ask',
  request: 'ask',
  boundary: 'ask',
  response: 'neutral',
  clarification: 'neutral',
  topic_change: 'neutral',
  acknowledgment: 'positive',
  denial: 'concern',
  pressure: 'concern',
  escalation: 'concern',
  de_escalation: 'positive',
  repair: 'positive',
  agreement: 'positive',
  withdrawal: 'neutral',
};
const TONE_LABEL: Record<Tone, string> = {
  ask: 'Request, boundary or disclosure',
  concern: 'Pressure, denial or escalation',
  positive: 'Acknowledgment, repair or agreement',
  neutral: 'Other turning point',
};
const TONE_COLOR: Record<Tone, string> = {
  ask: 'var(--lavender-ink)',
  concern: 'var(--coral)',
  positive: 'var(--teal)',
  neutral: 'var(--ink-3)',
};

function Marker({ tone, x, y }: { tone: Tone; x: number; y: number }) {
  const fill = TONE_COLOR[tone];
  if (tone === 'concern') return <path d={`M${x} ${y - 7} L${x + 7} ${y + 5} L${x - 7} ${y + 5} Z`} fill={fill} />;
  if (tone === 'positive') return <circle cx={x} cy={y} r={6} fill={fill} />;
  if (tone === 'ask') return <rect x={x - 5.5} y={y - 5.5} width={11} height={11} rx={2} fill={fill} />;
  return <circle cx={x} cy={y} r={3.5} fill={fill} />;
}

export function ConversationArc({ height }: { height?: number }) {
  const { c, speakerColor, openTurn } = useCaseUI();
  const turns = c.transcript.turns;
  const speakers = c.transcript.speakers;
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const step = turns.length > 120 ? 9 : turns.length > 60 ? 14 : 24;
  const left = 96;
  const laneH = 40;
  const eventsH = 34;
  const rowH = 30;
  const width = Math.max(560, left + turns.length * step + 16);
  const lanesTop = eventsH + 8;
  const maxWords = Math.max(1, ...turns.map((t) => t.wordCount));
  const idx = useMemo(() => new Map(turns.map((t, i) => [t.id, i])), [turns]);
  const xOf = (i: number) => left + i * step + step / 2;

  // Topic brackets are packed into rows so that neither brackets nor labels overlap.
  const topicRows = useMemo(() => {
    const charW = 6.2;
    const items = c.analysis.topics
      .map((tp) => {
        const is = tp.turns.map((id) => idx.get(id)).filter((v): v is number => v !== undefined);
        if (!is.length) return null;
        const x1 = left + Math.min(...is) * step + 2;
        const x2 = left + (Math.max(...is) + 1) * step - 2;
        const text = tp.label.length > 34 ? tp.label.slice(0, 33).trimEnd() + '…' : tp.label;
        const lw = text.length * charW;
        const lx = Math.min(Math.max((x1 + x2) / 2, left + lw / 2), width - 8 - lw / 2);
        return {
          id: tp.id,
          full: tp.label,
          text,
          x1,
          x2,
          lx,
          from: Math.min(x1, lx - lw / 2),
          to: Math.max(x2, lx + lw / 2),
          row: 0,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((p, q) => p.from - q.from);
    const ends: number[] = [];
    for (const it of items) {
      let r = ends.findIndex((end) => end + 10 <= it.from);
      if (r < 0) {
        r = ends.length;
        ends.push(0);
      }
      ends[r] = it.to;
      it.row = r;
    }
    return { items, rows: ends.length };
  }, [c.analysis.topics, idx, step, width]);

  const topicsTop = lanesTop + speakers.length * laneH + 8;
  const svgH = height ?? topicsTop + topicRows.rows * rowH + 8;

  const events = c.analysis.timeline.filter((e) => idx.has(e.turn));
  const show = (evt: React.MouseEvent | React.FocusEvent, text: string) => {
    const box = wrapRef.current?.getBoundingClientRect();
    const r = (evt.currentTarget as Element).getBoundingClientRect();
    if (!box) return;
    setTip({
      x: Math.min(r.left - box.left + r.width / 2, box.width - 150),
      y: r.top - box.top,
      text,
    });
  };

  const tonesPresent = Array.from(new Set(events.map((e) => TONE[e.kind])));

  return (
    <figure className="arc-wrap" style={{ margin: 0 }} ref={wrapRef}>
      <figcaption className="visually-hidden">
        Conversation arc: {turns.length} turns by {speakers.join(', ')}. Bar height shows each turn’s word count. Markers show moments the analysis noted.
      </figcaption>
      <div className="arc-scroll" onScroll={() => setTip(null)}>
        <svg className="chart" width={width} height={svgH} viewBox={`0 0 ${width} ${svgH}`} role="presentation" style={{ minWidth: width }} onMouseLeave={() => setTip(null)}>
          {/* event track */}
          <text x={0} y={eventsH / 2 + 4} fontWeight={700}>
            Moments
          </text>
          <line className="grid" x1={left} x2={width - 8} y1={eventsH / 2} y2={eventsH / 2} />
          {events.map((e, k) => {
            const i = idx.get(e.turn)!;
            const tone = TONE[e.kind];
            const label = `${e.turn}: ${TIMELINE_LABEL[e.kind]}. ${e.label}`;
            return (
              <g
                key={k}
                tabIndex={0}
                role="button"
                aria-label={label}
                style={{ cursor: 'pointer', outline: 'none' }}
                onClick={() => openTurn(e.turn)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    openTurn(e.turn);
                  }
                }}
                onMouseEnter={(ev) => show(ev, label)}
                onFocus={(ev) => show(ev, label)}
                onBlur={() => setTip(null)}
              >
                <rect x={xOf(i) - 11} y={eventsH / 2 - 12} width={22} height={24} fill="transparent" />
                <circle cx={xOf(i)} cy={eventsH / 2} r={9} fill="var(--surface)" />
                <Marker tone={tone} x={xOf(i)} y={eventsH / 2} />
              </g>
            );
          })}
          {/* speaker lanes */}
          {speakers.map((s, li) => {
            const y0 = lanesTop + li * laneH;
            return (
              <g key={s}>
                <text x={0} y={y0 + laneH / 2 + 4} fontWeight={700}>
                  {s.length > 12 ? s.slice(0, 11) + '…' : s}
                </text>
                <line className="grid" x1={left} x2={width - 8} y1={y0 + laneH - 4} y2={y0 + laneH - 4} />
              </g>
            );
          })}
          {turns.map((t, i) => {
            const li = Math.max(0, speakers.indexOf(t.speaker));
            const y0 = lanesTop + li * laneH;
            const h = Math.max(4, Math.round((t.wordCount / maxWords) * (laneH - 10)));
            const w = Math.max(3, step - 6);
            const label = `${t.id}${t.timestamp ? ` at ${t.timestamp}` : ''}, ${t.speaker}, ${t.wordCount} words: ${t.text.slice(0, 110)}${t.text.length > 110 ? '…' : ''}`;
            return (
              <g key={t.id} style={{ cursor: 'pointer' }} onClick={() => openTurn(t.id)} onMouseEnter={(ev) => show(ev, label)}>
                <rect x={xOf(i) - step / 2} y={y0} width={step} height={laneH} fill="transparent" />
                <rect x={xOf(i) - w / 2} y={y0 + laneH - 4 - h} width={w} height={h} rx={Math.min(3, w / 2)} fill={speakerColor(t.speaker)} />
              </g>
            );
          })}
          {/* topics */}
          {topicRows.rows ? (
            <text x={0} y={topicsTop + 20} fontWeight={700}>
              Topics
            </text>
          ) : null}
          {topicRows.items.map((it) => {
            const y = topicsTop + it.row * rowH;
            return (
              <g key={it.id}>
                <title>{it.full}</title>
                <path d={`M${it.x1} ${y} v6 H${it.x2} v-6`} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} />
                <text x={it.lx} y={y + 20} textAnchor="middle" fontSize={11} style={{ fill: 'var(--ink-3)' }}>
                  {it.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {tip ? (
        <div
          className="arc-tooltip"
          style={{
            left: Math.max(4, tip.x - 140),
            top: Math.max(0, tip.y - 8),
            transform: 'translateY(-100%)',
          }}
        >
          {tip.text}
        </div>
      ) : null}
      <ul className="legend" aria-label="Legend">
        {speakers.map((s) => (
          <li key={s}>
            <span className="sw" style={{ background: speakerColor(s) }} />
            {s}
          </li>
        ))}
        <li className="muted">Bar height = word count, not speaking time</li>
      </ul>
      {tonesPresent.length ? (
        <ul className="legend" aria-label="Marker legend">
          {(['ask', 'concern', 'positive', 'neutral'] as Tone[])
            .filter((t) => tonesPresent.includes(t))
            .map((t) => (
              <li key={t}>
                <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
                  <Marker tone={t} x={0} y={0} />
                </svg>
                {TONE_LABEL[t]}
              </li>
            ))}
        </ul>
      ) : null}
    </figure>
  );
}
