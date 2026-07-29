import { TEMPLATES } from './content'
import { hashString, mulberry32 } from './draw'
import type { Card } from './types'

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
  return template.replaceAll('{name}', card.name).replaceAll('{kw1}', kw1).replaceAll('{kw2}', kw2)
}

function pick<T>(arr: T[], rng: () => number): T {
  const item = arr[Math.floor(rng() * arr.length)]
  if (item === undefined) throw new Error('empty template list')
  return item
}

export function composeReading(cards: [Card, Card, Card], dateStr: string): SpreadReading {
  const [situation, knot, direction] = cards
  const rng = mulberry32(hashString(dateStr + cards.map((c) => c.id).join('|')))

  const sentences: [string, string, string] = [
    fill(pick(TEMPLATES.situation, rng), situation),
    fill(pick(TEMPLATES.knot, rng), knot),
    fill(pick(TEMPLATES.direction, rng), direction),
  ]
  const question = fill(pick(TEMPLATES.questions, rng), direction)

  return { sentences, question }
}
