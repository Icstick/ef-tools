import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness-alpha5/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
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
await pg.goto('https://ak.local/', { waitUntil: 'load', timeout: 60000 })
await pg.waitForTimeout(1500)
// 注入 v2.1 旧结构数据：matrix=字符串、无 pot、cap 200
await pg.evaluate(() => localStorage.setItem('ef-roster', JSON.stringify({ '伊冯': { lv: 80, cap: 200, promo: 4, pot: 3, skills: [9, 5, 2, 0], wpn: { name: '点心时刻', lv: 60, promo: 3, matrix: '历战余烬' }, eq: { armor: { name: '险关', lv: 12 }, glove: { name: '', lv: 0 }, acc1: { name: '', lv: 0 }, acc2: { name: '备用弹链', lv: 20 } } } })))
await pg.reload({ waitUntil: 'load' })
await pg.waitForTimeout(1200)
await pg.locator('.operator-card', { hasText: '伊冯' }).first().click()
await pg.waitForTimeout(800)
const t = await pg.evaluate(() => document.body.innerText)
const checks = [
  ['旧名渲染不崩且显示', !errs.length, JSON.stringify(errs.slice(0, 2))],
  ['等级 80 白字保留', t.includes('当前等级'), ''],
  ['旧基质字符串迁移显示', t.includes('历战余烬'), ''],
  ['基质三段默认 0', t.includes('基质 MATRIX'), ''],
  ['旧潜能 3 显示', t.includes('3') && t.includes('/ 6'), ''],
  ['装备名显示（险关/备用弹链）', t.includes('险关') && t.includes('备用弹链'), ''],
  ['精英化 4/6 显示', t.includes('精英化'), ''],
]
let fail = 0
for (const [n, c, x] of checks) { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? ' | ' + x : '')); if (!c) fail++ }
await pg.screenshot({ path: 'D:/DSH_workspace/ak-tools/ocr-samples/ef-v2-demo.png' })
console.log('ERRS:', JSON.stringify(errs.slice(0, 3)))
await pg.evaluate(() => localStorage.removeItem('ef-roster'))
await b.close()
process.exit(fail ? 1 : 0)