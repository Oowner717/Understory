import { useApp } from '../AppContext'
import { GeneratedPlate } from '../design/plate'
import { hasDualName } from '../engine/content'
import type { Card } from '../engine/types'

interface Props {
  card: Card
  size?: 'thumb' | 'full'
}

/**
 * A card plate. Real engraved artwork (dropped into /public/deck and listed
 * in its manifest) takes precedence; otherwise the generated specimen plate
 * renders. Mixed real + generated is a supported, deliberate state.
 */
export function CardPlate({ card, size = 'full' }: Props) {
  const { art } = useApp()

  if (art.has(card.id)) {
    return (
      <span className="plate plate--art">
        <img
          src={`${import.meta.env.BASE_URL}deck/${card.id}.webp`}
          alt={`${card.name}${hasDualName(card) ? ` (${card.classicName})` : ''} — ${card.keywords.join(', ')}`}
          loading="lazy"
        />
      </span>
    )
  }
  return (
    <span className="plate">
      <GeneratedPlate card={card} size={size} />
    </span>
  )
}
