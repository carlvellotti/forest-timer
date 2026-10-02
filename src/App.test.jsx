import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'

beforeEach(() => {
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
