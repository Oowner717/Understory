# VOICE.md — the single source of truth for every word in Understory

This file supersedes the voice rules in the build prompt (it expands them; it
contradicts nothing). Every string in the app — card copy, UI copy, errors,
store listing — answers to this document. The linters in `/tools` enforce the
mechanical parts; the rest is judgment, and the judgment lives here.

**The differentiation test, applied to every sentence we ship:** *would this
sentence be at home in a generic daily-horoscope app?* If yes, it's cut. No
exceptions, including for sentences the author wrote and likes.

---

## 1. Register

- Second person. The reader is "you"; the app has no "I".
- Plain words. If a shorter, older word exists, use it.
- Short sentences, with deliberate variation. A four-word sentence after two
  long ones is a tool. Uniform rhythm is a tell (the linter flags it).
- Warm, dry, faintly wry. Wry means one eyebrow, not a wink; at most one
  wry turn per entry, and never on the hard cards.
- The app **notices; it never predicts**. Everything is written from
  observation of the present or the recent past. The future appears only as
  a question the reader answers.
- Never console by minimizing. "It's not so bad" is a lie told to get away
  from someone else's discomfort. Name the thing and stay in the room.
- **No colons, semicolons, or em/en dashes in card copy** (author's rules,
  Gate 1 and batch 1; lint-enforced). Periods and commas do all the work.
  See `VOICE-SPEC.md`.

## 2. Banned outright (lint-enforced)

Predictive / mystical filler — never, in any form:

> will / won't / going to (predictive), fortune, destiny, fate,
> "the universe", energy / energies, vibration, manifest / manifesting,
> abundance, journey (as metaphor), "trust the process",
> "everything happens for a reason", soul, divine, blessed, "meant to be"

Advice verbs — never:

> should, must, need to, have to, ought

