/**
 * The two built-in demonstrations. Both are FICTIONAL and are labelled as such everywhere
 * they appear. No real person's material is bundled with the app.
 */
import { newId, type CaseContext, type CaseFile } from '../../lib/case';
import { parseTranscript } from '../../lib/parser';
import { keywordScan } from '../../lib/lexical';
import type { Analysis } from '../../lib/schema';
import { COUPLE_ANALYSIS, COUPLE_CONTEXT, COUPLE_TITLE, COUPLE_TRANSCRIPT } from './couple';
import { THROUPLE_ANALYSIS, THROUPLE_CONTEXT, THROUPLE_TITLE, THROUPLE_TRANSCRIPT } from './throuple';

export interface DemoDef {
  key: 'throuple' | 'couple';
  title: string;
  blurb: string;
  raw: string;
  context: CaseContext;
  analysis: Analysis;
}

export const DEMOS: DemoDef[] = [
  {
    key: 'throuple',
    title: THROUPLE_TITLE,
    blurb: 'A triad talks about a night when one partner’s no was asked about again. Boundaries, a partner speaking for another, and an agreement made before one of them joined.',
    raw: THROUPLE_TRANSCRIPT,
    context: THROUPLE_CONTEXT,
    analysis: THROUPLE_ANALYSIS,
  },
  {
    key: 'couple',
    title: COUPLE_TITLE,
    blurb: 'A couple texts after one shared the other’s health news with friends. What a real repair looks like, and why it still leaves room for hurt.',
    raw: COUPLE_TRANSCRIPT,
    context: COUPLE_CONTEXT,
    analysis: COUPLE_ANALYSIS,
  },
];

export function demoCase(key: DemoDef['key']): CaseFile {
  const d = DEMOS.find((x) => x.key === key)!;
  const transcript = parseTranscript(d.raw);
  return {
    app: 'subtext',
    version: 1,
    id: newId(),
    title: d.title,
    createdAt: new Date().toISOString(),
    fictional: true,
    engine: { kind: 'demo', model: 'Prepared example', note: 'Fictional case with a hand-written analysis, included to show how Subtext works.' },
    transcript,
    aliasDisclosures: [],
    context: d.context,
    analysis: d.analysis,
    keywordCues: keywordScan(transcript),
  };
}
