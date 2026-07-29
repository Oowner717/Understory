export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type Rank = number | 'page' | 'knight' | 'queen' | 'king'

export interface Card {
  id: string
  name: string
  classicName: string
  arcana: 'major' | 'minor'
  suit?: Suit
  rank?: Rank
  keywords: string[]
}

export type MeaningStatus = 'placeholder' | 'drafted' | 'authored' | 'final'

export interface ReversedMeaning {
  readingLine: string
  question: string
  libraryEntry: string
}

/** Layered card copy. See VOICE.md; `status` drives the writing dashboard
 *  and the ship gate — nothing ships while any card is placeholder/drafted. */
export interface Meaning {
  cardId: string
  keywords: string[]
  /** 2–3 sentences shown right after a draw (~40–55 words). */
  readingLine: string
  /** Exactly one question (~10–20 words). The product. */
  question: string
  /** ~140–170 words, shown in Card Detail. Empty = fall back to readingLine. */
  libraryEntry: string
  /** Written during the campaign; gated behind the paid tier later. Unused by the playtest UI. */
  reversed: ReversedMeaning
  /** ~15 words, VoiceOver description of the plate. Empty = generated alt. */
  altText: string
  status: MeaningStatus
}

export type DrawSource = 'daily' | 'spread'

export interface DrawRecord {
  cardId: string
  isoDate: string
  source: DrawSource
}

export interface Entry {
  id: string
  isoDate: string
  cardIds: string[]
  text: string
  source: DrawSource
  createdAt: number
  updatedAt: number
}

export interface Settings {
  deviceSeed: string
  reduceMotion: boolean
}
