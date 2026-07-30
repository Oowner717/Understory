# UNDERSTORY INTEGRITY ORDER — pass 01 — full (durability + deck + engine)
Stack detected: web playtest. Source of truth: the app files. Do not edit this order.
Build reviewed: commit acae2c4 (branch claude/understory-playtest-elc65b, 2026-07-30)
Precedence: data-loss items outrank all other orders. Elsewhere, do not resolve conflicts
yourself — flag them and stop.

## CONSTRAINTS — obey while implementing every item below
- Do not add dependencies, network requests, analytics, or accounts.
- Do not rewrite player-facing prose. Report duplication; the editor supplies replacements.
- Do not change the content schema without also writing the migration.
- Do not weaken a check to make it pass.
- Do not touch anything in section 5.

## 1. DATA LOSS
### src/main.tsx (or src/AppContext.tsx startup)
- [ ] INT-L1 · persistent storage — Safari evicts IndexedDB after ~7 days without
      interaction; the playtest can silently destroy testers' journals
      IMPLEMENT-PER: at startup call navigator.storage.persist() (feature-detected);
      store the boolean result; when it is false and entries exist, surface a
      non-dismissable-once notice telling the tester to install to the home screen.
      Notice string goes in ui-strings.ts and needs editor sign-off before ship.
      ACCEPTS WHEN: persist() is requested on every launch; both outcomes are handled;
      the false-path notice renders; zero behavior change when the API is absent
      DEPENDS ON: none

### src/components/EntryEditor.tsx
- [ ] INT-L2 · unmount cleanup — pending debounced save is DISCARDED on unmount
      (route change, spread redraw, midnight remount); the cleanup clears the timer
      without flushing, losing everything typed in the last ≤900 ms and, during
      continuous typing, everything since the last 900 ms pause
      IMPLEMENT-PER: keep the latest text and a dirty flag in refs; the unmount
      cleanup must clear the timer AND, if dirty, fire onSave with the latest text.
      ACCEPTS WHEN: type, immediately navigate to another view, reload — the text is
      present in the journal
      DEPENDS ON: none
- [ ] INT-L3 · backgrounding/kill — no save on blur, visibilitychange, pagehide, or
      beforeunload; a user who types continuously (debounce never fires) and swipes
      the app away loses the entire unsaved entry
      IMPLEMENT-PER: flush the pending save when document visibility becomes hidden
      and on pagehide; blur of the textarea should also flush.
      ACCEPTS WHEN: an entry written and the app killed within one second of the last
      keystroke is present on relaunch
      DEPENDS ON: INT-L2 (share the same flush function)
- [ ] INT-L4 · write-failure visibility — onSave rejection is unhandled
      (`latest.current(value).then(...)` with no catch); a quota-full or failed
      IndexedDB write leaves the status line on "typing…" forever and the user's text
      only in DOM memory. Same pattern at Today.tsx logDailyDrawOnce, Spread.tsx
      appendDraws, AppContext updateSettings
      IMPLEMENT-PER: catch write failures at every storage call site; EntryEditor
      shows an error state (string via ui-strings.ts, editor sign-off) and retries on
      next input; never show "Saved." unless the promise resolved.
      ACCEPTS WHEN: with idb-keyval `set` stubbed to reject, the editor shows the
      error state, "Saved." never appears, and no unhandled promise rejection fires
      DEPENDS ON: none

### src/engine/types.ts + src/engine/storage.ts
- [ ] INT-L5 · schema versioning — no stored record carries a version field; v1.1
      migrations would have to guess against unversioned data in the wild
      IMPLEMENT-PER: wrap each of the three stores in a versioned envelope
      `{ v: 1, data: ... }` written on every save; on read, treat a bare array/object
      as v0 and migrate it to v1 in code (this IS the migration the constraint
      requires); reject-and-preserve (never overwrite) any envelope with v greater
      than known.
      ACCEPTS WHEN: fresh installs and pre-existing unversioned data both load; all
      writes carry v; a future-versioned blob is left untouched on disk
      DEPENDS ON: none
