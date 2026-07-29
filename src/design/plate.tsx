import { useId, type ReactNode } from 'react'
import type { Card, Suit } from '../engine/types'
import { plateLabel, hasDualName } from '../engine/content'

/*
 * The plate system. Every generated card is a specimen plate:
 * cream ground, double hairline border, plate numeral, central marks,
 * letterspaced caption. The marks — not the text — carry identification,
 * so every card stays readable at thumbnail size with the labels covered.
 *
 * Geometry lives in one 250×435 viewBox (tarot ratio 5:8.7).
 */

export const PLATE_W = 250
export const PLATE_H = 435

const INK = 'var(--ink)'
const FADED = 'var(--ink-faded)'
const PAPER = 'var(--paper)'

const ACCENT: Record<Suit, string> = {
  wands: 'var(--accent-wands)',
  cups: 'var(--accent-cups)',
  swords: 'var(--accent-swords)',
  pentacles: 'var(--accent-pentacles)',
}

const stroke = {
  stroke: INK,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/* ---------------------------------------------------------------- suit marks
 * One base mark per suit, drawn once at nominal ±16 units, reused everywhere:
 * pips, courts, corner stamps, the card back.
 */

export function SuitMark({ suit, color = INK, w = 2 }: { suit: Suit; color?: string; w?: number }) {
  const s = { ...stroke, stroke: color, strokeWidth: w }
  switch (suit) {
    case 'wands': // budded hawthorn branch tip
      return (
        <g {...s}>
          <path d="M0,16 L0,-8" />
          <ellipse cx="0" cy="-12.5" rx="3" ry="5" />
          <path d="M0,6 C-3,4 -5,2 -7,-1" />
          <ellipse cx="-8" cy="-3.5" rx="2.4" ry="3.8" transform="rotate(-35 -8 -3.5)" />
          <path d="M0,0 C3,-2 5,-4 7,-7" />
          <ellipse cx="8" cy="-9" rx="2.4" ry="3.8" transform="rotate(35 8 -9)" />
        </g>
      )
    case 'cups': // hanging bellflower
      return (
        <g {...s}>
          <path d="M-10,-15 C-4,-16 -1,-12 0,-7" />
          <path d="M-7,-6 Q0,-11 7,-6" />
          <path d="M-7,-6 Q-8.5,4 -5,10" />
          <path d="M7,-6 Q8.5,4 5,10" />
          <path d="M-5,10 Q0,13.5 5,10" />
          <path d="M0,11 L0,15" />
        </g>
      )
    case 'swords': // single gladiolus blade leaf
      return (
        <g {...s}>
          <path d="M0,-16 C4.5,-8 4.5,6 0,16 C-4.5,6 -4.5,-8 0,-16 Z" />
          <path d="M0,-12 L0,12" strokeWidth={w * 0.6} />
        </g>
      )
    case 'pentacles': // Lunaria seed pod — the coin
      return (
        <g {...s}>
          <path d="M0,-9 L0,-14" />
          <circle cx="0" cy="0" r="8.5" />
          <circle cx="0" cy="0" r="5.8" strokeWidth={w * 0.6} />
          <circle cx="-2" cy="-1.2" r="1.7" strokeWidth={w * 0.6} />
          <circle cx="2.2" cy="1.6" r="1.7" strokeWidth={w * 0.6} />
          <path d="M0,8.5 L0,12" />
        </g>
      )
  }
}

/* -------------------------------------------------------------- court sigils
 * Rank sigil drawn above the suit mark: Page sprout, Knight chevron,
 * Queen open bloom, King crown of three seed heads.
 */

function CourtSigil({ rank }: { rank: 'page' | 'knight' | 'queen' | 'king' }) {
  const s = { ...stroke, strokeWidth: 2 }
  switch (rank) {
    case 'page': // a sprout
      return (
        <g {...s}>
          <path d="M0,12 L0,-2" />
          <path d="M0,-2 C-2,-7 -6,-9 -10,-8 C-8,-3 -4,-1 0,-2" />
          <path d="M0,-2 C2,-8 6,-11 10,-10 C9,-5 4,-2 0,-2" />
        </g>
      )
    case 'knight': // running-line chevron
      return (
        <g {...s}>
          <path d="M-9,-6 L-1,0 L-9,6" />
          <path d="M1,-6 L9,0 L1,6" />
        </g>
      )
    case 'queen': // full open bloom
      return (
        <g {...s}>
          <circle cx="0" cy="0" r="3.2" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="0" cy="-8" rx="2.8" ry="4.6" transform={`rotate(${a} 0 0)`} />
          ))}
        </g>
      )
    case 'king': // crown of three seed heads
      return (
        <g {...s}>
          <path d="M-11,9 Q0,13 11,9" />
          <path d="M-8,7.5 L-8,-1" />
          <path d="M0,9 L0,-4" />
          <path d="M8,7.5 L8,-1" />
          <circle cx="-8" cy="-4" r="2.8" />
          <circle cx="0" cy="-7.5" r="3.2" />
          <circle cx="8" cy="-4" r="2.8" />
        </g>
      )
  }
}

