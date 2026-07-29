import { useApp } from '../AppContext'
import { STR } from '../content/ui-strings'
import { CardPlate } from '../components/CardPlate'
import { cardById, hasDualName, meaningFor } from '../engine/content'

/** One card in full: large plate, both names, keywords, meaning, question. */
export function CardDetail({ id }: { id: string }) {
  const { draws } = useApp()
  const card = cardById(id)

  if (!card) {
    return (
      <article className="view">
        <p className="empty-state">
          {STR.card.notFound} <a href="#/library">{STR.card.notFoundLink}</a>
        </p>
      </article>
    )
  }

  const meaning = meaningFor(card.id)
  const count = draws.filter((d) => d.cardId === card.id).length

  return (
    <article className="view view-card">
      <header className="view-head">
        <p className="view-kicker">
          <a href="#/library">{STR.card.backToLibrary}</a>
        </p>
      </header>

      <div className="card-hero">
        <CardPlate card={card} />
      </div>

      <h1 className="card-name">{card.name}</h1>
      {hasDualName(card) && <p className="card-classic">{card.classicName}</p>}
      <p className="card-keywords">{card.keywords.join(' · ')}</p>
      <p className="card-meaning">{meaning.libraryEntry || meaning.readingLine}</p>
      <p className="card-question">{meaning.question}</p>
      <p className="card-count">
        {count === 0 ? STR.card.drawnNever : count === 1 ? STR.card.drawnOnce : STR.card.drawnTimes(count)}
      </p>
    </article>
  )
}
