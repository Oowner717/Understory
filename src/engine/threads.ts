import type { DrawRecord, Suit } from './types'
import { cardById } from './content'

export interface ThreadsSummary {
  /** Total draws in the window; below `MIN_DRAWS` the UI shows the preview state. */
  drawCount: number
  /** Up to three most-drawn cards in the window, most first. */
  topCards: { cardId: string; count: number }[]
  /** Draw counts per suit (majors sit outside the balance bar). */
  suitCounts: Record<Suit, number>
}

export const MIN_DRAWS = 5
export const WINDOW_DAYS = 30

export function summarizeThreads(draws: DrawRecord[], today: string): ThreadsSummary {
  const cutoff = new Date(`${today}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

  const recent = draws.filter((d) => d.isoDate >= cutoffStr && d.isoDate <= today)

  const perCard = new Map<string, number>()
  const suitCounts: Record<Suit, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 }

  for (const d of recent) {
    perCard.set(d.cardId, (perCard.get(d.cardId) ?? 0) + 1)
    const suit = cardById(d.cardId)?.suit
    if (suit) suitCounts[suit] += 1
  }

  const topCards = [...perCard.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, 3)
    .map(([cardId, count]) => ({ cardId, count }))

  return { drawCount: recent.length, topCards, suitCounts }
}
