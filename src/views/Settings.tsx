import { useApp } from '../AppContext'
import { STR } from '../content/ui-strings'
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
    const lines: string[] = [STR.settings.exportHeader, '', `Exported ${new Date().toLocaleString()}`, '']
    for (const e of sorted) {
      const names = e.cardIds
        .map((id) => {
          const c = cardById(id)
          return c ? (c.name === c.classicName ? c.name : `${c.name} (${c.classicName})`) : id
        })
        .join(', ')
      lines.push('* * *', '', `${formatFull(e.isoDate)} · ${names}`, '', e.text.trim(), '')
    }
    if (sorted.length === 0) lines.push(STR.settings.exportEmpty)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = STR.settings.exportFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function startOver() {
    if (!window.confirm(STR.settings.startOverConfirm1)) return
    if (!window.confirm(STR.settings.startOverConfirm2)) return
    await wipeAll()
    window.location.hash = '#/today'
    window.location.reload()
  }

  return (
    <article className="view view-settings">
      <header className="view-head">
        <h1 className="view-title">{STR.settings.title}</h1>
      </header>

      <section className="settings-group">
        <h2 className="section-title">{STR.settings.journalHeading}</h2>
        <p className="settings-note">{STR.settings.journalNote}</p>
        <button type="button" className="button" onClick={exportJournal}>
          {STR.settings.exportButton}
        </button>
      </section>

      <section className="settings-group">
        <h2 className="section-title">{STR.settings.motionHeading}</h2>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => void updateSettings({ ...settings, reduceMotion: e.target.checked })}
          />
          {STR.settings.motionToggle}
        </label>
        <p className="settings-note">{STR.settings.motionNote}</p>
      </section>

      <section className="settings-group">
        <h2 className="section-title">{STR.settings.startOverHeading}</h2>
        <p className="settings-note">{STR.settings.startOverNote}</p>
        <button type="button" className="button button--quiet" onClick={() => void startOver()}>
          {STR.settings.startOverButton}
        </button>
      </section>

      <p className="privacy-line">{STR.settings.privacyLine}</p>
    </article>
  )
}
