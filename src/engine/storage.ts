import { get, set, clear } from 'idb-keyval'
import type { DrawRecord, Entry, Settings } from './types'

const KEY_SETTINGS = 'understory:settings'
const KEY_ENTRIES = 'understory:entries'
const KEY_DRAWS = 'understory:draws'

export async function getSettings(): Promise<Settings> {
  const existing = await get<Settings>(KEY_SETTINGS)
  if (existing?.deviceSeed) return existing
  const fresh: Settings = {
    deviceSeed: crypto.randomUUID(),
    reduceMotion: false,
  }
  await set(KEY_SETTINGS, fresh)
  return fresh
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(KEY_SETTINGS, settings)
}

export async function getEntries(): Promise<Entry[]> {
  return (await get<Entry[]>(KEY_ENTRIES)) ?? []
}

export async function saveEntry(entry: Entry): Promise<void> {
  const entries = await getEntries()
  const i = entries.findIndex((e) => e.id === entry.id)
  if (i >= 0) entries[i] = entry
  else entries.push(entry)
  await set(KEY_ENTRIES, entries)
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await getEntries()
  await set(
    KEY_ENTRIES,
    entries.filter((e) => e.id !== id),
  )
}

export async function getDraws(): Promise<DrawRecord[]> {
  return (await get<DrawRecord[]>(KEY_DRAWS)) ?? []
}

export async function appendDraws(records: DrawRecord[]): Promise<void> {
  const draws = await getDraws()
  await set(KEY_DRAWS, [...draws, ...records])
}

/** The daily draw is logged once per local date, no matter how often Today is opened. */
export async function logDailyDrawOnce(cardId: string, isoDate: string): Promise<void> {
  const draws = await getDraws()
  if (draws.some((d) => d.source === 'daily' && d.isoDate === isoDate)) return
  await set(KEY_DRAWS, [...draws, { cardId, isoDate, source: 'daily' as const }])
}

/**
 * Echo: the most recent earlier entry that includes this card and has words in it.
 * `excludeId` keeps today's own entry from echoing itself.
 */
export function findEcho(entries: Entry[], cardId: string, excludeId?: string): Entry | undefined {
  return entries
    .filter((e) => e.id !== excludeId && e.cardIds.includes(cardId) && e.text.trim().length > 0)
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : b.createdAt - a.createdAt))[0]
}

export async function wipeAll(): Promise<void> {
  await clear()
}
