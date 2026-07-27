# 康立 QMS 前端 UI 设计规范（Swiss Light · 精密白）

> 版本 1.0 · 2026-07-25
> 视觉基准原型：`C:\Users\18280\Desktop\qms-theme-b-swiss-light.html`（以下简称「原型」）
> 适用工程：`qms-web-new`（Vue 3 + TypeScript + Vite + Element Plus + SCSS + pnpm）

---

## 0. 总则

### 0.1 权威级别

1. **原型 HTML 是视觉唯一真相**。本规范是对原型的成文转译；若规范与原型不一致，以原型为准。
2. 本规范高于任何个人审美偏好。AI 或开发者**不得**以「更好看」「更现代」为由偏离规范。
3. 发现规范未覆盖的模式时：先按原型既有风格实现，再回写本规范（提交 PR 说明），禁止即兴发挥。

### 0.2 技术栈（锁定）

Vue 3.5（`<script setup lang="ts">`）· Vite 6 · Element Plus 2.8 · SCSS · pnpm · vue-router 4 · Pinia。
**禁止引入**：其他 UI 框架（Ant Design / Naive / Vuetify 等）、CSS 原子框架（Tailwind / UnoCSS）、jQuery。

### 0.3 设计基调（一句话）

**瑞士精密白**：纸白底、墨黑字、发丝线、钴蓝点睛；等宽字体承载一切编号与数值；克制动效；信息密度高但留白充足。像一份排版精良的德国工业检验报告，不像一个互联网后台。

---

## 1. 设计 Token（唯一取值表）

Token 唯一来源：`src/styles/variables.scss`。组件样式必须 `@use` 引用，**禁止在 SFC 中硬编码任何色值**。

### 1.1 色彩

| Token | 值 | 语义与用途 |
|---|---|---|
| `$paper` | `#f8f7f4` | 页面底色、浅底填充 |
| `$white` | `#ffffff` | 卡片、顶栏、输入框底 |
| `$ink` | `#141414` | 主文本、完成态填充、主按钮（黑底场景） |
| `$ink-soft` | `#5c5c5c` | 次级文本、正文说明 |
| `$ink-faint` | `#9e9e9e` | 弱化文本、占位符、轴刻度 |
| `$hairline` | `#e4e2dd` | 发丝线、卡片边框、表头下边 |
| `$hairline-soft` | `#f2f1ee` | 表格行分隔、更浅的分隔线 |
| `$cobalt` | `#0047ab` | **主色**：进行中、链接、编号、焦点 |
| `$cobalt-dim` | `#eef3fa` | 主色浅底（选中行、代码徽章） |
| `$cobalt-dark` | `#003a8c` | 主色 hover / active |
| `$signal-red` | `#e03616` | 告警、锁定、超差、高风险 |
| `$signal-red-dim` | `#fdf0ed` | 红色浅底 |
| `$amber` | `#c77800` | 待办、预警、挂起 |
| `$amber-dim` | `#fdf6e9` | 琥珀浅底 |
| `$green` | `#1a7f4b` | 达标、完成、有效 |
| `$green-dim` | `#edf7f1` | 绿色浅底 |
| `$purple` | `#6b4fd8` | 审批中（仅此一用途） |
| `$purple-dim` | `#f3f0ff` | 紫色浅底 |

**铁律**：除本表外禁止出现任何 hex / rgb / hsl。需要新颜色 = 规范变更，必须走评审扩表。

### 1.2 字体（三字体分工）

| 角色 | 字体族 | 使用场景 | 字重 |
|---|---|---|---|
| Display | `'Archivo', 'Noto Sans SC', sans-serif` | 页面 H1、统计大数、品牌字、阶段编号（D0–D8） | 700 / 800，大标题 `letter-spacing: -0.3px ~ -1px` |
| Mono | `'IBM Plex Mono', monospace` | 单号、编号、时间、数值、百分比、面包屑、徽章代码、分页、小节标签 | 400 / 500，常配 `letter-spacing: 1px` |
| Body | `'Noto Sans SC', sans-serif` | 其余一切文本 | 300 / 400 / 500 / 600 |

