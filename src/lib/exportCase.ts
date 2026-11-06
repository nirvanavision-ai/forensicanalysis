/**
 * Exports. The interactive export is this same app, with the case embedded as inert JSON,
 * so it opens offline in any browser. The API key is never part of a case and never exported.
 */
import { parseCaseFile, type CaseFile } from './case';

let shell: string | null = null;

/** Called once at start-up, before the app renders, so the export starts from a clean page. */
export function captureShell() {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  clone.querySelector('#subtext-embedded')?.remove();
  const root = clone.querySelector('#root');
  if (root) root.innerHTML = '';
  clone.removeAttribute('data-theme');
  shell = '<!doctype html>\n' + clone.outerHTML;
}

export function canExportHtml(): boolean {
  // In development the page loads its code from the dev server, so the shell is not self-contained.
  return !!shell && !import.meta.env.DEV;
}

export function readEmbeddedCase(): CaseFile | null {
  const el = document.getElementById('subtext-embedded');
  if (!el?.textContent) return null;
  try {
    const r = parseCaseFile(JSON.parse(el.textContent));
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'case'
  );
}

export function caseHtml(c: CaseFile): string {
  if (!shell) throw new Error('Export is not available');
  // `<` is escaped so the data can never close the script element early.
  const json = JSON.stringify(c).replace(/</g, '\\u003c');
  const tag = `<script type="application/json" id="subtext-embedded">${json}</script>`;
  const i = shell.lastIndexOf('</body>');
  return i >= 0 ? shell.slice(0, i) + tag + shell.slice(i) : shell + tag;
}

export function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportHtml(c: CaseFile) {
  download(`subtext-${slug(c.title)}.html`, caseHtml(c), 'text/html');
}

export function exportJson(c: CaseFile) {
  download(`subtext-${slug(c.title)}.json`, JSON.stringify(c, null, 2), 'application/json');
}
