import { beforeEach, expect, test, vi } from 'vitest'
import {
  clearRunningSession,
  loadRunningSession,
  loadSessionRecords,
  saveRunningSession,
  saveSessionRecord,
  treesFrom,
} from './browser-storage'

beforeEach(() => localStorage.clear())

const finishedAt = (hour) => ({
  startedAt: `2026-10-01T${String(hour).padStart(2, '0')}:00:00.000Z`,
  endedAt: `2026-10-01T${String(hour).padStart(2, '0')}:25:00.000Z`,
  ended: 'finished',
})

test('first visit: no session records', () => {
  expect(loadSessionRecords()).toEqual([])
})

test('a saved session record is still there when loaded again', () => {
  saveSessionRecord(finishedAt(9))
  saveSessionRecord(finishedAt(10))
  expect(loadSessionRecords()).toEqual([finishedAt(9), finishedAt(10)])
})

test('the forest has one tree per finished session, newest first', () => {
  const gaveUp = { ...finishedAt(8), ended: 'gave up' }
  expect(treesFrom([gaveUp, finishedAt(9), finishedAt(10)])).toEqual([finishedAt(10), finishedAt(9)])
})

test('saving the same session twice keeps one record', () => {
  saveSessionRecord(finishedAt(9))
  saveSessionRecord(finishedAt(9))
  expect(loadSessionRecords()).toEqual([finishedAt(9)])
})

test('storage that is not a list of records shows an empty forest instead of breaking', () => {
  localStorage.setItem('forest-timer:session-records', '{}')
  expect(loadSessionRecords()).toEqual([])
  localStorage.setItem('forest-timer:session-records', '[1, null, "x"]')
  expect(loadSessionRecords()).toEqual([])
})

const keptAside = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith('forest-timer:unreadable-session-records:'))
    .map((key) => localStorage.getItem(key))

test('rule 10: unreadable storage is kept aside, not wiped, before the next save', () => {
  localStorage.setItem('forest-timer:session-records', 'not json')
  saveSessionRecord(finishedAt(9))
  expect(keptAside()).toEqual(['not json'])
  expect(loadSessionRecords()).toEqual([finishedAt(9)])
})

test('rule 10: a saved list with a few unreadable entries is kept aside too, and loading alone keeps nothing new', () => {
  const saved = JSON.stringify([finishedAt(8), { ended: 'finished' }])
  localStorage.setItem('forest-timer:session-records', saved)
  expect(loadSessionRecords()).toEqual([finishedAt(8)])
  expect(keptAside()).toEqual([])
  saveSessionRecord(finishedAt(9))
  expect(keptAside()).toEqual([saved])
  expect(loadSessionRecords()).toEqual([finishedAt(8), finishedAt(9)])
})

test('blocked storage shows an empty forest instead of breaking', () => {
  const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(loadSessionRecords()).toEqual([])
  getItem.mockRestore()
})

test('newest first goes by start time, even if records were saved out of order', () => {
  expect(treesFrom([finishedAt(10), finishedAt(8), finishedAt(9)])).toEqual([finishedAt(10), finishedAt(9), finishedAt(8)])
})

test('the running session\'s start time is saved, and cleared when it ends', () => {
  const nine = Date.parse('2026-10-01T09:00:00Z')
  expect(loadRunningSession()).toBeNull()
  saveRunningSession(nine)
  expect(loadRunningSession()).toBe(nine)
  clearRunningSession()
  expect(loadRunningSession()).toBeNull()
})

test('an unreadable running-session time counts as no session running', () => {
  localStorage.setItem('forest-timer:running-session', 'not a time')
  expect(loadRunningSession()).toBeNull()
})
