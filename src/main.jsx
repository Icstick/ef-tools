import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import RosterPage from './pages/Roster.jsx'
import FarmPage from './pages/Farm.jsx'
import './styles.css'

const TABS = [
  { id: 'roster', name: '干员档案' },
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
  const doExport = () => {
    const all = JSON.parse(localStorage.getItem('ef-farm') || '{}')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ roster: JSON.parse(localStorage.getItem('ef-roster') || '{}'), farm: all, exportedAt: new Date().toISOString() })], { type: 'application/json' }))
    a.download = 'ef-tools-backup.json'
    a.click()
  }
  const doImport = (e) => {
    const fl = e.target.files?.[0]
    if (!fl) return
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const j = JSON.parse(String(rd.result || ''))
        if (j.roster) { localStorage.setItem('ef-roster', JSON.stringify(j.roster)); window.dispatchEvent(new CustomEvent('ef-store-roster')) }
        if (j.farm) { localStorage.setItem('ef-farm', JSON.stringify(j.farm)); window.dispatchEvent(new CustomEvent('ef-store-farm')) }
        setTimeout(() => location.reload(), 400)
      } catch (err) { alert('导入失败：' + err.message) }
    }
    rd.readAsText(fl, 'utf-8')
    e.target.value = ''
  }
  const rosterN = ops ? Object.keys(JSON.parse(localStorage.getItem('ef-roster') || '{}')).length : 0
  return (
    <div>
      <header className="topbar">
        <div className="brand">
          <span className="brand-symbol">
            <svg width="29" height="29" viewBox="0 0 24 24" fill="none"><path d="M4 14L10 4h10l-4 10H4z" fill="#101010" /><path d="M8 20h12l-4-8H4l4 8z" fill="#101010" opacity=".75" /></svg>
          </span>
          <div><strong>塔卫二战术台账</strong><small>TALOS-II / OPERATOR LEDGER</small></div>
        </div>
        <div className="navigation" style={{ flex: 1, border: 0, background: 'transparent', padding: 0 }}>
          <nav className="main-tabs" style={{ height: 'auto !important' }}>
            {TABS.map(t => (
              <button key={t.id} data-active={tab === t.id ? true : undefined} onClick={() => setTab(t.id)}
                style={{ height: 61, padding: '0 26px', border: 0, background: 'transparent', color: tab === t.id ? 'var(--yellow)' : 'var(--sub)', fontSize: 15, cursor: 'pointer', borderBottom: tab === t.id ? '3px solid var(--yellow)' : '3px solid transparent', background: tab === t.id ? 'var(--ink)' : 'transparent', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {t.name}{t.id === 'roster' && <small style={{ fontSize: 11, opacity: .75 }}>{Object.keys(ops || {}).length}</small>}
              </button>
            ))}
          </nav>
        </div>
        <div className="top-status">
          <i /><span>本地工作区</span><span>·</span><span>数据存于本机浏览器</span>
        </div>
        <div className="backup">
          <button onClick={doExport}>⇩ 导出备份</button>
          <label className="import-button"><span>⇧ 导入</span><input type="file" accept=".json,application/json" onChange={doImport} /></label>
        </div>
      </header>
      <div className="workspace">
        {!ops && <div style={{ padding: 40, color: 'var(--sub)' }}>加载干员数据…</div>}
        {ops && ops.error && <div style={{ padding: 40, color: '#a33' }}>数据加载失败</div>}
        {ops && !ops.error && lists && <>{tab === 'roster' && <RosterPage ops={ops} lists={lists} />}{tab === 'farm' && <FarmPage ops={ops} />}</>}
      </div>
      <footer className="site-footer"><i /><span>本地 / 数据记录</span><span style={{ margin: '0 auto' }}>塔卫二战术档案 · 罗德岛同好工具</span><span>已获得 {rosterN} 名</span></footer>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<App />)
