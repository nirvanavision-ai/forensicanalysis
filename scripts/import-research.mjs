#!/usr/bin/env node
/**
 * Imports the research pass (kb-additions.json) into src/data/research.json.
 *
 *   node scripts/import-research.mjs /path/to/kb-additions.json
 *
 * Keeps only the fields the app shows. The watchlist is deliberately dropped: those papers
 * were found but not read, so the app must not cite them.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/import-research.mjs <kb-additions.json>');
  process.exit(1);
}
const d = JSON.parse(readFileSync(input, 'utf8'));
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const out = {
  importedFrom: 'Research pass of 2026-11-05 (kb-additions.json)',
  note: d.note,
  guardrails: d.guardrails.map((g) => pick(g, ['id', 'rule', 'source_ids'])),
  concepts: d.concepts.map((c) =>
    pick(c, ['id', 'title', 'domain', 'kind', 'confidence', 'definition', 'evidence', 'application', 'limitations', 'lookFor', 'contested', 'avoidTerms', 'sources']),
  ),
  sources: d.sources.map((s) =>
    pick(s, ['id', 'citation', 'doi', 'url', 'type', 'kind', 'claim', 'cannotEstablish', 'limitations', 'contested', 'contestedNote', 'checked', 'checkLevel', 'checkNote']),
  ),
};
writeFileSync(new URL('../src/data/research.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.concepts.length} concepts, ${out.sources.length} sources, ${out.guardrails.length} guardrails.`);
