import { beforeEach, expect, test, vi } from 'vitest'
import { loadSessionRecords, saveSessionRecord, treesFrom } from './browser-storage'

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

test('rule 10: unreadable storage is kept aside, not wiped, before the next save', () => {
  localStorage.setItem('forest-timer:session-records', 'not json')
  saveSessionRecord(finishedAt(9))
  expect(localStorage.getItem('forest-timer:unreadable-session-records')).toBe('not json')
  expect(loadSessionRecords()).toEqual([finishedAt(9)])
})

test('blocked storage shows an empty forest instead of breaking', () => {
  const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(loadSessionRecords()).toEqual([])
  getItem.mockRestore()
})
