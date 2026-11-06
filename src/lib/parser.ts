/**
 * Tolerant transcript parser.
 *
 * Accepts the messy formats people actually have: "Name: text", timestamps in brackets
 * or parentheses, chat exports, SRT/VTT captions, Otter-style "Speaker  0:03" headers,
 * CSV and JSON. Nothing is rewritten: each turn keeps its exact text. Uncertainty
 * (inaudible, overlap, unclear attribution, redactions, stage directions) is recorded
 * as flags instead of being silently resolved.
 */

export type TurnFlag = 'inaudible' | 'overlap' | 'uncertain_attribution' | 'redaction' | 'annotation';

export interface Turn {
  id: string;
  index: number;
  speaker: string;
  timestamp: string | null;
  /** Seconds from the start of a recording, only when the timestamp is an offset (not a clock time). */
  seconds: number | null;
  text: string;
  flags: TurnFlag[];
  /** Bracketed stage directions or annotator notes found in the text, e.g. "[laughs]". */
  annotations: string[];
  /** Words in the text, excluding bracketed annotations. */
  wordCount: number;
  line: number;
}

export interface Transcript {
  turns: Turn[];
  speakers: string[];
  format: string;
  warnings: string[];
}

export const UNATTRIBUTED = 'Unattributed';

const TS_CORE = String.raw`\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?(?:\s?[AaPp]\.?[Mm]\.?)?`;
const DATE_CORE = String.raw`\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}`;
const DATETIME = String.raw`(?:${DATE_CORE},?\s+)?${TS_CORE}`;

// Speaker labels: 1–5 words, letters/digits and common name punctuation, optionally ending in "?".
const LABEL = String.raw`[\p{L}\p{N}][\p{L}\p{N} .'’\-_()#&]{0,38}?\??`;

const RE_WHATSAPP = new RegExp(String.raw`^\[?(${DATE_CORE},?\s+${TS_CORE})\]?\s*[-–—]?\s*(${LABEL})\s*:\s?(.*)$`, 'u');
const RE_TS_FIRST = new RegExp(String.raw`^[\[(]?(${DATETIME})[\])]?\s*[-–—|]?\s*(${LABEL})\s*:\s?(.*)$`, 'u');
const RE_LABEL_TS = new RegExp(String.raw`^(${LABEL})\s*[\[(](${DATETIME})[\])]\s*:?\s?(.*)$`, 'u');
const RE_LABEL = new RegExp(String.raw`^(?:\*\*)?(${LABEL})(?:\*\*)?\s*:\s?(.*)$`, 'u');
const RE_BRACKET_LABEL = new RegExp(String.raw`^\[(${LABEL})\]\s*:?\s?(.*)$`, 'u');
const RE_HEADER_TS = new RegExp(String.raw`^(${LABEL})\s{2,}(${TS_CORE})\s*$`, 'u');
const RE_TS_ONLY = new RegExp(String.raw`^[\[(]?(${TS_CORE})[\])]?\s+(.+)$`, 'u');
const RE_SRT_TIME = /^(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})/;
const RE_VTT_TIME = /^((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})/;
const RE_VTT_VOICE = /^<v(?:\.[^ >]*)?\s+([^>]+)>(.*?)(?:<\/v>)?$/;

const NOT_SPEAKERS = new Set(
  [
    'note', 'notes', 'context', 'update', 'edit', 'source', 'date', 'time', 'subject', 're', 'fwd', 'to', 'from', 'cc',
    'http', 'https', 'p.s', 'ps', 'warning', 'summary', 'question', 'answer', 'example', 'also', 'and', 'but', 'so',
    'then', 'because', 'like', 'i said', 'he said', 'she said', 'they said', 'translation',
  ].map((s) => s.toLowerCase()),
);

