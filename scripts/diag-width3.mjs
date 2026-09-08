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
  const g = (el, tag) => { if (!el) return tag + ': none'; const r = el.getBoundingClientRect(); return tag + ' x' + Math.round(r.left) + ' y' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) }
  const out = []
  out.push(g(document.querySelector('.page-body'), 'page-body'))
  out.push(g(document.querySelector('.roster .operator-grid'), 'operator-grid'))
  out.push(g(document.querySelector('.identity'), 'identity'))
  out.push(g(document.querySelector('.identity-grid'), 'identity-grid'))
  out.push(g(document.querySelector('.identity-grid h1'), 'h1'))
  out.push(g(document.querySelector('.identity-grid .ownership'), 'ownership-btn'))
  out.push(g(document.querySelector('.identity-portrait'), 'portrait'))
  const ig = document.querySelector('.identity-grid')
  out.push('ig children h sum: ' + [...ig.children].map(c => Math.round(c.getBoundingClientRect().height)).join('+'))
  return out
})
console.log(info.join('\n'))
await b.close()