**铁律**：禁止 Inter / Roboto / Arial / 系统默认字体；禁止引入第四种字体。

### 1.3 字号阶（px）

`10`（轨道/栏目标题）`11`（表头、标签、脚注）`12`（徽章、辅助说明）`13`（正文、表格单元格、表单）`14`（卡片标题）`15`（阶段标题、签署姓名）`17`（工作流编号）`28–30`（页面 H1）`32`（统计大数）`44`（登录页大标题）
禁止使用 `16 / 18 / 20 / 24` 等未列入的字号（登录副文案与特殊场景除外，需与原型核对）。

### 1.4 阴影 / 圆角 / 间距

- **阴影只有两级**：`$shadow-sm: 0 1px 3px rgba(20,20,20,0.05)`、`$shadow-md: 0 4px 16px rgba(20,20,20,0.07)`。hover 时 sm → md 升级，禁止其他阴影。
- **圆角**：`4`（标签、小徽章）`6`（按钮、输入框）`8`（步骤项、内嵌小块）`10`（卡内区块、图表容器）`12`（卡片、弹窗）`20`（pill 胶囊）。禁止 16 / 24 等中间值。
- **间距**：8px 基准网格，常用序列 `12 / 14 / 16 / 18 / 20 / 22 / 24 / 28 / 32 / 40`。卡片内边距横向统一 `22px`（头部 `16px 22px`，正文 `20px 22px`）。

### 1.5 动效（白名单制）

| 名称 | 参数 | 场景 |
|---|---|---|
| `rise` | `0.4–0.5s ease both`，兄弟元素以 `0.05s` 阶梯延迟 | 卡片 / 区块入场 |
| `pageout` | `0.16s ease both` | 路由切换离场（配合 `page-enter-active` / `page-leave-active`） |
| 墨线位移 | `0.25s cubic-bezier(0.4,0,0.2,1)` | Tab 指示线、抽屉 |
| `blink` | `1s infinite` | 锁定状态圆点 |
| `d8pulse` | `2s infinite`（钴蓝 box-shadow 呼吸） | 当前工作流步骤 |
| `seggrow` | `1.6s ease infinite alternate` | 当前进度段 |

hover 过渡一律 `0.12–0.2s`；位移仅允许 `translateY(-2px)` 与 `scale(0.985)`（按下）。
**禁止**：bounce / elastic / 3D 翻转 / 视差滚动 / 全屏 loading 炫技动画。

---

## 2. 应用骨架（Shell）

骨架已在 `src/layouts/BasicLayout.vue` 实现，新页面只写内容区，**不得重造骨架**。

```
┌ TopBar 60px（白底，下边发丝线）──────────────────────────────┐
│ [KL] KONLI QMS │ 工作台  首件检验▾  SPC监控▾  不良管理▾ ... │ 日期  头像 │
├ SubNav 46px（白底）────────────────────────────────────────┤
│ [NCM] │ 分组标签  Tab  Tab  Tab ──（滑动墨线 2px 钴蓝）     │
├ Main（paper 底，max-width 1360px 居中，padding 32px 40px）──┤
│ 页面内容                                                     │
└────────────────────────────────────────────────────────────┘
```

- **一级导航**：hover 展开 Mega 下拉（`180ms` 淡入 + 子列 `0.04s` 阶梯）。Mega 头部 = 模块代码徽章（mono 钴蓝底）+ 中文名 + 英文名；正文按分组列排布，条目 = 序号（mono）+ 名称 + 一行描述。
- **二级 Tab 栏**：左侧模块代码 chip，分组以竖线 + mono 标签分隔，选中项下方 2px 钴蓝墨线随点击/窗口宽度平滑移动。
- **模块数据模型**：`{ code, name, en, groups: [{ t, items: [{ n, d, en }] }] }`，模块序：工作台 + FIA / SPC / NCM / SQM / IMD。新增模块必须按此结构注册。

---