/* ------------------------------------------------------------ major emblems
 * One austere emblem per major, from the fixed list. Line only, no shading.
 * Each is drawn centered on (0,0), roughly ±55 across and ±55 tall.
 */

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}

function starPath(points: number, outer: number, inner: number): string {
  const parts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const [x, y] = polar(i % 2 === 0 ? outer : inner, (i * 360) / (points * 2))
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return parts.join(' ') + ' Z'
}

function spiralPath(): string {
  const pts: string[] = []
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI * 5
    const r = 42 * Math.exp(-0.14 * t)
    const x = r * Math.cos(t)
    const y = r * Math.sin(t)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return pts.join(' ')
}

function MajorEmblem({ n }: { n: number }) {
  const s = { ...stroke, strokeWidth: 2.2 }
  switch (n) {
    case 0: // feather
      return (
        <g {...s}>
          <path d="M2,-52 C4,-24 4,20 2,54" />
          {[-40, -31, -22, -13, -4, 5, 14, 23].map((y) => {
            const len = 15 - Math.abs(y + 40) * 0.11
            return (
              <g key={y}>
                <path d={`M2,${y} C${2 - len * 0.4},${y + 3} ${2 - len * 0.8},${y + 6} ${2 - len},${y + 10}`} strokeWidth={1.4} />
                <path d={`M2,${y} C${2 + len * 0.4},${y + 3} ${2 + len * 0.8},${y + 6} ${2 + len},${y + 10}`} strokeWidth={1.4} />
              </g>
            )
          })}
        </g>
      )
    case 1: // flask
      return (
        <g {...s}>
          <path d="M-7,-42 L-7,-16 L-26,28 Q-28,35 -21,35 L21,35 Q28,35 26,28 L7,-16 L7,-42" />
          <path d="M-11,-42 L11,-42" />
          <path d="M-17,8 L17,8" strokeWidth={1.4} />
        </g>
      )
    case 2: // crescent moon
      return (
        <g {...s}>
          <path d="M10,-44 A44,44 0 1,0 10,44 A35,35 0 1,1 10,-44 Z" />
        </g>
      )
    case 3: // wheat sheaf
      return (
        <g {...s}>
          {(
            [
              [-24, -28],
              [-12, -38],
              [0, -44],
              [12, -38],
              [24, -28],
            ] as [number, number][]
          ).map(([tx, ty]) => (
            <g key={tx}>
              <path d={`M0,18 L${tx},${ty}`} strokeWidth={1.6} />
              <ellipse cx={tx} cy={ty - 6} rx="3.4" ry="7.5" transform={`rotate(${tx * 0.9} ${tx} ${ty - 6})`} />
            </g>
          ))}
          <path d="M-10,12 Q0,22 10,8" />
          <path d="M-10,8 Q0,18 10,12" />
          <path d="M0,20 L-13,50 M0,20 L0,52 M0,20 L13,50" strokeWidth={1.6} />
        </g>
      )
    case 4: // standing stone
      return (
        <g {...s}>
          <path d="M-14,46 L-18,-12 L-8,-46 L11,-41 L16,2 L13,46 Z" />
          <path d="M-36,46 L36,46" strokeWidth={1.6} />
          <path d="M-26,46 L-28,41 M24,46 L27,42 M-20,46 L-21,42" strokeWidth={1.3} />
        </g>
      )
    case 5: // beehive (skep)
      return (
        <g {...s}>
          <path d="M-29,40 L29,40" />
          <path d="M-28,40 Q-30,24 -24,18 L24,18 Q30,24 28,40" />
          <path d="M-24,18 Q-26,6 -19,1 L19,1 Q26,6 24,18" />
          <path d="M-19,1 Q-20,-9 -13,-13 L13,-13 Q20,-9 19,1" />
          <path d="M-13,-13 Q-10,-24 0,-24 Q10,-24 13,-13" />
          <path d="M-7,40 A7,7 0 0,1 7,40" />
        </g>
      )
    case 6: // two entwined stems
      return (
        <g {...s}>
          <path d="M-12,52 C-26,22 26,12 9,-18 C1,-33 -6,-43 -4,-52" />
          <path d="M12,52 C26,22 -26,12 -9,-18 C-1,-33 6,-43 4,-52" />
          <ellipse cx="-17" cy="30" rx="3" ry="6.5" transform="rotate(40 -17 30)" />
          <ellipse cx="17" cy="26" rx="3" ry="6.5" transform="rotate(-40 17 26)" />
          <circle cx="-4.5" cy="-54" r="2.6" />
          <circle cx="4.5" cy="-54" r="2.6" />
        </g>
      )
    case 7: // spoked wheel
      return (
        <g {...s}>
          <circle cx="0" cy="0" r="42" />
          <circle cx="0" cy="0" r="6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const [x1, y1] = polar(6, a)
            const [x2, y2] = polar(42, a)
            return <path key={a} d={`M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)}`} strokeWidth={1.6} />
          })}
        </g>
      )
    case 8: // small perched bird
      return (
        <g {...s}>
          <path d="M-42,26 Q0,20 42,23" strokeWidth={1.6} />
          <path d="M-15,21 C-18,6 -8,-8 1,-9 C7,-10 11,-6 11,-1 C11,3 8,5 4,6 C11,10 12,15 9,21" />
          <path d="M11,-4 L18,-2 L11,1" strokeWidth={1.4} />
          <circle cx="4" cy="-4" r="1" strokeWidth={1.2} />
          <path d="M-15,20 L-31,29 M-15,17 L-29,23" strokeWidth={1.4} />
          <path d="M-2,21 L-2,25 M4,21 L4,25" strokeWidth={1.4} />
        </g>
      )
    case 9: // lantern
      return (
        <g {...s}>
          <circle cx="0" cy="-40" r="5" />
          <path d="M-10,-26 L0,-34 L10,-26" />
          <rect x="-16" y="-26" width="32" height="46" rx="3" />
          <path d="M0,9 C4.5,3 4.5,-4 0,-9 C-4.5,-4 -4.5,3 0,9 Z" strokeWidth={1.6} />
          <path d="M-21,27 L21,27" strokeWidth={1.6} />
        </g>
      )
    case 10: // ammonite spiral
      return (
        <g {...s}>
          <path d={spiralPath()} strokeWidth={1.8} />
          {[15, 55, 95, 135, 175, 215, 255].map((deg) => {
            const t = (deg * Math.PI) / 180
            const r1 = 42 * Math.exp(-0.14 * t)
            const r2 = 42 * Math.exp(-0.14 * (t + Math.PI * 2))
            const x1 = r1 * Math.cos(t)
            const y1 = r1 * Math.sin(t)
            const x2 = r2 * Math.cos(t)
            const y2 = r2 * Math.sin(t)
            return <path key={deg} d={`M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`} strokeWidth={1.2} />
          })}
        </g>
      )
    case 11: // balance scale
      return (
        <g {...s}>
          <circle cx="0" cy="-47" r="2.6" />
          <path d="M0,-44 L0,30" />
          <path d="M-15,34 L15,34 M0,30 L0,34" />
          <path d="M-34,-31 L34,-31" />
          <path d="M-34,-31 L-43,-8 M-34,-31 L-25,-8" strokeWidth={1.4} />
          <path d="M-45,-8 Q-34,3 -23,-8" />
          <path d="M34,-31 L25,-8 M34,-31 L43,-8" strokeWidth={1.4} />
          <path d="M23,-8 Q34,3 45,-8" />
        </g>
      )
    case 12: // suspended chrysalis
      return (
        <g {...s}>
          <path d="M-38,-44 Q0,-52 38,-40" strokeWidth={1.6} />
          <path d="M1,-46 L1,-28" strokeWidth={1.4} />
          <path d="M1,-28 C10,-24 13,-12 11,0 C9,11 5,17 1,19 C-3,17 -7,11 -9,0 C-11,-12 -8,-24 1,-28 Z" />
          <path d="M-7.5,-8 Q1,-4 9.5,-8" strokeWidth={1.3} />
          <path d="M-6.5,0 Q1,4 8.5,0" strokeWidth={1.3} />
          <path d="M-4.5,8 Q1,12 6.5,8" strokeWidth={1.3} />
        </g>
      )
    case 13: // bare teasel head
      return (
        <g {...s}>
          <ellipse cx="0" cy="-12" rx="13" ry="23" />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i * 360) / 14
            const rad = ((a - 90) * Math.PI) / 180
            const x1 = 13 * Math.cos(rad)
            const y1 = -12 + 23 * Math.sin(rad)
            const x2 = 18.5 * Math.cos(rad)
            const y2 = -12 + 29 * Math.sin(rad)
            return <path key={a} d={`M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`} strokeWidth={1.2} />
          })}
          <path d="M-3,10 C-15,4 -21,-8 -23,-20" strokeWidth={1.4} />
          <path d="M3,10 C15,4 21,-8 23,-20" strokeWidth={1.4} />
          <path d="M0,11 L0,52" strokeWidth={1.6} />
        </g>
      )
    case 14: // two vessels joined by a stream
      return (
        <g {...s}>
          <path d="M-36,-28 L-8,-28" />
          <path d="M-34,-28 C-34,-15 -10,-15 -10,-28" />
          <path d="M-22,-17 L-22,-9 M-29,-9 L-15,-9" strokeWidth={1.6} />
          <path d="M-9,-26 C6,-18 -2,2 14,12" strokeWidth={1.4} />
          <path d="M10,14 L38,14" />
          <path d="M12,14 C12,27 36,27 36,14" />
          <path d="M24,25 L24,33 M17,33 L31,33" strokeWidth={1.6} />
        </g>
      )
    case 15: // bramble knot
      return (
        <g {...s}>
          <path d="M-30,10 C-32,-18 8,-32 20,-12 C30,6 4,26 -11,13 C-24,1 4,-18 17,0 C26,13 10,24 -3,19" strokeWidth={1.8} />
          {[
            [-27, -8, -140],
            [-2, -27, -30],
            [23, -6, 40],
            [8, 21, 130],
            [-14, 8, -110],
          ].map(([x, y, a]) => (
            <path key={`${x},${y}`} d="M0,0 L3.5,-3 M0,0 L4.5,1.5" transform={`translate(${x} ${y}) rotate(${a})`} strokeWidth={1.3} />
          ))}
        </g>
      )
    case 16: // lightning-struck tree
      return (
        <g {...s}>
          <path d="M-3,50 L-3,-8" />
          <path d="M-3,-8 C-9,-16 -17,-20 -23,-32 M-16,-22 L-21,-16 M-3,-16 C-8,-22 -10,-26 -11,-31" strokeWidth={1.8} />
          <path d="M-3,-8 C2,-13 6,-15 10,-18 L19,-9" strokeWidth={1.8} />
          <path d="M27,-50 L10,-28 L20,-26 L1,-2" strokeWidth={1.6} />
          <path d="M-27,50 L27,50" strokeWidth={1.6} />
          <path d="M-3,50 C-9,46 -14,46 -19,48 M-3,50 C3,46 9,46 14,48" strokeWidth={1.3} />
        </g>
      )
    case 17: // seven-pointed star
      return (
        <g {...s}>
          <path d={starPath(7, 44, 19)} />
        </g>
      )
    case 18: // moon with a moth
      return (
        <g {...s}>
          <path d="M-8,-46 A26,26 0 1,0 -8,-2 A20.5,20.5 0 1,1 -8,-46 Z" transform="translate(-8,4)" />
          <g transform="translate(12,22)">
            <ellipse cx="0" cy="6" rx="2.6" ry="9" />
            <ellipse cx="-10" cy="0" rx="9" ry="5.4" transform="rotate(-28 -10 0)" />
            <ellipse cx="10" cy="0" rx="9" ry="5.4" transform="rotate(28 10 0)" />
            <ellipse cx="-8" cy="10" rx="6" ry="4" transform="rotate(-14 -8 10)" />
            <ellipse cx="8" cy="10" rx="6" ry="4" transform="rotate(14 8 10)" />
            <path d="M-2,-3 C-4,-8 -7,-11 -11,-13 M2,-3 C4,-8 7,-11 11,-13" strokeWidth={1.3} />
          </g>
        </g>
      )
    case 19: // sunflower head
      return (
        <g {...s}>
          <circle cx="0" cy="0" r="15" />
          <circle cx="0" cy="0" r="9.5" strokeWidth={1.3} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i * 360) / 16
            return <ellipse key={a} cx="0" cy="-24" rx="3.6" ry="9.5" transform={`rotate(${a} 0 0)`} strokeWidth={1.5} />
          })}
        </g>
      )
    case 20: // emerging cicada shell
      return (
        <g {...s}>
          <path d="M0,-30 C14,-26 18,-10 14,8 C12,20 6,28 0,30 C-6,28 -12,20 -14,8 C-18,-10 -14,-26 0,-30 Z" />
          <circle cx="-8.5" cy="-24" r="2.6" strokeWidth={1.5} />
          <circle cx="8.5" cy="-24" r="2.6" strokeWidth={1.5} />
          <path d="M0,-27 L0,8 M0,8 L-4.5,16 M0,8 L4.5,16" strokeWidth={1.5} />
          <path d="M-10,16 Q0,20 10,16 M-8,22 Q0,26 8,22" strokeWidth={1.3} />
          <path d="M-14,-6 L-24,-2 L-27,4 M-15,4 L-24,9 M14,-6 L24,-2 L27,4 M15,4 L24,9" strokeWidth={1.4} />
        </g>
      )
    case 21: // leaf wreath ring
      return (
        <g {...s}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = 25 + (i * 310) / 11
            return (
              <g key={a} transform={`rotate(${a} 0 0)`}>
                <ellipse cx="-3" cy="-38" rx="2.8" ry="7.5" transform="rotate(-24 -3 -38)" strokeWidth={1.5} />
                <ellipse cx="4" cy="-38" rx="2.8" ry="7.5" transform="rotate(24 4 -38)" strokeWidth={1.5} />
              </g>
            )
          })}
          <path d="M-6,-42 L6,-34 M-6,-34 L6,-42" transform="rotate(180 0 0)" strokeWidth={1.5} />
        </g>
      )
    default:
      return null
  }
}

