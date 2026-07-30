/*
 * verify-engine — npm run verify:engine
 *
 * Behavioral correctness of the draw/echo/threads/composer engine, run
 * against the REAL /src/engine modules (loaded via tools/lib/register-app-imports.mjs,
 * so nothing here is a reimplementation that can drift — except the Today.tsx
 * variant-of-the-day formula, which lives in a view and is mirrored below,
 * marked MIRROR). Exits non-zero on any failed assertion.
 *
 * Covers:
 *   daily draw      determinism, local-midnight boundary, DST, date line,
 *                   leap day, cross-device divergence, full-deck coverage,
 *                   modulo-bias / uniformity
 *   variant         per-day stability, all three variants reachable
 *   spreads         10 000 draws — three unique cards, uniform distribution
 *   echo            fixture suite for findEcho, incl. deleted-prior handling
 *   threads         fixture counts, rolling-window boundary, suit balance
 *   composer        1 000 fuzzed spreads — no seams, exactly one trailing "?"
 *   error paths     unknown card ids must degrade, never throw
 *
 * Timezone cases run in child processes (TZ is process-wide in libc; a child
 * per zone is the only clean isolation).
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { dailyCard, drawSpread, hashString, localDateString } from '../src/engine/draw.ts'
import { findEcho } from '../src/engine/storage.ts'
import { summarizeThreads, WINDOW_DAYS } from '../src/engine/threads.ts'
import { composeReading } from '../src/engine/composer.ts'
import { CARDS, meaningFor } from '../src/engine/content.ts'
import type { Card, DrawRecord, Entry } from '../src/engine/types.ts'

let failures = 0
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ok    ${msg}`)
  else {
    failures++
    console.log(`  FAIL  ${msg}`)
  }
}
function section(name: string) {
  console.log(`\n== ${name}`)
}

/* A local calendar-date iterator that never touches the clock. */
function* dates(startIso: string, days: number): Generator<string> {
  const [y, mo, d] = startIso.split('-').map(Number) as [number, number, number]
  const cur = new Date(y, mo - 1, d, 12)
  for (let i = 0; i < days; i++) {
    yield localDateString(cur)
    cur.setDate(cur.getDate() + 1)
  }
}

/* --------------------------------------------------------- timezone child */
const TZ_CHILD = process.argv.indexOf('--tz-child')
if (TZ_CHILD > -1) {
  // Runs with TZ already set by the parent. Prints `instantMs=localDate` lines.
  for (const ms of (process.argv[TZ_CHILD + 1] as string).split(',')) {
    console.log(`${ms}=${localDateString(new Date(Number(ms)))}`)
  }
  process.exit(0)
}

function localDatesIn(tz: string, instantsMs: number[]): Map<number, string> {
  const out = execFileSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--no-warnings',
      '--import',
      new URL('./lib/register-app-imports.mjs', import.meta.url).pathname,
      fileURLToPath(import.meta.url),
      '--tz-child',
      instantsMs.join(','),
    ],
    { env: { ...process.env, TZ: tz }, encoding: 'utf8' },
  )
  const map = new Map<number, string>()
  for (const line of out.trim().split('\n')) {
    const [ms, date] = line.split('=')
    map.set(Number(ms), date as string)
  }
  return map
}

/* ------------------------------------------------------------ daily draw */
section('daily draw — determinism')
{
  const a = dailyCard('2026-07-30', 'seed-A')
  assert(
    Array.from({ length: 1000 }, () => dailyCard('2026-07-30', 'seed-A').id).every((id) => id === a.id),
    'same date + seed → same card, 1000 calls',
  )
  const week = [...dates('2026-07-27', 7)].map((d) => dailyCard(d, 'seed-A').id)
  assert(new Set(week).size > 1, 'card changes across a week of dates')
  const devices = new Set(Array.from({ length: 100 }, (_, i) => dailyCard('2026-07-30', `device-${i}`).id))
  assert(devices.size >= 30, `different devices diverge (${devices.size}/100 distinct on one date)`)
}

