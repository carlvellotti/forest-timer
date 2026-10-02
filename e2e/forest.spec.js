import { expect, test } from '@playwright/test'

const nine = new Date('2026-10-01T09:00:00')
const minutes = (n) => n * 60 * 1000

async function openAtNine(page, path = '/') {
  // The test clock hides the browser's record of how the page was opened (a reload or not),
  // so pass the real one through to it. The clock covers every tab in the test, so these do too:
  // the first script runs before the clock is installed and the second after, so keep them in
  // this order. Other kinds of timing entries come back empty.
  await page.context().addInitScript(() => {
    window.realNavigationEntries = performance.getEntriesByType('navigation')
  })
  // Time only moves when a check moves it.
  await page.clock.install({ time: nine.getTime() - minutes(1) })
  await page.context().addInitScript(() => {
    const entries = window.realNavigationEntries
    performance.getEntriesByType = (type) => (type === 'navigation' ? entries : [])
  })
  await page.clock.pauseAt(nine)
  await page.goto(path)
}

test('ready: the timer reads 25:00 with Start under it, no Give up, plain tab title', async ({ page }) => {
  await openAtNine(page)
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(page.getByText('Give up')).toHaveCount(0)
  await expect(page).toHaveTitle('Forest Timer')
  // Start sits under the timer
  const timer = await page.getByRole('timer').boundingBox()
  const start = await page.getByRole('button', { name: 'Start' }).boundingBox()
  expect(start.y).toBeGreaterThan(timer.y + timer.height)
})

test('press Start: Start disappears, Give up appears, and a second later it reads 24:59', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(0)
  await expect(page.getByText('Give up')).toBeVisible()
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText('24:59')
})

test('never shows hours: it reads 0:59, then 0:01', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(24) + 1000)
  await expect(page.getByRole('timer')).toHaveText('0:59')
  await page.clock.runFor(58_000)
  await expect(page.getByRole('timer')).toHaveText('0:01')
})

test('the tab title shows the time left, like "12:34 · Forest Timer"', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(12) + 26_000)
  await expect(page).toHaveTitle('12:34 · Forest Timer')
})

test('rule 9: lid closed at 9:10, opened at 9:15, and 10:00 is left', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))
  // Asleep: the wall clock jumps to 9:15 without any timers running in between.
  await page.clock.setSystemTime(new Date('2026-10-01T09:15:00'))
  // Opening the lid brings the page back into view.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByRole('timer')).toHaveText('10:00')
})

test('fast mode: in npm run dev, ?fast makes a session 25 seconds', async ({ page }) => {
  await openAtNine(page, '/?fast')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText('0:24')
})

test('fast mode: in the built app, ?fast does nothing and a session is 25:00', async ({ page }) => {
  await openAtNine(page, 'http://localhost:4173/?fast')
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText('24:59')
})

test('first visit: "Finish a session to grow your first tree." in muted grey', async ({ page }) => {
  await openAtNine(page)
  const line = page.getByText('Finish a session to grow your first tree.')
  await expect(line).toBeVisible()
  await expect(line).toHaveCSS('color', 'rgb(111, 106, 99)')
})

test('rule 2: at 9:25 one ringed tree sits top-left, the timer reads 25:00, the first-visit line is gone', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await expect(page.getByRole('img', { name: /tree/i })).toHaveCount(1)
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(page.getByText('Finish a session to grow your first tree.')).toHaveCount(0)

  // Top-left, right under the line
  const tree = await page.getByRole('img', { name: /tree/i }).boundingBox()
  const forest = await page.getByRole('list', { name: 'Forest' }).boundingBox()
  expect(tree.x).toBe(forest.x)
  expect(tree.y).toBe(forest.y)
})

test('the ring is a 1.5px dashed orange line, 3px on and 2px off', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  const ring = page.getByRole('img', { name: 'Tree you just grew' }).locator('circle')
  await expect(ring).toHaveCSS('stroke', 'rgb(224, 122, 63)')
  await expect(ring).toHaveCSS('stroke-width', '1.5px')
  await expect(ring).toHaveCSS('stroke-dasharray', '3px, 2px')
})

test('press Start at 9:30, and the ring is gone', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(30))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Tree', exact: true })).toHaveCount(1)
})

test('refresh: the tree is still there, without the ring', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Tree', exact: true })).toHaveCount(1)
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toHaveCount(0)
})

async function sessionRecords(page) {
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('forest-timer:session-records')))
  return records.map((record) => ({
    startedAt: new Date(record.startedAt).getTime(),
    endedAt: new Date(record.endedAt).getTime(),
    ended: record.ended,
  }))
}

