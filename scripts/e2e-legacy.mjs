import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
fs.mkdirSync('D:/DSH_workspace/.tmp-probe', { recursive: true })
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage()
const errs = []
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 160)))
await pg.route('**/*', async route => {
  const u = new URL(route.request().url())
  let p = u.pathname === '/' ? '/index.html' : u.pathname
  const fp = DIST + '/' + decodeURIComponent(p).replace(/^\//, '')
  if (!fs.existsSync(fp)) { await route.abort(); return }
  const ext = p.split('.').pop()
  const ct = ext === 'js' ? 'application/javascript' : ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html; charset=utf-8' : 'application/octet-stream'
  await route.fulfill({ contentType: ct, body: fs.readFileSync(fp) })
})
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(2000)
// 注入「上次崩溃遗留」的残缺数据（eq 仅 acc2、无 skills/wpn）
await pg.evaluate(() => localStorage.setItem('ef-roster', JSON.stringify({ '阿列什': { lv: 30, eq: { acc2: { n: '碎片', lv: 1 } } } })))
await pg.reload({ waitUntil: 'load' })
await pg.waitForTimeout(2200)
const alive = await pg.locator('button').count()
console.log('alive buttons:', alive)
console.log('BODY has 阿列什:', (await pg.evaluate(() => document.body.innerText)).includes('阿列什'))
console.log('ERRS:', JSON.stringify(errs.slice(0, 3)))
// 点其装备 '-' 也不崩（新写入全槽）
const dash = pg.locator('button:has-text("-")')
if (await dash.count()) { await dash.first().click({ timeout: 2000 }).catch(() => {}) }
await pg.waitForTimeout(600)
console.log('after dash alive:', await pg.locator('button').count(), 'ERRS:', JSON.stringify(errs.slice(0, 3)))
const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}'))
console.log('saved eq slots:', JSON.stringify(Object.keys(saved['阿列什'].eq || {})))
await b.close()
