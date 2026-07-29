import { CardPlate } from '../components/CardPlate'
import { CARDS, SUIT_LABEL, SUITS } from '../engine/content'
import type { Card } from '../engine/types'

function Group({ title, cards }: { title: string; cards: Card[] }) {
  return (
    <section className="library-group">
      <h2 className="section-title">{title}</h2>
      <ul className="library-grid">
        {cards.map((card) => (
          <li key={card.id}>
            <a href={`#/card/${card.id}`} className="library-card" aria-label={card.name}>
              <CardPlate card={card} size="thumb" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** All 78 plates, grouped Majors → suits. */
export function Library() {
  return (
    <article className="view view-library">
      <header className="view-head">
        <h1 className="view-title">Library</h1>
      </header>
      <Group title="Major Arcana" cards={CARDS.filter((c) => c.arcana === 'major')} />
      {SUITS.map((suit) => (
        <Group key={suit} title={SUIT_LABEL[suit]} cards={CARDS.filter((c) => c.suit === suit)} />
      ))}
    </article>
  )
}