- [ ] INT-L6 · read-modify-write races — saveEntry/deleteEntry/appendDraws/
      logDailyDrawOnce each get-then-set one whole-array blob; two tabs (or a slow
      write racing a fast one) clobber each other's entries wholesale
      IMPLEMENT-PER: use idb-keyval `update(key, fn)` so each read-modify-write runs
      in a single IndexedDB transaction; keep the entry-array shape.
      ACCEPTS WHEN: two interleaved saveEntry calls for different ids from two
      contexts both survive; verify with a test that fires 100 concurrent saveEntry
      calls and finds 100 entries
      DEPENDS ON: INT-L5 (touches the same functions; do together)

### src/views/Today.tsx
- [ ] INT-L7 · midnight rollover mid-entry — `today` is computed per render with no
      ticker; when local midnight passes with the app open, the next render (e.g.
      the one caused by a save) remounts EntryEditor with key={new date}, discarding
      pending text, and the card rotates mid-entry
      IMPLEMENT-PER: flush (INT-L2 covers the text); then decide the rollover
      experience deliberately — either hold the session's ritual date until the view
      is re-entered, or add a midnight timer that remounts only after a flush. The
      half-written entry must stay attached to the day it was started.
      ACCEPTS WHEN: with a mocked clock crossing midnight mid-typing, no character is
      lost and the entry keeps the starting day's isoDate and card
      DEPENDS ON: INT-L2

## 2. WRONG OUTPUT
### src/engine/threads.ts
- [ ] INT-W1 · 30-day window — cutoff is `today − 30` inclusive, which is a 31-day
      window; "last 30 days" is today plus the 29 before it
      CHANGE: `cutoff.setDate(cutoff.getDate() - WINDOW_DAYS)` →
      `cutoff.setDate(cutoff.getDate() - (WINDOW_DAYS - 1))`
      ACCEPTS WHEN: verify:engine assertion "window is exactly 30 days" passes
      DEPENDS ON: none

