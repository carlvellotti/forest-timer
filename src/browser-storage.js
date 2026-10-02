// Session records, saved in this browser so they're still there next visit.
// A session record: { startedAt, endedAt, ended: 'finished' | 'gave up' }, times as ISO strings.

const SESSION_RECORDS_KEY = 'forest-timer:session-records'
const UNREADABLE_KEY = 'forest-timer:unreadable-session-records'

function isSessionRecord(value) {
  return typeof value === 'object' && value !== null && typeof value.startedAt === 'string'
}

export function loadSessionRecords() {
  let saved = null
  try {
    saved = localStorage.getItem(SESSION_RECORDS_KEY)
    if (saved === null) return []
    const records = JSON.parse(saved)
    if (Array.isArray(records)) return records.filter(isSessionRecord)
    keepUnreadable(saved)
  } catch {
    if (saved !== null) keepUnreadable(saved)
  }
  return []
}

// Rule 10: nothing in the app wipes the forest, so keep what we couldn't read before it's overwritten.
function keepUnreadable(saved) {
  try {
    localStorage.setItem(UNREADABLE_KEY, saved)
  } catch {
    // Storage blocked or full: nothing more we can do
  }
}

// Saving the same session twice does nothing.
export function saveSessionRecord(record) {
  const records = loadSessionRecords()
  if (records.some((saved) => saved.startedAt === record.startedAt)) return
  localStorage.setItem(SESSION_RECORDS_KEY, JSON.stringify([...records, record]))
}

// The forest: one tree per finished session, newest first.
export function treesFrom(records) {
  return records.filter((record) => record.ended === 'finished').reverse()
}
