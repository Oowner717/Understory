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
 *  wrong" is a structural opener and is deliberately not matched.
 *
 *  Major emblems are listed alongside the suit objects, added in batch 6.
 *  Without them this check has no teeth on a Majors batch at all, since a
 *  Major's plate carries an emblem and no suit mark, so "Two vessels joined
 *  by a stream" is exactly as much a plate description as "Two sprigs" is.
 *  Emblem names come from MajorEmblem in src/design/plate.tsx. */
const PLATE_OPENER =
  /^(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|A|An)\s+(?:\w+\s+){0,3}(?:sprigs?|pods?|bells?|cups?|blades?|blade leaf|blade leaves|leaf|leaves|stakes?|chevron|sprout|bloom|crown|feather|flask|crescent|sheaf|standing stone|skep|beehive|stems?|wheel|bird|lantern|spiral|scale|chrysalis|teasel|vessels?|knot|tree|star|moon|moth|sunflower|shell|wreath)\b/

/** Homonyms excluded on purpose. "tab" is a browser tab in cups-07 and
 *  "interest" is curiosity in pentacles-10. Both flagged clean copy. */
const BOOKKEEPING =
  /\b(?:invoices?|itemiz\w+|audits?|accounting|ledgers?|banking|billing|bills|accrues?|accruing|bookkeeping)\b/gi
/** Cards whose conceit is itself about exchange, where the register is earned.
 *  M11 joins in batch 6: its approved conceit is two columns of a ledger in
 *  the same ink, so the vocabulary is the card rather than a slip into it. */
const EXCHANGE_CONCEITS = new Set([
  'pentacles-02', 'pentacles-04', 'pentacles-06', 'swords-02', 'wands-06', 'M11',
])

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

/* Self-echo. A card's library entry restating its own reading line word for
 * word reads as padding, and it is invisible to the sameness linter, which
 * only ever compares one card against another. Measured across the whole
 * corpus in batch 6 it turned out to have been climbing for four batches
 * without anyone looking: 0.3 shared six-word runs per card in batches 1
 * and 2, then 1.5, 1.6, 2.2, and 2.8 in batch 6 before correction.
 *
 * M16 is exempt. Its upright reading lines are the frozen Gate 1 specimens
 * and its library entry is written around the author's own approved
 * phrasing, so the overlap there is deliberate. */
