# ORDERS.md — the pipeline ledger

The only place the pipeline's state lives (Review Pipeline Protocol v2).
Appended to after every order. Item ids are source-prefixed: `INT-`, `CMP-`,
`ACC-`, `EDT-`.

An order file states the build it was written against. An order whose build no
longer matches the working tree is **stale** and gets re-issued, not applied.

## Orders

| Order file | Build reviewed | Items | Applied | Deviated | Blocked | Regression | Date |
|---|---|---|---|---|---|---|---|
| INTEG-pass-01-full.md | acae2c4 | 14 | 0 | 0 | 14 (not received) | n/a | 2026-07-30 |

## Blocked items

Blocked items stay blocked and go back to the reviewer that issued them, never
into a backlog.

| Item id | Order file | Why blocked | Returned to | Date |
|---|---|---|---|---|
| all 14 | INTEG-pass-01-full.md | Order file not received — only the chat PASS TALLY was provided. Cannot apply items or report per item id without it. Also stale by protocol definition: written against acae2c4, tree is at c7a1b14. | Integrity | 2026-07-30 |

## Owner decisions outstanding (bucket 4 — never implemented here)

| Item | Options | Raised by | Date |
|---|---|---|---|
| Third reversed variant | Work order §4 specifies 2 reversed lines and 2 reversed questions per card; 3 and 3 are built and accepted. Keep the extra 78+78, or cut to spec. | Builder, on reading the final work order | 2026-07-30 |
| Question word bounds | Work order §4 says questions run ~10–20 words; VOICE-SPEC.md sets a 12-word hard maximum and the 468 built average 6.0. One document has to win before the Editor's first Tier 3 pass. | Builder | 2026-07-30 |
| Variant-rotation conflict | Raised by Integrity, described in its carry-forward as "awaits author decision". Detail is in the unreceived order file. Not implemented, no option chosen. | Integrity, pass 01 | 2026-07-30 |
| AI-text disclosure in the store listing | Work order §12 requires asking once. Owner answered: prefer not to disclose, accept it if required. Recorded in `src/content/store-listing.md`. | Builder, batch 1 | 2026-07-29 |

## Regression check history

The six global checks from the protocol, run before opening any new order.

| Date | Build | Scripts | No network | No dev route | Restore/free tier | Contrast | Entry survives kill | Result |
|---|---|---|---|---|---|---|---|---|
| 2026-07-30 | pre-order baseline | n/a (INTEG scripts not landed) | pass | pass | n/a (no native build, no unlock screen) | AA pass, AAA fail | pass, after two fixes | **pass** |

### Baseline notes, 2026-07-30 — run before any order, per protocol

Two of the six failed on first run. Both are fixed; neither came from an order.

**Check 3 failed — a placeholder marker was shipping.** `meanings.json` carried a
top-level `_note` reading "PLACEHOLDER/DRAFT COPY — variant-depth schema (Work
Order v3)…" which was compiled into the production bundle. Stale as well as
prohibited: it described a status flow that no longer exists. Removed. The eight
remaining `placeholder` strings in the bundle are HTML textarea attributes and
the `EMPTY_MEANING` enum default in `content.ts`, not content.

**Check 6 failed — data loss on kill.** An entry typed and hard-killed 300ms
later was **lost**. Cause: `EntryEditor` used a 900ms trailing debounce with no
flush and no max-wait. Three defects, found in sequence because each fix
exposed the next:

1. No flush on teardown. Backgrounding or navigating away mid-edit lost
   everything since the last write. Added `visibilitychange` and `pagehide`
   handlers plus a flush on unmount.
2. The window itself was 900ms, and no handler helps against a SIGKILL where no
   JS runs. `SAVE_DELAY` lowered 900 → 400.
3. A pure debounce restarts on every keystroke, so **continuous typing never
   wrote at all**. Measured: 1.6 seconds of typing, hard-killed, everything lost
   but the first character. Added a max-wait that guarantees a write every
   `SAVE_DELAY` while typing continues.

