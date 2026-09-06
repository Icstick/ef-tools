import React, { useEffect, useMemo, useState } from 'react'
import { roster, save } from '../lib/store'

const blank = () => ({
  lv: 1, cap: 90, promo: 0, pot: 0,
  skills: [0, 0, 0, 0],
  mastery: [0, 0, 0, 0],
  talents: [0, 0, 0, 0, 0],
  wpn: { name: '', lv: 0, promo: 0, pot: 0, matrix: { name: '', lv: [0, 0, 0] } },
  eq: { armor: { name: '', lv: 0 }, glove: { name: '', lv: 0 }, acc1: { name: '', lv: 0 }, acc2: { name: '', lv: 0 } },
})
const EQ_SLOTS = [['armor', '护甲'], ['glove', '护手'], ['acc1', '配件·一'], ['acc2', '配件·二']]
const SKILL_LABEL = ['普通攻击', '战技', '连携技', '终结技']
const selS = { border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '2px 6px', fontSize: 12 }
const inpS = { ...selS, minWidth: 0 }
// 基质：兼容旧数据（字符串名）与结构化 { name, lv:[0,0,0] }
const normM = m => (m && typeof m === 'object') ? { name: m.name || '', lv: [0, 1, 2].map(i => Math.max(0, Math.min(6, Number(m.lv && m.lv[i]) || 0))) }
  : { name: (m || ''), lv: [0, 0, 0] }

