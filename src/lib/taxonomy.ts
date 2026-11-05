/**
 * Fixed vocabularies shared by the analysis schema, the prompt and the UI.
 * Keeping them in one place is what makes every analysis answer the same questions
 * in the same shape.
 */

export const CONFIDENCE = ['strong', 'moderate', 'tentative', 'not_established'] as const;
export type Confidence = (typeof CONFIDENCE)[number];
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  strong: 'Strong support',
  moderate: 'Moderate support',
  tentative: 'Tentative',
  not_established: 'Not established',
};
export const CONFIDENCE_HELP: Record<Confidence, string> = {
  strong: 'Several clear passages point the same way and plausible alternatives explain them poorly.',
  moderate: 'The passages support this reading, but a reasonable alternative remains.',
  tentative: 'Some passages are consistent with this reading; the evidence is thin or ambiguous.',
  not_established: 'The available material does not establish this.',
};

/** Where a statement comes from. Kept distinct everywhere in the UI. */
export const BASIS = ['documented', 'reported', 'context', 'interpretation', 'unknown'] as const;
export type Basis = (typeof BASIS)[number];
export const BASIS_LABEL: Record<Basis, string> = {
  documented: 'Documented',
  reported: 'Reported event',
  context: 'Supplied context',
  interpretation: 'Interpretation',
  unknown: 'Unknown',
};
export const BASIS_HELP: Record<Basis, string> = {
  documented: 'Words that appear in the supplied transcript.',
  reported: 'Someone’s account of an earlier or outside event. The transcript shows it was said, not that it happened as described.',
  context: 'Background supplied separately by the person using Subtext. Not verified.',
  interpretation: 'An explanation proposed by the analysis.',
  unknown: 'Something the available material cannot establish.',
};

export const CORE_QUESTIONS = [
  { id: 'origin', text: 'What concern or request started the discussion?' },
  { id: 'wants', text: 'What does each participant explicitly want?' },
  { id: 'claims', text: 'Which claims and assumptions shape the disagreement?' },
  { id: 'same_question', text: 'Are people answering the same question?' },
  { id: 'refusals', text: 'How are refusals and safety concerns addressed?' },
  { id: 'turning_points', text: 'Where does the conversation change direction?' },
  { id: 'resolution', text: 'What is acknowledged, repaired, or unresolved?' },
  { id: 'alternatives', text: 'What alternative explanations remain plausible?' },
  { id: 'responses', text: 'What response options match the goal?' },
] as const;
export type CoreQuestionId = (typeof CORE_QUESTIONS)[number]['id'];
export const CORE_QUESTION_IDS = CORE_QUESTIONS.map((q) => q.id) as unknown as readonly [CoreQuestionId, ...CoreQuestionId[]];

/** Analytical tags used to annotate passages and to filter the transcript. */
export const TAGS = [
  { id: 'request', label: 'Request', group: 'Asks' },
  { id: 'question', label: 'Question', group: 'Asks' },
  { id: 'disclosure', label: 'Disclosure', group: 'Asks' },
  { id: 'boundary', label: 'Boundary', group: 'Boundaries' },
  { id: 'refusal', label: 'Refusal / stop request', group: 'Boundaries' },
  { id: 'consent_check', label: 'Consent check', group: 'Boundaries' },
  { id: 'safety_concern', label: 'Safety concern', group: 'Boundaries' },
  { id: 'pressure', label: 'Pressure', group: 'Boundaries' },
  { id: 'acknowledgment', label: 'Acknowledgment', group: 'Responses' },
  { id: 'direct_answer', label: 'Direct answer', group: 'Responses' },
  { id: 'non_answer', label: 'Non-answer / deflection', group: 'Responses' },
  { id: 'repair', label: 'Repair', group: 'Responses' },
  { id: 'denial', label: 'Denial', group: 'Responses' },
  { id: 'minimization', label: 'Minimization', group: 'Responses' },
  { id: 'responsibility_shift', label: 'Responsibility shift', group: 'Responses' },
  { id: 'third_party', label: 'Third-party involvement', group: 'Dynamics' },
  { id: 'topic_change', label: 'Topic change', group: 'Dynamics' },
  { id: 'escalation', label: 'Escalation', group: 'Dynamics' },
  { id: 'de_escalation', label: 'De-escalation', group: 'Dynamics' },
  { id: 'uncertainty', label: 'Uncertainty / hedging', group: 'Dynamics' },
] as const;
export type TagId = (typeof TAGS)[number]['id'];
export const TAG_IDS = TAGS.map((t) => t.id) as unknown as readonly [TagId, ...TagId[]];
export const TAG_LABEL = Object.fromEntries(TAGS.map((t) => [t.id, t.label])) as Record<TagId, string>;

