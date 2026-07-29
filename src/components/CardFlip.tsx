import { useApp } from '../AppContext'
import { STR } from '../content/ui-strings'
import { PlateBack } from '../design/plate'
import { CardPlate } from './CardPlate'
import type { Card } from '../engine/types'

interface Props {
  card: Card
  flipped: boolean
  onFlip: () => void
  label?: string
}

/**
 * Face-down card that flips on tap. Under reduced motion the 3D flip
 * becomes a plain crossfade (the CSS handles both off one class).
 */
export function CardFlip({ card, flipped, onFlip, label = STR.cardFlip.defaultLabel }: Props) {
  const { reducedMotion } = useApp()

  return (
    <button
      type="button"
      className={`cardflip${flipped ? ' is-flipped' : ''}${reducedMotion ? ' is-crossfade' : ''}`}
      onClick={() => {
        if (!flipped) onFlip()
      }}
      aria-label={flipped ? undefined : label}
      disabled={flipped}
    >
      <span className="cardflip-inner">
        <span className="cardflip-face cardflip-front" aria-hidden={flipped}>
          <PlateBack />
        </span>
        <span className="cardflip-face cardflip-back" aria-hidden={!flipped}>
          <CardPlate card={card} />
        </span>
      </span>
    </button>
  )
}
