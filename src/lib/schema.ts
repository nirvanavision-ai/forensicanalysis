/**
 * The analysis contract.
 *
 * One zod schema drives three things:
 *  1. the JSON schema sent to Claude as a structured-output format (so every analysis has the same shape),
 *  2. runtime validation of model output and of saved analysis files,
 *  3. the TypeScript types the UI renders.
 *
 * Every field is required (empty strings / arrays stand in for "nothing to report"),
 * which keeps the schema simple for structured outputs and the UI free of undefined checks.
 */
import * as z from 'zod/v4';
import { CONCEPT_IDS } from '../data/knowledgeBase';
import {
  AGREEMENT_SCOPES,
  AGREEMENT_STATUS,
  APPROACHES,
  ARG_ASSESSMENTS,
  BASIS,
  CLAIM_TYPES,
  CONFIDENCE,
  CORE_QUESTION_IDS,
  DECODER_MOVES,
  EDGE_KINDS,
  FLAG_KINDS,
  GOAL_IDS,
  OUTCOMES,
  REQUEST_KINDS,
  TAG_IDS,
  TIMELINE_KINDS,
  TRIAD_CHECK_IDS,
  TRIAD_STATUS,
} from './taxonomy';

const ConceptId = z.enum(CONCEPT_IDS);
const Confidence = z.enum(CONFIDENCE);

export const EvidenceSchema = z.object({
  turn: z.string().describe('Turn id exactly as given in the transcript, e.g. "T12".'),
  quote: z
    .string()
    .describe('Exact words copied from that turn (a contiguous excerpt; use " … " between excerpts from the same turn). Empty string to cite the whole turn.'),
});
export type Evidence = z.infer<typeof EvidenceSchema>;
const EvidenceList = z.array(EvidenceSchema);

