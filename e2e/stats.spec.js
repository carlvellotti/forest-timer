import { expect, test } from '@playwright/test'

// The stats page (2026-10-02 spec). 2026-10-01 is a Thursday; that week's Monday is 2026-09-28.
const thursdayAtNine = new Date('2026-10-01T09:00:00')
const minutes = (n) => n * 60 * 1000

const ink = 'rgb(38, 35, 31)'
const muted = 'rgb(111, 106, 99)'

// Finished sessions on given local days and hours, saved before the page opens: [[day of September or October, hour], …]
async function seedFinished(page, sessions) {
  await page.addInitScript((sessions) => {
    if (localStorage.getItem('forest-timer:session-records') !== null) return
    const records = sessions.map(([month, day, hour, ended = 'finished']) => {
      const startedAt = new Date(2026, month - 1, day, hour)
      return {
        startedAt: startedAt.toISOString(),
        endedAt: new Date(startedAt.getTime() + 25 * 60 * 1000).toISOString(),
        ended,
      }
    })
    localStorage.setItem('forest-timer:session-records', JSON.stringify(records))
  }, sessions)
}

async function openAt(page, time, path = '/') {
  await page.clock.install({ time: time.getTime() - minutes(1) })
  await page.clock.pauseAt(time)
  await page.goto(path)
}

const counts = (page) => page.getByRole('cell').allTextContents()

test('rule 6: the quiet Stats link sits top-right when Ready, is gone while Running, and is back after', async ({ page }) => {
  await openAt(page, thursdayAtNine)
  const stats = page.getByRole('link', { name: 'Stats' })
  await expect(stats).toBeVisible()
  await expect(stats).toHaveCSS('color', muted)
  await expect(stats).toHaveCSS('text-decoration-line', 'underline')
  const box = await stats.boundingBox()
  const width = await page.evaluate(() => window.innerWidth)
  expect(box.x).toBeGreaterThan(width / 2)
  expect(box.y).toBeLessThan(60)

  await page.getByRole('button', { name: 'Start' }).click()
  await expect(stats).toHaveCount(0)
  await page.getByRole('button', { name: 'Give up' }).click()
  await page.getByRole('button', { name: 'Give up' }).click()
  await expect(stats).toBeVisible()
})

test('Stats opens /stats; Back to forest, top-left, returns to the timer and forest', async ({ page }) => {
  await openAt(page, thursdayAtNine)
  await page.getByRole('link', { name: 'Stats' }).click()
  await expect(page).toHaveURL(/\/stats$/)
  await expect(page.getByText('0 sessions this week')).toBeVisible()
  await expect(page.getByRole('timer')).toHaveCount(0)

  const back = page.getByRole('link', { name: 'Back to forest' })
  const box = await back.boundingBox()
  const width = await page.evaluate(() => window.innerWidth)
  expect(box.x + box.width).toBeLessThan(width / 2)
  expect(box.y).toBeLessThan(60)
  await back.click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByText('Finish a session to grow your first tree.')).toBeVisible()

  // The browser's back button works too
  await page.getByRole('link', { name: 'Stats' }).click()
  await page.goBack()
  await expect(page.getByRole('timer')).toHaveText('25:00')
})

