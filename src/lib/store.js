// localStorage 状态：我的干员 / 刷图记录（ef-roster / ef-farm）
const K = { roster: 'ef-roster', farm: 'ef-farm' }
export const load = (k) => { try { return JSON.parse(localStorage.getItem(K[k])) || {} } catch { return {} } }
export const save = (k, v) => { localStorage.setItem(K[k], JSON.stringify(v)); window.dispatchEvent(new CustomEvent('ef-store-' + k)) }
export const roster = () => load('roster')
export const farm = () => load('farm')
