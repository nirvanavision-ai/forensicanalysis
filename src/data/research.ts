/**
 * The research pass: concept cards, sources and guardrails gathered and checked in a separate
 * research thread on 2026-11-05 (see scripts/import-research.mjs).
 *
 * Where a research card covers the same idea as an existing card, it is merged into that card
 * (sources, limitations and "look for" cues) instead of being added twice. Where a research
 * source is the same work as an existing entry, the existing entry is upgraded with the DOI and
 * check details, and references are re-pointed to it.
 */
import raw from './research.json';
import type { Concept, EvidenceKind } from './knowledgeBase';
import type { Source } from './sources';

interface RawConcept {
  id: string;
  title: string;
  domain: string;
  kind: string;
  confidence?: string;
  definition: string;
  evidence?: string;
  application: string;
  limitations: string;
  lookFor?: string[];
  contested?: boolean;
  avoidTerms?: string[];
  sources: string[];
}
interface RawSource {
  id: string;
  citation: string;
  doi?: string | null;
  url?: string | null;
  type?: string;
  kind?: string;
  claim?: string;
  cannotEstablish?: string;
  limitations?: string;
  contested?: boolean;
  contestedNote?: string | null;
  checked: boolean;
  checkLevel?: string;
  checkNote?: string;
}
export interface Guardrail {
  id: string;
  rule: string;
  source_ids?: string[];
}

const data = raw as { concepts: RawConcept[]; sources: RawSource[]; guardrails: Guardrail[] };

/** Research source id → existing source id, for works already in the bibliography. */
const SOURCE_ALIAS: Record<string, string> = {
  'grossman-2023': 'grossman2023',
  'freyd-1997': 'freyd1997',
  'smith-freyd-2014': 'smithfreyd2014',
  'harsey-2017': 'harsey2017',
  'harsey-freyd-2020': 'harsey2020',
  'sweet-2019': 'sweet2019',
  'muehlenhard-2016': 'muehlenhard2016',
  'conley-2013': 'conley2013',
  'freedman-fraser-1966': 'freedman1966',
  'cialdini-1978': 'cialdini1978',
  'bandura-1996': 'bandura1996',
  'bandura-1999': 'bandura1999',
  'haidt-2001': 'haidt2001',
};

/** Research card id → existing card id(s) it is merged into. */
const CONCEPT_MERGE: Record<string, string[]> = {
  darvo: ['darvo'],
  gaslighting: ['gaslighting'],
  consent: ['consent'],
  polyvagal: ['polyvagal'],
  'moral-disengagement': ['moral_disengagement'],
  triangulation: ['triangulation'],
  'betrayal-trauma': ['betrayal_trauma'],
  'fawn-appeasement': ['fawning'],
  dissonance: ['cognitive_dissonance'],
  'compliance-sequences': ['foot_in_the_door', 'door_in_the_face', 'low_ball'],
  'intuition-first': ['moral_intuition'],
  mirroring: ['tactical_empathy'],
  'relationship-structure': ['cnm_research'],
  'gender-and-style': ['conversational_style'],
};

/** Research domains mapped onto the app's domain names, with a few cards placed more specifically. */
const DOMAIN_FOR: Record<string, string> = {
  'Brain and body': 'Brain & body (group-level research)',
  'Emotion and repair': 'Emotion & repair',
  'Trust and betrayal': 'Betrayal & defensive responses',
  'Control and consent': 'Consent & boundaries',
  'Influence and reasoning': 'Judgment & bias',
};
const DOMAIN_OVERRIDE: Record<string, string> = {
  'coercive-control': 'Coercive control',
  'tech-coercive-control': 'Coercive control',
  'lie-detection-limits': 'What a transcript cannot show',
  'different-memories': 'What a transcript cannot show',
  'brain-study-limits': 'What a transcript cannot show',
  'persuasion-neuroscience': 'Brain & body (group-level research)',
  'popular-terms': 'Popular terms, used with care',
};