test('a finished session record is saved: started 9:00, ended 9:25, finished', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  expect(await sessionRecords(page)).toEqual([
    { startedAt: nine.getTime(), endedAt: nine.getTime() + minutes(25), ended: 'finished' },
  ])
})

test('rule 9: start at 9:00, the clock jumps to 9:40, and the session has finished with a tree', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))
  // Asleep from 9:10 to 9:40, then the lid opens and the page comes back into view.
  await page.clock.setSystemTime(new Date('2026-10-01T09:40:00'))
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  expect(await sessionRecords(page)).toEqual([
    { startedAt: nine.getTime(), endedAt: nine.getTime() + minutes(25), ended: 'finished' },
  ])
})

const question = 'Give up? No tree this time.'

test('rule 3: at 9:12 Give up asks in place, with Keep going and Give up; Keep going carries on', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(12))
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByText(question)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Keep going' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Give up' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('timer')).toHaveText('13:00')
  // Keep going is the moss-green button; Give up stays the quiet, underlined, muted link; no Start
  await expect(page.getByRole('button', { name: 'Keep going' })).toHaveCSS('background-color', 'rgb(47, 93, 58)')
  await page.mouse.move(0, 0)
  await expect(page.getByRole('button', { name: 'Give up' })).toHaveCSS('color', 'rgb(111, 106, 99)')
  await expect(page.getByRole('button', { name: 'Give up' })).toHaveCSS('text-decoration-line', 'underline')
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Keep going' }).click()
  await expect(page.getByText(question)).toHaveCount(0)
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText('12:59')
})

test('rule 3: Give up, then Give up: back to ready, no new tree, a given-up record saved', async ({ page }) => {
  await openAtNine(page)
  // Grow one tree first (9:00 to 9:25), so "no new tree" means the forest still has one
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(30))
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(12))
  await page.getByRole('button', { name: 'Give up' }).click()
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(page.getByText(question)).toHaveCount(0)
  await expect(page.getByRole('img', { name: /tree/i })).toHaveCount(1)
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toHaveCount(0)
  expect(await sessionRecords(page)).toEqual([
    { startedAt: nine.getTime(), endedAt: nine.getTime() + minutes(25), ended: 'finished' },
    { startedAt: nine.getTime() + minutes(30), endedAt: nine.getTime() + minutes(42), ended: 'gave up' },
  ])
})

test('asking to give up never moves the timer, and a finished session doesn\'t bring the question back', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  const before = await page.getByRole('timer').boundingBox()
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByRole('button', { name: 'Keep going' })).toBeFocused()
  expect(await page.getByRole('timer').boundingBox()).toEqual(before)
  // The question sits under the timer
  const asking = await page.getByText(question).boundingBox()
  expect(asking.y).toBeGreaterThan(before.y + before.height)

  await page.clock.runFor(minutes(25))
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByText(question)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Give up' })).toBeVisible()
})

test('rule 3: with 0:02 left, click Give up and wait: at 0:00 the question goes and the tree grows', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25) - 2000)
  await expect(page.getByRole('timer')).toHaveText('0:02')
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByText(question)).toBeVisible()
  await page.clock.runFor(2000)
  await expect(page.getByText(question)).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  expect(await sessionRecords(page)).toEqual([
    { startedAt: nine.getTime(), endedAt: nine.getTime() + minutes(25), ended: 'finished' },
  ])
})

async function growTree(page) {
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
}

test('grow 3 trees: the newest is top-left, right under the line', async ({ page }) => {
  await openAtNine(page)
  const trees = page.getByRole('img', { name: /tree/i })
  for (const count of [1, 2, 3]) {
    await growTree(page)
    await expect(trees).toHaveCount(count)
    // The new tree takes the first spot, and the one before it moves along one
    await expect(trees.first()).toHaveAccessibleName('Tree you just grew')
    if (count > 1) await expect(trees.nth(1)).toHaveAccessibleName('Tree')
  }

  const newest = await page.getByRole('img', { name: 'Tree you just grew' }).boundingBox()
  const boxes = await Promise.all([0, 1, 2].map((i) => trees.nth(i).boundingBox()))
  // Newest first: it's the leftmost tree in the top row
  expect(boxes[0]).toEqual(newest)
  for (const older of boxes.slice(1)) {
    expect(older.y).toBe(newest.y)
    expect(older.x).toBeGreaterThan(newest.x)
  }

  // Right under the line: the forest's top edge is the line, and nothing sits between it and the tree
  const forest = page.getByRole('list', { name: 'Forest' })
  const under = await forest.evaluate((list) => {
    const section = list.parentElement
    const style = getComputedStyle(section)
    return section.getBoundingClientRect().top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop)
  })
  expect(newest.y).toBeCloseTo(under, 0)
  const left = await forest.evaluate((list) => list.getBoundingClientRect().left)
  expect(newest.x).toBeCloseTo(left, 0)
})

