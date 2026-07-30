/*
 * verify-deck — npm run verify:deck [-- --root <dir>] [-- --write-baseline]
 *
 * Structural and mathematical correctness of the deck content. Exits
 * non-zero on any error. Complements (does not replace) lint:voice and
 * lint:sameness, which own prose quality; this script owns structure:
 *
 *   1. structure        78 cards, M00–M21 contiguous, 4 suits × 14, exact ranks
 *   2. dual-name        botanical ↔ classic ↔ suit ↔ rank, all 78, derived independently
 *   3. completeness     every required field populated, status final, no placeholder markers
 *   4. bounds           array lengths and word counts per VOICE-SPEC (spread floor 18
 *                       per the WRITING-LOG S1 amendment "The word floor moved from 20 to 18")
 *   5. duplication      exact + near-duplicate text across different cards
 *   6. assets           /public/deck files ↔ manifest.json ↔ card ids, both directions
 *   7. distribution     CONCEITS.md — domain ≤ 6 uses, no deck-order neighbours share one
 *   8. regression       corpus vs tools/deck-baseline.json — a silently dropped card or
 *                       blanked field since the last accepted pass is data loss, not drift
 *
 * --write-baseline rewrites tools/deck-baseline.json from the current corpus.
 * Run it only when the corpus change is intended and reviewed.
 * --root <dir> points at an alternate repo root (used to prove the script
 * fails on a seeded fault; the baseline is still read from this repo).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { trigrams, jaccard } from './lib/lint-core.ts'

const argv = process.argv.slice(2)
const argRoot = argv.indexOf('--root')
const selfRoot = new URL('..', import.meta.url).pathname
const root = argRoot > -1 ? (argv[argRoot + 1] as string) : selfRoot
const WRITE_BASELINE = argv.includes('--write-baseline')
const BASELINE_PATH = join(selfRoot, 'tools/deck-baseline.json')

let errors = 0
let currentSection = ''
function section(name: string) {
  currentSection = name
  console.log(`\n== ${name}`)
}
function fail(msg: string) {
  errors++
  console.log(`  FAIL  ${msg}`)
}
function ok(msg: string) {
  console.log(`  ok    ${msg}`)
}

interface CardRow {
  id: string
  name: string
  classicName: string
  arcana: 'major' | 'minor'
  suit?: string
  rank?: number | string
  keywords: string[]
}

const cards: CardRow[] = JSON.parse(readFileSync(join(root, 'src/content/cards.json'), 'utf8'))
const meanings: any[] = JSON.parse(
  readFileSync(join(root, 'src/content/meanings.json'), 'utf8'),
).meanings

const wc = (s: string) => s.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length

/* ------------------------------------------------------------ 1. structure */
section('structure')
{
  if (cards.length !== 78) fail(`cards.json has ${cards.length} cards, expected 78`)
  else ok('78 cards')

  const ids = cards.map((c) => c.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) fail(`duplicate card ids: ${dupes.join(', ')}`)
  else ok('no duplicate ids')

  const majors = cards.filter((c) => c.arcana === 'major')
  if (majors.length !== 22) fail(`${majors.length} majors, expected 22`)
  majors.forEach((c, i) => {
    const want = `M${String(i).padStart(2, '0')}`
    if (c.id !== want) fail(`major #${i} id is ${c.id}, expected ${want} (gap or misorder)`)
  })
  if (majors.length === 22 && majors.every((c, i) => c.id === `M${String(i).padStart(2, '0')}`))
    ok('majors M00–M21, contiguous, in order')

  const SUITS = ['wands', 'cups', 'swords', 'pentacles']
  const WANT_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'page', 'knight', 'queen', 'king']
  for (const s of SUITS) {
    const suit = cards.filter((c) => c.suit === s)
    if (suit.length !== 14) fail(`suit ${s} has ${suit.length} cards, expected 14`)
    const ranks = suit.map((c) => c.rank)
    if (JSON.stringify(ranks) !== JSON.stringify(WANT_RANKS))
      fail(`suit ${s} ranks are [${ranks.join(', ')}], expected 1–10, page, knight, queen, king`)
  }
  const minors = cards.filter((c) => c.arcana === 'minor')
  if (minors.length === 56) ok('4 suits × 14, ranks exact')
  const orphans = cards.filter((c) => c.arcana === 'minor' && (!c.suit || c.rank === undefined))
  if (orphans.length) fail(`minors missing suit/rank: ${orphans.map((c) => c.id).join(', ')}`)
  const strayed = cards.filter((c) => c.arcana === 'major' && (c.suit || c.rank !== undefined))
  if (strayed.length) fail(`majors carrying suit/rank: ${strayed.map((c) => c.id).join(', ')}`)
}