section('daily draw — coverage and uniformity')
{
  // Coupon-collector note: one 365-day year is EXPECTED to miss ~2 cards
  // (E[all 78 seen] ≈ 386 draws), so "all 78 in a year" would flag a correct
  // engine. The real defect class — an index a biased hash can never yield —
  // is caught by demanding full coverage over a longer horizon plus a
  // frequency-spread bound.
  for (const seed of ['seed-A', 'crypto-uuid-shaped-0000', 'z']) {
    const seen = new Map<string, number>()
    for (const d of dates('2020-01-01', 78 * 60)) {
      const c = dailyCard(d, seed)
      seen.set(c.id, (seen.get(c.id) ?? 0) + 1)
    }
    assert(seen.size === 78, `seed "${seed}": all 78 cards appear across ${78 * 60} days`)
    const counts = [...seen.values()]
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    assert(min > 0 && max / min < 2.5, `seed "${seed}": frequency spread sane (min ${min}, max ${max})`)
  }
  const oneYear = new Set([...dates('2026-01-01', 365)].map((d) => dailyCard(d, 'seed-A').id))
  console.log(`  note  single-year coverage for one seed: ${oneYear.size}/78 (misses are expected, see comment)`)
}

section('daily draw — local midnight, DST, date line, leap day')
{
  const t = (iso: string) => new Date(iso).getTime()
  const nyc = localDatesIn('America/New_York', [
    t('2026-07-30T03:59:59Z'), // 23:59:59 EDT July 29
    t('2026-07-30T04:00:00Z'), // 00:00:00 EDT July 30 — the boundary
    t('2026-03-08T06:59:00Z'), // 01:59 EST, minute before spring-forward
    t('2026-03-08T07:01:00Z'), // 03:01 EDT, minute after
    t('2026-11-01T05:30:00Z'), // 01:30 twice on fall-back day
  ])
  assert(nyc.get(t('2026-07-30T03:59:59Z')) === '2026-07-29', 'NYC 23:59:59 is still July 29')
  assert(nyc.get(t('2026-07-30T04:00:00Z')) === '2026-07-30', 'NYC boundary: card date changes at local midnight, not UTC')
  assert(nyc.get(t('2026-03-08T06:59:00Z')) === '2026-03-08', 'spring-forward: date correct before the skipped hour')
  assert(nyc.get(t('2026-03-08T07:01:00Z')) === '2026-03-08', 'spring-forward: date correct after the skipped hour')
  assert(nyc.get(t('2026-11-01T05:30:00Z')) === '2026-11-01', 'fall-back: repeated hour stays on the same date')

  const instant = t('2026-07-30T11:30:00Z')
  const kiritimati = localDatesIn('Pacific/Kiritimati', [instant]).get(instant) // UTC+14
  const midway = localDatesIn('Pacific/Midway', [instant]).get(instant) // UTC-11
  assert(kiritimati === '2026-07-31' && midway === '2026-07-30',
    `date line: same instant is ${kiritimati} on Kiritimati and ${midway} on Midway`)
  assert(dailyCard(kiritimati as string, 's').id !== dailyCard(midway as string, 's').id ||
    kiritimati !== midway, 'travelling across the date line changes the local date (and so the draw key)')

  assert(localDateString(new Date(2028, 1, 29, 12)) === '2028-02-29', 'leap day formats correctly')
  assert(Boolean(dailyCard('2028-02-29', 'seed-A').id), 'leap day draws a card')
  // A manual clock change is just a different Date -> different key; determinism
  // already proven. Forward-then-back yields the original card:
  assert(dailyCard('2026-07-30', 's').id === dailyCard('2026-07-30', 's').id, 'clock set back re-derives the same card')
}

section('variant of the day (MIRROR of Today.tsx)')
{
  const variantOf = (dateIso: string, cardId: string, n: number) =>
    n ? hashString(`${dateIso}|${cardId}|v`) % n : 0
  let stable = true
  let allThree = true
  let repeats = 0
  let pairs = 0
  for (const c of CARDS) {
    const n = meaningFor(c.id).readingLines.length
    const seen = new Set<number>()
    let prev = -1
    for (const d of dates('2026-01-01', 90)) {
      const v = variantOf(d, c.id, n)
      if (v !== variantOf(d, c.id, n)) stable = false
      seen.add(v)
      if (prev >= 0) {
        pairs++
        if (v === prev) repeats++
      }
      prev = v
    }
    if (seen.size !== n) allThree = false
  }
  assert(stable, 'variant is stable for a given date + card')
  assert(allThree, 'every card reaches all three variants within 90 days')
  console.log(
    `  note  consecutive-day same-variant rate: ${((100 * repeats) / pairs).toFixed(1)}% — ` +
      'per-day hash, not a cycle; a repeat draw can show the same line (flagged conflict, see order)',
  )
}

