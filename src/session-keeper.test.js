import { expect, test } from 'vitest'
import {
  FAST_SESSION_LENGTH_MS,
  SESSION_LENGTH_MS,
  finishedRecord,
  givenUpRecord,
  formatTimeLeft,
  sessionLength,
  tabTitle,
  timeLeft,
} from './session-keeper'

const minutes = (n) => n * 60 * 1000
const nine = new Date('2026-10-01T09:00:00').getTime()

test('a session is 25 minutes', () => {
  expect(SESSION_LENGTH_MS).toBe(minutes(25))
})

test('shows minutes and seconds, never hours', () => {
  expect(formatTimeLeft(minutes(25))).toBe('25:00')
  expect(formatTimeLeft(minutes(25) - 1000)).toBe('24:59')
  expect(formatTimeLeft(59_000)).toBe('0:59')
  expect(formatTimeLeft(1000)).toBe('0:01')
  expect(formatTimeLeft(0)).toBe('0:00')
})

test('rule 9: the clock counts from Start, so a sleep from 9:10 to 9:15 leaves 10:00', () => {
  expect(formatTimeLeft(timeLeft(nine, nine + minutes(15), SESSION_LENGTH_MS))).toBe('10:00')
})

test('time left never goes below 0:00', () => {
  expect(timeLeft(nine, nine + minutes(40), SESSION_LENGTH_MS)).toBe(0)
})

test('the tab title shows the time left only while running', () => {
  expect(tabTitle(true, minutes(12) + 34_000)).toBe('12:34 · Forest Timer')
  expect(tabTitle(false, minutes(25))).toBe('Forest Timer')
})

test('fast mode: ?fast makes a session 25 seconds, but only in dev', () => {
  expect(sessionLength({ dev: true, search: '?fast' })).toBe(FAST_SESSION_LENGTH_MS)
  expect(sessionLength({ dev: true, search: '' })).toBe(SESSION_LENGTH_MS)
  expect(sessionLength({ dev: false, search: '?fast' })).toBe(SESSION_LENGTH_MS)
})

test('rule 9: a finished session record ends 25 minutes after Start, however late it was noticed', () => {
  expect(finishedRecord(nine, SESSION_LENGTH_MS)).toEqual({
    startedAt: new Date(nine).toISOString(),
    endedAt: new Date(nine + minutes(25)).toISOString(),
    ended: 'finished',
  })
})

test('rule 3: a given-up session record ends when you gave up', () => {
  expect(givenUpRecord(nine, nine + minutes(12))).toEqual({
    startedAt: new Date(nine).toISOString(),
    endedAt: new Date(nine + minutes(12)).toISOString(),
    ended: 'gave up',
  })
})
