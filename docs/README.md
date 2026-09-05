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


## 图鉴数据进度（2026-09-06）
- 头像 29/33：一图流 cos 镜像 charicon（icon_chr_*.webp，本地存档 public/data/avatars/）
- 星级 29/33：giftDatabase.json rarity（6★×15/5★×9/4★×5，测试期数据）
- 缺 4 名（噗切娜/提弗洛斯/管理员×2）：新角色未进 yituliu 数据 → 名字首字占位
- 技能图标：待专项（候选路径 = cos 镜像 skill 精灵图目录，需探 makePacks/makeItems 引用规律或游戏 sprite 目录清单；森空岛词条技能区对老角色有图但懒加载反爬）
- 职业/武器类型：weapons.json 有 weaponType 词典键但无中文映射 → 待角色词条补采

## UI v2（2026-09-06 深夜）：Codex demo 视觉移植
- 浅色战术终端风（米白底/明黄/深墨/直角/mono 标签），CSS 层直接复用 demo globals.css（去 tailwind）
- 布局 = 顶栏（黄黑切角品牌标 + 导航 + 导出导入）→ 左干员档案卡网格（2 列头像大卡 + 黄条名/Lv + 左上星级）→ 右详情（OPERATOR 编号 + 大字名 + 头像 + 三格练度[等级/晋升◆6/潜能◆6 点击] + 战斗技能 tab[10 段分段条点击置级] + 武器与装备 tab[下拉+自定义+]）
- 数据模型/备份不变；技能 1-10 制保留；冒烟 e2e-v2.mjs 全 PASS；截图 ocr-samples/ef-v2-demo.png
- 待办：培养计划 tab（目标/队列/消耗 = demo 02 区）、技能图标接入、武器/装备图鉴图（demo 有 equipment.png 参考）
