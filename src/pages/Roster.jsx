import React, { useMemo, useState } from 'react'
import { roster, save } from '../lib/store'

const blank = () => ({
  lv: 1, cap: 40, promo: 0, pot: 0,
  skills: [0, 0, 0, 0],
  wpn: { name: '', lv: 0, promo: 0, matrix: '' },
  eq: { armor: { name: '', lv: 0 }, glove: { name: '', lv: 0 }, acc1: { name: '', lv: 0 }, acc2: { name: '', lv: 0 } },
})
const EQ_SLOTS = [['armor', '护甲'], ['glove', '护手'], ['acc1', '配件1'], ['acc2', '配件2']]
const SKILL_LABEL = ['普通攻击', '战技', '连携技', '终结技']
const selS = { border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '2px 6px', fontSize: 13 }
const inpS = { ...selS, minWidth: 0 }

export default function RosterPage({ ops, lists }) {
  const [my, setMy] = useState(roster)
  const [q, setQ] = useState('')
  const [ownF, setOwnF] = useState('all')
  const [sel, setSel] = useState(null)
  const [detailTab, setDetailTab] = useState('skills')
  const [wExtra, setWExtra] = useState({})
  const set = (name, patch) => { const m = { ...my, [name]: { ...blank(), ...(my[name] || {}), ...patch } }; setMy(m); save('roster', m) }
  const setDeep = (name, path, val) => {
    if (path.length === 1) return set(name, { [path[0]]: val })
    const base = blank()[path[0]]
    const cur = (my[name] && my[name][path[0]]) || {}
    set(name, { [path[0]]: { ...base, ...cur, [path[1]]: val } })
  }
  const own = (name, val) => { const m = { ...my }; if (val) m[name] = my[name] || blank(); else delete m[name]; setMy(m); save('roster', m) }
  const setSkill = (name, idx, lv) => {
    const sk = Array.isArray(my[name]?.skills) ? [...my[name].skills] : [0, 0, 0, 0]
    sk[idx] = Math.max(0, Math.min(10, lv))
    set(name, { skills: sk })
  }
  const eqv = (d, slot) => (d.eq && d.eq[slot]) || { name: '', lv: 0 }
  const remember = (kind, v) => { if (!v) return; const k = kind + 's'; const cur = wExtra[k] || []; if (!cur.includes(v)) setWExtra({ ...wExtra, [k]: [...cur, v].slice(-30) }) }
  const options = (kind, seed) => [...new Set([...(seed || []), ...(wExtra[kind + 's'] || [])])].filter(Boolean)
  const customOf = (kind, apply) => {
    const v = window.prompt('输入自定义' + (kind === 'weapon' ? '武器' : kind === 'equip' ? '装备' : '基质') + '名称：')
    if (v && v.trim()) { const nv = v.trim(); remember(kind, nv); apply(nv) }
  }
  const list = useMemo(() => Object.values(ops)
    .filter(o => !q || o.name.includes(q))
    .filter(o => ownF === 'all' ? true : ownF === 'own' ? !!my[o.name] : !my[o.name])
    .sort((a, b) => (b.star || 0) - (a.star || 0) || a.name.localeCompare(b.name, 'zh')), [ops, q, ownF, my])
  const ownedN = Object.keys(my).length
  const selOp = sel && ops[sel] ? ops[sel] : null
  const d = selOp && my[sel] ? my[sel] : blank()
  const selOwned = selOp ? !!my[sel] : false
  return (
    <div className="workspace" style={{ display: 'flex', gap: 18, padding: '22px 36px', alignItems: 'flex-start' }}>
      {/* 左：图鉴档案卡网格 */}
      <section className="roster" style={{ flex: '0 0 400px', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>干员图鉴</h2>
          <span className="count" style={{ font: '12px var(--mono)', color: 'var(--sub)' }}>{list.filter(o => my[o.name]).length} / {Object.keys(ops).length}</span>
        </div>
        <div className="collection-progress" style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 10 }}>
          已获得 {Math.round((ownedN / Math.max(1, Object.keys(ops).length)) * 100)}% · 共 {ownedN} 名
        </div>
        <div className="search" style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索干员名称" style={{ flex: 1, ...inpS, padding: '7px 10px' }} />
          <select value={ownF} onChange={e => setOwnF(e.target.value)} style={{ ...selS, padding: '7px 6px' }}>
            <option value="all">全部</option>
            <option value="own">已获得</option>
            <option value="not">未获得</option>
          </select>
        </div>
        <div className="operator-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingBottom: 10 }}>
          {list.map(o => {
            const owned = !!my[o.name]
            const st = my[o.name] || {}
            const star = o.star || 0
            return (
              <button key={o.name} onClick={() => { setSel(o.name); if (!owned) { own(o.name, true); setSel(o.name) } }}
                className={'operator-card' + (sel === o.name ? ' selected' : '')}
                style={{ textAlign: 'left', padding: 0, border: '2px solid ' + (sel === o.name ? 'var(--yellow)' : 'var(--line)'), background: 'var(--paper)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }}>
                <span className="card-art" style={{ position: 'relative', display: 'block', height: 110, background: 'var(--background)' }}>
                  {o.avatar
                    ? <img src={o.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: owned ? 'none' : 'grayscale(1) opacity(.55)' }} />
                    : <span style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--sub)', fontSize: 34, fontWeight: 800, background: 'var(--background)', filter: owned ? 'none' : 'grayscale(1) opacity(.5)' }}>{o.name[0]}</span>}
                  <span className="rarity" style={{ position: 'absolute', top: 5, left: 5, color: 'var(--yellow)', fontSize: 9, letterSpacing: 1, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
                    {star ? '◆'.repeat(Math.min(star, 6)) : ''}
                  </span>
                </span>
                <span className="card-caption" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 9px', background: owned ? 'var(--yellow)' : '#e2e4dc', color: 'var(--ink)' }}>
                  <strong style={{ fontSize: 14 }}>{o.name}</strong>
                  <small style={{ font: '11px var(--mono)', fontWeight: 700 }}>{owned ? 'Lv.' + (st.lv ?? 1) : '未获得'}</small>
                </span>
              </button>
            )
          })}
        </div>
      </section>
      {/* 右：详情 */}
      <main className="dossier" style={{ flex: 1, minWidth: 0 }}>
        {!selOp && <div className="empty" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--sub)' }}>← 从图鉴选择一名干员查看与编辑练度<br /><small style={{ font: '11px var(--mono)' }}>OPERATOR ARCHIVE / LOCAL</small></div>}
        {selOp && (
          <>
            <div className="breadcrumb" style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 8 }}>干员档案 &gt; {selOp.name}</div>
            <div className="identity" style={{ display: 'flex', background: 'var(--paper)', border: '1px solid var(--line)', minHeight: 220 }}>
              <div className="identity-grid" style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="dossier-code" style={{ font: '12px var(--mono)', color: 'var(--sub)', letterSpacing: 2 }}>OPERATOR / {String(Object.keys(ops).indexOf(sel) + 1).padStart(3, '0')}</div>
                <h1 style={{ fontSize: 42, fontWeight: 900, margin: '4px 0 6px', letterSpacing: 2, lineHeight: 1.1 }}>{selOp.name}</h1>
                <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 14, letterSpacing: .5 }}>{[selOp.prof, selOp.sub, selOp.weapon, selOp.camp].filter(Boolean).join(' · ') || '干员档案 / 终末地'}</div>
                <div className="stars" style={{ fontSize: 14, letterSpacing: 3, color: 'var(--ink)', marginBottom: 16 }}>{'◆'.repeat(Math.min(selOp.star || 0, 6)) || <span style={{ color: 'var(--sub)' }}>—</span>}</div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => own(sel, !selOwned)} className="ownership" style={{ background: selOwned ? 'var(--yellow)' : 'transparent', border: '1px solid var(--ink)', padding: '8px 20px', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                    {selOwned ? '✓ 已获得' : '标记已获得'}
                  </button>
                </div>
              </div>
              <div className="identity-portrait" style={{ width: 290, flex: '0 0 290px', background: 'var(--background)', display: 'grid', placeItems: 'center', borderLeft: '1px solid var(--line)', minHeight: 220 }}>
                {selOp.avatar
                  ? <img src={selOp.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 72, fontWeight: 900, color: 'var(--sub)' }}>{selOp.name[0]}</span>}
              </div>
            </div>
            {/* 练度三格 */}
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: '1px solid var(--line)', borderTop: 0, background: 'var(--paper)' }}>
              <div className="level-stat" style={{ padding: '14px 18px', borderRight: '1px solid var(--line)' }}>
                <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>当前等级 / LIMIT</small>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <input type="number" min={1} max={200} value={d.lv} disabled={!selOwned} onChange={e => set(sel, { lv: Math.max(1, Number(e.target.value) || 1) })} style={{ width: 96, fontSize: 48, fontWeight: 900, color: 'var(--yellow)', background: 'transparent', border: 0, borderBottom: '1px dashed var(--line)' }} />
                  <span style={{ fontSize: 20, color: 'var(--sub)' }}>/</span>
                  <input type="number" min={1} max={200} value={d.cap} disabled={!selOwned} title="阶段上限" onChange={e => set(sel, { cap: Math.max(1, Number(e.target.value) || 1) })} style={{ width: 68, fontSize: 22, color: 'var(--sub)', background: 'transparent', border: 0, borderBottom: '1px dashed var(--line)' }} />
                </div>
              </div>
              <div style={{ padding: '14px 18px', borderRight: '1px solid var(--line)' }}>
                <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>晋升 / PROMOTION</small>
                <div style={{ fontSize: 30, fontWeight: 900, margin: '6px 0 8px' }}>{d.promo}<span style={{ fontSize: 15, color: 'var(--sub)' }}> / 6</span></div>
                <div className="diamonds" style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <span key={n} onClick={() => selOwned && set(sel, { promo: n === d.promo ? n - 1 : n })}
                      style={{ width: 12, height: 12, transform: 'rotate(45deg)', background: d.promo >= n ? 'var(--yellow)' : '#dfe2d9', border: '1px solid var(--ink)', cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                  ))}
                </div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>潜能 / POTENTIAL</small>
                <div style={{ fontSize: 30, fontWeight: 900, margin: '6px 0 8px' }}>{d.pot}<span style={{ fontSize: 15, color: 'var(--sub)' }}> / 6</span></div>
                <div className="diamonds" style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <span key={n} onClick={() => selOwned && set(sel, { pot: n === d.pot ? n - 1 : n })}
                      style={{ width: 12, height: 12, transform: 'rotate(45deg)', background: d.pot >= n ? 'var(--yellow)' : '#dfe2d9', border: '1px solid var(--ink)', cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                  ))}
                </div>
              </div>
            </div>
            {/* tabs */}
            <div className="detail-tabs" style={{ marginTop: 14 }}>
              <div className="detail-tab-list" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--ink)', marginBottom: 12 }}>
                {[['skills', '战斗技能'], ['gear', '武器与装备']].map(([id, lb]) => (
                  <button key={id} onClick={() => setDetailTab(id)}
                    style={{ padding: '8px 18px', border: 0, background: 'transparent', cursor: 'pointer', fontWeight: detailTab === id ? 900 : 400, color: detailTab === id ? 'var(--ink)' : 'var(--sub)', borderBottom: detailTab === id ? '3px solid var(--yellow)' : '3px solid transparent' }}>
                    {lb}
                  </button>
                ))}
              </div>
              {detailTab === 'skills' && (
                <div>
                  {[0, 1, 2, 3].map(i => {
                    const lv = (Array.isArray(d.skills) ? d.skills : [0, 0, 0, 0])[i]
                    return (
                      <div key={i} className="skill-row" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 6px', borderBottom: '1px solid var(--line)' }}>
                        <span className="skill-icon" style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--ink)', color: 'var(--yellow)', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, flex: '0 0 46px', border: '2px solid var(--yellow)', boxShadow: '0 0 0 1px var(--ink)' }}>S{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 700 }}>{SKILL_LABEL[i]}</span>
                            <span style={{ font: '11px var(--mono)', letterSpacing: 1 }}>RANK <b style={{ fontSize: 14, color: 'var(--ink)' }}>{lv}</b> / MAX 10</span>
                          </div>
                          <div className="rank-bar" style={{ display: 'flex', gap: 2 }} title="点击分段设置等级（0-10）">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <span key={n} onClick={() => selOwned && setSkill(sel, i, lv === n ? n - 1 : n)}
                                style={{ flex: 1, height: 10, background: lv >= n ? 'var(--yellow)' : '#e2e4dc', border: '1px solid ' + (lv >= n ? 'var(--ink)' : 'var(--line)'), cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {detailTab === 'gear' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--yellow)' }} />
                    <span style={{ font: '11px var(--mono)', letterSpacing: 2, fontWeight: 700 }}>武器 ARMAMENT</span>
                  </div>
                  <div className="weapon-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '12px 12px', border: '1px solid var(--line)', background: 'var(--paper)', borderBottom: '3px solid var(--yellow)' }}>
                    <strong style={{ fontSize: 14, marginRight: 4 }}>武器</strong>
                    <select value={d.wpn.name} disabled={!selOwned} onChange={e => { const v = e.target.value; remember('weapon', v); setDeep(sel, ['wpn', 'name'], v) }} style={selS}>
                      <option value="">— 选择武器 —</option>
                      {options('weapon', lists.weapons).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <button onClick={() => customOf('weapon', v => setDeep(sel, ['wpn', 'name'], v))} title="自定义武器" style={{ ...selS, cursor: 'pointer' }}>＋</button>
                    <span style={{ font: '11px var(--mono)', color: 'var(--sub)' }}>Lv.</span>
                    <input type="number" min={0} max={200} value={d.wpn.lv} disabled={!selOwned} onChange={e => setDeep(sel, ['wpn', 'lv'], Math.max(0, Number(e.target.value) || 0))} style={{ ...inpS, width: 52 }} />
                    <select value={d.wpn.promo} disabled={!selOwned} onChange={e => setDeep(sel, ['wpn', 'promo'], Number(e.target.value))} style={selS}>
                      {[0, 1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>破{p}</option>)}
                    </select>
                    <select value={d.wpn.matrix} disabled={!selOwned} onChange={e => { const v = e.target.value; remember('matrix', v); setDeep(sel, ['wpn', 'matrix'], v) }} style={selS}>
                      <option value="">基质 —</option>
                      {options('matrix', lists.matrix).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <button onClick={() => customOf('matrix', v => setDeep(sel, ['wpn', 'matrix'], v))} style={{ ...selS, cursor: 'pointer' }}>＋</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--yellow)' }} />
                    <span style={{ font: '11px var(--mono)', letterSpacing: 2, fontWeight: 700 }}>防具与配件 EQUIPMENT</span>
                  </div>
                  <div className="equipment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {EQ_SLOTS.map(([slot, labName]) => {
                      const eq = eqv(d, slot)
                      return (
                        <div key={slot} style={{ border: '1px solid var(--line)', background: 'var(--paper)', padding: '10px 12px 12px', borderBottom: '3px solid var(--yellow)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ width: 26, height: 26, borderRadius: '50%', background: eq.name ? 'var(--ink)' : '#e2e4dc', color: eq.name ? 'var(--yellow)' : 'var(--sub)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flex: '0 0 26px' }}>{eq.name ? eq.name[0] : '·'}</span>
                            <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>{labName} / SLOT</small>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select value={eq.name} disabled={!selOwned} onChange={e => { const v = e.target.value; remember('equip', v); setDeep(sel, ['eq', slot], { ...eq, name: v }) }} style={{ ...selS, flex: 1, minWidth: 90, fontSize: 12 }}>
                              <option value="">—</option>
                              {options('equip', lists.equips).map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                            <button onClick={() => customOf('equip', v => setDeep(sel, ['eq', slot], { ...eq, name: v }))} style={{ ...selS, cursor: 'pointer', padding: '2px 7px' }}>＋</button>
                            <span style={{ font: '11px var(--mono)', color: 'var(--sub)' }}>Lv</span>
                            <button onClick={() => selOwned && setDeep(sel, ['eq', slot], { name: eq.name, lv: ((eq.lv || 0) + 1) % 21 })} title="强化 0-20" style={{ width: 40, ...selS, cursor: selOwned ? 'pointer' : 'default', fontWeight: 800, color: eq.lv ? 'var(--ink)' : 'var(--sub)' }}>{eq.lv || '·'}</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
