/*
 * fuzz-readings — npm run fuzz:readings [-- --n 500]
 *
 * Generates N composed spread readings from random draws (re-implementing
 * the composer's fill logic over templates.json, so it runs without the
 * browser bundle), lints every output, and reports the worst 20 with the
 * template paths that produced them. Composed text is where seams show;
 * this finds them without playing 500 hands.
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
const templates = JSON.parse(readFileSync(join(root, 'src/content/templates.json'), 'utf8'))
const barnum = parseBarnumPatterns(readFileSync(join(root, 'VOICE.md'), 'utf8'))

function fill(tpl: string, card: any): string {
  const kw1 = card.keywords[0] ?? 'quiet'
  const kw2 = card.keywords[1] ?? kw1
  return tpl.replaceAll('{name}', card.name).replaceAll('{kw1}', kw1).replaceAll('{kw2}', kw2)
}

interface FuzzResult {
  path: string
  text: string
  violations: Violation[]
  selfOverlap: number
  score: number
}

const results: FuzzResult[] = []
const templateErrorCounts = new Map<string, number>()

for (let iter = 0; iter < N; iter++) {
  const picked: any[] = []
  while (picked.length < 3) {
    const c = cards[Math.floor(Math.random() * cards.length)]
    if (!picked.includes(c)) picked.push(c)
  }
  const idx = {
    situation: Math.floor(Math.random() * templates.situation.length),
    knot: Math.floor(Math.random() * templates.knot.length),
    direction: Math.floor(Math.random() * templates.direction.length),
    questions: Math.floor(Math.random() * templates.questions.length),
  }
  const sentences = [
    fill(templates.situation[idx.situation], picked[0]),
    fill(templates.knot[idx.knot], picked[1]),
    fill(templates.direction[idx.direction], picked[2]),
  ]
  const question = fill(templates.questions[idx.questions], picked[2])
  const body = sentences.join(' ')
  const full = `${body} ${question}`
  const path = `situation[${idx.situation}] knot[${idx.knot}] direction[${idx.direction}] questions[${idx.questions}] · ${picked.map((c) => c.id).join(',')}`

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
      for (const part of path.split(' · ')[0].split(' '))
        templateErrorCounts.set(part, (templateErrorCounts.get(part) ?? 0) + 1)
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

if (templateErrorCounts.size > 0) {
  console.log('— error counts by template slot —')
  for (const [slot, n] of [...templateErrorCounts.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`${slot}: ${n}`)
}

const totalErrors = results.reduce((n, r) => n + r.violations.filter((v) => v.severity === 'error').length, 0)
console.log(`\nfuzz-readings: ${totalErrors} error(s) across ${N} readings`)
process.exit(totalErrors > 0 ? 1 : 0)
