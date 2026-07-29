import { useApp } from '../AppContext'
import { STR } from '../content/ui-strings'
import { ThreadsPanel } from '../components/ThreadsPanel'
import { cardById, SUIT_ACCENT } from '../engine/content'
import { formatRelative } from '../engine/dates'
import { localDateString } from '../engine/draw'

function firstLine(text: string): string {
  const line = text.trim().split('\n')[0] ?? ''
  return line.length > 90 ? `${line.slice(0, 90)}…` : line
}

/** Reverse-chron list of entries, with Threads above it. */
export function Journal() {
  const { entries } = useApp()
  const today = localDateString()
  const sorted = [...entries]
    .filter((e) => e.text.trim().length > 0)
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : b.createdAt - a.createdAt))

  return (
    <article className="view view-journal">
      <header className="view-head">
        <h1 className="view-title">{STR.journal.title}</h1>
      </header>

      <ThreadsPanel />

      {sorted.length === 0 ? (
        <p className="empty-state">
          {STR.journal.emptyLead} <a href="#/today">{STR.journal.emptyLink}</a>
        </p>
      ) : (
        <ul className="entry-list">
          {sorted.map((e) => (
            <li key={e.id}>
              <a className="entry-item" href={`#/entry/${encodeURIComponent(e.id)}`}>
                <span className="entry-date">{formatRelative(e.isoDate, today)}</span>
                <span className="entry-chips">
                  {e.cardIds.map((id) => {
                    const card = cardById(id)
                    if (!card) return null
                    return (
                      <span className="card-chip" key={id}>
                        {card.suit && (
                          <span
                            className="suit-dot"
                            style={{ background: SUIT_ACCENT[card.suit] }}
                            aria-hidden="true"
                          />
                        )}
                        {card.name}
                      </span>
                    )
                  })}
                </span>
                <span className="entry-excerpt">{firstLine(e.text)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