const KINDS: EvidenceKind[] = ['empirical', 'theory', 'clinical', 'practitioner', 'popular', 'logic'];
const asKind = (k: string): EvidenceKind => (KINDS.includes(k as EvidenceKind) ? (k as EvidenceKind) : 'theory');
const snake = (id: string) => id.replace(/-/g, '_');
const srcId = (id: string) => SOURCE_ALIAS[id] ?? snake(id);
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));

export const GUARDRAILS: Guardrail[] = data.guardrails.map((g) => ({ ...g, source_ids: g.source_ids?.map(srcId) }));

/** Merge research sources into the bibliography: upgrade duplicates, append the rest. */
export function mergeResearchSources(base: Source[]): Source[] {
  const out = base.map((s) => ({ ...s }));
  const byId = new Map(out.map((s) => [s.id, s]));
  for (const r of data.sources) {
    const extra: Partial<Source> = {
      doi: r.doi ?? undefined,
      url: r.url ?? undefined,
      studyType: r.type,
      claim: r.claim,
      cannotEstablish: r.cannotEstablish,
      limitations: r.limitations,
      contestedNote: r.contested ? (r.contestedNote ?? 'Contested.') : undefined,
      checkLevel: r.checkLevel,
      checkNote: r.checkNote,
      research: true,
    };
    const existing = byId.get(srcId(r.id));
    if (existing) {
      Object.assign(existing, Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== undefined)));
      existing.checked = existing.checked || r.checked;
      continue;
    }
    const s: Source = { id: srcId(r.id), citation: r.citation, inSuppliedKB: false, checked: r.checked, ...extra };
    out.push(s);
    byId.set(s.id, s);
  }
  return out;
}

/** Merge research cards into the knowledge base: fold overlaps into existing cards, append new ones. */
export function mergeResearchConcepts(base: Concept[]): Concept[] {
  const out = base.map((c) => ({ ...c, lookFor: [...c.lookFor], sources: [...c.sources] }));
  const byId = new Map(out.map((c) => [c.id, c]));
  for (const r of data.concepts) {
    const sources = r.sources.map(srcId);
    const targets = CONCEPT_MERGE[r.id];
    if (targets) {
      for (const t of targets) {
        const c = byId.get(t);
        if (!c) throw new Error(`Research merge target missing: ${t}`);
        c.sources = uniq([...c.sources, ...sources]);
        c.lookFor = uniq([...c.lookFor, ...(r.lookFor ?? [])]);
        if (r.evidence) c.researchNotes = uniq([...(c.researchNotes ?? []), r.evidence]);
        if (r.limitations) c.cannotEstablish = uniq([...(c.cannotEstablish ?? []), r.limitations]);
        if (r.contested) c.contested = true;
        if (r.avoidTerms?.length) c.avoidTerms = uniq([...(c.avoidTerms ?? []), ...r.avoidTerms]);
        if (r.confidence && !c.researchConfidence) c.researchConfidence = r.confidence;
      }
      continue;
    }
    const id = snake(r.id);
    if (byId.has(id)) throw new Error(`Research card id collides with an existing card: ${id}`);
    const c: Concept = {
      id,
      title: r.title,
      domain: DOMAIN_OVERRIDE[r.id] ?? DOMAIN_FOR[r.domain] ?? r.domain,
      kind: asKind(r.kind),
      definition: r.definition,
      application: r.application,
      limitations: '',
      cannotEstablish: r.limitations ? [r.limitations] : undefined,
      lookFor: r.lookFor ?? [],
      sources,
      researchNotes: r.evidence ? [r.evidence] : [],
      researchConfidence: r.confidence,
      contested: r.contested || undefined,
      avoidTerms: r.avoidTerms?.length ? r.avoidTerms : undefined,
    };
    out.push(c);
    byId.set(id, c);
  }
  return out;
}