After: single write killed at 300ms survives; backgrounding at 300ms survives;
a mid-burst hard kill now loses only the trailing ~400ms of characters. That
residual is irreducible against a SIGKILL and is bounded by `SAVE_DELAY`.

**Check 5 — reported precisely rather than pass/fail.** Zero AA (4.5:1)
violations on all six routes. AAA (7:1) flags 5 to 12 nodes per route. The
protocol says "meets its contrast floor" without naming the floor, so Access
owns which standard applies. If the floor is AAA this is a finding on every
screen and the palette in `tokens.css` needs work; if AA, it passes clean.

**Check 4 — not applicable.** No native build exists and the playtest has no
unlock screen or purchase flow at all, so Restore Purchase and free-tier
integrity cannot be checked here. Worth flagging upward: the Editor Brief calls
the unlock screen "a single screen carrying the whole business" and it is
currently unwritten and unbuilt. Logged as a coverage gap, not a regression.

**Check 2 — pass, and a correction to my own first reading.** Eight requests on
reload, all same-origin, zero external. `AppContext` does `fetch` the deck
manifest on mount, and my first check of the precache list said it was not
precached. That was a bad regex, not a bad build: `deck/manifest.json` is in
`sw.js`'s precache manifest, so the fetch is cache-served after first load.

## Pass 01 — received as a tally only, 2026-07-30

Integrity's chat tally arrived; `INTEG-pass-01-full.md` did not. Fourteen items
are therefore blocked on receipt, not on difficulty. What is established so far:

**The order is stale.** Written against `acae2c4`; tree is at `c7a1b14`. One
commit separates them, and it is the pre-order regression fix required by the
protocol's global check. That is a genuine loop in the protocol worth naming:
"run the six checks before opening the next order" plus "any failure stops the
pipeline until it's fixed" means a failing check moves the build and invalidates
the order about to be opened. Resolution is a re-issue against `c7a1b14`, not a
change to either rule.

**The headline data-loss finding appears already closed.** The tally's worst
case reads "continuous typing never triggers the debounce and
kill/background/route-change all discard the pending save". Those are, mechanism
for mechanism, the three defects fixed in `c7a1b14`: no flush on teardown, a
900ms window nothing could survive, and a pure debounce that never wrote during
continuous typing. Which of the seven data-loss items that maps to cannot be
determined without the file.

**Not addressed by anything so far: Safari 7-day eviction.** No
`navigator.storage.persist()` call exists and there is no install guidance. This
is the most severe item in the tally by blast radius — it loses the entire
journal rather than a debounce window — and it is untouched.

**The claimed verification scripts are not in this repo.** The carry-forward
states `verify:deck` and `verify:engine` are "committed and wired as npm
scripts" with `deck-baseline.json` committed for regression. None of
`tools/verify-deck.ts`, `tools/verify-engine.ts`, `tools/deck-baseline.json`
exist here, and `package.json` has no such scripts. Global regression check 1
remains unrunnable and the deck and engine results cannot be reproduced.

**Two findings verified independently, before the order arrives.**

- `INT-W1`, the threads window. Confirmed. `WINDOW_DAYS = 30`, `cutoff = today
  − 30`, filter `isoDate >= cutoffStr && isoDate <= today` — inclusive at both
  ends, so 31 distinct days are admitted. Two valid fixes: `cutoff = today −
  (WINDOW_DAYS − 1)`, or filter with `> cutoffStr`. Held for the order, which
  gets to say which.
- The 9 near-duplicate question pairs. An independent count at Jaccard ≥ 0.6
  over all 468 questions also returns exactly **9 pairs**, which corroborates
  the method. The composition differs: my pairs implicate `M06`, `swords-10`
  and `pentacles-page`, which the tally does not name, while the tally names
  `M02`, `M13`, `M15`, `M21` and `wands-03`, which my threshold does not catch.
  Three pairs sit at Jaccard 1.0 and are the clearest: "What are you waiting
  for?" (M19), "Who are you waiting for?" (M08) and "Who is waiting for it?"
  (swords-01). The Editor needs the pair list, not the card list.
