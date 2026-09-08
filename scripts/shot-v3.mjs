import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1680, height: 1000 } })
await pg.route('**/*', async route => {
  const u = new URL(route.request().url())
  if (u.hostname.includes('yituliu.cn')) { await route.continue(); return }
  let p = u.pathname === '/' ? '/index.html' : u.pathname
  const fp = DIST + '/' + decodeURIComponent(p).replace(/^\//, '')
  if (!fs.existsSync(fp)) { await route.abort(); return }
  const ext = p.split('.').pop()
  const ct = ext === 'js' ? 'application/javascript' : ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html; charset=utf-8' : ext === 'webp' ? 'image/webp' : ext === 'css' ? 'text/css' : 'application/octet-stream'
  await route.fulfill({ contentType: ct, body: fs.readFileSync(fp) })
})
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(1500)
await pg.evaluate(() => localStorage.setItem('ef-roster', JSON.stringify({ '伊冯': { lv: 80, cap: 200, promo: 4, pot: 3, skills: [9, 5, 2, 0], talents: [6, 3, 1, 0], wpn: { name: '工业零点一', lv: 60, promo: 3, pot: 2, matrix: { name: '无瑕基质', lv: [5, 3, 1] } }, eq: { armor: { name: '险关装甲', lv: 12 }, glove: { name: '50式应龙手甲', lv: 8 }, acc1: { name: '险关通信器', lv: 15 }, acc2: { name: '备用弹链', lv: 3 } } } })))
await pg.reload({ waitUntil: 'load' })
await pg.waitForTimeout(1500)
await pg.locator('.operator-card', { hasText: '伊冯' }).first().click()
await pg.waitForTimeout(6000)
const imgs = await pg.evaluate(() => [...document.querySelectorAll('.gear-slot img')].filter(i => i.complete && i.naturalWidth > 0).length)
console.log('loaded gear imgs:', imgs)
await pg.screenshot({ path: 'D:/DSH_workspace/ak-tools/ocr-samples/ef-v3-fullpage.png', fullPage: true })
await pg.screenshot({ path: 'D:/DSH_workspace/ak-tools/ocr-samples/ef-v3-view.png' })
await b.close()
