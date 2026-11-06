import { describe, expect, it } from 'vitest';
import { applyAliases, formatForModel, parseTimestampSeconds, parseTranscript, UNATTRIBUTED } from '../parser';

describe('parseTranscript', () => {
  it('reads "Name: text" lines, numbers turns and keeps continuation lines with their speaker', () => {
    const t = parseTranscript('Sam: Can we talk?\nJules: Okay.\nSure.\nSam: Thanks.');
    expect(t.speakers).toEqual(['Sam', 'Jules']);
    expect(t.turns.map((x) => x.id)).toEqual(['T1', 'T2', 'T3']);
    expect(t.turns[1].text).toBe('Okay.\nSure.');
    expect(t.turns[1].speaker).toBe('Jules');
  });

  it('reads WhatsApp-style exports with date and time', () => {
    const t = parseTranscript('[14/03/2026, 21:02] Morgan: Can we talk about dinner?\n[14/03/2026, 21:03] Alex: Yes.');
    expect(t.turns).toHaveLength(2);
    expect(t.turns[0].speaker).toBe('Morgan');
    expect(t.turns[0].timestamp).toBe('14/03/2026, 21:02');
    expect(t.turns[0].text).toBe('Can we talk about dinner?');
    // A clock time is not an offset into a recording.
    expect(t.turns[0].seconds).toBeNull();
  });

  it('reads leading offsets as seconds into a recording', () => {
    const t = parseTranscript('00:12 Sam: Hello\n01:05 Jules: Hi');
    expect(t.turns[1].timestamp).toBe('01:05');
    expect(t.turns[1].seconds).toBe(65);
    expect(parseTimestampSeconds('1:02:03')).toBe(3723);
  });

  it('reads WebVTT voice tags', () => {
    const t = parseTranscript('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<v Sam>I said no.</v>\n\n00:00:04.000 --> 00:00:05.000\n<v Jules>Okay.</v>');
    expect(t.turns.map((x) => [x.speaker, x.text])).toEqual([
      ['Sam', 'I said no.'],
      ['Jules', 'Okay.'],
    ]);
  });

  it('reads JSON message arrays', () => {
    const t = parseTranscript(JSON.stringify([{ sender: 'A', text: 'one' }, { sender: 'B', message: 'two' }]));
    expect(t.format).toBe('JSON');
    expect(t.turns.map((x) => x.speaker)).toEqual(['A', 'B']);
  });

  it('records uncertainty as flags instead of resolving it, and leaves bracketed notes out of word counts', () => {
    const t = parseTranscript('Sam: [inaudible] ... I said no.\nJules: [crosstalk] You did not. [laughs]\nRowan?: Maybe.');
    expect(t.turns[0].flags).toContain('inaudible');
    expect(t.turns[0].wordCount).toBe(3);
    expect(t.turns[1].flags).toContain('overlap');
    expect(t.turns[1].annotations).toEqual(['[crosstalk]', '[laughs]']);
    expect(t.turns[2].speaker).toBe('Rowan');
    expect(t.turns[2].flags).toContain('uncertain_attribution');
  });

  it('marks text without speaker labels as unattributed rather than guessing', () => {
    const t = parseTranscript('I told them I was tired.\n\nThey kept asking anyway.');
    expect(t.turns.every((x) => x.speaker === UNATTRIBUTED)).toBe(true);
    expect(t.turns.every((x) => x.flags.includes('uncertain_attribution'))).toBe(true);
  });

  it('does not treat sentence fragments ending in a colon as speakers', () => {
    const t = parseTranscript('Sam: Here is what happened.\nAnd then she said: fine.\nJules: Okay.');
    expect(t.speakers).toEqual(['Sam', 'Jules']);
    expect(t.turns[0].text).toContain('And then she said: fine.');
  });
});

describe('applyAliases', () => {
  it('replaces speaker labels and bracketed spoken names, and discloses both', () => {
    const t = parseTranscript('Priya Shah: Hi Sam.\nSam: Hi Priya.');
    const { transcript, disclosures } = applyAliases(t, [{ original: 'Priya Shah', alias: 'P', replaceInText: true }]);
    expect(transcript.speakers).toEqual(['P', 'Sam']);
    expect(transcript.turns[1].text).toBe('Hi [P].');
    expect(transcript.turns[1].flags).toContain('redaction');
    expect(disclosures.length).toBe(2);
  });

  it('changes nothing when no alias is given', () => {
    const t = parseTranscript('A: x\nB: y');
    expect(applyAliases(t, [{ original: 'A', alias: ' ', replaceInText: true }]).transcript).toBe(t);
  });
});

describe('formatForModel', () => {
  it('writes one line per turn with id, timestamp, speaker and flags', () => {
    const t = parseTranscript('00:01 Sam: One\nline two\n00:05 Jules: [inaudible] Two');
    expect(formatForModel(t).split('\n')).toEqual(['[T1] (00:01) Sam: One / line two', '[T2] (00:05) Jules: {flags: inaudible} [inaudible] Two']);
  });
});
