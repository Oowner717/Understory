# VOICE-SPEC.md — the chosen voice, specified mechanically

Chosen at Gate 1 (bake-off, two rounds — see `src/content/drafts/GATE1-bakeoff.md`).
This document is the anchor the corpus is written against. Re-read it in full,
with the specimens, at the start of every batch. Quote it constantly.

## The voice in one paragraph

A specimen ledger with a pulse. Field-notes observation (Voice A) carries the
ordinary cards — concrete counts, recorded behavior, no fuss — cut with short
severe beats (Voice D) and closed by direct address. On the heavy cards the
notation recedes and plain witness carries instead (Tower F/J) — bare
second-person sentences, the ground-holding fact, permission without
instruction. Long-lens framing (Tower G's first and last lines) is approved
furniture for heavy cards.

## Punctuation law (author's rules, Gate 1 + batch 1 review — lint-enforced)

- **No colons. No semicolons. No em dashes or en dashes. Anywhere in card copy.**
- Periods and commas do all the work. The question mark appears once, at the
  end of the question field, and nowhere else. Hyphenated compound words
  (walk-past, face-down) stay legal.
- Anything that wants a dash gets a new sentence. The voice tolerates
  fragments after periods, so pivots become full stops. "Not good. Better."

## Sentence mechanics (measured from the winning specimens)

- Reading line — 4 to 7 sentences, **35–50 words**.
- Mix required. At least one sentence of six words or fewer, in every line
  with no exceptions. At least one of twelve to twenty. Never a line where
  every sentence runs 12–18 words.
- **Mean sentence length, 7 to 10 words, measured per batch.** Added after
  batch 2 drifted to 11.1 and was clipped back to 9.5. An absolute target
  beats comparing each batch to the last one, because batch 1 sits at 7.2
  only as an artifact of the em dash conversion, which turned pivots into
  full stops wholesale. The Gate 1 specimens run near 6. Anything above 10
  is the slide toward ordinary prose and gets clipped before review.
- The first sentence contains a countable, concrete noun — from the plate or
  from the card's conceit domain. No abstract openers, ever.
- **Endings land once.** One short closing beat. Never two aphorisms stacked —
  the author cut "There isn't another kind." from an otherwise-accepted line,
  and that trim is the standard.
- Adjectives — three per line at most. No adverb-adjective pairs.
- Second person appears by the fourth sentence at the latest.

## Questions

- Simple, open, non-specific enough to answer from any life. One clause
  preferred, two at most. **Twelve words hard maximum, ten preferred.**
- The author repeatedly trimmed double-barreled "X, and Y?" questions —
  default to one barrel.
- A yes/no surface with an open tail ("Cleaner than the first attempt, or
  not yet?") passed selection. Rare use only.
- Answerable today, with a pen, about the recent past.

## Openings

Four moves — image, observation, contrast, address — assigned per card in
`CONCEITS.md`, distributed evenly. Heavy cards may override their assignment
with witness address.

## The heavy-card valve (the twelve cards in VOICE.md §6)

Notation recedes. No "the record shows", no inventory framing of a person's
pain, no wry beats, never "the subject." Direct sentences. The ground-holding
fact stated plainly. Permissions, not instructions — "You're allowed to just
stand here for a minute." G-style long-lens lines may open or close.

## Tells to avoid (this writer's habits the voice never keeps)

1. Colons — the notation reflex. Recast with an em dash or a period.
2. Stacked ending aphorisms.
3. Double-barreled questions.
4. A metaphor-system colonizing the whole entry (harbor, museum, invoice —
   one appearance, not a lease).
5. "quiet", "small", "notice" — measured top-repeat crutch words.
6. Wry beats on heavy cards.
7. "The subject" more than once per line. Never on heavy cards.
8. Semicolon-shaped sentences even without the semicolon — clauses balanced
   too neatly. Break one side.
9. The trailing "..., and Y, which is Z" clause. The long-sentence tell,
   measured across batch 2. Split it into its own sentence.

## Cross deck budgets (added after batch 1 review)

Batch 1 read well card by card and repetitively across the set. These
budgets exist because sameness is a deck level defect that per card
review cannot see. The sameness linter reports the counts.

**The word "reversed" is metadata, not copy.** A reversed line may open
with it no more than once per suit. Everywhere else the inversion is
carried by content. The app knows the orientation when it renders.

**Extended bookkeeping vocabulary is budgeted.** Invoice, itemize,
audit, accounting, ledger, banking, billing, accrue, bookkeeping. Not
"tab" and not "interest", both of which are homonyms that flagged clean
copy, browser tabs in cups-07 and curiosity in pentacles-10. Permitted only where the conceit is itself about exchange.
Everywhere else, one plain cost word at most, and figures come from the
card's own assigned domain in CONCEITS.md.

**One template opener per batch, not seven.** "Recorded X." is
sanctioned twice per batch. It was the signature of the winning Voice A
sample, used once.

**Variant slots must not develop fixed shapes.** No slot index may
carry the same opening move in more than half the cards of a batch.
Three angles on one conceit was the requirement. Three fixed costumes
is the failure.

**Ending shapes are rationed.** Per card, at most two of three reading
lines end on a two beat epigram. At least one ends flat, the way field
notes stop.

**"The card" is not the narrator.** Two appearances as agent per library
entry. Some library entries should never mention the card or the plate
and should open on the human situation.

**Second person must be structural, not appended.** At most two
"You've been X-ing" constructions per batch. The reader's presence
belongs inside the sentence that needed it.

**Question openers need spread.** The operative floors, per batch. At
least three Who or Whose questions. At least two Where or When. At least
one or-shaped. No double-barreled questions. A secondary ceiling of
seventy percent What or Which, corrected upward from sixty after batch 1
measured seventy. Sixty was aspirational and not calibrated, and hitting
it meant contorting good questions to fill a quota, which is worse than
the repetition it prevents. The floors are the teeth.

**Library entry architecture must vary.** At most half the entries in a
batch open on the plate, meaning a numeral followed by a suit object.
"Three ways this goes wrong" is a structural opener, not a plate
description, and does not count. At least three name no rank. At least two end
without an epigram. Batch 1 has one architecture in all twenty six
entries, which reads as a drumbeat in the full deck read through.

**Alt text describes the rendered plate.** Not the imagined
illustration. A screen reader user must be told what a sighted user
perceives, and the meaning is carried by the reading line, which the
screen reader also reaches. PIP_LAYOUT in src/design/plate.tsx is the
authority. When a real engraving lands in public/deck, that card's alt
text is rewritten as part of dropping the asset.

## Reference specimens (verbatim, as selected and edited by the author)

### Four of Bellflower · Four of Cups — the ordinary-card standard

> Three cups in reach, all full, none touched. A fourth arriving, easy to
> miss. The subject faces away. Recorded behavior. Wanting, aimed past the
> available. You've been surveying the middle distance for a while now.
>
> Q. What have you stopped seeing?

### The Tower — the heavy-card standard (primary, Voice J)

> You built it, you maintained it, and this week you watched it come down.
> All three of those are true at once, and none of them cancels the others.
> What you knew and couldn't say is now visible from the road. That part, at
> least, is over.
>
> Q. What can you admit now?

Approved heavy-card furniture, same card —

> Something you built came down this week. It went fast at the end, after
> being slow for a long time, the way these things go. You're allowed to just
> stand here for a minute. The card stands with you. The ground under both of
> you held.   (Voice F body — question rejected)

> Trees fall in an afternoon after growing for forty years. The afternoon
> gets all the attention.   (G, opening line)
> Only the clearing is visible from where you stand today, and it is honestly
> wide.   (G, closing line)

### Eight of Lunaria · Eight of Pentacles — the boring-card standard

> Eight pods, one stem. Third cleaner than the first. Eighth cleaner than the
> third. No single specimen worth framing. The series is the specimen. You've
> done the thing again this week. That was the work.
>
> Q. Cleaner than the first attempt, or not yet?

## Library entries and reversals

Same laws — punctuation, mixed rhythm, single ending, second person, concrete
first noun. Library-entry bounds stay 140–170 words pending batch-one
calibration. Reversed lines follow the upright's register, one notch flatter.

## Amendment log

Recast notes from batch review get appended here, dated, before the next
batch starts.

- **2026-07-29, batch 1 review.** Em dashes and en dashes banned outright
  (author: "it looks AI-written"). Batch 1, specimens, templates, and UI
  copy converted. Pivots become full stops. Parentheticals become commas or
  their own sentences. Lint enforces. Tells-to-avoid list gains a ninth
  entry, the dash reflex.
- **2026-07-29, batch 1 accepted.** Author accepted all thirteen cards
  and approved the editorial pass. Cross deck budgets above are now
  binding. Applied to batch 1 in full. Thirteen alt texts corrected from
  imagined artwork to the rendered plate, which was an accessibility
  defect rather than a style note. Two author decisions recorded. The
  cups-05 reversed question lowered from "Who told you comfort was a
  betrayal?" to "Where did that rule come from?" because on the deck's
  heaviest grief card the original analyzed the reader. The pentacles-06
  reversed close lowered from "You'd know. You've kept one." to "Most
  people have kept one." for the same reason.
- **2026-07-29, two rule corrections after measuring batch 1.** The
  question ceiling moved from sixty to seventy percent, see above. The
  bookkeeping budget no longer counts the bare word "tab", because five
  of six flagged instances were browser tabs in cups-07, whose conceit is
  literally seven open tabs. A homonym is a checker defect, not a voice
  defect. Bar-tab usage stays inside the budget by judgment.
- **2026-07-29, batch 2. Question floor lowered from four words to two.**
  Batch 2 produced "Who said it?" on the Three of Gladiolus and
  "Practising, or grinding?" on the Eight of Lunaria. Both are three
  words, both are among the best questions in the batch, and both sit on
  cards where brevity is the point. A floor that forbids them is
  measuring length instead of quality.
- **2026-07-29, batch 2 drift caught and corrected.** Batch 2 drafted at
  11.1 mean words per sentence against batch 1's 7.2, with fragments at 28
  percent against 48. Thirty-eight of seventy-eight reading lines were
  clipped before review, mostly by splitting a trailing "and Y, which is Z"
  clause into its own sentence. That construction is this writer's
  long-sentence tell and is now tell number nine. Post-clip figures are 9.5
  and 35 percent, with every line carrying a short beat. A residual gap to
  batch 1 remains and is accepted, since batch 1 is the outlier.
- **2026-07-29, batch 3. Three checker corrections, no copy changed.**
  "interest" dropped from the bookkeeping list, curiosity in
  pentacles-10. Plate-opener detection tightened to numeral plus suit
  object, since counting any leading numeral flagged eighteen entries
  when the real figure was six. This is the third time a verification
  regex has been cruder than the prose it judges. The pattern is worth
  naming: when a budget check and a careful read disagree, check the
  regex before touching the sentence.
- **2026-07-29, batch 4. The rule of thumb was not enough.** The
  plate-opener false positive recurred one batch after being documented
  here, claiming eleven openers where there were four. Prose rules do not
  survive a verification script rewritten from scratch each batch, so the
  budgets above are now enforced by `tools/batch-budget.ts`, run with
  `npm run lint:batch` against whichever status group is under review.
  Each corrected regex carries a comment naming the clean copy its cruder
  version flagged. When a budget in this section changes, change it there
  too.
- **2026-07-29, batch 4. Court cards take a three-state reversed library
  entry.** Not an inversion. A court card is a person rather than an
  event, and a person has failure modes rather than one opposite. "Three
  ways young interest ends and only one of them is a loss." This applies
  to all sixteen courts and not to the pips.
- **2026-07-29, batch 5. The impersonal-agent check is a construction
  check, not a word list.** Batches 3 and 4 tracked "nobody" and
  "somebody" as crutch words. Batch 5 measures both at zero and reads as
  fixed, and is not, because "no one" appears seven times, "anyone" five
  and "someone" three. The habit is declining to name the agent. Counting
  two spellings of it measured the wrong thing. This is the same class of
  error as the plate-opener regex, which is to say a check cruder than the
  prose it judges, and it is the second one found by reading rather than by
  tooling.
- **2026-07-29, batch 5. Clipping cuts both ways.** Batch 2 drifted long
  and was clipped down. Batch 5 drifted the other way, landing inside the
  sentence-length band while dropping ten points of fragment share and
  gaining two words per line, and the same operation corrected it.
  Nineteen sentences balanced too neatly across an "and", tell number
  eight, were split into a beat plus its remainder. The band is not the
  whole target. Fragment share is what the voice is actually heard as, and
  it belongs in the drift table alongside the mean.
- **2026-07-29, batch 5. Conceits for cards about competence must be
  objects, not virtues.** All eight senior courts are adults who look
  after other people, and the generic version of each is a compliment.
  Every reading line is anchored to a physical thing, a kitchen, a spirit
  level, a spare jumper, an unlocked barn door. That anchoring is what
  keeps eight portraits from reading as eight compliments, and the same
  discipline applies to the Majors that name a quality, M08, M11 and M14
  in particular.
- **2026-07-29, batch 6. A library entry may not restate its own reading
  line.** Nothing was checking this. The swap test compares one card to
  another and so does the sameness linter, while the one screen where a
  reader sees a reading line and its library entry together is the card
  detail page. Shared six-word runs per card ran 0.3 in batches 1 and 2,
  then 1.5, 1.6, 2.2, and 2.8 in batch 6 before correction. `lint:batch`
  now enforces under one per card. When an entry and a line want the same
  idea, the entry says it in different words, because the entry is the long
  form and not the transcript. M16 is exempt, its entry being written
  around the author's frozen specimen phrasing.
- **2026-07-29, batch 6. Reversed library entries for Majors are
  inversions, not three-state.** The courts' three-state form stays with
  the courts. A Major is an event or a force rather than a person, and
  twenty-two more entries opening on "Three ways this goes" would be a
  drumbeat.
- **2026-07-29, batch 6. Heavy cards must not promise the difficulty
  passes, even by implication.** M18 reversed slot 1 read "The face goes
  when the light comes", which is a prediction wearing an observation's
  clothes. Recast to place the face in the hour rather than in the future,
  "It was not there at four in the afternoon." The valve already bans
  promising it passes. The lesson is that the ban includes sentences whose
  grammar is descriptive.
- **2026-07-29, batch 6. Plain statement costs words.** Heavy cards run
  longer per line because the valve asks for the ground-holding fact stated
  plainly, and plain statement has no compression available to it. Batch 6
  is 40.8 against a batch 1 to 4 cluster near 38.5. Accepted for a batch
  of four heavy cards. Not a licence for the ordinary ones.

## Spread lines (Work Order stretch, opened 2026-07-29 once all 78 were final)

Three lines per card, one per spread position, 234 in total. They replace the
keyword-substitution templates in `templates.json`, which are the last
placeholder copy in the repo and the only place the mad-libs register ever
appeared. "{name} to start. {kw1}, with some {kw2} underneath." is what this
section exists to delete.

### The governing constraint

`Spread.tsx` joins the three lines with a single space and renders them as
**one paragraph**. Three cards drawn at random supply the three parts. So each
line has to survive being read immediately after two lines it has never met,
written for other cards, in a different suit, about a different conceit.

That rules out three things outright.

- **No plate description.** The three plates are on screen directly above the
  text. "Three cups in reach, all full" is right for a reading line and wrong
  here, and three of them in a row is a catalogue.
- **At most one of a card's three positions may open with "You."** Otherwise a
  spread can open every sentence with the same word.
- **No question mark, anywhere.** The spread's single question comes from the
  Direction card's existing `questions` array, chosen by the same seed. That
  is why the figure is 234 and not 312.

### Position semantics

- **Situation** — the ground being stood on. Present tense. Names the
  condition and not its cause. No verdict, since the Knot has not been read
  yet.
- **Knot** — where it tightens. The specific snag, not difficulty in general.
  This is the position most likely to slide into diagnosis, and it does not
  get to.
- **Direction** — where the thing already points. **This is the hardest
  constraint in the corpus.** The position is called Direction and the voice
  bans advice verbs, so the line must state a tendency or an available fact
  and leave the step to the reader. The template's instinct, "Notice where
  {kw1} already points", is the right shape and the wrong execution: "notice"
  is both an imperative and a measured crutch word. Permitted move is plain
  indicative. "The short version is already written." Not "write the short
  version."

### Mechanics

- **20 to 30 words each**, 2 to 4 sentences. Shorter than a reading line
  because three are read at once, and 40 each would make a 120-word wall
  under three plates on a 390px screen.
- At least one sentence of six words or fewer in every line.
- Punctuation law unchanged. No colons, no semicolons, no em or en dashes.
- Second person appears in at least one of a card's three lines and not in
  all three as an opener.
- The card's conceit still governs. A spread line is the conceit compressed,
  not a new idea about the card.

### Budgets, per tranche

- "already" is the obvious crutch for Direction. Two per tranche.
- No position may open with the same word more than twice.
- No line may share a six-word run with that card's reading lines or library
  entries. The self-echo rule extends to the new field.
