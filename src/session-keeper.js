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
// It never shows more than a whole session, even if the clock was moved back after Start.
export function timeLeft(startedAt, now, length) {
  return Math.min(length, Math.max(0, startedAt + length - now))
}

// Minutes and seconds, never hours: 25:00, 24:59 … 0:59 … 0:01, 0:00.
export function formatTimeLeft(ms) {
  const seconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

// Rule 9: a finished session ended 25 minutes after Start, even if the laptop slept past it.
export function finishedRecord(startedAt, length) {
  return {
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(startedAt + length).toISOString(),
    ended: 'finished',
  }
}

export function givenUpRecord(startedAt, endedAt) {
  return {
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    ended: 'gave up',
  }
}

// A session was running when the page opened (docs/adr/0001):
// a reload before the 25 minutes are up carries on; a reload after counts as finished.
// Opening fresh after a close or a crash is handled separately.
// A start time in the future (the clock was moved back) can't be a real session.
export function sessionOnOpening({ startedAt, reloaded, now, length }) {
  if (startedAt === null) return null
  if (startedAt > now) return { kind: 'not possible', startedAt }
  if (!reloaded) return { kind: 'opened fresh', startedAt }
  if (timeLeft(startedAt, now, length) > 0) return { kind: 'carries on', startedAt }
  return { kind: 'finished', record: finishedRecord(startedAt, length) }
}

export function tabTitle(running, ms) {
  return running ? `${formatTimeLeft(ms)} · Forest Timer` : 'Forest Timer'
}
