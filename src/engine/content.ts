import cardsJson from '../content/cards.json'
import meaningsJson from '../content/meanings.json'
import type { Card, Meaning, Suit } from './types'

export const CARDS = cardsJson as Card[]

const byId = new Map<string, Card>(CARDS.map((c) => [c.id, c]))

export function cardById(id: string): Card | undefined {
  return byId.get(id)
}

export const MEANINGS = (meaningsJson as { meanings: Meaning[] }).meanings

const meaningById = new Map<string, Meaning>(MEANINGS.map((m) => [m.cardId, m]))

const EMPTY_MEANING: Omit<Meaning, 'cardId'> = {
  keywords: [],
  readingLines: [],
  questions: [],
  libraryEntry: '',
  reversed: { readingLines: [], questions: [], libraryEntry: '' },
  altText: '',
  spread: { situation: '', knot: '', direction: '' },
  status: 'placeholder',
}

export function meaningFor(cardId: string): Meaning {
  return meaningById.get(cardId) ?? { cardId, ...EMPTY_MEANING }
}

export const SUITS: Suit[] = ['wands', 'cups', 'swords', 'pentacles']

export const SUIT_LABEL: Record<Suit, string> = {
  wands: 'Hawthorn · Wands',
  cups: 'Bellflower · Cups',
  swords: 'Gladiolus · Swords',
  pentacles: 'Lunaria · Pentacles',
}

export const SUIT_ACCENT: Record<Suit, string> = {
  wands: 'var(--accent-wands)',
  cups: 'var(--accent-cups)',
  swords: 'var(--accent-swords)',
  pentacles: 'var(--accent-pentacles)',
}

const ROMAN = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI',
  'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
]

/** Plate label in specimen-plate convention: majors "PL. IX", minors "Fig. 7". */
export function plateLabel(card: Card): string {
  if (card.arcana === 'major') {
    const n = Number(card.id.slice(1))
    return `PL. ${ROMAN[n] ?? n}`
  }
  const r = card.rank
  if (typeof r === 'number') return `Fig. ${r}`
  return `Fig. ${String(r).charAt(0).toUpperCase()}${String(r).slice(1)}`
}

/** Majors keep one title; minors carry both names. */
export function hasDualName(card: Card): boolean {
  return card.name !== card.classicName
}
