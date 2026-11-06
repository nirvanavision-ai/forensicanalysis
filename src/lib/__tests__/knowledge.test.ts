import { describe, expect, it } from 'vitest';
import { CONCEPTS, CONCEPT_BY_ID } from '../../data/knowledgeBase';
import { SOURCES, SOURCE_BY_ID } from '../../data/sources';
import { GUARDRAILS } from '../../data/research';

describe('knowledge base', () => {
  it('has unique concept and source ids', () => {
    expect(new Set(CONCEPTS.map((c) => c.id)).size).toBe(CONCEPTS.length);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
  });

  it('every concept cites at least one source, and every cited source exists', () => {
    for (const c of CONCEPTS) {
      for (const s of c.sources) expect(SOURCE_BY_ID[s], `${c.id} → ${s}`).toBeTruthy();
    }
    // agreements_layers is this app's own organising tool and says so on the card.
    const unsourced = CONCEPTS.filter((c) => c.sources.length === 0).map((c) => c.id);
    expect(unsourced).toEqual(['agreements_layers']);
  });

  it('merges research overlaps instead of duplicating cards', () => {
    expect(CONCEPT_BY_ID.darvo.sources).toContain('harsey2017');
    expect(CONCEPT_BY_ID.darvo.cannotEstablish?.length).toBeGreaterThan(0);
    expect(CONCEPT_BY_ID['moral-disengagement']).toBeUndefined();
    expect(CONCEPT_BY_ID.moral_disengagement.sources).toContain('zakharova_2025');
    expect(CONCEPT_BY_ID.brain_study_limits).toBeTruthy();
    expect(CONCEPT_BY_ID.coercive_control?.domain).toBe('Coercive control');
  });

  it('only marks a source checked when it has a check record or was checked during the build', () => {
    const researchChecked = SOURCES.filter((s) => s.research && s.checked);
    for (const s of researchChecked) expect(s.checkLevel, s.id).toMatch(/crossref|publisher-page|index-match|secondary-report/);
  });

  it('guardrails reference real sources', () => {
    expect(GUARDRAILS.length).toBeGreaterThan(5);
    for (const g of GUARDRAILS) for (const s of g.source_ids ?? []) expect(SOURCE_BY_ID[s], `${g.id} → ${s}`).toBeTruthy();
  });
});
