// One-off: rasterize the app icon (Lunaria pod device, plate style) to PNGs.
// Run: node scripts/make-icons.mjs   (uses the pre-installed Playwright Chromium)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const svg = (pad) => `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0}</style>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#F4EEDF"/>
  <g stroke="#2C261D" fill="none" stroke-linecap="round" transform="translate(256,256) scale(${pad})">
    <rect x="-198" y="-198" width="396" height="396" stroke-width="7"/>
    <rect x="-176" y="-176" width="352" height="352" stroke-width="3"/>
    <g stroke-width="11">
      <path d="M0,-88 L0,-140"/>
      <circle cx="0" cy="0" r="86"/>
      <circle cx="0" cy="0" r="60" stroke-width="6"/>
      <circle cx="-20" cy="-12" r="15" stroke-width="6"/>
      <circle cx="22" cy="16" r="15" stroke-width="6"/>
      <path d="M0,86 L0,120"/>
    </g>
  </g>
</svg>`

mkdirSync('public/icons', { recursive: true })

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 512, height: 512 } })

const jobs = [
  { file: 'public/icons/pwa-512.png', size: 512, pad: 1 },
  { file: 'public/icons/pwa-192.png', size: 192, pad: 1 },
  // maskable-ish safe zone + solid ground for the home screen tile
  { file: 'public/icons/apple-touch-icon.png', size: 180, pad: 0.86 },
]

for (const { file, size, pad } of jobs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(svg(pad).replace('width="512" height="512"', `width="${size}" height="${size}"`))
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: size, height: size } })
  console.log('wrote', file)
}

await browser.close()
