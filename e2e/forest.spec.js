import { expect, test } from '@playwright/test'

test('opens the app and sees its name, Forest', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Forest' })).toBeVisible()
})
