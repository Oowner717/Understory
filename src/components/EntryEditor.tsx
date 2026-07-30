import { useEffect, useRef, useState } from 'react'
import { STR } from '../content/ui-strings'

interface Props {
  initialText: string
  onSave: (text: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}

type SaveState = 'idle' | 'dirty' | 'saved'

/* Trailing debounce. Lowered from 900ms because a hard kill loses whatever is
 * inside this window and no event handler can prevent that — only a shorter
 * window can. Each write is one small record, so the extra writes cost nothing
 * at this scale. */
const SAVE_DELAY = 400

/**
 * One quiet text area. Autosaves on pause; says "Saved." and nothing more.
 *
 * The debounce is a data-loss window: anything typed inside SAVE_DELAY is gone
 * if the app dies first. Measured before the flush below existed, an entry
 * killed 300ms after typing was lost and one killed at 900ms survived. So the
 * pending write is also flushed the moment the page is backgrounded or torn
 * down. `visibilitychange` is the signal that actually fires on mobile;
 * `pagehide` covers desktop tab close and iOS Safari's page cache.
 */
export function EntryEditor({ initialText, onSave, placeholder, autoFocus }: Props) {
  const [text, setText] = useState(initialText)
  const [state, setState] = useState<SaveState>('idle')
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<string | undefined>(undefined)
  const lastWrite = useRef(0)
  const latest = useRef(onSave)
  latest.current = onSave

  function flush() {
    if (pending.current === undefined) return
    const value = pending.current
    pending.current = undefined
    lastWrite.current = Date.now()
    window.clearTimeout(timer.current)
    void latest.current(value).then(() => setState('saved'))
  }
  const flushRef = useRef(flush)
  flushRef.current = flush

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushRef.current()
    }
    const onPageHide = () => flushRef.current()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      window.clearTimeout(timer.current)
      /* Unmounting mid-edit is a navigation, not a kill, and the write still
       * has time to land. Without this, tapping away from a half-typed entry
       * loses it exactly as a kill would. */
      flushRef.current()
    }
  }, [])

  function handleChange(value: string) {
    setText(value)
    setState('dirty')
    pending.current = value

    /* Max-wait, not just a leading edge. A pure debounce restarts on every
     * keystroke, so continuous typing never writes at all and a hard kill takes
     * the lot — measured: 1.6 seconds of typing, killed, everything lost but
     * the first character. This guarantees a write at least every SAVE_DELAY
     * while typing continues, so an unrecoverable kill costs at most that much
     * text. It does not touch `state`, because "Saved." should mean the latest
     * text is saved, and mid-burst it is not. */
    const now = Date.now()
    if (now - lastWrite.current >= SAVE_DELAY) {
      lastWrite.current = now
      void latest.current(value)
    }

    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      pending.current = undefined
      lastWrite.current = Date.now()
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