test('Mon 4, Tue 3, Wed 2, Thu 0 (today): "9 sessions this week", Fri to Sun blank, today in ink, the rest muted', async ({ page }) => {
  await seedFinished(page, [
    [9, 28, 8], [9, 28, 9], [9, 28, 10], [9, 28, 11],
    [9, 29, 8], [9, 29, 9], [9, 29, 10],
    [9, 30, 8], [9, 30, 9],
  ])
  await openAt(page, thursdayAtNine, '/stats')
  await expect(page.getByText('9 sessions this week')).toBeVisible()
  await expect(page.getByRole('columnheader')).toHaveText(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  expect(await counts(page)).toEqual(['4', '3', '2', '0', '', '', ''])

  await expect(page.getByRole('columnheader', { name: 'Thu' })).toHaveCSS('color', ink)
  await expect(page.getByRole('cell').nth(3)).toHaveCSS('color', ink)
  await expect(page.getByRole('columnheader', { name: 'Mon' })).toHaveCSS('color', muted)
  await expect(page.getByRole('cell').nth(0)).toHaveCSS('color', muted)
})

test('rule 5: Monday with 2 finished and 1 given up shows 2', async ({ page }) => {
  await seedFinished(page, [[9, 28, 9], [9, 28, 10], [9, 28, 11, 'gave up']])
  await openAt(page, thursdayAtNine, '/stats')
  expect((await counts(page))[0]).toBe('2')
  await expect(page.getByText('2 sessions this week')).toBeVisible()
})

test('one session reads "1 session this week"', async ({ page }) => {
  await seedFinished(page, [[9, 30, 9]])
  await openAt(page, thursdayAtNine, '/stats')
  await expect(page.getByText('1 session this week')).toBeVisible()
})

test('page open at 11:59pm Sunday: at midnight the week resets to a fresh Monday, no reload', async ({ page }) => {
  await seedFinished(page, [[9, 28, 9], [10, 4, 20]])
  await openAt(page, new Date('2026-10-04T23:59:00'), '/stats')
  await expect(page.getByText('2 sessions this week')).toBeVisible()
  expect(await counts(page)).toEqual(['1', '0', '0', '0', '0', '0', '1'])
  await page.clock.runFor(minutes(2))
  await expect(page.getByText('0 sessions this week')).toBeVisible()
  expect(await counts(page)).toEqual(['0', '', '', '', '', '', ''])
  await expect(page.getByRole('columnheader', { name: 'Mon' })).toHaveCSS('color', ink)
})

test('opening /stats directly works in dev and in the built app', async ({ page }) => {
  await openAt(page, thursdayAtNine, '/stats')
  await expect(page.getByText('0 sessions this week')).toBeVisible()
  await page.goto('http://localhost:4173/stats')
  await expect(page.getByText('0 sessions this week')).toBeVisible()
  await page.getByRole('link', { name: 'Back to forest' }).click()
  await expect(page.getByRole('timer')).toHaveText('25:00')
})

test('a second tab on /stats shows "Forest Timer is open in another tab."', async ({ page, context }) => {
  await openAt(page, thursdayAtNine)
  const second = await context.newPage()
  await second.goto('/stats')
  await expect(second.getByText('Forest Timer is open in another tab.')).toBeVisible()
  await expect(second.getByText(/this week/)).toHaveCount(0)
})

test('the stats page fits the screen, with nothing off the side', async ({ page }) => {
  await seedFinished(page, [[9, 28, 9], [9, 29, 9], [9, 30, 9]])
  await openAt(page, new Date('2026-10-04T12:00:00'), '/stats')
  await expect(page.getByText('3 sessions this week')).toBeVisible()
  const width = await page.evaluate(() => window.innerWidth)
  const rights = await page.getByRole('columnheader').evaluateAll((all) => all.map((day) => day.getBoundingClientRect().right))
  for (const right of rights) expect(right).toBeLessThanOrEqual(width)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})

test('/stats/ with a trailing slash opens the stats page too', async ({ page }) => {
  await openAt(page, thursdayAtNine, '/stats/')
  await expect(page.getByText('0 sessions this week')).toBeVisible()
})

test('the tree you just grew keeps its ring through Stats and back (you never left the page)', async ({ page }) => {
  await openAt(page, thursdayAtNine)
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
  await page.getByRole('link', { name: 'Stats' }).click()
  await expect(page.getByText('1 session this week')).toBeVisible()
  await page.getByRole('link', { name: 'Back to forest' }).click()
  await expect(page.getByRole('img', { name: 'Tree you just grew' })).toBeVisible()
})