/* ------------------------------------------------------------ pip layouts
 * Numbered minors repeat the suit mark N times, playing-card fashion:
 * the count is the rank, readable at a glance.
 */

const COL_L = 95
const COL_R = 155
const COL_C = 125

const PIP_LAYOUT: Record<number, { positions: [number, number][]; scale: number }> = {
  1: { positions: [[COL_C, 205]], scale: 1.9 },
  2: { positions: [[COL_C, 140], [COL_C, 270]], scale: 1.2 },
  3: { positions: [[COL_C, 118], [COL_C, 205], [COL_C, 292]], scale: 1.1 },
  4: { positions: [[COL_L, 140], [COL_R, 140], [COL_L, 270], [COL_R, 270]], scale: 1.05 },
  5: { positions: [[COL_L, 140], [COL_R, 140], [COL_C, 205], [COL_L, 270], [COL_R, 270]], scale: 1 },
  6: { positions: [[COL_L, 130], [COL_R, 130], [COL_L, 205], [COL_R, 205], [COL_L, 280], [COL_R, 280]], scale: 1 },
  7: { positions: [[COL_L, 130], [COL_R, 130], [COL_C, 167], [COL_L, 205], [COL_R, 205], [COL_L, 280], [COL_R, 280]], scale: 0.95 },
  8: { positions: [[COL_L, 122], [COL_R, 122], [COL_L, 177], [COL_R, 177], [COL_L, 232], [COL_R, 232], [COL_L, 287], [COL_R, 287]], scale: 0.9 },
  9: { positions: [[COL_L, 122], [COL_R, 122], [COL_L, 177], [COL_R, 177], [COL_C, 204], [COL_L, 232], [COL_R, 232], [COL_L, 287], [COL_R, 287]], scale: 0.85 },
  10: { positions: [[COL_L, 122], [COL_R, 122], [COL_C, 149], [COL_L, 177], [COL_R, 177], [COL_L, 232], [COL_R, 232], [COL_C, 259], [COL_L, 287], [COL_R, 287]], scale: 0.85 },
}

