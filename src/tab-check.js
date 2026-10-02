// Rule 8: one tab at a time. The first tab holds a lock for as long as it's open,
// and any other tab finds it taken. The lock goes when the tab closes or reloads.

// A reload by you, or by the browser bringing back a tab it put away to save memory.
export function loadedAsReload() {
  try {
    return performance.getEntriesByType('navigation')[0]?.type === 'reload' || document.wasDiscarded === true
  } catch {
    return false
  }
}

function tryLock() {
  return new Promise((resolve) => {
    navigator.locks
      .request('forest-timer:this-tab', { ifAvailable: true }, (lock) => {
        resolve(lock !== null)
        // Held until the tab closes
        if (lock) return new Promise(() => {})
      })
      .catch(() => resolve(true))
  })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Web Locks only work on https pages and localhost. Without them, every tab runs the app.
export async function claimThisTab() {
  if (!navigator.locks) return true
  if (await tryLock()) return true
  // Reloading this tab: the old page may not have let go yet, so keep trying for about a second
  if (!loadedAsReload()) return false
  for (let attempt = 0; attempt < 10; attempt++) {
    await wait(100)
    if (await tryLock()) return true
  }
  return false
}
