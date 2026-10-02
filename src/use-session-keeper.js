import { useCallback, useEffect, useState } from 'react'
import { clearRunningSession, loadRunningSession, saveRunningSession, saveSessionRecord } from './browser-storage'
import { playChime, unlockChime } from './chime'
import { finishedRecord, givenUpRecord, sessionLength, sessionOnOpening, timeLeft } from './session-keeper'

const length = sessionLength({ dev: import.meta.env.DEV, search: window.location.search })

// A reload by you, or by the browser bringing back a tab it put away to save memory.
function wasReloaded() {
  try {
    return performance.getEntriesByType('navigation')[0]?.type === 'reload' || document.wasDiscarded === true
  } catch {
    return false
  }
}

// Worked out once per page load: was a session running when the page opened, and what happens to it?
let opening
function openingSession() {
  if (opening === undefined) {
    opening = sessionOnOpening({ startedAt: loadRunningSession(), reloaded: wasReloaded(), now: Date.now(), length })
    // Rule 5: a reload after the 25 minutes counts as finished, saved right away. No chime, because
    // browsers won't play sound after a reload until you press something; the ring is enough.
    if (opening?.kind === 'finished') {
      try {
        saveSessionRecord(opening.record)
        clearRunningSession()
      } catch (error) {
        // Kept for the next reload to try again, and no ring on a tree that wasn't saved
        console.error('Could not save the session record', error)
        opening = null
      }
    }
    // Opened fresh after a close or a crash: the session doesn't carry on, and a later reload
    // mustn't bring it back. (Recording it as a give-up comes with rule 6.)
    if (opening?.kind === 'opened fresh' || opening?.kind === 'not possible') clearRunningSession()
  }
  return opening
}

// The session that finished while the page was away, if any, so its tree can wear the ring.
export function sessionFinishedOnOpening() {
  return openingSession()?.kind === 'finished' ? openingSession().record : null
}

// Holds whether a session is running and how much time is left.
// Time left is worked out from the clock each tick, never by counting ticks.
// When a session ends, finished or given up, it saves a session record and calls onEnded with it.
// Rule 2: a finished session also plays the chime.
export function useSessionKeeper({ onEnded }) {
  const [startedAt, setStartedAt] = useState(() =>
    openingSession()?.kind === 'carries on' ? openingSession().startedAt : null,
  )
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
      clearRunningSession()
      if (record.ended === 'finished') playChime()
      setStartedAt(null)
      onEnded(record)
    },
    [onEnded],
  )

  // Tick when the shown second changes (once a second, in step with Start, even after a reload),
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
    const left = timeLeft(startedAt, Date.now(), length)
    let interval
    const firstTick = setTimeout(() => {
      tick()
      interval = setInterval(tick, 1000)
    }, left % 1000 || 1000)
    const endTimer = setTimeout(tick, left)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearTimeout(firstTick)
      clearInterval(interval)
      clearTimeout(endTimer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running, startedAt, end])

  function start() {
    unlockChime()
    const pressedAt = Date.now()
    try {
      saveRunningSession(pressedAt)
    } catch (error) {
      // Storage full or blocked: the session still runs, it just can't survive a reload
      console.error('Could not save the running session', error)
    }
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
