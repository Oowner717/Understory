import { useState } from 'react'
import { useApp } from '../AppContext'
import { CardFlip } from '../components/CardFlip'
import { EntryEditor } from '../components/EntryEditor'
import { composeReading } from '../engine/composer'
import { drawSpread, localDateString } from '../engine/draw'
import { appendDraws, saveEntry } from '../engine/storage'
import type { Card } from '../engine/types'

const POSITIONS = ['Situation', 'Knot', 'Direction'] as const

/**
 * One three-card spread: Situation · Knot · Direction. Random without
 * replacement; the composed reading is deterministic for a given draw.
 */
export function Spread() {
  const { entries, refreshEntries, refreshDraws } = useApp()
  const today = localDateString()
  const [cards, setCards] = useState<[Card, Card, Card] | null>(null)
  const [flipped, setFlipped] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [entryId, setEntryId] = useState('')

  async function draw() {
    const drawn = drawSpread()
    setCards(drawn)
    setFlipped([false, false, false])
    setEntryId(`spread-${today}-${Date.now()}`)
    await appendDraws(drawn.map((c) => ({ cardId: c.id, isoDate: today, source: 'spread' as const })))
    await refreshDraws()
  }

  const allFlipped = cards !== null && flipped.every(Boolean)
  const reading = cards && allFlipped ? composeReading(cards, today) : null
  const existing = entries.find((e) => e.id === entryId)

  async function save(text: string) {
    if (!cards) return
    const now = Date.now()
    await saveEntry({
      id: entryId,
      isoDate: today,
      cardIds: cards.map((c) => c.id),
      text,
      source: 'spread',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    await refreshEntries()
  }

  return (
    <article className="view view-spread">
      <header className="view-head">
        <h1 className="view-title">A small spread</h1>
        <p className="view-sub">Situation · Knot · Direction. Three cards, one look at the week.</p>
      </header>

      {!cards && (
        <div className="spread-start">
          <button type="button" className="button" onClick={() => void draw()}>
            Draw three cards
          </button>
        </div>
      )}

      {cards && (
        <>
          <div className="spread-row">
            {cards.map((card, i) => (
              <div className="spread-slot" key={card.id}>
                <p className="spread-pos">{POSITIONS[i]}</p>
                <CardFlip
                  card={card}
                  flipped={flipped[i] ?? false}
                  onFlip={() =>
                    setFlipped((f) => {
                      const next: [boolean, boolean, boolean] = [...f]
                      next[i] = true
                      return next
                    })
                  }
                  label={`Turn the ${POSITIONS[i]} card`}
                />
              </div>
            ))}
          </div>

          {reading && (
            <div className="spread-reading fade-up">
              <p className="card-meaning">{reading.sentences.join(' ')}</p>
              <p className="card-question">{reading.question}</p>
              <EntryEditor
                key={entryId}
                initialText={existing?.text ?? ''}
                onSave={save}
                placeholder="Anything worth keeping from this one?"
              />
            </div>
          )}
        </>
      )}
    </article>
  )
}