Guidance that could be health, financial, or legal advice — never, in any
form, including softened forms ("it might be worth seeing someone about
that", "consider talking to a professional"). The app is a mirror, not a
clinician, an advisor, or a lawyer.

The single exemption: **"The Wheel of Fortune"** as a card's classic title.
The word "fortune" appears nowhere else.

## 3. Banned by shape — the Barnum patterns

Sentences that are true of everyone are the enemy even when they contain no
banned word. They read as insight and cost nothing, which is why every
horoscope app is built from them. Catalogue of shapes, with examples:

| Shape | Example (banned) |
| --- | --- |
| Hidden-burden flattery | "You have been carrying more than you let on." |
| You-already-know | "Part of you knows this already." |
| Universal inner conflict | "There is tension between what you want and what you fear." |
| Two-selves | "One part of you wants change; another clings to safety." |
| Unclaimed depth | "There is more to this than meets the eye." |
| Threshold vagueness | "You are on the edge of something new." |
| Flattering exhaustion | "You give so much of yourself to others." |
| Time-for platitude | "It is time to focus on what really matters." |

All are unfalsifiable flattery. **The rewrite move is always the same:
replace the universal claim with a concrete image and let the reader do the
mapping.** Not "you've been carrying a lot" but "the thing you keep meaning
to deal with on Sunday."

The linter matches the shapes below (regex, case-insensitive) against all
copy. Maintain this list as new patterns are noticed; loosen any rule that
false-positives more than occasionally.

```barnum-patterns
carrying more than
part of you (already )?(knows|wants|fears|clings)
more to (this|it) than meets
tension between what you want
one part of you .* another
on the (edge|verge|cusp|threshold) of something
you give so much
time to focus on what (really|truly) matters
deep down,? you
more than you let on
something (inside|within) you
you are (stronger|braver|wiser) than you (think|know)
at a crossroads
a new chapter
what (really|truly) matters most
```

## 4. The specificity rule

**Specific in image, open in application.** A vivid concrete noun the reader
maps onto their own week beats both abstraction (fits everyone, means
nothing) and prediction (fits nobody, is a lie). The image is a peg; the
reader hangs their own coat on it.

Worked rewrites:

1. ✗ "You have been under a lot of pressure lately."
   ✓ "Ten sticks, one back. Some of this load you picked up because you were standing near it."
2. ✗ "Change is coming into your life."
   ✓ "Something built has come down. The air over the site is clearer than it's been in months."
3. ✗ "You may be avoiding a difficult conversation."
   ✓ "There's a sentence you've rehearsed in the shower and nowhere else."
4. ✗ "It is a good time for reflection and self-care."
   ✓ "Blades hung up, lights low. Rest counts as a task; it has its own done."
5. ✗ "Your hard work is starting to pay off."
   ✓ "Leaning on the hoe, counting pods. From up close, growth looks exactly like nothing happening."

## 5. Question craft

The question is the product; the meaning is setup. A good question is:

- **Answerable today**, with a pen, in under five minutes.
- **About the last week**, not the eternal. "Lately" beats "in your life."
- **Concrete.** It points at a nameable thing: a task, a person, a sentence,
  a room, a habit.
- **Slightly uncomfortable.** It goes one notch past polite.

Never: yes/no questions. Never "how does that make you feel." Never
abstract-noun essay prompts ("what does strength mean to you?").

Worked rewrites:

1. ✗ "What does letting go mean to you?"
   ✓ "What are you still watering that's already done?"
2. ✗ "Are you happy with your work?"
   ✓ "What part of yesterday would you keep if the rest were optional?"
3. ✗ "How do you handle conflict?"
   ✓ "What is this argument standing in for?"
4. ✗ "What are you grateful for?"
   ✓ "What went right this week that you had rehearsed going wrong?"
5. ✗ "Do you trust yourself?"
   ✓ "What did you already decide, before you started collecting opinions?"

## 6. Tone under load

Roughly twelve cards land on people having bad days: Death, The Tower, The
Devil, The Moon, Three / Nine / Ten of Gladiolus (Swords), Five of
Bellflower (Cups), Five of Lunaria (Pentacles), Eight of Gladiolus, Seven
of Gladiolus, Ten of Hawthorn (Wands). For these:

- **Name the difficulty plainly.** The reader already knows; pretending
  otherwise is insulting.
- **Do not catastrophize.** The card is an image, not a verdict.
- **Do not promise it passes.** That's a prediction and a pat on the head.
- **Do not diagnose.** No inner wounds, no attachment styles, no burnout.
- **Do not advise.** No next steps, no reframes offered as instructions.
- **Offer a question that makes the situation more legible rather than less
  painful.** Legibility is the mercy on offer; it is real, and it is enough.

Reference specimens: _the full authored text of the two hardest cards goes
here after Gate 1 — see the work order. Placeholder until the author has
written them._

## 7. Structural variation

Four permitted opening moves for card entries, with target distribution
across the 78 (the sameness linter reports actuals):

| Move | Example opening | Target |
| --- | --- | --- |
| **Image-first** | "Ten sticks, one back." | ~40% |
| **Observation-first** | "Rest is a task with its own completion state." | ~25% |
| **Contrast** | "Won, technically." | ~20% |
| **Direct address** | "You've done the sending; now comes the watching." | ~15% |

No two adjacent cards in deck order open with the same move if it can be
helped; no suit leans on one move for more than half its cards.

## 8. Dual naming

The botanical name leads; the classic name anchors. **Teach by use, never by
explanation.** The copy never explains the conceit, never writes "also known
as," never glosses one name with the other outside the standing subtitle
pattern ("Five of Gladiolus · Five of Swords"). A reader who wonders is a
reader who looks — that's the Library's job.

## 9. UI copy rules (summary; see `/content/ui-strings.ts`)

- Name things by what the person controls, never by how the system works.
- Active voice. A button and its resulting toast share a verb
  ("Save entry" → "Saved").
- Errors state what happened and what to do, in the interface's voice, and
  never apologize. Empty states are invitations, not apologies.
- Sentence case throughout. One job per string.
- Notifications are static, never include a card name or journal content,
  and must be comfortable on a lock screen a stranger can see.

## 10. Provenance (non-negotiable)

Claude drafts are stimulus, never final text. Drafts live in
`/src/content/drafts/` and nowhere else. Only text the author has personally
rewritten moves into `meanings.json`, and moving it is a step the author
performs. `PROVENANCE.md` records who drafted and who authored, per card.
Nothing ships while any card's `status` is `placeholder` or `drafted`.