## 3. 页面模板（五类，新页面必须归入其一）

### 3.1 列表页（如 8D 报告列表、供应商列表）

```
PageHead（面包屑 + H1 + 右侧操作按钮）
└ el-card.card-b.filter-bar   ← EP inline 表单：来源/状态 select + 查询按钮
└ el-card.card-b
   ├ 工具行（+ 创建 xxx 主按钮）
   ├ el-table（已换肤）
   └ el-pagination（mono 数字，已换肤）
```

规则：编号列 `mono + cobalt`；状态列必须 `StatusPill`；操作列用 EP `link` 按钮；空态用换肤后的 `el-empty`。

### 3.2 详情页（如 8D 详情）

```
PageHead（面包屑 + H1 + 单号 mono.no + 状态 pill + 操作）
└ field-grid（4 列字段头卡：label 11px 灰 + value 14px）
└ 内容卡片组（card-b 纵向排列，间距 18px）
```

### 3.3 工作流页（8D 范式，可复用于任何多阶段流程）

```
PageHead（H1 = 单号 + 阶段 pill；操作：导出 PDF / 催办 / 提交阶段评审）
└ d8-meta（4 列元信息卡）
└ ProgressSegs（9 段：done=墨黑 / current=钴蓝呼吸 / todo=发丝色）+ mono 计数
└ d8-layout（232px 粘性 StepRail + 阶段卡片列）
   ├ StepRail：圆形序号（done=墨底 / current=钴蓝脉冲 / todo=描边）+ 名称，点击平滑滚动，滚动反向高亮
   └ StageCard × N：46px 编号方块 + 中文标题 + 英文 mono 副标 + 状态 pill
       阶段正文按内容选用：TimeLine / TeamGrid / 5W2H / WhyChain / Fishbone / 表格 / VerifyPair / CheckList / SignGrid
```

阶段状态三态：`done`（已完成，墨色）/ `current`（进行中，钴蓝环 + 呼吸）/ `todo`（待启动，正文 `opacity: 0.75`）。

### 3.4 看板页（工作台 / 模块首页）

```
PageHead
└ AlertBar（红色告警条：左 4px 红边 + 浅红底 + mono 关键信息 + 右侧动作）
└ stats-b（5 列统计卡：label 12px 灰 → value 32px display 800 → foot 11px 含涨跌）
└ grid-b（1fr + 320px 双栏：左侧主表格卡，右侧 SPC 迷你图卡 + 待办列表卡）
```

统计卡数值颜色按语义：`c-cobalt / c-amber / c-red / c-green / c-ink`；涨跌用 `up`（绿）/`down`（红）+ 箭头。

### 3.5 登录 / 错误页

登录页左右分栏：左 = 墨黑品牌区（巨型 QMS 水印 4% 白、display 大标题、mono 指标带），右 = 下划线输入表单（无框线，仅 1.5px 底边，聚焦变钴蓝）+ 墨黑全宽按钮。404 页：巨型 `4[0]4`（0 为钴蓝）+ 墨色横线 + mono 英文 + 中文说明。均已实现于 `views/login` 与 `views/404.vue`，禁止重造。

### 3.6 可视化图谱页（物料追溯范式，原型 `#view-trace`）

领域模型（必须照此建模，不得退回单维度批次链）：物料条码 = 批号 + 物料号；三类实体 = 物料 / 半成品 / 成品；成品可由半成品构成、也可由物料直接构成（混合 BOM）；半成品可自制（由物料构成）或外购独立存在。批号是**聚合根**，下挂多个物料行节点，构成「批次 × 物料行」二分图。

