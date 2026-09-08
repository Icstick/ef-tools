import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1560, height: 1000 } })
await pg.route('**/*', async route => {
  const u = new URL(route.request().url())
  let p = u.pathname === '/' ? '/index.html' : u.pathname
  const fp = DIST + '/' + decodeURIComponent(p).replace(/^\//, '')
  if (!fs.existsSync(fp)) { await route.abort(); return }
  const ext = p.split('.').pop()
  const ct = ext === 'js' ? 'application/javascript' : ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html; charset=utf-8' : ext === 'webp' ? 'image/webp' : ext === 'css' ? 'text/css' : 'application/octet-stream'
  await route.fulfill({ contentType: ct, body: fs.readFileSync(fp) })
})
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(2000)
await pg.locator('.operator-card', { hasText: '伊冯' }).first().click()
await pg.waitForTimeout(500)
const info = await pg.evaluate(() => {
  const g = sel => {
    const el = document.querySelector(sel)
    if (!el) return sel + ': none'
    const r = el.getBoundingClientRect()
    return sel + ' x=' + Math.round(r.left) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height)
  }
  return [g('.page-body'), g('.workspace'), g('.roster'), g('.dossier'), g('.identity'), g('.stat-grid'), g('.gear-panel'), g('.skill-panel'), g('.talent-panel')]
})
console.log(JSON.stringify(info, null, 1))
await b.close()
