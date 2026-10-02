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

test('nothing runs off the side of the screen', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})
