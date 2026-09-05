import React, { useMemo, useState } from 'react'
import { roster, save } from '../lib/store'

// 每干员练度模型：
// { lv, cap, promo(晋升), pot(潜能 0-6), skills:[s1..s4 0-10], wpn:{lv,promo,matrix}, eq:{armor,glove,acc1,acc2:{n,lv}} }
const blank = () => ({
  lv: 1, cap: 40, promo: 0, pot: 0,
  skills: [0, 0, 0, 0],
  wpn: { lv: 0, promo: 0, matrix: '' },
  eq: { armor: { n: '', lv: 0 }, glove: { n: '', lv: 0 }, acc1: { n: '', lv: 0 }, acc2: { n: '', lv: 0 } },
})
const MATRIX_SUGGEST = ['无瑕基质·效益', '无瑕基质·流转', '无瑕基质·夜幕', '无瑕基质·迸发', '无瑕基质·切骨', '无瑕基质·医疗', '无瑕基质·附术', '无瑕基质·残暴', '无瑕基质·巧技', '无瑕基质·昂扬', '精良基质·', '普通基质·']
const EQ_LABEL = { armor: '护甲', glove: '护手', acc1: '配件1', acc2: '配件2' }
const cell = { background: 'var(--panel2)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 5, padding: '2px 6px', fontSize: 13 }
const small = { fontSize: 12, color: 'var(--muted)' }

export default function RosterPage({ ops }) {
  const [my, setMy] = useState(roster)
  const [q, setQ] = useState('')
  const [ownF, setOwnF] = useState('all')
  const set = (name, patch) => { const m = { ...my, [name]: { ...blank(), ...(my[name] || {}), ...patch } }; setMy(m); save('roster', m) }
  // 深路径写入：以默认值+现有值合并（防未建档/部分建档丢字段，如 eq 的其它槽位）
  const setDeep = (name, path, val) => {
    if (path.length === 1) return set(name, { [path[0]]: val })
    const base = blank()[path[0]]
    const cur = (my[name] && my[name][path[0]]) || {}
    set(name, { [path[0]]: { ...base, ...cur, [path[1]]: val } })
  }
  const own = (name, val) => { const m = { ...my }; if (val) m[name] = my[name] || blank(); else delete m[name]; setMy(m); save('roster', m) }
  const cycle = (name, key, max) => { const cur = my[name]?.[key] || 0; set(name, { [key]: (cur + 1) % (max + 1) }) }
  const cycleSkill = (name, idx) => {
    const s = [...((my[name]?.skills) || [0, 0, 0, 0])]
    s[idx] = ((s[idx] || 0) + 1) % 11
    set(name, { skills: s })
  }
  const cycleEq = (name, slot) => {
    const cur = (my[name]?.eq?.[slot] || { n: '', lv: 0 })
    const next = { ...cur, lv: ((cur.lv || 0) + 1) % 21 } // 0-20
    setDeep(name, ['eq', slot], next)
  }
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
        <span style={{ ...small, marginLeft: 8 }}>已获得 {Object.keys(my).length} / 图鉴 {Object.keys(ops).length}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 'calc(100vh - 170px)', overflowY: 'auto', paddingBottom: 8 }}>
        {list.map(o => {
          const m = my[o.name] || null
          const d = m || blank()
          return (
            <div key={o.name} style={{ border: '1px solid ' + (m ? 'var(--gold2)' : 'var(--line)'), borderRadius: 10, padding: 10, background: m ? 'var(--gold-dim)' : 'var(--panel2)', width: 300, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{o.name}</span>
                {o.star ? <span style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1 }}>{'★'.repeat(Math.min(o.star, 6))}</span> : null}
                {(o.prof || o.weapon) && <span style={{ ...small }}>{[o.prof, o.sub, o.weapon].filter(Boolean).join('·')}</span>}
                <button onClick={() => own(o.name, !m)} style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 5, cursor: 'pointer', border: 'none', background: m ? 'var(--gold)' : 'var(--panel)', color: m ? '#101216' : 'var(--text)', fontSize: 12 }}>
                  {m ? '已获得' : '未获得'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={small}>等级 <input type="number" min={1} max={200} value={d.lv} onChange={e => set(o.name, { lv: Math.max(1, Number(e.target.value) || 1) })} style={{ ...cell, width: 52 }} /></label>
                <span style={small}>/</span>
                <input type="number" min={1} max={200} value={d.cap} onChange={e => set(o.name, { cap: Math.max(1, Number(e.target.value) || 1) })} title="当前阶段等级上限" style={{ ...cell, width: 52 }} />
                <button onClick={() => cycle(o.name, 'promo', 6)} title="晋升/突破阶段" style={{ ...cell, cursor: 'pointer' }}>晋{d.promo}</button>
                <button onClick={() => cycle(o.name, 'pot', 6)} title="潜能" style={{ ...cell, cursor: 'pointer' }}>潜{d.pot}</button>
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={small}>技能</span>
                {[0, 1, 2, 3].map(i => (
                  <span key={i} title={'技能' + (i + 1) + '：点击循环 1-10（0=未练）'} onClick={() => cycleSkill(o.name, i)} style={{ position: 'relative', cursor: 'pointer', width: 24, height: 24, borderRadius: 5, background: 'var(--panel)', border: '1px solid ' + (d.skills[i] ? 'var(--gold)' : 'var(--line)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--muted)' }}>
                    S{i + 1}
                    {d.skills[i] > 0 && <span style={{ position: 'absolute', right: -6, bottom: -6, background: d.skills[i] >= 10 ? 'var(--gold)' : 'var(--panel)', color: d.skills[i] >= 10 ? '#101216' : 'var(--gold)', fontSize: 10, lineHeight: '13px', padding: '0 4px', borderRadius: 7, fontWeight: 700 }}>{d.skills[i]}</span>}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                <span style={small}>武器</span>
                <span style={small}>Lv</span><input type="number" min={0} max={200} value={d.wpn.lv} onChange={e => setDeep(o.name, ['wpn', 'lv'], Math.max(0, Number(e.target.value) || 0))} style={{ ...cell, width: 50 }} />
                <button onClick={() => setDeep(o.name, ['wpn', 'promo'], ((d.wpn.promo || 0) + 1) % 7)} title="武器突破/精炼" style={{ ...cell, cursor: 'pointer' }}>破{d.wpn.promo}</button>
                <input list="matrix-sug" value={d.wpn.matrix} onChange={e => setDeep(o.name, ['wpn', 'matrix'], e.target.value)} placeholder="基质" style={{ ...cell, flex: 1, minWidth: 120 }} />
                <datalist id="matrix-sug">{MATRIX_SUGGEST.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(EQ_LABEL).map(([slot, lab]) => (
                  <span key={slot} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ ...small, width: 34 }}>{lab}</span>
                    <input value={d.eq[slot].n} placeholder="名称" onChange={e => setDeep(o.name, ['eq', slot], { ...d.eq[slot], n: e.target.value })} style={{ ...cell, flex: 1, minWidth: 0, fontSize: 12 }} />
                    <button onClick={() => cycleEq(o.name, slot)} title="装备强化等级 0-20" style={{ ...cell, cursor: 'pointer', width: 40, padding: '1px 0', fontSize: 12 }}>{d.eq[slot].lv || '-'}</button>
                  </span>
                ))}
              </div>
              {m && (o.camp || o.race || o.get) && <div style={{ ...small, fontSize: 11 }}>{[o.race, o.camp, o.get].filter(Boolean).join(' · ')}</div>}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 6, color: 'var(--dim)', fontSize: 11 }}>提示：技能块点击循环 0→1→…→10 · 晋/潜/破 = 点击循环 · 装备按钮 = 强化等级 0-20 · 等级上限随晋升手动调整</div>
    </div>
  )
}
