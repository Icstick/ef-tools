import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness-alpha5/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
fs.mkdirSync('D:/DSH_workspace/.tmp-probe', { recursive: true })
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } })
const errs = []
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 200)))
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
await pg.waitForTimeout(2500)
// 全按钮遍历（模拟误点每个按钮）——先给噗切娜建档
const btns0 = pg.locator('button')
console.log('total buttons:', await btns0.count())
// 点第 1 个（筛选前第一卡 = 阿列什 未获得）建档
await btns0.nth(0).click()
await pg.waitForTimeout(400)
// 现在所有「-」按钮（装备 lv0 显示 '-'）在已获得卡上点一遍
const dash = pg.locator('button:has-text("-")')
console.log('dash buttons:', await dash.count())
for (let i = 0; i < Math.min(await dash.count(), 8); i++) { try { await dash.nth(i).click({ timeout: 2000 }); await pg.waitForTimeout(150) } catch (e) { console.log('click fail', i, String(e.message).slice(0, 60)) } }
await pg.waitForTimeout(800)
const alive = await pg.locator('button').count()
console.log('alive buttons after dashes:', alive)
console.log('ERRS:', JSON.stringify(errs.slice(0, 4)))
// 再全点其余按钮（技能/晋/潜/破/拥有）第一卡
const cardBtns = pg.locator('div').filter({ has: pg.locator('button:has-text("已获得")') }).first().locator('button')
console.log('card button count:', await cardBtns.count())
for (let i = 0; i < Math.min(await cardBtns.count(), 20); i++) { try { await cardBtns.nth(i).click({ timeout: 1500 }); await pg.waitForTimeout(100) } catch {} }
await pg.waitForTimeout(600)
const alive2 = await pg.locator('button').count()
console.log('alive after all clicks:', alive2, '| ERRS:', JSON.stringify(errs.slice(0, 5)))
console.log('BODY head:', (await pg.evaluate(() => document.body.innerText.slice(0, 120)).catch(() => 'EMPTY')))
await b.close()