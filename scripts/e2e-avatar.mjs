import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness-alpha5/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
fs.mkdirSync('D:/DSH_workspace/.tmp-probe', { recursive: true })
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1560, height: 980 } })
await pg.route('**/*', async route => {
  const u = new URL(route.request().url())
  let p = u.pathname === '/' ? '/index.html' : u.pathname
  const fp = DIST + '/' + decodeURIComponent(p).replace(/^\//, '')
  if (!fs.existsSync(fp)) { await route.abort(); return }
  const ext = p.split('.').pop()
  const ct = ext === 'js' ? 'application/javascript' : ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html; charset=utf-8' : ext === 'webp' ? 'image/webp' : 'application/octet-stream'
  await route.fulfill({ contentType: ct, body: fs.readFileSync(fp) })
})
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(2500)
const imgs = await pg.locator('img[src*="avatars"]').count()
console.log('avatar imgs:', imgs)
const loaded = await pg.locator('img[src*="avatars"]').evaluateAll(els => els.filter(i => i.complete && i.naturalWidth > 0).length)
console.log('loaded:', loaded)
await pg.screenshot({ path: 'D:/DSH_workspace/ak-tools/ocr-samples/ef-avatars.png' })
console.log(imgs >= 25 && loaded >= 25 ? 'RESULT: ALL PASS' : 'RESULT: FAIL imgs=' + imgs + ' loaded=' + loaded)
await b.close()