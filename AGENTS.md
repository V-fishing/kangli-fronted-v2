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

## 交付自检

提交前过一遍规范 §11 清单：token 无越界、StatusPill 全覆盖、mono 数字、无 `:deep`、1100px 断点降级正常、`pnpm build` 全绿、与原型逐像素对照一致。
