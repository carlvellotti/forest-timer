import { expect, test } from 'vitest'
import { nextMidnight, streak, streakLine, thisWeek, weekTotalLine } from './stats'

// Local times, so these read the same in any time zone. 2026-09-28 is a Monday.
const at = (day, hour, minute = 0) => new Date(2026, 8, day, hour, minute)

function record(startedAt, endedAt, ended = 'finished') {
  return { startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), ended }
}

// A finished 25-minute session starting at the given local time
const finishedAt = (day, hour) => record(at(day, hour), at(day, hour, 25))

const counts = (week) => week.days.map((day) => day.count)

test('rule 1: on Wednesday, Mon to Wed have counts and Thu to Sun are blank', () => {
  const week = thisWeek([finishedAt(28, 9), finishedAt(30, 9)], at(30, 12))
  expect(week.days.map((day) => day.name)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  expect(counts(week)).toEqual([1, 0, 1, null, null, null, null])
  expect(week.days.map((day) => day.today)).toEqual([false, false, true, false, false, false, false])
})

test('rule 1: on Monday the week starts fresh at zero', () => {
  const lastWeek = [finishedAt(26, 9), finishedAt(27, 9)]
  const week = thisWeek(lastWeek, new Date(2026, 9, 5, 9))
  expect(counts(week)).toEqual([0, null, null, null, null, null, null])
  expect(week.total).toBe(0)
})

test('rule 2: 11:50pm Tuesday to 12:15am Wednesday counts on Wednesday', () => {
  const week = thisWeek([record(at(29, 23, 50), at(30, 0, 15))], at(30, 12))
  expect(counts(week).slice(0, 3)).toEqual([0, 0, 1])
})

test('rule 2: 11:50pm Sunday to 12:15am Monday counts in the new week', () => {
  const lateSunday = record(at(27, 23, 50), at(28, 0, 15))
  expect(counts(thisWeek([lateSunday], at(28, 9)))[0]).toBe(1)
  // And not in the week before
  expect(thisWeek([lateSunday], at(27, 23, 59)).total).toBe(0)
})

test('rule 5: Monday with 2 finished and 1 given up shows 2', () => {
  const monday = [finishedAt(28, 9), finishedAt(28, 10), record(at(28, 11), at(28, 11, 12), 'gave up')]
  expect(counts(thisWeek(monday, at(28, 12)))[0]).toBe(2)
})

test('Mon 4, Tue 3, Wed 2, Thu 0 (today) is 9 sessions this week', () => {
  const records = [
    ...[8, 9, 10, 11].map((hour) => finishedAt(28, hour)),
    ...[8, 9, 10].map((hour) => finishedAt(29, hour)),
    ...[8, 9].map((hour) => finishedAt(30, hour)),
  ]
  const week = thisWeek(records, new Date(2026, 9, 1, 9))
  expect(counts(week)).toEqual([4, 3, 2, 0, null, null, null])
  expect(week.total).toBe(9)
  expect(weekTotalLine(week.total)).toBe('9 sessions this week')
})

test('one session reads "1 session this week", none reads "0 sessions this week" with zeros up to today', () => {
  expect(weekTotalLine(1)).toBe('1 session this week')
  const empty = thisWeek([], at(30, 12))
  expect(weekTotalLine(empty.total)).toBe('0 sessions this week')
  expect(counts(empty)).toEqual([0, 0, 0, null, null, null, null])
})

test('a Sunday is the last day of its week', () => {
  const week = thisWeek([finishedAt(28, 9)], new Date(2026, 9, 4, 20))
  expect(counts(week)).toEqual([1, 0, 0, 0, 0, 0, 0])
  expect(week.days[6].today).toBe(true)
})

test('the next midnight is the start of tomorrow', () => {
  expect(nextMidnight(at(27, 23, 59))).toBe(at(28, 0).getTime())
})

// The streak. 2026-09-28 is a Monday, so 1 October is Thursday and 2 October is Friday.
const october = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute)
const monToWed = [finishedAt(28, 9), finishedAt(29, 9), finishedAt(30, 9)]

test('rule 3: finished Mon, Tue, Wed; on Wednesday it reads "3-day streak"', () => {
  expect(streak(monToWed, at(30, 20))).toBe(3)
  expect(streakLine(3)).toBe('3-day streak')
})

test('rule 4: Thursday 9am with nothing yet, still 3; finish one Thursday, 4; skip Thursday, and Friday is 0', () => {
  expect(streak(monToWed, october(1, 9))).toBe(3)
  const thursday = record(october(1, 9), october(1, 9, 25))
  expect(streak([...monToWed, thursday], october(1, 9, 30))).toBe(4)
  expect(streak(monToWed, october(2, 9))).toBe(0)
})

test('one day reads "1-day streak"', () => {
  expect(streak([finishedAt(30, 9)], at(30, 12))).toBe(1)
  expect(streakLine(1)).toBe('1-day streak')
})

test('a streak runs back past Monday into last week', () => {
  const sinceFriday = [25, 26, 27, 28, 29].map((day) => finishedAt(day, 9))
  expect(streak(sinceFriday, at(29, 12))).toBe(5)
})

test('Mon and Tue finished, Wednesday only given up: on Thursday the streak is 0', () => {
  const gaveUpWednesday = record(at(30, 9), at(30, 9, 10), 'gave up')
  expect(streak([finishedAt(28, 9), finishedAt(29, 9), gaveUpWednesday], october(1, 9))).toBe(0)
})

test('a session from 11:50pm to 12:15am counts on the day it finished, for the streak too', () => {
  const lateTuesday = record(at(29, 23, 50), at(30, 0, 15))
  expect(streak([finishedAt(28, 9), lateTuesday], at(30, 12))).toBe(1)
})

test('no sessions at all: no streak', () => {
  expect(streak([], at(30, 12))).toBe(0)
})