### src/content/meanings.json
- [ ] INT-W2 · near-duplicate questions across cards — 9 pairs at trigram
      similarity ≥ 0.50, listed in verify:deck output (worst: M13/M21 "Where are you
      standing (now)?" 0.67; wands-09/wands-10 "What are you still braced
      against/for?" 0.60 on neighbouring cards). BLOCKED for this session: the editor
      supplies replacement wording; do not edit meanings.json.
      IMPLEMENT-PER: hand the verify:deck duplication list to the editor; apply their
      wording only.
      ACCEPTS WHEN: npm run verify:deck exits 0 with the duplication section clean
      DEPENDS ON: editor

### src/views/Today.tsx
- [ ] INT-W3 · variant selection conflict — FLAG, DO NOT RESOLVE. The review spec
      says the three reading lines must cycle before any repeat (keyed on card +
      draw count); the code and types.ts comment say variant-of-the-day by hash,
      measured 33.3% chance a repeat draw on consecutive days shows the same line.
      Two documents disagree; this needs the author's decision, not code.
      ACCEPTS WHEN: a decision is recorded in DECISIONS.md and, if the spec side
      wins, the implementation is keyed on per-card draw count with a cycle
      DEPENDS ON: author decision

### src/views/Settings.tsx
- [ ] INT-W4 · export drops fields — the text export omits each entry's source
      (daily vs spread), createdAt/updatedAt, and card ids (names only); entries are
      re-identifiable but not re-importable
      IMPLEMENT-PER: keep the prose export; add the omitted fields compactly per
      entry (ids + timestamps on the header line, or a parallel JSON export from the
      same button set).
      ACCEPTS WHEN: every non-empty entry appears with id-level card context, source,
      and timestamps; empty-text entries remain excluded
      DEPENDS ON: none

## 3. ADD THESE VERIFICATION SCRIPTS
Both scripts are already written and committed on this branch; these items are to
keep them wired and green.
- [ ] INT-V1 · tools/verify-deck.ts — asserts: 78 cards, M00–M21 contiguous, 4×14
      exact ranks; botanical↔classic↔suit↔rank derived independently for all 78;
      completeness incl. status=final and question-mark placement; word/array
      bounds (spread floor 18 per WRITING-LOG amendment); exact + near-duplicate
      text across cards; manifest↔files↔ids; CONCEITS domain ≤6 and no deck-order
      neighbours; per-field regression vs tools/deck-baseline.json. Rewrite the
      baseline (`-- --write-baseline`) only for a reviewed, intended corpus change.
      ACCEPTS WHEN: npm run verify:deck exits 0 on a correct corpus and non-zero on a
      seeded fault (verified this pass: name swap, dropped card, blanked field,
      manifest orphan, ship-gate regression all caught)
- [ ] INT-V2 · tools/verify-engine.ts — asserts: daily-draw determinism, local
      midnight (not UTC), DST both directions, date line, leap day, cross-device
      divergence, full-deck coverage + uniformity; spread uniqueness/uniformity over
      10 000 draws; findEcho fixture suite incl. deleted-prior; threads fixtures
      incl. rolling window and future-dated draws; 1 000 composed readings seam-free
      with exactly one trailing question mark; unknown-id error paths.
      ACCEPTS WHEN: npm run verify:engine exits 0 (currently 1 failure, fixed by
      INT-W1) and the assertions fail when their target is broken
- [ ] INT-V3 · .github/workflows/deploy.yml — run `npm run verify:deck` and
      `npm run verify:engine` before the build step so no corpus or engine
      regression deploys
      ACCEPTS WHEN: the workflow fails on a seeded fault branch and passes on main
      DEPENDS ON: INT-W1, INT-W2 (scripts must be green first)

## 4. TIDY UP
- [ ] INT-T1 · VOICE-SPEC.md "Spread lines → Mechanics" still reads "20 to 30
      words"; WRITING-LOG S1 amended the floor to 18 and the corpus follows the
      amendment (159 lines sit at 18–19). Doc conflict — flag to the author/editor;
      do not silently edit either document.
- [ ] INT-T2 · Settings "start over" clears the idb-keyval store only; service-worker
      caches and the SW registration survive. No user data lives there (app shell
      only), but the spec for "start over" is everything.
      IMPLEMENT-PER: after wipeAll, delete caches via caches.keys()/delete and
      unregister the service worker before reload.
      ACCEPTS WHEN: after start-over, CacheStorage is empty and no SW is registered
- [ ] INT-T3 · dev-only #/writing route exists (stripped from prod builds by
      import.meta.env.DEV). One-line note only — compliance owns it.

## 5. DO NOT CHANGE
- Card ids (`M00`–`M21`, `wands-01`…`pentacles-king`) — verified correct.
- The dual-naming system and suit→plant mapping (Hawthorn/Bellflower/Gladiolus/
  Lunaria) — verified correct on all 78.
- The deterministic daily-draw design (hash(localDate + deviceSeed) % 78) and
  cyrb53 — verified unbiased and fully covering.
- drawSpread rejection sampling — verified uniform, no replacement.
- findEcho semantics — all fixtures pass; matches CLAUDE.md item 4.
- Majors excluded from the Threads suit balance — documented in-code as design.
- cards.json vs meanings.json keyword split — documented in DECISIONS.md line 29.
- tools/deck-baseline.json — regenerate only via --write-baseline on a reviewed corpus.

## REGRESSION CHECK — run after sections 1–3, before reporting back
- [ ] Both verification scripts exit 0
- [ ] An entry written and the app killed within one second is still present on relaunch
- [ ] Start over leaves nothing behind, including service-worker caches
- [ ] Export round-trips: every entry, every field, card context intact
- [ ] No unhandled promise rejections in a full pass through every screen

## REPORT BACK
Per item id: applied / deviated / blocked, plus the ACCEPTS WHEN result. Paste the output of both
verification scripts. Don't tick an item whose intent you changed, and never weaken a check to
make it pass — report it as blocked instead.
