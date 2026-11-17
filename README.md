# Subtext: interpersonal analysis and strategy

Subtext turns a confusing conversation into an evidence-linked, interactive breakdown. Paste or upload a transcript or message export and it shows what each person asked for, how each request was answered, where the conversation went sideways, and what you could say next. Every point is tied to the exact words, and every quote is checked against the transcript before it is shown.

It is built for people trying to make sense of controlling, manipulative or simply confusing conversations, including people experiencing or recovering from domestic abuse and coercive control. It works for couples, triads, throuples, polycules, friendships, families and workplaces.

Subtext is an educational tool. It does not diagnose anyone, detect lies, assess risk or replace advice from a qualified professional. It reads words, not tone, intent or history it was not given.

## Use it

Download [`forensic_analysis_app.html`](forensic_analysis_app.html) and open it in any modern browser. It is one self-contained file and works offline.

- **Try the fictional examples** on the start screen: *Saturday night* (a triad) and *After the dinner* (a couple). The people and conversations are invented.
- **Analyse your own conversation** with your own Claude API key (Settings). The transcript goes only to Anthropic, only when you press Analyse.
- **No key?** The offline keyword scan runs entirely on your device. It points to phrases worth a closer look and labels them as cues, not findings.

## What you get

| Tab | What it shows |
| --- | --- |
| 1. Executive briefing | The central finding and the concern that started it, the conversation arc (every turn, by speaker, with the moments the analysis noted), concerns and positive signs side by side, and a reality check that keeps what was documented, reported, supplied as context, interpreted and unknown apart. |
| 2. Transcript inspector | The full transcript with cited passages highlighted, word counts (labelled as word counts, never speaking time), filters, side-by-side comparison of turns and an optional play-along with a local recording. |
| 3. Knowledge base | 97 concept cards from research, theory, clinical formulation, practitioner technique and popular usage, each labelled by kind, with what it can and cannot show and its sources. |
| 4. Logic and mechanism audit | A plain-language decoder, contradictions, Toulmin argument maps, reasoning problems, mechanisms (effect, possible function and intent kept apart), the relationship map, the requests ledger, boundaries and consent, and competing explanations. |
| 5. Response playbook and sources | Options per goal, each with a script, follow-up, "if they…" branches and a stop condition; stronger and more accountable versions of key lines; what remains unknown; the checks actually performed; and references. |

Any quote opens the evidence panel with the surrounding turns. Printing (or saving as PDF) produces the full report followed by the complete transcript.

## How it keeps the analysis honest

- **Quotes are verified.** Each cited passage is matched against the transcript, word for word or after normalising punctuation. Anything that does not match is flagged in the interface, not hidden.
- **Citations cannot be invented.** The model can cite research only by choosing concept IDs from the curated knowledge base. Sources are marked "Confirmed" only where the bibliographic details were checked against the publisher, journal or Crossref record during the build; the rest say "Not yet confirmed".
- **Fixed format.** The analysis is requested as structured output, validated against a schema, and repaired conservatively where needed (every repair is reported).
- **Uncertainty is kept.** Inaudible speech, overlap, unclear attribution and redactions are recorded as flags. Confidence is described in words (Strong, Moderate, Tentative, Not established), never as invented scores.
- **Material is data.** Instructions that appear inside a transcript are treated as part of the conversation, never as commands. Pasted text cannot close or reopen the tags that frame it.

## Privacy and safety

- Nothing is saved unless you choose to save it. "Remember my key and settings" is off by default.
- No accounts, analytics, tracking or notifications. The page's content security policy allows network connections only to `api.anthropic.com`.
- Your API key is never included in downloaded files.
- Names can be replaced with aliases on your device before anything is sent; replacements are disclosed in the report.
- **Quick exit:** use the Quick exit button, or press Esc twice when no dialog or panel is open (an Esc that closes something, or a held-down key, never counts). It clears the page and opens a weather search. To go back to the start screen instead, use New analysis. It does not erase your browser history, so use a private window if that matters.
- **Delete everything** (Settings) removes every analysis, setting and remembered key Subtext stored in the browser.
- A discreet tab option shows "Notes" and a plain icon instead of Subtext.

## Develop

Requires Node 20.19 or later (or 22.12+).

```sh
npm install
npm run dev        # local development server
npm test           # unit tests (parser, quote verification, prompt safety, demos, knowledge base)
npm run typecheck
npm run release    # build and refresh forensic_analysis_app.html in the repo root
```

The build inlines everything (scripts, styles, fonts) into one HTML file and adds a hash-based content security policy.

### Layout

```
src/
  App.tsx                 app shell, tabs, quick exit, print
  components/             intake, dialogs, evidence drawer, print report, shared UI
    tabs/                 the five tabs
    charts/               conversation arc, relationship map
  data/
    knowledgeBase.ts      curated concept cards (merged with research.json)
    sources.ts            bibliography with confirmation status
    research.ts/.json     research additions and guardrails (import with scripts/import-research.mjs)
    demos/                the two fictional cases and their hand-written analyses
  lib/
    parser.ts             tolerant transcript parser (chat exports, captions, CSV, JSON, Word)
    schema.ts             the analysis contract (zod)
    prompt.ts             system prompt and request framing
    claude.ts             streaming call, error handling, schema repair
    verify.ts             quote verification and integrity report
    lexical.ts            offline keyword scan
    storage.ts            opt-in local storage and delete-everything
    exportCase.ts         interactive HTML and JSON export (never includes the key)
```

## Limits

A transcript shows what was said, not what happened outside it, how it sounded, or what anyone intended. A transcript of an allegation shows that it was made, not that the event occurred. Research describes patterns across groups of people; Subtext uses it to suggest questions, never to label a person. If you are worried about your safety, a trained domestic abuse or relationship support service can help you plan next steps.
