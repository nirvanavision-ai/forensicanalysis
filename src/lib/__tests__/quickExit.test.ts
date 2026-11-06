import { describe, expect, it } from 'vitest';
import { ESC_WINDOW_MS, escapeAction, type EscState } from '../quickExit';

const base: EscState = { last: 0, now: 10_000, repeat: false, composing: false, somethingOpen: false };

/** Plays a sequence of Esc presses and returns the action of each. */
function play(presses: Partial<EscState>[]): string[] {
  let last = 0;
  return presses.map((p) => {
    const r = escapeAction({ ...base, ...p, last });
    last = r.last;
    return r.action;
  });
}

describe('quick exit on Esc', () => {
  it('leaves after two free presses within the window', () => {
    expect(play([{ now: 10_000 }, { now: 10_400 }])).toEqual(['arm', 'exit']);
  });

  it('does not leave when the presses are too far apart', () => {
    expect(play([{ now: 10_000 }, { now: 10_000 + ESC_WINDOW_MS + 1 }])).toEqual(['arm', 'arm']);
  });

  it('a press that closes a dialog or the evidence panel never counts', () => {
    // Esc closes the settings dialog, then Esc closes the evidence panel: nothing leaves.
    expect(play([{ now: 10_000, somethingOpen: true }, { now: 10_300, somethingOpen: true }])).toEqual(['close', 'close']);
    // Esc closes a dialog, then one free press: still armed only.
    expect(play([{ now: 10_000, somethingOpen: true }, { now: 10_300 }])).toEqual(['close', 'arm']);
    // A close between two free presses resets the count.
    expect(play([{ now: 10_000 }, { now: 10_200, somethingOpen: true }, { now: 10_400 }])).toEqual(['arm', 'close', 'arm']);
  });

  it('ignores a held-down key and text being composed', () => {
    expect(play([{ now: 10_000 }, { now: 10_030, repeat: true }, { now: 10_060, repeat: true }])).toEqual(['arm', 'ignore', 'ignore']);
    expect(play([{ now: 10_000, composing: true }, { now: 10_200 }])).toEqual(['ignore', 'arm']);
  });

  it('a deliberate second press after holding the key still leaves', () => {
    expect(play([{ now: 10_000 }, { now: 10_030, repeat: true }, { now: 10_500 }])).toEqual(['arm', 'ignore', 'exit']);
  });
});