```
PageHead（H1 = 功能名 + 关键成品批锁定 pill；操作：导出追溯报告 / 发起召回模拟）
└ 四表页签 tr-tabs：总表(BATCH LEDGER) / 物料表(MATERIAL) / 半成品表(SEMI-FINISHED) / 成品表(FINISHED)
   选中项 = 墨黑文字 + 钴蓝 2px 下划线 + mono 英文副标；右侧内嵌方向分段控件（双向 / 上游来源 / 下游去向）
└ 动态查询栏 tr-bar（按页签渲染）
   · 总表：批号输入 + 追溯按钮 + 示例批号 chips（PL-001/PL-002/BC-A/CP-A）+ 未命中红字
   · 实体表：物料号/半成品号/成品号输入 + 该类目示例 chips + 未命中红字
└ tr-layout（1fr + 320px）
   ├ 图谱卡：SVG 六列二分布局（来料批 / 物料行 / 半成品批 / 半成品行 / 成品批 / 成品行）
   │   批次节点 = 白卡（类型小标 + 批号 mono 钴蓝 + 来源/供应商 + 状态圆点，锁定批左侧红标）
   │   物料行节点 = 纸色卡（物料名称 + `数量 · 批号` mono，强调条码身份）
   │   边 = 包含边(批次→物料行) + 消耗边(物料行→批次，带数量标注)；跨≥2 列长边用 bow 控制点偏移避让中间节点
   │   高亮规则：焦点节点钴蓝描边，子集路径钴蓝加粗，无关节点 opacity 0.22 淡出
   │   底部图例行（批次/物料行方块 + 状态点 + 线样 + 物流方向说明）
   └ 粘性档案面板（top:122px，四页签四种语义）
      · 总表：批次档案 + 上/下游节点统计 + 包含物料行 mini 列表
      · 物料表：来自哪些批次 + 构成哪些半成品/成品（含直接装入成品）
      · 半成品表：构成方式(自制/外购) + 由哪些物料构成 + 产出批次 + 去向成品
      · 成品表：成品批列表(带状态) + 构成拆解(半成品 vs 直接物料分组)
      · mini 行均可点击跨维度导航（批次→总表；物料行→对应实体表）
└ 关系明细表（方向 上游=钴蓝浅底/下游=绿色浅底 + 节点类型 批次|物料行 + 批号·条码 + 名称 + 数量 + 来源·供应商 + 状态点；行可点击切换起点）
```

规则：追溯 = 二分图上双向 BFS（up = 逆边回溯来源、down = 顺边追踪去向、双向取并集）；焦点集在总表为单批号、在实体表为该物料号名下全部物料行；批次节点点击跳总表、物料行节点点击跳对应实体表；图谱用内联 SVG 手绘（§7 图表公约），禁止引入图谱可视化库。

---

## 4. 组件库目录

### 4.1 全局基础类（`src/styles/common.scss`，直接使用 class）

| class | 用途 |
|---|---|
| `.head-b` / `.crumb` / `.head-actions` | 页头：面包屑 + H1（可含 `.no` 单号、`.h1-pill` 状态）+ 操作区 |
| `.btn-fill` / `.btn-line` | 手写按钮：钴蓝实心 / 白底描边（看板、原型场景；表单页用 EP 按钮） |
| `.card-b` / `.card-head` | 白卡 + 卡片头（h2 14px + 右侧 mono `.sub`） |
| `.pill` + `.p-wait/.p-run/.p-sign/.p-lock/.p-done/.p-mute` | 状态胶囊（含 `.d` 圆点） |
| `.tag-b` / `.tag-ctq` | 灰底标签 / CTQ 红标签 |
| `.mono` / `.c-cobalt/.c-amber/.c-red/.c-green/.c-purple/.c-ink` / `.hl-red` | 工具类 |
| `.field-grid` / `.info-row` | 详情字段网格 / 键值行 |
| `.grid-b` / `.right-b` | 1fr+320px 双栏 / 右栏纵排 |
| `.filter-bar` / `.field-input` | 筛选卡间距 / 下划线输入 |
| `.rise` / `.page-enter-active` / `.page-leave-active` | 动效 |

### 4.2 待提取组件（`src/components/`，新页面必须用组件，旧页面改造时逐步提取）