/* ------------------------------------------------------------ the plate */

function Frame() {
  return (
    <>
      <rect x="0" y="0" width={PLATE_W} height={PLATE_H} fill={PAPER} />
      <rect x="12" y="12" width={PLATE_W - 24} height={PLATE_H - 24} fill="none" stroke={INK} strokeWidth="1.2" />
      <rect x="19" y="19" width={PLATE_W - 38} height={PLATE_H - 38} fill="none" stroke={INK} strokeWidth="0.55" />
    </>
  )
}

function Grain({ id }: { id: string }) {
  return (
    <>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.17  0 0 0 0 0.15  0 0 0 0 0.11  0 0 0 0.6 0" />
      </filter>
      <rect x="0" y="0" width={PLATE_W} height={PLATE_H} filter={`url(#${id})`} opacity="0.05" />
    </>
  )
}

export interface GeneratedPlateProps {
  card: Card
  /** 'thumb' hides the classic subtitle and skips the grain texture. */
  size?: 'thumb' | 'full'
}

export function GeneratedPlate({ card, size = 'full' }: GeneratedPlateProps) {
  const grainId = useId()
  const accent = card.suit ? ACCENT[card.suit] : INK
  const label = plateLabel(card)

  let center: ReactNode = null
  if (card.arcana === 'major') {
    center = (
      <g transform="translate(125,200) scale(1.15)">
        <MajorEmblem n={Number(card.id.slice(1))} />
      </g>
    )
  } else if (typeof card.rank === 'number') {
    const layout = PIP_LAYOUT[card.rank]
    if (layout && card.suit) {
      center = (
        <>
          {layout.positions.map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y}) scale(${layout.scale})`}>
              <SuitMark suit={card.suit as Suit} w={2 / layout.scale} />
            </g>
          ))}
        </>
      )
    }
  } else if (card.rank && card.suit) {
    center = (
      <>
        <g transform="translate(125,138) scale(1.35)">
          <CourtSigil rank={card.rank} />
        </g>
        <g transform="translate(125,232) scale(2.3)">
          <SuitMark suit={card.suit} w={0.95} />
        </g>
      </>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${PLATE_W} ${PLATE_H}`}
      role="img"
      aria-label={`${card.name}${hasDualName(card) ? ` (${card.classicName})` : ''} — ${card.keywords.join(', ')}`}
      className="plate-svg"
    >
      <Frame />
      <text
        x={PLATE_W / 2}
        y="46"
        textAnchor="middle"
        fontFamily="'EB Garamond', Georgia, serif"
        fontSize="13"
        letterSpacing="1.5"
        fill={FADED}
      >
        {label}
      </text>
      {card.suit ? (
        // the one accent appearance: a small suit stamp under the figure number
        <g transform="translate(125,72) scale(0.62)">
          <SuitMark suit={card.suit} color={accent} w={2.6} />
        </g>
      ) : (
        <path d="M115,66 L135,66" stroke={FADED} strokeWidth="0.8" />
      )}

      {center}

      <path d="M110,346 L140,346" stroke={FADED} strokeWidth="0.7" />
      <text
        x={PLATE_W / 2}
        y="374"
        textAnchor="middle"
        fontFamily="'EB Garamond', Georgia, serif"
        fontSize={card.name.length > 18 ? 11 : 12.5}
        letterSpacing="1.3"
        fill={INK}
      >
        {card.name.toUpperCase()}
      </text>
      {size === 'full' && hasDualName(card) && (
        <text
          x={PLATE_W / 2}
          y="394"
          textAnchor="middle"
          fontFamily="'EB Garamond', Georgia, serif"
          fontSize="11.5"
          fontStyle="italic"
          fill={FADED}
        >
          {card.classicName}
        </text>
      )}
      {size === 'full' && <Grain id={grainId} />}
    </svg>
  )
}

/** The card back: same frame conventions, a quiet centered device. */
export function PlateBack() {
  return (
    <svg viewBox={`0 0 ${PLATE_W} ${PLATE_H}`} role="img" aria-label="Card, face down" className="plate-svg">
      <Frame />
      <g transform={`translate(${PLATE_W / 2},${PLATE_H / 2})`}>
        <circle cx="0" cy="0" r="34" {...stroke} strokeWidth="1.1" />
        <circle cx="0" cy="0" r="30" {...stroke} strokeWidth="0.6" />
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 0 0)`}>
            <ellipse cx="0" cy="-46" rx="3" ry="8" {...stroke} strokeWidth="1.1" />
          </g>
        ))}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fontFamily="'EB Garamond', Georgia, serif"
          fontSize="12"
          letterSpacing="2.4"
          fill={INK}
        >
          U
        </text>
      </g>
    </svg>
  )
}