export const TIMELINE_KINDS = [
  'disclosure',
  'request',
  'boundary',
  'response',
  'clarification',
  'topic_change',
  'acknowledgment',
  'denial',
  'pressure',
  'escalation',
  'de_escalation',
  'repair',
  'agreement',
  'withdrawal',
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];
export const TIMELINE_LABEL: Record<TimelineKind, string> = {
  disclosure: 'Disclosure',
  request: 'Request',
  boundary: 'Boundary',
  response: 'Response',
  clarification: 'Clarification',
  topic_change: 'Topic change',
  acknowledgment: 'Acknowledgment',
  denial: 'Denial',
  pressure: 'Pressure',
  escalation: 'Escalation',
  de_escalation: 'De-escalation',
  repair: 'Repair',
  agreement: 'Agreement',
  withdrawal: 'Withdrawal',
};

export const REQUEST_KINDS = ['request', 'concern', 'question', 'boundary', 'refusal', 'stop_request', 'proposal'] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];
export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  request: 'Request',
  concern: 'Concern',
  question: 'Question',
  boundary: 'Boundary',
  refusal: 'Refusal',
  stop_request: 'Stop request',
  proposal: 'Proposal',
};

export const OUTCOMES = [
  'directly_answered',
  'acknowledged',
  'agreed',
  'partially_addressed',
  'deflected',
  'disputed',
  'denied',
  'no_clear_response',
] as const;
export type Outcome = (typeof OUTCOMES)[number];
export const OUTCOME_LABEL: Record<Outcome, string> = {
  directly_answered: 'Directly answered',
  acknowledged: 'Acknowledged',
  agreed: 'Agreed to',
  partially_addressed: 'Partly addressed',
  deflected: 'Deflected / redirected',
  disputed: 'Disputed',
  denied: 'Denied / refused',
  no_clear_response: 'No clear response',
};
export const OUTCOME_HELP: Record<Outcome, string> = {
  directly_answered: 'A later turn answers the question or request on its own terms.',
  acknowledged: 'A later turn recognises the concern without necessarily agreeing or acting.',
  agreed: 'A later turn agrees to the request.',
  partially_addressed: 'Part of the concern is answered; part is left open.',
  deflected: 'The reply moves to another topic, person, or the speaker’s intentions instead of the concern.',
  disputed: 'The facts or framing of the concern are contested.',
  denied: 'The request is declined or the described conduct is denied.',
  no_clear_response: 'No later turn in the transcript clearly responds.',
};

