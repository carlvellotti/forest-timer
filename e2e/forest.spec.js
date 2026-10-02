import { expect, test } from '@playwright/test'

test('opens the app and sees its name, Forest', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Forest' })).toBeVisible()
})

test('nothing runs off the side of the screen', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})
