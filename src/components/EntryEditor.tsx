import { useEffect, useRef, useState } from 'react'
import { STR } from '../content/ui-strings'

interface Props {
  initialText: string
  onSave: (text: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}

type SaveState = 'idle' | 'dirty' | 'saved'

const SAVE_DELAY = 900

/**
 * One quiet text area. Autosaves on pause; says "Saved." and nothing more.
 */
export function EntryEditor({ initialText, onSave, placeholder, autoFocus }: Props) {
  const [text, setText] = useState(initialText)
  const [state, setState] = useState<SaveState>('idle')
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(onSave)
  latest.current = onSave

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleChange(value: string) {
    setText(value)
    setState('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void latest.current(value).then(() => setState('saved'))
    }, SAVE_DELAY)
  }

  return (
    <div className="editor">
      <label className="visually-hidden" htmlFor="entry-text">
        {STR.editor.label}
      </label>
      <textarea
        id="entry-text"
        className="editor-textarea"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? STR.editor.placeholder}
        rows={6}
        autoFocus={autoFocus}
      />
      <p className="editor-status" role="status" aria-live="polite">
        {state === 'saved' ? STR.editor.saved : state === 'dirty' ? STR.editor.typing : ' '}
      </p>
    </div>
  )
}
