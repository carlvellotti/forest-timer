// The stats page's sums, kept apart from the screen so they can be checked on their own.
// Everything is worked out from the session records; nothing new is saved.

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Midnight at the start of the day `at` falls on, in your own time zone.
function startOfDay(at) {
  const day = new Date(at)
  day.setHours(0, 0, 0, 0)
  return day
}

function addDays(day, count) {
  const next = new Date(day)
  next.setDate(next.getDate() + count)
  return next
}

// Rule 1: this week is Monday to Sunday, in your own time zone.
function mondayOf(at) {
  const day = startOfDay(at)
  return addDays(day, -((day.getDay() + 6) % 7))
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// This week, Monday to Sunday: each day's count of finished sessions, and the week's total.
// Rule 2: a session counts on the day it finished. Rule 5: given-up sessions don't count.
// Days still to come have no count (null), so they show blank.
export function thisWeek(records, now) {
  const today = startOfDay(now)
  const monday = mondayOf(now)
  const finishedDays = records
    .filter((record) => record.ended === 'finished')
    .map((record) => startOfDay(record.endedAt))
  const days = DAY_NAMES.map((name, i) => {
    const day = addDays(monday, i)
    const isToday = sameDay(day, today)
    const toCome = day > today
    return {
      name,
      today: isToday,
      count: toCome ? null : finishedDays.filter((finished) => sameDay(finished, day)).length,
    }
  })
  const total = days.reduce((sum, day) => sum + (day.count ?? 0), 0)
  return { days, total }
}

// Rule 3: the streak is how many days in a row, up to today, you finished at least one session.
// Rule 4: today doesn't break it until it's over, so with nothing yet today it counts back from yesterday.
// Rule 5: given-up sessions don't count. Days are your own, in your time zone, by when each session finished.
export function streak(records, now) {
  const dayKey = (day) => `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
  const finishedDays = new Set(
    records.filter((record) => record.ended === 'finished').map((record) => dayKey(new Date(record.endedAt))),
  )
  let day = startOfDay(now)
  if (!finishedDays.has(dayKey(day))) day = addDays(day, -1)
  let count = 0
  while (finishedDays.has(dayKey(day))) {
    count += 1
    day = addDays(day, -1)
  }
  return count
}

// "1-day streak", "3-day streak"; at zero, the page shows the no-streak line instead
export function streakLine(count) {
  return `${count}-day streak`
}

export const NO_STREAK_LINE = 'No streak yet. Finish a session to start one.'

// "1 session this week", "9 sessions this week"
export function weekTotalLine(total) {
  return `${total} ${total === 1 ? 'session' : 'sessions'} this week`
}

// The next local midnight after `now`, when this week's days move on.
export function nextMidnight(now) {
  return addDays(startOfDay(now), 1).getTime()
}
