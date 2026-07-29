/*
 * Shared linting core for the Understory writing campaign. Pure functions,
 * no Node or DOM APIs — imported by the /tools CLI scripts and by the
 * dev-only #/writing dashboard. Rules live in VOICE.md; this file enforces
 * the mechanical subset.
 */

export type Severity = 'error' | 'warn'

export interface Violation {
  cardId: string
  field: string
  rule: string
  severity: Severity
  message: string
}

/* ------------------------------------------------------------ vocabulary */

/** VOICE.md §2 — banned outright. The Wheel of Fortune title is exempted
 *  by stripping it before matching. */
const BANNED_VOCAB: [RegExp, string][] = [
  [/\bwill\b/i, 'predictive "will"'],
  [/\bwon't\b/i, 'predictive "won\'t"'],
  [/\bgoing to\b/i, 'predictive "going to"'],
  [/\bfortune\b/i, '"fortune"'],
  [/\bdestiny\b/i, '"destiny"'],
  [/\bfated?\b/i, '"fate"'],
  [/\bthe universe\b/i, '"the universe"'],
  [/\benerg(?:y|ies|etic)\b/i, '"energy"'],
  [/\bvibrations?\b/i, '"vibration"'],
  [/\bmanifest\w*/i, '"manifest"'],
  [/\babundan(?:ce|t)\b/i, '"abundance"'],
  [/\bjourney\b/i, '"journey" (as metaphor)'],
  [/\btrust the process\b/i, '"trust the process"'],
  [/\beverything happens for a reason\b/i, '"everything happens for a reason"'],
  [/\bsouls?\b/i, '"soul"'],
  [/\bdivine\b/i, '"divine"'],
  [/\bblessed\b/i, '"blessed"'],
  [/\bmeant to be\b/i, '"meant to be"'],
]

/** "should/must/ought" are flagged anywhere. "need to"/"have to" only when
 *  aimed at the reader ("you need to…") — "the entry needs to be true" or
 *  "you don't have to" are statements and permissions, not advice. */
const ADVICE_VERBS: [RegExp, string][] = [
  [/\bshould\b/i, 'advice verb "should"'],
  [/\bmust\b/i, 'advice verb "must"'],
  [/\byou(?:'ll)?\b(?:(?!\bnot\b|n't)[^.!?]){0,30}\bneeds? to\b/i, 'advice verb "need to" (second person)'],
  [/\byou(?:'ll)?\b(?:(?!\bnot\b|n't)[^.!?]){0,30}\bha(?:ve|s) to\b/i, 'advice verb "have to" (second person)'],
  [/\bought\b/i, 'advice verb "ought"'],
]

/** Heuristic net for health/financial/legal guidance. Warn-level: a human
 *  reads every hit; the rule exists so none slip past unread. */
const GUIDANCE_NET: [RegExp, string][] = [
  [/\b(?:therap\w+|doctor|medical|diagnos\w+|medication|clinic)\b/i, 'possible health guidance'],
  [/\b(?:invest\w*|financial|debt|savings account|portfolio)\b/i, 'possible financial guidance'],
  [/\b(?:lawyer|legal|lawsuit|contract advice)\b/i, 'possible legal guidance'],
  [/\bsee(?:ing)? someone about\b/i, 'softened referral ("seeing someone about it")'],
]

const FIRST_PERSON: [RegExp, string][] = [
  [/\bI\b/, 'first-person drift ("I")'],
  [/\bI'(?:m|ve|d|ll)\b/, 'first-person drift'],
  [/\bme\b/i, 'first-person drift ("me")'],
]

/** Parse the ```barnum-patterns fenced block out of VOICE.md text. */
export function parseBarnumPatterns(voiceMd: string): RegExp[] {
  const m = voiceMd.match(/```barnum-patterns\n([\s\S]*?)```/)
  if (!m || !m[1]) return []
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))
    .map((l) => new RegExp(l, 'i'))
}

function stripExemptions(text: string): string {
  return text.replace(/The Wheel of Fortune/g, '')
}

/* ------------------------------------------------------------ mechanics */

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  const stripped = w.replace(/(?:[^laeiouy]e|ed|es)$/, '')
  const groups = stripped.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

/** Flesch–Kincaid grade level. Target for the corpus: roughly 7–9. */
export function fleschKincaidGrade(text: string): number {
  const sentences = splitSentences(text)
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w))
  if (sentences.length === 0 || words.length === 0) return 0
  const syllables = words.reduce((n, w) => n + countSyllables(w), 0)
  return 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59
}

/* ------------------------------------------------------------ field lint */

export interface FieldBounds {
  minWords?: number
  maxWords?: number
  /** '0' = no question marks allowed; '1' = exactly one, at the end. */
  questions?: '0' | '1'
}

/** Bounds tuned to the Gate 1 winning specimens (VOICE-SPEC.md). */
export const FIELD_BOUNDS: Record<string, FieldBounds> = {
  readingLine: { minWords: 35, maxWords: 52, questions: '0' },
  question: { minWords: 2, maxWords: 12, questions: '1' },
  libraryEntry: { minWords: 140, maxWords: 170, questions: '0' },
  altText: { minWords: 8, maxWords: 22, questions: '0' },
}