const SELF_ECHO_EXEMPT = new Set(['M16'])
const words = (t: string) => t.toLowerCase().match(/[a-z']+/g) ?? []
const sixGrams = (t: string) => {
  const w = words(t)
  const out = new Set<string>()
  for (let i = 0; i + 6 <= w.length; i++) out.add(w.slice(i, i + 6).join(' '))
  return out
}
let echoPairs = 0
const echoWorst: string[] = []
for (const m of batch as any[]) {
  if (SELF_ECHO_EXEMPT.has(m.cardId)) continue
  let n = 0
  for (const entry of [m.libraryEntry, m.reversed.libraryEntry].filter(Boolean)) {
    const eg = sixGrams(entry)
    for (const line of [...m.readingLines, ...m.reversed.readingLines]) {
      const shared = [...sixGrams(line)].filter((g) => eg.has(g))
      if (shared.length) {
        n++
        if (echoWorst.length < 8) echoWorst.push(`${m.cardId}  ${shared[0]}`)
      }
    }
  }
  echoPairs += n
}
const echoPerCard = echoPairs / Math.max(1, batch.length - [...SELF_ECHO_EXEMPT].filter((id) => batch.some((m: any) => m.cardId === id)).length)
add(
  'library entry echoing its own reading line, under 1 per card',
  echoPerCard < 1,
  echoPerCard.toFixed(1),
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

/* Spread lines. Written in tranches after the corpus went final, checked
 * against a card group rather than a status group, since every card is now
 * `final`. Run with --spread to check only the cards that have them. VOICE-SPEC
 * "Spread lines" is the contract. */
const withSpread = (meanings as any[]).filter((m) => m.spread?.situation)
if (withSpread.length > 0 && process.argv.includes('--spread')) {
  const sLines = withSpread.flatMap((m) => [m.spread.situation, m.spread.knot, m.spread.direction])
  const already = sLines.reduce((n, t) => n + (t.match(/\balready\b/gi) ?? []).length, 0)
  add('spread: "already", 2 or fewer', already <= 2, String(already))

  /* Per card, not per line. Three 20-word lines are joined into one paragraph,
   * so requiring a fragment in each would put three of them inside 60 words and
   * read staccato. What the rule is actually protecting is audible rhythm in the
   * composed paragraph, and one short beat across the three delivers that. The
   * per-line version measured 32/60 and the per-card version 20/20, so this is a
   * correction to a rule written an hour earlier and not a hole opened to let
   * copy through. */
  const noBeatCards = withSpread.filter(
    (m) => !(['situation', 'knot', 'direction'] as const).some((p) =>
      splitSentences(m.spread[p]).some((x) => countWords(x) <= 6)),
  )
  add('spread: each card carries a beat of 6 words or fewer', noBeatCards.length === 0, `${withSpread.length - noBeatCards.length}/${withSpread.length}`)

  const youOpeners = withSpread.filter(
    (m) => ['situation', 'knot', 'direction'].filter((p) => /^You\b/.test(m.spread[p])).length > 1,
  )
  add('spread: at most one position per card opens on "You"', youOpeners.length === 0, `${youOpeners.length} card(s)`)

  for (const pos of ['situation', 'knot', 'direction'] as const) {
    const first = new Map<string, number>()
    for (const m of withSpread) {
      const w = (m.spread[pos].split(/\s+/)[0] ?? '').replace(/[^A-Za-z']/g, '')
      first.set(w, (first.get(w) ?? 0) + 1)
    }
    const worst = [...first.entries()].sort((a, b) => b[1] - a[1])[0]
    add(`spread: ${pos} opener repeats, 2 or fewer`, (worst?.[1] ?? 0) <= 2, `${worst?.[0]} x${worst?.[1]}`)
  }

  /* The self-echo rule extends to the new field. A spread line is the conceit
   * compressed, so it must not lift a run out of the reading lines. */
  let sEcho = 0
  const sEchoWorst: string[] = []
  for (const m of withSpread) {
    const own = new Set<string>()
    for (const t of [...m.readingLines, ...m.reversed.readingLines, m.libraryEntry, m.reversed.libraryEntry])
      for (const g of sixGrams(t)) own.add(g)
    for (const pos of ['situation', 'knot', 'direction'] as const) {
      const shared = [...sixGrams(m.spread[pos])].filter((g) => own.has(g))
      if (shared.length) {
        sEcho++
        if (sEchoWorst.length < 6) sEchoWorst.push(`${m.cardId} ${pos}  ${shared[0]}`)
      }
    }
  }
  add('spread: lines echoing the card\'s own copy', sEcho === 0, String(sEcho))
  console.log(`\n  spread tranche: ${withSpread.length} cards, ${sLines.length} lines, mean ${(sLines.reduce((a, t) => a + countWords(t), 0) / sLines.length).toFixed(1)} words`)
  if (sEchoWorst.length) for (const t of sEchoWorst) console.log(`    echo ${t}`)
}

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
if (echoWorst.length) {
  console.log('\n  self-echoed runs (entry repeating its own line):')
  for (const t of echoWorst) console.log(`    ${t}`)
}

/* Orphaned definite reference — soft observation, printed and not enforced.
 *
 * The composer pairs readingLines[i] with questions[i], so a question saying
 * "the advert" when the advert appears only in slot 0 asks the reader about a
 * prop they were never shown. Per-card review cannot see this, because
 * reviewing a card you have all three slots in front of you and the reference
 * resolves. The full-deck read-through in batch 7 found five.
 *
 * Deliberately soft. A first version of this check flagged 49 of 468
 * questions and the great majority were synonyms and morphology, "delay" for
 * a late train, "bolt" for a bolted door, "sincerity" for sincere. Stem
 * matching cuts most of that and will not cut all of it, so the output is for
 * a human to read rather than a gate to fail. That is the eighth time a
 * checker here has been cruder than the prose it judges.
 */
const stem = (w: string) => w.slice(0, 4)
const QSTOP = new Set('the a an and or is are was were be to in on at it its this that you your what which who whose where when how did do does have has had not no for with from any some there they them then than so as by'.split(' '))
const orphans: string[] = []
for (const m of batch as any[]) {
  const pairs: [string, string, string][] = [
    ...m.readingLines.map((l: string, i: number) => [l, m.questions[i], `u${i}`] as [string, string, string]),
    ...m.reversed.readingLines.map((l: string, i: number) => [l, m.reversed.questions[i], `r${i}`] as [string, string, string]),
  ]
  for (const [line, q, slot] of pairs) {
    const stems = new Set(words(line).map(stem))
    for (const match of q.toLowerCase().matchAll(/\bthe ([a-z']+)\b/g)) {
      const w = match[1]!
      if (QSTOP.has(w) || w.length < 4) continue
      if (!stems.has(stem(w))) orphans.push(`${m.cardId} ${slot}  "the ${w}"  ${q}`)
    }
  }
}
if (orphans.length) {
  console.log(`\n  definite references with no anchor in their own line (read these, ${orphans.length}):`)
  for (const o of orphans) console.log(`    ${o}`)
}

const failed = checks.filter((c) => !c.ok && c.hard)
console.log(`\nbatch-budget: ${failed.length} budget(s) breached`)
process.exit(failed.length > 0 ? 1 : 0)
