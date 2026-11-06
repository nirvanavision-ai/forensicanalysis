/**
 * Quick exit: where it goes and when the Esc key triggers it.
 *
 * The exit must be fast, but it must also never fire by accident. Escape is also the key that
 * closes dialogs and the evidence panel, so a press that closes something never counts, a held
 * key's auto-repeat never counts, and only two free presses in a row leave the page.
 */
export const EXIT_URL = 'https://www.google.com/search?q=weather';
export const ESC_WINDOW_MS = 1000;

export type EscState = {
  /** Time of the last press that counted towards the exit, or 0. */
  last: number;
  now: number;
  /** The browser is repeating a held-down key. */
  repeat: boolean;
  /** An input method (for example a Japanese or Chinese keyboard) is composing text. */
  composing: boolean;
  /** A dialog, the evidence panel or full-screen view is open, so this press closes it. */
  somethingOpen: boolean;
};

export type EscAction = 'ignore' | 'close' | 'arm' | 'exit';

export function escapeAction(s: EscState): { action: EscAction; last: number } {
  if (s.repeat || s.composing) return { action: 'ignore', last: s.last };
  if (s.somethingOpen) return { action: 'close', last: 0 };
  if (s.last > 0 && s.now - s.last < ESC_WINDOW_MS) return { action: 'exit', last: 0 };
  return { action: 'arm', last: s.now };
}