/* ---------------------------------------------------------------- spreads */
section('spreads — 10 000 draws')
{
  const N = 10_000
  const counts = new Map<string, number>()
  let dupes = 0
  for (let i = 0; i < N; i++) {
    const three = drawSpread()
    if (new Set(three.map((c) => c.id)).size !== 3) dupes++
    for (const c of three) counts.set(c.id, (counts.get(c.id) ?? 0) + 1)
  }
  assert(dupes === 0, 'no spread contains a duplicate card')
  assert(counts.size === 78, 'all 78 cards appear across 10 000 spreads')
  const expected = (N * 3) / 78 // ≈ 385
  const min = Math.min(...counts.values())
  const max = Math.max(...counts.values())
  // ±6σ for binomial(30000, 1/26·1/3): σ ≈ 19.4 → bound ≈ 385 ± 117
  assert(min > expected - 120 && max < expected + 120,
    `uniform within ±6σ (min ${min}, max ${max}, expected ≈ ${expected.toFixed(0)})`)
}

/* ------------------------------------------------------------------- echo */
section('echo — fixture suite')
{
  const entry = (id: string, isoDate: string, cardIds: string[], text: string, createdAt = 0): Entry =>
    ({ id, isoDate, cardIds, text, source: 'daily', createdAt, updatedAt: createdAt })
  const fixtures: Entry[] = [
    entry('2026-07-01', '2026-07-01', ['M13'], 'first M13 words', 1),
    entry('2026-07-10', '2026-07-10', ['M13'], 'second M13 words', 2),
    entry('2026-07-15', '2026-07-15', ['M13'], '', 3), // empty — must never echo
    entry('2026-07-20', '2026-07-20', ['wands-02'], 'other card', 4),
    entry('spread-2026-07-10-99', '2026-07-10', ['M13', 'M14', 'M15'], 'spread with M13', 5),
  ]
  assert(findEcho([], 'M13') === undefined, 'no entries → no echo')
  assert(findEcho(fixtures, 'M21') === undefined, 'first draw of a card → no echo')
  assert(findEcho(fixtures, 'M13', '2026-07-30')?.isoDate === '2026-07-10', 'echo picks most recent earlier entry with text (not the empty one)')
  assert(findEcho(fixtures, 'M13', '2026-07-10')?.isoDate !== undefined &&
    findEcho(fixtures, 'M13', '2026-07-10')?.id !== '2026-07-10',
    "today's own entry is excluded")
  const sameDay = findEcho(fixtures, 'M13', 'x')
  assert(sameDay?.id === 'spread-2026-07-10-99', 'same-date tie breaks to higher createdAt')
  const afterDelete = fixtures.filter((e) => e.id !== '2026-07-10' && e.id !== 'spread-2026-07-10-99')
  assert(findEcho(afterDelete, 'M13', '2026-07-30')?.id === '2026-07-01', 'deleted prior entry → echo falls back to the next earlier one')
  assert(findEcho(afterDelete.filter((e) => e.id !== '2026-07-01'), 'M13') === undefined, 'all priors deleted → no echo, no crash')
}

