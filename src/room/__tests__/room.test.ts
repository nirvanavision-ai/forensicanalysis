import { afterEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod/v4';
import { cleanSituation, consensus, InputError, normTemp, RoomFatalError, type Engine } from '../engine';
import { clearHistory, deleteSession, keepSession, loadHistory, runAnalysis } from '../runner';
import { A_SEATS } from '../seats';
import type { AnalysisEvent, Assessment, Situation } from '../types';

const SEATS = ['gottman', 'voss', 'ramani'];
const sit: Situation = { title: 'Silent treatment after arguments', relationship: 'Partner', details: 'Me: Can we talk?\nThem: There is nothing to talk about.', goal: 'Know what to say', seats: SEATS };

/** A stand-in for Claude that answers each step with a fixed, valid shape. */
function fakeEngine(opts: { failSeat?: string; fatal?: boolean } = {}): Engine & { calls: number } {
  const eng = {
    calls: 0,
    async ask<T>(system: string, _user: string, schema: z.ZodType<T>): Promise<T> {
      eng.calls++;
      if (opts.fatal) throw new RoomFatalError('Your Claude API key was not accepted.');
      if (opts.failSeat && system.includes(`published ideas of ${A_SEATS.find((s) => s.id === opts.failSeat)!.name}.`)) throw new Error('Claude is busy right now.');
      const keys = Object.keys((schema as unknown as { shape: Record<string, unknown> }).shape);
      const has = (k: string) => keys.includes(k);
      let out: unknown;
      if (has('headline') && has('sayThis'))
        out = { temperature: 'strained', confidence: 14, headline: 'Withdrawal as punishment', statement: 'I hear stonewalling.', pattern: 'Stonewalling', redFlag: 'None clear', underneath: 'Fear of conflict', sayThis: 'I want to understand.' };
      else if (has('challenges'))
        out = {
          summary: 'Mostly agree.',
          patterns: [{ name: 'Stonewalling', seenBy: ['gottman', 'nobody'], evidence: '“nothing to talk about”' }],
          disagreements: [{ between: ['gottman', 'voss'], issue: 'Intent' }],
          missing: ['Their side'],
          safetyFlag: false,
          challenges: [{ seat: 'gottman', target: 'gottman', angle: 'self' }],
        };
      else if (has('target')) out = { target: 'gottman', temperature: 'red_flag', statement: 'You miss the pattern.' };
      else if (has('changedMind')) out = { temperature: 'RED FLAG', confidence: 7, changedMind: false, keyInsight: 'Name it.', oneMove: 'Ask once, calmly.', concedesTo: 'voss', disagreesMost: 'nobody' };
      else if (has('scripts'))
        out = { headline: 'h', whatsGoingOn: 'w', theirSide: 't', yourPart: 'y', scripts: [{ moment: 'm', line: 'l' }], boundaries: ['b'], watchFor: ['w'], avoid: ['a'], nextSteps: ['n'], dissent: 'd', safetyNote: null };
      else throw new Error(`unexpected schema ${keys.join(',')}`);
      return out as T;
    },
  };
  return eng;
}

describe('normTemp', () => {
  it('accepts the four labels in any case or spelling', () => {
    expect(normTemp('healthy')).toBe('HEALTHY');
    expect(normTemp('red_flag')).toBe('RED FLAG');
    expect(normTemp('Red-Flag')).toBe('RED FLAG');
    expect(normTemp('REDFLAG')).toBe('RED FLAG');
    expect(normTemp(' strained ')).toBe('STRAINED');
  });
  it('falls back to WORKABLE for anything else', () => {
    expect(normTemp('fine')).toBe('WORKABLE');
    expect(normTemp(undefined)).toBe('WORKABLE');
  });
});

describe('consensus', () => {
  const a = (temperature: string, confidence: number) => ({ temperature, confidence }) as unknown as Assessment;
  it('takes the most common final read and averages confidence', () => {
    const c = consensus({ x: a('STRAINED', 6), y: a('STRAINED', 8), z: a('HEALTHY', 4) });
    expect(c.temperature).toBe('STRAINED');
    expect(c.confidence).toBe(6);
  });
  it('breaks a tie toward the more cautious read', () => {
    expect(consensus({ x: a('WORKABLE', 5), y: a('RED FLAG', 5) }).temperature).toBe('RED FLAG');
  });
  it('clamps out-of-range confidence', () => {
    expect(consensus({ x: a('HEALTHY', 40) }).confidence).toBe(10);
  });
});

describe('cleanSituation', () => {
  it('trims, limits length and drops unknown or repeated panelists', () => {
    const s = cleanSituation({ title: '  t  ', details: 'x'.repeat(30000), seats: ['gottman', 'gottman', 'nobody', 'voss'] });
    expect(s.title).toBe('t');
    expect(s.details.length).toBe(20000);
    expect(s.seats).toEqual(['gottman', 'voss']);
  });
  it('refuses a situation without details or with fewer than two panelists', () => {
    expect(() => cleanSituation({ title: 't', details: '', seats: SEATS })).toThrow(InputError);
    expect(() => cleanSituation({ title: 't', details: 'd', seats: ['gottman'] })).toThrow(InputError);
  });
});

describe('runAnalysis', () => {
  it('runs every round in order and normalises what comes back', async () => {
    const events: AnalysisEvent[] = [];
    const eng = fakeEngine();
    await runAnalysis(eng, sit, (e) => events.push(e));
    const stages = events.filter((e) => e.type === 'stage').map((e) => (e as { stage: string }).stage);
    expect(stages).toEqual(['read', 'patterns', 'disagreements', 'crossexam', 'assessment', 'playbook']);
    expect(eng.calls).toBe(SEATS.length * 3 + 2);
    const read = events.find((e) => e.type === 'read') as Extract<AnalysisEvent, { type: 'read' }>;
    expect(read.data.temperature).toBe('STRAINED');
    expect(read.data.confidence).toBe(10);
    const pat = events.find((e) => e.type === 'patterns') as Extract<AnalysisEvent, { type: 'patterns' }>;
    expect(pat.data.patterns[0].seenBy).toEqual(['gottman']);
    // Nobody is told to cross-examine themselves.
    for (const c of pat.data.challenges) expect(c.target).not.toBe(c.seat);
    const crosses = events.filter((e) => e.type === 'crossexam') as Extract<AnalysisEvent, { type: 'crossexam' }>[];
    expect(crosses).toHaveLength(SEATS.length);
    for (const c of crosses) {
      expect(SEATS).toContain(c.data.target);
      expect(c.data.target).not.toBe(c.seat);
      expect(c.data.temperature).toBe('RED FLAG');
    }
    const as = events.find((e) => e.type === 'assessment') as Extract<AnalysisEvent, { type: 'assessment' }>;
    expect(as.data.disagreesMost).toBeNull();
    const pb = events.find((e) => e.type === 'playbook') as Extract<AnalysisEvent, { type: 'playbook' }>;
    expect(pb.data.temperature).toBe('RED FLAG');
    expect(events.at(-1)?.type).toBe('done');
  });

  it('carries on without a panelist whose call fails', async () => {
    const events: AnalysisEvent[] = [];
    const eng = fakeEngine({ failSeat: 'voss' });
    await runAnalysis(eng, sit, (e) => events.push(e));
    expect(events.some((e) => e.type === 'seat_error' && e.seat === 'voss')).toBe(true);
    expect(events.filter((e) => e.type === 'crossexam').map((e) => (e as { seat: string }).seat)).not.toContain('voss');
    expect(events.at(-1)?.type).toBe('done');
  });

  it('stops at once on a key or account problem', async () => {
    await expect(runAnalysis(fakeEngine({ fatal: true }), sit, () => {})).rejects.toThrow(RoomFatalError);
  });

  it('stops when the person presses Stop', async () => {
    const ac = new AbortController();
    const events: AnalysisEvent[] = [];
    const eng = fakeEngine();
    const p = runAnalysis(eng, sit, (e) => {
      events.push(e);
      if (e.type === 'patterns') ac.abort();
    }, ac.signal);
    await expect(p).rejects.toThrow('Stopped.');
    expect(events.some((e) => e.type === 'playbook')).toBe(false);
  });
});

describe('kept sessions', () => {
  afterEach(() => vi.unstubAllGlobals());
  const stubStorage = (limit = Infinity) => {
    const m = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => m.get(k) ?? null,
        setItem: (k: string, v: string) => {
          if (v.length > limit) throw new Error('QuotaExceededError');
          m.set(k, v);
        },
        removeItem: (k: string) => m.delete(k),
      },
    });
    return m;
  };
  const entry = (id: string) => ({ id, title: id, temperature: null, savedAt: '2026-11-12T00:00:00Z', events: [] });

  it('stores under the subtext. prefix so Delete everything removes it', () => {
    const m = stubStorage();
    expect(keepSession(entry('a'))).toBe(true);
    expect([...m.keys()]).toEqual(['subtext.room.history']);
    expect(loadHistory().map((x) => x.id)).toEqual(['a']);
  });
  it('deletes one or all', () => {
    const m = stubStorage();
    keepSession(entry('a'));
    keepSession(entry('b'));
    deleteSession('a');
    expect(loadHistory().map((x) => x.id)).toEqual(['b']);
    deleteSession('b');
    expect(m.size).toBe(0);
    keepSession(entry('c'));
    clearHistory();
    expect(m.size).toBe(0);
  });
  it('drops the oldest when the browser is full', () => {
    stubStorage(300);
    for (const id of ['a', 'b', 'c', 'd', 'e']) keepSession(entry(id));
    const ids = loadHistory().map((x) => x.id);
    expect(ids[0]).toBe('e');
    expect(ids.length).toBeLessThan(5);
  });
  it('reports when the browser stores nothing', () => {
    vi.stubGlobal('window', {});
    expect(keepSession(entry('a'))).toBe(false);
  });
});
