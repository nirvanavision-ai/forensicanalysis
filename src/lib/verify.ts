/**
 * Evidence integrity: every quotation an analysis cites is checked against the parsed transcript.
 *
 *  - exact:          the quote appears in the cited turn (whitespace differences only)
 *  - normalized:     it appears after normalising case, curly quotes, dashes and ellipses
 *  - other_turn:     the words exist, but in a different turn than the one cited
 *  - not_found:      the words do not appear in the transcript
 *  - invalid_turn:   the cited turn id does not exist
 *  - whole_turn:     no quote given; the whole turn is cited
 */
import type { Analysis, Evidence } from './schema';
import type { Transcript, Turn } from './parser';

export type QuoteStatus = 'exact' | 'normalized' | 'other_turn' | 'not_found' | 'invalid_turn' | 'whole_turn';

export interface QuoteCheck {
  status: QuoteStatus;
  /** For other_turn: where the words were actually found. */
  foundIn?: string;
}

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  exact: 'Quote verified',
  normalized: 'Quote verified (punctuation or capitalisation differs)',
  other_turn: 'Words found in a different turn',
  not_found: 'Quote not found in transcript',
  invalid_turn: 'Cited turn does not exist',
  whole_turn: 'Whole turn cited',
};

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();

export function normalise(s: string): string {
  return collapse(
    s
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[‘’‚‛′`]/g, "'")
      .replace(/[“”„‟″]/g, '"')
      .replace(/[–—―‐-]/g, '-')
      .replace(/…/g, '...')
      .replace(/[^\p{L}\p{N}' ]+/gu, ' '),
  );
}

function segments(quote: string): string[] {
  return quote
    .split(/\s*(?:\.\.\.|…|\[\.\.\.\]|\[…\])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function containsInOrder(haystack: string, parts: string[]): boolean {
  let from = 0;
  for (const p of parts) {
    const i = haystack.indexOf(p, from);
    if (i < 0) return false;
    from = i + p.length;
  }
  return true;
}

function matchTurn(turn: Turn, quote: string): 'exact' | 'normalized' | null {
  const parts = segments(quote);
  if (parts.length === 0) return 'exact';
  if (containsInOrder(collapse(turn.text), parts.map(collapse))) return 'exact';
  const nParts = parts.map(normalise).filter(Boolean);
  if (nParts.length && containsInOrder(normalise(turn.text), nParts)) return 'normalized';
  return null;
}

export function checkQuote(t: Transcript, ev: Evidence): QuoteCheck {
  const turn = t.turns.find((x) => x.id === ev.turn);
  if (!turn) {
    // The model might cite a valid quote with a malformed id.
    if (ev.quote.trim()) {
      const other = t.turns.find((x) => matchTurn(x, ev.quote));
      if (other) return { status: 'other_turn', foundIn: other.id };
    }
    return { status: 'invalid_turn' };
  }
  if (!ev.quote.trim()) return { status: 'whole_turn' };
  const m = matchTurn(turn, ev.quote);
  if (m) return { status: m };
  const other = t.turns.find((x) => x.id !== turn.id && matchTurn(x, ev.quote));
  if (other) return { status: 'other_turn', foundIn: other.id };
  return { status: 'not_found' };
}

export function isVerified(c: QuoteCheck) {
  return c.status === 'exact' || c.status === 'normalized' || c.status === 'whole_turn';
}

export interface IntegrityReport {
  total: number;
  exact: number;
  normalized: number;
  wholeTurn: number;
  otherTurn: number;
  notFound: number;
  invalidTurn: number;
  problems: { path: string; evidence: Evidence; check: QuoteCheck }[];
}

/** Walk every evidence reference in an analysis (including annotation and reasoning-issue quotes). */
export function collectEvidence(a: Analysis): { path: string; evidence: Evidence }[] {
  const out: { path: string; evidence: Evidence }[] = [];
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((n, i) => walk(n, `${path}[${i}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    // Evidence objects
    if (typeof o.turn === 'string' && typeof o.quote === 'string' && Object.keys(o).length === 2) {
      out.push({ path, evidence: { turn: o.turn, quote: o.quote } });
      return;
    }
    // Annotations and reasoning issues carry turn + quote alongside other fields
    if (typeof o.turn === 'string' && typeof o.quote === 'string') {
      out.push({ path, evidence: { turn: o.turn, quote: o.quote } });
    }
    for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(a, '');
  return out;
}

export function integrityReport(t: Transcript, a: Analysis): IntegrityReport {
  const r: IntegrityReport = { total: 0, exact: 0, normalized: 0, wholeTurn: 0, otherTurn: 0, notFound: 0, invalidTurn: 0, problems: [] };
  for (const { path, evidence } of collectEvidence(a)) {
    const c = checkQuote(t, evidence);
    r.total++;
    if (c.status === 'exact') r.exact++;
    else if (c.status === 'normalized') r.normalized++;
    else if (c.status === 'whole_turn') r.wholeTurn++;
    else if (c.status === 'other_turn') r.otherTurn++;
    else if (c.status === 'not_found') r.notFound++;
    else r.invalidTurn++;
    if (!isVerified(c)) r.problems.push({ path, evidence, check: c });
  }
  return r;
}

/** Turn ids referenced anywhere in the analysis, for "has analysis" markers in the transcript. */
export function referencedTurns(a: Analysis): Set<string> {
  const s = new Set<string>();
  for (const { evidence } of collectEvidence(a)) s.add(evidence.turn);
  for (const r of a.requests) r.response_turns.forEach((x) => s.add(x));
  for (const t of a.timeline) s.add(t.turn);
  return s;
}
