/*
 * batch-budget — npm run lint:batch
 *
 * Checks the cross-deck budgets in VOICE-SPEC against one status group,
 * defaulting to `drafted`, which is the batch currently under review.
 *
 * This file exists because the same checks were re-derived in throwaway
 * scripts for four batches running, and the throwaway versions produced a
 * false positive every time. Batch 1 flagged "tab" as bookkeeping when it
 * meant browser tabs. Batch 3 counted any leading numeral as plate
 * description, reporting 18 plate-openers where there were 6. Batch 4
 * repeated that same error one batch after it was documented.
 *
 * The rule of thumb in VOICE-SPEC says to check the regex before touching
 * the sentence. This puts the regexes somewhere they can be corrected once.
 *
 * Exits non-zero if a hard budget is breached. Soft observations print
 * without failing.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { countWords, splitSentences } from './lib/lint-core.ts'

const root = new URL('..', import.meta.url).pathname
const argi = process.argv.indexOf('--status')
const STATUS = argi > -1 ? process.argv[argi + 1] : 'drafted'

const { meanings } = JSON.parse(readFileSync(join(root, 'src/content/meanings.json'), 'utf8'))
const batch = meanings.filter((m: any) => m.status === STATUS)
if (batch.length === 0) {
  console.log(`no cards at status "${STATUS}"`)
  process.exit(0)
}

const lines: string[] = batch.flatMap((m: any) => [...m.readingLines, ...m.reversed.readingLines])
const questions: string[] = batch.flatMap((m: any) => [...m.questions, ...m.reversed.questions])
const entries: string[] = batch.flatMap((m: any) => [m.libraryEntry, m.reversed.libraryEntry]).filter(Boolean)

/** Numeral or court sigil, followed by a suit object. "Three ways this goes
 *  wrong" is a structural opener and is deliberately not matched. */
const PLATE_OPENER =
  /^(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|A|An)\s+(?:\w+\s+){0,3}(?:sprigs?|pods?|bells?|cups?|blades?|blade leaf|blade leaves|leaf|leaves|stakes?|chevron|sprout|bloom|crown)\b/

/** Homonyms excluded on purpose. "tab" is a browser tab in cups-07 and
 *  "interest" is curiosity in pentacles-10. Both flagged clean copy. */
const BOOKKEEPING =
  /\b(?:invoices?|itemiz\w+|audits?|accounting|ledgers?|banking|billing|bills|accrues?|accruing|bookkeeping)\b/gi
/** Cards whose conceit is itself about exchange, where the register is earned. */
const EXCHANGE_CONCEITS = new Set(['pentacles-02', 'pentacles-04', 'pentacles-06', 'swords-02', 'wands-06'])

const sentenceLens = lines.flatMap((t) => splitSentences(t).map(countWords))
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

interface Check {
  label: string
  actual: string
  ok: boolean
  hard: boolean
}
const checks: Check[] = []
const add = (label: string, ok: boolean, actual: string, hard = true) =>
  checks.push({ label, actual, ok, hard })

const meanSent = mean(sentenceLens)
add('mean sentence length 7 to 10', meanSent >= 7 && meanSent <= 10, meanSent.toFixed(1))

const noBeat = lines.filter((t) => !splitSentences(t).some((s) => countWords(s) <= 6))
add('every line has a sentence of 6 words or fewer', noBeat.length === 0, `${lines.length - noBeat.length}/${lines.length}`)

const reversedOpeners = lines.filter((t) => t.startsWith('Reversed')).length
add('"Reversed" openers, 4 or fewer', reversedOpeners <= 4, String(reversedOpeners))

const recordedOpeners = lines.filter((t) => t.startsWith('Recorded')).length
add('"Recorded" openers, 2 or fewer', recordedOpeners <= 2, String(recordedOpeners))

const youveBeen = [...lines, ...entries].reduce(
  (n, t) => n + (t.match(/You(?:'ve| have) been \w+ing/g) ?? []).length,
  0,
)
add('"You have been X-ing", 2 or fewer', youveBeen <= 2, String(youveBeen))

const offBudget = batch.reduce((n: number, m: any) => {
  if (EXCHANGE_CONCEITS.has(m.cardId)) return n
  const text = [...m.readingLines, ...m.reversed.readingLines, m.libraryEntry, m.reversed.libraryEntry].join(' ')
  return n + (text.match(BOOKKEEPING) ?? []).length
}, 0)
add('bookkeeping register off-budget', offBudget === 0, String(offBudget))

const cardAgent = Math.max(...entries.map((t) => (t.match(/\bthe card\b/gi) ?? []).length))
add('"the card" as agent, 2 or fewer per entry', cardAgent <= 2, String(cardAgent))

const plateOpeners = entries.filter((t) => PLATE_OPENER.test(t)).length
add(
  'library entries opening on the plate, at most half',
  plateOpeners <= Math.floor(entries.length / 2),
  `${plateOpeners}/${entries.length}`,
)

const firstWord = (q: string) => (q.split(/\s+/)[0] ?? '').replace(/[^A-Za-z']/g, '')
const whatWhich = questions.filter((q) => ['What', "What's", 'Which'].includes(firstWord(q))).length
add(
  'What or Which questions, 70 percent or under',
  whatWhich / questions.length <= 0.7,
  `${Math.round((100 * whatWhich) / questions.length)}%`,
)
const whoWhose = questions.filter((q) => ['Who', 'Whose'].includes(firstWord(q))).length
add('Who or Whose questions, 3 or more', whoWhose >= 3, String(whoWhose))
const whereWhen = questions.filter((q) => ['Where', 'When'].includes(firstWord(q))).length
add('Where or When questions, 2 or more', whereWhen >= 2, String(whereWhen))
const orShaped = questions.filter((q) => /, or /.test(q)).length
add('or-shaped questions, 1 or more', orShaped >= 1, String(orShaped))

/* soft observations, reported and not enforced */
const STOP = new Set(
  `a an and are as at be been but by do does for from had has have if in into is it its of on or so than that the their them then there these they this to was were what when where which who with you your yours not no`.split(
    ' ',
  ),
)
const freq = new Map<string, number>()
for (const t of lines)
  for (const w of t.toLowerCase().match(/[a-z']+/g) ?? [])
    if (w.length > 3 && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1)
const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

console.log(`batch-budget, ${batch.length} cards at status "${STATUS}"\n`)
for (const c of checks)
  console.log(`${c.ok ? '✓' : '✗'} ${c.label.padEnd(48)} ${c.actual}`)
console.log(`\n  words per line ${mean(lines.map(countWords)).toFixed(1)}`)
console.log(`  library words per entry ${mean(entries.map(countWords)).toFixed(0)}`)
console.log(`  fragments ${Math.round((100 * sentenceLens.filter((n) => n <= 6).length) / sentenceLens.length)}%`)
console.log(`  top content words  ${top.map(([w, n]) => `${w} x${n}`).join(', ')}`)
if (noBeat.length) {
  console.log('\n  lines with no short beat:')
  for (const t of noBeat) console.log(`    ${t.slice(0, 90)}`)
}

const failed = checks.filter((c) => !c.ok && c.hard)
console.log(`\nbatch-budget: ${failed.length} budget(s) breached`)
process.exit(failed.length > 0 ? 1 : 0)
