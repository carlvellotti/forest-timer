// Saves the share image (index.html here) as public/share.png, 1200x630.
// Run: node tools/share-image/make.mjs
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const page = fileURLToPath(new URL('./index.html', import.meta.url))
const out = fileURLToPath(new URL('../../public/share.png', import.meta.url))

const browser = await chromium.launch()
const tab = await browser.newPage({ viewport: { width: 600, height: 315 }, deviceScaleFactor: 2 })
await tab.goto(`file://${page}`)
await tab.evaluate(() => document.fonts.ready)
await tab.screenshot({ path: out })
await browser.close()
console.log(`Saved ${out}`)
