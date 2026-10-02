import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'

beforeEach(() => {
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