export const TRIAD_CHECKS = [
  { id: 'two_against_one', label: 'Two-against-one pressure' },
  { id: 'couple_privilege', label: 'Couple privilege or unequal decision-making' },
  { id: 'group_over_individual', label: 'Group expectations overriding an individual boundary' },
  { id: 'intimacy_for_other', label: 'Pressure to provide intimacy to please another partner' },
  { id: 'defending_absent', label: 'Defending an absent person instead of addressing a disclosure' },
  { id: 'private_info_recruiting', label: 'Private information used to recruit agreement' },
  { id: 'conflicting_agreements', label: 'Conflicting or unclear agreements' },
  { id: 'unequal_exit', label: 'Unequal freedom to refuse, pause, leave or renegotiate' },
] as const;
export type TriadCheckId = (typeof TRIAD_CHECKS)[number]['id'];
export const TRIAD_CHECK_IDS = TRIAD_CHECKS.map((t) => t.id) as unknown as readonly [TriadCheckId, ...TriadCheckId[]];
export const TRIAD_STATUS = ['supported', 'possible', 'not_supported', 'insufficient_evidence', 'not_applicable'] as const;
export type TriadStatus = (typeof TRIAD_STATUS)[number];
export const TRIAD_STATUS_LABEL: Record<TriadStatus, string> = {
  supported: 'Supported by passages',
  possible: 'Possible — evidence is limited',
  not_supported: 'Not supported',
  insufficient_evidence: 'Insufficient evidence',
  not_applicable: 'Not applicable',
};

export const EDGE_KINDS = ['request', 'disclosure', 'defense', 'pressure', 'acknowledgment', 'support', 'criticism', 'invokes'] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];
export const EDGE_LABEL: Record<EdgeKind, string> = {
  request: 'makes requests of',
  disclosure: 'discloses to',
  defense: 'defends',
  pressure: 'pressures',
  acknowledgment: 'acknowledges',
  support: 'supports',
  criticism: 'criticises',
  invokes: 'invokes (absent person)',
};

export const AGREEMENT_SCOPES = ['individual_boundary', 'pair_agreement', 'group_agreement'] as const;
export type AgreementScope = (typeof AGREEMENT_SCOPES)[number];
export const AGREEMENT_SCOPE_LABEL: Record<AgreementScope, string> = {
  individual_boundary: 'Individual boundary',
  pair_agreement: 'Agreement within a pair',
  group_agreement: 'Whole-group agreement',
};
export const AGREEMENT_STATUS = ['stated', 'reported', 'proposed', 'disputed', 'unclear'] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUS)[number];

export const CLAIM_TYPES = ['factual', 'causal', 'value', 'prediction', 'about_intent', 'policy'] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];
export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  factual: 'Factual claim',
  causal: 'Causal claim',
  value: 'Value judgment',
  prediction: 'Prediction',
  about_intent: 'Claim about intentions',
  policy: 'Proposal / what should happen',
};
export const ARG_ASSESSMENTS = ['supported', 'plausible_but_incomplete', 'weak_inference', 'does_not_follow', 'unclear'] as const;
export type ArgAssessment = (typeof ARG_ASSESSMENTS)[number];
export const ARG_ASSESSMENT_LABEL: Record<ArgAssessment, string> = {
  supported: 'Conclusion follows and grounds are documented',
  plausible_but_incomplete: 'Plausible, but relies on unstated premises',
  weak_inference: 'Weak inductive support',
  does_not_follow: 'Conclusion does not follow',
  unclear: 'Too unclear to assess',
};

export const FLAG_KINDS = [
  // possible concerns
  'pressure_after_refusal',
  'dismissed_safety_request',
  'responsibility_shift',
  'intimidation',
  'isolation_demand',
  'third_party_justification',
  'minimization',
  'other_concern',
  // positive signs
  'accepts_no',
  'checks_consent',
  'acknowledges_impact',
  'answers_directly',
  'corrects_misunderstanding',
  'specific_repair',
  'respects_autonomy',
  'other_positive',
] as const;
export type FlagKind = (typeof FLAG_KINDS)[number];
export const FLAG_LABEL: Record<FlagKind, string> = {
  pressure_after_refusal: 'Pressure after refusal',
  dismissed_safety_request: 'Safety request dismissed',
  responsibility_shift: 'Responsibility shifted',
  intimidation: 'Intimidation',
  isolation_demand: 'Isolation demand',
  third_party_justification: 'Another person’s needs used to justify unwanted conduct',
  minimization: 'Concern minimized',
  other_concern: 'Other concern',
  accepts_no: 'Accepts no',
  checks_consent: 'Checks consent',
  acknowledges_impact: 'Acknowledges impact',
  answers_directly: 'Answers directly',
  corrects_misunderstanding: 'Corrects a misunderstanding',
  specific_repair: 'Specific repair commitment',
  respects_autonomy: 'Respects autonomy',
  other_positive: 'Other positive sign',
};

