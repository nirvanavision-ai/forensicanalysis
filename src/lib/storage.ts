/**
 * Optional storage on this device. Nothing is written unless the person asks for it:
 * settings and the API key live in memory until "Remember on this device" is ticked, and a
 * case is stored only when they choose "Keep on this device". Everything Subtext writes uses
 * the `subtext.` prefix so "Delete everything" can find and remove it.
 *
 * Storage can be unavailable (private windows, blocked site data), so every access is guarded.
 */
import { parseCaseFile, type CaseFile } from './case';
import type { ModelId } from './claude';

const P = 'subtext.';

export interface Settings {
  model: ModelId;
  theme: 'system' | 'light' | 'dark';
  discreetTitle: boolean;
  remember: boolean;
}
export const DEFAULT_SETTINGS: Settings = { model: 'claude-opus-5-5', theme: 'system', discreetTitle: false, remember: false };

function ls(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function get(k: string): string | null {
  try {
    return ls()?.getItem(P + k) ?? null;
  } catch {
    return null;
  }
}
function set(k: string, v: string): boolean {
  try {
    ls()?.setItem(P + k, v);
    return true;
  } catch {
    return false;
  }
}
function del(k: string) {
  try {
    ls()?.removeItem(P + k);
  } catch {
    /* ignore */
  }
}

export function loadSettings(): { settings: Settings; apiKey: string } {
  const raw = get('settings');
  if (!raw) return { settings: DEFAULT_SETTINGS, apiKey: '' };
  try {
    const s = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>), remember: true };
    return { settings: s, apiKey: get('key') ?? '' };
  } catch {
    return { settings: DEFAULT_SETTINGS, apiKey: '' };
  }
}

/** Persist settings (and the key) only when the person has asked to be remembered. */
export function persistSettings(s: Settings, apiKey: string) {
  if (!s.remember) {
    del('settings');
    del('key');
    return;
  }
  set('settings', JSON.stringify({ model: s.model, theme: s.theme, discreetTitle: s.discreetTitle }));
  if (apiKey) set('key', apiKey);
  else del('key');
}

export interface SavedCaseMeta {
  id: string;
  title: string;
  savedAt: string;
  fictional: boolean;
}

export function listSaved(): SavedCaseMeta[] {
  try {
    const v = JSON.parse(get('cases') ?? '[]');
    return Array.isArray(v) ? (v as SavedCaseMeta[]) : [];
  } catch {
    return [];
  }
}

export function saveCase(c: CaseFile): boolean {
  const ok = set(`case.${c.id}`, JSON.stringify(c));
  if (!ok) return false;
  const list = listSaved().filter((x) => x.id !== c.id);
  list.unshift({ id: c.id, title: c.title, savedAt: new Date().toISOString(), fictional: c.fictional });
  return set('cases', JSON.stringify(list));
}

export function loadSaved(id: string): CaseFile | null {
  const raw = get(`case.${id}`);
  if (!raw) return null;
  try {
    const r = parseCaseFile(JSON.parse(raw));
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

export function deleteSaved(id: string) {
  del(`case.${id}`);
  set('cases', JSON.stringify(listSaved().filter((x) => x.id !== id)));
}

/** Remove every key Subtext has written to this browser's storage for this page. */
export function deleteEverything(): number {
  let n = 0;
  for (const store of [ls(), (() => {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  })()]) {
    if (!store) continue;
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.startsWith(P)) keys.push(k);
      }
      keys.forEach((k) => store.removeItem(k));
      n += keys.length;
    } catch {
      /* ignore */
    }
  }
  return n;
}
