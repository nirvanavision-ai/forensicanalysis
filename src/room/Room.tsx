/**
 * The Analysis Room inside Subtext: a panel of AI interpretations of public figures' published
 * ideas reads a situation through one lens each, cross-examines, gives a final assessment, and
 * the Moderator writes a Playbook. Runs in the browser with the same Claude key and model as
 * Subtext. Nothing is stored unless the person chooses "Keep on this device".
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { createEngine, InputError, RoomCancelled, suggestPanel } from './engine';
import { clearHistory, deleteSession, keepSession, loadHistory, runAnalysis, type SavedSession } from './runner';
import { A_DEFAULT_SEATS, A_SEATS, A_SEAT_BY_ID } from './seats';
import { A_STAGES, RELATIONSHIPS, TEMPERATURES } from './types';
import type { AnalysisEvent, AStage, Assessment, CrossExam, Patterns, Playbook, Read, Situation, Temperature } from './types';
import './room.css';

interface Utterance {
  seat: string;
  text: string;
  badge: string;
  target?: string;
}

export const ROOM_DISCLAIMER =
  "Panelists are AI interpretations of public figures' published ideas. They are not the real people and are not affiliated with or endorsed by them. This is educational reflection based on one side of the story, not therapy, diagnosis, or legal advice.";

const STAGE_TEXT: Record<AStage, string> = {
  situation: 'Waiting to start.',
  read: 'Round 1: each panelist gives a first read.',
  patterns: 'The Moderator is mapping patterns.',
  disagreements: 'The Moderator is mapping disagreements.',
  crossexam: 'Round 2: panelists cross-examine each other.',
  assessment: 'Round 3: final assessments.',
  playbook: 'The Moderator is writing your Playbook.',
};

function Temp({ t }: { t: Temperature }) {
  return <span className={`room-temp room-temp-${t.replace(' ', '-')}`}>{t}</span>;
}

export function Room(props: {
  hidden: boolean;
  apiKey: string;
  model: string;
  modelLabel: string;
  onOpenSettings: () => void;
  toast: (msg: string) => void;
}) {
  const { apiKey, model } = props;
  // ---------- situation (kept in memory only) ----------
  const [title, setTitle] = useState('');
  const [relationship, setRelationship] = useState('');
  const [details, setDetails] = useState('');
  const [goal, setGoal] = useState('');
  const [seats, setSeats] = useState<string[]>(A_DEFAULT_SEATS);
  const [formError, setFormError] = useState<{ field: 'title' | 'details' | 'seats'; msg: string } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);
  const seatsRef = useRef<HTMLDivElement>(null);
  const [modNote, setModNote] = useState<{ reason: string; questions: string[] } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [past, setPast] = useState<SavedSession[]>(loadHistory);

  // ---------- room ----------
  const [view, setView] = useState<'situation' | 'room'>('situation');
  const [situation, setSituation] = useState<Situation | null>(null);
  const [stage, setStage] = useState<AStage>('situation');
  const [thinking, setThinking] = useState<Set<string>>(new Set());
  const [reads, setReads] = useState<Record<string, Read>>({});
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [crosses, setCrosses] = useState<Record<string, CrossExam>>({});
  const [assessments, setAssessments] = useState<Record<string, Assessment>>({});
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [spot, setSpot] = useState(0);
  const [follow, setFollow] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);
  const [session, setSession] = useState<{ id: string; events: AnalysisEvent[]; kept: boolean; replay: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const refreshPast = () => setPast(loadHistory());

  // Leave nothing running if the page goes away (for example the quick exit).
  useEffect(() => () => abortRef.current?.abort(), []);

  const clearForm = () => {
    setTitle('');
    setRelationship('');
    setDetails('');
    setGoal('');
    setSeats(A_DEFAULT_SEATS);
    setModNote(null);
    setFormError(null);
  };

  const resetRoom = () => {
    setStage('situation');
    setThinking(new Set());
    setReads({});
    setPatterns(null);
    setCrosses({});
    setAssessments({});
    setPlaybook(null);
    setErrors([]);
    setUtterances([]);
    setSpot(0);
    setFollow(true);
    setDetail(null);
    setSession(null);
  };

  const done = (seat: string) =>
    setThinking((t) => {
      const n = new Set(t);
      n.delete(seat);
      return n;
    });

  const handle = useCallback((ev: AnalysisEvent) => {
    switch (ev.type) {
      case 'session':
        setSituation(ev.situation);
        break;
      case 'stage':
        setStage(ev.stage);
        setThinking(new Set());
        break;
      case 'thinking':
        setThinking((t) => new Set(t).add(ev.seat));
        break;
      case 'read':
        done(ev.seat);
        setReads((o) => ({ ...o, [ev.seat]: ev.data }));
        setUtterances((u) => [...u, { seat: ev.seat, text: ev.data.statement, badge: `Read · ${ev.data.temperature} (${ev.data.confidence}/10)` }]);
        break;
      case 'patterns':
        setPatterns(ev.data);
        break;
      case 'crossexam':
        done(ev.seat);
        setCrosses((r) => ({ ...r, [ev.seat]: ev.data }));
        setUtterances((u) => [
          ...u,
          { seat: ev.seat, text: ev.data.statement, badge: `→ ${A_SEAT_BY_ID[ev.data.target]?.short ?? ev.data.target} · ${ev.data.temperature}`, target: ev.data.target },
        ]);
        break;
      case 'assessment':
        done(ev.seat);
        setAssessments((v) => ({ ...v, [ev.seat]: ev.data }));
        setUtterances((u) => [
          ...u,
          { seat: ev.seat, text: ev.data.keyInsight, badge: `Final · ${ev.data.temperature} (${ev.data.confidence}/10)${ev.data.changedMind ? ' · changed mind' : ''}` },
        ]);
        break;
      case 'playbook':
        setPlaybook(ev.data);
        break;
      case 'seat_error':
        done(ev.seat);
        setErrors((e) => {
          // Several panelists failing for the same reason show as one line.
          const name = A_SEAT_BY_ID[ev.seat]?.name ?? ev.seat;
          const i = e.findIndex((x) => x.endsWith(`: ${ev.message}`));
          if (i < 0) return [...e, `${name}: ${ev.message}`];
          const next = [...e];
          next[i] = `${e[i].slice(0, -(ev.message.length + 2))}, ${name}: ${ev.message}`;
          return next;
        });
        break;
      case 'error':
        setErrors((e) => [...e, ev.message]);
        break;
      case 'done':
        break;
    }
  }, []);

  const start = async () => {
    if (!apiKey) {
      props.onOpenSettings();
      return;
    }
    const s: Situation = { title: title.trim(), relationship, details: details.trim(), goal: goal.trim(), seats };
    const problem: { field: 'title' | 'details' | 'seats'; msg: string } | null = !s.title
      ? { field: 'title', msg: 'Write one short line about what’s going on.' }
      : !s.details
        ? { field: 'details', msg: 'Tell the story or paste the messages here.' }
        : s.seats.length < 2
          ? { field: 'seats', msg: 'Pick at least two panelists.' }
          : null;
    if (problem) {
      setFormError(problem);
      const el = problem.field === 'title' ? titleRef.current : problem.field === 'details' ? detailsRef.current : seatsRef.current;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el && problem.field !== 'seats') setTimeout(() => el.focus(), 300);
      return;
    }
    setFormError(null);
    resetRoom();
    setSituation(s);
    setView('room');
    setRunning(true);
    window.scrollTo({ top: 0 });
    const ac = new AbortController();
    abortRef.current = ac;
    const events: AnalysisEvent[] = [];
    const record = (ev: AnalysisEvent) => {
      if (ev.type !== 'thinking') events.push(ev);
      handle(ev);
    };
    let id: string | null = null;
    try {
      id = await runAnalysis(createEngine({ apiKey, model, signal: ac.signal }), s, record, ac.signal);
    } catch (e) {
      const msg = e instanceof RoomCancelled ? 'You stopped the session.' : (e as Error).message;
      events.push({ type: 'error', message: msg });
      setErrors((x) => [...x, msg]);
    } finally {
      abortRef.current = null;
      setRunning(false);
      setThinking(new Set());
      const sid = id ?? (events.find((e) => e.type === 'session') as { sessionId: string } | undefined)?.sessionId;
      if (sid && events.some((e) => e.type === 'read')) setSession({ id: sid, events, kept: false, replay: false });
    }
  };

  const replay = async (entry: SavedSession) => {
    resetRoom();
    setView('room');
    setRunning(true);
    window.scrollTo({ top: 0 });
    for (const ev of entry.events) {
      handle(ev);
      await new Promise((r) => setTimeout(r, ev.type === 'stage' ? 300 : 60));
    }
    setSession({ id: entry.id, events: entry.events, kept: true, replay: true });
    setRunning(false);
  };

  const keep = () => {
    if (!session || !situation) return;
    const ok = keepSession({ id: session.id, title: situation.title, temperature: playbook?.temperature ?? null, savedAt: new Date().toISOString(), events: session.events });
    if (ok) {
      setSession({ ...session, kept: true });
      refreshPast();
      props.toast('Kept in this browser. Delete it any time from the Room’s start page or Settings.');
    } else props.toast('This browser is not allowing storage.');
  };

  const suggest = async () => {
    if (!apiKey) {
      props.onOpenSettings();
      return;
    }
    setSuggesting(true);
    try {
      const r = await suggestPanel(createEngine({ apiKey, model }), { title, relationship, details, goal }, A_SEATS);
      if (r.seats.length >= 2) setSeats(r.seats);
      setModNote({ reason: r.reason, questions: r.questions });
    } catch (e) {
      setModNote({ reason: e instanceof InputError ? e.message : `Couldn’t reach the Moderator: ${(e as Error).message}`, questions: [] });
    } finally {
      setSuggesting(false);
    }
  };

  // ---------- speaker spotlight ----------
  useEffect(() => {
    if (follow && spot >= utterances.length && utterances.length) setSpot(utterances.length - 1);
  }, [utterances.length, follow, spot]);
  const current = utterances[Math.min(spot, utterances.length - 1)];
  const typed = useTypewriter(current?.text ?? '', `${spot}-${current?.seat}`);
  useEffect(() => {
    if (!follow || !current || typed.length < current.text.length) return;
    if (spot < utterances.length - 1) {
      const t = setTimeout(() => setSpot((s) => s + 1), 1600);
      return () => clearTimeout(t);
    }
  }, [typed, current, follow, spot, utterances.length]);

  // ---------- panelist detail (a native dialog, so Esc closes it before the quick exit counts) ----------
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (detail && !d.open) d.showModal();
    if (!detail && d.open) d.close();
  }, [detail]);

  const roomSeats = useMemo(() => (situation?.seats ?? seats).map((id) => A_SEAT_BY_ID[id]).filter(Boolean), [situation, seats]);
  const stageIdx = A_STAGES.findIndex((s) => s.id === stage);

  const badgeFor = (id: string) => {
    const a = assessments[id];
    if (a) return `${a.temperature} · ${a.confidence}/10`;
    const c = crosses[id];
    if (c) return `→ ${A_SEAT_BY_ID[c.target]?.short}`;
    const r = reads[id];
    if (r) return `${r.temperature} (${r.confidence}/10)`;
    return null;
  };

  const backToForm = () => {
    setView('situation');
    resetRoom();
    window.scrollTo({ top: 0 });
  };

  const calls = seats.length * 3 + 2;
  const d = detail ? A_SEAT_BY_ID[detail] : null;

  return (
    <main id={props.hidden ? undefined : 'main'} className="room" hidden={props.hidden}>
      {view === 'situation' ? (
        <div className="room-wrap">
          <section className="room-hero">
            <p className="room-kicker">Analysis Room</p>
            <h1>Put a situation in front of a panel.</h1>
            <p>
              Describe a conversation, a conflict, or a relationship dynamic. A panel of AI interpretations of psychology, communication and negotiation experts each read it through one lens,
              challenge each other, and hand you a Playbook with words you could use.
            </p>
            <p className="room-hero-note">
              This is a different kind of tool from Subtext’s analysis. It works from your account of what happened, so its points are not checked against a transcript, and the panelists’
              opinions are interpretations, not findings.
            </p>
          </section>

          <section className="panel room-card">
            <div className="room-row-between">
              <h2>The situation</h2>
              {title || details || goal ? (
                <button type="button" className="btn btn-quiet btn-small" onClick={() => confirm('Clear everything you’ve typed?') && clearForm()}>
                  Clear form
                </button>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="room-title">In one line, what’s going on?</label>
              <input
                id="room-title"
                ref={titleRef}
                className="input"
                aria-invalid={formError?.field === 'title' || undefined}
                aria-describedby={formError?.field === 'title' ? 'room-title-err' : undefined}
                maxLength={300}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formError?.field === 'title') setFormError(null);
                }}
                placeholder="For example: My partner goes silent for days after every disagreement"
              />
              {formError?.field === 'title' ? (
                <div id="room-title-err" className="room-field-err">
                  {formError.msg}
                </div>
              ) : null}
            </div>
            <div className="field">
              <span className="label" id="room-rel-l">
                Who is this with?
              </span>
              <div className="toggle-chips" role="group" aria-labelledby="room-rel-l">
                {RELATIONSHIPS.map((r) => (
                  <button key={r} type="button" className="toggle-chip" aria-pressed={relationship === r} onClick={() => setRelationship(relationship === r ? '' : r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="room-details">What happened? Paste the messages or the conversation if you have them.</label>
              <textarea
                id="room-details"
                ref={detailsRef}
                className="textarea"
                aria-invalid={formError?.field === 'details' || undefined}
                aria-describedby={formError?.field === 'details' ? 'room-details-err' : undefined}
                rows={9}
                maxLength={20000}
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  if (formError?.field === 'details') setFormError(null);
                }}
                placeholder={'Tell the story in your own words, or paste the messages. For example:\n\nMe: Can we talk about last night?\nThem: There’s nothing to talk about. You always do this.\n\nInclude how long it’s been going on and anything that feels important.'}
              />
              {formError?.field === 'details' ? (
                <div id="room-details-err" className="room-field-err">
                  {formError.msg}
                </div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="room-goal">What do you want out of this?</label>
              <input id="room-goal" className="input" maxLength={600} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="For example: Understand what’s really going on and know what to say next" />
            </div>
            <div className="notice" style={{ marginTop: 14 }}>
              <span>
                Use first names or nicknames, and leave out details that could identify someone. What you type stays in this tab until you start. If you’re in danger right now, contact local
                emergency services. In the US, call or text <strong>988</strong> or call <strong>1-800-799-7233</strong> (National Domestic Violence Hotline).
              </span>
            </div>
          </section>

          <section className="panel room-card">
            <div className="room-row-between">
              <h2>Who sits on the panel?</h2>
              <button type="button" className="btn btn-small" onClick={suggest} disabled={suggesting || !title.trim()}>
                {suggesting ? 'The Moderator is thinking…' : 'Let the Moderator pick'}
              </button>
            </div>
            {modNote ? (
              <div className="room-note" role="status">
                <strong>Moderator:</strong> {modNote.reason}
                {modNote.questions.length > 0 ? (
                  <ul>
                    {modNote.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            <div className="room-seat-grid" ref={seatsRef} role="group" aria-label="Panelists">
              {A_SEATS.map((s) => {
                const on = seats.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    className="room-seat-chip"
                    style={{ ['--accent' as string]: s.accent }}
                    onClick={() => {
                      setSeats((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]));
                      if (formError?.field === 'seats') setFormError(null);
                    }}
                  >
                    <span className="room-chip-face" aria-hidden="true">
                      <Avatar seat={s} />
                    </span>
                    <span className="room-chip-text">
                      <strong>
                        {s.name} <span className="room-ai-tag">AI</span>
                      </strong>
                      <span>{s.question}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {formError?.field === 'seats' ? <div className="room-field-err">{formError.msg}</div> : null}
            <div className="room-row-between" style={{ marginTop: 18 }}>
              <span className="small muted">
                {seats.length} panelists · 3 rounds · about {calls} Claude calls{apiKey ? ` with ${props.modelLabel}` : ''}
              </span>
              <button type="button" className="btn btn-primary" onClick={start}>
                {apiKey ? 'Start the session' : 'Add your Claude key to start'}
              </button>
            </div>
            <p className="xs muted" style={{ margin: '10px 0 0' }}>
              The session sends what you typed to Anthropic using your own API key, the same way Subtext’s full analysis does. Each call is billed to that key.
            </p>
          </section>

          {past.length > 0 ? (
            <section className="panel room-card">
              <div className="room-row-between">
                <h2>Kept sessions</h2>
                <button
                  type="button"
                  className="btn btn-quiet btn-small"
                  onClick={() => {
                    if (confirm('Delete every Analysis Room session kept in this browser?')) {
                      clearHistory();
                      refreshPast();
                    }
                  }}
                >
                  Delete all
                </button>
              </div>
              <p className="small muted">Kept only in this browser on this device.</p>
              <ul className="room-past">
                {past.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="link-btn" onClick={() => replay(p)}>
                      {p.title}
                    </button>
                    <span className="xs muted">{p.temperature ?? 'unfinished'}</span>
                    <button
                      type="button"
                      className="btn btn-quiet btn-small"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => {
                        deleteSession(p.id);
                        refreshPast();
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="room-disclaimer">{ROOM_DISCLAIMER}</p>
        </div>
      ) : (
        <div className="room-wrap">
          <nav className="room-stages no-print" aria-label="Session progress">
            <ol>
              {A_STAGES.map((s, i) => (
                <li key={s.id} className={i < stageIdx ? 'done' : i === stageIdx ? 'active' : ''} aria-current={i === stageIdx ? 'step' : undefined}>
                  {s.label}
                </li>
              ))}
            </ol>
            {running && !session?.replay ? (
              <button type="button" className="btn btn-small" onClick={() => abortRef.current?.abort()}>
                Stop
              </button>
            ) : null}
          </nav>
          <p className="visually-hidden" aria-live="polite">
            {running ? STAGE_TEXT[stage] : playbook ? 'The Playbook is ready.' : ''}
          </p>

          <section className="room-stage no-print" aria-label="The panel">
            <div className="room-arc">
              {roomSeats.map((s, i) => {
                const n = roomSeats.length;
                const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
                const left = 50 + t * 44;
                const top = 6 + t * t * 34;
                const scale = 0.86 + Math.abs(t) * 0.22;
                const speaking = current?.seat === s.id;
                const badge = badgeFor(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`room-seat${speaking ? ' speaking' : ''}${current?.target === s.id ? ' targeted' : ''}`}
                    style={{ left: `${left}%`, top: `${top}%`, transform: `translateX(-50%) scale(${scale})`, zIndex: Math.round(10 + Math.abs(t) * 10), ['--accent' as string]: s.accent }}
                    onClick={() => setDetail(s.id)}
                    aria-label={`${s.name}, AI interpretation. Show what they said.`}
                  >
                    {thinking.has(s.id) ? (
                      <span className="room-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : null}
                    <span className="room-face" aria-hidden="true">
                      <Avatar seat={s} speaking={speaking} />
                    </span>
                    <span className="room-nametag">{s.short}</span>
                    {badge ? <span className="room-seat-badge">{badge}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="room-table">
              {current ? (
                <div className="room-speech">
                  <div className="room-speech-head">
                    <span className="room-mini" aria-hidden="true">
                      <Avatar seat={A_SEAT_BY_ID[current.seat]} />
                    </span>
                    <strong>{A_SEAT_BY_ID[current.seat].name}</strong>
                    <span className="room-ai-tag">AI</span>
                    <span className="room-stance">{current.badge}</span>
                  </div>
                  <p>
                    {typed}
                    <span className="room-ghost-text" aria-hidden="true">
                      {current.text.slice(typed.length)}
                    </span>
                  </p>
                  <div className="room-speech-nav">
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={spot <= 0}
                      onClick={() => {
                        setFollow(false);
                        setSpot((s) => Math.max(0, s - 1));
                      }}
                    >
                      ‹ Previous
                    </button>
                    <span>
                      {Math.min(spot, utterances.length - 1) + 1} / {utterances.length}
                    </span>
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={spot >= utterances.length - 1}
                      onClick={() => {
                        setFollow(false);
                        setSpot((s) => s + 1);
                      }}
                    >
                      Next ›
                    </button>
                    {!follow ? (
                      <button type="button" className="btn btn-small" onClick={() => setFollow(true)}>
                        Follow live
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="room-speech waiting">
                  <p>{running ? 'The panel is reading your situation…' : errors.length ? 'The session stopped. See the message below.' : 'Waiting to start.'}</p>
                </div>
              )}
            </div>
          </section>

          {errors.length > 0 ? (
            <section className="notice notice-error room-errors" role="alert">
              <div>
                {errors.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
                {!running && !playbook ? (
                  <div className="room-row-between" style={{ marginTop: 10 }}>
                    <span className="small">Your situation is still filled in.</span>
                    <button type="button" className="btn btn-small no-print" onClick={backToForm}>
                      ‹ Back to the form
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {situation ? (
            <section className="panel room-card">
              <p className="room-kicker">Analysis Room · Situation</p>
              <p className="room-lead">{situation.title}</p>
              <div className="room-opts">
                {situation.relationship ? <span className="room-opt">{situation.relationship}</span> : null}
                {situation.goal ? (
                  <span className="room-opt">
                    <strong>Goal</strong> {situation.goal}
                  </span>
                ) : null}
              </div>
            </section>
          ) : null}

          {Object.keys(reads).length > 0 ? (
            <section className="panel room-card">
              <h2>Round 1 · The read</h2>
              <div className="room-pos-grid">
                {roomSeats
                  .filter((s) => reads[s.id])
                  .map((s) => {
                    const r = reads[s.id];
                    return (
                      <button key={s.id} type="button" className="room-pos" style={{ ['--accent' as string]: s.accent }} onClick={() => setDetail(s.id)}>
                        <span className="room-pos-head">
                          <strong>{s.name}</strong>
                          <Temp t={r.temperature} />
                        </span>
                        <span className="room-pos-headline">{r.headline}</span>
                        <span className="small muted">Red flag: {r.redFlag}</span>
                        <span className="room-say">Say this: “{r.sayThis}”</span>
                      </button>
                    );
                  })}
              </div>
            </section>
          ) : null}

          {patterns ? (
            <section className="panel room-card">
              <h2>Patterns</h2>
              <p>{patterns.summary}</p>
              <div className="room-list">
                {patterns.patterns.map((p, i) => (
                  <div key={i} className="room-item">
                    <strong>{p.name}</strong>
                    <div className="small">{p.evidence}</div>
                    {p.seenBy.length > 0 ? <div className="xs muted">Seen by {p.seenBy.map((id) => A_SEAT_BY_ID[id]?.short ?? id).join(', ')}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {patterns && stageIdx >= A_STAGES.findIndex((s) => s.id === 'disagreements') ? (
            <section className="panel room-card">
              <h2>Disagreements</h2>
              <ul className="room-lines">
                {patterns.disagreements.map((l, i) => (
                  <li key={i}>
                    <strong>{l.between.map((id) => A_SEAT_BY_ID[id]?.short ?? id).join(' vs ')}</strong> {l.issue}
                  </li>
                ))}
              </ul>
              {patterns.missing.length > 0 ? (
                <div className="room-note">
                  <strong>What the panel doesn’t know:</strong>
                  <ul>
                    {patterns.missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {Object.keys(crosses).length > 0 ? (
            <section className="panel room-card">
              <h2>Round 2 · Cross-exam</h2>
              <div className="room-list">
                {roomSeats
                  .filter((s) => crosses[s.id])
                  .map((s) => {
                    const c = crosses[s.id];
                    return (
                      <div key={s.id} className="room-feed-item" style={{ ['--accent' as string]: s.accent }}>
                        <span className="room-mini room-mini-lg" aria-hidden="true">
                          <Avatar seat={s} />
                        </span>
                        <div>
                          <div>
                            <strong>{s.name}</strong> <span className="muted">challenges</span> <strong>{A_SEAT_BY_ID[c.target]?.name}</strong>
                          </div>
                          <p>{c.statement}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          ) : null}

          {Object.keys(assessments).length > 0 ? (
            <section className="panel room-card">
              <h2>Round 3 · Assessment</h2>
              <TempTally assessments={assessments} />
              <div className="room-list">
                {roomSeats
                  .filter((s) => assessments[s.id])
                  .map((s) => {
                    const a = assessments[s.id];
                    return (
                      <div key={s.id} className="room-vote-row" style={{ ['--accent' as string]: s.accent }}>
                        <strong>{s.short}</strong>
                        <span className="room-stance">
                          <Temp t={a.temperature} /> {a.confidence}/10{a.changedMind ? ' · changed mind' : ''}
                        </span>
                        <span className="small">{a.keyInsight}</span>
                        <span className="small muted">
                          Next move: {a.oneMove} {a.concedesTo ? <>Moved by {A_SEAT_BY_ID[a.concedesTo]?.short}. </> : null}
                          {a.disagreesMost ? <>Disagrees most with {A_SEAT_BY_ID[a.disagreesMost]?.short}.</> : null}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>
          ) : null}

          {playbook && situation ? (
            <section className="panel room-card room-playbook">
              <div className="room-row-between">
                <h2>Playbook</h2>
                <div className="row no-print">
                  <button type="button" className="btn btn-primary btn-small" onClick={() => window.print()}>
                    Print or save as PDF
                  </button>
                  {session && !session.kept ? (
                    <button type="button" className="btn btn-small" onClick={keep}>
                      Keep on this device
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-quiet btn-small"
                    onClick={() => {
                      clearForm();
                      backToForm();
                    }}
                  >
                    New session
                  </button>
                </div>
              </div>
              {playbook.safetyNote ? (
                <div className="notice notice-safety" style={{ marginBottom: 14 }}>
                  <strong>{playbook.safetyNote}</strong>
                </div>
              ) : null}
              <div className="room-pb-hero">
                <div className="room-gauge">
                  <Temp t={playbook.temperature} />
                  <div className="room-gauge-bar" aria-hidden="true">
                    {TEMPERATURES.map((t, i) => (
                      <span key={t} className={i <= TEMPERATURES.indexOf(playbook.temperature) ? 'lit' : ''} />
                    ))}
                  </div>
                  <div className="xs muted">Panel average {playbook.confidence}/10 confidence</div>
                </div>
                <p className="room-lead">{playbook.headline}</p>
              </div>
              <p>{playbook.whatsGoingOn}</p>
              <div className="room-two">
                <div>
                  <h3>Their side</h3>
                  <p>{playbook.theirSide}</p>
                </div>
                <div>
                  <h3>Your part</h3>
                  <p>{playbook.yourPart}</p>
                </div>
              </div>
              <h3>Say this</h3>
              <div className="room-list">
                {playbook.scripts.map((s, i) => (
                  <div key={i} className="room-script">
                    <div className="xs muted">{s.moment}</div>
                    <div className="room-script-line">“{s.line}”</div>
                  </div>
                ))}
              </div>
              <div className="room-four">
                <div>
                  <h3>Boundaries</h3>
                  <ul>
                    {playbook.boundaries.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Watch for</h3>
                  <ul>
                    {playbook.watchFor.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Avoid</h3>
                  <ul>
                    {playbook.avoid.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Next steps</h3>
                  <ul>
                    {playbook.nextSteps.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="room-note" style={{ marginTop: 16 }}>
                <strong>Strongest dissent:</strong> {playbook.dissent}
              </div>
              <p className="xs muted">Suggestions generated by AI from your account. Scripts are options to adapt, not instructions.</p>
              <p className="room-disclaimer" style={{ textAlign: 'left' }}>
                {ROOM_DISCLAIMER}
              </p>
            </section>
          ) : null}
        </div>
      )}

      <dialog ref={dialogRef} className="room-drawer" onClose={() => setDetail(null)} aria-labelledby="room-drawer-title" style={d ? { ['--accent' as string]: d.accent } : undefined}>
        {d && detail ? (
          <div>
            <button type="button" className="btn btn-quiet btn-small room-drawer-close" onClick={() => setDetail(null)} aria-label="Close">
              ✕
            </button>
            <div className="room-drawer-face" aria-hidden="true">
              <Avatar seat={d} />
            </div>
            <h2 id="room-drawer-title">
              {d.name} <span className="room-ai-tag">AI interpretation</span>
            </h2>
            <p className="muted">“{d.question}”</p>
            {reads[detail] ? (
              <>
                <h3>
                  Read · {reads[detail].temperature} ({reads[detail].confidence}/10)
                </h3>
                <p>{reads[detail].statement}</p>
                <p className="small">
                  <strong>Pattern:</strong> {reads[detail].pattern}
                </p>
                <p className="small">
                  <strong>Red flag:</strong> {reads[detail].redFlag}
                </p>
                <p className="small">
                  <strong>Underneath:</strong> {reads[detail].underneath}
                </p>
                <p className="small">
                  <strong>Say this:</strong> “{reads[detail].sayThis}”
                </p>
              </>
            ) : null}
            {crosses[detail] ? (
              <>
                <h3>Cross-exam → {A_SEAT_BY_ID[crosses[detail].target]?.name}</h3>
                <p>{crosses[detail].statement}</p>
              </>
            ) : null}
            {assessments[detail] ? (
              <>
                <h3>
                  Final · {assessments[detail].temperature} ({assessments[detail].confidence}/10)
                </h3>
                <p>{assessments[detail].keyInsight}</p>
                <p className="small">
                  <strong>Next move:</strong> {assessments[detail].oneMove}
                </p>
              </>
            ) : null}
            {!reads[detail] ? <p className="muted">Hasn’t spoken yet.</p> : null}
          </div>
        ) : null}
      </dialog>
    </main>
  );
}

function TempTally({ assessments }: { assessments: Record<string, Assessment> }) {
  const all = Object.values(assessments);
  return (
    <div className="room-temp-tally">
      {TEMPERATURES.map((t) => (
        <div key={t}>
          <strong>{all.filter((a) => a.temperature === t).length}</strong>
          <Temp t={t} />
        </div>
      ))}
    </div>
  );
}

function useTypewriter(text: string, key: string) {
  const [n, setN] = useState(0);
  const reduce = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);
  useEffect(() => {
    setN(reduce ? text.length : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => Math.min(text.length, x + 2)), 18);
    return () => clearTimeout(t);
  }, [n, text]);
  return text.slice(0, n);
}
