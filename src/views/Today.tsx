import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { CardFlip } from '../components/CardFlip'
import { EchoPanel } from '../components/EchoPanel'
import { EntryEditor } from '../components/EntryEditor'
import { hasDualName, meaningFor } from '../engine/content'
import { formatLong } from '../engine/dates'
import { dailyCard, localDateString } from '../engine/draw'
import { findEcho, logDailyDrawOnce, saveEntry } from '../engine/storage'

/**
 * The daily ritual: draw, read, write. One card per local day per device,
 * face-down until tapped.
 */
export function Today() {
  const { settings, entries, refreshEntries, refreshDraws } = useApp()
  const today = localDateString()
  const card = useMemo(() => dailyCard(today, settings.deviceSeed), [today, settings.deviceSeed])
  const todayEntry = entries.find((e) => e.id === today)
  const [flipped, setFlipped] = useState(() => Boolean(todayEntry))

  useEffect(() => {
    void logDailyDrawOnce(card.id, today).then(refreshDraws)
  }, [card.id, today, refreshDraws])

  const echo = findEcho(entries, card.id, today)
  const meaning = meaningFor(card.id)

  async function save(text: string) {
    const now = Date.now()
    await saveEntry({
      id: today,
      isoDate: today,
      cardIds: [card.id],
      text,
      source: 'daily',
      createdAt: todayEntry?.createdAt ?? now,
      updatedAt: now,
    })
    await refreshEntries()
  }

  return (
    <article className="view view-today">
      <header className="view-head">
        <p className="view-kicker">{formatLong(today)}</p>
        <h1 className="view-title">Today's card</h1>
      </header>

      <div className="today-card">
        <CardFlip card={card} flipped={flipped} onFlip={() => setFlipped(true)} label="Turn today's card" />
      </div>

      {flipped && (
        <div className="today-reading fade-up">
          <h2 className="card-name">{card.name}</h2>
          {hasDualName(card) && <p className="card-classic">{card.classicName}</p>}
          <p className="card-meaning">{meaning.general}</p>
          <p className="card-question">{meaning.question}</p>

          {echo && <EchoPanel echo={echo} />}

          <EntryEditor key={today} initialText={todayEntry?.text ?? ''} onSave={save} />
        </div>
      )}
    </article>
  )
}