```
src/components/
├ shell/        # 骨架子件（TopBar/MegaNav/SubNav，暂在 BasicLayout 内，稳定后拆出）
├ common/
│   PageHead.vue        props: crumb, title, no?, actions(slot)
│   StatCard.vue        props: label, value, unit?, tone, foot, trend?
│   AlertBar.vue        props: level(red|amber), text, actionText?
│   StatusPill.vue      props: type(wait|run|sign|lock|done|mute), label
│   FieldGrid.vue       props: fields[{l, v, mono?}] 或 slot
│   EmptyB.vue          空状态
└ workflow/
    ProgressSegs.vue    props: total, done, currentLabel?
    StepRail.vue        props: steps[{no, nm, state(done|current|todo)}], active; emit select
    StageCard.vue       props: no, title, en, state, statusLabel?
    TimeLineB.vue       props: items[{tm, tx, hot?}]
    TeamGrid.vue        props: members[{name, role, tag, lead?}]
    WhyChain.vue        props: whys[{lv, tx, root?}]
    FishboneIshikawa.vue props: categories(6M), causes, highlight（SVG 鱼骨图，结构照抄原型）
    VerifyPair.vue      props: label, before, after, target?（红删除线 → 绿新值）
    CheckListB.vue      props: items[{t, s?, done}]
    SignGrid.vue        props: signs[{role, name, status}]
    # —— 物料追溯（原型 #view-trace，四表二分图模型）——
    TraceTabs.vue       props: tab(master|mat|semi|fg), mode(both|up|down); emit tab/mode（四表页签 + 内嵌方向分段控件）
    TraceQBar.vue       props: tab, sel, candidates[]; emit pick/search（按页签动态渲染批号/物料号查询栏 + 示例 chips + 未命中红字）
    TraceGraph.vue      props: batches[], rows[], edges[{f, t, k(in|use), q, bow}], focus:Set, up:Set, down:Set; emit node（SVG 六列二分图谱：批次白卡 + 物料行纸卡 + 包含/消耗边 + 双向 BFS 高亮）
    TracePanel.vue      props: tab, sel, upCount, downCount, payload（粘性档案面板，四页签四种语义；mini 行 emit goto 跨维度导航）
    TraceRelTable.vue   props: rows[{id, dir(up|down), type(批次|物料行), code, name, qty, src, st, goto}]（行可点击切换起点）
```

命名规则：组件文件 PascalCase；组件渲染的 class **保持原型 kebab 命名**（如 `StatusPill` 输出 `class="pill p-run"`），保证与原型像素级一致；一个组件一个根 class。

### 4.3 状态语义映射（StatusPill 六变体，全系统唯一状态表达方式）

| type | class | 语义 | 建议后端枚举 |
|---|---|---|---|
| `wait` | `p-wait` | 待开始 / 待处理 / 待确认 | PENDING / OPEN / WAITING |
| `run` | `p-run` | 进行中 / 确认中 / 检验中 | IN_PROGRESS / CONFIRMING |
| `sign` | `p-sign` | 审批中 / 签署中 | APPROVING / SIGNING |
| `lock` | `p-lock` | 锁定 / 异常 / 超差 / 高风险（圆点闪烁） | LOCKED / ABNORMAL / HIGH |
| `done` | `p-done` | 已完成 / 已闭环 / 有效 | DONE / CLOSED / PASSED |
| `mute` | `p-mute` | 排除 / 失效 / 作废（灰调） | EXCLUDED / VOID / REJECTED |

**铁律**：禁止用裸文字、彩色文字或其他徽章表达业务状态；一律 `StatusPill`。

---

## 5. Element Plus 使用边界

### 5.1 用 EP（已换肤，禁止重造轮子）

Table、Pagination、Form、Input、Select、DatePicker、Dialog、MessageBox、Message、Loading、Empty、Switch、Dropdown、Upload。

### 5.2 手写（原型范式）

应用骨架、页头、统计卡、告警条、状态胶囊、标签、字段网格、全部工作流组件、登录/404。

### 5.3 换肤纪律

