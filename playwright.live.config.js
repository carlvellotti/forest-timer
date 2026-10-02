import { defineConfig, devices } from '@playwright/test'

// The click-throughs against a real address, in one of the engines behind Chrome, Firefox and Safari.
// Run once per engine:
//   LIVE_URL=https://forest-timer.fullstackpm.workers.dev ENGINE=firefox npx playwright test -c playwright.live.config.js
const url = process.env.LIVE_URL
if (!url) throw new Error('Set LIVE_URL to the address to check')
const engine = process.env.ENGINE ?? 'chromium'
const device = { chromium: devices['Desktop Chrome'], firefox: devices['Desktop Firefox'], webkit: devices['Desktop Safari'] }[engine]
if (!device) throw new Error('ENGINE is chromium, firefox or webkit')

// Left out: ?fast only works in npm run dev, two checks open the local built app on localhost:4173,
// and outside Chromium the crash check can't crash a page (it needs Chromium's devtools)
const leftOut = ['\\?fast makes', 'fast mode carries on', 'in the built app']
if (engine !== 'chromium') leftOut.push('a crash is the same as a close')

// Firefox has no touch screens, so its phone is a narrow window
const touch = engine === 'firefox' ? {} : { hasTouch: true }

export default defineConfig({
  testDir: 'e2e',
  grepInvert: new RegExp(leftOut.join('|')),
  use: { ...device, baseURL: url },
  // Named phone and laptop, as in playwright.config.js: some checks expect a different layout on each
  projects: [
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, ...touch } },
  ],
})
