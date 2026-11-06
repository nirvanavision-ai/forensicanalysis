import { describe, expect, it } from 'vitest';
import { coerceToSchema } from '../coerce';
import { AnalysisSchema } from '../schema';
import { COUPLE_ANALYSIS } from '../../data/demos/couple';

describe('coerceToSchema', () => {
  it('leaves a valid analysis unchanged', () => {
    const { value, notes } = coerceToSchema(structuredClone(COUPLE_ANALYSIS), AnalysisSchema);
    expect(notes).toEqual([]);
    expect(value).toEqual(COUPLE_ANALYSIS);
  });

  it('repairs labels, drops unknown items and reports what it removed', () => {
    const a = structuredClone(COUPLE_ANALYSIS) as unknown as Record<string, any>;
    a.findings[0].confidence = 'Strong';
    a.findings[1].concepts = ['repair', 'made_up_concept'];
    a.annotations[0].tag = 'vibes';
    a.original_concern.addressed = 'mostly';
    delete a.unknowns;
    const { value, notes } = coerceToSchema(a, AnalysisSchema);
    const r = AnalysisSchema.safeParse(value);
    expect(r.success).toBe(true);
    const v = r.data!;
    expect(v.findings[0].confidence).toBe('strong');
    expect(v.findings[1].concepts).toEqual(['repair']);
    expect(v.annotations.length).toBe(COUPLE_ANALYSIS.annotations.length - 1);
    expect(v.original_concern.addressed).toBe('unclear');
    expect(v.unknowns).toEqual([]);
    expect(notes.length).toBe(3);
  });
});
