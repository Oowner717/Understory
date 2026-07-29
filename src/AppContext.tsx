import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DrawRecord, Entry, Settings } from './engine/types'
import * as storage from './engine/storage'

interface AppData {
  settings: Settings
  entries: Entry[]
  draws: DrawRecord[]
  /** Card ids that have real artwork in /public/deck. */
  art: ReadonlySet<string>
  reducedMotion: boolean
  refreshEntries: () => Promise<void>
  refreshDraws: () => Promise<void>
  updateSettings: (s: Settings) => Promise<void>
}

const Ctx = createContext<AppData | null>(null)

export function useApp(): AppData {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside provider')
  return v
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [draws, setDraws] = useState<DrawRecord[]>([])
  const [art, setArt] = useState<ReadonlySet<string>>(new Set())
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    let alive = true
    Promise.all([storage.getSettings(), storage.getEntries(), storage.getDraws()]).then(
      ([s, e, d]) => {
        if (!alive) return
        setSettings(s)
        setEntries(e)
        setDraws(d)
      },
    )
    fetch(`${import.meta.env.BASE_URL}deck/manifest.json`)
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((m: { cards?: string[] }) => {
        if (alive) setArt(new Set(m.cards ?? []))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setOsReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const reducedMotion = osReduced || (settings?.reduceMotion ?? false)

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(settings?.reduceMotion ?? false)
  }, [settings?.reduceMotion])

  const refreshEntries = useCallback(async () => setEntries(await storage.getEntries()), [])
  const refreshDraws = useCallback(async () => setDraws(await storage.getDraws()), [])
  const updateSettings = useCallback(async (s: Settings) => {
    setSettings(s)
    await storage.saveSettings(s)
  }, [])

  const value = useMemo<AppData | null>(
    () =>
      settings
        ? { settings, entries, draws, art, reducedMotion, refreshEntries, refreshDraws, updateSettings }
        : null,
    [settings, entries, draws, art, reducedMotion, refreshEntries, refreshDraws, updateSettings],
  )

  if (!value) return null // first paint waits on IndexedDB; it's a few ms
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
