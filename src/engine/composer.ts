import { TEMPLATES, meaningFor } from './content'
import { hashString, mulberry32 } from './draw'
import type { Card, SpreadLines } from './types'

/*
 * The reading composer. No AI anywhere: slot-based sentence templates,
 * filled from card keywords, seeded by date + card ids so a given draw
 * reads the same every time it is revisited.
 */

export interface SpreadReading {
  sentences: [string, string, string]
  question: string
}

function fill(template: string, card: Card): string {
  const kw1 = card.keywords[0] ?? 'quiet'
  const kw2 = card.keywords[1] ?? kw1
  const filled = template
    .replaceAll('{name}', card.name)
    .replaceAll('{kw1}', kw1)
    .replaceAll('{kw2}', kw2)
  /* Keywords are stored lowercase and several templates drop one at the start
   * of a sentence, which shipped "Ten of Bellflower. accord, and a thread of
   * home." Caught by rendering a real spread rather than by any linter, since
   * the defect lives in the join and not in either string. Dies with the
   * templates once all 234 spread lines exist. */
  return filled.replace(/([.!?]\s+)([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase())
}

function pick<T>(arr: T[], rng: () => number): T {
  const item = arr[Math.floor(rng() * arr.length)]
  if (item === undefined) throw new Error('empty template list')
  return item
}

/** Authored spread line for a card in a position, or '' if not yet written. */
function authored(card: Card, position: keyof SpreadLines): string {
  return meaningFor(card.id).spread[position]
}

export function composeReading(cards: [Card, Card, Card], dateStr: string): SpreadReading {
  const [situation, knot, direction] = cards
  const rng = mulberry32(hashString(dateStr + cards.map((c) => c.id).join('|')))

  /* Authored copy wins. The template fallback stays until all 234 lines exist,
   * so a half-written corpus still composes a reading rather than a gap. Each
   * template pick consumes rng in the same order either way, so a spread reads
   * identically before and after its cards get authored lines. */
  const situationLine = pick(TEMPLATES.situation, rng)
  const knotLine = pick(TEMPLATES.knot, rng)
  const directionLine = pick(TEMPLATES.direction, rng)
  const fallbackQuestion = pick(TEMPLATES.questions, rng)

  const sentences: [string, string, string] = [
    authored(situation, 'situation') || fill(situationLine, situation),
    authored(knot, 'knot') || fill(knotLine, knot),
    authored(direction, 'direction') || fill(directionLine, direction),
  ]

  /* The spread's one question comes from the Direction card's own questions,
   * which is why the stretch goal is 234 lines and not 312. */
  const dirQuestions = meaningFor(direction.id).questions.filter(Boolean)
  const question = dirQuestions.length > 0 ? pick(dirQuestions, rng) : fill(fallbackQuestion, direction)

  return { sentences, question }
}
