# 塔卫二战术台账（ef-tools v0.1）

《明日方舟：终末地》干员练度台账工具。线上：https://www.spacesteampunk.cn/endfield/

## 数据模型（localStorage ef-roster / ef-farm，JSON 备份导入导出）
每干员：{ lv, cap(阶段上限，手填), promo(晋升 0-6), pot(潜能 0-6),
  skills:[4 技能 × 0-10], wpn:{lv, promo(突破 0-6), matrix(基质名)},
  eq:{armor, glove, acc1, acc2: { n 名称, lv 强化 0-20 }} }
ops.json：图鉴基线（森空岛官方 Wiki 采集，34 名；星级/职业等字段待补采）

## 数据源调研结论（2026-09-06）
- 官方 gamedata/Kengxxiao：无终末地仓库；bwiki/PRTS：无终末地数据站
- 森空岛 Wiki（wiki.skland.com/endfield）：数据全但 API 带设备指纹 → 页面级采集（scripts/probe-*.mjs）
- 一图流终末地（ef.yituliu.cn）：后端私有；开源仓库已 clone 云服务器 /home/ubuntu/reference/
  · Arknights-yituliu/ef-frontend-v1 + endfield-yituliu-backend（未来数据源候选）
- 工厂产线计算器（factory.ef.yituliu.cn/aef）：暂不实现，参考仓库已存云端

## 交互
- 技能块点击循环 0→1→…→10→0；晋/潜/破 按钮循环；装备按钮 = 强化 0-20；等级/上限手填
- 备份 = 顶栏「导出/导入备份」（全量 JSON）；云端同步待接入（可复用 /akdata/ 通道）

## 部署
nginx /endfield/ alias → apps/ef/releases/<ts> → current 软链（data/index 无缓存）；deploy/deploy-ef.sh
