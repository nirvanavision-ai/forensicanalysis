/**
 * FICTIONAL DEMONSTRATION CASE.
 * Sam, Jules and Rowan are invented people in an invented triad. Any resemblance to real
 * people or conversations is coincidental. This case exists to show how Subtext works.
 */
import type { Analysis, Evidence } from '../../lib/schema';
import type { CaseContext } from '../../lib/case';

const ev = (turn: string, quote = ''): Evidence => ({ turn, quote });

export const THROUPLE_TITLE = 'Saturday night (fictional throuple)';

export const THROUPLE_TRANSCRIPT = `[00:00] Sam: Can we talk about Saturday? I've been trying to find the right time and there isn't one.
[00:06] Jules: Okay. Sure.
[00:09] Sam: When I said I didn't want to stay over, I meant it. I was exhausted and I said no twice. And you kept going. You said Rowan had a terrible week and it would mean so much to them.
[00:24] Jules: I asked. I didn't force anyone. Asking twice isn't pressure, that's communication.
[00:30] Sam: It was more than twice. And every time I said no you brought up Rowan.
[00:36] Rowan: [inaudible] … I didn't know you'd said no.
[00:40] Jules: Because Rowan did have a terrible week! I was only trying to look after them. Is that a crime now?
[00:46] Sam: I'm not saying you're a criminal. I'm saying I said no and it didn't count.
[00:51] Jules: You stayed, though. Nobody locked the door. [laughs]
[00:55] Sam: I stayed because it felt like I didn't have a choice. I felt sick about it the whole next day.
[01:03] Jules: Honestly, you're making me feel like a monster here. I'm the one who's been holding this whole thing together.
[01:09] Sam: That's not what I —
[01:10] Jules: [crosstalk] — and Dee said you've been pulling away from us for weeks anyway.
[01:14] Sam: Dee isn't part of this. Why are you talking to Dee about us?
[01:18] Jules: Because you told me yourself you feel insecure about me and Rowan. I'm not making this up.
[01:24] Sam: I told you that in private. That has nothing to do with Saturday.
[01:28] Jules: We all agreed weekends are for the three of us. You knew that when you joined.
[01:33] Sam: You and Rowan agreed that before I was even around. Nobody asked me.
[01:38] Rowan?: That's… fair, actually.
[01:41] Jules: And what about last month? You made plans with your sister without telling either of us. You always do this.
[01:47] Sam: You always turn it around. — Okay, that's not fair of me, not always. But this time, yes.
[01:54] Rowan: Can I say something? I did have a rough week. I was glad you were there. But not like that. I don't want anyone staying because of me if they don't want to.
[02:05] Jules: So now I'm the bad guy.
[02:07] Rowan: No. I'm saying I don't need you to speak for me. If Sam says no, that's it. I'll say so too.
[02:14] Sam: Thank you. That's what I needed to hear. That's all I'm asking — if one of us says no, nobody asks again that night.
[02:21] Jules: Fine. I hear that it felt like pressure to you. But I still don't think I did anything wrong.
[02:27] Sam: I'm not going to keep debating whether my no counted. I'm going to go home tonight. I'll text you both tomorrow.
[02:34] Jules: Sure. Run off again.
[02:36] Rowan: Jules. … Sam, is it okay if we keep talking about this tomorrow? Just the three of us, no one else.
[02:42] Sam: Yes. Tomorrow.`;

export const THROUPLE_CONTEXT: CaseContext = {
  relationship: 'triad',
  sourceType: 'recording_transcript',
  userSpeaker: 'Sam',
  goals: ['boundary', 'repair'],
  notes:
    'Fictional example. Sam has been in a triad with Jules and Rowan for about six months; Jules and Rowan were together for several years before that. The conversation was recorded with everyone’s agreement.',
};