async function openWithTrees(page, count) {
  // Seeds the trees on the first visit only, so a reload keeps whatever was saved since
  await page.addInitScript((count) => {
    if (localStorage.getItem('forest-timer:session-records') !== null) return
    const records = Array.from({ length: count }, (_, i) => {
      const startedAt = new Date(Date.UTC(2026, 8, 1) + i * 60 * 60 * 1000)
      return {
        startedAt: startedAt.toISOString(),
        endedAt: new Date(startedAt.getTime() + 25 * 60 * 1000).toISOString(),
        ended: 'finished',
      }
    })
    localStorage.setItem('forest-timer:session-records', JSON.stringify(records))
  }, count)
  await page.goto('/')
}

test('40 trees wrap into rows: roughly a dozen per row on a phone, a few dozen on a laptop, nothing off the side', async ({ page }, testInfo) => {
  await openWithTrees(page, 40)
  const trees = page.getByRole('img', { name: /tree/i })
  await expect(trees).toHaveCount(40)
  const tops = await trees.evaluateAll((all) => all.map((tree) => Math.round(tree.getBoundingClientRect().top)))
  const rows = [...new Set(tops)]
  const perRow = tops.filter((top) => top === rows[0]).length
  if (testInfo.project.name === 'phone') {
    expect(perRow).toBeGreaterThanOrEqual(10)
    expect(perRow).toBeLessThanOrEqual(14)
    expect(rows.length).toBeGreaterThan(1)
  } else {
    // About 46 fit in a row here, so 40 trees make one row
    expect(perRow).toBeGreaterThanOrEqual(24)
    expect(perRow).toBeLessThanOrEqual(60)
  }
  // Every tree sits inside the screen
  const rights = await trees.evaluateAll((all) => all.map((tree) => tree.getBoundingClientRect().right))
  const width = await page.evaluate(() => window.innerWidth)
  for (const right of rights) expect(right).toBeLessThanOrEqual(width)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})

test('100 trees: on a laptop too, a full row wraps and the next tree starts a new row underneath', async ({ page }, testInfo) => {
  await openWithTrees(page, 100)
  const tops = await page
    .getByRole('img', { name: /tree/i })
    .evaluateAll((all) => all.map((tree) => Math.round(tree.getBoundingClientRect().top)))
  const rows = [...new Set(tops)]
  expect(rows.length).toBeGreaterThan(1)
  // Rows fill up in order: every row but the last is full, and each sits below the one before
  const counts = rows.map((row) => tops.filter((top) => top === row).length)
  // Roughly a dozen per row on a phone, a few dozen on a laptop
  const [low, high] = testInfo.project.name === 'phone' ? [10, 14] : [24, 60]
  expect(counts[0]).toBeGreaterThanOrEqual(low)
  expect(counts[0]).toBeLessThanOrEqual(high)
  for (const count of counts.slice(0, -1)) expect(count).toBe(counts[0])
  expect(counts.at(-1)).toBeLessThanOrEqual(counts[0])
  expect(rows).toEqual([...rows].sort((a, b) => a - b))
})

test('rule 10: no button anywhere wipes the forest', async ({ page }) => {
  await openWithTrees(page, 40)
  // Ready: the only thing to press is Start
  await expect(page.getByRole('button')).toHaveText(['Start'])
  await expect(page.getByRole('link')).toHaveCount(0)
  // Running and asking: only Give up, then Keep going and Give up
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button')).toHaveText(['Give up'])
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByRole('button')).toHaveText(['Keep going', 'Give up'])
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(page.getByRole('img', { name: /tree/i })).toHaveCount(40)
})

// Counts every note the page plays, and when (on the test clock), plus when the newest ringed tree appeared.
async function listenForChimes(page) {
  await page.addInitScript(() => {
    window.chimes = []
    const start = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function (...args) {
      window.chimes.push(Date.now())
      return start.apply(this, args)
    }
    window.treeGrewAt = null
    new MutationObserver(() => {
      if (window.treeGrewAt === null && document.querySelector('[aria-label="Tree you just grew"]')) {
        window.treeGrewAt = Date.now()
      }
    }).observe(document, { childList: true, subtree: true })
  })
}
const chimes = (page) => page.evaluate(() => window.chimes)

test('rule 2: finishing plays the chime once; giving up plays nothing', async ({ page }) => {
  await listenForChimes(page)
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(5))
  await page.getByRole('button', { name: 'Give up' }).click()
  await page.getByRole('button', { name: 'Give up' }).click()
  await page.clock.runFor(minutes(30))
  expect(await chimes(page)).toEqual([])

  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await page.clock.runFor(minutes(5))
  expect(await chimes(page)).toHaveLength(1)
})

