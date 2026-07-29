import { useMemo, useState } from 'react'
import voiceMd from '../../VOICE.md?raw'
import {
  parseBarnumPatterns,
  lintField,
  countWords,
  trigrams,
  jaccard,
  type Violation,
} from '../../tools/lib/lint-core.ts'
import { CARDS, MEANINGS, cardById } from '../engine/content'
import type { Meaning, MeaningStatus } from '../engine/types'

/*
 * The writing dashboard (dev-only route: #/writing; excluded from the
 * production build via the conditional lazy import in App.tsx).
 *
 * Edits live in this table only — copy a row (or the whole file) as JSON
 * and paste it into src/content/meanings.json. Batch review happens here:
 * mark accept / edit / recast per the work order.
 */

type SortKey = 'deck' | 'lint' | 'sameness' | 'status'

const STATUSES: MeaningStatus[] = ['placeholder', 'drafted', 'authored', 'final']

export default function Writing() {
  const barnum = useMemo(() => parseBarnumPatterns(voiceMd), [])
  const [rows, setRows] = useState<Meaning[]>(() =>
    MEANINGS.map((m) => ({
      ...m,
      readingLines: [...m.readingLines],
      questions: [...m.questions],
      reversed: {
        ...m.reversed,
        readingLines: [...m.reversed.readingLines],
        questions: [...m.reversed.questions],
      },
    })),
  )
  const [sort, setSort] = useState<SortKey>('deck')
  const [copied, setCopied] = useState('')

  const lintByCard = useMemo(() => {
    const map = new Map<string, Violation[]>()
    for (const m of rows) {
      const all: Violation[] = []
      m.readingLines.forEach((t, i) => all.push(...lintField(m.cardId, `readingLines[${i}]`, t, { barnum })))
      m.questions.forEach((t, i) => all.push(...lintField(m.cardId, `questions[${i}]`, t, { barnum })))
      all.push(...lintField(m.cardId, 'libraryEntry', m.libraryEntry, { barnum }))
      all.push(...lintField(m.cardId, 'altText', m.altText, { barnum }))
      m.reversed.readingLines.forEach((t, i) =>
        all.push(...lintField(m.cardId, `reversedReadingLines[${i}]`, t, { barnum })),
      )
      m.reversed.questions.forEach((t, i) =>
        all.push(...lintField(m.cardId, `reversedQuestions[${i}]`, t, { barnum })),
      )
      all.push(...lintField(m.cardId, 'reversedLibraryEntry', m.reversed.libraryEntry, { barnum }))
      map.set(m.cardId, all)
    }
    return map
  }, [rows, barnum])

  const samenessByCard = useMemo(() => {
    const grams = rows.map((m) => trigrams(m.libraryEntry || m.readingLines.join(' ')))
    const map = new Map<string, number>()
    rows.forEach((m, i) => {
      let s = 0
      grams.forEach((g, j) => {
        if (i !== j) s += jaccard(grams[i]!, g)
      })
      map.set(m.cardId, s / (rows.length - 1))
    })
    return map
  }, [rows])

  const sorted = useMemo(() => {
    const list = [...rows]
    if (sort === 'lint')
      list.sort((a, b) => (lintByCard.get(b.cardId)?.length ?? 0) - (lintByCard.get(a.cardId)?.length ?? 0))
    if (sort === 'sameness')
      list.sort((a, b) => (samenessByCard.get(b.cardId) ?? 0) - (samenessByCard.get(a.cardId) ?? 0))
    if (sort === 'status')
      list.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status))
    return list
  }, [rows, sort, lintByCard, samenessByCard])

  function update(cardId: string, mut: (m: Meaning) => Meaning) {
    setRows((rs) => rs.map((m) => (m.cardId === cardId ? mut(m) : m)))
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1200)
  }

  const statusCounts = STATUSES.map((s) => `${rows.filter((r) => r.status === s).length} ${s}`).join(' · ')

  function variantBlock(
    m: Meaning,
    label: string,
    lines: string[],
    setLines: (m: Meaning, next: string[]) => Meaning,
  ) {
    return (
      <div className="writing-variants">
        {lines.map((t, i) => (
          <label key={i} className="writing-field">
            <span className="writing-meta">
              {label}[{i}] · {countWords(t)}w
            </span>
            <textarea
              value={t}
              rows={label.includes('uestion') ? 1 : 2}
              onChange={(e) =>
                update(m.cardId, (mm) =>
                  setLines(
                    mm,
                    lines.map((x, j) => (j === i ? e.target.value : x)),
                  ),
                )
              }
            />
          </label>
        ))}
      </div>
    )
  }

  return (
    <article className="view view-writing">
      <header className="view-head">
        <h1 className="view-title">Writing</h1>
        <p className="view-sub">
          Dev-only. Edits stay on this screen — copy JSON out and paste into meanings.json.
          {' '}{statusCounts}
        </p>
        <p className="writing-toolbar">
          {(['deck', 'lint', 'sameness', 'status'] as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`button button--small${sort === k ? ' is-active' : ''}`}
              onClick={() => setSort(k)}
            >
              sort: {k}
            </button>
          ))}
          <button
            type="button"
            className="button button--small"
            onClick={() =>
              void copy(
                JSON.stringify({ _note: 'paste into meanings.json — keep the file _note', meanings: rows }, null, 2),
                'all',
              )
            }
          >
            {copied === 'all' ? 'Copied' : 'Copy all as JSON'}
          </button>
        </p>
      </header>

      <div className="writing-table">
        {sorted.map((m) => {
          const card = cardById(m.cardId) ?? CARDS[0]!
          const lint = lintByCard.get(m.cardId) ?? []
          const errors = lint.filter((v) => v.severity === 'error')
          return (
            <section key={m.cardId} className="writing-row" aria-label={card.name}>
              <div className="writing-row-head">
                <strong>{card.name}</strong>
                <span className="writing-meta">{m.cardId}</span>
                <select
                  value={m.status}
                  onChange={(e) => update(m.cardId, (mm) => ({ ...mm, status: e.target.value as MeaningStatus }))}
                  aria-label={`Status for ${card.name}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span className={`writing-meta${errors.length ? ' is-bad' : ''}`}>
                  {errors.length} err / {lint.length - errors.length} warn
                </span>
                <span className="writing-meta">
                  sameness {(100 * (samenessByCard.get(m.cardId) ?? 0)).toFixed(2)}%
                </span>
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => void copy(JSON.stringify(m, null, 2), m.cardId)}
                >
                  {copied === m.cardId ? 'Copied' : 'Copy JSON'}
                </button>
              </div>

              <div className="writing-fields">
                <div>
                  {variantBlock(m, 'readingLines', m.readingLines, (mm, next) => ({ ...mm, readingLines: next }))}
                  {variantBlock(m, 'questions', m.questions, (mm, next) => ({ ...mm, questions: next }))}
                  <label className="writing-field">
                    <span className="writing-meta">libraryEntry · {countWords(m.libraryEntry)}w</span>
                    <textarea
                      value={m.libraryEntry}
                      rows={5}
                      onChange={(e) => update(m.cardId, (mm) => ({ ...mm, libraryEntry: e.target.value }))}
                    />
                  </label>
                  <label className="writing-field">
                    <span className="writing-meta">altText · {countWords(m.altText)}w</span>
                    <textarea
                      value={m.altText}
                      rows={1}
                      onChange={(e) => update(m.cardId, (mm) => ({ ...mm, altText: e.target.value }))}
                    />
                  </label>
                </div>
                <div>
                  {variantBlock(m, 'revReadingLines', m.reversed.readingLines, (mm, next) => ({
                    ...mm,
                    reversed: { ...mm.reversed, readingLines: next },
                  }))}
                  {variantBlock(m, 'revQuestions', m.reversed.questions, (mm, next) => ({
                    ...mm,
                    reversed: { ...mm.reversed, questions: next },
                  }))}
                  <label className="writing-field">
                    <span className="writing-meta">revLibraryEntry · {countWords(m.reversed.libraryEntry)}w</span>
                    <textarea
                      value={m.reversed.libraryEntry}
                      rows={5}
                      onChange={(e) =>
                        update(m.cardId, (mm) => ({
                          ...mm,
                          reversed: { ...mm.reversed, libraryEntry: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              {lint.length > 0 && (
                <ul className="writing-lint">
                  {lint.map((v, i) => (
                    <li key={i} className={v.severity === 'error' ? 'is-bad' : undefined}>
                      {v.severity === 'error' ? '✗' : '△'} {v.field} · {v.rule}: {v.message}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </article>
  )
}