/* ---------------------------------------------------- 2. dual-name mapping */
section('dual-name mapping')
{
  // Derived independently from the id, so a swapped name is caught even if
  // name and classicName agree with each other.
  const PLANT: Record<string, string> = {
    wands: 'Hawthorn',
    cups: 'Bellflower',
    swords: 'Gladiolus',
    pentacles: 'Lunaria',
  }
  const CLASSIC: Record<string, string> = {
    wands: 'Wands',
    cups: 'Cups',
    swords: 'Swords',
    pentacles: 'Pentacles',
  }
  const NUMWORD: Record<number, string> = {
    1: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five',
    6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
  }
  const MAJOR_TITLES = [
    'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
    'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
    'The Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
    'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
  ]
  let bad = 0
  for (const c of cards) {
    if (c.arcana === 'major') {
      const n = Number(c.id.slice(1))
      const want = MAJOR_TITLES[n]
      if (c.name !== want || c.classicName !== want) {
        fail(`${c.id}: "${c.name}" / "${c.classicName}", expected "${want}" for both`)
        bad++
      }
      continue
    }
    const suit = c.suit as string
    const rank = c.rank as number | string
    const rankWord =
      typeof rank === 'number'
        ? NUMWORD[rank]
        : String(rank).charAt(0).toUpperCase() + String(rank).slice(1)
    const wantId = typeof rank === 'number' ? `${suit}-${String(rank).padStart(2, '0')}` : `${suit}-${rank}`
    const wantName = `${rankWord} of ${PLANT[suit]}`
    const wantClassic = `${rankWord} of ${CLASSIC[suit]}`
    if (c.id !== wantId) { fail(`${c.id}: id should be ${wantId}`); bad++ }
    if (c.name !== wantName) { fail(`${c.id}: botanical name "${c.name}", expected "${wantName}"`); bad++ }
    if (c.classicName !== wantClassic) { fail(`${c.id}: classic name "${c.classicName}", expected "${wantClassic}"`); bad++ }
  }
  if (bad === 0) ok('all 78 botanical ↔ classic ↔ suit ↔ rank mappings correct')
}

