import { describe, expect, it } from 'vitest';
import { DEMOS, demoCase } from '../../data/demos';
import { AnalysisSchema } from '../schema';
import { CaseFileSchema } from '../case';
import { checkQuote, collectEvidence, integrityReport, isVerified } from '../verify';
import { CONCEPT_BY_ID } from '../../data/knowledgeBase';

describe.each(DEMOS.map((d) => [d.key, d] as const))('demo %s', (_key, d) => {
  const c = demoCase(d.key);

  it('parses into labelled turns with no unattributed lines', () => {
    expect(c.transcript.turns.length).toBeGreaterThan(10);
    expect(c.transcript.turns.every((t) => t.speaker !== 'Unattributed')).toBe(true);
  });

  it('matches the analysis schema and the case-file schema', () => {
    expect(AnalysisSchema.safeParse(d.analysis).success).toBe(true);
    const r = CaseFileSchema.safeParse(JSON.parse(JSON.stringify(c)));
    if (!r.success) console.error(r.error.issues.slice(0, 3));
    expect(r.success).toBe(true);
  });

  it('every quoted passage is found verbatim in the cited turn', () => {
    const bad = collectEvidence(d.analysis)
      .map(({ path, evidence }) => ({ path, evidence, check: checkQuote(c.transcript, evidence) }))
      .filter((x) => !isVerified(x.check));
    if (bad.length) console.error(bad.slice(0, 10));
    expect(bad).toEqual([]);
    const rep = integrityReport(c.transcript, d.analysis);
    expect(rep.problems).toEqual([]);
  });

  it('cites only concepts that exist in the knowledge base', () => {
    const json = JSON.stringify(d.analysis);
    const ids = [...json.matchAll(/"concepts?":(\[[^\]]*\]|"[^"]*")/g)].flatMap((m) => {
      const v = JSON.parse(m[1]);
      return Array.isArray(v) ? v : [v];
    });
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(CONCEPT_BY_ID[id], id).toBeTruthy();
  });

  it('every referenced turn id exists', () => {
    const ids = new Set(c.transcript.turns.map((t) => t.id));
    const json = JSON.stringify(d.analysis);
    for (const m of json.matchAll(/"turn":"(T\d+)"/g)) expect(ids.has(m[1]), m[1]).toBe(true);
    for (const m of json.matchAll(/"(?:turns|response_turns)":\[([^\]]*)\]/g)) {
      for (const id of m[1].match(/T\d+/g) ?? []) expect(ids.has(id), id).toBe(true);
    }
  });
});
