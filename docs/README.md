# 塔卫二战术台账（ef-tools）

《明日方舟：终末地》干员练度台账工具（纯前端，localStorage 存储）。
- 线上：https://www.spacesteampunk.cn/endfield/
- 仓库：https://github.com/Icstick/ef-tools（public，ssh.github.com:443 模式）
- 数据：ops.json 图鉴基线 31 名（v3 已补全头像/星级/职业/武器类型/能力值；管理员男女合一 alias 迁移）

## 数据模型（localStorage ef-roster / ef-farm）

```js
每干员 {
  lv: 1-90（上限随 promo: 20/40/60/80/90）, promo: 0-4（精英化 4 段）, pot: 0-5,
  skills: [4 技能 × 0-9], mastery: [0-3]（=技能 10/11/12，9 满解锁）, talents: [6]（好感 4/天赋一 3/天赋二 2/基建一 2/基建二 2/装备适配 3）,
  wpn: { name, lv(0-90), promo(破 0-4), pot(0-5), matrix:{ name, lv:[3×0-6] }, affix:[2×0-9]（词条骨架）, passive: 0-4 },
  eq: { armor/glove/acc1/acc2: { name, fg:[精锻一/二/三 ×0-3] } }
}
```

- 词条区为 UI 骨架（段数自记；名称/词条池待数据）；装备适配档 = 蓝/紫/金品质（1 蓝已确认）
- 天赋为简化手记：游戏内天赋阵列按技能 RANK 段（MAX 3/6/9/专精）解锁节点矩阵；方案 A（2026-09-08 拍板）：自由点击 + 面板软提示 + ops.json 预留 `talentGate:[{max,unlock}]` 字段（有数据时前端自动显示解锁条件）

## 数据源调研（2026-09-06）
- 官方 gamedata/Kengxxiao：无终末地仓库；bwiki/PRTS 无终末地站 → 森空岛 Wiki 页面级采集（scripts/probe-*.mjs，API 带指纹反爬）
- 一图流终末地后端私有；开源仓库已 clone 云服务器 /home/ubuntu/reference/（ef-frontend-v1 + endfield-yituliu-backend，未来数据源候选）
- 图鉴：头像 31/31、星级 31/31；**技能图标待专项**（cos 镜像 skill 精灵图目录需探引用规律）

## 交互
- 技能段条点击置级（0-9 分 3 组）+ 专精三档（9 满解锁）；晋/潜/破 圆点循环；词条/被动段条自记
- 备份 = 顶栏「导出/导入」（全量 JSON roster+farm）；云端同步待接入（可复用 /akdata/ 通道）
- 旧档自动迁移：管理员 alias、talents 旧序（天赋在前）→ 新序（好感度在前）、wpn.matrix 字符串 → 结构化、affix/passive 补默认

## 待办
- [ ] 培养计划 tab（目标/队列/消耗）
- [ ] 技能图标接入
- [ ] 武器/装备图鉴图（词条池/被动数据挖掘）
- [ ] 云同步接入（复用 /akdata/ 通道 + Authelia）
- [ ] talentGate 数据填充（每干员天赋解锁条件）
- [ ] 装备适配紫/金档真实语义补注
- [ ] 天赋硬锁（数据齐全后按方案 A 预留位实现）

## 发布流程
1. `pnpm build`（产物 dist/，hash 文件名）
2. `tar -cf <name>.tar -C dist .` → scp 到云（运维通道 = ZeroTier `ubuntu@10.173.250.63`，公网 22 已关）
3. 云端：`sudo mkdir -p apps/ef/releases/<ts>-<desc> && sudo tar -xf ... -C <release> && sudo ln -sfn <release> apps/ef/current`
4. 验证：curl https://www.spacesteampunk.cn/endfield/ 看 assets hash

线上 release 历史：20260908-talent-note（当前，天赋软提示/方案 A）← 20260908-affix-quality（词条骨架+品质着色）← 20260906170809
回滚：`sudo ln -sfn /home/ubuntu/website/apps/ef/releases/<旧版> /home/ubuntu/website/apps/ef/current`

## e2e
- `node scripts/e2e-v2.mjs`：核心 UI 回归（31 卡/详情/技能/晋升/武器）
- `node scripts/e2e-affix-quality.mjs`：词条区/被动/品质档 + 旧档迁移
- playwright 经 D:/deepseek-harness 主树 .pnpm 引用；channel=msedge
