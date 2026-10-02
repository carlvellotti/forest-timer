import { afterEach, expect, test, vi } from 'vitest'
import { claimThisTab } from './tab-check'

// A pretend lock that's taken for the first few asks, then free
function lockTakenFor(asks) {
  let asked = 0
  return {
    request: vi.fn((name, options, callback) => {
      asked++
      const free = asked > asks
      callback(free ? { name } : null)
      return Promise.resolve()
    }),
  }
}

function loadedAs(type) {
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type }])
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('rule 8: the first tab gets the app', async () => {
  vi.stubGlobal('navigator', { locks: lockTakenFor(0) })
  expect(await claimThisTab()).toBe(true)
})

test('rule 8: another tab finds it taken, straight away', async () => {
  vi.stubGlobal('navigator', { locks: lockTakenFor(Infinity) })
  loadedAs('navigate')
  expect(await claimThisTab()).toBe(false)
  expect(navigator.locks.request).toHaveBeenCalledTimes(1)
})

test('a reload that beats the old page letting go keeps trying, and gets the app', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('navigator', { locks: lockTakenFor(3) })
  loadedAs('reload')
  const claimed = claimThisTab()
  await vi.advanceTimersByTimeAsync(1000)
  expect(await claimed).toBe(true)
})

test('a reload while another tab really has it gives up after about a second', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('navigator', { locks: lockTakenFor(Infinity) })
  loadedAs('reload')
  const claimed = claimThisTab()
  await vi.advanceTimersByTimeAsync(1100)
  expect(await claimed).toBe(false)
})

test('without Web Locks (plain http on another device), every tab runs the app', async () => {
  vi.stubGlobal('navigator', {})
  expect(await claimThisTab()).toBe(true)
})