- EP 外观调整的**唯一入口**是 `src/styles/element.scss`（变量层在 `index.scss` 的 `:root`）。
- **禁止**在业务 SFC 里用 `:deep()` 覆盖 EP 内部样式；确有必要（element.scss 表达不了）时，改到 element.scss 全局生效，而不是就地打补丁。
- EP 按钮映射：主操作 `type="primary"`（已换肤钴蓝）；次操作默认描边；危险操作 `type="danger"`。`btn-fill/btn-line` 仅用于看板/手写场景。

---

## 6. 数据展示公约

- **一切编号、单号、时间、数值、百分比、CPK、公差** → mono 字体。
- **超差 / 超限 / 未达标** → `.hl-red`（signal-red，500）；**达标 / 改善** → `.c-green`。改善对比统一 `VerifyPair` 范式：旧值红色删除线 → 箭头 → 新值绿色放大。
- 时间格式 `YYYY-MM-DD HH:mm`；剩余天数、耗时用 mono；超时耗时标红（`.elapsed-b.over` 范式）。
- 表格分工：**列表页用 EP Table**（分页、排序、固定列）；**看板 / 卡片内嵌用原生 table**（`.card-b table` 样式已备：纸色表头、发丝线、行 hover `#fafaf8`）。
- 数值对齐：表格中数值列右对齐或等宽 mono 自然对齐，禁止比例字体裸排数字。

---

## 7. 图表公约

优先内联 SVG（原型范式：SPC 控制图、CPK 柱图、鱼骨图均为手绘 SVG，线宽 1–1.5px）。
若引入 ECharts（SPC 模块可选），必须套用以下主题：背景透明；网格线 `$hairline-soft`；轴标签 `$ink-faint` 11px mono；主序列 `$cobalt`；对照/历史 `$ink-faint`；告警点/超限 `$signal-red`；达标区 `$green`；控制限虚线；**禁止渐变填充、禁止 3D、禁止圆角柱体**（面积图可用 `$cobalt-dim` 平铺底）。

---

## 8. 响应式

桌面优先，**唯一断点 `1100px`**，降级规则照原型：

- `grid-b` / `d8-layout` 双栏 → 单栏；StepRail 隐藏
- `stats-b` 5 列 → 3 列；`d8-meta` / `field-grid` 4 列 → 2 列
- 团队网格 3 → 2 列；验证区、检查单、签署区 → 1 列
- 登录页左栏隐藏

不做移动端适配（<768px 不在本项目范围）。

---

## 9. 工程约定

- **目录职责**：
  - `src/styles/variables.scss` — Token 唯一来源，只放变量
  - `src/styles/index.scss` — 全局重置 + EP `:root` 变量覆盖
  - `src/styles/element.scss` — EP 组件级覆盖唯一入口
  - `src/styles/common.scss` — 全局公共类（4.1 表）
  - `src/views/{module}/` — 页面；`src/components/{shell,common,workflow}/` — 组件
- **SFC 写法**：`<script setup lang="ts">`；props 用 `defineProps<T>()`；组件事件 kebab-case；页面级数据走 `src/api/` + Pinia store。
- **接口约定**：响应包装 `R<T> = { code, msg, data }`；路径 `/api/v1/{module}/...`；JWT 无状态鉴权（沿用 `src/permission/`）。
- **构建红线**：`pnpm build`（`vue-tsc -b && vite build`）必须全绿。`tsconfig.json` 的 `noEmit: true` 是防止编译产物污染源码目录的关键配置，**禁止移除**；禁止在源码目录手动运行 `tsc`/`vue-tsc` 产出 `.js`。
- 开发：`pnpm dev`（Vite 代理 `/api` → `:8080`）。

---

## 10. 红线清单（MUST NOT）

1. 禁止使用 Token 表之外的颜色（含渐变、阴影色、图表色）。
2. 禁止使用三字体之外的字体；禁止 Inter / Roboto / Arial。
3. 禁止自造动画（白名单外）；禁止 bounce / 视差 / 3D。
4. 禁止圆角 > 12px（pill 20 / 头像圆形除外）。
5. 禁止在业务代码 `:deep()` 改 EP；EP 换肤只进 element.scss。
6. 禁止用裸文字表达业务状态；禁止彩色图标泛滥（图标单色，取墨色或语义色）。
7. 禁止重造骨架（TopBar / SubNav / 登录 / 404 已有实现）。
8. 禁止紫色渐变白底、玻璃拟态、emoji 装饰等「通用 AI 审美」。
9. 禁止在 `src/` 下产出编译 `.js` 影子文件（见 9. 构建红线）。
10. 禁止引入规范外的第三方 UI / CSS 库。

