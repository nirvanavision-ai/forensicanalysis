import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CaseCtx, TABS, type CaseUI, type TabId } from './components/caseContext';
import { SaveDialog, SettingsDialog } from './components/Dialogs';
import { EvidenceDrawer, type DrawerTarget } from './components/EvidenceDrawer';
import { IconDownload, IconExit, IconPlus, IconPrint, IconSettings } from './components/icons';
import { Intake, type Draft } from './components/Intake';
import { Logo } from './components/Logo';
import { PrintReport } from './components/PrintReport';
import { Audit } from './components/tabs/Audit';
import { Briefing } from './components/tabs/Briefing';
import { Inspector } from './components/tabs/Inspector';
import { Knowledge } from './components/tabs/Knowledge';
import { Playbook } from './components/tabs/Playbook';
import { demoCase } from './data/demos';
import { defaultContext, newId, parseCaseFile, type CaseFile } from './lib/case';
import { analyseWithClaude, EngineError, MODELS, type Progress } from './lib/claude';
import { keywordScan } from './lib/lexical';
import { applyAliases, parseTranscript, type Transcript } from './lib/parser';
import { emptyAnalysis } from './lib/schema';
import { DEFAULT_SETTINGS, deleteEverything, deleteSaved, listSaved, loadSaved, loadSettings, persistSettings, saveCase, type Settings } from './lib/storage';
import { EXIT_URL, escapeAction } from './lib/quickExit';
import { checkQuote } from './lib/verify';
import { Room } from './room/Room';

const SPEAKER_VARS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const emptyDraft = (): Draft => ({ raw: '', fileName: '', context: defaultContext(), aliases: [] });

function titleFor(t: Transcript): string {
  const s = t.speakers.filter((x) => x !== 'Unattributed');
  if (!s.length) return 'Untitled conversation';
  const names = s.length <= 3 ? s.join(s.length === 2 ? ' and ' : ', ') : `${s.slice(0, 3).join(', ')} and others`;
  return `Conversation: ${names}`;
}

function collectConcepts(c: CaseFile): Set<string> {
  const a = c.analysis;
  const s = new Set<string>();
  const add = (ids: string[]) => ids.forEach((i) => s.add(i));
  a.findings.forEach((f) => add(f.concepts));
  a.annotations.forEach((x) => add(x.concepts));
  a.decoder.forEach((x) => add(x.concepts));
  a.reasoning_issues.forEach((x) => s.add(x.concept));
  a.mechanisms.forEach((x) => s.add(x.concept));
  a.playbook.forEach((x) => add(x.concepts));
  return s;
}