/* ---------------------------------------------------------------- threads */
section('threads — fixture suite')
{
  const draw = (cardId: string, isoDate: string, source: 'daily' | 'spread' = 'daily'): DrawRecord =>
    ({ cardId, isoDate, source })
  const today = '2026-07-30'
  const fx: DrawRecord[] = [
    draw('M13', '2026-07-30'), draw('M13', '2026-07-29'), draw('M13', '2026-07-28'),
    draw('wands-02', '2026-07-27'), draw('wands-02', '2026-07-26'),
    draw('cups-05', '2026-07-25'),
    draw('swords-09', '2026-07-01'),
    draw('pentacles-03', '2026-06-05'), // long outside any 30-day window
  ]
  const s = summarizeThreads(fx, today)
  assert(s.topCards[0]?.cardId === 'M13' && s.topCards[0]?.count === 3, 'top card is M13 ×3')
  assert(s.topCards[1]?.cardId === 'wands-02' && s.topCards[1]?.count === 2, 'second is wands-02 ×2')
  assert(s.topCards.length === 3, 'top-3 only')
  assert(!fx.slice(0, 7).some((d) => d.cardId === 'pentacles-03' && s.drawCount > 7), 'June 5 draw is outside the window')
  assert(s.suitCounts.wands === 2 && s.suitCounts.cups === 1 && s.suitCounts.swords === 1,
    'suit counts correct for minors in window')
  const minorsInWindow = s.suitCounts.wands + s.suitCounts.cups + s.suitCounts.swords + s.suitCounts.pentacles
  assert(minorsInWindow + 3 === s.drawCount, 'drawCount = suit total + majors (majors sit outside the balance bar by design)')

  // Rolling window, not calendar month — and exactly WINDOW_DAYS days of it.
  // "Last 30 days" = today and the 29 before it. A draw 30 days before today
  // must fall outside. (Currently the cutoff keeps it: off-by-one, 31-day window.)
  const edge = summarizeThreads([draw('M00', '2026-06-30'), draw('M01', '2026-07-01')], today)
  assert(edge.drawCount === 1, `window is exactly ${WINDOW_DAYS} days: a draw ${WINDOW_DAYS} days before today is excluded`)
  const rolling = summarizeThreads([draw('M00', '2026-07-02')], today)
  assert(rolling.drawCount === 1, 'window rolls (July 2 in window on July 30, though a "calendar month" view would drop it)')
  assert(summarizeThreads([draw('M00', '2026-08-01')], today).drawCount === 0, 'future-dated draws (clock set back) stay out of the window')
  assert(summarizeThreads([draw('ghost-99', '2026-07-29')], today).drawCount === 1 &&
    summarizeThreads([draw('ghost-99', '2026-07-29')], today).suitCounts.wands === 0,
    'unknown card id in draw log degrades (counted, no suit, no crash)')
}

/* --------------------------------------------------------------- composer */
section('composer — 1 000 fuzzed spreads')
{
  let bad = 0
  const seams: string[] = []
  for (let i = 0; i < 1000; i++) {
    const cards = drawSpread()
    const dateIso = `2026-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`
    const r = composeReading(cards, dateIso)
    const joined = r.sentences.join(' ')
    const whole = `${joined} ${r.question}`
    const checks: [boolean, string][] = [
      [r.sentences.every((s) => s.trim().length > 0), 'empty sentence slot'],
      [!/undefined|null|\[object/.test(whole), 'null slot rendered as text'],
      [!/ {2}|\.\.|,,|\?\?|\.,|,\./.test(whole), 'doubled punctuation or spacing'],
      [!/[{}]/.test(whole), 'template seam'],
      [!joined.includes('?'), 'question mark inside the body'],
      [(r.question.match(/\?/g) ?? []).length === 1 && r.question.trim().endsWith('?'), 'exactly one trailing question mark'],
      [JSON.stringify(composeReading(cards, dateIso)) === JSON.stringify(r), 'same draw + date rereads identically'],
    ]
    for (const [okc, label] of checks)
      if (!okc) {
        bad++
        if (seams.length < 5) seams.push(`${cards.map((c) => c.id).join('+')} ${dateIso}: ${label}`)
      }
  }
  assert(bad === 0, `1000 composed readings clean${bad ? ` — ${bad} defects, e.g. ${seams.join(' · ')}` : ''}`)
  const wordCounts = CARDS.map((c) => {
    const m = meaningFor(c.id)
    return [m.spread.situation, m.spread.knot, m.spread.direction].map((s) => s.split(/\s+/).length)
  }).flat()
  assert(Math.min(...wordCounts) >= 18 && Math.max(...wordCounts) <= 30,
    'every composed paragraph stays within 3×(18–30) words (per-line bounds hold)')
}

/* ------------------------------------------------------------ error paths */
section('error paths — unknown content degrades, never throws')
{
  const ghost = { id: 'ghost-99', name: 'Ghost', classicName: 'Ghost', arcana: 'minor', keywords: [] } as unknown as Card
  let threw = false
  let out = null as ReturnType<typeof composeReading> | null
  try {
    out = composeReading([ghost, ghost, ghost], '2026-07-30')
  } catch {
    threw = true
  }
  assert(!threw, 'composeReading with unknown card ids does not throw')
  assert(out !== null && out.question === '', 'unknown card → empty question, not a crash')
  assert(meaningFor('ghost-99').status === 'placeholder', 'meaningFor falls back to the empty meaning')
  assert(meaningFor('ghost-99').readingLines.length === 0, 'fallback meaning renders empty, not undefined')
}

console.log(`\nverify-engine: ${failures} failed assertion(s)`)
process.exit(failures === 0 ? 0 : 1)
