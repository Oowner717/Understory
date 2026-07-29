import cardsJson from '../content/cards.json'
import meaningsJson from '../content/meanings.json'
import templatesJson from '../content/templates.json'
import type { Card, Meaning, Suit } from './types'

export const CARDS = cardsJson as Card[]

const byId = new Map<string, Card>(CARDS.map((c) => [c.id, c]))

export function cardById(id: string): Card | undefined {
  return byId.get(id)
}

const meanings = meaningsJson as Record<string, Meaning | string>

export function meaningFor(cardId: string): Meaning {
  const m = meanings[cardId]
  if (m && typeof m !== 'string') return m
  return { general: '', question: '' }
}

export interface Templates {
  situation: string[]
  knot: string[]
  direction: string[]
  questions: string[]
}

const { _note: _templatesNote, ...templateRest } = templatesJson
void _templatesNote
export const TEMPLATES = templateRest as Templates

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