export const DECODER_MOVES = [
  'evasion',
  'non_answer',
  'excuse',
  'intent_for_conduct',
  'minimization',
  'misleading_comparison',
  'blame_shift',
  'reframe',
  'pressure',
  'third_party_appeal',
  'private_information',
  'rule_invoked',
] as const;
export type DecoderMove = (typeof DECODER_MOVES)[number];
export const DECODER_MOVE_LABEL: Record<DecoderMove, string> = {
  evasion: 'Evasion',
  non_answer: 'Non-answer',
  excuse: 'Excuse',
  intent_for_conduct: 'Intentions offered instead of conduct',
  minimization: 'Minimising',
  misleading_comparison: 'Misleading comparison',
  blame_shift: 'Blame shift',
  reframe: 'Reframe',
  pressure: 'Pressure',
  third_party_appeal: 'Third-party appeal',
  private_information: 'Private information used',
  rule_invoked: 'Rule or agreement invoked',
};

export const GOALS = [
  { id: 'understand', label: 'Understand what happened' },
  { id: 'clarify', label: 'Clarify' },
  { id: 'de_escalate', label: 'De-escalate' },
  { id: 'persuade', label: 'Persuade' },
  { id: 'boundary', label: 'Set a boundary' },
  { id: 'repair', label: 'Repair' },
  { id: 'firm_rebuttal', label: 'Firm, accurate rebuttal' },
  { id: 'disengage', label: 'Disengage' },
] as const;
export type GoalId = (typeof GOALS)[number]['id'];
export const GOAL_IDS = GOALS.map((g) => g.id) as unknown as readonly [GoalId, ...GoalId[]];
export const GOAL_LABEL = Object.fromEntries(GOALS.map((g) => [g.id, g.label])) as Record<GoalId, string>;

export const APPROACHES = [
  'nvc',
  'principled_negotiation',
  'tactical_empathy',
  'direct_boundary',
  'clarifying_question',
  'intent_vs_conduct',
  'reduce_third_party',
  'repair_invitation',
  'firm_rebuttal',
  'disengagement',
] as const;
export type Approach = (typeof APPROACHES)[number];
export const APPROACH_LABEL: Record<Approach, string> = {
  nvc: 'Nonviolent Communication (NVC)',
  principled_negotiation: 'Principled negotiation',
  tactical_empathy: 'Tactical empathy',
  direct_boundary: 'Direct boundary',
  clarifying_question: 'Clarifying question',
  intent_vs_conduct: 'Separate intent from conduct',
  reduce_third_party: 'Reduce third-party pressure',
  repair_invitation: 'Invite repair',
  firm_rebuttal: 'Firm rebuttal',
  disengagement: 'Disengagement',
};

export const RELATIONSHIP_TYPES = [
  { id: 'unspecified', label: 'Prefer not to say' },
  { id: 'couple', label: 'Couple' },
  { id: 'triad', label: 'Triad / throuple' },
  { id: 'polycule', label: 'Polycule or other non-monogamous network' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'family', label: 'Family' },
  { id: 'workplace', label: 'Workplace' },
  { id: 'other', label: 'Other' },
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]['id'];

export const SOURCE_TYPES = [
  { id: 'unspecified', label: 'Not specified' },
  { id: 'recording_transcript', label: 'Transcript of a recording' },
  { id: 'messages', label: 'Text or chat messages' },
  { id: 'email', label: 'Email' },
  { id: 'notes_from_memory', label: 'Written from memory' },
  { id: 'other', label: 'Other' },
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number]['id'];
