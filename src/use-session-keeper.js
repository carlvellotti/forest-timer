import { useEffect, useState } from 'react'
import { saveSessionRecord } from './browser-storage'
import { finishedRecord, sessionLength, timeLeft } from './session-keeper'

const length = sessionLength({ dev: import.meta.env.DEV, search: window.location.search })

// Holds whether a session is running and how much time is left.
// Time left is worked out from the clock each tick, never by counting ticks.
// When a session finishes, it saves a session record and calls onFinished with it.
export function useSessionKeeper({ onFinished }) {
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const running = startedAt !== null

  // Tick once a second from Start, which is when the shown second changes,
  // and again when the page comes back into view.
  useEffect(() => {
    if (!running) return
    let finished = false
    const tick = () => {
      if (finished) return
      const tickedAt = Date.now()
      if (timeLeft(startedAt, tickedAt, length) > 0) {
        setNow(tickedAt)
        return
      }
      finished = true
      const record = finishedRecord(startedAt, length)
      try {
        saveSessionRecord(record)
      } catch (error) {
        // Storage full or blocked: still go back to ready rather than stick at 0:00.
        console.error('Could not save the session record', error)
      }
      setStartedAt(null)
      onFinished(record)
    }
    const interval = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running, startedAt, onFinished])

  function start() {
    const pressedAt = Date.now()
    setStartedAt(pressedAt)
    setNow(pressedAt)
  }

  return { running, timeLeft: running ? timeLeft(startedAt, now, length) : length, start }
}
