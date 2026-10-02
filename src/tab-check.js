// Rule 8: one tab at a time. The first tab holds a lock for as long as it's open,
// and any other tab finds it taken. The lock goes when the tab closes or reloads.
// The tab holding the lock answers when another tab asks, so a page that holds it but
// can't answer (frozen, kept for Back, or loaded unseen) doesn't lock you out.

const LOCK = 'forest-timer:this-tab'
const ANSWER_WITHIN_MS = 500

// A reload by you, or by the browser bringing back a tab it put away to save memory.
export function loadedAsReload() {
  try {
    return performance.getEntriesByType('navigation')[0]?.type === 'reload' || document.wasDiscarded === true
  } catch {
    return false
  }
}

// Answers other tabs asking whether the app is open, for as long as this tab holds the lock
function answerOtherTabs() {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const channel = new BroadcastChannel(LOCK)
  channel.onmessage = (event) => {
    if (event.data === 'anyone there?') channel.postMessage('here')
  }
  return () => channel.close()
}

// Asks whether a tab holding the lock is awake. Nobody answering means it's stuck.
function someoneAnswers() {
  if (typeof BroadcastChannel === 'undefined') return Promise.resolve(true)
  return new Promise((resolve) => {
    const channel = new BroadcastChannel(LOCK)
    const done = (answered) => {
      clearTimeout(timer)
      channel.close()
      resolve(answered)
    }
    const timer = setTimeout(() => done(false), ANSWER_WITHIN_MS)
    channel.onmessage = (event) => {
      if (event.data === 'here') done(true)
    }
    channel.postMessage('anyone there?')
  })
}

function tryLock(onLost, options = { ifAvailable: true }) {
  return new Promise((resolve) => {
    let stopAnswering = null
    navigator.locks
      .request(LOCK, options, (lock) => {
        resolve(lock !== null)
        if (!lock) return
        stopAnswering = answerOtherTabs()
        // Held until the tab closes
        return new Promise(() => {})
      })
      .catch(() => {
        // Taken over by a newer tab while this one wasn't answering
        if (stopAnswering) {
          stopAnswering()
          onLost?.()
        } else {
          resolve(true)
        }
      })
  })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// A page the browser loads unseen, guessing where you're going, waits until it's shown
function shown() {
  if (!document.prerendering) return Promise.resolve()
  return new Promise((resolve) => document.addEventListener('prerenderingchange', resolve, { once: true }))
}

// Web Locks only work on https pages and localhost. Without them, every tab runs the app.
// onLost runs if a newer tab later takes the app over from this one.
export async function claimThisTab(onLost) {
  if (!navigator.locks) return true
  await shown()
  if (await tryLock(onLost)) return true
  // Reloading this tab: the old page may not have let go yet, so keep trying for about a second
  if (loadedAsReload()) {
    for (let attempt = 0; attempt < 10; attempt++) {
      await wait(100)
      if (await tryLock(onLost)) return true
    }
  }
  if (await someoneAnswers()) return false
  return tryLock(onLost, { steal: true })
}
