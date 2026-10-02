import { useCallback, useEffect, useState } from 'react'
import { saveSessionRecord } from './browser-storage'
import { playChime, unlockChime } from './chime'
import { finishedRecord, givenUpRecord, sessionLength, timeLeft } from './session-keeper'

const length = sessionLength({ dev: import.meta.env.DEV, search: window.location.search })

// Holds whether a session is running and how much time is left.
// Time left is worked out from the clock each tick, never by counting ticks.
// When a session ends, finished or given up, it saves a session record and calls onEnded with it.
// Rule 2: a finished session also plays the chime.
export function useSessionKeeper({ onEnded }) {
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const running = startedAt !== null

  const end = useCallback(
    (record) => {
      try {
        saveSessionRecord(record)
      } catch (error) {
        // Storage full or blocked: still go back to ready rather than stick at 0:00.
        console.error('Could not save the session record', error)
      }
      if (record.ended === 'finished') playChime()
      setStartedAt(null)
      onEnded(record)
    },
    [onEnded],
  )

  // Tick once a second from Start, which is when the shown second changes,
  // and again when the page comes back into view. A background tab can slow the
  // once-a-second tick to once a minute, so one more timer is set for the exact end.
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
      end(finishedRecord(startedAt, length))
    }
    const interval = setInterval(tick, 1000)
    const endTimer = setTimeout(tick, timeLeft(startedAt, Date.now(), length))
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      clearTimeout(endTimer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running, startedAt, end])

  function start() {
    unlockChime()
    const pressedAt = Date.now()
    setStartedAt(pressedAt)
    setNow(pressedAt)
  }

  // Rule 3: giving up grows no tree, but it's recorded.
  // Rule 9: if 25 minutes have already passed since Start, the session finished first.
  function giveUp() {
    if (!running) return
    const now = Date.now()
    end(timeLeft(startedAt, now, length) > 0 ? givenUpRecord(startedAt, now) : finishedRecord(startedAt, length))
  }

  return { running, timeLeft: running ? timeLeft(startedAt, now, length) : length, start, giveUp }
}
