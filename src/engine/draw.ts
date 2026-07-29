import { CARDS } from './content'
import type { Card } from './types'

/** Deterministic 53-bit string hash (cyrb53). Stable across sessions and devices. */
export function hashString(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** Local calendar date as YYYY-MM-DD — the daily card changes at local midnight. */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** One card per day per device: hash(localDate + deviceSeed) % 78. */
export function dailyCard(dateStr: string, deviceSeed: string): Card {
  const index = hashString(dateStr + deviceSeed) % CARDS.length
  const card = CARDS[index]
  if (!card) throw new Error('deck is empty')
  return card
}

/** Three unique cards, uniform, via crypto.getRandomValues (rejection sampling). */
export function drawSpread(): [Card, Card, Card] {
  const picked: Card[] = []
  const seen = new Set<number>()
  const buf = new Uint32Array(1)
  const n = CARDS.length
  const limit = Math.floor(0xffffffff / n) * n
  while (picked.length < 3) {
    crypto.getRandomValues(buf)
    const v = buf[0] as number
    if (v >= limit) continue
    const idx = v % n
    if (seen.has(idx)) continue
    seen.add(idx)
    const card = CARDS[idx]
    if (card) picked.push(card)
  }
  return picked as [Card, Card, Card]
}

/** Small deterministic PRNG for the composer (seeded by date + card ids). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
