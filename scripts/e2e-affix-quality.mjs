import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
fs.mkdirSync('D:/DSH_workspace/.tmp-probe', { recursive: true })
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1560, height: 1000 } })
const errs = []
pg.on('pageerror', e => errs.push('ERR ' + e.message.slice(0, 150)))
await pg.route('**/*', async route => {
  const u = new URL(route.request().url())
  let p = u.pathname === '/' ? '/index.html' : u.pathname
  const fp = DIST + '/' + decodeURIComponent(p).replace(/^\//, '')
  if (!fs.existsSync(fp)) { await route.abort(); return }
  const ext = p.split('.').pop()
  const ct = ext === 'js' ? 'application/javascript' : ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html; charset=utf-8' : ext === 'webp' ? 'image/webp' : ext === 'css' ? 'text/css' : 'application/octet-stream'
  await route.fulfill({ contentType: ct, body: fs.readFileSync(fp) })
})
const fails = []
const assert = (n, c, x) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + n + (x ? ' | ' + x : '')); if (!c) fails.push(n) }
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(3000)
const seed = {
  lv: 25, cap: 40, promo: 1, pot: 3, skills: [2, 0, 0, 0], talents: [2, 1, 0, 0, 0, 0],
  wpn: { name: '佩科5', lv: 10, promo: 1, matrix: '无瑕基质·效益' },
  eq: { armor: { name: '险关装甲', lv: 0 }, glove: { name: '', lv: 0 }, acc1: { name: '', lv: 0 }, acc2: { name: '', lv: 0 } }
}
await pg.evaluate((s) => { localStorage.setItem('ef-roster', JSON.stringify({ '伊冯': s })) }, seed)
await pg.reload({ waitUntil: 'load' })
await pg.waitForTimeout(2500)
await pg.locator('.operator-card', { hasText: '伊冯' }).first().click()
await pg.waitForTimeout(800)
const t1 = await pg.evaluate(() => document.body.innerText)
assert('词条区骨架渲染', t1.includes('词条一') && t1.includes('词条二') && t1.includes('被动'), '')
const aff = pg.locator('div[title*="词条段"]').first().locator('span').nth(5)
await aff.click()
await pg.waitForTimeout(400)
let st = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}')['伊冯'])
assert('词条一 affix[0]=6', st && st.wpn && st.wpn.affix && st.wpn.affix[0] === 6, JSON.stringify(st && st.wpn && st.wpn.affix))
assert('affix[1] 旧档默认 0', st && st.wpn && st.wpn.affix[1] === 0, '')
assert('passive 旧档默认 0', st && st.wpn && st.wpn.passive === 0, String(st && st.wpn && st.wpn.passive))
await pg.locator('div[title*="被动段"]').first().locator('span').nth(2).click()
await pg.waitForTimeout(400)
st = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}')['伊冯'])
assert('被动 passive=3', st && st.wpn && st.wpn.passive === 3, String(st && st.wpn && st.wpn.passive))
const row = pg.locator('span', { hasText: '装备适配' }).first()
await row.locator('span').nth(4).click()
await pg.waitForTimeout(400)
st = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}')['伊冯'])
assert('装备适配 talents[5]=3', st && st.talents && st.talents[5] === 3, JSON.stringify(st && st.talents))
const t2 = await pg.evaluate(() => document.body.innerText)
assert('UI 显示金品质', t2.includes('金品质'), '')
await pg.screenshot({ path: 'D:/DSH_workspace/.tmp-probe/ef-affix-quality.png' })
await pg.evaluate(() => localStorage.removeItem('ef-roster'))
await b.close()
console.log('ERRS: ' + JSON.stringify(errs))
console.log(fails.length ? 'RESULT: FAIL ' + fails.length : 'RESULT: ALL PASS')