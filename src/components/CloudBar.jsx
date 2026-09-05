import React, { useState } from 'react'
import { roster, farm } from '../lib/store'

export default function CloudBar() {
  const [st, setSt] = useState('')
  const btn = { background: 'var(--panel2)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 5, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }
  const doExport = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ roster: roster(), farm: farm(), exportedAt: new Date().toISOString() })], { type: 'application/json' }))
    a.download = 'ef-tools-backup.json'
    a.click()
    setSt('已导出备份文件')
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
        setSt('备份导入完成，正在刷新…')
        setTimeout(() => location.reload(), 500)
      } catch (err) { setSt('导入失败：' + err.message) }
    }
    rd.readAsText(fl, 'utf-8')
    e.target.value = ''
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
      <button onClick={doExport} style={btn}>导出备份</button>
      <label style={btn}>导入备份<input type="file" accept=".json,application/json" onChange={doImport} style={{ display: 'none' }} /></label>
      {st && <span style={{ color: 'var(--gold)' }}>{st}</span>}
    </span>
  )
}
