# Decisions

One line per non-obvious choice, newest last.

- Deploy target: GitHub Pages via Actions (this repo is already on GitHub; the brief's deploy question resolved itself).
- Suit plants fixed as one species per suit for naming: Hawthorn (Wands), Bellflower (Cups), Gladiolus (Swords), Lunaria (Pentacles).
- Majors: `name === classicName`; the UI hides the subtitle when the two names match rather than special-casing arcana.
- `meanings.json`/`templates.json` placeholder marker is a `"_note"` key (JSON has no comments).
- Card ids in entries/draws are stored as strings only; entries and draws live in two idb-keyval arrays (playtest scale, keeps export/wipe trivial).
- Daily entry id = the ISO date itself (one daily entry per day); spread entries get `spread-{date}-{timestamp}`.
- Daily draw is logged once per date on first visit to Today, not on flip (the card is determined either way).
- Pip layouts follow playing-card conventions (2×N columns, center inserts for odd counts) — instantly countable at thumbnail size.
- One accent use per plate: the small suit stamp under the figure numeral; center pips stay sepia ink. Majors have no suit, so no accent.
- Paper-grain filter renders only on full-size plates; 78 thumbnail feTurbulence filters would cost scroll performance and are invisible at that size.
- "Small caps" everywhere are uppercase + letterspacing (subset woff2 fonts don't carry the smcp feature; synthesized small caps look worse).
- Reduced-motion flip is a 200ms opacity crossfade (opacity-only is vestibular-safe); the Echo fade drops to instant.
- Under reduced motion + fresh visit, the card still starts face-down: revealing is a tap either way.
- `crypto.getRandomValues` with rejection sampling for the spread (no modulo bias); daily card uses cyrb53 of date+seed.
- Composer seeds mulberry32 with hash(date + card ids) so a given spread rereads identically all day.
- "The Wheel of Fortune" is the sole allowed appearance of a banned word ("fortune") — it's the card's classic title.
- Fool's plate numeral is "PL. 0" (zero) — roman numerals have no zero and tarot convention numbers the Fool 0.
- Vite `base` is `/Understory/` unconditionally (dev, preview, build) — one URL shape everywhere; `UNDERSTORY_BASE` env overrides.
- App icons rasterized once via Playwright + the preinstalled Chromium (`scripts/make-icons.mjs`) — no image libs in the repo.
- Deploy workflow triggers on the working branch as well as `main`: the first pushed branch of an empty repo becomes its default.
