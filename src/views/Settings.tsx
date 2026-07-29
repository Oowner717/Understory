import { useApp } from '../AppContext'
import { cardById } from '../engine/content'
import { formatFull } from '../engine/dates'
import { wipeAll } from '../engine/storage'

/** Export, motion, and the way out. The journal is the user's; it exports whole. */
export function Settings() {
  const { settings, entries, updateSettings } = useApp()

  function exportJournal() {
    const sorted = [...entries]
      .filter((e) => e.text.trim().length > 0)
      .sort((a, b) => (a.isoDate < b.isoDate ? -1 : 1))
    const lines: string[] = ['UNDERSTORY — JOURNAL EXPORT', '', `Exported ${new Date().toLocaleString()}`, '']
    for (const e of sorted) {
      const names = e.cardIds
        .map((id) => {
          const c = cardById(id)
          return c ? (c.name === c.classicName ? c.name : `${c.name} (${c.classicName})`) : id
        })
        .join(', ')
      lines.push('— — —', '', `${formatFull(e.isoDate)} · ${names}`, '', e.text.trim(), '')
    }
    if (sorted.length === 0) lines.push('No entries yet.')
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'understory-journal.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function startOver() {
    if (!window.confirm('Start over? This erases every entry, draw, and setting on this device.')) return
    if (!window.confirm('Once more, to be sure: erase everything? There is no undo and no backup.')) return
    await wipeAll()
    window.location.hash = '#/today'
    window.location.reload()
  }

  return (
    <article className="view view-settings">
      <header className="view-head">
        <h1 className="view-title">Settings</h1>
      </header>

      <section className="settings-group">
        <h2 className="section-title">Your journal</h2>
        <p className="settings-note">Everything you've written, as one plain-text file.</p>
        <button type="button" className="button" onClick={exportJournal}>
          Export journal (.txt)
        </button>
      </section>

      <section className="settings-group">
        <h2 className="section-title">Motion</h2>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => void updateSettings({ ...settings, reduceMotion: e.target.checked })}
          />
          Reduce motion (the card flip becomes a crossfade)
        </label>
        <p className="settings-note">Your system's reduce-motion setting is honored either way.</p>
      </section>

      <section className="settings-group">
        <h2 className="section-title">Start over</h2>
        <p className="settings-note">Erase every entry, draw, and setting on this device.</p>
        <button type="button" className="button button--quiet" onClick={() => void startOver()}>
          Start over
        </button>
      </section>

      <p className="privacy-line">
        Everything you write stays on this device. This playtest makes no network requests.
      </p>
    </article>
  )
}
