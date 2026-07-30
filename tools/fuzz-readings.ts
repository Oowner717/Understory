/*
 * fuzz-readings — npm run fuzz:readings [-- --n 500]
 *
 * Generates N composed spread readings from random draws and lints every
 * output. Since the spread corpus was completed there are no templates to
 * replicate: a reading is the three authored position lines joined, exactly
 * as Spread.tsx renders them, so this now fuzzes the real product rather than
 * a stand-in for it. Composed text is where seams show, and this finds them
 * without playing 500 hands.
 *
 * Exits non-zero if any composed reading carries an error-severity
 * violation (banned vocabulary, Barnum shape, malformed question).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseBarnumPatterns, lintField, trigrams, jaccard, type Violation } from './lib/lint-core.ts'

const argn = process.argv.indexOf('--n')
const N = argn > -1 ? Number(process.argv[argn + 1]) : 500
const root = new URL('..', import.meta.url).pathname

const cards = JSON.parse(readFileSync(join(root, 'src/content/cards.json'), 'utf8'))
const meanings = JSON.parse(readFileSync(join(root, 'src/content/meanings.json'), 'utf8')).meanings
const spreadFor = new Map<string, any>(meanings.map((m: any) => [m.cardId, m]))
const barnum = parseBarnumPatterns(readFileSync(join(root, 'VOICE.md'), 'utf8'))

interface FuzzResult {
  path: string
  text: string
  violations: Violation[]
  selfOverlap: number
  score: number
}

const results: FuzzResult[] = []
/* Errors attribute to a card now, not to a template slot. */
const cardErrorCounts = new Map<string, number>()

for (let iter = 0; iter < N; iter++) {
  const picked: any[] = []
  while (picked.length < 3) {
    const c = cards[Math.floor(Math.random() * cards.length)]
    if (!picked.includes(c)) picked.push(c)
  }
  const sentences = [
    spreadFor.get(picked[0].id)?.spread?.situation ?? '',
    spreadFor.get(picked[1].id)?.spread?.knot ?? '',
    spreadFor.get(picked[2].id)?.spread?.direction ?? '',
  ]
  const dirQs: string[] = (spreadFor.get(picked[2].id)?.questions ?? []).filter(Boolean)
  const question = dirQs[Math.floor(Math.random() * dirQs.length)] ?? ''
  const body = sentences.join(' ')
  const full = `${body} ${question}`
  /* The card ids are the whole provenance now. There is no template index to
   * report, because a card's line for a position is the only line it has. */
  const path = picked.map((c) => c.id).join(' · ')

  const violations = [
    ...lintField(path, 'composed', body, { barnum, vocabOnly: true }),
    ...lintField(path, 'composedQuestion', question, { barnum, vocabOnly: true }),
  ]
  if ((body.match(/\?/g) ?? []).length > 0)
    violations.push({ cardId: path, field: 'composed', rule: 'question-marks', severity: 'error', message: 'question mark before the closing question' })
  if ((question.match(/\?/g) ?? []).length !== 1 || !question.trim().endsWith('?'))
    violations.push({ cardId: path, field: 'composedQuestion', rule: 'question-marks', severity: 'error', message: 'reading does not end with exactly one question' })

  // seam detection: how much the three sentences repeat each other
  const g = sentences.map((s) => trigrams(s))
  const selfOverlap = (jaccard(g[0], g[1]) + jaccard(g[1], g[2]) + jaccard(g[0], g[2])) / 3

  const score = violations.filter((v) => v.severity === 'error').length * 10 + violations.length + selfOverlap * 20
  results.push({ path, text: full, violations, selfOverlap, score })

  for (const v of violations)
    if (v.severity === 'error')
      for (const id of path.split(' · '))
        cardErrorCounts.set(id, (cardErrorCounts.get(id) ?? 0) + 1)
}

results.sort((a, b) => b.score - a.score)

console.log(`— worst ${Math.min(20, results.length)} of ${N} composed readings —\n`)
for (const r of results.slice(0, 20)) {
  console.log(`score ${r.score.toFixed(1)} · ${r.path}`)
  console.log(`  "${r.text}"`)
  for (const v of r.violations) console.log(`  ${v.severity === 'error' ? '✗' : '△'} ${v.rule}: ${v.message}`)
  if (r.selfOverlap > 0.05) console.log(`  △ sentences overlap each other ${(r.selfOverlap * 100).toFixed(1)}%`)
  console.log('')
}

if (cardErrorCounts.size > 0) {
  console.log('— error counts by card —')
  for (const [id, n] of [...cardErrorCounts.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`${id}: ${n}`)
}

const totalErrors = results.reduce((n, r) => n + r.violations.filter((v) => v.severity === 'error').length, 0)
console.log(`\nfuzz-readings: ${totalErrors} error(s) across ${N} readings`)
process.exit(totalErrors > 0 ? 1 : 0)
