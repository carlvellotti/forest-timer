import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { playChime, unlockChime } from './chime'

vi.mock('./chime', () => ({ playChime: vi.fn(), unlockChime: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-01T09:00:00'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('ready: 25:00 with Start under it, no Give up link, plain tab title', () => {
  render(<App />)
  expect(screen.getByRole('timer').textContent).toBe('25:00')
  expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy()
  expect(screen.queryByText('Give up')).toBeNull()
  expect(document.title).toBe('Forest Timer')
})

test('pressing Start swaps Start for Give up and counts down', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
  expect(screen.getByText('Give up')).toBeTruthy()
  act(() => vi.advanceTimersByTime(1000))
  expect(screen.getByRole('timer').textContent).toBe('24:59')
  expect(document.title).toBe('24:59 · Forest Timer')
})

test('first visit: the forest says how to grow your first tree', () => {
  render(<App />)
  expect(screen.getByText('Finish a session to grow your first tree.')).toBeTruthy()
})

test('rule 2: finishing grows one ringed tree and goes back to ready', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => vi.advanceTimersByTime(25 * 60 * 1000))
  expect(screen.getAllByRole('img', { name: /tree/i })).toHaveLength(1)
  expect(screen.getByRole('img', { name: 'Tree you just grew' })).toBeTruthy()
  expect(screen.getByRole('timer').textContent).toBe('25:00')
  expect(screen.queryByText('Finish a session to grow your first tree.')).toBeNull()
})

test('a session still goes back to ready when the record cannot be saved', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => vi.advanceTimersByTime(25 * 60 * 1000))
  expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy()
  expect(screen.getByRole('timer').textContent).toBe('25:00')
  setItem.mockRestore()
})

test('rule 3: Give up asks first; Keep going carries on; Give up ends with no tree', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  expect(screen.getByText('Give up? No tree this time.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Keep going' }))
  expect(screen.queryByText('Give up? No tree this time.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy()
  expect(screen.queryAllByRole('img', { name: /tree/i })).toHaveLength(0)
  expect(screen.getByText('Finish a session to grow your first tree.')).toBeTruthy()
})

test('rule 9: a Give up that lands after 25 minutes have passed counts as finished', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  // The clock passes 9:25 before the once-a-second tick notices
  vi.setSystemTime(new Date('2026-10-01T09:25:00.500'))
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  expect(screen.getByRole('img', { name: 'Tree you just grew' })).toBeTruthy()
  expect(JSON.parse(localStorage.getItem('forest-timer:session-records'))[0].ended).toBe('finished')
})

test('rule 2: finishing plays the chime once; giving up plays nothing', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(unlockChime).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  fireEvent.click(screen.getByRole('button', { name: 'Give up' }))
  expect(playChime).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => vi.advanceTimersByTime(25 * 60 * 1000))
  act(() => vi.advanceTimersByTime(60 * 1000))
  expect(playChime).toHaveBeenCalledTimes(1)
})

// The stats page (2026-10-02 spec)

test('rule 6: the Stats link shows when Ready, is gone while Running, and is back when the session ends', () => {
  window.history.pushState(null, '', '/')
  render(<App />)
  expect(screen.getByRole('link', { name: 'Stats' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(screen.queryByRole('link', { name: 'Stats' })).toBeNull()
  act(() => vi.advanceTimersByTime(25 * 60 * 1000))
  expect(screen.getByRole('link', { name: 'Stats' })).toBeTruthy()
})

test('Stats opens /stats with this week, and Back to forest returns to the timer and forest', () => {
  window.history.pushState(null, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('link', { name: 'Stats' }))
  expect(window.location.pathname).toBe('/stats')
  expect(screen.getByText('0 sessions this week')).toBeTruthy()
  expect(screen.queryByRole('timer')).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Back to forest' }))
  expect(window.location.pathname).toBe('/')
  expect(screen.getByRole('timer').textContent).toBe('25:00')
})

test('a finished session shows on the stats page, counted on today', () => {
  window.history.pushState(null, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => vi.advanceTimersByTime(25 * 60 * 1000))
  fireEvent.click(screen.getByRole('link', { name: 'Stats' }))
  expect(screen.getByText('1 session this week')).toBeTruthy()
  // 2026-10-01 is a Thursday
  const today = screen.getByRole('columnheader', { name: 'Thu' })
  expect(today.getAttribute('aria-current')).toBe('date')
  expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['0', '0', '0', '1', '', '', ''])
  window.history.pushState(null, '', '/')
})
