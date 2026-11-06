import { useEffect, useMemo, useRef, useState } from 'react';
import type { Turn, TurnFlag } from '../../lib/parser';
import { TAGS, TAG_LABEL, type TagId } from '../../lib/taxonomy';
import { referencedTurns } from '../../lib/verify';
import { useCaseUI } from '../caseContext';
import { Highlighted } from '../highlight';
import { IconClose, IconPin, IconSearch, IconUpload } from '../icons';
import { Section, Speaker } from '../ui';

export const TURN_FLAG_LABEL: Record<TurnFlag, string> = {
  inaudible: 'Inaudible part',
  overlap: 'Overlapping speech',
  uncertain_attribution: 'Speaker uncertain',
  redaction: 'Name replaced',
  annotation: 'Annotator note',
};

export function Inspector({ selectedTurn }: { selectedTurn: string | null }) {
  const { c, openTurn } = useCaseUI();
  const a = c.analysis;
  const [q, setQ] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [tag, setTag] = useState('');
  const [topic, setTopic] = useState('');
  const [onlyCited, setOnlyCited] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const cited = useMemo(() => referencedTurns(a), [a]);
  const tagsByTurn = useMemo(() => {
    const m = new Map<string, { tag: TagId; cue: boolean }[]>();
    for (const an of a.annotations) m.set(an.turn, [...(m.get(an.turn) ?? []), { tag: an.tag, cue: false }]);
    for (const cue of c.keywordCues) {
      const list = m.get(cue.turn) ?? [];
      if (!list.some((x) => x.tag === cue.tag)) m.set(cue.turn, [...list, { tag: cue.tag, cue: true }]);
    }
    return m;
  }, [a.annotations, c.keywordCues]);
  const quotesByTurn = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const an of a.annotations) if (an.quote) m.set(an.turn, [...(m.get(an.turn) ?? []), an.quote]);
    for (const cue of c.keywordCues) m.set(cue.turn, [...(m.get(cue.turn) ?? []), cue.match]);
    return m;
  }, [a.annotations, c.keywordCues]);
  const usedTags = useMemo(() => {
    const s = new Set<TagId>();
    tagsByTurn.forEach((v) => v.forEach((x) => s.add(x.tag)));
    return TAGS.filter((t) => s.has(t.id));
  }, [tagsByTurn]);

  const stats = useMemo(() => {
    const total = c.transcript.turns.reduce((n, t) => n + t.wordCount, 0) || 1;
    return c.transcript.speakers.map((s) => {
      const ts = c.transcript.turns.filter((t) => t.speaker === s);
      const words = ts.reduce((n, t) => n + t.wordCount, 0);
      return { s, turns: ts.length, words, share: Math.round((words / total) * 100) };
    });
  }, [c.transcript]);

  const topicTurns = topic ? new Set(a.topics.find((t) => t.id === topic)?.turns ?? []) : null;
  const needle = q.trim().toLowerCase();
  const visible = c.transcript.turns.filter(
    (t) =>
      (!speaker || t.speaker === speaker) &&
      (!tag || tagsByTurn.get(t.id)?.some((x) => x.tag === tag)) &&
      (!topicTurns || topicTurns.has(t.id)) &&
      (!onlyCited || cited.has(t.id)) &&
      (!needle || t.text.toLowerCase().includes(needle) || t.speaker.toLowerCase().includes(needle)),
  );

  const togglePin = (id: string) => setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-3)));
  const byId = (id: string) => c.transcript.turns.find((t) => t.id === id);

  return (
    <div className="page">
      <Section
        id="speakers"
        title="Who spoke, and how much"
        intro="Word counts, not speaking time. A transcript cannot show how long anyone spoke, how loudly, or in what tone."
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Speaker</th>
                <th scope="col" className="num">
                  Turns
                </th>
                <th scope="col" className="num">
                  Word count
                </th>
                <th scope="col" className="num">
                  Share of words
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((r) => (
                <tr key={r.s}>
                  <td>
                    <Speaker name={r.s} />
                  </td>
                  <td className="num">{r.turns}</td>
                  <td className="num">{r.words}</td>
                  <td className="num">{r.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.transcript.warnings.length ? (
          <div className="notice notice-warn" style={{ marginTop: 12 }}>
            {c.transcript.warnings.join(' ')}
          </div>
        ) : null}
      </Section>

      {pinned.length ? (
        <Section id="compare" title="Side by side" intro="Pinned turns, for comparing what was said at different points.">
          <div className="compare">
            {pinned.map((id) => {
              const t = byId(id);
              if (!t) return null;
              return (
                <div key={id} className="panel panel-tight">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="row">
                      <strong className="small">{t.id}</strong>
                      {t.timestamp ? <span className="xs muted">{t.timestamp}</span> : null}
                      <Speaker name={t.speaker} />
                    </span>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => togglePin(id)} aria-label={`Unpin ${t.id}`}>
                      <IconClose />
                    </button>
                  </div>
                  <p className="source" style={{ margin: '8px 0 0' }}>
                    <Highlighted text={t.text} quotes={quotesByTurn.get(t.id) ?? []} />
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      <Section
        id="transcript-list"
        title="Transcript"
        intro={
          c.engine.kind === 'keyword'
            ? 'Dashed labels are keyword cues found on this device. Read each one in context; a cue is not a finding.'
            : 'Marked passages are ones the analysis comments on. Select a turn to see what was observed, how it might be read, and what it cannot show.'
        }
        actions={
          <label className="btn btn-small" style={{ cursor: 'pointer' }}>
            <IconUpload />
            {audioUrl ? 'Change recording' : 'Play along with a recording'}
            <input
              type="file"
              accept="audio/*,video/*"
              className="visually-hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                setAudioUrl(URL.createObjectURL(f));
              }}
            />
          </label>
        }
      >
        {audioUrl ? (
          <div className="panel panel-tight" style={{ marginBottom: 14 }}>
            <audio ref={audioRef} src={audioUrl} controls style={{ width: '100%' }} />
            <p className="xs muted" style={{ margin: '6px 0 0' }}>
              The recording stays on this device and is never uploaded or saved. Turns with a timestamp get a play button.
            </p>
          </div>
        ) : null}
        <div className="filters no-print">
          <div className="field">
            <label htmlFor="f-q">Search words</label>
            <div style={{ position: 'relative' }}>
              <IconSearch style={{ position: 'absolute', left: 12, top: 13, color: 'var(--ink-3)' }} />
              <input id="f-q" className="input" style={{ paddingLeft: 38 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="A word or phrase" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-s">Speaker</label>
            <select id="f-s" className="select" value={speaker} onChange={(e) => setSpeaker(e.target.value)}>
              <option value="">Everyone</option>
              {c.transcript.speakers.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-t">Label</label>
            <select id="f-t" className="select" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">Any</option>
              {usedTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-topic">Topic</label>
            <select id="f-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={!a.topics.length}>
              <option value="">All topics</option>
              {a.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row no-print" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="check small">
            <input type="checkbox" checked={onlyCited} onChange={(e) => setOnlyCited(e.target.checked)} />
            Only turns the analysis refers to
          </label>
          <span className="small muted" aria-live="polite">
            Showing {visible.length} of {c.transcript.turns.length} turns
          </span>
        </div>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }} aria-label="Transcript turns">
          {visible.map((t) => (
            <TurnRow
              key={t.id}
              t={t}
              selected={selectedTurn === t.id}
              pinned={pinned.includes(t.id)}
              tags={tagsByTurn.get(t.id) ?? []}
              quotes={quotesByTurn.get(t.id) ?? []}
              onOpen={() => openTurn(t.id)}
              onPin={() => togglePin(t.id)}
              onPlay={
                audioUrl && t.seconds != null
                  ? () => {
                      const el = audioRef.current;
                      if (!el) return;
                      el.currentTime = t.seconds!;
                      void el.play();
                    }
                  : undefined
              }
            />
          ))}
        </ol>
        {!visible.length ? <p className="muted">No turns match these filters.</p> : null}
      </Section>
    </div>
  );
}

function TurnRow({
  t,
  selected,
  pinned,
  tags,
  quotes,
  onOpen,
  onPin,
  onPlay,
}: {
  t: Turn;
  selected: boolean;
  pinned: boolean;
  tags: { tag: TagId; cue: boolean }[];
  quotes: string[];
  onOpen: () => void;
  onPin: () => void;
  onPlay?: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);
  return (
    <li ref={ref} id={`turn-${t.id}`} className={`turn${selected ? ' selected' : ''}`} onClick={onOpen}>
      <div className="turn-meta">
        <button
          type="button"
          className="link-btn"
          style={{ color: 'inherit', fontWeight: 700, textDecoration: 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={`Open ${t.id} by ${t.speaker}`}
        >
          {t.id}
        </button>
        {t.timestamp ? <div>{t.timestamp}</div> : null}
      </div>
      <div>
        <div className="turn-head">
          <Speaker name={t.speaker} />
          {t.flags
            .filter((f) => f !== 'annotation')
            .map((f) => (
              <span key={f} className="flag-chip">
                {TURN_FLAG_LABEL[f]}
              </span>
            ))}
          <span style={{ marginLeft: 'auto' }} className="row no-print">
            {onPlay ? (
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}
              >
                Play
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-quiet btn-small"
              aria-pressed={pinned}
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              title={pinned ? 'Unpin' : 'Pin to compare side by side'}
            >
              <IconPin />
              <span className="visually-hidden">{pinned ? `Unpin ${t.id}` : `Pin ${t.id} to compare`}</span>
            </button>
          </span>
        </div>
        <p className="turn-text" style={{ margin: 0 }}>
          <Highlighted text={t.text} quotes={quotes} />
        </p>
        {t.annotations.length ? <p className="xs muted" style={{ margin: '4px 0 0' }}>Annotator notes: {t.annotations.join('; ')}</p> : null}
        {tags.length ? (
          <div className="turn-tags">
            {tags.map((x, i) => (
              <span key={i} className={`tag${x.cue ? ' tag-cue' : ''}`} title={x.cue ? 'Keyword cue (not a finding)' : 'Label from the analysis'}>
                {TAG_LABEL[x.tag]}
                {x.cue ? <span className="visually-hidden"> (keyword cue)</span> : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
