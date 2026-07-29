import { useApp } from '../AppContext'
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
          No such card in this deck. <a href="#/library">Back to the library.</a>
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
          <a href="#/library">← Library</a>
        </p>
      </header>

      <div className="card-hero">
        <CardPlate card={card} />
      </div>

      <h1 className="card-name">{card.name}</h1>
      {hasDualName(card) && <p className="card-classic">{card.classicName}</p>}
      <p className="card-keywords">{card.keywords.join(' · ')}</p>
      <p className="card-meaning">{meaning.general}</p>
      <p className="card-question">{meaning.question}</p>
      <p className="card-count">
        {count === 0
          ? "You haven't drawn this card yet. The deck takes its time."
          : count === 1
            ? "You've drawn this card once."
            : `You've drawn this card ${count} times.`}
      </p>
    </article>
  )
}
