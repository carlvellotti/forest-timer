import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