/* ------------------------------------------------------- 3. completeness */
section('completeness')
{
  const ids = new Set(cards.map((c) => c.id))
  const mids = meanings.map((m) => m.cardId)
  const noMeaning = [...ids].filter((id) => !mids.includes(id))
  const noCard = mids.filter((id) => !ids.has(id))
  const dupMeanings = mids.filter((id, i) => mids.indexOf(id) !== i)
  if (noMeaning.length) fail(`cards without a meaning: ${noMeaning.join(', ')}`)
  if (noCard.length) fail(`meanings without a card: ${noCard.join(', ')}`)
  if (dupMeanings.length) fail(`duplicate meanings: ${dupMeanings.join(', ')}`)
  if (!noMeaning.length && !noCard.length && !dupMeanings.length) ok('cards ↔ meanings 1:1')

  const belowFinal = meanings.filter((m) => m.status !== 'final')
  if (belowFinal.length)
    fail(`status below final (ship gate): ${belowFinal.map((m) => `${m.cardId}=${m.status}`).join(', ')}`)
  else ok('all 78 status final')

  const PLACEHOLDER = /lorem|TKTK|TODO|FIXME|placeholder|\{\{|\{name\}|\{kw/i
  let holes = 0
  for (const m of meanings) {
    const texts: [string, string][] = [
      ...m.readingLines.map((t: string, i: number) => [`readingLines[${i}]`, t] as [string, string]),
      ...m.questions.map((t: string, i: number) => [`questions[${i}]`, t] as [string, string]),
      ['libraryEntry', m.libraryEntry],
      ['altText', m.altText],
      ...m.reversed.readingLines.map((t: string, i: number) => [`reversed.readingLines[${i}]`, t] as [string, string]),
      ...m.reversed.questions.map((t: string, i: number) => [`reversed.questions[${i}]`, t] as [string, string]),
      ['reversed.libraryEntry', m.reversed.libraryEntry],
      ['spread.situation', m.spread?.situation ?? ''],
      ['spread.knot', m.spread?.knot ?? ''],
      ['spread.direction', m.spread?.direction ?? ''],
    ]
    for (const [field, t] of texts) {
      if (typeof t !== 'string' || t.trim() === '') { fail(`${m.cardId} ${field}: empty`); holes++ }
      else if (PLACEHOLDER.test(t)) { fail(`${m.cardId} ${field}: placeholder marker`); holes++ }
    }
    for (const [field, q] of [
      ...m.questions.map((t: string, i: number) => [`questions[${i}]`, t]),
      ...m.reversed.questions.map((t: string, i: number) => [`reversed.questions[${i}]`, t]),
    ] as [string, string][]) {
      const marks = (q.match(/\?/g) ?? []).length
      if (marks !== 1 || !q.trim().endsWith('?')) { fail(`${m.cardId} ${field}: needs exactly one trailing "?"`); holes++ }
    }
    for (const [field, t] of texts.filter(([f]) => !f.includes('questions'))) {
      if (typeof t === 'string' && t.includes('?')) { fail(`${m.cardId} ${field}: "?" outside a question field`); holes++ }
    }
  }
  if (holes === 0) ok('every field populated, no placeholder markers, question marks only in questions')
}

/* ------------------------------------------------------------- 4. bounds */
section('bounds')
{
  let out = 0
  const check = (id: string, field: string, n: number, lo: number, hi: number) => {
    if (n < lo || n > hi) { fail(`${id} ${field}: ${n} (bounds ${lo}–${hi})`); out++ }
  }
  for (const c of cards) check(c.id, 'cards.json keywords', c.keywords.length, 3, 4)
  for (const m of meanings) {
    check(m.cardId, 'keywords count', m.keywords.length, 3, 4)
    check(m.cardId, 'readingLines count', m.readingLines.length, 3, 3)
    check(m.cardId, 'questions count', m.questions.length, 3, 3)
    check(m.cardId, 'reversed.readingLines count', m.reversed.readingLines.length, 3, 3)
    check(m.cardId, 'reversed.questions count', m.reversed.questions.length, 3, 3)
    m.readingLines.forEach((t: string, i: number) => check(m.cardId, `readingLines[${i}] words`, wc(t), 35, 50))
    m.questions.forEach((t: string, i: number) => check(m.cardId, `questions[${i}] words`, wc(t), 2, 12))
    check(m.cardId, 'libraryEntry words', wc(m.libraryEntry), 140, 170)
    m.reversed.readingLines.forEach((t: string, i: number) =>
      check(m.cardId, `reversed.readingLines[${i}] words`, wc(t), 35, 50))
    m.reversed.questions.forEach((t: string, i: number) =>
      check(m.cardId, `reversed.questions[${i}] words`, wc(t), 2, 12))
    check(m.cardId, 'reversed.libraryEntry words', wc(m.reversed.libraryEntry), 140, 170)
    for (const pos of ['situation', 'knot', 'direction'])
      check(m.cardId, `spread.${pos} words`, wc(m.spread?.[pos] ?? ''), 18, 30)
    check(m.cardId, 'altText words', wc(m.altText), 8, 25)
  }
  if (out === 0) ok('all array lengths and word counts in bounds')
}

/* -------------------------------------------------------- 5. duplication */
section('cross-card duplication')
{
  // Exact duplicates across any two different cards, any field; near-dupes
  // within a field class (a reading line legitimately shares nothing with a
  // question). lint:sameness owns style-level echo; this owns copy-paste.
  interface Piece { cardId: string; field: string; text: string; grams: Set<string>; klass: string }
  const pieces: Piece[] = []
  for (const m of meanings) {
    const push = (field: string, klass: string, text: string) =>
      pieces.push({ cardId: m.cardId, field, text, grams: trigrams(text), klass })
    m.readingLines.forEach((t: string, i: number) => push(`readingLines[${i}]`, 'line', t))
    m.reversed.readingLines.forEach((t: string, i: number) => push(`reversed.readingLines[${i}]`, 'line', t))
    m.questions.forEach((t: string, i: number) => push(`questions[${i}]`, 'question', t))
    m.reversed.questions.forEach((t: string, i: number) => push(`reversed.questions[${i}]`, 'question', t))
    push('libraryEntry', 'library', m.libraryEntry)
    push('reversed.libraryEntry', 'library', m.reversed.libraryEntry)
    ;(['situation', 'knot', 'direction'] as const).forEach((pos) => push(`spread.${pos}`, 'spread', m.spread?.[pos] ?? ''))
  }
  const NEAR = 0.5
  let dupes = 0
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']+/g, ' ').trim()
  const seenExact = new Map<string, Piece>()
  for (const p of pieces) {
    const key = norm(p.text)
    if (!key) continue
    const prior = seenExact.get(key)
    if (prior && prior.cardId !== p.cardId) {
      fail(`EXACT duplicate: ${prior.cardId} ${prior.field} == ${p.cardId} ${p.field}`)
      dupes++
    } else if (!prior) seenExact.set(key, p)
  }
  for (let i = 0; i < pieces.length; i++) {
    const a = pieces[i] as Piece
    for (let j = i + 1; j < pieces.length; j++) {
      const b = pieces[j] as Piece
      if (a.cardId === b.cardId || a.klass !== b.klass) continue
      const sim = jaccard(a.grams, b.grams)
      if (sim >= NEAR) {
        fail(`near-duplicate (${sim.toFixed(2)}): ${a.cardId} ${a.field} ~ ${b.cardId} ${b.field}`)
        dupes++
      }
    }
  }
  if (dupes === 0) ok(`no exact or near-duplicate (jaccard ≥ ${NEAR}) text across cards`)
}

/* ------------------------------------------------------------- 6. assets */
section('assets')
{
  const manifest: { cards?: string[] } = JSON.parse(
    readFileSync(join(root, 'public/deck/manifest.json'), 'utf8'),
  )
  const listed = manifest.cards ?? []
  const ids = new Set(cards.map((c) => c.id))
  const files = readdirSync(join(root, 'public/deck'))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, ''))
  let bad = 0
  for (const id of listed) {
    if (!ids.has(id)) { fail(`manifest lists unknown card id: ${id}`); bad++ }
    if (!files.includes(id)) { fail(`manifest lists ${id} but public/deck/${id}.webp is missing`); bad++ }
  }
  for (const f of files) {
    if (!listed.includes(f)) { fail(`public/deck/${f}.webp exists but is not in manifest.json`); bad++ }
    if (!ids.has(f)) { fail(`public/deck/${f}.webp matches no card id`); bad++ }
  }
  const dupListed = listed.filter((id, i) => listed.indexOf(id) !== i)
  if (dupListed.length) { fail(`manifest duplicate entries: ${dupListed.join(', ')}`); bad++ }
  if (bad === 0)
    ok(`manifest ↔ files ↔ ids consistent (${listed.length} real, ${78 - listed.length} generated plates)`)
}

/* ------------------------------------------------------ 7. distribution */
section('domain distribution (CONCEITS.md)')
{
  const text = readFileSync(join(root, 'CONCEITS.md'), 'utf8')
  const RANKTOKEN: Record<string, string> = { P: 'page', Kn: 'knight', Q: 'queen', K: 'king' }
  const SUITLETTER: Record<string, string> = { w: 'wands', c: 'cups', s: 'swords', p: 'pentacles' }
  const rows: { id: string; conceit: string; domain: string }[] = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*(M\d\d|[wcsp](?:\d\d|P|Kn|Q|K))\s*\|([^|]*)\|([^|]*)\|([^|]*)\|/)
    if (!m) continue
    const short = m[1] as string
    let id: string
    if (short.startsWith('M')) id = short
    else {
      const suit = SUITLETTER[short.charAt(0)] as string
      const tok = short.slice(1)
      id = /^\d/.test(tok) ? `${suit}-${tok}` : `${suit}-${RANKTOKEN[tok]}`
    }
    rows.push({ id, conceit: (m[3] ?? '').trim(), domain: (m[4] ?? '').trim() })
  }
  const byId = new Map(rows.map((r) => [r.id, r]))
  let bad = 0
  for (const c of cards) {
    const r = byId.get(c.id)
    if (!r) { fail(`${c.id}: no CONCEITS.md row`); bad++; continue }
    if (!r.conceit) { fail(`${c.id}: empty conceit`); bad++ }
    if (!r.domain) { fail(`${c.id}: empty domain`); bad++ }
  }
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.domain, (counts.get(r.domain) ?? 0) + 1)
  for (const [d, n] of counts) if (n > 6) { fail(`domain "${d}" used ${n} times (max 6)`); bad++ }
  for (let i = 1; i < cards.length; i++) {
    const a = byId.get((cards[i - 1] as CardRow).id)
    const b = byId.get((cards[i] as CardRow).id)
    if (a && b && a.domain && a.domain === b.domain) {
      fail(`deck-order neighbours share domain "${a.domain}": ${a.id} / ${b.id}`)
      bad++
    }
  }
  if (bad === 0) ok(`all 78 have conceit+domain; no domain over 6 uses; no adjacent repeats`)
}

