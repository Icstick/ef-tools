import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import RosterPage from './pages/Roster.jsx'
import FarmPage from './pages/Farm.jsx'
import CloudBar from './components/CloudBar.jsx'

const TABS = [
  { id: 'roster', name: '我的干员' },
  { id: 'farm', name: '刷图记录' },
]

function App() {
  const [tab, setTab] = useState('roster')
  const [ops, setOps] = useState(null)
  const [lists, setLists] = useState(null)
  useEffect(() => {
    fetch('data/ops.json').then(r => r.json()).then(setOps).catch(() => setOps({ error: true }))
    fetch('data/lists.json').then(r => r.json()).then(setLists).catch(() => {})
  }, [])
  return (
    <div style={{ padding: 16, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--panel)', padding: '18px 20px', boxShadow: '0 6px 24px rgba(0,0,0,.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: 24, margin: 0, fontWeight: 800, letterSpacing: 1 }}>塔卫二战术台账</h1>
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 2.5 }}>TALOS-II OPERATOR LEDGER</span>
          <span style={{ marginLeft: 'auto' }}><CloudBar /></span>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--line)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '8px 22px', border: 'none', background: 'transparent', color: tab === t.id ? 'var(--gold)' : 'var(--muted)', fontWeight: tab === t.id ? 700 : 400, borderBottom: '2px solid ' + (tab === t.id ? 'var(--gold)' : 'transparent'), cursor: 'pointer', fontSize: 15 }}>
              {t.name}
            </button>
          ))}
        </nav>
        {!ops && <div style={{ color: 'var(--muted)' }}>加载干员数据…</div>}
        {ops && ops.error && <div style={{ color: 'var(--warn)' }}>数据加载失败</div>}
        {ops && !ops.error && lists && <>{tab === 'roster' && <RosterPage ops={ops} lists={lists} />}{tab === 'farm' && <FarmPage />}</>}
      </div>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<App />)
