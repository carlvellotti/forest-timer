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

// The streak (slice 2)
const monToWed = [[9, 28, 9], [9, 29, 9], [9, 30, 9]]

test('rule 3: finished Mon, Tue, Wed; on Wednesday it reads "3-day streak", big, above the week', async ({ page }) => {
  await seedFinished(page, monToWed)
  await openAt(page, new Date('2026-09-30T20:00:00'), '/stats')
  const line = page.getByText('3-day streak')
  await expect(line).toBeVisible()
  // DESIGN.md (changed 2026-10-02 while molding): the number at the timer's size, "day streak" under it in body text
  const number = line.getByText('3', { exact: true })
  const words = line.getByText('day streak')
  await expect(number).toHaveCSS('font-size', '90px')
  await expect(words).toHaveCSS('font-size', '16px')
  await expect(number).toHaveCSS('color', ink)
  await expect(words).toHaveCSS('color', ink)
  // Each on one line, words under the number, on a phone too
  const n = await number.boundingBox()
  const w = await words.boundingBox()
  expect(n.height).toBeLessThanOrEqual(90)
  expect(w.height).toBeLessThanOrEqual(24)
  expect(w.y).toBeGreaterThanOrEqual(n.y + n.height - 1)
  const week = await page.getByText('3 sessions this week').boundingBox()
  expect((await line.boundingBox()).y + (await line.boundingBox()).height).toBeLessThanOrEqual(week.y)
  // Where the timer sits: a third of the way down
  const height = await page.evaluate(() => window.innerHeight)
  expect((await line.boundingBox()).y).toBeCloseTo(height * 0.3, 0)
})

test('rule 4: Thursday 9am with nothing yet, still "3-day streak"; finish one, "4-day streak"', async ({ page }) => {
  await seedFinished(page, monToWed)
  await openAt(page, thursdayAtNine)
  await page.getByRole('link', { name: 'Stats' }).click()
  await expect(page.getByText('3-day streak')).toBeVisible()
  await page.getByRole('link', { name: 'Back to forest' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(25))
  await page.getByRole('link', { name: 'Stats' }).click()
  await expect(page.getByText('4-day streak')).toBeVisible()
})

test('rule 4: skip Thursday, and Friday reads "No streak yet. Finish a session to start one." in body text and ink', async ({ page }) => {
  await seedFinished(page, monToWed)
  await openAt(page, new Date('2026-10-02T09:00:00'), '/stats')
  const line = page.getByText('No streak yet. Finish a session to start one.')
  await expect(line).toBeVisible()
  await expect(line).toHaveCSS('font-size', '16px')
  await expect(line).toHaveCSS('color', ink)
  await expect(page.getByText(/-day streak/)).toHaveCount(0)
})

test('one day reads "1-day streak"', async ({ page }) => {
  await seedFinished(page, [[9, 30, 9]])
  await openAt(page, new Date('2026-09-30T20:00:00'), '/stats')
  await expect(page.getByText('1-day streak')).toBeVisible()
})

test('a streak runs back past Monday into last week', async ({ page }) => {
  await seedFinished(page, [[9, 25, 9], [9, 26, 9], [9, 27, 9], [9, 28, 9], [9, 29, 9]])
  await openAt(page, new Date('2026-09-29T20:00:00'), '/stats')
  await expect(page.getByText('5-day streak')).toBeVisible()
})

test('Mon and Tue finished, Wednesday only given up: on Thursday there is no streak', async ({ page }) => {
  await seedFinished(page, [[9, 28, 9], [9, 29, 9], [9, 30, 9, 'gave up']])
  await openAt(page, thursdayAtNine, '/stats')
  await expect(page.getByText('No streak yet. Finish a session to start one.')).toBeVisible()
})

test('a long streak still fits the screen', async ({ page }) => {
  const days = Array.from({ length: 120 }, (_, i) => {
    const day = new Date(2026, 8, 30 - i)
    return [day.getMonth() + 1, day.getDate(), 9]
  })
  await seedFinished(page, days)
  await openAt(page, new Date('2026-09-30T20:00:00'), '/stats')
  await expect(page.getByText('120-day streak')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})

test('rule 4, page open: Thursday 11:59pm with nothing on Thursday, and at midnight the streak is gone', async ({ page }) => {
  await seedFinished(page, monToWed)
  await openAt(page, new Date('2026-10-01T23:59:00'), '/stats')
  await expect(page.getByText('3-day streak')).toBeVisible()
  await page.clock.runFor(minutes(2))
  await expect(page.getByText('No streak yet. Finish a session to start one.')).toBeVisible()
})

// Typing /stats mid-session (slice 3, rule 7 as changed 2026-10-02)
test('rule 7: start at 9:00, type /stats at 9:10: given up, ended about 9:10, and not counted', async ({ page }) => {
  // The test clock hides how the page was opened, so pass the browser's real record through (as in forest.spec.js)
  await page.context().addInitScript(() => {
    window.realNavigationEntries = performance.getEntriesByType('navigation')
  })
  await page.clock.install({ time: thursdayAtNine.getTime() - minutes(1) })
  await page.context().addInitScript(() => {
    const entries = window.realNavigationEntries
    performance.getEntriesByType = (type) => (type === 'navigation' ? entries : [])
  })
  await page.clock.pauseAt(thursdayAtNine)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(10))

  await page.goto('/stats')
  // Typing an address opens the page fresh: it isn't a reload
  expect(await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.type)).toBe('navigate')
  await expect(page.getByText('0 sessions this week')).toBeVisible()
  await expect(page.getByText('No streak yet. Finish a session to start one.')).toBeVisible()
  await expect(page).toHaveTitle('Forest Timer')
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('forest-timer:session-records')))
  expect(records).toHaveLength(1)
  expect(records[0].ended).toBe('gave up')
  expect(Date.parse(records[0].endedAt) - thursdayAtNine.getTime()).toBeGreaterThanOrEqual(minutes(10) - 1000)
  expect(Date.parse(records[0].endedAt) - thursdayAtNine.getTime()).toBeLessThanOrEqual(minutes(10))

  await page.getByRole('link', { name: 'Back to forest' }).click()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Stats' })).toBeVisible()
  await expect(page.getByRole('img', { name: /tree/i })).toHaveCount(0)
})

test('the tab title on /stats reads "Forest Timer"', async ({ page }) => {
  await openAt(page, thursdayAtNine, '/stats')
  await expect(page).toHaveTitle('Forest Timer')
})

test('mid-session, the browser Back button to /stats keeps you on the timer, at /', async ({ page }) => {
  await openAt(page, thursdayAtNine)
  await page.getByRole('link', { name: 'Stats' }).click()
  await page.getByRole('link', { name: 'Back to forest' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.clock.runFor(minutes(5))
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText(/this week/)).toHaveCount(0)
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText('19:59')
  await expect(page).toHaveTitle('19:59 · Forest Timer')
  // Once the session ends, Stats works as usual
  await page.clock.runFor(minutes(20))
  await page.getByRole('link', { name: 'Stats' }).click()
  await expect(page.getByText('1 session this week')).toBeVisible()
})
