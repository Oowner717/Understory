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
  readingLines: string[]
  questions: string[]
  libraryEntry: string
}

/** Variant-depth card copy (Work Order v3). Three reading lines + three
 *  questions per card, paired by index, upright and reversed. `status`
 *  drives the writing dashboard and the ship gate — nothing ships below
 *  `final`. Voice contract: VOICE-SPEC.md. */
export interface Meaning {
  cardId: string
  keywords: string[]
  /** Three angles on one conceit, 35–52 words each; variant chosen per day. */
  readingLines: string[]
  /** One per reading line, paired by index. ≤12 words. The product. */
  questions: string[]
  /** ~140–170 words, shown in Card Detail. Empty = fall back to readingLines[0]. */
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