export default function RosterPage({ ops, lists }) {
  const [my, setMy] = useState(roster)
  const [q, setQ] = useState('')
  const [ownF, setOwnF] = useState('all')
  const [sel, setSel] = useState(null)
  const [gearSel, setGearSel] = useState('wpn')
  const [wExtra, setWExtra] = useState({})
  // 管理员男女合一：alias 存档兼容
  const keyOf = (nm) => { if (my[nm]) return nm; const al = ops[nm] && ops[nm].alias; if (al) { const hit = al.find(a => my[a]); if (hit) return hit } return nm }
  const datOf = (nm) => my[keyOf(nm)] || {}
  const avatarOf = (o) => (o.alias && keyOf(o.name) && keyOf(o.name) !== o.name && o.avatarAlt) ? o.avatarAlt : o.avatar
  const set = (name, patch) => {
    const src = datOf(name)  // 含 alias 迁移
    const m = { ...my }
    delete m[name]
    if (ops[name] && ops[name].alias) ops[name].alias.forEach(a => { delete m[a] })
    m[name] = { ...blank(), ...src, ...patch }
    setMy(m); save('roster', m)
  }
  const setDeep = (name, path, val) => {
    if (path.length === 1) return set(name, { [path[0]]: val })
    const base = blank()[path[0]]
    const cur = (my[name] && my[name][path[0]]) || {}
    set(name, { [path[0]]: { ...base, ...cur, [path[1]]: val } })
  }
  const own = (name, val) => { const m = { ...my }; if (ops[name] && ops[name].alias) ops[name].alias.forEach(a => { delete m[a] }); if (val) m[name] = m[name] || datOf(name) || blank(); else delete m[name]; setMy(m); save('roster', m) }
  // 技能总等级 0-12：0-9 段条，专精=10/11/12（仅 9 满可专精）
  const setSkillT = (name, idx, t) => {
    const raw = datOf(name)
    const sk = Array.isArray(raw.skills) ? [...raw.skills] : [0, 0, 0, 0]
    const ms = Array.isArray(raw.mastery) ? [...raw.mastery] : [0, 0, 0, 0]
    const total = Math.max(0, Math.min(12, t))
    sk[idx] = Math.min(total, 9)
    ms[idx] = total > 9 ? total - 9 : 0
    set(name, { skills: sk, mastery: ms })
  }
  // 顺序：好感度 / 天赋一 / 天赋二 / 基建一 / 基建二 / 装备适配
  const T_MAX = [4, 3, 2, 2, 2, 3]
  const normT = (tl) => {
    const a = Array.isArray(tl) ? [...tl] : []
    if (a.length < 6) {
      // 旧序 [天赋一,天赋二,基建一,基建二,好感度] → 新序迁移
      const old = a; while (old.length < 5) old.push(0)
      a[0] = old[4]; a[1] = old[0]; a[2] = old[1]; a[3] = old[2]; a[4] = old[3]; a[5] = 0
    }
    while (a.length < 6) a.push(0)
    return a.map((v, i) => Math.max(0, Math.min(T_MAX[i] || 4, Number(v) || 0)))
  }
  const setTalent = (name, idx, v) => {
    const tl = normT(my[name]?.talents)
    tl[idx] = Math.max(0, Math.min(T_MAX[idx] || 4, v))
    set(name, { talents: tl })
  }
  const setWpn = (name, patch) => {
    const w0 = blank().wpn, cur = (my[name] && my[name].wpn) || {}
    set(name, { wpn: { ...w0, ...cur, ...patch } })
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
    .filter(o => ownF === 'all' ? true : ownF === 'own' ? !!datOf(o.name) : !datOf(o.name))
    .sort((a, b) => (b.star || 0) - (a.star || 0) || a.name.localeCompare(b.name, 'zh')), [ops, q, ownF, my])
  const ownedN = Object.values(ops).filter(o => datOf(o.name)).length
  const selOp = sel && ops[sel] ? ops[sel] : null
  const d = selOp ? datOf(sel) : blank()
  const selOwned = selOp ? !!datOf(sel) : false
  const [gear, setGear] = useState(null)
  useEffect(() => { let on = true; fetch('data/gear.json').then(r => r.ok ? r.json() : null).then(g => { if (on && g) setGear(g) }).catch(() => {}); return () => { on = false } }, [])
  const GI = 'https://cos.yituliu.cn/endfield/endfielddata/assets/beyond/dynamicassets/gameplay/ui/sprites/itemicon/'
  const nameMap = arr => { const m = new Map(); for (const it of arr || []) if (it && it.name && !m.has(it.name)) m.set(it.name, it); return m }
  const wByN = useMemo(() => nameMap(gear && gear.weapons), [gear])
  const sByN = useMemo(() => { const o = {}; for (const k of ['armor', 'glove', 'acc1', 'acc2']) o[k] = nameMap(gear && gear.slots && gear.slots[k]); return o }, [gear])
  const gemByN = useMemo(() => nameMap(gear && gear.matrix), [gear])
  const iconOf = (slot, nm) => {
    if (!nm || !gear) return ''
    let id = null
    if (slot === 'wpn') { const w = wByN.get(nm); id = w && w.id }
    else { const s = sByN[slot] && sByN[slot].get(nm); id = s && s.id }
    if (id) return GI + id + '.webp'
    const g = gemByN.get(nm)
    if (g) return GI + (String(g.icon || '').indexOf('item_') === 0 ? g.icon : 'item_gem_rarity_' + Math.max(2, Math.min(5, g.rarity || 5))) + '.webp'
    return ''
  }
  const poolOf = (slot, seed) => {
    const fromGear = slot === 'wpn' ? (gear ? gear.weapons.map(w => w.name) : []) : slot === 'matrix' ? (gear ? gear.matrix.map(m => m.name) : []) : (gear ? ((gear.slots[slot] || []).map(x => x.name)) : [])
    const extra = wExtra[slot === 'matrix' ? 'matrixs' : slot === 'wpn' ? 'weapons' : 'equips'] || []
    const cur = slot === 'matrix' ? normM((d.wpn && d.wpn.matrix) ?? '').name : slot === 'wpn' ? ((d.wpn && d.wpn.name) || '') : ((d.eq && d.eq[slot] && d.eq[slot].name) || '')
    return [...new Set([...(seed || []), ...fromGear, ...extra, cur])].filter(Boolean)
  }
  const gearIcons = [
    { id: 'wpn', label: '武器', name: () => (d.wpn && d.wpn.name) || '' },
    ...EQ_SLOTS.map(([id, lb]) => ({ id, label: lb, name: () => (d.eq && d.eq[id] && d.eq[id].name) || '' })),
  ]
  return (
    <div className="workspace" style={{ display: 'flex', gap: 18, padding: '22px 36px', alignItems: 'flex-start' }}>
      {/* 左：图鉴档案卡网格 */}
      <section className="roster" style={{ flex: '0 0 400px', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>干员图鉴</h2>
          <span className="count" style={{ font: '12px var(--mono)', color: 'var(--sub)' }}>{list.filter(o => datOf(o.name)).length} / {Object.keys(ops).length}</span>
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
            const owned = !!datOf(o.name)
            const st = datOf(o.name) || {}
            const star = o.star || 0
            return (
              <button key={o.name} onClick={() => { setSel(o.name); setGearSel('wpn'); if (!owned) { own(o.name, true); setSel(o.name) } }}
                className={'operator-card' + (sel === o.name ? ' selected' : '')}
                style={{ textAlign: 'left', padding: 0, border: '2px solid ' + (sel === o.name ? 'var(--yellow)' : 'var(--line)'), background: 'var(--paper)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }}>
                <span className="card-art" style={{ position: 'relative', display: 'block', height: 110, background: 'var(--background)' }}>
                  {avatarOf(o)
                    ? <img src={avatarOf(o)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: owned ? 'none' : 'grayscale(1) opacity(.55)' }} />
                    : <span style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--sub)', fontSize: 34, fontWeight: 800, background: 'var(--background)', filter: owned ? 'none' : 'grayscale(1) opacity(.5)' }}>{o.name[0]}</span>}

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
            {/* 身份行 */}
            <div className="identity" style={{ display: 'flex', background: 'var(--paper)', border: '1px solid var(--line)', minHeight: 200 }}>
              <div className="identity-grid" style={{ padding: '22px 26px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="dossier-code" style={{ font: '12px var(--mono)', color: 'var(--sub)', letterSpacing: 2 }}>OPERATOR / {String(Object.keys(ops).indexOf(sel) + 1).padStart(3, '0')}</div>
                <h1 style={{ fontSize: 40, fontWeight: 900, margin: '4px 0 6px', letterSpacing: 2, lineHeight: 1.1 }}>{selOp.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 700 }}>{[selOp.prof, selOp.element, selOp.weapon].filter(Boolean).join(' · ') || '干员档案 / 终末地'}</span>
                  {selOp.mainAttr && <span style={{ background: 'var(--ink)', color: 'var(--yellow)', font: '10px var(--mono)', padding: '2px 7px', letterSpacing: 1 }}>主 {selOp.mainAttr}</span>}
                  {selOp.subAttr && <span style={{ border: '1px solid var(--line)', color: 'var(--sub)', font: '10px var(--mono)', padding: '2px 7px' }}>副 {selOp.subAttr}</span>}
                </div>
                <div className="stars" style={{ fontSize: 17, letterSpacing: 4, color: 'var(--yellow)', textShadow: '0 0 0 1px var(--ink), 0 1px 0 rgba(0,0,0,.25)' }}>{'★'.repeat(Math.min(selOp.star || 0, 6)) || <span style={{ color: 'var(--sub)', fontSize: 13 }}>—</span>}</div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => own(sel, !selOwned)} className="ownership" style={{ background: selOwned ? 'var(--yellow)' : 'transparent', border: '1px solid var(--ink)', padding: '7px 18px', fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>
                    {selOwned ? '✓ 已获得' : '标记已获得'}
                  </button>
                </div>
              </div>
              <div className="identity-portrait" style={{ width: 264, flex: '0 0 264px', height: 200, background: 'var(--background)', display: 'grid', placeItems: 'center', borderLeft: '1px solid var(--line)', overflow: 'hidden', alignSelf: 'stretch' }}>
                {avatarOf(selOp)
                  ? <img src={avatarOf(selOp)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 68, fontWeight: 900, color: 'var(--sub)' }}>{selOp.name[0]}</span>}
              </div>
            </div>
            {/* 能力值四维 */}
            {selOp.stats && (selOp.stats.str != null || selOp.stats.agi != null) && (
              <div className="stats-strip" title={selOp.stats.statNote || ''} style={{ display: 'flex', border: '1px solid var(--line)', borderTop: 0, background: 'var(--paper)' }}>
                {[['str', '力量', 'STR'], ['agi', '敏捷', 'AGI'], ['int', '智识', 'INT'], ['wil', '意志', 'WIL']].map(([k, zh, en], idx) => (
                  <div key={k} style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 8, padding: '7px 16px', borderLeft: idx ? '1px solid var(--line)' : 0 }}>
                    <small style={{ font: '9px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>{zh} {en}</small>
                    <b style={{ fontSize: 18, color: selOp.mainAttr === zh ? 'var(--yellow)' : 'var(--ink)', textShadow: selOp.mainAttr === zh ? '0 0 0 #000, 0 0 0 #000' : 'none' }}>{Math.round(selOp.stats[k])}</b>
                    {selOp.mainAttr === zh && <small style={{ font: '9px var(--mono)', color: 'var(--ink)', background: 'var(--yellow)', padding: '0 3px' }}>主</small>}
                  </div>
                ))}
                {selOp.stats.statNote && <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderLeft: '1px solid var(--line)' }}><small style={{ font: '9px var(--mono)', color: 'var(--sub)' }}>{selOp.stats.statNote}</small></div>}
              </div>
            )}
            {/* 练度区：等级+潜能上下合并 | 右侧装备与基质 */}
            <div className="stat-grid" style={{ display: 'flex', border: '1px solid var(--line)', borderTop: 0, background: 'var(--paper)' }}>
              {/* 等级 + 潜能（上下）深块 */}
              <div className="level-stat" style={{ width: 250, flex: '0 0 250px', background: 'var(--ink)', color: 'var(--paper)' }}>
                <div style={{ padding: '14px 20px 12px' }}>
                  <small style={{ font: '10px var(--mono)', color: '#aab0a5', letterSpacing: 2 }}>当前等级 / LEVEL</small>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 0 }}>
                    <input type="number" min={1} max={90} value={Math.min(d.lv, [20, 40, 60, 80, 90][Math.min(d.promo || 0, 4)])} disabled={!selOwned}
                      onChange={e => set(sel, { lv: Math.max(1, Math.min([20, 40, 60, 80, 90][Math.min(d.promo || 0, 4)], Number(e.target.value) || 1)) })}
                      style={{ width: 96, fontSize: 50, fontWeight: 900, color: '#ffffff', background: 'transparent', border: 0, borderBottom: '1px dashed #5d625a', padding: 0 }} />
                    <span style={{ fontSize: 22, color: '#8a8f85' }}>/</span>
                    <span style={{ fontSize: 24, color: '#8a8f85', fontWeight: 700 }}>{[20, 40, 60, 80, 90][Math.min(d.promo || 0, 4)]}</span>
                  </div>
                  <div style={{ font: '10px var(--mono)', color: (d.promo || 0) >= 4 ? '#9db36a' : '#7c8277', letterSpacing: 1, marginTop: 4 }}>{(d.promo || 0) >= 4 ? 'LIMIT 90 · 已解锁' : ['上限 20', '精英化一 → 40', '精英化二 → 60', '精英化三 → 80'][Math.min(d.promo || 0, 3)]}</div>
                </div>
                <div style={{ borderTop: '1px solid #3a3e37', padding: '10px 20px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div>
                    <small style={{ font: '10px var(--mono)', color: '#aab0a5', letterSpacing: 1 }}>潜能</small>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{Math.min(d.pot, 5)}<span style={{ fontSize: 13, color: '#8a8f85' }}> / 5</span></div>
                  </div>
                  <div className="diamonds" style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} onClick={() => selOwned && set(sel, { pot: n === d.pot ? n - 1 : Math.min(n, 5) })}
                        style={{ width: 13, height: 13, transform: 'rotate(45deg)', background: Math.min(d.pot, 5) >= n ? 'var(--yellow)' : '#43473f', border: '1px solid ' + (Math.min(d.pot, 5) >= n ? 'var(--ink)' : '#666b60'), cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* 装备与基质区 */}
              <div className="gear-panel" style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderLeft: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ font: '11px var(--mono)', letterSpacing: 2, fontWeight: 700 }}>装备与基质 / GEAR</span>
                  <small style={{ font: '9px var(--mono)', color: 'var(--sub)' }}>装备无等级 · 精锻为强化项</small>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* 武器块：图标 + 右侧 潜能/基质 */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: '0 0 320px' }}>
                    <div onClick={() => selOwned && setGearSel('wpn')} className={'gear-slot' + (gearSel === 'wpn' ? ' selected' : '')} data-slot="wpn"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: selOwned ? 'pointer' : 'default', padding: 4, border: '2px solid ' + (gearSel === 'wpn' ? 'var(--yellow)' : 'transparent'), borderRadius: 4 }}>
                      <span style={{ width: 72, height: 72, borderRadius: 12, background: (d.wpn && d.wpn.name) ? '#1d201d' : '#e2e4dc', color: (d.wpn && d.wpn.name) ? 'var(--yellow)' : 'var(--sub)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800, border: '1px solid var(--ink)', position: 'relative', overflow: 'hidden' }}>
                        <span style={{ zIndex: 0 }}>{(d.wpn && d.wpn.name) ? (d.wpn.name[0]) : '武'}</span>
                        {(d.wpn && d.wpn.name) && iconOf('wpn', d.wpn.name) && <img src={iconOf('wpn', d.wpn.name)} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4, zIndex: 1 }} />}

                      </span>
                      <span style={{ fontSize: 10, color: 'var(--sub)', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>武器</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <select value={(d.wpn && d.wpn.name) || ''} disabled={!selOwned} onChange={e => { const v = e.target.value; remember('weapon', v); setWpn(sel, { name: v }) }} style={{ ...selS, flex: 1, minWidth: 0, fontSize: 12 }}>
                          <option value="">— 武器 —</option>
                          {poolOf('wpn', lists.weapons).map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <small style={{ font: '11px var(--mono)', color: 'var(--sub)' }}>Lv</small>
                        <input type="number" min={0} max={90} value={Math.min((d.wpn && d.wpn.lv) || 0, [20, 40, 60, 80, 90][Math.min((d.wpn && d.wpn.promo) || 0, 4)])} disabled={!selOwned}
                          onChange={e => setWpn(sel, { lv: Math.max(0, Math.min([20, 40, 60, 80, 90][Math.min((d.wpn && d.wpn.promo) || 0, 4)], Number(e.target.value) || 0)) })}
                          style={{ ...inpS, width: 54, fontSize: 12 }} />
                        <small style={{ font: '10px var(--mono)', color: 'var(--sub)' }}>/{[20, 40, 60, 80, 90][Math.min((d.wpn && d.wpn.promo) || 0, 4)]}</small>
                        {/* 武器突破 4 圆（破 0-4 · 门槛 20/40/60/80 级） */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title={'武器突破 0-4 · 到达 20/40/60/80 级解锁下一档'}>
                          <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>破</small>
                          {[1, 2, 3, 4].map(n => {
                            const promo = Math.min((d.wpn && d.wpn.promo) || 0, 4)
                            const lvNow = (d.wpn && d.wpn.lv) || 0
                            const gate = [20, 40, 60, 80][n - 1]
                            const canUp = lvNow >= gate
                            const clickable = selOwned && (promo === n ? true : canUp)
                            return (
                              <span key={n} onClick={() => clickable && setWpn(sel, { promo: promo === n ? n - 1 : Math.min(n, 4) })}
                                title={(promo >= n ? '突破 ' + n + '（已激活）' : n + ' 阶突破 · 需武器 ' + gate + ' 级' + (canUp && promo < n ? ' · 可突破' : ''))}
                                style={{ width: 13, height: 13, borderRadius: '50%', background: promo >= n ? 'var(--yellow)' : '#dfe2d9', border: '2px solid ' + (promo >= n ? 'var(--ink)' : (canUp ? 'var(--ink)' : 'var(--line)')), cursor: clickable ? 'pointer' : 'default', opacity: promo >= n ? 1 : (canUp ? 1 : .45), display: 'inline-block' }} />
                            )
                          })}
                        </span>
                      </div>
                      {/* 武器潜能 5 圆 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="武器潜能 0-5">
                        <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>潜能</small>
                        <span style={{ font: '13px var(--mono)', fontWeight: 800 }}>{Math.min((d.wpn && d.wpn.pot) || 0, 5)}</span>
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} onClick={() => selOwned && setWpn(sel, { pot: n === (d.wpn && d.wpn.pot) ? n - 1 : Math.min(n, 5) })}
                            style={{ width: 14, height: 14, borderRadius: '50%', background: Math.min((d.wpn && d.wpn.pot) || 0, 5) >= n ? 'var(--yellow)' : '#dfe2d9', border: '2px solid ' + (Math.min((d.wpn && d.wpn.pot) || 0, 5) >= n ? 'var(--ink)' : 'var(--line)'), cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                        ))}
                      </div>
                      {/* 基质：仅三段等级 */}
                      {(() => { const m = normM((d.wpn && d.wpn.matrix) ?? ''); return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <small style={{ font: '10px var(--mono)', color: 'var(--sub)', letterSpacing: 1 }}>基质</small>
                          {[0, 1, 2].map(k => (
                            <span key={k} onClick={() => selOwned && setWpn(sel, { matrix: { ...m, lv: m.lv.map((v, i) => i === k ? ((v + 1) % 7) : v) } })}
                              title={'基质段 ' + (k + 1) + ' 等级（0-6）'} className="matrix-lv"
                              style={{ width: 28, height: 28, display: 'inline-grid', placeItems: 'center', font: 'bold 14px var(--mono)', background: m.lv[k] ? 'var(--yellow)' : '#e2e4dc', color: 'var(--ink)', border: '2px solid var(--ink)', cursor: selOwned ? 'pointer' : 'default' }}>
                              {m.lv[k]}
                            </span>
                          ))}
                        </div>
                      ) })()}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--line)', alignSelf: 'stretch' }} />
                  {/* 装备 4 槽（精锻常显图标右侧） */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 6, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                    {EQ_SLOTS.map(([slot, labName]) => {
                      const eq = eqv(d, slot)
                      const gname = eq.name || ''
                      const act = selOwned
                      const fg = Array.isArray(eq.fg) && eq.fg.length === 3 ? eq.fg : [0, 0, 0]
                      const setFg = (gi, v) => { const nf = fg.slice(); nf[gi] = Math.max(0, Math.min(3, v)); setDeep(sel, ['eq', slot], { ...eq, name: eq.name || '', fg: nf }) }
                      return (
                        <div key={slot} className={'gear-slot' + (gearSel === slot ? ' selected' : '')} data-slot={slot}
                          style={{ display: 'flex', gap: 7, alignItems: 'center', cursor: act ? 'pointer' : 'default', padding: 5, border: '2px solid ' + (gearSel === slot ? 'var(--yellow)' : 'transparent'), borderRadius: 4, flex: '1 1 150px', maxWidth: 170 }}
                          onClick={() => act && setGearSel(slot)}>
                          <span style={{ width: 52, height: 52, flex: '0 0 52px', borderRadius: 9, background: gname ? '#1d201d' : '#e2e4dc', color: gname ? 'var(--yellow)' : 'var(--sub)', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800, border: '1px solid ' + (gname ? 'var(--ink)' : 'var(--line)'), position: 'relative', overflow: 'hidden' }}>
                            <span style={{ zIndex: 0 }}>{gname ? gname[0] : labName[0]}</span>
                            {gname && iconOf(slot, gname) && <img src={iconOf(slot, gname)} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 3, zIndex: 1 }} />}
                          </span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: gname ? 'var(--ink)' : 'var(--sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 92 }} title={gname || labName}>{gname || labName}</span>
                            {['精锻一', '精锻二', '精锻三'].map((lb, gi) => (
                              <span key={lb} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} title={lb + ' ' + fg[gi] + '/3 级'}>
                                <small style={{ font: '8px var(--mono)', color: 'var(--sub)', width: 26, flex: '0 0 26px' }}>{lb}</small>
                                {[1, 2, 3].map(n => (
                                  <span key={n} onClick={e => { e.stopPropagation(); act && setFg(gi, fg[gi] === n ? n - 1 : n) }}
                                    style={{ width: 13, height: 8, background: fg[gi] >= n ? 'var(--yellow)' : '#e6e8df', border: '1px solid ' + (fg[gi] >= n ? 'var(--ink)' : 'var(--line)'), cursor: act ? 'pointer' : 'default', display: 'inline-block' }} />
                                ))}
                              </span>
                            ))}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* 选中装备编辑行：仅名称 */}
                {gearSel !== 'wpn' && (() => {
                  const eq = eqv(d, gearSel)
                  return (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                      <span style={{ font: '10px var(--mono)', color: 'var(--sub)' }}>{(EQ_SLOTS.find(e => e[0] === gearSel) || [])[1]} / SLOT</span>
                      <select value={eq.name} disabled={!selOwned} onChange={e => { const v = e.target.value; remember('equip', v); setDeep(sel, ['eq', gearSel], { ...eq, name: v }) }} style={{ ...selS, flex: '0 1 220px', minWidth: 90, fontSize: 12 }}>
                        <option value="">—</option>
                        {poolOf(gearSel, lists.equips).map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <small style={{ font: '10px var(--mono)', color: 'var(--sub)' }}>装备无等级 · 精锻直接点击右侧图标旁三段</small>
                    </div>
                  )
                })()}
              </div>
            </div>
            {/* 下半：精英化长条 + 天赋技能栏 */}
            <div className="elite-track" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, border: '1px solid var(--line)', background: 'var(--paper)', padding: '10px 16px' }}>
              <span style={{ font: '11px var(--mono)', letterSpacing: 2, fontWeight: 700 }}>精英化 ELITE</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>{Math.min(d.promo, 4)}<span style={{ fontSize: 12, color: 'var(--sub)' }}> / 4</span></span>
              <div style={{ flex: 1, display: 'flex', gap: 5 }}>
                {[1, 2, 3, 4].map(n => (
                  <span key={n} onClick={() => selOwned && set(sel, { promo: n === d.promo ? n - 1 : Math.min(n, 4) })}
                    title={'精英化段 ' + n}
                    className={'elite-seg' + (d.promo >= n ? ' on' : '')}
                    style={{ flex: 1, height: 14, background: d.promo >= n ? 'var(--yellow)' : '#e2e4dc', border: '1px solid ' + (d.promo >= n ? 'var(--ink)' : 'var(--line)'), cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                ))}
              </div>
              <small style={{ font: '9px var(--mono)', color: (d.promo || 0) >= 4 ? '#7c925b' : 'var(--sub)', whiteSpace: 'nowrap' }}>{(d.promo || 0) >= 4 ? '✓ 已解锁等级上限 90' : '点击段位 · 4 阶解锁 90'}</small>
            </div>
            {/* 天赋技能栏 */}
            <div className="skill-panel" style={{ marginTop: 10, border: '1px solid var(--line)', background: 'var(--paper)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 8px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--yellow)' }} />
                <span style={{ font: '11px var(--mono)', letterSpacing: 2, fontWeight: 700 }}>战斗技能 COMBAT SKILLS</span>
              </div>
              <div style={{ padding: '0 16px' }}>
                {[0, 1, 2, 3].map(i => {
                  const lv = (Array.isArray(d.skills) ? d.skills : [0, 0, 0, 0])[i]
                  const ms = (Array.isArray(d.mastery) ? d.mastery : [0, 0, 0, 0])[i]
                  const total = lv >= 9 ? 9 + ms : lv
                  const realName = selOp.skills ? [selOp.skills.normal, selOp.skills.skill, selOp.skills.chain, selOp.skills.ult][i] : null
                  const canMastery = selOwned && lv >= 9
                  return (
                    <div key={i} className="skill-row" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--line)' : 0 }}>
                      <span className="skill-icon" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--ink)', color: 'var(--yellow)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flex: '0 0 44px', border: '2px solid var(--yellow)', boxShadow: '0 0 0 1px var(--ink)' }}>S{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{realName || SKILL_LABEL[i]}{realName && <small style={{ fontWeight: 400, color: 'var(--sub)', fontSize: 11, marginLeft: 8 }}>{SKILL_LABEL[i]}</small>}</span>
                          <span style={{ font: '12px var(--mono)', letterSpacing: 1 }}>{total > 9 ? <>RANK <b style={{ fontSize: 15, color: 'var(--yellow)' }}>{total}</b> / 12</> : lv >= 9 ? 'MAX RANK 9' : <>RANK <b style={{ fontSize: 15 }}>{lv}</b> / 9</>}</span>
                        </div>
                        <div className="rank-bar" style={{ display: 'flex', gap: 8 }} title="点击分段设置等级（0-9）">
                          {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((grp, gi) => (
                            <div key={gi} style={{ display: 'flex', flex: grp.length, gap: 2 }}>
                              {grp.map(n => (
                                <span key={n} onClick={() => selOwned && setSkillT(sel, i, total === n ? n - 1 : n)}
                                  style={{ flex: 1, height: 11, background: total >= n ? 'var(--yellow)' : '#e2e4dc', border: '1px solid ' + (total >= n ? 'var(--ink)' : 'var(--line)'), cursor: selOwned ? 'pointer' : 'default', display: 'inline-block' }} />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* 专精 = 技能 10/11/12（9 满才可点） */}
                      <div className="mastery-col" style={{ flex: '0 0 104px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }} title={lv >= 9 ? '专精等级 = 技能 10/11/12（当前 ' + total + '/12）' : '技能 9 级满后可专精（10/11/12）'}>
                        <small style={{ font: '12px var(--mono)', color: lv >= 9 ? 'var(--ink)' : 'var(--sub)', letterSpacing: 1 }}>专精 {ms}<span style={{ color: 'var(--line)', fontWeight: 400 }}>/3</span></small>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[1, 2, 3].map(n => (
                            <span key={n} onClick={() => canMastery && setSkillT(sel, i, ms === n ? 9 : 9 + n)}
                              style={{ width: 28, height: 20, borderRadius: 3, background: ms >= n ? 'var(--yellow)' : (lv >= 9 ? '#dfe2d9' : '#eceee6'), border: '2px solid ' + (ms >= n ? 'var(--ink)' : (lv >= 9 ? 'var(--line)' : 'var(--line)')), cursor: canMastery ? 'pointer' : 'default', opacity: canMastery ? 1 : .55, display: 'inline-block' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* 天赋·基建·好感 面板（圆形档位） */}
            <div className="talent-panel" style={{ marginTop: 10, border: '1px solid var(--line)', background: 'var(--paper)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 8px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--yellow)' }} />
                <span style={{ font: '11px var(--mono)', letterSpacing: 2, fontWeight: 700 }}>天赋 · 基建 · 好感度 TALENTS</span>
              </div>
              <div style={{ padding: '10px 16px 12px' }}>
                {(() => {
                  const tNames = ((selOp.skills && selOp.skills.talent) || '').split(/[／/，,]/).map(s => s.trim()).filter(Boolean)
                  const tl = normT(d.talents)
                  const defs = [
                    { name: '好感度', max: 4, sub: '好感度增益' },
                    { name: tNames[0] || '天赋一', max: 3, sub: '天赋一' },
                    { name: tNames[1] || '天赋二', max: 2, sub: '天赋二' },
                    { name: '基建一', max: 2, sub: '基建一' },
                    { name: '基建二', max: 2, sub: '基建二' },
                    { name: '装备适配', max: 3, sub: '装备适配 · 穿戴品质档（蓝/紫/金）' },
                  ]
                  return (
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                      {defs.map((row, i) => {
                        const lv = row.readOnly ? Math.min(d.promo || 0, row.max) : tl[i]
                        return (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} title={row.sub + (row.readOnly ? '' : ' · ' + lv + '/' + row.max + ' 档')}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{row.name}</span>
                            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                              {[1, 2, 3, 4].filter(n => n <= row.max).map(n => (
                                <span key={n} onClick={() => !row.readOnly && selOwned && setTalent(sel, i, lv === n ? n - 1 : n)}
                                  style={{ width: 15, height: 15, borderRadius: '50%', background: lv >= n ? 'var(--yellow)' : '#dfe2d9', border: '2px solid ' + (lv >= n ? 'var(--ink)' : 'var(--line)'), cursor: (row.readOnly || !selOwned) ? 'default' : 'pointer', display: 'inline-block' }} />
                              ))}
                            </span>
                          </span>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}