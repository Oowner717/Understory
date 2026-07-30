import { meaningFor } from './content'
import { hashString, mulberry32 } from './draw'
import type { Card, SpreadLines } from './types'

/*
 * The reading composer. No AI anywhere and, since the spread corpus was
 * completed, no templates either: each card carries one authored line per
 * spread position and the reading is those three lines in order.
 *
 * `templates.json` used to live here, filling slot-based sentences from card
 * keywords. It was the last placeholder copy in the repo and the only place
 * the mad-libs register ever appeared. It is gone.
 */

export interface SpreadReading {
  sentences: [string, string, string]
  question: string
}

function pick<T>(arr: T[], rng: () => number): T {
  const item = arr[Math.floor(rng() * arr.length)]
  if (item === undefined) throw new Error('empty list')
  return item
}

function line(card: Card, position: keyof SpreadLines): string {
  return meaningFor(card.id).spread[position]
}

export function composeReading(cards: [Card, Card, Card], dateStr: string): SpreadReading {
  const [situation, knot, direction] = cards

  /* Seeded so a given spread rereads identically all day. The three lines are
   * fixed per card, so the only draw is the question. */
  const rng = mulberry32(hashString(dateStr + cards.map((c) => c.id).join('|')))

  const sentences: [string, string, string] = [
    line(situation, 'situation'),
    line(knot, 'knot'),
    line(direction, 'direction'),
  ]

  /* The spread's one question comes from the Direction card's own questions,
   * which is why the spread corpus is 234 lines and not 312. */
  const questions = meaningFor(direction.id).questions.filter(Boolean)
  const question = questions.length > 0 ? pick(questions, rng) : ''

  return { sentences, question }
}