---

## 11. AI 交付自检清单（Definition of Done）

每次提交 UI 代码前逐项确认：

- [ ] 所有色值来自 Token 表（`grep -E "#[0-9a-fA-F]{3,6}" src/` 无表外新增）
- [ ] 字体仅三种；编号/数值/时间已用 mono
- [ ] 页面使用 `PageHead`；业务状态使用 `StatusPill`
- [ ] 页面归入五类模板之一；骨架未重造
- [ ] EP 外观未被 `:deep()` 就地篡改
- [ ] 动画来自白名单；入场用 `rise` 阶梯延迟
- [ ] 1100px 断点降级正常
- [ ] 与原型同类页面逐像素对照，视觉一致
- [ ] `pnpm build` 全绿，无新增告警

---

## 附录 A：原型关键结构索引

| 原型区块 | 对应实现位置 |
|---|---|
| 登录页（墨黑品牌区 + 下划线表单） | `views/login/` |
| TopBar + Mega 下拉 + SubNav 墨线 | `layouts/BasicLayout.vue` |
| 工作台看板（告警条 / 统计卡 / 双栏） | `views/dashboard/index.vue` |
| 列表页范式（筛选 + EP 表格） | `views/ncm/8dList.vue` |
| 详情/工作流范式（field-grid + 步骤流） | `views/ncm/8dDetail.vue` + 原型 `#view-8d` |
| 可视化图谱范式（四表二分图 · 批次×物料行 + 双向追溯） | 原型 `#view-trace`（追溯查询模块 · 正向/反向/追溯树） |
| 404 | `views/404.vue` |

## 附录 B：新页面 SFC 起步模板

```vue
<template>
  <div class="page">
    <!-- 页头 -->
    <div class="head-b">
      <div>
        <div class="crumb mono">NCM / 不良管理 / 8D 报告</div>
        <h1 class="font-display">8D 报告 <span class="mono no">8D-2026-0724-02</span></h1>
      </div>
      <div class="head-actions">
        <button class="btn-line">导出 PDF</button>
        <button class="btn-fill">提交评审</button>
      </div>
    </div>

    <!-- 字段头卡 -->
    <div class="field-grid rise">
      <div class="field"><div class="l">触发来源</div><div class="v">首检不合格 · WO-260724-003</div></div>
      <div class="field"><div class="l">当前阶段</div><div class="v"><span class="pill p-run"><span class="d"></span>D4 根因分析</span></div></div>
      <div class="field"><div class="l">要求关闭日</div><div class="v mono">2026-08-07</div></div>
      <div class="field"><div class="l">组长</div><div class="v">陈敏 · 质量工程</div></div>
    </div>

    <!-- 内容卡 -->
    <div class="card-b rise">
      <div class="card-head"><h2>围堵措施</h2><span class="sub">D3 · 4 项全部完成</span></div>
      <!-- EP table 或原生 table -->
    </div>
  </div>
</template>

<script setup lang="ts">
// 数据经 src/api/ 获取；状态枚举 → StatusPill type 的映射放在常量文件
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
.page { animation: rise 0.4s ease both; }
/* 仅允许引用 $token；禁止新色值 */
</style>
```

## 附录 C：规范扩展流程

1. 遇到规范未覆盖的样式需求 → 先回原型找同类模式；
2. 原型也没有 → 按「基调」（§0.3）设计草案，Token 内取色；
3. 草案经确认后，**先更新本规范与 `variables.scss` / `common.scss`，再写业务代码**；
4. 任何 Token 新增 / 修改在 PR 描述中单独列出。
