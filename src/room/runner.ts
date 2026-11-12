/**
 * Runs an Analysis Room session in the browser: one Claude call per panelist per round (in
 * parallel), then the moderator steps, reporting progress as events. Also keeps past sessions,
 * but only when the person chooses "Keep on this device".
 */
import { RoomCancelled, RoomFatalError, stepAssessment, stepCrossExam, stepPatterns, stepPlaybook, stepRead, type Engine } from './engine';
import type { AnalysisEvent, Assessment, CrossExam, Read, Situation } from './types';

export function newSessionId(title: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '');
  return `${stamp}_${slug || 'analysis'}`;
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runAnalysis(eng: Engine, sit: Situation, emit: (ev: AnalysisEvent) => void, signal?: AbortSignal) {
  const sessionId = newSessionId(sit.title);
  const stopIfCancelled = () => {
    if (signal?.aborted) throw new RoomCancelled('Stopped.');
  };

  async function perSeat<T>(label: string, seats: string[], fn: (seat: string) => Promise<T>, onDone: (seat: string, data: T) => void) {
    const results: Record<string, T> = {};
    await Promise.all(
      seats.map(async (seat) => {
        emit({ type: 'thinking', seat });
        try {
          const data = await fn(seat);
          results[seat] = data;
          onDone(seat, data);
        } catch (e) {
          if (e instanceof RoomFatalError || e instanceof RoomCancelled) throw e;
          emit({ type: 'seat_error', seat, message: `${label}: ${(e as Error).message}` });
        }
      }),
    );
    stopIfCancelled();
    return results;
  }

  emit({ type: 'session', sessionId, situation: sit });

  // ROUND 1: the read
  emit({ type: 'stage', stage: 'read' });
  const reads = await perSeat<Read>('read', sit.seats, (seat) => stepRead(eng, sit, seat), (seat, data) => emit({ type: 'read', seat, data }));
  if (Object.keys(reads).length === 0) throw new Error('No panelist produced a read. Check your API key in Settings and try again.');
  const spoke = sit.seats.filter((s) => reads[s]);

  // Patterns and disagreements
  emit({ type: 'stage', stage: 'patterns' });
  const patterns = await stepPatterns(eng, sit, reads);
  emit({ type: 'patterns', data: patterns });
  await pause(500);
  emit({ type: 'stage', stage: 'disagreements' });
  await pause(800);
  stopIfCancelled();

  // ROUND 2: cross-exam (only panelists who gave a read)
  emit({ type: 'stage', stage: 'crossexam' });
  const crosses = await perSeat<CrossExam>('cross-exam', spoke, (seat) => stepCrossExam(eng, sit, seat, reads, patterns), (seat, data) => emit({ type: 'crossexam', seat, data }));

  // ROUND 3: assessment
  emit({ type: 'stage', stage: 'assessment' });
  const assessments = await perSeat<Assessment>('assessment', spoke, (seat) => stepAssessment(eng, sit, seat, reads, crosses), (seat, data) => emit({ type: 'assessment', seat, data }));

  // Playbook
  emit({ type: 'stage', stage: 'playbook' });
  const playbook = await stepPlaybook(eng, sit, patterns, assessments);
  emit({ type: 'playbook', data: playbook });
  emit({ type: 'done', sessionId });
  return sessionId;
}

// ---------- past sessions, kept only when the person asks ----------
// Stored under Subtext's prefix, so Settings → "Delete everything" removes them too.
const HISTORY_KEY = 'subtext.room.history';
const MAX_SAVED = 25;

export interface SavedSession {
  id: string;
  title: string;
  temperature: string | null;
  savedAt: string;
  events: AnalysisEvent[];
}

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadHistory(): SavedSession[] {
  try {
    const raw = store()?.getItem(HISTORY_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as SavedSession[]) : [];
  } catch {
    return [];
  }
}

/** Returns false if this browser will not store anything. */
export function keepSession(entry: SavedSession): boolean {
  let list = [entry, ...loadHistory().filter((x) => x.id !== entry.id)].slice(0, MAX_SAVED);
  // If the browser runs out of room, drop the oldest until it fits.
  while (list.length) {
    try {
      const s = store();
      if (!s) return false;
      s.setItem(HISTORY_KEY, JSON.stringify(list));
      return true;
    } catch {
      list = list.slice(0, -1);
    }
  }
  return false;
}

export function deleteSession(id: string) {
  try {
    const rest = loadHistory().filter((x) => x.id !== id);
    if (rest.length) store()?.setItem(HISTORY_KEY, JSON.stringify(rest));
    else store()?.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function clearHistory() {
  try {
    store()?.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
