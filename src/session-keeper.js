// The session keeper's rules, kept apart from the screen so they can be checked on their own.

// Rule 1: a session is 25 minutes.
export const SESSION_LENGTH_MS = 25 * 60 * 1000

// Fast mode: in `npm run dev` only, `?fast` makes a session 25 seconds.
export const FAST_SESSION_LENGTH_MS = 25 * 1000

export function sessionLength({ dev, search }) {
  if (dev && new URLSearchParams(search).has('fast')) return FAST_SESSION_LENGTH_MS
  return SESSION_LENGTH_MS
}

// Rule 9: the clock always counts from when Start was pressed, so sleep doesn't stop it.
export function timeLeft(startedAt, now, length) {
  return Math.max(0, startedAt + length - now)
}

// Minutes and seconds, never hours: 25:00, 24:59 … 0:59 … 0:01, 0:00.
export function formatTimeLeft(ms) {
  const seconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export function tabTitle(running, ms) {
  return running ? `${formatTimeLeft(ms)} · Forest Timer` : 'Forest Timer'
}
