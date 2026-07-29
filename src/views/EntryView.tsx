import { useApp } from '../AppContext'
import { CardPlate } from '../components/CardPlate'
import { EntryEditor } from '../components/EntryEditor'
import { cardById } from '../engine/content'
import { formatFull } from '../engine/dates'
import { deleteEntry, saveEntry } from '../engine/storage'

/** One entry in full, with its card(s). Editable; deletable with a confirm. */
export function EntryView({ id }: { id: string }) {
  const { entries, refreshEntries } = useApp()
  const entry = entries.find((e) => e.id === id)

  if (!entry) {
    return (
      <article className="view">
        <p className="empty-state">
          No entry here. <a href="#/journal">Back to the journal.</a>
        </p>
      </article>
    )
  }

  async function save(text: string) {
    if (!entry) return
    await saveEntry({ ...entry, text, updatedAt: Date.now() })
    await refreshEntries()
  }

  async function remove() {
    if (!window.confirm('Delete this entry? There is no undo.')) return
    await deleteEntry(entry!.id)
    await refreshEntries()
    window.location.hash = '#/journal'
  }

  return (
    <article className="view view-entry">
      <header className="view-head">
        <p className="view-kicker">
          <a href="#/journal">← Journal</a>
        </p>
        <h1 className="view-title">{formatFull(entry.isoDate)}</h1>
      </header>

      <div className="entry-plates">
        {entry.cardIds.map((cardId) => {
          const card = cardById(cardId)
          if (!card) return null
          return (
            <a key={cardId} href={`#/card/${cardId}`} className="entry-plate" aria-label={card.name}>
              <CardPlate card={card} size="thumb" />
            </a>
          )
        })}
      </div>

      <EntryEditor key={entry.id} initialText={entry.text} onSave={save} />

      <p className="entry-actions">
        <button type="button" className="button button--quiet" onClick={() => void remove()}>
          Delete entry
        </button>
      </p>
    </article>
  )
}