export interface LintOptions {
  barnum: RegExp[]
  /** Vocabulary/shape rules only — for UI strings and templates, where
   *  card-field bounds don't apply. */
  vocabOnly?: boolean
}

export function lintField(cardId: string, field: string, text: string, opts: LintOptions): Violation[] {
  const out: Violation[] = []
  if (!text.trim()) return out
  const scan = stripExemptions(text)

  const push = (rule: string, severity: Severity, message: string) =>
    out.push({ cardId, field, rule, severity, message })

  for (const [re, label] of BANNED_VOCAB) {
    const m = scan.match(re)
    if (m) push('banned-vocab', 'error', `${label} — “…${context(scan, m.index ?? 0)}…”`)
  }
  for (const [re, label] of ADVICE_VERBS) {
    const m = scan.match(re)
    if (m) push('advice-verb', 'error', `${label} — “…${context(scan, m.index ?? 0)}…”`)
  }
  for (const [re, label] of GUIDANCE_NET) {
    const m = scan.match(re)
    if (m) push('guidance', 'warn', `${label} — “…${context(scan, m.index ?? 0)}…”`)
  }
  for (const re of opts.barnum) {
    const m = scan.match(re)
    if (m) push('barnum', 'error', `Barnum shape /${re.source}/ — “…${context(scan, m.index ?? 0)}…”`)
  }
  for (const [re, label] of FIRST_PERSON) {
    const m = scan.match(re)
    if (m) push('first-person', 'error', `${label} — “…${context(scan, m.index ?? 0)}…”`)
  }

  if (opts.vocabOnly) return out

  // "reversedReadingLines[1]" → base field "readingLine"
  const base = field
    .replace(/\[\d+\]$/, '')
    .replace(/^reversed/, '')
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/^(readingLine|question)s$/, '$1')
  const bounds = FIELD_BOUNDS[base]
  const qCount = (text.match(/\?/g) ?? []).length

  if (/[:;]/.test(text))
    push('punctuation', 'error', 'colon or semicolon. The voice uses periods and commas (VOICE-SPEC)')
  if (/[—–]|\s--?\s/.test(text))
    push('punctuation', 'error', 'em/en dash. Banned by author rule, restructure with periods or commas (VOICE-SPEC)')

  if (bounds?.questions === '0' && qCount > 0)
    push('question-marks', 'error', `${qCount} question mark(s); this field carries none — the question field carries the question`)
  if (bounds?.questions === '1') {
    if (qCount !== 1) push('question-marks', 'error', `exactly one question mark expected, found ${qCount}`)
    else if (!text.trim().endsWith('?')) push('question-marks', 'error', 'the question mark belongs at the end')
  }

  const words = countWords(text)
  if (bounds?.minWords && words < bounds.minWords)
    push('word-count', 'warn', `${words} words; target ${bounds.minWords}–${bounds.maxWords}`)
  if (bounds?.maxWords && words > bounds.maxWords)
    push('word-count', 'warn', `${words} words; target ${bounds.minWords}–${bounds.maxWords}`)

  if (base === 'readingLine' || base === 'libraryEntry') {
    if (!/\byou(?:r(?:s|self)?)?\b|\byou'/i.test(text))
      push('second-person', 'warn', 'no second person — the reader is "you"')
    const lens = splitSentences(text).map(countWords)
    if (lens.length >= 3 && lens.every((n) => n >= 12 && n <= 18))
      push('rhythm', 'warn', 'every sentence is 12–18 words — the templated-rhythm tell; vary one')
    const grade = fleschKincaidGrade(text)
    if (grade > 10) push('reading-level', 'warn', `reads at grade ${grade.toFixed(1)}; target ~7–9`)
  }

  return out
}

function context(text: string, index: number): string {
  return text.slice(Math.max(0, index - 18), index + 24).replace(/\s+/g, ' ').trim()
}

/* ------------------------------------------------------------ sameness */

export function trigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const grams = new Set<string>()
  for (let i = 0; i + 2 < words.length; i++) grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  return grams
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const g of a) if (b.has(g)) inter++
  return inter / (a.size + b.size - inter)
}

export const STOPWORDS = new Set(
  `a an and are as at be been but by do does for from had has have if in into is it its of on or so than that the their them then there these they this to was were what when where which who with you your yours you're don't doesn't isn't it's what's there's not no nor can could would may might one once`.split(
    ' ',
  ),
)

export function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z' ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

/** Opening-move classification. Heuristic — the dashboard shows it as a
 *  guess, not a verdict; VOICE.md §7 owns the real definitions. */
export type OpeningMove = 'image-first' | 'observation-first' | 'contrast' | 'direct-address'

export function classifyOpening(text: string): OpeningMove {
  const first = splitSentences(text)[0] ?? ''
  const words = countWords(first)
  if (/^you\b|^you'/i.test(first.trim()) || /\byou\b/i.test(first.split(' ').slice(0, 3).join(' ')))
    return 'direct-address'
  if (words <= 5) return 'contrast'
  if (/\b(?:is|are|has|have|gets|turns|counts)\b/i.test(first)) return 'observation-first'
  return 'image-first'
}
