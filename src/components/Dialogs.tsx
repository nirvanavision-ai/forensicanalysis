import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CaseFile } from '../lib/case';
import { MODELS } from '../lib/claude';
import { canExportHtml, exportHtml, exportJson } from '../lib/exportCase';
import type { Settings } from '../lib/storage';
import { IconDownload, IconPrint, IconTrash } from './icons';

function Dialog({ open, onClose, title, children, foot }: { open: boolean; onClose: () => void; title: string; children: ReactNode; foot?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dlg-h">
      <div className="dialog-body">
        <h2 id="dlg-h" style={{ fontSize: 'var(--t-xl)' }}>
          {title}
        </h2>
        {children}
      </div>
      <div className="dialog-foot">{foot ?? <button type="button" className="btn" onClick={onClose}>Close</button>}</div>
    </dialog>
  );
}

export function SettingsDialog(props: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  apiKey: string;
  onSave: (s: Settings, key: string) => void;
  onDeleteEverything: () => void;
}) {
  const [s, setS] = useState(props.settings);
  const [key, setKey] = useState(props.apiKey);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (props.open) {
      setS(props.settings);
      setKey(props.apiKey);
      setShow(false);
    }
  }, [props.open, props.settings, props.apiKey]);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="Settings"
      foot={
        <>
          <button type="button" className="btn" onClick={props.onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              props.onSave(s, key.trim());
              props.onClose();
            }}
          >
            Save settings
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label htmlFor="key">Your Claude API key</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input
              id="key"
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-…"
            />
            <button type="button" className="btn btn-small" onClick={() => setShow(!show)} aria-pressed={show}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <span className="hint">
            Used only to send your transcript to Anthropic for analysis. It is never included in saved or downloaded analyses. You can create a key in the Anthropic Console; usage is billed to your account.
          </span>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 6 }}>
            Model
          </legend>
          {MODELS.map((m) => (
            <label key={m.id} className="check" style={{ marginBottom: 6 }}>
              <input type="radio" name="model" checked={s.model === m.id} onChange={() => setS({ ...s, model: m.id })} />
              <span>
                <strong>{m.label}</strong>
                <span className="hint" style={{ display: 'block' }}>
                  {m.note}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="theme">Appearance</label>
          <select id="theme" className="select" value={s.theme} onChange={(e) => setS({ ...s, theme: e.target.value as Settings['theme'] })}>
            <option value="system">Match my device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={s.discreetTitle} onChange={(e) => setS({ ...s, discreetTitle: e.target.checked })} />
          <span>
            <strong>Discreet tab</strong>
            <span className="hint" style={{ display: 'block' }}>
              Shows “Notes” and a plain icon in the browser tab instead of Subtext.
            </span>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" checked={s.remember} onChange={(e) => setS({ ...s, remember: e.target.checked })} />
          <span>
            <strong>Remember my key and settings on this device</strong>
            <span className="hint" style={{ display: 'block' }}>
              Off by default. When on, anyone who uses this browser could see that Subtext was used and could use your key. Leave it off on a shared or monitored device.
            </span>
          </span>
        </label>
        <div className="panel panel-tight panel-wash">
          <strong className="small">Delete everything Subtext saved on this device</strong>
          <p className="xs muted" style={{ margin: '4px 0 10px' }}>
            Removes saved analyses, settings and any remembered key from this browser, and clears the current analysis. Downloaded files are not affected.
          </p>
          <button type="button" className="btn btn-small" onClick={props.onDeleteEverything}>
            <IconTrash /> Delete everything
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function SaveDialog(props: { open: boolean; onClose: () => void; c: CaseFile; onKeep: () => void; onPrint: () => void; onDelete: () => void; kept: boolean }) {
  const htmlOk = canExportHtml();
  return (
    <Dialog open={props.open} onClose={props.onClose} title="Save, share or delete">
      <p className="small muted">Nothing leaves this device unless you choose an option here. Anyone with a saved copy can read the conversation.</p>
      <div className="stack">
        <div className="item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Interactive file</strong>
            <button type="button" className="btn btn-small" disabled={!htmlOk} onClick={() => exportHtml(props.c)}>
              <IconDownload /> Download .html
            </button>
          </div>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            The whole dashboard in one file. Opens offline in any browser. Does not include your API key.
            {!htmlOk ? ' Available in the built app.' : ''}
          </p>
        </div>
        <div className="item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Report</strong>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                props.onClose();
                props.onPrint();
              }}
            >
              <IconPrint /> Print or save as PDF
            </button>
          </div>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            The full report from all five tabs, followed by the complete transcript.
          </p>
        </div>
        <div className="item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Data file</strong>
            <button type="button" className="btn btn-small" onClick={() => exportJson(props.c)}>
              <IconDownload /> Download .json
            </button>
          </div>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            For opening in Subtext again later.
          </p>
        </div>
        <div className="item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Keep on this device</strong>
            <button type="button" className="btn btn-small" onClick={props.onKeep} disabled={props.kept}>
              {props.kept ? 'Kept' : 'Keep in this browser'}
            </button>
          </div>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            Stored in this browser only, until you delete it. Anyone using this browser could find it.
          </p>
        </div>
        <div className="item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Delete this analysis</strong>
            <button type="button" className="btn btn-small" onClick={props.onDelete}>
              <IconTrash /> Delete
            </button>
          </div>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            Clears it from this page and from this browser’s storage. Files you downloaded are not affected.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