function normaliseLabel(raw: string): string {
  return raw.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

function plausibleLabel(label: string): boolean {
  const l = normaliseLabel(label);
  if (!l || l.length > 40) return false;
  if (NOT_SPEAKERS.has(l.toLowerCase().replace(/\?$/, ''))) return false;
  const words = l.split(' ');
  if (words.length > 5) return false;
  // Reject things that look like sentences ("I told him", "and then she").
  if (words.length >= 3 && /^(i|we|you|he|she|they|it|and|but|so|then|when|if)\b/i.test(l)) return false;
  return true;
}

export function parseTimestampSeconds(ts: string): number | null {
  if (/[AaPp]\.?[Mm]/.test(ts) || /[/]/.test(ts)) return null; // clock time or date: not an offset
  const m = ts.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const s = Number(m[3]);
  const ms = m[4] ? Number(m[4].padEnd(3, '0')) : 0;
  return h * 3600 + min * 60 + s + ms / 1000;
}

const RE_BRACKETED = /\[([^\]]{1,80})\]|\((inaudible|unintelligible|crosstalk|overlapping|laughs?|laughing|sighs?|sighing|crying|cries|pause|long pause|silence|whisper(?:s|ing)?|shouting|yelling|door [a-z]+|[a-z]+ (?:laughs|sighs|pauses))\)|\*([a-z][a-z ]{1,30})\*/gi;

const STAGE_WORDS =
  /^(laughs?|laughing|laughter|chuckles?|sighs?|sighing|pauses?|long pause|silence|crying|cries|sniff(?:les|ling)?|sobbing|whisper(?:s|ing)?|shout(?:s|ing)?|yell(?:s|ing)?|groans?|music|applause|noise|background noise|door\b.*|phone\b.*|coughs?|clears throat|beat|exhales?|inhales?)$/;