/* -------------------------------------------------------- 8. regression */
section('corpus regression vs baseline')
{
  // Per-card, per-field presence/count map. Any count that goes DOWN against
  // the committed baseline is treated as lost content, not as an edit.
  type Snapshot = Record<string, Record<string, number>>
  const snapshot: Snapshot = {}
  for (const m of meanings) {
    snapshot[m.cardId] = {
      readingLines: m.readingLines.filter((t: string) => t.trim()).length,
      questions: m.questions.filter((t: string) => t.trim()).length,
      libraryEntry: m.libraryEntry.trim() ? 1 : 0,
      reversedLines: m.reversed.readingLines.filter((t: string) => t.trim()).length,
      reversedQuestions: m.reversed.questions.filter((t: string) => t.trim()).length,
      reversedLibrary: m.reversed.libraryEntry.trim() ? 1 : 0,
      altText: m.altText.trim() ? 1 : 0,
      'spread.situation': (m.spread?.situation ?? '').trim() ? 1 : 0,
      'spread.knot': (m.spread?.knot ?? '').trim() ? 1 : 0,
      'spread.direction': (m.spread?.direction ?? '').trim() ? 1 : 0,
      final: m.status === 'final' ? 1 : 0,
    }
  }
  if (WRITE_BASELINE) {
    writeFileSync(BASELINE_PATH, JSON.stringify(snapshot, null, 1) + '\n')
    ok(`baseline written: ${BASELINE_PATH} (${Object.keys(snapshot).length} cards)`)
  } else if (!existsSync(BASELINE_PATH)) {
    fail('tools/deck-baseline.json missing — run `npm run verify:deck -- --write-baseline` on a reviewed corpus and commit it')
  } else {
    const base: Snapshot = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
    let bad = 0
    for (const id of Object.keys(base)) {
      const now = snapshot[id]
      if (!now) { fail(`card ${id} present in baseline, GONE from corpus — data loss`); bad++; continue }
      const then = base[id] as Record<string, number>
      for (const k of Object.keys(then)) {
        if ((now[k] ?? 0) < (then[k] as number)) {
          fail(`${id} ${k}: ${then[k]} in baseline, now ${now[k] ?? 0} — ${k === 'final' ? 'ship-gate regression' : 'lost content'}`)
          bad++
        }
      }
    }
    const added = Object.keys(snapshot).filter((id) => !(id in base))
    if (added.length) console.log(`  note  new since baseline: ${added.join(', ')} (rewrite baseline when accepted)`)
    if (bad === 0) ok(`no card or field lost since baseline (${Object.keys(base).length} cards)`)
  }
}

console.log(`\nverify-deck: ${errors} error(s)`)
process.exit(errors === 0 ? 0 : 1)
