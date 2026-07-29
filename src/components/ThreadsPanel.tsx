import { useApp } from '../AppContext'
import { STR } from '../content/ui-strings'
import { cardById, SUIT_ACCENT } from '../engine/content'
import { localDateString } from '../engine/draw'
import { MIN_DRAWS, summarizeThreads, WINDOW_DAYS } from '../engine/threads'
import { SUITS } from '../engine/content'

const SUIT_SHORT: Record<string, string> = {
  wands: 'Hawthorn',
  cups: 'Bellflower',
  swords: 'Gladiolus',
  pentacles: 'Lunaria',
}

/**
 * Threads Lite: what keeps coming up. Most-drawn cards over the last 30
 * days and a suit-balance bar. Under five draws it's an invitation, not
 * an apology.
 */
export function ThreadsPanel() {
  const { draws } = useApp()
  const summary = summarizeThreads(draws, localDateString())

  if (summary.drawCount < MIN_DRAWS) {
    return (
      <section className="threads" aria-labelledby="threads-h">
        <h2 id="threads-h" className="section-title">
          {STR.threads.title}
        </h2>
        <p className="threads-preview">{STR.threads.preview}</p>
      </section>
    )
  }

  const suitTotal = SUITS.reduce((n, s) => n + summary.suitCounts[s], 0)

  return (
    <section className="threads" aria-labelledby="threads-h">
      <h2 id="threads-h" className="section-title">
        {STR.threads.titleWindowed(WINDOW_DAYS)}
      </h2>
      <ol className="threads-top">
        {summary.topCards.map(({ cardId, count }) => {
          const card = cardById(cardId)
          if (!card) return null
          return (
            <li key={cardId}>
              <a href={`#/card/${cardId}`} className="threads-card">
                {card.suit && (
                  <span
                    className="suit-dot"
                    style={{ background: SUIT_ACCENT[card.suit] }}
                    aria-hidden="true"
                  />
                )}
                <span className="threads-name">{card.name}</span>
                <span className="threads-count">×{count}</span>
              </a>
            </li>
          )
        })}
      </ol>
      {suitTotal > 0 && (
        <>
          <div
            className="suit-bar"
            role="img"
            aria-label={`${STR.threads.suitBalanceLabel}: ${SUITS.map((s) => `${SUIT_SHORT[s]} ${summary.suitCounts[s]}`).join(', ')}`}
          >
            {SUITS.map((s) =>
              summary.suitCounts[s] > 0 ? (
                <span
                  key={s}
                  className="suit-bar-seg"
                  style={{
                    flexGrow: summary.suitCounts[s],
                    background: SUIT_ACCENT[s],
                  }}
                />
              ) : null,
            )}
          </div>
          <p className="suit-bar-legend">
            {SUITS.filter((s) => summary.suitCounts[s] > 0).map((s) => (
              <span key={s} className="suit-bar-key">
                <span className="suit-dot" style={{ background: SUIT_ACCENT[s] }} aria-hidden="true" />
                {SUIT_SHORT[s]} {summary.suitCounts[s]}
              </span>
            ))}
          </p>
        </>
      )}
    </section>
  )
}