export const THROUPLE_ANALYSIS: Analysis = {
  central_finding:
    'Sam says their “no” on Saturday was met with more asking. Rowan accepts this and commits to a rule, while Jules acknowledges how it felt but not the conduct, so the concern is partly addressed. Support is strong for what was said tonight; Saturday itself is reported, not recorded.',
  summary:
    'Sam opens by raising Saturday: they said no to staying over, more than once, and Jules kept asking and brought up Rowan’s hard week. Jules’s replies move from defining the asking as “communication”, to Sam having stayed anyway, to Jules’s own hurt, to a friend’s opinion, to Sam’s private insecurity, to a weekend rule, and to an older grievance. None of those replies says Sam’s no was respected. Rowan says they did not know about the no, did not want anyone staying for them, does not need Jules to speak for them, and will back Sam’s no in future. Sam proposes a simple rule, ends the debate for the night and agrees to continue tomorrow.',
  original_concern: {
    text: 'Sam said no to staying over on Saturday, more than once, and was asked again with reference to Rowan’s difficult week. Sam wants that no recognised as having counted, and wants future no’s to end the asking.',
    raised_by: 'Sam',
    addressed: 'partly_addressed',
    explanation:
      'Rowan addresses it directly and commits to a rule (02:07). Jules acknowledges that it “felt like pressure” to Sam (02:21) while maintaining nothing wrong was done, and does not say whether they accept the rule Sam proposes (02:14).',
    evidence: [
      ev('T3', 'When I said I didn\'t want to stay over, I meant it.'),
      ev('T8', "I'm saying I said no and it didn't count."),
      ev('T25', 'if one of us says no, nobody asks again that night'),
    ],
  },
  evidence_scope: {
    documented:
      'A recorded conversation between Sam, Jules and Rowan: 30 turns with timestamps running from 00:00 to 02:42. It documents what each person said tonight about Saturday, about the weekend arrangement and about next steps.',
    reported_events: [
      { text: 'On Saturday Sam said no to staying over at least twice, and Jules kept asking, citing Rowan’s terrible week.', reported_by: 'Sam', evidence: [ev('T3', 'I was exhausted and I said no twice. And you kept going.')] },
      { text: 'Sam felt sick the whole of the next day.', reported_by: 'Sam', evidence: [ev('T10', 'I felt sick about it the whole next day.')] },
      { text: 'Dee (who is not present) said Sam has been pulling away for weeks.', reported_by: 'Jules (second-hand)', evidence: [ev('T13', "Dee said you've been pulling away from us for weeks anyway")] },
      { text: 'Sam had privately told Jules about feeling insecure about Jules and Rowan.', reported_by: 'Jules; Sam confirms it was said in private', evidence: [ev('T15', 'you told me yourself you feel insecure about me and Rowan'), ev('T16', 'I told you that in private.')] },
      { text: 'Jules and Rowan made the weekend arrangement before Sam joined.', reported_by: 'Sam; a line attributed to Rowan with uncertainty appears to agree', evidence: [ev('T18', 'You and Rowan agreed that before I was even around.'), ev('T19', "That's… fair, actually.")] },
      { text: 'Last month Sam made plans with their sister without telling Jules or Rowan.', reported_by: 'Jules', evidence: [ev('T20', 'You made plans with your sister without telling either of us.')] },
    ],
    context_used:
      'Supplied context (fictional): a six-month triad in which Jules and Rowan were together first; Sam is the person using Subtext; recording made with everyone’s agreement. Used only to orient the analysis, not as evidence.',
    missing: [
      'No record of Saturday itself. What happened then is known only through Sam’s and Jules’s accounts tonight.',
      'Tone, volume and pauses are not available; the text has two annotator marks ([laughs], [crosstalk]) whose tone cannot be checked.',
      'Part of Rowan’s line at 00:36 is inaudible.',
      'The line at 01:38 is attributed to Rowan with a question mark in the source.',
      'Whether Jules accepts the rule Sam proposes at 02:14 is not stated.',
      'What Dee actually said, and when, is unknown.',
      'Sam does not respond to the point about last month’s plans, so Jules’s grievance is unexamined.',
    ],
    transcript_quality:
      'Timestamps on every turn. One partly inaudible turn (T6), one overlap mark (T13), one annotator mark (T9), one uncertain attribution (T19). Names are aliases.',
  },
  core_questions: [
    {
      question: 'origin',
      answer: 'Sam asks to talk about Saturday and describes saying no to staying over, more than once, while Jules kept asking and cited Rowan’s week.',
      confidence: 'strong',
      evidence: [ev('T1', 'Can we talk about Saturday?'), ev('T3', 'You said Rowan had a terrible week and it would mean so much to them.')],
    },
    {
      question: 'wants',
      answer:
        'Sam wants their no recognised and a rule that a no ends the asking. Jules wants it recognised that nobody was forced, and wants credit for holding things together and to be told about plans. Rowan wants nobody staying for them unwillingly, to speak for themself, and to continue tomorrow with just the three of them.',
      confidence: 'strong',
      evidence: [ev('T8'), ev('T25'), ev('T4', "I didn't force anyone."), ev('T11', "I'm the one who's been holding this whole thing together."), ev('T22', "I don't want anyone staying because of me if they don't want to."), ev('T24', "I don't need you to speak for me.")],
    },
    {
      question: 'claims',
      answer:
        'The key disagreement is about a definition rather than the facts: whether asking again after a no, while citing another partner’s needs, is “pressure” or “communication”. Secondary claims: that staying shows it was fine; that Sam’s insecurity explains the complaint; that everyone agreed weekends are for the three of them.',
      confidence: 'strong',
      evidence: [ev('T4', "Asking twice isn't pressure, that's communication."), ev('T9', 'You stayed, though.'), ev('T15'), ev('T17', 'We all agreed weekends are for the three of us.')],
    },
    {
      question: 'same_question',
      answer:
        'Mostly not. Sam is asking whether their no counted. Jules answers different questions: whether force was used, whether Sam stayed, whether Jules is a bad person, and whether Sam is reliable. Rowan answers Sam’s question directly.',
      confidence: 'strong',
      evidence: [ev('T8'), ev('T9'), ev('T11', "you're making me feel like a monster here"), ev('T24', "If Sam says no, that's it.")],
    },
    {
      question: 'refusals',
      answer:
        'Sam’s reported refusal on Saturday is not denied, but Jules does not accept that it should have ended the asking. Sam’s stop to the debate tonight is met by Jules with “Run off again” and by Rowan with a consent check about continuing tomorrow.',
      confidence: 'strong',
      evidence: [ev('T26', "But I still don't think I did anything wrong."), ev('T27', "I'm not going to keep debating whether my no counted."), ev('T28', 'Sure. Run off again.'), ev('T29', 'is it okay if we keep talking about this tomorrow?')],
    },
    {
      question: 'turning_points',
      answer:
        'At 00:51 the focus moves from the no to the outcome (“You stayed”). From 01:03 to 01:41 it moves through Jules’s feelings, Dee, Sam’s private insecurity, the weekend rule and an older grievance. At 01:54 Rowan steps in and the conversation turns back to Saturday.',
      confidence: 'strong',
      evidence: [ev('T9'), ev('T13'), ev('T20', 'And what about last month?'), ev('T22', 'Can I say something?')],
    },
    {
      question: 'resolution',
      answer:
        'Acknowledged: by Rowan fully, by Jules partly (the feeling, not the conduct). Repaired: Rowan commits to backing a no. Unresolved: whether Jules accepts the rule, whether the weekend arrangement is shared, the involvement of Dee, and Jules’s grievance about last month.',
      confidence: 'strong',
      evidence: [ev('T22', 'But not like that.'), ev('T24'), ev('T26', 'I hear that it felt like pressure to you.')],
    },
    {
      question: 'alternatives',
      answer:
        'Jules may genuinely have seen the asking as ordinary persuasion and not realised the no was firm; Jules may feel excluded and overburdened. These readings explain Jules’s replies but do not change whether Sam’s no was respected.',
      confidence: 'moderate',
      evidence: [ev('T7', 'I was only trying to look after them.'), ev('T11')],
    },
    {
      question: 'responses',
      answer:
        'Options include restating the rule as a boundary that does not need Jules’s agreement, asking Jules to keep third parties out, building on Rowan’s commitment, and keeping last month’s plans as a separate conversation. Disengaging for the night, as Sam did, is also a complete response.',
      confidence: 'moderate',
      evidence: [ev('T25'), ev('T27')],
    },
  ],
  participants: [
    {
      label: 'Sam',
      present: true,
      explicit_wants: [
        { text: 'For their no on Saturday to be recognised as having counted', evidence: [ev('T8', "I'm saying I said no and it didn't count.")] },
        { text: 'A rule: after a no, nobody asks again that night', evidence: [ev('T25', 'if one of us says no, nobody asks again that night')] },
        { text: 'To keep Dee out of the relationship’s conflicts', evidence: [ev('T14', "Dee isn't part of this.")] },
        { text: 'A say in agreements that affect them', evidence: [ev('T18', 'Nobody asked me.')] },
      ],
    },
    {
      label: 'Jules',
      present: true,
      explicit_wants: [
        { text: 'To be recognised as not having forced anyone', evidence: [ev('T4', "I didn't force anyone.")] },
        { text: 'Recognition for holding the relationship together', evidence: [ev('T11', "I'm the one who's been holding this whole thing together.")] },
        { text: 'To be told about plans', evidence: [ev('T20', 'You made plans with your sister without telling either of us.')] },
        { text: 'To keep weekends for the three of them', evidence: [ev('T17', 'We all agreed weekends are for the three of us.')] },
      ],
    },
    {
      label: 'Rowan',
      present: true,
      explicit_wants: [
        { text: 'Nobody staying on their account unwillingly', evidence: [ev('T22', "I don't want anyone staying because of me if they don't want to.")] },
        { text: 'To speak for themself', evidence: [ev('T24', "I don't need you to speak for me.")] },
        { text: 'To continue tomorrow, just the three of them', evidence: [ev('T29', 'Just the three of us, no one else.')] },
      ],
    },
    { label: 'Dee', present: false, explicit_wants: [] },
  ],
  topics: [
    { id: 'saturday', label: 'Saturday and the repeated asking', turns: ['T1', 'T3', 'T4', 'T5', 'T7', 'T8', 'T9', 'T10', 'T22', 'T26'] },
    { id: 'rowan', label: 'Speaking for Rowan', turns: ['T3', 'T6', 'T7', 'T22', 'T24'] },
    { id: 'third_party', label: 'Dee and private disclosures', turns: ['T13', 'T14', 'T15', 'T16'] },
    { id: 'weekends', label: 'The weekend arrangement', turns: ['T17', 'T18', 'T19'] },
    { id: 'last_month', label: 'Last month’s plans', turns: ['T20', 'T21'] },
    { id: 'next_steps', label: 'Next steps', turns: ['T25', 'T27', 'T28', 'T29', 'T30'] },
  ],
  findings: [
    {
      id: 'F1',
      title: 'The asking isn’t disputed. Calling it pressure is.',
      statement:
        'Jules confirms asking more than once and, when Sam says Rowan was brought up every time, replies “Because Rowan did have a terrible week!”. The disagreement is about whether that counts as pressure, not about what happened.',
      basis: 'documented',
      confidence: 'strong',
      confidence_reason: 'Jules’s own words at 00:24 and 00:40 confirm the asking and the reference to Rowan; the count (“twice” vs “more than twice”) is disputed.',
      evidence: [ev('T4', "Asking twice isn't pressure, that's communication."), ev('T5', 'It was more than twice.'), ev('T7', 'Because Rowan did have a terrible week!')],
      concepts: ['consent', 'false_dilemma', 'boundaries_not_arguments'],
    },
    {
      id: 'F2',
      title: 'Rowan’s needs were used to answer Sam’s no, and Rowan didn’t ask for that',
      statement:
        'Sam reports that Rowan’s hard week was given as the reason to keep asking. Tonight Jules defends that reason. Rowan says they didn’t know about the no, didn’t want anyone staying for them unwillingly, and doesn’t need Jules to speak for them.',
      basis: 'documented',
      confidence: 'strong',
      confidence_reason: 'The defence (00:40) and Rowan’s statements (00:36, 01:54, 02:07) are documented. What was said on Saturday is reported by Sam.',
      evidence: [ev('T3', 'You said Rowan had a terrible week and it would mean so much to them.'), ev('T6', "I didn't know you'd said no."), ev('T22', "I don't want anyone staying because of me if they don't want to."), ev('T24', "I don't need you to speak for me.")],
      concepts: ['triangulation', 'md_displacement_responsibility', 'consent'],
    },
    {
      id: 'F3',
      title: 'The replies kept moving away from Saturday',
      statement:
        'In six replies, Jules turns to the outcome (“You stayed”), their own hurt, Dee’s opinion, Sam’s private insecurity, the weekend rule and an older grievance. Each might be worth discussing. None of them answers whether Sam’s no was respected.',
      basis: 'documented',
      confidence: 'strong',
      confidence_reason: 'The sequence is visible in consecutive turns 00:51–01:41.',
      evidence: [ev('T9', 'You stayed, though.'), ev('T11', "you're making me feel like a monster here"), ev('T13', 'Dee said'), ev('T15', 'you feel insecure about me and Rowan'), ev('T17', 'We all agreed weekends are for the three of us.'), ev('T20', 'And what about last month?')],
      concepts: ['red_herring', 'tu_quoque', 'dialogue_types'],
    },
    {
      id: 'F4',
      title: 'A pair agreement was presented as a group agreement',
      statement:
        'Jules says “We all agreed” that weekends are for the three of them. Sam says Jules and Rowan made that arrangement before Sam joined and nobody asked Sam. A line attributed to Rowan, with uncertainty, appears to agree. An arrangement about weekends also doesn’t settle a specific no on a specific night.',
      basis: 'documented',
      confidence: 'moderate',
      confidence_reason: 'The dispute is documented. Who made the arrangement is reported by Sam, and the supporting line at 01:38 has uncertain attribution.',
      evidence: [ev('T17', 'We all agreed weekends are for the three of us.'), ev('T18', 'You and Rowan agreed that before I was even around. Nobody asked me.'), ev('T19', "That's… fair, actually.")],
      concepts: ['agreements_layers', 'couple_privilege', 'md_diffusion_responsibility', 'commitment_consistency'],
    },
    {
      id: 'F5',
      title: 'Something said in private was used in the argument',
      statement:
        'Jules explains talking to Dee by citing what Sam had told Jules privately about feeling insecure. Sam objects that it was private and unrelated to Saturday.',
      basis: 'documented',
      confidence: 'strong',
      confidence_reason: 'Both turns are documented and Sam confirms it was said in private.',
      evidence: [ev('T15', 'you told me yourself you feel insecure about me and Rowan'), ev('T16', 'I told you that in private. That has nothing to do with Saturday.')],
      concepts: ['ad_hominem', 'unsupported_causal'],
    },
    {
      id: 'F6',
      title: 'Rowan made a specific repair; Jules acknowledged the feeling, not the conduct',
      statement:
        'Rowan names what they want and commits to a concrete action: “If Sam says no, that’s it. I’ll say so too.” Jules says “I hear that it felt like pressure to you” but adds “I still don’t think I did anything wrong.” The positive steps are real, and they don’t erase what came before.',
      basis: 'documented',
      confidence: 'strong',
      confidence_reason: 'Both statements are documented verbatim.',
      evidence: [ev('T24', "If Sam says no, that's it. I'll say so too."), ev('T26', "I hear that it felt like pressure to you. But I still don't think I did anything wrong.")],
      concepts: ['repair', 'metamessages'],
    },
  ],
  requests: [
    { id: 'R1', by: 'Sam', to: ['Jules', 'Rowan'], kind: 'request', summary: 'Talk about Saturday', evidence: [ev('T1', 'Can we talk about Saturday?')], outcome: 'agreed', response_turns: ['T2'], note: 'Jules agrees immediately.' },
    { id: 'R2', by: 'Sam', to: ['Jules'], kind: 'concern', summary: 'Recognise that Sam’s no on Saturday counted', evidence: [ev('T8', "I'm saying I said no and it didn't count.")], outcome: 'partially_addressed', response_turns: ['T9', 'T11', 'T26'], note: 'First answered with the outcome (“You stayed”) and Jules’s feelings; later Jules acknowledges Sam’s experience but not wrongdoing.' },
    { id: 'R3', by: 'Sam', to: ['Jules'], kind: 'question', summary: 'Why are you talking to Dee about us?', evidence: [ev('T14', 'Why are you talking to Dee about us?')], outcome: 'deflected', response_turns: ['T15'], note: 'The reply gives a reason about Sam (their private insecurity) rather than about involving Dee.' },
    { id: 'R4', by: 'Sam', to: ['Jules'], kind: 'boundary', summary: 'Keep Dee out of this', evidence: [ev('T14', "Dee isn't part of this.")], outcome: 'partially_addressed', response_turns: ['T29'], note: 'Jules does not respond to it. Rowan later proposes “Just the three of us, no one else.”' },
    { id: 'R5', by: 'Sam', to: ['Jules', 'Rowan'], kind: 'concern', summary: 'Have a say in agreements that affect Sam', evidence: [ev('T18', 'Nobody asked me.')], outcome: 'partially_addressed', response_turns: ['T19', 'T20'], note: 'Possibly acknowledged by Rowan (uncertain attribution); Jules responds with a different grievance.' },
    { id: 'R6', by: 'Jules', to: ['Sam'], kind: 'concern', summary: 'Being told about plans (last month)', evidence: [ev('T20', 'You made plans with your sister without telling either of us.')], outcome: 'no_clear_response', response_turns: ['T21'], note: 'Sam responds to how the point was raised, not to the plans. Jules’s grievance remains open.' },
    { id: 'R7', by: 'Rowan', to: ['Jules'], kind: 'boundary', summary: 'Don’t speak for me', evidence: [ev('T24', "I don't need you to speak for me.")], outcome: 'no_clear_response', response_turns: [], note: 'Jules does not address it directly.' },
    { id: 'R8', by: 'Sam', to: ['Jules', 'Rowan'], kind: 'proposal', summary: 'If one of us says no, nobody asks again that night', evidence: [ev('T25', 'if one of us says no, nobody asks again that night')], outcome: 'partially_addressed', response_turns: ['T26'], note: 'Matches Rowan’s commitment at 02:07. Jules’s reply does not say whether they accept it.' },
    { id: 'R9', by: 'Sam', to: ['Jules', 'Rowan'], kind: 'stop_request', summary: 'Stop debating whether the no counted; leave for the night', evidence: [ev('T27', "I'm not going to keep debating whether my no counted.")], outcome: 'disputed', response_turns: ['T28', 'T29'], note: 'Jules: “Sure. Run off again.” Rowan checks whether continuing tomorrow is okay.' },
    { id: 'R10', by: 'Rowan', to: ['Sam'], kind: 'question', summary: 'Is it okay to keep talking tomorrow, just the three of us?', evidence: [ev('T29', 'is it okay if we keep talking about this tomorrow?')], outcome: 'agreed', response_turns: ['T30'], note: 'Sam agrees.' },
  ],
  annotations: [
    { turn: 'T1', quote: 'Can we talk about Saturday?', tag: 'request', observation: 'Sam asks to discuss a specific day.', mechanism: '', interpretation: 'Opens with a clear, bounded topic.', alternative: '', limitation: 'Tone is not recorded.', confidence: 'strong', concepts: [] },
    { turn: 'T3', quote: 'When I said I didn\'t want to stay over, I meant it.', tag: 'disclosure', observation: 'Sam describes refusing on Saturday and being asked again, with Rowan’s week cited.', mechanism: '', interpretation: 'A report of a refusal that was not treated as final.', alternative: 'Jules’s memory of Saturday may differ in details.', limitation: 'Saturday is reported, not recorded.', confidence: 'strong', concepts: ['consent'] },
    { turn: 'T3', quote: 'You said Rowan had a terrible week and it would mean so much to them.', tag: 'third_party', observation: 'Another partner’s needs are reported as the reason given for asking again.', mechanism: 'Appealing to a third person’s feelings can make a refusal feel selfish.', interpretation: 'Possible third-party justification for continuing after a no.', alternative: 'Jules may have been sharing genuine worry about Rowan.', limitation: 'Reported by Sam; Jules’s exact words on Saturday are unknown.', confidence: 'moderate', concepts: ['triangulation', 'argument_schemes'] },
    { turn: 'T4', quote: "Asking twice isn't pressure, that's communication.", tag: 'denial', observation: 'Jules confirms asking and rejects the label “pressure”.', mechanism: 'Defines the conduct into an acceptable category.', interpretation: 'Disputes the description rather than the event.', alternative: 'Jules may honestly see repeated asking as checking in.', limitation: 'Whether the asking felt pressuring is Sam’s report; intent is unknown.', confidence: 'strong', concepts: ['false_dilemma', 'equivocation'] },
    { turn: 'T5', quote: 'It was more than twice.', tag: 'direct_answer', observation: 'Sam disputes the count and repeats the reference to Rowan.', mechanism: '', interpretation: 'Sam stays on the original concern.', alternative: '', limitation: 'The true count is not documented.', confidence: 'strong', concepts: [] },
    { turn: 'T6', quote: "I didn't know you'd said no.", tag: 'uncertainty', observation: 'Rowan says they were unaware of the refusal; part of the turn is inaudible.', mechanism: '', interpretation: 'Suggests the requests were not relayed from Rowan.', alternative: 'The inaudible part could change the meaning.', limitation: 'Partly inaudible.', confidence: 'moderate', concepts: [] },
    { turn: 'T7', quote: 'I was only trying to look after them.', tag: 'responsibility_shift', observation: 'Jules states a caring purpose and asks “Is that a crime now?”.', mechanism: 'A good purpose offered in place of an answer about conduct.', interpretation: 'Moves from what happened to why.', alternative: 'Jules may be explaining, not excusing.', limitation: 'Sincerity of the purpose cannot be judged from text.', confidence: 'moderate', concepts: ['md_moral_justification', 'non_sequitur'] },
    { turn: 'T8', quote: "I'm saying I said no and it didn't count.", tag: 'boundary', observation: 'Sam restates the concern in one sentence.', mechanism: '', interpretation: 'Sam corrects an exaggerated reading (“crime”) and returns to the point.', alternative: '', limitation: '', confidence: 'strong', concepts: ['boundaries_not_arguments'] },
    { turn: 'T9', quote: 'You stayed, though. Nobody locked the door.', tag: 'minimization', observation: 'Jules points to the outcome and the absence of physical force; the transcript adds [laughs].', mechanism: 'Treats staying as evidence of agreement.', interpretation: 'Compliance after repeated asking is not evidence of willing agreement.', alternative: 'Jules may not have understood that the no was firm.', limitation: '[laughs] is an annotator’s mark; tone and intent are unknown.', confidence: 'strong', concepts: ['md_minimizing_consequences', 'consent', 'non_sequitur'] },
    { turn: 'T10', quote: "I stayed because it felt like I didn't have a choice.", tag: 'disclosure', observation: 'Sam explains why they stayed and reports feeling sick the next day.', mechanism: '', interpretation: 'Reported distress connected to the event.', alternative: '', limitation: 'Reported feelings; no inference about physiology.', confidence: 'strong', concepts: ['consent'] },
    { turn: 'T11', quote: "you're making me feel like a monster here", tag: 'escalation', observation: 'Jules turns to their own feelings and their role holding things together.', mechanism: 'Shifts attention from the disclosure to the person responding.', interpretation: 'Resembles the reversal step of DARVO, in one turn.', alternative: 'Jules may genuinely feel accused; that feeling is common when a concern is raised.', limitation: 'One turn cannot establish a pattern.', confidence: 'moderate', concepts: ['darvo', 'invalidating_responses'] },
    { turn: 'T12', quote: "That's not what I —", tag: 'uncertainty', observation: 'Sam is cut off; the next turn is marked [crosstalk].', mechanism: '', interpretation: 'Sam does not finish the sentence.', alternative: 'Overlap can be cooperative or competitive; text alone can’t tell.', limitation: 'No audio to assess overlap.', confidence: 'tentative', concepts: ['conversational_style'] },
    { turn: 'T13', quote: "Dee said you've been pulling away from us for weeks anyway", tag: 'third_party', observation: 'An absent person’s opinion of Sam is introduced.', mechanism: 'Second-hand criticism brought in to support Jules’s position.', interpretation: 'A topic change away from Saturday.', alternative: 'Jules may see Saturday as part of a wider worry.', limitation: 'What Dee said is reported second-hand.', confidence: 'strong', concepts: ['red_herring', 'triangulation', 'social_proof'] },
    { turn: 'T14', quote: "Dee isn't part of this.", tag: 'boundary', observation: 'Sam objects to involving Dee and asks why.', mechanism: '', interpretation: 'A boundary about third-party involvement.', alternative: '', limitation: '', confidence: 'strong', concepts: [] },
    { turn: 'T15', quote: 'you told me yourself you feel insecure about me and Rowan', tag: 'responsibility_shift', observation: 'Jules cites Sam’s private disclosure.', mechanism: 'Explains the complaint by a trait of the person complaining.', interpretation: 'Uses private information in a dispute.', alternative: 'Jules may be answering Sam’s “why” literally.', limitation: 'Whether this was meant to discredit Sam is not established.', confidence: 'moderate', concepts: ['ad_hominem', 'unsupported_causal'] },
    { turn: 'T16', quote: 'I told you that in private.', tag: 'boundary', observation: 'Sam objects to private information being used.', mechanism: '', interpretation: '', alternative: '', limitation: '', confidence: 'strong', concepts: [] },
    { turn: 'T17', quote: 'We all agreed weekends are for the three of us.', tag: 'pressure', observation: 'Jules invokes a weekend arrangement as agreed by all.', mechanism: 'An earlier commitment cited for a later, specific situation.', interpretation: 'Treats an arrangement about time together as bearing on a specific no.', alternative: 'Jules may be raising a genuine expectation about weekends.', limitation: 'What was agreed, and by whom, is disputed.', confidence: 'moderate', concepts: ['commitment_consistency', 'unity', 'agreements_layers'] },
    { turn: 'T18', quote: 'Nobody asked me.', tag: 'boundary', observation: 'Sam says the arrangement predates them.', mechanism: '', interpretation: 'A pair agreement presented as a group agreement.', alternative: 'Sam may have accepted it implicitly when joining.', limitation: 'Reported; not otherwise documented.', confidence: 'moderate', concepts: ['couple_privilege', 'agreements_layers'] },
    { turn: 'T19', quote: "That's… fair, actually.", tag: 'acknowledgment', observation: 'A brief acknowledgment, attributed to Rowan with a question mark.', mechanism: '', interpretation: 'Possibly Rowan agreeing with Sam’s point.', alternative: 'Could be a different speaker.', limitation: 'Uncertain attribution.', confidence: 'tentative', concepts: [] },
    { turn: 'T20', quote: 'And what about last month?', tag: 'topic_change', observation: 'Jules raises a separate grievance and generalises (“You always do this”).', mechanism: '“What about you” in reply to a concern.', interpretation: 'A real grievance used as a counter to Sam’s.', alternative: 'Jules may feel left out and need this heard too.', limitation: 'The grievance itself may be valid.', confidence: 'strong', concepts: ['tu_quoque', 'hasty_generalization'] },
    { turn: 'T21', quote: "Okay, that's not fair of me, not always.", tag: 'repair', observation: 'Sam generalises (“You always”) and corrects themself in the same turn.', mechanism: '', interpretation: 'Self-correction; the same standard applied to Sam.', alternative: '', limitation: '', confidence: 'strong', concepts: ['hasty_generalization', 'conversation_repair'] },
    { turn: 'T22', quote: 'But not like that.', tag: 'acknowledgment', observation: 'Rowan confirms a rough week, says they were glad Sam was there, and rejects staying unwillingly on their account.', mechanism: '', interpretation: 'Rowan separates their needs from Sam’s obligations.', alternative: '', limitation: '', confidence: 'strong', concepts: ['consent', 'repair'] },
    { turn: 'T23', quote: "So now I'm the bad guy.", tag: 'escalation', observation: 'Jules characterises Rowan’s statement as casting Jules as the villain.', mechanism: 'Reframes a statement about needs as an accusation.', interpretation: 'Continues the focus on Jules’s standing.', alternative: 'Jules may feel isolated at this point.', limitation: '', confidence: 'moderate', concepts: ['straw_man'] },
    { turn: 'T24', quote: "If Sam says no, that's it. I'll say so too.", tag: 'repair', observation: 'Rowan makes a specific commitment and asks not to be spoken for.', mechanism: '', interpretation: 'A concrete, checkable repair commitment.', alternative: '', limitation: 'A commitment shows intent; only later conduct shows follow-through.', confidence: 'strong', concepts: ['repair'] },
    { turn: 'T25', quote: 'if one of us says no, nobody asks again that night', tag: 'request', observation: 'Sam proposes a simple, general rule.', mechanism: '', interpretation: 'Turns the concern into a forward-looking agreement for all three.', alternative: '', limitation: '', confidence: 'strong', concepts: ['agreements_layers'] },
    { turn: 'T26', quote: 'I hear that it felt like pressure to you.', tag: 'acknowledgment', observation: 'Jules acknowledges Sam’s experience and maintains nothing wrong was done.', mechanism: 'Acknowledges the feeling while not acknowledging the conduct.', interpretation: 'Partial acknowledgment.', alternative: 'This may be a genuine first step for Jules.', limitation: '', confidence: 'strong', concepts: ['metamessages', 'repair'] },
    { turn: 'T27', quote: "I'm not going to keep debating whether my no counted.", tag: 'refusal', observation: 'Sam stops the debate and states a plan.', mechanism: '', interpretation: 'A boundary on the conversation itself.', alternative: '', limitation: '', confidence: 'strong', concepts: ['boundaries_not_arguments'] },
    { turn: 'T28', quote: 'Sure. Run off again.', tag: 'minimization', observation: 'Jules characterises Sam leaving as “running off again”.', mechanism: 'Frames a stated boundary as a habit of avoidance.', interpretation: 'Does not respect the stop as stated.', alternative: 'May be frustration at the conversation ending.', limitation: 'Tone is not recorded.', confidence: 'moderate', concepts: ['hasty_generalization'] },
    { turn: 'T29', quote: 'is it okay if we keep talking about this tomorrow?', tag: 'consent_check', observation: 'Rowan checks with Sam and proposes keeping others out.', mechanism: '', interpretation: 'A consent check about continuing the conversation.', alternative: '', limitation: '', confidence: 'strong', concepts: ['consent'] },
  ],
  timeline: [
    { turn: 'T1', kind: 'request', label: 'Sam asks to talk about Saturday' },
    { turn: 'T3', kind: 'disclosure', label: 'Sam: said no twice, was asked again' },
    { turn: 'T4', kind: 'denial', label: 'Jules: “communication”, not pressure' },
    { turn: 'T6', kind: 'clarification', label: 'Rowan: didn’t know about the no' },
    { turn: 'T9', kind: 'topic_change', label: 'Focus moves to “You stayed”' },
    { turn: 'T10', kind: 'disclosure', label: 'Sam: felt there was no choice' },
    { turn: 'T11', kind: 'escalation', label: 'Jules: “feel like a monster”' },
    { turn: 'T13', kind: 'topic_change', label: 'Dee’s opinion introduced' },
    { turn: 'T15', kind: 'escalation', label: 'Private disclosure raised' },
    { turn: 'T17', kind: 'topic_change', label: 'Weekend rule invoked' },
    { turn: 'T18', kind: 'boundary', label: 'Sam: “Nobody asked me”' },
    { turn: 'T20', kind: 'topic_change', label: 'Older grievance: last month' },
    { turn: 'T21', kind: 'de_escalation', label: 'Sam corrects own generalisation' },
    { turn: 'T22', kind: 'acknowledgment', label: 'Rowan: “not like that”' },
    { turn: 'T24', kind: 'repair', label: 'Rowan: “If Sam says no, that’s it”' },
    { turn: 'T25', kind: 'request', label: 'Sam proposes the rule' },
    { turn: 'T26', kind: 'acknowledgment', label: 'Jules: feeling acknowledged, not conduct' },
    { turn: 'T27', kind: 'boundary', label: 'Sam stops the debate' },
    { turn: 'T28', kind: 'escalation', label: '“Run off again”' },
    { turn: 'T29', kind: 'de_escalation', label: 'Rowan checks: tomorrow, three only?' },
    { turn: 'T30', kind: 'agreement', label: 'Sam agrees' },
  ],
  relationship: {
    edges: [
      { from: 'Sam', to: 'Jules', kind: 'request', note: 'Asks for the no to be recognised and for a rule going forward.', confidence: 'strong', evidence: [ev('T8'), ev('T25')] },
      { from: 'Jules', to: 'Sam', kind: 'pressure', note: 'Reported by Sam for Saturday. Jules confirms asking more than once but disputes the label.', confidence: 'moderate', evidence: [ev('T3', 'And you kept going.'), ev('T4', 'Asking twice')] },
      { from: 'Jules', to: 'Sam', kind: 'criticism', note: 'Replies about Sam’s insecurity, pulling away, and last month’s plans.', confidence: 'strong', evidence: [ev('T13'), ev('T15'), ev('T20')] },
      { from: 'Jules', to: 'Rowan', kind: 'defense', note: 'Speaks on behalf of Rowan’s needs; Rowan later declines to be spoken for.', confidence: 'strong', evidence: [ev('T7', 'Because Rowan did have a terrible week!'), ev('T24', "I don't need you to speak for me.")] },
      { from: 'Jules', to: 'Dee', kind: 'invokes', note: 'Cites Dee’s opinion of Sam. Dee is not present.', confidence: 'strong', evidence: [ev('T13', 'Dee said')] },
      { from: 'Rowan', to: 'Sam', kind: 'acknowledgment', note: 'Acknowledges the concern and commits to backing a no.', confidence: 'strong', evidence: [ev('T22', 'But not like that.'), ev('T24', "If Sam says no, that's it.")] },
      { from: 'Rowan', to: 'Jules', kind: 'request', note: 'Asks Jules not to speak for them.', confidence: 'strong', evidence: [ev('T24', "I don't need you to speak for me.")] },
      { from: 'Sam', to: 'Rowan', kind: 'acknowledgment', note: 'Thanks Rowan.', confidence: 'strong', evidence: [ev('T25', "Thank you. That's what I needed to hear.")] },
      { from: 'Jules', to: 'Sam', kind: 'acknowledgment', note: 'Partial: the feeling, not the conduct.', confidence: 'strong', evidence: [ev('T26', 'I hear that it felt like pressure to you.')] },
    ],
    agreements: [
      { scope: 'individual_boundary', parties: ['Sam'], text: 'Did not want to stay over on Saturday', status: 'reported', evidence: [ev('T3', "When I said I didn't want to stay over, I meant it.")] },
      { scope: 'individual_boundary', parties: ['Sam'], text: 'Not continuing the debate tonight; going home', status: 'stated', evidence: [ev('T27')] },
      { scope: 'individual_boundary', parties: ['Rowan'], text: 'Nobody should stay on Rowan’s account unwillingly; Rowan speaks for themself', status: 'stated', evidence: [ev('T22', "I don't want anyone staying because of me if they don't want to."), ev('T24', "I don't need you to speak for me.")] },
      { scope: 'pair_agreement', parties: ['Jules', 'Rowan'], text: '“Weekends are for the three of us” — made by Jules and Rowan before Sam joined, according to Sam; presented by Jules as agreed by all', status: 'disputed', evidence: [ev('T17'), ev('T18')] },
      { scope: 'group_agreement', parties: ['Sam', 'Jules', 'Rowan'], text: 'If one of us says no, nobody asks again that night', status: 'proposed', evidence: [ev('T25', 'if one of us says no, nobody asks again that night'), ev('T24', "If Sam says no, that's it.")] },
      { scope: 'group_agreement', parties: ['Sam', 'Jules', 'Rowan'], text: 'Continue tomorrow, just the three of us, no one else', status: 'proposed', evidence: [ev('T29', 'Just the three of us, no one else.'), ev('T30', 'Yes. Tomorrow.')] },
    ],
    triad_checks: [
      { check: 'two_against_one', status: 'not_supported', explanation: 'There is no sustained two-against-one pressure on Sam in this conversation. Rowan supports Sam’s point about Saturday and possibly about the weekend arrangement.', evidence: [ev('T22'), ev('T24')] },
      { check: 'couple_privilege', status: 'possible', explanation: 'One arrangement made by Jules and Rowan before Sam joined is presented as everyone’s agreement. This shows one instance, not how decisions are generally made.', evidence: [ev('T17'), ev('T18')] },
      { check: 'group_over_individual', status: 'supported', explanation: 'The weekend arrangement is offered in reply to Sam’s concern about saying no. An arrangement to spend weekends together does not include agreement to stay over on a given night.', evidence: [ev('T17', 'We all agreed weekends are for the three of us. You knew that when you joined.')] },
      { check: 'intimacy_for_other', status: 'possible', explanation: 'Sam reports being asked to stay over for Rowan’s sake. The transcript does not say whether staying over involved intimacy, and Rowan says they did not want anyone staying for them unwillingly.', evidence: [ev('T3', 'it would mean so much to them'), ev('T22')] },
      { check: 'defending_absent', status: 'not_supported', explanation: 'No absent person is defended. Dee, who is absent, is cited as a source of criticism rather than defended.', evidence: [ev('T13')] },
      { check: 'private_info_recruiting', status: 'supported', explanation: 'A private disclosure is used to support Jules’s position in the dispute. Whether it was meant to recruit agreement is not established; that it was used is documented.', evidence: [ev('T15'), ev('T16')] },
      { check: 'conflicting_agreements', status: 'supported', explanation: 'Jules and Sam describe the weekend arrangement differently (everyone’s agreement versus a pre-existing pair agreement).', evidence: [ev('T17'), ev('T18')] },
      { check: 'unequal_exit', status: 'possible', explanation: 'Sam’s decision to leave is described as “running off again”, while Rowan checks consent for continuing. One comment is not enough to show Sam is less free to leave.', evidence: [ev('T28'), ev('T29')] },
    ],
  },
  boundaries: {
    agreed: [
      { text: 'To talk about Saturday', by: 'Jules', evidence: [ev('T2', 'Okay. Sure.')] },
      { text: 'To continue tomorrow, the three of them only', by: 'Sam', evidence: [ev('T30', 'Yes. Tomorrow.')] },
    ],
    refused: [{ text: 'Staying over on Saturday (reported)', by: 'Sam', evidence: [ev('T3', "When I said I didn't want to stay over, I meant it.")] }],
    scope_changes: [
      { text: 'A general arrangement about weekends is cited in reply to a refusal on a specific night.', by: 'Jules', evidence: [ev('T17', 'We all agreed weekends are for the three of us.')] },
    ],
    pressure_after_refusal: [
      { text: 'Reported: Jules kept asking after Sam said no, citing Rowan’s week. Jules confirms asking more than once.', by: 'Jules', evidence: [ev('T3', 'And you kept going.'), ev('T4', "Asking twice isn't pressure, that's communication.")] },
    ],
    stop_requests: [
      { text: 'Stop debating whether the no counted; going home tonight', by: 'Sam', response: 'Jules: “Sure. Run off again.” Rowan asks whether continuing tomorrow is okay; Sam agrees.', evidence: [ev('T27'), ev('T28'), ev('T29')] },
    ],
    promised_changes: [
      { text: 'If Sam says no, that’s it — Rowan will say so too', by: 'Rowan', specific: true, evidence: [ev('T24', "If Sam says no, that's it. I'll say so too.")] },
    ],
    reported_distress: [{ text: 'Felt there was no choice; felt sick the whole next day', by: 'Sam', evidence: [ev('T10')] }],
  },
  arguments: [
    {
      id: 'A1',
      speaker: 'Jules',
      claim: 'Asking repeatedly was communication, not pressure.',
      claim_type: 'value',
      grounds: [{ text: 'Jules asked and did not use force.', basis: 'documented', evidence: [ev('T4', "I asked. I didn't force anyone.")] }],
      warrant: { text: 'If no force is used, repeated requests are not pressure.', inferred: true },
      backing: 'None offered.',
      qualifier: 'None stated.',
      rebuttal: 'Sam: it was more than twice, and each time Rowan was brought up.',
      missing: ['How many times Sam was asked after saying no', 'Whether the requests changed after each no'],
      counterevidence: [
        { text: 'Sam reports that each no was followed by a request citing Rowan.', evidence: [ev('T5', 'every time I said no you brought up Rowan')] },
        { text: 'Rowan says they didn’t know about the no, so the requests were not relayed from Rowan.', evidence: [ev('T6', "I didn't know you'd said no.")] },
      ],
      assessment: 'does_not_follow',
      assessment_reason: 'No force does not mean no pressure. Pressure can come from repetition and from invoking someone else’s needs. The argument treats “pressure” and “communication” as if they can’t overlap.',
      evidence: [ev('T4')],
    },
    {
      id: 'A2',
      speaker: 'Jules',
      claim: 'Sam staying shows there was no problem.',
      claim_type: 'factual',
      grounds: [{ text: 'Sam stayed; no one locked the door.', basis: 'documented', evidence: [ev('T9', 'You stayed, though. Nobody locked the door.')] }],
      warrant: { text: 'Staying shows a person was willing.', inferred: true },
      backing: 'None offered.',
      qualifier: 'None stated.',
      rebuttal: 'Sam: “I stayed because it felt like I didn’t have a choice.”',
      missing: ['What Sam said and did between the last request and staying'],
      counterevidence: [{ text: 'Sam reports staying because it felt like there was no choice.', evidence: [ev('T10')] }],
      assessment: 'does_not_follow',
      assessment_reason: 'Going along after repeated requests is not evidence of willing agreement. Agreement after a no that was argued with is exactly what the concern is about.',
      evidence: [ev('T9')],
    },
    {
      id: 'A3',
      speaker: 'Jules',
      claim: 'Sam’s complaint comes from insecurity and pulling away, not from Saturday.',
      claim_type: 'causal',
      grounds: [
        { text: 'Dee said Sam has been pulling away.', basis: 'reported', evidence: [ev('T13', "Dee said you've been pulling away from us for weeks anyway")] },
        { text: 'Sam privately said they feel insecure about Jules and Rowan.', basis: 'reported', evidence: [ev('T15')] },
      ],
      warrant: { text: 'If someone is insecure or distant, their complaint is explained by that rather than by the event they describe.', inferred: true },
      backing: 'None offered.',
      qualifier: '“anyway” suggests this is offered as background.',
      rebuttal: 'Sam: “That has nothing to do with Saturday.”',
      missing: ['What Dee actually observed', 'Any link between the insecurity and Saturday'],
      counterevidence: [{ text: 'Jules’s own replies confirm the asking that Sam describes.', evidence: [ev('T4'), ev('T7')] }],
      assessment: 'weak_inference',
      assessment_reason: 'Second-hand opinion and a private feeling do not explain a specific, partly confirmed event. Even if Sam does feel insecure, that would not make their no less valid.',
      evidence: [ev('T13'), ev('T15')],
    },
    {
      id: 'A4',
      speaker: 'Jules',
      claim: 'Sam agreed that weekends are for the three of them.',
      claim_type: 'factual',
      grounds: [{ text: 'Sam knew about the arrangement when they joined.', basis: 'documented', evidence: [ev('T17', 'You knew that when you joined.')] }],
      warrant: { text: 'Joining after a rule is set counts as agreeing to it, and the rule applies to this situation.', inferred: true },
      backing: 'None offered.',
      qualifier: 'None stated.',
      rebuttal: 'Sam: Jules and Rowan made it before Sam was around; nobody asked Sam.',
      missing: ['What exactly the arrangement covers', 'Whether Sam ever explicitly agreed'],
      counterevidence: [{ text: 'Sam says nobody asked them; a line attributed to Rowan appears to agree.', evidence: [ev('T18'), ev('T19')] }],
      assessment: 'plausible_but_incomplete',
      assessment_reason: 'Knowing an arrangement exists is not the same as agreeing to it, and an arrangement about weekends does not settle a specific no on a specific night.',
      evidence: [ev('T17')],
    },
    {
      id: 'A5',
      speaker: 'Sam',
      claim: 'My no should have ended the asking.',
      claim_type: 'policy',
      grounds: [{ text: 'Sam said no, more than once.', basis: 'reported', evidence: [ev('T3', 'I said no twice.')] }],
      warrant: { text: 'A person’s no about their own participation is final for that occasion.', inferred: true },
      backing: 'Consent research and practice treat agreement as specific and revocable.',
      qualifier: 'None needed.',
      rebuttal: 'Jules: asking is communication.',
      missing: [],
      counterevidence: [],
      assessment: 'supported',
      assessment_reason: 'This is a boundary about Sam’s own participation, not a claim that has to win a debate. The fact it rests on (that Sam said no) is not disputed by Jules.',
      evidence: [ev('T8'), ev('T25')],
    },
  ],
  decoder: [
    {
      turn: 'T4',
      quote: "Asking twice isn't pressure, that's communication.",
      speaker: 'Jules',
      move: 'reframe',
      what_it_does: 'Renames the conduct so it sounds fine. If it’s “communication”, there’s nothing to answer for.',
      what_it_leaves_unanswered: 'Whether asking again after a no respected that no.',
      fairer_reading: 'Jules may honestly think of asking again as checking in, not pushing.',
      confidence: 'strong',
      concepts: ['false_dilemma', 'md_euphemistic_labeling'],
    },
    {
      turn: 'T7',
      quote: 'I was only trying to look after them.',
      speaker: 'Jules',
      move: 'intent_for_conduct',
      what_it_does: 'Swaps the question “what did you do?” for “why did you do it?”. A good reason is offered as if it settles the concern.',
      what_it_leaves_unanswered: 'Whether looking after Rowan was a reason to keep asking Sam after a no.',
      fairer_reading: 'Jules may be worried about Rowan and want that worry seen.',
      confidence: 'strong',
      concepts: ['md_moral_justification', 'non_sequitur'],
    },
    {
      turn: 'T9',
      quote: 'You stayed, though. Nobody locked the door.',
      speaker: 'Jules',
      move: 'minimization',
      what_it_does: 'Points at the outcome and the lack of physical force, as if staying proves it was fine.',
      what_it_leaves_unanswered: 'Why Sam stayed, and whether their no was respected before that.',
      fairer_reading: 'Jules may not have realised Sam’s no was firm.',
      confidence: 'strong',
      concepts: ['md_minimizing_consequences', 'consent'],
    },
    {
      turn: 'T11',
      quote: "Honestly, you're making me feel like a monster here.",
      speaker: 'Jules',
      move: 'reframe',
      what_it_does: 'Moves the spotlight from Sam’s experience to Jules’s hurt. Now Sam is the one causing harm.',
      what_it_leaves_unanswered: 'Sam’s disclosure, made in the turn just before, that they felt they had no choice.',
      fairer_reading: 'Feeling accused is painful; Jules may be saying that, not trying to flip the roles.',
      confidence: 'moderate',
      concepts: ['darvo', 'invalidating_responses'],
    },
    {
      turn: 'T13',
      quote: "Dee said you've been pulling away from us for weeks anyway.",
      speaker: 'Jules',
      move: 'third_party_appeal',
      what_it_does: 'Brings in an absent person’s opinion to cast doubt on Sam, mid-sentence of Sam’s reply.',
      what_it_leaves_unanswered: 'Anything about Saturday.',
      fairer_reading: 'Jules may be worried about the relationship more broadly.',
      confidence: 'strong',
      concepts: ['red_herring', 'social_proof', 'triangulation'],
    },
    {
      turn: 'T15',
      quote: 'Because you told me yourself you feel insecure about me and Rowan.',
      speaker: 'Jules',
      move: 'private_information',
      what_it_does: 'Uses something Sam shared in confidence to explain away the complaint.',
      what_it_leaves_unanswered: 'Why Dee is involved, and whether Sam’s no was respected.',
      fairer_reading: 'Jules may be literally answering “why talk to Dee?”.',
      confidence: 'moderate',
      concepts: ['ad_hominem', 'unsupported_causal'],
    },
    {
      turn: 'T17',
      quote: 'We all agreed weekends are for the three of us. You knew that when you joined.',
      speaker: 'Jules',
      move: 'rule_invoked',
      what_it_does: 'Cites a group rule as if it covers this night, and says Sam signed up for it by joining.',
      what_it_leaves_unanswered: 'Whether Sam agreed to the rule, and whether any rule overrides a no.',
      fairer_reading: 'Jules may value weekends together and feel that’s being dropped.',
      confidence: 'moderate',
      concepts: ['commitment_consistency', 'md_diffusion_responsibility', 'agreements_layers'],
    },
    {
      turn: 'T20',
      quote: 'And what about last month? You made plans with your sister without telling either of us. You always do this.',
      speaker: 'Jules',
      move: 'blame_shift',
      what_it_does: 'Answers a concern with a counter-complaint, then generalises it (“always”).',
      what_it_leaves_unanswered: 'Saturday. The counter-complaint may be fair, but it’s a separate conversation.',
      fairer_reading: 'Jules may feel left out of decisions and need that heard.',
      confidence: 'strong',
      concepts: ['tu_quoque', 'hasty_generalization'],
    },
    {
      turn: 'T26',
      quote: "I hear that it felt like pressure to you. But I still don't think I did anything wrong.",
      speaker: 'Jules',
      move: 'non_answer',
      what_it_does: 'Acknowledges Sam’s feeling but not Jules’s conduct, so the problem stays located in how Sam felt.',
      what_it_leaves_unanswered: 'Whether Jules will stop asking after a no, which is the rule Sam just proposed.',
      fairer_reading: 'This may be a real first step for Jules.',
      confidence: 'strong',
      concepts: ['metamessages', 'repair'],
    },
    {
      turn: 'T28',
      quote: 'Sure. Run off again.',
      speaker: 'Jules',
      move: 'minimization',
      what_it_does: 'Turns a stated boundary (“I’m going home tonight”) into a character flaw.',
      what_it_leaves_unanswered: 'Sam’s plan to continue tomorrow.',
      fairer_reading: 'Frustration at the conversation ending unresolved.',
      confidence: 'moderate',
      concepts: ['hasty_generalization'],
    },
  ],
  contradictions: [
    {
      speaker: 'Jules',
      first: ev('T4', "I asked. I didn't force anyone. Asking twice isn't pressure, that's communication."),
      second: ev('T7', 'Because Rowan did have a terrible week!'),
      explanation: 'At 00:24 Jules frames the asking as neutral communication. At 00:40, when Sam says Rowan was brought up every time, Jules explains why Rowan was brought up — confirming the asking leaned on Rowan’s needs.',
      could_both_be_true: 'Yes, in part: Jules can believe both that it was “communication” and that Rowan’s needs justified it. The tension is with the claim that the asking was neutral.',
      confidence: 'moderate',
    },
    {
      speaker: 'Jules',
      first: ev('T17', 'We all agreed weekends are for the three of us.'),
      second: ev('T18', 'You and Rowan agreed that before I was even around.'),
      explanation: 'Jules and Sam describe the same arrangement differently: everyone’s agreement versus a pair agreement Sam inherited.',
      could_both_be_true: 'Possibly, if Sam later accepted the arrangement. Nothing in the transcript shows that.',
      confidence: 'moderate',
    },
  ],
  reasoning_issues: [
    { id: 'Q1', concept: 'false_dilemma', turn: 'T4', quote: "Asking twice isn't pressure, that's communication.", how_it_operates: 'Presents “pressure” and “communication” as if a request can only be one or the other.', fails_to_establish: 'That the repeated asking did not pressure Sam.', charitable_reading: 'Jules may mean they did not intend to coerce and saw the requests as checking in.', confidence: 'moderate' },
    { id: 'Q2', concept: 'non_sequitur', turn: 'T9', quote: 'You stayed, though. Nobody locked the door.', how_it_operates: 'From “you stayed” and “no force” it concludes the no was not overridden.', fails_to_establish: 'That Sam agreed willingly.', charitable_reading: 'Jules may be pointing out that leaving was physically possible and may not have realised the no was firm.', confidence: 'strong' },
    { id: 'Q3', concept: 'red_herring', turn: 'T13', quote: "Dee said you've been pulling away from us for weeks anyway", how_it_operates: 'Introduces an absent person’s opinion about Sam’s general behaviour while Saturday is being discussed.', fails_to_establish: 'Anything about whether Sam’s no was respected.', charitable_reading: 'Jules may see Saturday as part of a broader worry they want to raise.', confidence: 'moderate' },
    { id: 'Q4', concept: 'ad_hominem', turn: 'T15', quote: 'you told me yourself you feel insecure about me and Rowan', how_it_operates: 'Points to a trait of the person raising the concern as an explanation for the concern.', fails_to_establish: 'That Sam’s account of Saturday is inaccurate.', charitable_reading: 'Jules may be answering “why talk to Dee?” literally.', confidence: 'tentative' },
    { id: 'Q5', concept: 'tu_quoque', turn: 'T20', quote: 'And what about last month?', how_it_operates: 'Responds to a criticism by pointing at the critic’s conduct.', fails_to_establish: 'That Sam’s Saturday concern is unfounded.', charitable_reading: 'Jules may have a real, separate grievance about being left out of plans.', confidence: 'strong' },
    { id: 'Q6', concept: 'hasty_generalization', turn: 'T20', quote: 'You always do this.', how_it_operates: 'Generalises from one example (last month) to “always”.', fails_to_establish: 'A pattern.', charitable_reading: 'A frustrated way of saying “this has happened before”.', confidence: 'moderate' },
    { id: 'Q7', concept: 'hasty_generalization', turn: 'T21', quote: 'You always turn it around.', how_it_operates: 'Sam generalises in return — and immediately corrects it.', fails_to_establish: 'A pattern (Sam withdraws the claim).', charitable_reading: 'Sam names it themself: “that’s not fair of me, not always.”', confidence: 'strong' },
  ],
  mechanisms: [
    { concept: 'md_moral_justification', observation: 'Jules says they were “only trying to look after” Rowan.', effect: 'The discussion shifts from what happened after Sam’s no to why Jules acted.', possible_function: 'Protecting a self-image as caring; explaining motive.', intent: 'Unknown. The purpose may be sincere; sincerity does not settle the concern about conduct.', alternative: 'Jules may be voicing genuine worry about Rowan, not justifying anything.', limitation: 'Bandura’s framework describes general tendencies; one phrase does not show moral disengagement.', confidence: 'moderate', evidence: [ev('T7', 'I was only trying to look after them.')] },
    { concept: 'triangulation', observation: 'Tension between Sam and Jules is routed through Rowan’s needs and Dee’s opinion.', effect: 'Sam’s no is answered with other people’s needs and views.', possible_function: 'Adding weight to Jules’s position.', intent: 'Unknown.', alternative: 'In a triad, other partners are legitimately involved; Rowan’s week may simply have been on Jules’s mind.', limitation: 'Mentioning a third person is not triangulation by itself.', confidence: 'tentative', evidence: [ev('T7'), ev('T13')] },
    { concept: 'darvo', observation: 'Denial of pressure (00:24), then criticism of Sam (01:10, 01:18), and a description of Jules as the one being wronged (01:03, 02:05).', effect: 'The focus moves from Sam’s concern to Jules’s feelings and Sam’s reliability.', possible_function: 'Defending against an accusation.', intent: 'Unknown.', alternative: 'Jules may feel genuinely accused and hurt; that is common when a concern is raised.', limitation: 'The elements resemble DARVO but alternate with partial acknowledgment (02:21). Denial alone is not DARVO. This is a resemblance, not an established pattern.', confidence: 'tentative', evidence: [ev('T4'), ev('T11'), ev('T15'), ev('T23')] },
    { concept: 'commitment_consistency', observation: 'An earlier (disputed) arrangement is cited as covering a later, specific situation.', effect: 'Sam’s no is framed as breaking an agreement.', possible_function: 'Making the refusal look inconsistent.', intent: 'Unknown.', alternative: 'Jules may genuinely value the weekend arrangement.', limitation: 'What was agreed is disputed.', confidence: 'moderate', evidence: [ev('T17')] },
    { concept: 'invalidating_responses', observation: 'Sam’s disclosure (“felt like I didn’t have a choice… felt sick”) is followed by Jules’s feelings, then by criticism of Sam.', effect: 'The disclosure goes unacknowledged until much later, and only partly.', possible_function: '', intent: 'Unknown.', alternative: 'Jules may not have registered the disclosure in the moment.', limitation: 'Research on invalidating responses comes mostly from other contexts.', confidence: 'moderate', evidence: [ev('T10'), ev('T11')] },
  ],
  flags: [
    { polarity: 'concern', kind: 'pressure_after_refusal', title: 'Asked again after saying no', explanation: 'Reported for Saturday by Sam. Jules confirms asking more than once but disputes calling it pressure. The night itself is not recorded.', by: 'Jules', confidence: 'moderate', evidence: [ev('T3', 'And you kept going.'), ev('T4', "Asking twice isn't pressure, that's communication.")] },
    { polarity: 'concern', kind: 'third_party_justification', title: 'Another partner’s needs used to justify continuing', explanation: 'Rowan’s week was the reason given for asking again (reported) and is defended as the reason tonight. Rowan says they didn’t want anyone staying for them unwillingly.', by: 'Jules', confidence: 'strong', evidence: [ev('T7', 'Because Rowan did have a terrible week!'), ev('T22', "I don't want anyone staying because of me if they don't want to.")] },
    { polarity: 'concern', kind: 'minimization', title: 'Concern minimised', explanation: '“You stayed, though” treats going along as proof it was fine.', by: 'Jules', confidence: 'moderate', evidence: [ev('T9', 'You stayed, though. Nobody locked the door.')] },
    { polarity: 'concern', kind: 'responsibility_shift', title: 'Responsibility moved onto Sam', explanation: 'Replies turn to Sam’s insecurity, Dee’s view of Sam, and an older grievance.', by: 'Jules', confidence: 'moderate', evidence: [ev('T13'), ev('T15'), ev('T20')] },
    { polarity: 'concern', kind: 'other_concern', title: 'Private disclosure used in the argument', explanation: 'Something Sam shared in confidence is raised to explain away the complaint.', by: 'Jules', confidence: 'strong', evidence: [ev('T15'), ev('T16', 'I told you that in private.')] },
    { polarity: 'positive', kind: 'acknowledges_impact', title: 'Rowan acknowledges the impact', explanation: 'Rowan says “not like that” and that nobody should stay for them unwillingly.', by: 'Rowan', confidence: 'strong', evidence: [ev('T22', 'But not like that.')] },
    { polarity: 'positive', kind: 'specific_repair', title: 'Specific repair commitment', explanation: 'Rowan commits to treating Sam’s no as final and saying so.', by: 'Rowan', confidence: 'strong', evidence: [ev('T24', "If Sam says no, that's it. I'll say so too.")] },
    { polarity: 'positive', kind: 'checks_consent', title: 'Checks consent before continuing', explanation: 'Rowan asks Sam whether continuing tomorrow is okay and proposes keeping others out.', by: 'Rowan', confidence: 'strong', evidence: [ev('T29', 'is it okay if we keep talking about this tomorrow?')] },
    { polarity: 'positive', kind: 'corrects_misunderstanding', title: 'Self-correction', explanation: 'Sam catches their own generalisation and withdraws it.', by: 'Sam', confidence: 'strong', evidence: [ev('T21', "Okay, that's not fair of me, not always.")] },
    { polarity: 'positive', kind: 'acknowledges_impact', title: 'Partial acknowledgment', explanation: 'Jules acknowledges Sam’s experience while maintaining nothing wrong was done.', by: 'Jules', confidence: 'moderate', evidence: [ev('T26', 'I hear that it felt like pressure to you.')] },
  ],
  competing_explanations: [
    { explanation: 'This is mostly a disagreement about what “pressure” means, not about what happened.', supporting: 'Jules confirms asking more than once and citing Rowan (00:24, 00:40); Sam disputes only the count.', unexplained: 'It doesn’t account for the replies about Dee, insecurity and last month.', would_change: 'A different account of Saturday from Jules.', support: 'strong' },
    { explanation: 'Jules saw the asking as ordinary persuasion and didn’t realise Sam’s no was firm.', supporting: 'Jules calls it “communication” and states a caring purpose.', unexplained: 'Sam says no was said more than once; repeating a request after a no is the concern regardless of how firm it seemed.', would_change: 'Evidence that Sam’s no was unclear or became a yes without further asking.', support: 'moderate' },
    { explanation: 'Jules feels excluded and overburdened, and Saturday became a vehicle for other grievances.', supporting: 'Jules says they’re holding everything together and raises last month’s plans.', unexplained: 'It doesn’t answer whether Sam’s no was respected.', would_change: 'A separate conversation in which Jules’s grievances are addressed.', support: 'moderate' },
    { explanation: 'Sam’s complaint reflects insecurity rather than Saturday (Jules’s reading).', supporting: 'Second-hand view from Dee; Sam’s private disclosure.', unexplained: 'Sam’s account is specific and partly confirmed by Jules. Insecurity, if present, would not make a no less valid.', would_change: 'Evidence that Sam did not say no, or said yes.', support: 'not_established' },
  ],
  reformulations: [
    { speaker: 'Jules', turn: 'T4', kind: 'accountable_reformulation', text: 'I did ask you again after you said no, and I brought up Rowan. I didn’t mean it as pressure, but I can see that it was. I’m sorry.', note: 'Keeps Jules’s point about intent while owning the conduct.' },
    { speaker: 'Jules', turn: 'T20', kind: 'stronger_argument', text: 'Separately from Saturday, I felt left out when you made plans with your sister without telling us. Can we talk about that another time?', note: 'Keeps Jules’s grievance without using it to answer Sam’s concern.' },
    { speaker: 'Jules', turn: 'T17', kind: 'stronger_argument', text: 'When you joined, I understood weekends as something we all shared. Can we check whether we actually agree on that?', note: 'Turns a disputed claim into a question.' },
    { speaker: 'Sam', turn: 'T21', kind: 'stronger_argument', text: 'When I raise something, I’d like us to stay on it before we move to other things.', note: 'Replaces “you always” with a specific, checkable request.' },
  ],
  playbook: [
    {
      goal: 'boundary',
      approach: 'direct_boundary',
      finding: 'Sam’s no was met with further requests (reported; partly confirmed by Jules).',
      script: 'When I say no, I need that to be the end of it for that night. I’m not asking you to agree it was pressure. I’m telling you what I need from now on.',
      follow_up: 'Can you agree to that?',
      branches: [
        { if_they: 'say it wasn’t pressure', you_could: 'We see it differently. I’m not asking you to agree on that, just on what happens next time.' },
        { if_they: 'agree', you_could: 'Thank you. That’s what I needed.' },
        { if_they: 'bring up another issue', you_could: 'That matters too. Let’s talk about it separately. I want to finish this first.' },
      ],
      stop_condition: 'If the no is argued with again, you can end the conversation. Your boundary doesn’t depend on their agreement.',
      concepts: ['boundaries_not_arguments', 'consent'],
    },
    {
      goal: 'clarify',
      approach: 'reduce_third_party',
      finding: 'Rowan’s needs and Dee’s view were brought into the disagreement.',
      script: 'I’d like us to keep this between the three of us, and let each person speak for themselves, including Rowan.',
      follow_up: 'Can we agree not to bring other people’s opinions about us into our conversations?',
      branches: [
        { if_they: 'say they need someone to talk to', you_could: 'That’s fair. I’m asking that it not be used against me in our conversations.' },
        { if_they: 'refuse', you_could: 'Then I’ll be more careful about what I share. That’s my choice to make.' },
      ],
      stop_condition: 'You can’t control who someone talks to; you can decide what you share.',
      concepts: ['triangulation'],
    },
    {
      goal: 'repair',
      approach: 'repair_invitation',
      finding: 'Rowan made a specific commitment.',
      script: 'What you said tonight, “if Sam says no, that’s it”, meant a lot. Can we make that a rule for all three of us?',
      follow_up: 'What would help us remember it in the moment?',
      branches: [
        { if_they: 'agree', you_could: 'Let’s say it out loud with Jules tomorrow, so we’re all on the same page.' },
        { if_they: 'hesitate', you_could: 'What part of it doesn’t sit right with you?' },
      ],
      stop_condition: 'A commitment is only as good as what happens next time. Watch for follow-through, not just words.',
      concepts: ['repair'],
    },
    {
      goal: 'de_escalate',
      approach: 'tactical_empathy',
      finding: 'Jules described feeling like “a monster” and like the one holding everything together.',
      script: 'It sounds like you’ve been carrying a lot for the three of us, and this felt like an accusation.',
      follow_up: 'What would help you hear my concern without feeling attacked?',
      branches: [
        { if_they: 'soften', you_could: 'Thank you. I’m not trying to make you the bad guy. I need my no to count.' },
        { if_they: 'argue again about whether it was pressure', you_could: 'I’m going to stop here. We can pick this up when we’re both calmer.' },
      ],
      stop_condition: 'Optional. You don’t have to soothe anyone before your no counts. Stop if empathy is met with more argument.',
      concepts: ['tactical_empathy'],
    },
    {
      goal: 'firm_rebuttal',
      approach: 'firm_rebuttal',
      finding: 'Jules argued that no force means no pressure, and that staying means it was fine.',
      script: 'You didn’t force me. I’m not saying you did. I said no, and you asked again and brought up Rowan. Both of those things are true. Staying doesn’t mean my no didn’t count.',
      follow_up: '',
      branches: [{ if_they: 'repeat that it was communication', you_could: 'We’re not going to agree on the word. I’ve told you what I need.' }],
      stop_condition: 'A rebuttal can correct the record. It can’t make someone agree. Don’t escalate to win.',
      concepts: ['non_sequitur', 'false_dilemma'],
    },
    {
      goal: 'understand',
      approach: 'intent_vs_conduct',
      finding: 'Jules’s good intention was offered in place of an answer about conduct.',
      script: 'I believe you were trying to look after Rowan. And the way it happened still didn’t respect my no.',
      follow_up: '',
      branches: [{ if_they: 'say “so I can’t care about Rowan?”', you_could: 'You can. Caring about Rowan isn’t the issue. Asking me again after a no is.' }],
      stop_condition: 'Separating intent from conduct is for your clarity. It doesn’t require them to agree.',
      concepts: ['md_moral_justification'],
    },
    {
      goal: 'persuade',
      approach: 'principled_negotiation',
      finding: 'The weekend arrangement is disputed.',
      script: 'Let’s look at weekends as something we decide together now. What does each of us actually want from them?',
      follow_up: 'Could we try it for a month and check in?',
      branches: [{ if_they: 'say it was already agreed', you_could: 'Maybe it was for you two. I wasn’t part of it, so I’d like us to agree it again, all three of us.' }],
      stop_condition: 'This is for logistics, not consent. A schedule never decides whether you say yes to something on a given night.',
      concepts: ['principled_negotiation', 'agreements_layers'],
    },
    {
      goal: 'disengage',
      approach: 'disengagement',
      finding: 'The debate about whether the no counted was going in circles.',
      script: 'I’m going to leave this here for tonight. I’ll text tomorrow.',
      follow_up: '',
      branches: [{ if_they: 'push to keep going', you_could: 'I’ve said I’m done for tonight. We’ll talk tomorrow.' }],
      stop_condition: 'Leaving a conversation is always an option. If you feel unsafe at any point, leave and contact someone you trust or a local support service.',
      concepts: [],
    },
  ],
  unknowns: [
    'What exactly happened on Saturday, including how many times Sam was asked.',
    'Whether Jules accepts the proposed rule.',
    'What Dee said, when, and why Jules discussed the relationship with Dee.',
    'Whether Sam ever agreed to the weekend arrangement.',
    'Who said “That’s… fair, actually” at 01:38.',
    'Tone of voice throughout; the [laughs] and [crosstalk] marks can’t be checked without audio.',
  ],
};
