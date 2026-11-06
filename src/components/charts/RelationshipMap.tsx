/**
 * Who did what toward whom in this conversation. Present speakers sit on the inner ring;
 * people discussed but not present sit outside it with dashed outlines.
 */
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Analysis } from '../../lib/schema';
import { EDGE_LABEL, type EdgeKind } from '../../lib/taxonomy';
import { PrintCtx, useCaseUI } from '../caseContext';
import { ConfidencePill, Quotes, Speaker, ViewToggle } from '../ui';

type Edge = Analysis['relationship']['edges'][number];
type Tone = 'concern' | 'positive' | 'ask' | 'neutral';
const EDGE_TONE: Record<EdgeKind, Tone> = {
  pressure: 'concern',
  criticism: 'concern',
  acknowledgment: 'positive',
  support: 'positive',
  request: 'ask',
  disclosure: 'ask',
  defense: 'neutral',
  invokes: 'neutral',
};
const COLOR: Record<Tone, string> = {
  concern: 'var(--coral)',
  positive: 'var(--teal)',
  ask: 'var(--lavender-ink)',
  neutral: 'var(--ink-3)',
};
const TONE_TEXT: Record<Tone, string> = {
  ask: 'Requests and disclosures',
  concern: 'Pressure and criticism',
  positive: 'Acknowledgment and support',
  neutral: 'Defending or invoking someone (dashed)',
};

