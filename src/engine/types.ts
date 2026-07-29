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

export interface Meaning {
  general: string
  question: string
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
