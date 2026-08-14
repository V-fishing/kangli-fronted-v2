# AGENTS.md — 康立 QMS 前端（qms-web-new）

> 任何 AI 或开发者在本仓库编写/修改 UI 代码前，**必须先完整阅读** [`docs/UI-DESIGN-SPEC.md`](docs/UI-DESIGN-SPEC.md) 并严格遵守。该规范与视觉基准原型（`C:\Users\18280\Desktop\qms-theme-b-swiss-light.html`）具有最高优先级，高于个人审美偏好。

## 项目概况

康立 QMS（质量过程管理系统）前端。技术栈锁定：Vue 3.5（`<script setup lang="ts">`）· Vite 6 · Element Plus 2.8（已换肤）· SCSS · pnpm · vue-router 4 · Pinia。

常用命令：`pnpm dev`（Vite 代理 `/api` → `:8080`，端口 5174 起、被占用自动递增）· `pnpm build`（`vue-tsc -b && vite build`，必须全绿）。

## 设计体系：Swiss Light · 精密白

纸白底 `#f8f7f4`、墨黑字 `#141414`、发丝线 `#e4e2dd`、钴蓝点睛 `#0047ab`；三字体分工：Archivo（标题/大数）、IBM Plex Mono（编号/数值/时间）、Noto Sans SC（正文）。完整 token、组件库、页面模板、状态映射见规范文档。

## 铁律（违反即打回）

1. 颜色只用 `src/styles/variables.scss` token 表内的值，禁止硬编码新色值。
2. 业务状态一律 `StatusPill`（p-wait/run/sign/lock/done/mute 六变体），禁止裸文字状态。
3. 编号/数值/时间一律 mono 字体；超差红 `hl-red`、达标绿 `c-green`。
4. Element Plus 外观唯一入口是 `src/styles/element.scss`，禁止业务代码 `:deep(.el-*)`。
5. 骨架（BasicLayout / 登录 / 404）已实现，禁止重造；新页面只写内容区，归入规范第 3 章五类模板之一。
6. 动画只用规范白名单（rise / pageout / blink / d8pulse / seggrow / 墨线位移）。
7. 新组件落 `src/components/{shell,common,workflow}/`，class 名保持原型 kebab 命名。
8. `tsconfig.json` 的 `noEmit: true` 禁止移除；禁止在 `src/` 下产出编译 `.js` 影子文件（历史事故根因）。
9. 每次新增**菜单**或**操作按钮**，必须同步在配置模块登记对应权限码：菜单码写 `sys_menu`（动态路由 `menu_code` 取自此处），按钮码写 `sys_role_button`（格式 `{module}.{resource}.{action}`）；前端 `v-permission`/`has()` 引用的码须与库内一致，否则按钮不可见。**后端须同步在 `DataInitializer.seed{Module}Perms()`（及 Flyway 幂等迁移）写入 `sys_menu`/`sys_role_button` 并关联角色，Controller 用 `@PreAuthorize` 校验一致码**（详见后端 `CLAUDE.md` 跨端协同强约束 C1）。禁止只加 UI 不补权限，也禁止硬写死权限绕过守卫。
10. 涉及**指定负责人（推送到个人任务中心）/审核/通知**的功能，必须同步在对应系统管理配置模块登记参数：推送与通知渠道配 `系统管理 › 通知配置`（`src/views/system/NotifyConfig.vue`，按 `module×event_code` 维度）；审核/会签/签批配 `系统管理 › 审核配置`（`src/views/sqm/AuditApprovalConfig.vue`，含供应商会签 + 8D 阶段签批两块）。**后端须同步：指派/审核在 `ApprovalCenterServiceImpl` 加聚合分支并从审核配置读审批人；通知调用前在 `ops.notify_config` 落 `module×event_code` 行（预警扫描照搬 `SqmSupplierCertServiceImpl.scanCertExpiry` 范式）；相关种子走 Flyway 幂等迁移**（详见后端 `CLAUDE.md` 跨端协同强约束 C2）。禁止只写业务代码不补配置项，导致推送无渠道、审核无节点、负责人收不到任务。

## 列表页 UI 范式（统一主题，违反即打回）

