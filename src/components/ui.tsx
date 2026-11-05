import { useContext, useState, type ReactNode } from 'react';
import { CONCEPT_BY_ID } from '../data/knowledgeBase';
import type { Evidence } from '../lib/schema';
import { BASIS_HELP, BASIS_LABEL, CONFIDENCE_HELP, CONFIDENCE_LABEL, type Basis, type Confidence } from '../lib/taxonomy';
import { isVerified, QUOTE_STATUS_LABEL } from '../lib/verify';
import { PrintCtx, useCaseUI } from './caseContext';
import { IconCheck, IconCopy } from './icons';

export function ConfidencePill({ level }: { level: Confidence }) {
  return (
    <span className={`pill pill-${level}`} title={CONFIDENCE_HELP[level]}>
      {CONFIDENCE_LABEL[level]}
    </span>
  );
}

export function BasisPill({ basis }: { basis: Basis }) {
  return (
    <span className={`pill pill-basis pill-basis-${basis}`} title={BASIS_HELP[basis]}>
      {BASIS_LABEL[basis]}
    </span>
  );
}

export function Speaker({ name, size }: { name: string; size?: 'sm' }) {
  const { speakerColor, isPresent } = useCaseUI();
  return (
    <span className="speaker" style={{ ['--sc' as string]: speakerColor(name), fontSize: size === 'sm' ? 'var(--t-xs)' : undefined }}>
      <span className={`speaker-dot${isPresent(name) ? '' : ' absent'}`} aria-hidden="true" />
      {name}
      {isPresent(name) ? null : <span className="visually-hidden"> (not present)</span>}
    </span>
  );
}

export function Speakers({ names }: { names: string[] }) {
  return (
    <span className="row" style={{ display: 'inline-flex', gap: 10 }}>
      {names.map((n) => (
        <Speaker key={n} name={n} />
      ))}
    </span>
  );
}

/** A cited passage. Shows the exact words in the source register and opens them in context. */
export function Quote({ ev }: { ev: Evidence }) {
  const { c, openTurn, check } = useCaseUI();
  const status = check(ev);
  const ok = isVerified(status);
  let whole = '';
  if (!ev.quote) {
    const text = c.transcript.turns.find((t) => t.id === ev.turn)?.text ?? '';
    whole = text.length > 90 ? text.slice(0, 88).replace(/\s+\S*$/, '') + '…' : text;
  }
  return (
    <button type="button" className={`quote-btn${ok ? '' : ' unverified'}`} onClick={() => openTurn(ev.turn, ev.quote)} title="Show in context">
      {ev.quote ? (
        <span className="q">“{ev.quote}”</span>
      ) : (
        <span className="q q-whole">
          {whole ? `“${whole}”` : null} <span className="muted xs">(whole turn)</span>
        </span>
      )}
      <span className="tid">
        {ev.turn}
        {!ok ? <span className="verify-mark"> · {QUOTE_STATUS_LABEL[status.status]}</span> : null}
      </span>
    </button>
  );
}

export function Quotes({ items, label = 'Evidence' }: { items: Evidence[]; label?: string }) {
  if (!items.length) return null;
  return (
    <div className="quotes" role="group" aria-label={label}>
      {items.map((ev, i) => (
        <Quote key={`${ev.turn}-${i}`} ev={ev} />
      ))}
    </div>
  );
}

export function ConceptLinks({ ids }: { ids: string[] }) {
  const { openConcept } = useCaseUI();
  const known = ids.filter((id) => CONCEPT_BY_ID[id]);
  if (!known.length) return null;
  return (
    <span className="row" style={{ gap: 6 }}>
      {known.map((id) => (
        <button key={id} type="button" className="concept-link" onClick={() => openConcept(id)}>
          {CONCEPT_BY_ID[id].title}
        </button>
      ))}
    </span>
  );
}

export function Section({ id, title, intro, actions, children }: { id: string; title: string; intro?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-h`}>
      <div className="section-head">
        <div>
          <h2 id={`${id}-h`}>{title}</h2>
          {intro ? <p>{intro}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Disclosure({ summary, children, open }: { summary: ReactNode; children: ReactNode; open?: boolean }) {
  const printing = useContext(PrintCtx);
  return (
    <details className="disclosure" open={printing || open}>
      <summary>{summary}</summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that block the async clipboard on file:// pages.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-small no-print"
      onClick={async () => {
        const ok = await copyText(text);
        setDone(ok);
        if (ok) setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <IconCheck /> : <IconCopy />}
      <span aria-live="polite">{done ? 'Copied' : label}</span>
    </button>
  );
}

export function ViewToggle({ value, onChange }: { value: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void }) {
  return (
    <span className="view-toggle no-print" role="group" aria-label="View as">
      <button type="button" aria-pressed={value === 'chart'} onClick={() => onChange('chart')}>
        Chart
      </button>
      <button type="button" aria-pressed={value === 'table'} onClick={() => onChange('table')}>
        Table
      </button>
    </span>
  );
}
