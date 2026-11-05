import type { ReactNode } from 'react';

/** Find where quoted segments occur in a turn (case-insensitive), so they can be marked. */
export function findRanges(text: string, quotes: string[]): [number, number][] {
  const lower = text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const ranges: [number, number][] = [];
  for (const q of quotes) {
    const segs = q
      .split(/\s*(?:\.\.\.|…)\s*/)
      .map((s) => s.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"'))
      .filter((s) => s.length > 1);
    let from = 0;
    for (const s of segs) {
      const i = lower.indexOf(s, from);
      if (i < 0) break;
      ranges.push([i, i + s.length]);
      from = i + s.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

/** Render text with marked ranges. React escapes the text; nothing is injected as HTML. */
export function Highlighted({ text, quotes }: { text: string; quotes: string[] }): ReactNode {
  const ranges = findRanges(text, quotes);
  if (!ranges.length) return text;
  const out: ReactNode[] = [];
  let at = 0;
  ranges.forEach(([a, b], i) => {
    if (a > at) out.push(text.slice(at, a));
    out.push(
      <mark className="hl" key={i}>
        {text.slice(a, b)}
      </mark>,
    );
    at = b;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}