function analyseText(text: string): { flags: TurnFlag[]; annotations: string[]; wordCount: number } {
  const flags = new Set<TurnFlag>();
  const annotations: string[] = [];
  let stripped = text;
  for (const m of text.matchAll(RE_BRACKETED)) {
    const inner = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    const lower = inner.toLowerCase();
    if (/\b(inaudible|unintelligible|unclear|indistinct)\b/.test(lower)) flags.add('inaudible');
    else if (/\b(crosstalk|cross-talk|overlap|overlapping|talking over|interrupt)/.test(lower)) flags.add('overlap');
    else if (/^(redacted|name|name redacted|removed|\.\.\.|…)$/.test(lower) || /^█+$/.test(inner)) flags.add('redaction');
    else if (STAGE_WORDS.test(lower)) flags.add('annotation');
    else if (/^\p{Lu}[\p{L}'’\-]*$/u.test(inner) && m[1]) flags.add('redaction'); // [Alias] substitution
    else flags.add('annotation');
    annotations.push(m[0]);
    stripped = stripped.replace(m[0], ' ');
  }
  if (/█{2,}/.test(text)) flags.add('redaction');
  const wordCount = (stripped.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) ?? []).length;
  return { flags: [...flags], annotations, wordCount };
}

interface RawTurn {
  speaker: string | null;
  timestamp: string | null;
  text: string;
  line: number;
}

function finalise(raw: RawTurn[], format: string, warnings: string[]): Transcript {
  const canonical = new Map<string, string>();
  const turns: Turn[] = [];
  for (const r of raw) {
    const text = r.text.replace(/[ \t]+\n/g, '\n').trim();
    if (!text) continue;
    let speaker = r.speaker ? normaliseLabel(r.speaker) : UNATTRIBUTED;
    let uncertain = false;
    if (/^(unknown|unidentified|speaker\s*\?|\?+)$/i.test(speaker)) {
      uncertain = true;
    } else if (/\?$/.test(speaker)) {
      // "Rowan?" — attribution marked uncertain in the source. Keep the speaker, record the doubt.
      uncertain = true;
      speaker = speaker.replace(/\s*\?+$/, '');
    }
    const key = speaker.toLowerCase();
    if (canonical.has(key)) speaker = canonical.get(key)!;
    else canonical.set(key, speaker);
    const a = analyseText(text);
    const flags = a.flags;
    if (uncertain || speaker === UNATTRIBUTED) flags.push('uncertain_attribution');
    turns.push({
      id: `T${turns.length + 1}`,
      index: turns.length,
      speaker,
      timestamp: r.timestamp?.trim() || null,
      seconds: r.timestamp ? parseTimestampSeconds(r.timestamp) : null,
      text,
      flags: [...new Set(flags)],
      annotations: a.annotations,
      wordCount: a.wordCount,
      line: r.line,
    });
  }
  const speakers = [...new Set(turns.map((t) => t.speaker))];
  if (turns.length === 0) warnings.push('No text was found to analyse.');
  if (speakers.length === 1 && speakers[0] === UNATTRIBUTED && turns.length > 0) {
    warnings.push(
      'No speaker labels were detected, so each paragraph is shown as “Unattributed”. Add labels such as “Sam:” at the start of lines for a fuller analysis.',
    );
  }
  const unattributed = turns.filter((t) => t.speaker === UNATTRIBUTED).length;
  if (unattributed > 0 && speakers.length > 1) {
    warnings.push(`${unattributed} passage${unattributed === 1 ? '' : 's'} could not be attributed to a speaker and ${unattributed === 1 ? 'is' : 'are'} marked “Unattributed”.`);
  }
  return { turns, speakers, format, warnings };
}

function parseSubtitles(lines: string[], vtt: boolean): Transcript {
  const raw: RawTurn[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const m = (vtt ? RE_VTT_TIME : RE_SRT_TIME).exec(line);
    if (!m) {
      i++;
      continue;
    }
    const start = m[1].replace(',', '.');
    const startLine = i + 1;
    i++;
    const body: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      body.push(lines[i].trim());
      i++;
    }
    let speaker: string | null = null;
    let text = body.join('\n');
    const voice = RE_VTT_VOICE.exec(body[0] ?? '');
    if (voice) {
      speaker = voice[1];
      text = [voice[2], ...body.slice(1)].join('\n').replace(/<\/?v[^>]*>/g, '');
    } else {
      const lm = RE_LABEL.exec(body[0] ?? '');
      if (lm && plausibleLabel(lm[1])) {
        speaker = lm[1];
        text = [lm[2], ...body.slice(1)].join('\n');
      }
    }
    text = text.replace(/<[^>]+>/g, '');
    const prev = raw[raw.length - 1];
    // Captions often split one speaker's sentence across cues; merge consecutive cues from the same speaker.
    if (prev && speaker && prev.speaker === speaker) {
      prev.text += ' ' + text;
    } else if (prev && !speaker && prev.speaker && /^[-–]/.test(text) === false) {
      prev.text += ' ' + text;
    } else {
      raw.push({ speaker, timestamp: start.replace(/\.\d+$/, ''), text: text.replace(/^[-–]\s*/, ''), line: startLine });
    }
  }
  return finalise(raw, vtt ? 'WebVTT captions' : 'SRT captions', []);
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim()));
}

function parseCsv(text: string): Transcript | null {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return null;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const si = header.findIndex((h) => /^(speaker|name|author|from|sender|participant)$/.test(h));
  const ti = header.findIndex((h) => /^(text|message|utterance|content|body|transcript|line)$/.test(h));
  const ts = header.findIndex((h) => /^(time|timestamp|start|start time|date|datetime)$/.test(h));
  if (ti < 0) return null;
  const raw: RawTurn[] = rows.slice(1).map((r, i) => ({
    speaker: si >= 0 ? r[si] ?? null : null,
    timestamp: ts >= 0 ? r[ts] ?? null : null,
    text: r[ti] ?? '',
    line: i + 2,
  }));
  return finalise(raw, 'CSV', []);
}

function parseJson(text: string): Transcript | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? ((data as Record<string, unknown>).messages ?? (data as Record<string, unknown>).turns ?? (data as Record<string, unknown>).utterances)
      : null;
  if (!Array.isArray(arr)) return null;
  const pick = (o: Record<string, unknown>, keys: string[]) => {
    for (const k of keys) if (typeof o[k] === 'string' || typeof o[k] === 'number') return String(o[k]);
    return null;
  };
  const raw: RawTurn[] = arr
    .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
    .map((o, i) => ({
      speaker: pick(o, ['speaker', 'name', 'author', 'sender', 'from', 'participant', 'sender_name']),
      timestamp: pick(o, ['timestamp', 'time', 'start', 'date']),
      text: pick(o, ['text', 'message', 'content', 'body', 'utterance']) ?? '',
      line: i + 1,
    }));
  if (raw.length === 0) return null;
  return finalise(raw, 'JSON', []);
}