export const AnalysisSchema = z.object({
  central_finding: z.string().describe('One or two plain-language sentences: the central finding, with its confidence in words.'),
  summary: z.string().describe('A short plain-language summary of the situation (3–6 sentences): the central concern and whether it was addressed.'),
  original_concern: z.object({
    text: z.string(),
    raised_by: z.string(),
    addressed: z.enum(['addressed', 'partly_addressed', 'not_addressed', 'unclear']),
    explanation: z.string(),
    evidence: EvidenceList,
  }),
  evidence_scope: z.object({
    documented: z.string().describe('What the transcript itself documents.'),
    reported_events: z.array(
      z.object({ text: z.string(), reported_by: z.string(), evidence: EvidenceList }),
    ),
    context_used: z.string().describe('How any user-supplied context was used, or "None supplied".'),
    missing: z.array(z.string()).describe('Specific gaps that limit the analysis.'),
    transcript_quality: z.string().describe('Notes on attribution, inaudible/overlapping speech, annotations, redactions.'),
  }),
  core_questions: z.array(
    z.object({
      question: z.enum(CORE_QUESTION_IDS),
      answer: z.string(),
      confidence: Confidence,
      evidence: EvidenceList,
    }),
  ),
  participants: z.array(
    z.object({
      label: z.string().describe('Speaker label exactly as in the transcript, or a name for an absent person.'),
      present: z.boolean().describe('false for people discussed but not speaking.'),
      explicit_wants: z.array(z.object({ text: z.string(), evidence: EvidenceList })),
    }),
  ),
  topics: z.array(z.object({ id: z.string(), label: z.string(), turns: z.array(z.string()) })),
  findings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      statement: z.string(),
      basis: z.enum(BASIS),
      confidence: Confidence,
      confidence_reason: z.string(),
      evidence: EvidenceList,
      concepts: z.array(ConceptId),
    }),
  ),
  requests: z.array(
    z.object({
      id: z.string(),
      by: z.string(),
      to: z.array(z.string()),
      kind: z.enum(REQUEST_KINDS),
      summary: z.string(),
      evidence: EvidenceList,
      outcome: z.enum(OUTCOMES),
      response_turns: z.array(z.string()),
      note: z.string(),
    }),
  ),
  annotations: z.array(
    z.object({
      turn: z.string(),
      quote: z.string(),
      tag: z.enum(TAG_IDS),
      observation: z.string().describe('What is directly observable in the words. No interpretation.'),
      mechanism: z.string().describe('Possible mechanism or function, framed as a hypothesis. Empty if none.'),
      interpretation: z.string(),
      alternative: z.string().describe('A plausible alternative reading.'),
      limitation: z.string().describe('What the evidence cannot show.'),
      confidence: Confidence,
      concepts: z.array(ConceptId),
    }),
  ),
  timeline: z.array(z.object({ turn: z.string(), kind: z.enum(TIMELINE_KINDS), label: z.string() })),
  relationship: z.object({
    edges: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        kind: z.enum(EDGE_KINDS),
        note: z.string(),
        confidence: Confidence,
        evidence: EvidenceList,
      }),
    ),
    agreements: z.array(
      z.object({
        scope: z.enum(AGREEMENT_SCOPES),
        parties: z.array(z.string()),
        text: z.string(),
        status: z.enum(AGREEMENT_STATUS),
        evidence: EvidenceList,
      }),
    ),
    triad_checks: z.array(
      z.object({
        check: z.enum(TRIAD_CHECK_IDS),
        status: z.enum(TRIAD_STATUS),
        explanation: z.string(),
        evidence: EvidenceList,
      }),
    ),
  }),
  boundaries: z.object({
    agreed: z.array(z.object({ text: z.string(), by: z.string(), evidence: EvidenceList })),
    refused: z.array(z.object({ text: z.string(), by: z.string(), evidence: EvidenceList })),
    scope_changes: z.array(z.object({ text: z.string(), by: z.string(), evidence: EvidenceList })),
    pressure_after_refusal: z.array(z.object({ text: z.string(), by: z.string(), evidence: EvidenceList })),
    stop_requests: z.array(
      z.object({ text: z.string(), by: z.string(), response: z.string(), evidence: EvidenceList }),
    ),
    promised_changes: z.array(z.object({ text: z.string(), by: z.string(), specific: z.boolean(), evidence: EvidenceList })),
    reported_distress: z.array(z.object({ text: z.string(), by: z.string(), evidence: EvidenceList })),
  }),
  arguments: z.array(
    z.object({
      id: z.string(),
      speaker: z.string(),
      claim: z.string(),
      claim_type: z.enum(CLAIM_TYPES),
      grounds: z.array(z.object({ text: z.string(), basis: z.enum(BASIS), evidence: EvidenceList })),
      warrant: z.object({ text: z.string(), inferred: z.boolean() }),
      backing: z.string(),
      qualifier: z.string(),
      rebuttal: z.string(),
      missing: z.array(z.string()),
      counterevidence: z.array(z.object({ text: z.string(), evidence: EvidenceList })),
      assessment: z.enum(ARG_ASSESSMENTS),
      assessment_reason: z.string(),
      evidence: EvidenceList,
    }),
  ),
  decoder: z
    .array(
      z.object({
        turn: z.string(),
        quote: z.string(),
        speaker: z.string(),
        move: z.enum(DECODER_MOVES),
        what_it_does: z.string().describe('Plain language, second person where natural: what this line does in the conversation.'),
        what_it_leaves_unanswered: z.string(),
        fairer_reading: z.string().describe('The most charitable plausible reading.'),
        confidence: Confidence,
        concepts: z.array(ConceptId),
      }),
    )
    .describe('The decoder: evasions, excuses, minimising, misleading comparisons, blame shifts, pressure and non-answers, explained plainly.'),
  contradictions: z.array(
    z.object({
      speaker: z.string(),
      first: EvidenceSchema,
      second: EvidenceSchema,
      explanation: z.string(),
      could_both_be_true: z.string().describe('How the two statements might be reconciled, if at all.'),
      confidence: Confidence,
    }),
  ),
  reasoning_issues: z.array(
    z.object({
      id: z.string(),
      concept: ConceptId,
      turn: z.string(),
      quote: z.string(),
      how_it_operates: z.string(),
      fails_to_establish: z.string(),
      charitable_reading: z.string(),
      confidence: Confidence,
    }),
  ),
  mechanisms: z.array(
    z.object({
      concept: ConceptId,
      observation: z.string(),
      effect: z.string().describe('Observable effect in the conversation.'),
      possible_function: z.string(),
      intent: z.string().describe('What can and cannot be said about intent. Usually: unknown.'),
      alternative: z.string(),
      limitation: z.string(),
      confidence: Confidence,
      evidence: EvidenceList,
    }),
  ),
  flags: z.array(
    z.object({
      polarity: z.enum(['concern', 'positive']),
      kind: z.enum(FLAG_KINDS),
      title: z.string(),
      explanation: z.string(),
      by: z.string(),
      confidence: Confidence,
      evidence: EvidenceList,
    }),
  ),
  competing_explanations: z.array(
    z.object({
      explanation: z.string(),
      supporting: z.string(),
      unexplained: z.string(),
      would_change: z.string(),
      support: Confidence,
    }),
  ),
  reformulations: z.array(
    z.object({
      speaker: z.string(),
      turn: z.string(),
      kind: z.enum(['stronger_argument', 'accountable_reformulation']),
      text: z.string(),
      note: z.string(),
    }),
  ),
  playbook: z.array(
    z.object({
      goal: z.enum(GOAL_IDS),
      approach: z.enum(APPROACHES),
      finding: z.string(),
      script: z.string(),
      follow_up: z.string(),
      branches: z.array(z.object({ if_they: z.string(), you_could: z.string() })),
      stop_condition: z.string(),
      concepts: z.array(ConceptId),
    }),
  ),
  unknowns: z.array(z.string()),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Finding = Analysis['findings'][number];
export type RequestItem = Analysis['requests'][number];
export type Annotation = Analysis['annotations'][number];
export type ArgumentItem = Analysis['arguments'][number];
export type ReasoningIssue = Analysis['reasoning_issues'][number];
export type DecoderItem = Analysis['decoder'][number];
export type Contradiction = Analysis['contradictions'][number];
export type Mechanism = Analysis['mechanisms'][number];
export type Flag = Analysis['flags'][number];
export type PlaybookItem = Analysis['playbook'][number];

/** An empty analysis, used by offline keyword mode so the UI always has a complete shape. */
export function emptyAnalysis(): Analysis {
  return {
    central_finding: '',
    summary: '',
    original_concern: { text: '', raised_by: '', addressed: 'unclear', explanation: '', evidence: [] },
    evidence_scope: { documented: '', reported_events: [], context_used: '', missing: [], transcript_quality: '' },
    core_questions: [],
    participants: [],
    topics: [],
    findings: [],
    requests: [],
    annotations: [],
    timeline: [],
    relationship: { edges: [], agreements: [], triad_checks: [] },
    boundaries: {
      agreed: [],
      refused: [],
      scope_changes: [],
      pressure_after_refusal: [],
      stop_requests: [],
      promised_changes: [],
      reported_distress: [],
    },
    arguments: [],
    decoder: [],
    contradictions: [],
    reasoning_issues: [],
    mechanisms: [],
    flags: [],
    competing_explanations: [],
    reformulations: [],
    playbook: [],
    unknowns: [],
  };
}
