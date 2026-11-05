import { describe, expect, it } from 'vitest';
import { findRanges } from '../../components/highlight';
import { parseTranscript } from '../parser';
import { checkQuote, isVerified } from '../verify';

const t = parseTranscript('Sam: When I said I didn’t want to stay over, I meant it.\nJules: Asking twice isn’t pressure — that’s communication.\nSam: Okay.');

describe('checkQuote', () => {
  it('accepts an exact quote', () => {
    expect(checkQuote(t, { turn: 'T1', quote: 'I meant it.' }).status).toBe('exact');
  });
  it('accepts a quote that differs only in quote marks, dashes or case', () => {
    expect(checkQuote(t, { turn: 'T2', quote: "asking twice isn't pressure - that's communication" }).status).toBe('normalized');
  });
  it('accepts a quote with an ellipsis when the parts appear in order', () => {
    expect(checkQuote(t, { turn: 'T1', quote: 'When I said … I meant it.' }).status).toBe('exact');
    expect(checkQuote(t, { turn: 'T1', quote: 'I meant it … When I said' }).status).toBe('not_found');
  });
  it('reports a real quote cited against the wrong turn', () => {
    expect(checkQuote(t, { turn: 'T3', quote: 'I meant it' })).toEqual({ status: 'other_turn', foundIn: 'T1' });
  });
  it('rejects words that are not in the transcript', () => {
    const r = checkQuote(t, { turn: 'T2', quote: 'You always do this' });
    expect(r.status).toBe('not_found');
    expect(isVerified(r)).toBe(false);
  });
  it('rejects a turn that does not exist', () => {
    expect(checkQuote(t, { turn: 'T99', quote: '' }).status).toBe('invalid_turn');
  });
  it('treats an empty quote as a whole-turn citation', () => {
    const r = checkQuote(t, { turn: 'T3', quote: '' });
    expect(r.status).toBe('whole_turn');
    expect(isVerified(r)).toBe(true);
  });
});

describe('findRanges', () => {
  it('finds quoted segments case-insensitively and merges overlaps', () => {
    const text = 'I said no. I said NO twice.';
    expect(findRanges(text, ['said no', 'I said no.'])).toEqual([[0, 10]]);
    expect(findRanges(text, ['no twice'])).toEqual([[18, 26]]);
  });
  it('highlights each part of an elided quote', () => {
    expect(findRanges('one two three four', ['one … four'])).toEqual([
      [0, 3],
      [14, 18],
    ]);
  });
});
