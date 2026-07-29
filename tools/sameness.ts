/*
 * sameness — npm run lint:sameness [-- --threshold 0.1]
 *
 * The anti-interchangeability report:
 *   - trigram-overlap matrix across all 78 library entries (falls back to
 *     readingLine while libraryEntry is unwritten); pairs above threshold
 *   - opening-word and opening-move distribution vs the VOICE.md §7 targets
 *   - most-repeated content words (the "quiet/small/notice" fatigue check)
 *   - ranked "most interchangeable cards" list — the rewrite queue
 *
 * Exits non-zero only when a flagged pair involves two non-placeholder
 * entries; placeholder overlap is reported but informational.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { trigrams, jaccard, contentWords, classifyOpening, splitSentences } from './lib/lint-core.ts'

const argi = process.argv.indexOf('--threshold')
const THRESHOLD = argi > -1 ? Number(process.argv[argi + 1]) : 0.1
const root = new URL('..', import.meta.url).pathname

const { meanings } = JSON.parse(readFileSync(join(root, 'src/content/meanings.json'), 'utf8'))

const texts = meanings.map((m: any) => ({
  cardId: m.cardId as string,
  status: m.status as string,
  text: (m.libraryEntry || (m.readingLines ?? []).join(' ')) as string,
  usingFallback: !m.libraryEntry,
}))

const grams = texts.map((t: any) => trigrams(t.text))

/* pairwise overlap */
let hardFlags = 0
const pairs: { a: string; b: string; sim: number; hard: boolean }[] = []
for (let i = 0; i < texts.length; i++) {
  for (let j = i + 1; j < texts.length; j++) {
    const sim = jaccard(grams[i], grams[j])
    if (sim > THRESHOLD) {
      const hard = texts[i].status !== 'placeholder' && texts[j].status !== 'placeholder'
      if (hard) hardFlags++
      pairs.push({ a: texts[i].cardId, b: texts[j].cardId, sim, hard })
    }
  }
}
pairs.sort((x, y) => y.sim - x.sim)

console.log(`— pairs above trigram-overlap threshold ${THRESHOLD} —`)
if (pairs.length === 0) console.log('none')
for (const p of pairs)
  console.log(`${p.hard ? '✗' : '△'} ${p.a} ↔ ${p.b}  overlap ${(p.sim * 100).toFixed(1)}%`)

/* opening moves and words */
const moveTargets: Record<string, number> = {
  'image-first': 0.4,
  'observation-first': 0.25,
  contrast: 0.2,
  'direct-address': 0.15,
}
const moveCounts = new Map<string, number>()
const openWords = new Map<string, number>()
for (const t of texts) {
  const move = classifyOpening(t.text)
  moveCounts.set(move, (moveCounts.get(move) ?? 0) + 1)
  const w = (splitSentences(t.text)[0] ?? '').split(/\s+/)[0]?.toLowerCase().replace(/[^a-z']/g, '') ?? ''
  if (w) openWords.set(w, (openWords.get(w) ?? 0) + 1)
}
console.log('\n— opening moves (heuristic classification) vs VOICE.md targets —')
for (const [move, target] of Object.entries(moveTargets)) {
  const n = moveCounts.get(move) ?? 0
  console.log(`${move}: ${n}/${texts.length} (${((n / texts.length) * 100).toFixed(0)}%, target ${target * 100}%)`)
}
console.log('\n— most-repeated opening words —')
for (const [w, n] of [...openWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10))
  if (n > 1) console.log(`"${w}" opens ${n} cards`)

/* content-word fatigue */
const freq = new Map<string, number>()
for (const t of texts) for (const w of contentWords(t.text)) freq.set(w, (freq.get(w) ?? 0) + 1)
console.log('\n— most-repeated content words across the corpus —')
for (const [w, n] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20))
  console.log(`${String(n).padStart(3)} × ${w}`)

/* interchangeability ranking */
const meanSim = texts.map((_t: any, i: number) => {
  let s = 0
  for (let j = 0; j < texts.length; j++) if (j !== i) s += jaccard(grams[i], grams[j])
  return { cardId: texts[i].cardId, mean: s / (texts.length - 1) }
})
meanSim.sort((a: any, b: any) => b.mean - a.mean)
console.log('\n— most interchangeable cards (rewrite queue) —')
for (const { cardId, mean } of meanSim.slice(0, 15))
  console.log(`${cardId}  mean overlap ${(mean * 100).toFixed(2)}%`)

const usingFallback = texts.filter((t: any) => t.usingFallback).length
if (usingFallback > 0)
  console.log(`\n(${usingFallback} entries compared on readingLine because libraryEntry is empty)`)

process.exit(hardFlags > 0 ? 1 : 0)