export function RelationshipMap() {
  const { c, speakerColor, openTurn } = useCaseUI();
  // On a phone the table is easier to read than a scaled-down map, so it is the default there.
  const [view, setView] = useState<'chart' | 'table'>(() => (typeof matchMedia === 'function' && matchMedia('(max-width: 640px)').matches ? 'table' : 'chart'));
  const printing = useContext(PrintCtx);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [view]);
  const edges = c.analysis.relationship.edges;
  const present = c.transcript.speakers;

  const nodes = useMemo(() => {
    const absent = new Set<string>();
    for (const p of c.analysis.participants) if (!present.includes(p.label)) absent.add(p.label);
    for (const e of edges) for (const n of [e.from, e.to]) if (!present.includes(n)) absent.add(n);
    const W = 760;
    const H = absent.size ? 520 : 440;
    const cx = W / 2;
    const cy = absent.size ? 220 : H / 2 + 10;
    const pos = new Map<string, { x: number; y: number; present: boolean }>();
    const r1 = present.length <= 2 ? 200 : 165;
    present.forEach((n, i) => {
      const a = present.length === 2 ? (i === 0 ? Math.PI : 0) : -Math.PI / 2 + (i * 2 * Math.PI) / present.length;
      pos.set(n, {
        x: cx + r1 * Math.cos(a),
        y: cy + (present.length === 2 ? -40 : r1 * Math.sin(a)),
        present: true,
      });
    });
    const abs = Array.from(absent);
    abs.forEach((n, i) => {
      const spread = abs.length === 1 ? 0 : (i / (abs.length - 1) - 0.5) * 2;
      pos.set(n, {
        x: cx + spread * Math.min(280, 130 * abs.length),
        y: H - 52,
        present: false,
      });
    });
    return { pos, W, H };
  }, [c.analysis.participants, edges, present]);

  // One curve per direction and tone, so a mixed exchange (pressure and acknowledgment) is not drawn in one colour.
  const grouped = useMemo(() => {
    const m = new Map<string, Edge[]>();
    for (const e of edges) {
      const k = `${e.from}→${e.to}→${EDGE_TONE[e.kind]}`;
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    const lane = new Map<string, number>();
    return Array.from(m.values()).map((group) => {
      const dir = `${group[0].from}→${group[0].to}`;
      const k = lane.get(dir) ?? 0;
      lane.set(dir, k + 1);
      return { group, lane: k };
    });
  }, [edges]);

  if (!edges.length) return <p className="muted">No relationship moves were recorded for this case.</p>;

  const tones = Array.from(new Set(edges.map((e) => EDGE_TONE[e.kind])));

  // Curve geometry, then a greedy label placement: each label tries a few points along its own curve
  // and takes the first one that does not overlap a node or a label already placed.
  type Box = { x1: number; y1: number; x2: number; y2: number };
  const placed: Box[] = Array.from(nodes.pos.values()).map((p) => ({
    x1: p.x - 34,
    y1: p.y - 34,
    x2: p.x + 34,
    y2: p.y + (p.present ? 34 : 54),
  }));
  const hit = (b: Box) => placed.some((o) => b.x1 < o.x2 && b.x2 > o.x1 && b.y1 < o.y2 && b.y2 > o.y1);
  const curves = grouped.flatMap(({ group, lane }) => {
    const a = nodes.pos.get(group[0].from);
    const b = nodes.pos.get(group[0].to);
    if (!a || !b) return [];
    const tone = EDGE_TONE[group[0].kind];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bend = 36 + lane * 40;
    const mx = (a.x + b.x) / 2 + nx * bend;
    const my = (a.y + b.y) / 2 + ny * bend;
    const pad = 34;
    const sx = a.x + (dx / len) * pad;
    const sy = a.y + (dy / len) * pad;
    const ex = b.x - (dx / len) * (pad + 4);
    const ey = b.y - (dy / len) * (pad + 4);
    const label = Array.from(new Set(group.map((e) => EDGE_LABEL[e.kind]))).join(', ');
    const anchor: 'start' | 'end' | 'middle' = nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle';
    const w = label.length * 6.6;
    let lx = 0;
    let ly = 0;
    for (const t of [0.5, 0.38, 0.62, 0.28, 0.72]) {
      const qx = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * ex + nx * 8;
      const qy = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ey + ny * 8;
      const y = anchor === 'middle' ? qy + (ny > 0 ? 12 : -4) : qy + 4;
      const x1 = anchor === 'start' ? qx : anchor === 'end' ? qx - w : qx - w / 2;
      const box = { x1: x1 - 2, y1: y - 13, x2: x1 + w + 2, y2: y + 4 };
      if (t === 0.5) {
        lx = qx;
        ly = y;
      }
      if (!hit(box)) {
        lx = qx;
        ly = y;
        placed.push(box);
        break;
      }
    }
    return [
      {
        key: `${group[0].from}-${group[0].to}-${tone}`,
        tone,
        d: `M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`,
        label,
        anchor,
        lx,
        ly,
        first: group.flatMap((e) => e.evidence)[0],
        aria: `${group[0].from} ${label} ${group[0].to}`,
        title: group.map((e) => `${e.from} ${EDGE_LABEL[e.kind]} ${e.to}: ${e.note}`).join('\n'),
      },
    ];
  });

  return (
    <div>
      <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
        {printing ? null : <ViewToggle value={view} onChange={setView} />}
      </div>
      {view === 'chart' || printing ? (
        <figure className="arc-wrap" style={{ margin: 0 }}>
          <figcaption className="visually-hidden">Relationship map. The same information is available as a table.</figcaption>
          <div className="arc-scroll" ref={scrollRef}>
            <svg className="chart" viewBox={`0 0 ${nodes.W} ${nodes.H}`} role="presentation" style={{ maxHeight: 540, minWidth: 600 }}>
              <defs>
                {(['concern', 'positive', 'ask', 'neutral'] as Tone[]).map((t) => (
                  <marker key={t} id={`arr-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" fill={COLOR[t]} />
                  </marker>
                ))}
              </defs>
              {curves.map((cv) => (
                <g
                  key={cv.key}
                  tabIndex={0}
                  role="button"
                  aria-label={cv.aria}
                  style={{ cursor: cv.first ? 'pointer' : 'default' }}
                  onClick={() => cv.first && openTurn(cv.first.turn, cv.first.quote)}
                  onKeyDown={(ev) => {
                    if ((ev.key === 'Enter' || ev.key === ' ') && cv.first) {
                      ev.preventDefault();
                      openTurn(cv.first.turn, cv.first.quote);
                    }
                  }}
                >
                  <title>{cv.title}</title>
                  <path d={cv.d} fill="none" stroke="transparent" strokeWidth={16} />
                  <path
                    d={cv.d}
                    fill="none"
                    stroke={COLOR[cv.tone]}
                    strokeWidth={2}
                    strokeDasharray={cv.tone === 'neutral' ? '5 5' : undefined}
                    markerEnd={`url(#arr-${cv.tone})`}
                  />
                </g>
              ))}
              {Array.from(nodes.pos.entries()).map(([name, p]) => (
                <g key={name}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={30}
                    fill="var(--surface)"
                    stroke={p.present ? speakerColor(name) : 'var(--ink-3)'}
                    strokeWidth={p.present ? 3 : 2}
                    strokeDasharray={p.present ? undefined : '4 4'}
                  />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fontWeight={700} fontSize={13} style={{ fill: 'var(--ink)' }}>
                    {name.length > 9 ? name.slice(0, 8) + '…' : name}
                  </text>
                  {!p.present ? (
                    <text x={p.x} y={p.y + 48} textAnchor="middle" fontSize={11} style={{ fill: 'var(--ink-3)' }}>
                      not present
                    </text>
                  ) : null}
                </g>
              ))}
              {curves.map((cv) => (
                <text
                  key={`l-${cv.key}`}
                  x={cv.lx}
                  y={cv.ly}
                  textAnchor={cv.anchor}
                  pointerEvents="none"
                  style={{
                    paintOrder: 'stroke',
                    stroke: 'var(--surface)',
                    strokeWidth: 5,
                    strokeLinejoin: 'round',
                    fill: 'var(--ink-2)',
                  }}
                  fontSize={13}
                >
                  {cv.label}
                </text>
              ))}
            </svg>
          </div>
          <ul className="legend" aria-label="Legend">
            {(['ask', 'concern', 'positive', 'neutral'] as Tone[])
              .filter((t) => tones.includes(t))
              .map((t) => (
                <li key={t}>
                  <span
                    className="sw"
                    style={{
                      background: t === 'neutral' ? `repeating-linear-gradient(90deg, ${COLOR[t]} 0 5px, transparent 5px 9px)` : COLOR[t],
                      height: 3,
                      width: 22,
                      borderRadius: 2,
                    }}
                  />
                  {TONE_TEXT[t]}
                </li>
              ))}
            <li className="muted">Dashed circle = discussed but not present</li>
          </ul>
        </figure>
      ) : null}
      {view === 'table' || printing ? (
        <div className="table-wrap">
          <table className="table table-stack">
            <thead>
              <tr>
                <th scope="col">From</th>
                <th scope="col">Move</th>
                <th scope="col">To</th>
                <th scope="col">What happened</th>
                <th scope="col">Support</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((e, i) => (
                <tr key={i}>
                  <td data-label="From" className="stack-inline">
                    <Speaker name={e.from} />
                  </td>
                  <td data-label="Move" className="stack-inline">
                    {EDGE_LABEL[e.kind]}
                  </td>
                  <td data-label="To" className="stack-inline">
                    <Speaker name={e.to} />
                  </td>
                  <td data-label="What happened">
                    {e.note}
                    <Quotes items={e.evidence} />
                  </td>
                  <td data-label="Support">
                    <ConfidencePill level={e.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
