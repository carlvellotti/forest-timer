import { useEffect, useState } from 'react'
import { sessionLength, timeLeft } from './session-keeper'

const length = sessionLength({ dev: import.meta.env.DEV, search: window.location.search })

// Holds whether a session is running and how much time is left.
// Time left is worked out from the clock each tick, never by counting ticks.
export function useSessionKeeper() {
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const left = startedAt === null ? length : timeLeft(startedAt, now, length)
  // At 0:00 the session is over and the screen is back on ready.
  const running = startedAt !== null && left > 0

  // Tick once a second from Start, which is when the shown second changes,
  // and again when the page comes back into view.
  useEffect(() => {
    if (!running) return
    const tick = () => setNow(Date.now())
    const interval = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running])

  function start() {
    const pressedAt = Date.now()
    setStartedAt(pressedAt)
    setNow(pressedAt)
  }

  return { running, timeLeft: running ? left : length, start }
}
