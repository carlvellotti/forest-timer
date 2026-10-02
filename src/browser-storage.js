// Session records, saved in this browser so they're still there next visit.
// A session record: { startedAt, endedAt, ended: 'finished' | 'gave up' }, times as ISO strings.

const SESSION_RECORDS_KEY = 'forest-timer:session-records'
const UNREADABLE_KEY_PREFIX = 'forest-timer:unreadable-session-records:'

function isSessionRecord(value) {
  return typeof value === 'object' && value !== null && typeof value.startedAt === 'string'
}

// What's saved, plus the saved text itself if any of it couldn't be read.
function readSaved() {
  const saved = localStorage.getItem(SESSION_RECORDS_KEY)
  if (saved === null) return { records: [], unreadable: null }
  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return { records: [], unreadable: saved }
    const records = parsed.filter(isSessionRecord)
    return { records, unreadable: records.length < parsed.length ? saved : null }
  } catch {
    return { records: [], unreadable: saved }
  }
}

export function loadSessionRecords() {
  try {
    return readSaved().records
  } catch {
    // Storage blocked: an empty forest rather than a broken page
    return []
  }
}

// Saving the same session twice does nothing.
export function saveSessionRecord(record) {
  const { records, unreadable } = readSaved()
  if (records.some((saved) => saved.startedAt === record.startedAt)) return
  // Rule 10: nothing in the app wipes the forest, so keep what we couldn't read before it's overwritten.
  if (unreadable !== null) localStorage.setItem(UNREADABLE_KEY_PREFIX + new Date().toISOString(), unreadable)
  localStorage.setItem(SESSION_RECORDS_KEY, JSON.stringify([...records, record]))
}

// The forest: one tree per finished session, newest first.
export function treesFrom(records) {
  return records
    .filter((record) => record.ended === 'finished')
    .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))
}

// While a session runs, the moment Start was pressed is saved too, so a reload can pick it back up.
const RUNNING_SESSION_KEY = 'forest-timer:running-session'
// And the last moment the page was seen open, so a close or a crash knows when the session ended.
const LAST_SEEN_KEY = 'forest-timer:running-session-last-seen'

// This tab's own note of the session it started. It survives a reload of this tab, but not a
// close, and other tabs can't see it (a duplicated tab gets a copy, which it forgets on opening),
// so only the tab that started a session can carry it on.
const THIS_TAB_SESSION_KEY = 'forest-timer:this-tab-session'

export function saveRunningSession(startedAt) {
  localStorage.setItem(RUNNING_SESSION_KEY, new Date(startedAt).toISOString())
  sessionStorage.setItem(THIS_TAB_SESSION_KEY, new Date(startedAt).toISOString())
}

export function forgetThisTabSession() {
  try {
    sessionStorage.removeItem(THIS_TAB_SESSION_KEY)
  } catch {
    // Storage blocked: nothing was saved to forget
  }
}

export function loadThisTabSession() {
  try {
    const startedAt = Date.parse(sessionStorage.getItem(THIS_TAB_SESSION_KEY))
    return Number.isFinite(startedAt) ? startedAt : null
  } catch {
    return null
  }
}

export function loadRunningSession() {
  try {
    const startedAt = Date.parse(localStorage.getItem(RUNNING_SESSION_KEY))
    return Number.isFinite(startedAt) ? startedAt : null
  } catch {
    return null
  }
}

export function saveLastSeen(at) {
  localStorage.setItem(LAST_SEEN_KEY, new Date(at).toISOString())
}

export function loadLastSeen() {
  try {
    const at = Date.parse(localStorage.getItem(LAST_SEEN_KEY))
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

export function clearRunningSession() {
  try {
    localStorage.removeItem(RUNNING_SESSION_KEY)
    localStorage.removeItem(LAST_SEEN_KEY)
    sessionStorage.removeItem(THIS_TAB_SESSION_KEY)
  } catch {
    // Storage blocked: nothing was saved to clear
  }
}
