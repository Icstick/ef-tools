import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
fs.mkdirSync('D:/DSH_workspace/.tmp-probe', { recursive: true })
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1560, height: 980 } })
const errs = []
pg.on('pageerror', e => errs.push('ERR ' + e.message.slice(0, 150)))
await pg.route('**/*', async route => {
  const u = new URL(route.request().url())
  let p = u.pathname === '/' ? '/index.html' : u.pathname
  const fp = DIST + '/' + decodeURIComponent(p).replace(/^\//, '')
  if (!fs.existsSync(fp)) { await route.abort(); return }
  const ext = p.split('.').pop()
  const ct = ext === 'js' ? 'application/javascript' : ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html; charset=utf-8' : 'application/octet-stream'
  await route.fulfill({ contentType: ct, body: fs.readFileSync(fp) })
})
const fails = []
const assert = (n, c, x) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + n + (x ? ' | ' + x : '')); if (!c) fails.push(n) }
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(2500)
// 建档噗切娜（第 24 张 0-based 23）
const btns = pg.locator('button:has-text("未获得")')
await btns.nth(23).click()
await pg.waitForTimeout(500)
// 行卡结构断言：行 = 含噗切娜的块包含 武器/基质/护甲/护手/配件 与下拉
const rowInfo = await pg.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter(s => s.textContent === '噗切娜')
  for (const s of spans) {
    let p = s
    for (let i = 0; i < 6 && p; i++) { p = p.parentElement; if (p && (p.style.borderRadius || '').includes('10') && (p.style.padding || '').includes('8px')) {
      const selects = [...p.querySelectorAll('select')].map(x => x.value)
      const btnTxt = [...p.querySelectorAll('button')].map(x => x.textContent).join(',')
      return { selects: selects.length, btnTxt, hasLabels: ['武器','基质','护甲','护手','配件1','配件2'].every(t => p.innerText.includes(t)) }
    } }
  }
  return null
})
console.log('ROW:', JSON.stringify(rowInfo))
assert('行卡含武器/基质/装备4槽标签', rowInfo && rowInfo.hasLabels, JSON.stringify(rowInfo))
// 武器下拉选 点心时刻
await pg.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter(s => s.textContent === '噗切娜')
  for (const s of spans) { let p = s; for (let i = 0; i < 6 && p; i++) { p = p.parentElement; if (p && (p.style.borderRadius || '').includes('10')) {
    const sel = [...p.querySelectorAll('select')].find(x => [...x.options].some(o => o.textContent === '点心时刻'))
    if (sel) { const ev = new Event('change', { bubbles: true }); const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set; setter.call(sel, '点心时刻'); sel.dispatchEvent(ev); return 'ok' } } } }
  return 'notfound'
})
await pg.waitForTimeout(500)
const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}')['噗切娜'])
console.log('SAVED:', JSON.stringify(saved && saved.wpn))
assert('武器下拉保存', saved && saved.wpn.name === '点心时刻', JSON.stringify(saved && saved.wpn))
// 技能点击循环
await pg.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter(s => s.textContent === '噗切娜')
  for (const s of spans) { let p = s; for (let i = 0; i < 6 && p; i++) { p = p.parentElement; if (p && (p.style.borderRadius || '').includes('10')) {
    const t = [...p.querySelectorAll('span[title]')].find(x => (x.title || '').includes('技能1'))
    if (t) { t.click(); return 'ok' } } } }
  return 'no'
})
await pg.waitForTimeout(400)
const s1 = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}')['噗切娜'].skills[0])
assert('技能1 → 1', s1 === 1, String(s1))
console.log('ERRS:', JSON.stringify(errs.slice(0, 4)))
// 截图存档
await pg.screenshot({ path: 'D:/DSH_workspace/ak-tools/ocr-samples/ef-rowcard.png' })
await pg.evaluate(() => localStorage.removeItem('ef-roster'))
await b.close()
console.log(fails.length ? 'RESULT: FAIL ' + fails.length : 'RESULT: ALL PASS')
process.exit(fails.length ? 1 : 0)
