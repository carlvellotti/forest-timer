import { expect, test } from 'vitest'
import {
  FAST_SESSION_LENGTH_MS,
  SESSION_LENGTH_MS,
  finishedRecord,
  givenUpRecord,
  formatTimeLeft,
  sessionLength,
  sessionOnOpening,
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

test('opening with no session running: nothing to do', () => {
  expect(sessionOnOpening({ startedAt: null, reloaded: true, now: nine, length: SESSION_LENGTH_MS })).toBeNull()
})

test('rule 4: a reload at 9:10 carries on the session started at 9:00', () => {
  expect(
    sessionOnOpening({ startedAt: nine, reloaded: true, now: nine + minutes(10), length: SESSION_LENGTH_MS }),
  ).toEqual({ kind: 'carries on', startedAt: nine })
})

test('rule 5: a reload at 9:40 counts as finished, ended 9:25', () => {
  expect(
    sessionOnOpening({ startedAt: nine, reloaded: true, now: nine + minutes(40), length: SESSION_LENGTH_MS }),
  ).toEqual({ kind: 'finished', record: finishedRecord(nine, SESSION_LENGTH_MS) })
})

test('opening fresh (not a reload) with a session running is left for the close rule', () => {
  expect(
    sessionOnOpening({ startedAt: nine, reloaded: false, now: nine + minutes(10), length: SESSION_LENGTH_MS }),
  ).toEqual({ kind: 'opened fresh', startedAt: nine })
})

test('rule 5: a reload exactly at 9:25 counts as finished', () => {
  expect(
    sessionOnOpening({ startedAt: nine, reloaded: true, now: nine + minutes(25), length: SESSION_LENGTH_MS }).kind,
  ).toBe('finished')
})

test('a saved start time in the future (the clock moved back) is not a real session', () => {
  expect(
    sessionOnOpening({ startedAt: nine + minutes(60), reloaded: true, now: nine, length: SESSION_LENGTH_MS }).kind,
  ).toBe('not possible')
})

test('time left never shows more than a whole session', () => {
  expect(formatTimeLeft(timeLeft(nine + minutes(60), nine, SESSION_LENGTH_MS))).toBe('25:00')
})