test('the chime plays on time while the page is in a background tab', async ({ page }) => {
  await listenForChimes(page)
  await openAtNine(page)
  // A background tab slows repeating timers down (Chrome: to once a minute). Here they're
  // slowed to once every 7 minutes, so the once-a-second tick alone would only notice at 9:28.
  // This can't reproduce Chrome's real slowdown; it shows the finish doesn't wait for that tick.
  await page.evaluate(() => {
    const setInterval = window.setInterval
    window.setInterval = (callback, delay, ...rest) => setInterval(callback, Math.max(delay, 7 * 60 * 1000), ...rest)
  })
  await page.getByRole('button', { name: 'Start' }).click()
  // Switch to another tab: the page is hidden for the rest of the session
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(minutes(25))
  expect(await page.evaluate(() => document.visibilityState)).toBe('hidden')
  expect(await chimes(page)).toEqual([nine.getTime() + minutes(25)])
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
})

test('a locked phone (page frozen past 9:25) chimes when you come back, at the same moment the tree appears', async ({ page }) => {
  await listenForChimes(page)
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))
  // Locked at 9:10: the page is frozen, so nothing runs until 9:40.
  // The test clock stands still, so "same moment" here means the same step that grows the tree.
  // It can't show that a real iPhone lets the sound wake up again without a press.
  await page.clock.setSystemTime(new Date('2026-10-01T09:40:00'))
  expect(await chimes(page)).toEqual([])
  // Unlocked: the page comes back into view
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  const comeBack = new Date('2026-10-01T09:40:00').getTime()
  expect(await chimes(page)).toEqual([comeBack])
  expect(await page.evaluate(() => window.treeGrewAt)).toBe(comeBack)
})

test('rule 4: start at 9:00, reload at 9:10, and the timer shows 15:00', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText('15:00')
  await expect(page.getByText('Give up')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(0)
  await expect(page).toHaveTitle('15:00 · Forest Timer')
  // It carries on as if you never left, and still finishes at 9:25
  await page.clock.runFor(minutes(15))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  expect(await sessionRecords(page)).toEqual([
    { startedAt: nine.getTime(), endedAt: nine.getTime() + minutes(25), ended: 'finished' },
  ])
})

test('rule 5: start at 9:00, reload at 9:40: you get the tree, with its ring, and no chime', async ({ page }) => {
  await listenForChimes(page)
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))
  // The phone sits locked until 9:40, then the browser reloads the tab. A frozen page runs
  // nothing before that reload, so it mustn't notice being hidden on the way out.
  await page.evaluate(() =>
    document.addEventListener('visibilitychange', (event) => event.stopImmediatePropagation(), true),
  )
  await page.clock.setSystemTime(new Date('2026-10-01T09:40:00'))
  await page.reload()
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await page.clock.runFor(minutes(1))
  // After a reload no sound has been switched on yet, so this mostly guards against that changing
  expect(await chimes(page)).toEqual([])
  expect(await sessionRecords(page)).toEqual([
    { startedAt: nine.getTime(), endedAt: nine.getTime() + minutes(25), ended: 'finished' },
  ])
  // Another reload: the same one tree, now without its ring
  await page.reload()
  await expect(page.getByRole('img', { name: 'Tree', exact: true })).toHaveCount(1)
})

test('fast mode carries on across a reload', async ({ page }) => {
  await openAtNine(page, '/?fast')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(10_000)
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText('0:15')
})

test('opening fresh mid-session doesn\'t carry on, and a later reload doesn\'t bring it back', async ({ page, context }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))
  // Close the tab at 9:10, then open the app again in a new one (the test clock carries on)
  await page.close()
  const reopened = await context.newPage()
  await reopened.goto('/')
  await expect(reopened.getByRole('timer')).toHaveText('25:00')
  await expect(reopened.getByRole('button', { name: 'Start' })).toBeVisible()
  await reopened.reload()
  await expect(reopened.getByRole('timer')).toHaveText('25:00')
  await expect(reopened.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(reopened.getByRole('img', { name: /tree/i })).toHaveCount(0)
})

test('a reload after a session ended opens on ready', async ({ page }) => {
  await openAtNine(page)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(5))
  await page.getByRole('button', { name: 'Give up' }).click()
  await page.getByRole('button', { name: 'Give up' }).click()
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  expect((await sessionRecords(page)).map((record) => record.ended)).toEqual(['gave up', 'finished'])
})

test('nothing runs off the side of the screen', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})