/** Parse free text into turns. */
export function parseTranscript(input: string): Transcript {
  const text = input.replace(/\r\n?/g, '\n').replace(/ /g, ' ').replace(/^﻿/, '');
  const trimmed = text.trim();
  if (!trimmed) return { turns: [], speakers: [], format: 'empty', warnings: [] };

  if (/^WEBVTT/.test(trimmed)) return parseSubtitles(text.split('\n'), true);
  if (/^\d+\s*\n\s*\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}\s*-->/.test(trimmed)) return parseSubtitles(text.split('\n'), false);
  if (/^[[{]/.test(trimmed)) {
    const j = parseJson(trimmed);
    if (j && j.turns.length) return j;
  }
  const firstLine = trimmed.split('\n')[0].toLowerCase();
  if (/,/.test(firstLine) && /(text|message|utterance|content)/.test(firstLine) && !/:/.test(firstLine)) {
    const c = parseCsv(trimmed);
    if (c && c.turns.length) return c;
  }

  const lines = text.split('\n');

  // First pass: collect candidate speaker labels to decide which "X:" prefixes are real speakers.
  const counts = new Map<string, number>();
  const bump = (l: string) => {
    if (!plausibleLabel(l)) return;
    const k = normaliseLabel(l).toLowerCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  };
  for (const raw of lines) {
    const line = raw.trim();
    let m: RegExpExecArray | null;
    if ((m = RE_WHATSAPP.exec(line))) bump(m[2]);
    else if ((m = RE_TS_FIRST.exec(line))) bump(m[2]);
    else if ((m = RE_LABEL_TS.exec(line))) bump(m[1]);
    else if ((m = RE_HEADER_TS.exec(line))) bump(m[1]);
    else if ((m = RE_BRACKET_LABEL.exec(line))) bump(m[1]);
    else if ((m = RE_LABEL.exec(line))) bump(m[1]);
  }
  const distinct = counts.size;
  const accepted = (label: string): boolean => {
    if (!plausibleLabel(label)) return false;
    const n = counts.get(normaliseLabel(label).toLowerCase()) ?? 0;
    if (n >= 2) return true;
    // A label used once is accepted when the transcript has few labels overall and it looks like a name.
    return distinct <= 8 && /^[\p{Lu}\p{N}]/u.test(normaliseLabel(label)) && normaliseLabel(label).split(' ').length <= 3;
  };

  const raw: RawTurn[] = [];
  let pendingHeader: { speaker: string; timestamp: string; line: number } | null = null;
  let current: RawTurn | null = null;
  let sawLabel = false;
  const push = (t: RawTurn) => {
    current = t;
    raw.push(t);
  };

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    const line = rawLine.trim();
    if (!line) {
      // A blank line ends an unlabelled paragraph; labelled turns may continue across blank lines only via a header.
      if (current && current.speaker === null) current = null;
      return;
    }
    let m: RegExpExecArray | null;
    if ((m = RE_WHATSAPP.exec(line)) && accepted(m[2])) {
      sawLabel = true;
      push({ speaker: m[2], timestamp: m[1], text: m[3], line: lineNo });
      return;
    }
    if ((m = RE_TS_FIRST.exec(line)) && accepted(m[2])) {
      sawLabel = true;
      push({ speaker: m[2], timestamp: m[1], text: m[3], line: lineNo });
      return;
    }
    if ((m = RE_LABEL_TS.exec(line)) && accepted(m[1])) {
      sawLabel = true;
      push({ speaker: m[1], timestamp: m[2], text: m[3], line: lineNo });
      return;
    }
    if ((m = RE_HEADER_TS.exec(line)) && accepted(m[1])) {
      sawLabel = true;
      pendingHeader = { speaker: m[1], timestamp: m[2], line: lineNo };
      current = null;
      return;
    }
    if ((m = RE_BRACKET_LABEL.exec(line)) && accepted(m[1]) && !/^\d/.test(m[1])) {
      sawLabel = true;
      push({ speaker: m[1], timestamp: null, text: m[2], line: lineNo });
      return;
    }
    if ((m = RE_LABEL.exec(line)) && accepted(m[1])) {
      sawLabel = true;
      push({ speaker: m[1], timestamp: null, text: m[2], line: lineNo });
      return;
    }
    if (pendingHeader) {
      const h: { speaker: string; timestamp: string; line: number } = pendingHeader;
      pendingHeader = null;
      push({ speaker: h.speaker, timestamp: h.timestamp, text: line, line: h.line });
      return;
    }
    const tsOnly = RE_TS_ONLY.exec(line);
    if (tsOnly && !current) {
      push({ speaker: null, timestamp: tsOnly[1], text: tsOnly[2], line: lineNo });
      return;
    }
    if (current) {
      (current as RawTurn).text += '\n' + line;
      return;
    }
    push({ speaker: null, timestamp: null, text: line, line: lineNo });
  });

  const warnings: string[] = [];
  return finalise(raw, sawLabel ? 'Labelled transcript' : 'Unlabelled text', warnings);
}