依据规范 §5.1（Select/DatePicker 用 EP 已换肤组件）、§5.3（列表页操作列用 EP `link` 按钮）、§3.1（列表页模板），并参照既有列表页（sqm 系列 `ChangeList`/`AuditList`/`SupplierList`/`PerformanceList`）的落地范式。**禁止在列表页「自己造」按钮/下拉/分段控件**（如手写 `<button class="btn-line">`、`<select class="field-input">`、`<input type="date">`、内联 `color:#xxx`）**，违反即打回**。已落地的参考实现：`src/views/tlm/*`（工装台账/维保/异常）。

### 控件映射（强制）

| 场景 | 必须用 | 禁止 |
|------|--------|------|
| 主操作（新增/新建/保存/查询） | `el-button type="primary"`（查询可用默认 `el-button`） | 手写 `<button class="btn-fill">` |
| 列表行内操作（详情/编辑/送修/锁定…） | `el-button link type="primary" size="small"` | 手写 `btn-line`/`<button>` |
| 危险操作（删除/报废） | `el-button link type="danger" size="small"` | 手写红字按钮、硬编码 `#e03616` |
| 状态/类别/类型筛选下拉 | `el-select`（已换肤） | 手写 `<select class="field-input">` |
| 日期筛选/表单日期 | `el-date-picker`（`value-format="YYYY-MM-DD"`） | `<input type="date">` |
| 行内分段切换（全部/类别、锁定/寿命/校准、详情 Tab） | `el-radio-group` + `el-radio-button` | 手写 `btn-line`/`btn-fill` 分段 |
| 空态/占位灰字 | token `$ink-faint`（或 `.mute`） | 硬编码 `#9e9e9e` |

### 布局：搜索区与列表区必须分卡

- 筛选/搜索区域用独立 `el-card card-b filter-bar`（`:body-style="{ padding: '16px 22px' }`），内部用 `el-form :inline="true"` 装关键词输入/状态下拉/查询按钮；分段切换（`el-radio-group`）放在表单下方。
- 列表区域用独立 `el-card card-b`（`:body-style="{ padding: '0' }`），内部只放 `card-head`（标题）+ `el-table` + `el-pagination`，**不要把筛选条塞进同一个卡片**。
- 详情页的信息块/预警块同样用 `el-card card-b`（`:body-style` 控制 padding），禁止手写 `<div class="card-b">`。
- 卡片内的表格/分页无需额外 `card-b` 包裹；分页放在卡片底部 `padding:14px 22px` 的右对齐 `div` 内。

### 操作列收拢（按钮过多时）

当一行操作 ≥ 4 个时，按 sqm 范式收拢，避免突兀：
- **主操作「详情」常驻**：`el-button link type="primary" size="small"`。
- **其余操作收进 `el-dropdown`「更多 ▾」**：`el-dropdown` + `el-dropdown-menu`/`el-dropdown-item`，危险项（删除）用 `divided` 分隔并显式着红（`color:var(--el-color-danger)`，**不硬编码色值**）。
- 下拉命令用 `:command="{ cmd, row }"` 对象传参，在 `@command` 分发函数里 `switch` 调用既有 `openXxx/doXxx(row)`。
- **「详情」与「更多」必须并排同行**：用一个 `display:flex; align-items:center; gap:10px` 的容器包裹二者（否则 `el-table` 的 `.cell` 内 `inline-block` 元素可能换行错位）。
- 所有操作仍走 `perm.has('{module}.{resource}.{action}')` 控制显隐；无权限时下拉不渲染，仅留「详情」。

### 一键自查

列表页写完用以下命令确认无「自己造」的控件：
```
rg -n "btn-line|btn-fill|<select|input type=\"date\"|#[0-9a-fA-F]{3,6}" src/views/<module>
```
结果应为空（分段 Tab、详情内 Tab 已统一为 `el-radio-group`，不再有 `btn-line`/`btn-fill`）。

## 交付自检

提交前过一遍规范 §11 清单：token 无越界、StatusPill 全覆盖、mono 数字、无 `:deep`、1100px 断点降级正常、`pnpm build` 全绿、与原型逐像素对照一致；并过一遍上节「列表页 UI 范式」：搜索区/列表区分卡、`el-` 控件全覆盖、操作列收拢且详情与更多同行、无手写 `btn-line`/`btn-fill`/`<select>`/硬编码色值。
