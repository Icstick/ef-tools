import React, { useMemo, useState } from 'react'
import { roster, save } from '../lib/store'

// 练度模型：{ lv, cap, promo(晋升), pot(潜能), skills:[4×0-10], wpn:{name,lv,promo,matrix}, eq:{armor,glove,acc1,acc2:{name,lv}} }
const blank = () => ({
  lv: 1, cap: 40, promo: 0, pot: 0,
  skills: [0, 0, 0, 0],
  wpn: { name: '', lv: 0, promo: 0, matrix: '' },
  eq: { armor: { name: '', lv: 0 }, glove: { name: '', lv: 0 }, acc1: { name: '', lv: 0 }, acc2: { name: '', lv: 0 } },
})
const EQ_SLOTS = [
  ['armor', '护甲'], ['glove', '护手'], ['acc1', '配件1'], ['acc2', '配件2'],
]
const cell = { background: 'var(--panel2)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 5, padding: '2px 6px', fontSize: 13 }
const numS = { ...cell, width: 50 }
const lab = { fontSize: 12, color: 'var(--dim)' }

export default function RosterPage({ ops, lists }) {
  const [my, setMy] = useState(roster)
  const [q, setQ] = useState('')
  const [ownF, setOwnF] = useState('all')
  const [wExtra, setWExtra] = useState({}) // 自定义武器/装备/基质记忆（并入下拉建议）
  const set = (name, patch) => { const m = { ...my, [name]: { ...blank(), ...(my[name] || {}), ...patch } }; setMy(m); save('roster', m) }
  const setDeep = (name, path, val) => {
    if (path.length === 1) return set(name, { [path[0]]: val })
    const base = blank()[path[0]]
    const cur = (my[name] && my[name][path[0]]) || {}
    set(name, { [path[0]]: { ...base, ...cur, [path[1]]: val } })
  }
  const own = (name, val) => { const m = { ...my }; if (val) m[name] = my[name] || blank(); else delete m[name]; setMy(m); save('roster', m) }
  const cycleSkill = (name, idx) => {
    const sk = Array.isArray(my[name]?.skills) ? my[name].skills : [0, 0, 0, 0]
    const s = [...sk]
    s[idx] = ((s[idx] || 0) + 1) % 11
    set(name, { skills: s })
  }
  const cycleNum = (name, key, max) => { const cur = my[name]?.[key] || 0; set(name, { [key]: (cur + 1) % (max + 1) }) }
  const cycleEqLv = (name, slot) => {
    const cur = (my[name]?.eq?.[slot]) || { name: '', lv: 0 }
    setDeep(name, ['eq', slot], { name: cur.name || '', lv: ((cur.lv || 0) + 1) % 21 })
  }
  const remember = (kind, v) => { if (!v) return; const k = kind + 's'; const cur = wExtra[k] || []; if (!cur.includes(v)) { const nx = { ...wExtra, [k]: [...cur, v].slice(-30) }; setWExtra(nx) } }
  const options = (kind, seed) => {
    const base = [...(seed || []), ...((wExtra[kind + 's']) || [])]
    return [...new Set(base)].filter(Boolean)
  }
  const customOf = async (kind, apply) => {
    const v = window.prompt('输入自定义' + (kind === 'weapon' ? '武器' : kind === 'equip' ? '装备' : '基质') + '名称：')
    if (v && v.trim()) { const nv = v.trim(); remember(kind, nv); apply(nv) }
  }
  const plusBtn = { ...cell, cursor: 'pointer', width: 24, padding: '1px 0', fontSize: 13, color: 'var(--gold)' }
  const list = useMemo(() => {
    return Object.values(ops)
      .filter(o => !q || o.name.includes(q))
      .filter(o => ownF === 'all' ? true : ownF === 'own' ? !!my[o.name] : !my[o.name])
      .sort((a, b) => (b.star || 0) - (a.star || 0) || a.name.localeCompare(b.name, 'zh'))
  }, [ops, q, ownF, my])
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索干员…" style={{ ...cell, width: 140 }} />
        <select value={ownF} onChange={e => setOwnF(e.target.value)} style={cell}>
          <option value="all">全部干员</option>
          <option value="own">已获得</option>
          <option value="not">未获得</option>
        </select>
        <span style={{ ...lab, marginLeft: 8 }}>已获得 {Object.keys(my).length} / 图鉴 {Object.keys(ops).length}</span>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 170px)', overflowY: 'auto', paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map(o => {
          const m = my[o.name] || null
          const d = m || blank()
          const sk = Array.isArray(d.skills) ? d.skills : [0, 0, 0, 0]
          const wpn = d.wpn || blank().wpn
          const eqv = (slot) => (d.eq && d.eq[slot]) || { name: '', lv: 0 }
          const owned = !!m
          return (
            <div key={o.name} style={{ border: '1px solid ' + (owned ? 'var(--gold2)' : 'var(--line)'), borderRadius: 10, padding: '8px 12px', background: owned ? 'rgba(201,161,94,0.05)' : 'var(--panel2)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* 头像 + 身份 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 170 }}>
                {o.avatar
                  ? <img src={o.avatar} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: 'var(--panel)' }} />
                  : <span style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--panel)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>{o.name[0]}</span>}
                <span style={{ display: 'grid', gap: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{o.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--dim)' }}>{[o.prof, o.sub, o.weapon, o.camp].filter(Boolean).join(' · ') || '—'}</span>
                </span>
              </div>
              {/* 等级 / 晋升 / 潜能 */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={lab}>Lv</span>
                <input type="number" min={1} max={200} value={d.lv} disabled={!owned} onChange={e => set(o.name, { lv: Math.max(1, Number(e.target.value) || 1) })} style={numS} />
                <span style={lab}>/</span>
                <input type="number" min={1} max={200} value={d.cap} disabled={!owned} title="当前阶段上限" onChange={e => set(o.name, { cap: Math.max(1, Number(e.target.value) || 1) })} style={{ ...numS, width: 46 }} />
                <select value={d.promo} disabled={!owned} onChange={e => set(o.name, { promo: Number(e.target.value) })} style={cell} title="晋升">
                  {[0, 1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>晋{p}</option>)}
                </select>
                <select value={d.pot} disabled={!owned} onChange={e => set(o.name, { pot: Number(e.target.value) })} style={cell} title="潜能">
                  {[0, 1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>潜{p}</option>)}
                </select>
              </div>
              {/* 技能 4 个 */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={lab}>技能</span>
                {[0, 1, 2, 3].map(i => (
                  <span key={i} title={'技能' + (i + 1) + '：点击循环 0→1→…→10'} onClick={() => owned && cycleSkill(o.name, i)} style={{ position: 'relative', cursor: owned ? 'pointer' : 'default', width: 30, height: 30, borderRadius: 6, background: 'var(--panel)', border: '1px solid ' + (sk[i] ? 'var(--gold)' : 'var(--line)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--dim)', opacity: owned ? 1 : 0.55 }}>
                    {o.skillIcons && o.skillIcons[i] ? <img src={o.skillIcons[i]} alt="" style={{ width: 26, height: 26, borderRadius: 4 }} /> : 'S' + (i + 1)}
                    {sk[i] > 0 && <span style={{ position: 'absolute', right: -6, bottom: -6, background: sk[i] >= 10 ? 'var(--gold)' : 'var(--panel)', color: sk[i] >= 10 ? '#101216' : 'var(--gold)', fontSize: 10, lineHeight: '14px', padding: '0 4px', borderRadius: 8, fontWeight: 700 }}>{sk[i]}</span>}
                  </span>
                ))}
              </div>
              {/* 武器 + 基质 */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={lab}>武器</span>
                <select value={wpn.name} disabled={!owned} onChange={e => { const v = e.target.value; remember('weapon', v); setDeep(o.name, ['wpn', 'name'], v) }} style={{ ...cell, minWidth: 120 }}>
                  <option value="">— 选择 —</option>
                  {(options('weapon', lists.weapons)).map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <span style={lab}>Lv</span>
                <input type="number" min={0} max={200} value={wpn.lv} disabled={!owned} onChange={e => setDeep(o.name, ['wpn', 'lv'], Math.max(0, Number(e.target.value) || 0))} style={numS} />
                <select value={wpn.promo} disabled={!owned} onChange={e => setDeep(o.name, ['wpn', 'promo'], Number(e.target.value))} style={cell}>
                  {[0, 1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>破{p}</option>)}
                </select>
                <select value={wpn.matrix} disabled={!owned} onChange={e => { const v = e.target.value; remember('matrix', v); setDeep(o.name, ['wpn', 'matrix'], v) }} style={{ ...cell, minWidth: 130 }}>
                  <option value="">基质 —</option>
                  {options('matrix', lists.matrix).map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <button onClick={() => customOf('matrix', (v) => setDeep(o.name, ['wpn', 'matrix'], v))} title="自定义基质名" style={plusBtn}>+</button>
              </div>
              {/* 装备 4 件 */}
              {EQ_SLOTS.map(([slot, labName]) => (
                <span key={slot} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={lab}>{labName}</span>
                  <select value={eqv(slot).name} disabled={!owned} onChange={e => { const v = e.target.value; remember('equip', v); setDeep(o.name, ['eq', slot], { ...eqv(slot), name: v }) }} style={{ ...cell, minWidth: 110, fontSize: 12 }}>
                    <option value="">—</option>
                    {options('equip', lists.equips).map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <button onClick={() => customOf('equip', (v) => setDeep(o.name, ['eq', slot], { ...eqv(slot), name: v }))} title="自定义装备名" style={plusBtn}>+</button>
                  <button onClick={() => owned && cycleEqLv(o.name, slot)} title="强化 0-20" disabled={!owned} style={{ ...cell, cursor: owned ? 'pointer' : 'default', width: 38, padding: '1px 0', fontSize: 12 }}>{eqv(slot).lv || '-'}</button>
                </span>
              ))}
              <button onClick={() => own(o.name, !owned)} style={{ marginLeft: 'auto', padding: '3px 12px', borderRadius: 6, cursor: 'pointer', border: 'none', background: owned ? 'var(--gold)' : 'var(--panel)', color: owned ? '#101216' : 'var(--text)', fontSize: 13, fontWeight: 700 }}>
                {owned ? '已获得' : '未获得'}
              </button>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 6, color: 'var(--dim)', fontSize: 11 }}>提示：技能块点击循环 0→10 · 晋/潜/破 = 下拉 · 装备 Lv 按钮循环强化 0-20 · 「+」可录入下拉里没有的自定义名称（自动记住供以后选择）</div>
    </div>
  )
}
