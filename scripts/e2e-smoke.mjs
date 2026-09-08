import { createRequire } from 'node:module'
const { chromium } = createRequire('D:/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/package.json')('playwright')
const fs = await import('node:fs')
const DIST = 'D:/DSH_workspace/ef-tools/dist'
fs.mkdirSync('D:/DSH_workspace/.tmp-probe', { recursive: true })
const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } })
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
const txt = await pg.evaluate(() => document.body.innerText)
assert('干员卡片渲染（噗切娜在）', txt.includes('噗切娜'), '')
assert('干员数 33', txt.includes('/ 图鉴 33'), txt.split('图鉴')[1])
// 注入噗切娜练度 → reload 验证渲染与交互
await pg.evaluate(() => {
  localStorage.setItem('ef-roster', JSON.stringify({
    '噗切娜': { lv: 25, cap: 40, promo: 1, pot: 3, skills: [2, 0, 0, 0], wpn: { lv: 10, promo: 1, matrix: '无瑕基质·效益' }, eq: { armor: { n: '险关装甲', lv: 5 }, glove: { n: '', lv: 0 }, acc1: { n: '', lv: 0 }, acc2: { n: '', lv: 0 } } }
  }))
})
await pg.reload({ waitUntil: 'load' })
await pg.waitForTimeout(2200)
const cardState = await pg.evaluate(() => {
  // 找噗切娜卡（文本含名字且含 晋 的最近卡片容器）
  const spans = [...document.querySelectorAll('span')].filter(s => s.textContent === '噗切娜')
  let card = null
  for (const s of spans) { let p = s; for (let i = 0; i < 8 && p; i++) { p = p.parentElement; if (p && (p.style.width || '').includes('300')) { card = p; break } } if (card) break }
  if (!card) return null
  const nums = [...card.querySelectorAll('input')].map(i => i.value)
  return { nums, txt: card.innerText.slice(0, 120) }
})
console.log('CARD:', JSON.stringify(cardState))
assert('卡存在且等级=25', cardState && cardState.nums[0] === '25', JSON.stringify(cardState && cardState.nums))
assert('卡显示 晋1 潜3', cardState && cardState.txt.includes('晋1') && cardState.txt.includes('潜3'), cardState && cardState.txt.slice(0, 60))
assert('技能1 徽标 2', cardState && cardState.txt.includes('2') && cardState.txt.includes('S1'), '')
// 点击 晋1 → 晋2
await pg.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter(s => s.textContent === '噗切娜')
  for (const s of spans) { let p = s; for (let i = 0; i < 8 && p; i++) { p = p.parentElement; if (p && (p.style.width || '').includes('300')) { const btn = [...p.querySelectorAll('button')].find(b => b.textContent.includes('晋1')); if (btn) { btn.click(); return } } } }
})
await pg.waitForTimeout(500)
const after = await pg.evaluate(() => JSON.parse(localStorage.getItem('ef-roster') || '{}')['噗切娜'])
assert('点击晋1 → promo=2', after && after.promo === 2, after && String(after.promo))
assert('基质保存', after && after.wpn.matrix.includes('效益'), after && after.wpn.matrix)
assert('装备护甲保存', after && after.eq.armor.n === '险关装甲' && after.eq.armor.lv === 5, '')
// 截图存档
await pg.screenshot({ path: 'D:/DSH_workspace/ak-tools/ocr-samples/ef-tools-v1.png' })
// 清理注入
await pg.evaluate(() => localStorage.removeItem('ef-roster'))
await b.close()
console.log(fails.length ? 'RESULT: FAIL ' + fails.length : 'RESULT: ALL PASS')
process.exit(fails.length ? 1 : 0)
