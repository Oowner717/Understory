import { STR } from '../content/ui-strings'
import { formatRelative } from '../engine/dates'
import { localDateString } from '../engine/draw'
import type { Entry } from '../engine/types'

interface Props {
  echo: Entry
}

const EXCERPT_LENGTH = 200

function excerpt(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= EXCERPT_LENGTH) return t
  const cut = t.slice(0, EXCERPT_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : EXCERPT_LENGTH)}…`
}

/**
 * The Echo: last time this card came up, here is what you wrote.
 * The app's signature moment — it fades up quietly after the flip.
 */
export function EchoPanel({ echo }: Props) {
  return (
    <aside className="echo fade-up" aria-label={STR.echo.ariaLabel}>
      <p className="echo-title">
        {STR.echo.titlePrefix}, {formatRelative(echo.isoDate, localDateString())}
      </p>
      <blockquote className="echo-excerpt">{excerpt(echo.text)}</blockquote>
      <a className="echo-link" href={`#/entry/${encodeURIComponent(echo.id)}`}>
        {STR.echo.readEntry}
      </a>
    </aside>
  )
}