export function App({ embedded }: { embedded: CaseFile | null }) {
  const initial = useMemo(loadSettings, []);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [caseFile, setCaseFile] = useState<CaseFile | null>(embedded);
  const [view, setView] = useState<'intake' | 'case' | 'room'>(embedded ? 'case' : 'intake');
  // The Analysis Room stays mounted once opened, so a running session survives a trip to the start
  // screen. Its key changes on "Delete everything" to clear it.
  const [roomOpened, setRoomOpened] = useState(false);
  const [roomKey, setRoomKey] = useState(0);
  const [tab, setTab] = useState<TabId>('briefing');
  const [drawer, setDrawer] = useState<DrawerTarget | null>(null);
  const [selectedTurn, setSelectedTurn] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState<Progress | null>(null);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [saved, setSaved] = useState(listSaved);
  const [dialog, setDialog] = useState<'settings' | 'save' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastEsc = useRef(0);
  const drawerOpen = useRef(false);
  drawerOpen.current = drawer !== null;

  // Appearance
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Discreet tab title and icon
  useEffect(() => {
    document.title = settings.discreetTitle ? 'Notes' : 'Subtext';
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      if (!link.dataset.original) link.dataset.original = link.href;
      link.href = settings.discreetTitle
        ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%23999'/%3E%3C/svg%3E"
        : link.dataset.original;
    }
  }, [settings.discreetTitle]);

  const quickExit = useCallback(() => {
    abortRef.current?.abort();
    try {
      document.title = 'Weather';
      document.body.innerHTML = '';
      window.sessionStorage.clear();
    } catch {
      /* leave regardless */
    }
    window.location.replace(EXIT_URL);
  }, []);

  // Esc closes whatever is open first (a dialog, then the evidence panel). Only two presses in a
  // row with nothing left to close count as the quick exit; a held-down key never does.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const dialogOpen = !!document.querySelector('dialog[open]');
      const r = escapeAction({
        last: lastEsc.current,
        now: Date.now(),
        repeat: e.repeat,
        composing: e.isComposing,
        somethingOpen: dialogOpen || drawerOpen.current || !!document.fullscreenElement,
      });
      lastEsc.current = r.last;
      if (r.action === 'exit') quickExit();
      else if (r.action === 'close' && !dialogOpen) setDrawer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quickExit]);

  // Print: render the full report only while printing (Ctrl+P or the Print button).
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);
  const print = () => {
    flushSync(() => setPrinting(true));
    window.print();
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const openCase = (c: CaseFile) => {
    setCaseFile(c);
    setView('case');
    setTab('briefing');
    setDrawer(null);
    setSelectedTurn(null);
    window.scrollTo(0, 0);
  };

  const prepared = () => {
    const parsed = parseTranscript(draft.raw);
    return applyAliases(parsed, draft.aliases);
  };

  const analyse = async () => {
    const { transcript, disclosures } = prepared();
    const ac = new AbortController();
    abortRef.current = ac;
    setError(null);
    setBusy({ phase: 'connecting', chars: 0 });
    try {
      const r = await analyseWithClaude({
        apiKey,
        model: settings.model,
        transcript,
        context: draft.context,
        aliasDisclosures: disclosures,
        signal: ac.signal,
        onProgress: setBusy,
      });
      openCase({
        app: 'subtext',
        version: 1,
        id: newId(),
        title: titleFor(transcript),
        createdAt: new Date().toISOString(),
        fictional: false,
        engine: {
          kind: 'claude',
          model: r.model,
          note: r.repairs.length ? `${r.note} ${r.repairs.length} item${r.repairs.length === 1 ? ' was' : 's were'} adjusted or removed to fit Subtext’s fixed format.` : r.note,
        },
        transcript,
        aliasDisclosures: disclosures,
        context: draft.context,
        analysis: r.analysis,
        keywordCues: keywordScan(transcript),
      });
    } catch (e) {
      const ee = e instanceof EngineError ? e : new EngineError('unknown', 'Something went wrong while analysing.', e instanceof Error ? e.message : undefined);
      if (ee.kind !== 'cancelled') setError({ message: ee.message, detail: ee.detail });
    } finally {
      setBusy(null);
      abortRef.current = null;
    }
  };

  const keywordOnly = () => {
    const { transcript, disclosures } = prepared();
    openCase({
      app: 'subtext',
      version: 1,
      id: newId(),
      title: titleFor(transcript),
      createdAt: new Date().toISOString(),
      fictional: false,
      engine: { kind: 'keyword', model: 'none', note: 'Offline keyword scan on this device. No AI analysis was run.' },
      transcript,
      aliasDisclosures: disclosures,
      context: draft.context,
      analysis: emptyAnalysis(),
      keywordCues: keywordScan(transcript),
    });
  };

  const importFile = async (f: File) => {
    try {
      const r = parseCaseFile(JSON.parse(await f.text()));
      if (r.ok) openCase(r.value);
      else setToast(`That file isn’t a Subtext analysis (${r.error}).`);
    } catch {
      setToast('That file could not be read.');
    }
  };

  const speakerOrder = caseFile?.transcript.speakers ?? [];
  const ui: CaseUI | null = useMemo(() => {
    if (!caseFile) return null;
    const present = new Set(caseFile.transcript.speakers);
    return {
      c: caseFile,
      speakerColor: (label) => {
        const i = speakerOrder.indexOf(label);
        return i >= 0 && i < SPEAKER_VARS.length ? SPEAKER_VARS[i] : 'var(--s5)';
      },
      isPresent: (label) => present.has(label),
      openTurn: (turn, quote) => {
        setDrawer({ type: 'turn', turn, quote });
        setSelectedTurn(turn);
      },
      openConcept: (id) => setDrawer({ type: 'concept', id }),
      goTo: (t, anchor) => {
        setTab(t);
        if (anchor?.startsWith('turn-')) setSelectedTurn(anchor.slice(5));
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.scrollTo({ top: 0 });
          }),
        );
      },
      check: (ev) => checkQuote(caseFile.transcript, ev),
      citedConcepts: collectConcepts(caseFile),
      toast: setToast,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseFile]);

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = TABS.length;
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    setTab(TABS[j].id);
    document.getElementById(`tab-${TABS[j].id}`)?.focus();
  };

  const kept = !!caseFile && saved.some((s) => s.id === caseFile.id);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <button
            type="button"
            className="brand"
            onClick={() => {
              setView('intake');
              window.scrollTo({ top: 0 });
            }}
            aria-label="Subtext home"
          >
            <Logo size={32} />
            <span className="brand-name">Subtext</span>
          </button>
          {view === 'case' && caseFile ? (
            <div className="header-case">
              <span className="header-case-title hide-sm">{caseFile.title.replace(/ \(fictional[^)]*\)/, '')}</span>
              {caseFile.fictional ? <span className="fiction-badge">Fictional example</span> : null}
            </div>
          ) : null}
          {view === 'room' ? (
            <div className="header-case">
              <span className="header-case-title hide-sm">Analysis Room</span>
            </div>
          ) : null}
          <div className="header-actions">
            {view === 'case' && caseFile ? (
              <>
                <button type="button" className="btn btn-quiet" onClick={() => setDialog('save')}>
                  <IconDownload />
                  <span className="hide-sm">Save</span>
                  <span className="visually-hidden show-sm">Save, share or delete</span>
                </button>
                <button type="button" className="btn btn-quiet hide-xs" onClick={print}>
                  <IconPrint />
                  <span className="hide-sm">Print</span>
                </button>
              </>
            ) : null}
            {view === 'case' && caseFile ? (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setDrawer(null);
                  setView('intake');
                  window.scrollTo({ top: 0 });
                }}
                title="Back to the start screen. This analysis stays open until you close the tab."
              >
                <IconPlus />
                <span className="hide-sm">New analysis</span>
                <span className="visually-hidden show-sm">New analysis</span>
              </button>
            ) : null}
            <button type="button" className="btn btn-quiet" onClick={() => setDialog('settings')} aria-label="Settings">
              <IconSettings />
            </button>
            <div className="exit-zone">
              <kbd className="exit-hint hide-sm" aria-hidden="true">
                Esc Esc
              </kbd>
              <button
                type="button"
                className="btn exit-btn"
                onClick={quickExit}
                title="Safety exit: clears this page and opens a weather search. Shortcut: press Esc twice."
                aria-label="Quick exit: clear this page and open a weather search"
              >
                <IconExit />
                <span className="exit-label">Quick exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {view === 'case' && caseFile && ui ? (
        <CaseCtx.Provider value={ui}>
          <nav className="tabbar no-print" aria-label="Analysis sections">
            <div className="tabs" role="tablist">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={tab === t.id}
                  aria-controls="main"
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => {
                    setTab(t.id);
                    window.scrollTo({ top: 0 });
                  }}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>
          <div className={`workspace${drawer ? ' has-drawer' : ''}`}>
            <main id="main" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={-1}>
              {caseFile.fictional ? (
                <div className="page" style={{ paddingBottom: 0 }}>
                  <div className="notice">
                    <span>
                      <strong>Fictional example.</strong> The people and the conversation are invented to show how Subtext works. Paste your own conversation to analyse it privately.
                    </span>
                  </div>
                </div>
              ) : null}
              {tab === 'briefing' ? <Briefing /> : null}
              {tab === 'transcript' ? <Inspector selectedTurn={selectedTurn} /> : null}
              {tab === 'knowledge' ? <Knowledge /> : null}
              {tab === 'audit' ? <Audit /> : null}
              {tab === 'playbook' ? <Playbook /> : null}
            </main>
            {drawer ? <EvidenceDrawer target={drawer} onClose={() => setDrawer(null)} /> : null}
          </div>
          {printing ? <PrintReport /> : null}
          <SaveDialog
            open={dialog === 'save'}
            onClose={() => setDialog(null)}
            c={caseFile}
            kept={kept}
            onPrint={print}
            onKeep={() => {
              if (saveCase(caseFile)) {
                setSaved(listSaved());
                setToast('Kept in this browser. You can delete it from Settings at any time.');
              } else setToast('This browser is not allowing storage. Download a file instead.');
            }}
            onDelete={() => {
              deleteSaved(caseFile.id);
              setSaved(listSaved());
              setCaseFile(null);
              setDrawer(null);
              setDialog(null);
              setView('intake');
              setToast('Analysis deleted.');
            }}
          />
        </CaseCtx.Provider>
      ) : view !== 'room' ? (
        <Intake
          draft={draft}
          setDraft={(d) => {
            setDraft(d);
            setError(null);
          }}
          hasKey={!!apiKey}
          model={settings.model}
          busy={busy}
          error={error}
          saved={saved}
          hasCurrent={!!caseFile}
          onReturn={() => setView('case')}
          onOpenRoom={() => {
            setRoomOpened(true);
            setView('room');
            window.scrollTo({ top: 0 });
          }}
          onDemo={(k) => openCase(demoCase(k))}
          onAnalyse={analyse}
          onKeyword={keywordOnly}
          onCancel={() => abortRef.current?.abort()}
          onOpenSettings={() => setDialog('settings')}
          onOpenSaved={(id) => {
            const c = loadSaved(id);
            if (c) openCase(c);
            else setToast('That saved analysis could not be opened.');
          }}
          onDeleteSaved={(id) => {
            deleteSaved(id);
            setSaved(listSaved());
            setToast('Deleted from this device.');
          }}
          onImport={importFile}
        />
      ) : null}
      {roomOpened ? (
        <Room
          key={roomKey}
          hidden={view !== 'room'}
          apiKey={apiKey}
          model={settings.model}
          modelLabel={MODELS.find((m) => m.id === settings.model)?.label ?? settings.model}
          onOpenSettings={() => setDialog('settings')}
          toast={setToast}
        />
      ) : null}

      <SettingsDialog
        open={dialog === 'settings'}
        onClose={() => setDialog(null)}
        settings={settings}
        apiKey={apiKey}
        onSave={(s, k) => {
          setSettings(s);
          setApiKey(k);
          persistSettings(s, k);
        }}
        onDeleteEverything={() => {
          const n = deleteEverything();
          setSettings(DEFAULT_SETTINGS);
          setApiKey('');
          setSaved([]);
          setCaseFile(null);
          setDrawer(null);
          setDraft(emptyDraft());
          setRoomKey((k) => k + 1);
          setRoomOpened(false);
          setView('intake');
          setDialog(null);
          setToast(n ? `Deleted ${n} item${n === 1 ? '' : 's'} Subtext had saved on this device.` : 'Nothing was saved on this device.');
        }}
      />
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </>
  );
}
