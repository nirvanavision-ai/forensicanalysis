/**
 * Offline keyword scan.
 *
 * Runs entirely on the device with no AI. It finds phrases that often (not always)
 * accompany a tag — "I'm sorry", "you made me", "can you" — and marks them as
 * keyword cues. A cue is a pointer for a human reader, never a finding.
 */
import type { Transcript } from './parser';
import type { TagId } from './taxonomy';

export interface KeywordCue {
  turn: string;
  tag: TagId;
  match: string;
}

const RULES: { tag: TagId; re: RegExp }[] = [
  {
    tag: 'refusal',
    re: /\b(i said no|no,? i don'?t want|i don'?t want (?:to|that|this)|please stop|stop it|i'?m not (?:okay|ok|comfortable) with|i'?m not doing (?:that|this)|i won'?t|leave me alone|not tonight|i'?m done)\b/i,
  },
  {
    tag: 'boundary',
    re: /\b(i need (?:some )?space|i need you to (?:stop|not)|that'?s (?:my|a) (?:boundary|limit)|i'?m not willing|i don'?t consent|don'?t (?:touch|text|call) me|i'?m not ready)\b/i,
  },
  { tag: 'request', re: /\b(can you|could you|would you|will you|i need you to|i want you to|i'?d like (?:you )?to|i'?m asking (?:you|for)|please\b)/i },
  { tag: 'disclosure', re: /\b(i felt|i feel|it made me feel|i was (?:scared|afraid|hurt|upset|uncomfortable)|i didn'?t feel|i haven'?t told|i need to tell you|i have to tell you)\b/i },
  { tag: 'acknowledgment', re: /\b(you'?re right|i hear you|i understand(?! why you)|that makes sense|i see (?:that|why|what)|fair (?:point|enough)|i get (?:it|that|why)|that'?s valid|i believe you)\b/i },
  { tag: 'repair', re: /\b(i'?m (?:so |really )?sorry (?:i|that|for)|i apologi[sz]e|my fault|i was wrong|i shouldn'?t have|it won'?t happen again|i'?ll (?:make sure|stop|do better|change)|how can i make (?:it|this) right)\b/i },
  { tag: 'denial', re: /\b(that never happened|i never (?:said|did|meant)|that'?s not what happened|that'?s not true|you'?re making (?:that|this|it) up|i didn'?t do (?:that|anything)|that'?s a lie)\b/i },
  { tag: 'minimization', re: /\b((?:it'?s|it was) not (?:a|that) big (?:deal)?|not a big deal|you'?re overreacting|it was just|calm down|you'?re (?:too|so) sensitive|it'?s nothing|blowing (?:this|it) out of proportion|it was one time|get over it)\b/i },
  { tag: 'responsibility_shift', re: /\b(you made me|because of you|if you hadn'?t|if you didn'?t|your fault|what about (?:you|when you)|you started (?:it|this)|you always|you never)\b/i },
  { tag: 'pressure', re: /\b(you have to|you owe|after everything|if you (?:really )?loved me|just this once|come on\b|don'?t be like that|it would mean (?:so much|a lot)|do it for (?:me|us|them)|you promised)\b/i },
  { tag: 'consent_check', re: /\b(is (?:that|this) (?:okay|ok|alright)|are you (?:okay|ok|comfortable|sure)|do you (?:still )?want to|we can stop|you can say no|is it okay if)\b/i },
  { tag: 'safety_concern', re: /\b(scared|afraid|unsafe|not safe|frightened|threaten(?:ed|ing)?|hurt me|grabbed|cornered)\b/i },
  { tag: 'uncertainty', re: /\b(maybe|i think|i guess|i'?m not sure|i don'?t know|i don'?t remember|probably|kind of|sort of|i can'?t remember)\b/i },
  { tag: 'topic_change', re: /\b(anyway|speaking of|that'?s not the point|let'?s talk about|the real (?:issue|problem) is|can we (?:just )?move on)\b/i },
  { tag: 'de_escalation', re: /\b(let'?s (?:take a break|slow down|pause)|i don'?t want to fight|can we start over|i'?m listening)\b/i },
];

export function keywordScan(t: Transcript): KeywordCue[] {
  const cues: KeywordCue[] = [];
  const speakers = new Set(t.speakers.map((s) => s.toLowerCase()));
  // Proper nouns that are not speakers and recur: possible references to absent people.
  const nameCounts = new Map<string, number>();
  for (const turn of t.turns) {
    for (const m of turn.text.matchAll(/(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,})\b/g)) {
      const n = m[1];
      if (speakers.has(n.toLowerCase()) || COMMON_CAPS.has(n)) continue;
      nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1);
    }
  }
  const absent = [...nameCounts].filter(([, c]) => c >= 2).map(([n]) => n);
  for (const turn of t.turns) {
    for (const r of RULES) {
      const m = turn.text.match(r.re);
      if (m) cues.push({ turn: turn.id, tag: r.tag, match: m[0] });
    }
    if (/\?\s*$/.test(turn.text) || /\?\s/.test(turn.text)) {
      const q = turn.text.match(/[^.!?\n]*\?/);
      cues.push({ turn: turn.id, tag: 'question', match: (q?.[0] ?? '?').trim() });
    }
    for (const n of absent) {
      if (new RegExp(`\\b${n}\\b`).test(turn.text)) {
        cues.push({ turn: turn.id, tag: 'third_party', match: n });
        break;
      }
    }
  }
  return cues;
}

const COMMON_CAPS = new Set([
  'The', 'And', 'But', 'This', 'That', 'Then', 'When', 'What', 'Why', 'How', 'Who', 'Where', 'Yes', 'Yeah', 'Okay', 'Well',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'God', 'Christmas', 'English', 'Just',
  'Like', 'Look', 'Listen', 'Sorry', 'Please', 'Fine', 'Sure', 'Because', 'Maybe', 'Also', 'Actually', 'Honestly', 'Really',
]);
