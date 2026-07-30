# Understory — playtest conventions

Browser-based playtest of a journal-first tarot app. **Not the shipping product** — the
native SwiftUI app comes later. This repo exists to answer four questions (ritual length,
Echo, dual naming, plate system) and to serve as a living spec for the Swift port.

## Five things that must survive into the native app

Keep these clean above all else; everything else is disposable scaffolding.

1. **Content JSON schemas + card ids** — `src/content/cards.json` (`M00`–`M21`,
   `wands-01`…`pentacles-king`), `meanings.json`, `templates.json`.
2. **The plate/frame spec** — `src/design/plate.tsx` geometry and mark system.
3. **The Voice rules** — see below; binding for every string in the app.
4. **Echo semantics** — most recent earlier entry containing the drawn card with text;
   excludes the current entry (`findEcho` in `src/engine/storage.ts`).
5. **Threads semantics** — last 30 days of the draw log; top-3 most drawn + suit
   balance; preview state under 5 draws (`src/engine/threads.ts`).

## Layout

```
/src
  /views       Today, Journal, EntryView, Library, CardDetail, Spread, Settings
  /components  CardPlate, CardFlip, EchoPanel, ThreadsPanel, EntryEditor
  /engine      draw.ts, composer.ts, threads.ts, storage.ts, content.ts, dates.ts, types.ts
  /content     cards.json, meanings.json, templates.json   (PLACEHOLDER COPY — see _note keys)
  /design      tokens.css, fonts.css, fonts/, plate.tsx
/public/deck   real art drops here; manifest.json lists which ids have files
/public/icons  PWA icons (regenerate with scripts/make-icons.mjs)
```

## Writing campaign (see the work order; these rules are standing)

- **VOICE.md is the single source of truth** for every string; the summary
  below is the short form. The Barnum pattern list the linter enforces lives
  in a fenced block inside VOICE.md.
- **Authorship boundary:** Claude never writes text into `meanings.json`.
  Drafts go to `src/content/drafts/` only, two variants per field, linted
  clean before review. Moving text into `meanings.json` is a step the author
  performs by hand. `PROVENANCE.md` records who drafted/authored each card.
- Tools: `npm run lint:voice` · `npm run lint:sameness` · `npm run
  fuzz:readings`. Writing dashboard at `#/writing` (dev server only).
- UI copy lives in `src/content/ui-strings.ts` — nothing hardcoded in
  components.
- Ship gate: nothing ships while any card's `status` is `placeholder` or
  `drafted`. **Satisfied 2026-07-29 — all 78 cards are `final`.** The gate
  stays in force for any future edit: a card being reworked drops to
  `drafted` until it is re-accepted.

## Voice rules (binding for all copy)

- Notices, never predicts. Banned: will/won't, fortune, destiny, "the universe",
  "energy", manifesting. ("The Wheel of Fortune" as a card title is the one exemption.)
- No advice verbs (should, must, need to). No health, financial, or legal guidance, ever.
- Second person, plain words, short sentences. Warm, dry, a little wry.
- Every reading ends with exactly one question. No lorem ipsum, anywhere, ever.

## How to add a card asset

1. Drop `{cardId}.webp` into `/public/deck` (e.g. `swords-05.webp`), 5:8.7 ratio.
2. Add the id to `"cards"` in `/public/deck/manifest.json`.
3. Done — `CardPlate` prefers the file; every other card keeps its generated plate.
   Mixed real + generated is a supported state, not an edge case.

## Run / build / deploy

- `npm run dev` — dev server (base `/Understory/`, so open `…/Understory/`).
- `npm run build` — `tsc -b` (strict) + Vite build + PWA precache into `dist/`.
- `npm run preview` — serve `dist` locally. Restart it after every rebuild (it
  snapshots the dist file list at startup).
- Deploy: push to the default branch → `.github/workflows/deploy.yml` builds and
  publishes to GitHub Pages. Base path is `/Understory/`; override with
  `UNDERSTORY_BASE` env at build time if the repo name ever changes.

## Conventions

- TypeScript strict; no new runtime dependencies (React + idb-keyval only).
- Plain CSS with custom properties; palette is closed (7 colors in `tokens.css`).
  Suit accent colors appear only where their suit does.
- Never bold EB Garamond; "small caps" are uppercase + letterspacing.
- Motion: card flip + Echo fade only, both under 600ms, both honor reduced motion.
- Hash routing only (`#/today`, `#/journal`, `#/entry/:id`, `#/library`,
  `#/card/:id`, `#/spread`, `#/settings`). No router library.
- Zero network requests after first load. No analytics, no CDNs, no telemetry.
- Out of scope (hold the line even if asked later): payments, AI, reversals,
  accounts/sync, notifications, streaks, multiple decks, localization, analytics.
