import { createContext, useContext } from 'react';
import type { CaseFile } from '../lib/case';
import type { Evidence } from '../lib/schema';
import type { QuoteCheck } from '../lib/verify';

export const TABS = [
  { id: 'briefing', label: 'Executive briefing' },
  { id: 'transcript', label: 'Transcript inspector' },
  { id: 'knowledge', label: 'Knowledge base' },
  { id: 'audit', label: 'Logic & mechanism audit' },
  { id: 'playbook', label: 'Response playbook & sources' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

export interface CaseUI {
  c: CaseFile;
  speakerColor: (label: string) => string;
  isPresent: (label: string) => boolean;
  openTurn: (turn: string, quote?: string) => void;
  openConcept: (id: string) => void;
  goTo: (tab: TabId, anchor?: string) => void;
  check: (ev: Evidence) => QuoteCheck;
  /** Concept ids cited anywhere in this case's analysis. */
  citedConcepts: Set<string>;
  toast: (msg: string) => void;
}

export const CaseCtx = createContext<CaseUI | null>(null);
export function useCaseUI(): CaseUI {
  const v = useContext(CaseCtx);
  if (!v) throw new Error('CaseCtx missing');
  return v;
}

/** True while the print report is rendering: disclosures render open. */
export const PrintCtx = createContext(false);
