import React, { useState } from 'react'
import { farm as loadFarm, save } from '../lib/store'

export default function FarmPage() {
  const [rows, setRows] = useState(() => Object.values(loadFarm()))
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const push = () => {
    if (!name.trim()) return
    const f = { ...loadFarm(), [Date.now()]: { id: Date.now(), name: name.trim(), note: note.trim(), date: new Date().toISOString().slice(0, 10) } }
    save('farm', f)
    setRows(Object.values(f))
    setName(''); setNote('')
  }
  const del = (id) => { const f = { ...loadFarm() }; delete f[id]; save('farm', f); setRows(Object.values(f)) }
  const cell = { background: 'var(--panel2)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 5, padding: '4px 8px', fontSize: 13 }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="副本/地点（如：北部禁区 · 能量淤积点）" style={{ ...cell, flex: '1 1 240px' }} />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="备注（目标产物/次数/掉落手记）" style={{ ...cell, flex: '1 1 280px' }} />
        <button onClick={push} style={{ ...cell, cursor: 'pointer', color: 'var(--gold)', fontWeight: 700 }}>添加</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.length === 0 && <div style={{ color: 'var(--dim)', padding: 20, textAlign: 'center' }}>还没有记录——添加你要刷的副本/地点（练度/材料数据请手动记录，后续接入自动数据源）</div>}
        {rows.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--line)', padding: '6px 2px' }}>
            <span style={{ fontWeight: 700, minWidth: 200 }}>{r.name}</span>
            <span style={{ color: 'var(--muted)', flex: 1 }}>{r.note}</span>
            <span style={{ color: 'var(--dim)', fontSize: 12 }}>{r.date}</span>
            <button onClick={() => del(r.id)} style={{ ...cell, cursor: 'pointer', color: 'var(--warn)', padding: '1px 8px' }}>删</button>
          </div>
        ))}
      </div>
    </div>
  )
}