export interface AliasRule {
  original: string;
  alias: string;
  /** Also replace the original name where it is spoken inside the text, as "[Alias]". */
  replaceInText: boolean;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply aliases locally, before anything is analysed or sent anywhere.
 * Replacements inside quoted speech are bracketed so the substitution stays visible.
 */
export function applyAliases(t: Transcript, rules: AliasRule[]): { transcript: Transcript; disclosures: string[] } {
  const active = rules.filter((r) => r.alias.trim() && r.alias.trim() !== r.original);
  if (active.length === 0) return { transcript: t, disclosures: [] };
  const disclosures: string[] = [];
  const bySpeaker = new Map(active.map((r) => [r.original, r.alias.trim()]));
  let replacedInText = 0;
  const turns = t.turns.map((turn) => {
    let text = turn.text;
    for (const r of active) {
      if (!r.replaceInText) continue;
      const first = r.original.split(' ')[0];
      const names = [...new Set([r.original, first])].filter((n) => n.length >= 2 && n !== UNATTRIBUTED);
      for (const n of names) {
        const re = new RegExp(`(?<![\\p{L}\\[])${escapeRegExp(n)}(?![\\p{L}\\]])`, 'gu');
        text = text.replace(re, () => {
          replacedInText++;
          return `[${r.alias.trim()}]`;
        });
      }
    }
    const a = analyseText(text);
    const flags = new Set(turn.flags);
    if (text !== turn.text) flags.add('redaction');
    return {
      ...turn,
      speaker: bySpeaker.get(turn.speaker) ?? turn.speaker,
      text,
      annotations: a.annotations,
      wordCount: a.wordCount,
      flags: [...flags],
    };
  });
  for (const r of active) disclosures.push(`“${r.alias.trim()}” is an alias for a participant label in the original.`);
  if (replacedInText > 0)
    disclosures.push(
      `${replacedInText} spoken name${replacedInText === 1 ? ' was' : 's were'} replaced inside quotations with a bracketed alias, e.g. “[${active[0].alias.trim()}]”.`,
    );
  return {
    transcript: { ...t, turns, speakers: [...new Set(turns.map((x) => x.speaker))] },
    disclosures,
  };
}

/** The transcript as Claude sees it: one line per turn with its id, timestamp and speaker. */
export function formatForModel(t: Transcript): string {
  return t.turns
    .map((turn) => {
      const ts = turn.timestamp ? ` (${turn.timestamp})` : '';
      const flags = turn.flags.length ? ` {flags: ${turn.flags.join(', ')}}` : '';
      return `[${turn.id}]${ts} ${turn.speaker}:${flags} ${turn.text.replace(/\n/g, ' / ')}`;
    })
    .join('\n');
}
