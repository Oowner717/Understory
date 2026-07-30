/*
 * voice-lint — npm run lint:voice [-- --all]
 *
 * Enforces the mechanical rules in VOICE.md across:
 *   - src/content/meanings.json   (placeholder-status entries skipped unless --all,
 *                                  so the signal stays clean during the campaign)
 *   - src/content/drafts/*.json   (always, every variant — drafts must arrive clean)
 *   - src/content/templates.json  (vocabulary + Barnum shapes)
 *   - src/content/ui-strings.ts   (vocabulary + Barnum shapes, raw scan)
 *
 * Exits non-zero on error-severity violations. If a rule false-positives
 * more than occasionally, loosen it in VOICE.md / lint-core rather than
 * learning to ignore it.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseBarnumPatterns, lintField, type Violation } from './lib/lint-core.ts'

const ALL = process.argv.includes('--all')
const root = new URL('..', import.meta.url).pathname

const voice = readFileSync(join(root, 'VOICE.md'), 'utf8')
const barnum = parseBarnumPatterns(voice)
if (barnum.length === 0) {
  console.error('no barnum-patterns block found in VOICE.md — the linter is running blind')
  process.exit(2)
}

interface Located extends Violation {
  file: string
}
const violations: Located[] = []
let skippedPlaceholders = 0

/* meanings.json */
const meaningsPath = join(root, 'src/content/meanings.json')
const { meanings } = JSON.parse(readFileSync(meaningsPath, 'utf8'))
for (const m of meanings) {
  if (m.status === 'placeholder' && !ALL) {
    skippedPlaceholders++
    continue
  }
  const fields: [string, string][] = [
    ...(m.readingLines ?? []).map((t: string, i: number) => [`readingLines[${i}]`, t] as [string, string]),
    ...(m.questions ?? []).map((t: string, i: number) => [`questions[${i}]`, t] as [string, string]),
    ['libraryEntry', m.libraryEntry],
    ['altText', m.altText],
    ...(m.reversed?.readingLines ?? []).map((t: string, i: number) => [`reversedReadingLines[${i}]`, t] as [string, string]),
    ...(m.reversed?.questions ?? []).map((t: string, i: number) => [`reversedQuestions[${i}]`, t] as [string, string]),
    ['reversedLibraryEntry', m.reversed?.libraryEntry ?? ''],
    ...(['situation', 'knot', 'direction'] as const)
      .map((pos) => [`spreadLine.${pos}`, m.spread?.[pos] ?? ''] as [string, string])
      .filter(([, t]) => t !== ''),
  ]
  for (const [field, text] of fields)
    for (const v of lintField(m.cardId, field, text, { barnum }))
      violations.push({ ...v, file: 'meanings.json' })
}

/* drafts */
const draftsDir = join(root, 'src/content/drafts')
if (existsSync(draftsDir)) {
  for (const f of readdirSync(draftsDir).filter((f) => f.endsWith('.json'))) {
    const draft = JSON.parse(readFileSync(join(draftsDir, f), 'utf8'))
    for (const [field, variants] of Object.entries(draft.fields ?? {})) {
      for (const [i, variant] of (variants as (string | string[])[]).entries()) {
        const isList = Array.isArray(variant)
        const text = isList ? variant.join(', ') : variant
        for (const v of lintField(draft.cardId, `${field}[${i}]`, text, { barnum, vocabOnly: isList }))
          violations.push({ ...v, file: `drafts/${f}` })
      }
    }
  }
}

/* templates.json — vocabulary and shape only */
const templates = JSON.parse(readFileSync(join(root, 'src/content/templates.json'), 'utf8'))
for (const [group, list] of Object.entries(templates)) {
  if (group === '_note') continue
  for (const [i, tpl] of (list as string[]).entries())
    for (const v of lintField(`templates.${group}[${i}]`, group, tpl, { barnum, vocabOnly: true }))
      violations.push({ ...v, file: 'templates.json' })
}

/* ui-strings.ts — raw scan, vocabulary and shape only */
const ui = readFileSync(join(root, 'src/content/ui-strings.ts'), 'utf8')
for (const v of lintField('ui-strings', 'raw', ui, { barnum, vocabOnly: true }))
  violations.push({ ...v, file: 'ui-strings.ts' })

/* report */
const errors = violations.filter((v) => v.severity === 'error')
const warns = violations.filter((v) => v.severity === 'warn')

for (const v of violations.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)))
  console.log(`${v.severity === 'error' ? '✗' : '△'} ${v.file} · ${v.cardId} · ${v.field} · ${v.rule}: ${v.message}`)

console.log('')
console.log(`voice-lint: ${errors.length} error(s), ${warns.length} warning(s)`)
if (skippedPlaceholders > 0)
  console.log(`(${skippedPlaceholders} placeholder-status entries skipped — run with --all to include them)`)
process.exit(errors.length > 0 ? 1 : 0)
