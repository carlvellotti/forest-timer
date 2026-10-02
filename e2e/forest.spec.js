import { expect, test } from '@playwright/test'

const nine = new Date('2026-10-01T09:00:00')
const minutes = (n) => n * 60 * 1000

async function openAtNine(page, path = '/') {
  // Time only moves when a check moves it.
  await page.clock.install({ time: nine.getTime() - minutes(1) })
  await page.clock.pauseAt(nine)
  await page.goto(path)
}

test('ready: the timer reads 25:00 with Start under it, no Give up, plain tab title', async ({ page }) => {
  await openAtNine(page)
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(page.getByText('Give up')).toHaveCount(0)
  await expect(page).toHaveTitle('Forest Timer')
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

test('nothing runs off the side of the screen', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})
