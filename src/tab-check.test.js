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

// A pretend tab holding the lock, awake (answers when asked) or stuck (never answers)
function holderThat({ answers }) {
  const channels = []
  vi.stubGlobal(
    'BroadcastChannel',
    class {
      constructor() {
        channels.push(this)
      }
      postMessage(message) {
        if (message === 'anyone there?' && answers) queueMicrotask(() => this.onmessage?.({ data: 'here' }))
      }
      close() {}
    },
  )
}

// A pretend lock taken by another page; a steal always gets it
function lockTakenUnlessStolen() {
  return {
    request: vi.fn((name, options, callback) => {
      callback(options.steal ? { name } : null)
      return Promise.resolve()
    }),
  }
}

test('rule 8: a tab that has it and answers keeps it; this one shows the line', async () => {
  vi.stubGlobal('navigator', { locks: lockTakenUnlessStolen() })
  holderThat({ answers: true })
  loadedAs('navigate')
  expect(await claimThisTab()).toBe(false)
  expect(navigator.locks.request).toHaveBeenCalledTimes(1)
})

test('rule 8: a page that has it but doesn\'t answer within half a second is stuck; this tab takes the app over', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('navigator', { locks: lockTakenUnlessStolen() })
  holderThat({ answers: false })
  loadedAs('navigate')
  const claimed = claimThisTab()
  await vi.advanceTimersByTimeAsync(500)
  expect(await claimed).toBe(true)
  expect(navigator.locks.request).toHaveBeenLastCalledWith('forest-timer:this-tab', { steal: true }, expect.any(Function))
})

test('a tab whose app is taken over steps aside', async () => {
  let takeOver
  vi.stubGlobal('navigator', {
    locks: {
      request: (name, options, callback) => {
        callback({ name })
        return new Promise((resolve, reject) => (takeOver = () => reject(new DOMException('', 'AbortError'))))
      },
    },
  })
  holderThat({ answers: false })
  const stepAside = vi.fn()
  expect(await claimThisTab(stepAside)).toBe(true)
  expect(stepAside).not.toHaveBeenCalled()
  takeOver()
  await Promise.resolve()
  expect(stepAside).toHaveBeenCalledTimes(1)
})

test('a page the browser loads unseen, guessing where you\'re going, only claims the app once it\'s shown', async () => {
  vi.stubGlobal('navigator', { locks: lockTakenFor(0) })
  Object.defineProperty(document, 'prerendering', { value: true, configurable: true })
  const claimed = claimThisTab()
  await Promise.resolve()
  expect(navigator.locks.request).not.toHaveBeenCalled()
  Object.defineProperty(document, 'prerendering', { value: false, configurable: true })
  document.dispatchEvent(new Event('prerenderingchange'))
  expect(await claimed).toBe(true)
  delete document.prerendering
})
