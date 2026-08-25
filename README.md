# 康立 QMS 新前端 (qms-web-new)

康立质量管理系统(QMS)的新版前端，基于 Vue 3 + Vite 6 + Element Plus 构建，采用「Swiss Light · 精密白」设计体系。

## 技术栈

- **框架**：Vue 3.5（`<script setup lang="ts">` + Composition API）
- **构建工具**：Vite 6
- **UI 组件库**：Element Plus 2.8（已换肤，外观唯一入口 `src/styles/element.scss`）
- **样式**：SCSS（设计 token 见 `src/styles/variables.scss`）
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **图表**：ECharts 5 / @antv/g6
- **HTTP 客户端**：Axios
- **包管理**：pnpm

## 环境要求

- Node.js ≥ 18
- pnpm ≥ 8

## 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认端口 5174，被占用自动递增，监听 0.0.0.0）
pnpm dev
```

开发服务器启动后访问 `http://localhost:5174/`。

## 构建与预览

```bash
# 生产构建（vue-tsc 类型检查 + vite 打包，产物输出到 dist/）
pnpm build

# 本地预览生产构建（默认端口 4173，代理 /api 到后端 8080）
pnpm preview
```

> 生产构建必须全绿（`vue-tsc -b && vite build`）；如需跳过类型检查仅打包，可运行 `npx vite build`。

## 后端接口代理

开发（`server.proxy`）与预览（`preview.proxy`）模式均将 `/api` 请求代理到后端服务：

| 路径前缀 | 转发目标 |
| -------- | -------- |
| `/api`   | `http://localhost:8080` |

> 代理**不剥离** `/api` 前缀，请求直达后端 `/api/v1/...`。
> 生产部署时请按实际环境配置反向代理或 BASE_URL。

## 目录结构

```
qms-web-new/
├── src/
│   ├── api/             # 接口封装（按模块划分，src/api/modules/*.ts）
│   ├── components/      # 公共组件（shell/ 骨架、common/ 通用、workflow/ 流程）
│   ├── composables/     # 组合式函数
│   ├── config/          # 全局配置
│   ├── hooks/           # 自定义 hooks
│   ├── layouts/         # 布局组件（BasicLayout 等）
│   ├── permission/      # 路由守卫 / 按钮级权限指令（v-permission）
│   ├── router/          # 路由配置（动态路由，menu_code 取自 sys_menu）
│   ├── stores/          # Pinia 状态
│   ├── styles/          # 全局样式 / 设计 token（variables.scss / element.scss）
│   ├── utils/           # 工具函数
│   ├── views/           # 页面视图（按业务模块划分）
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
├── package.json
└── pnpm-lock.yaml
```

## 业务模块

- **UOP**（用户组织权限：账号 / 组织 / 角色 / 菜单 / 权限）
- **FIA**（首件检验）
- **SPC**（统计过程控制 / CPK）
- **NCM**（不合格品 / 8D / CAPA）
- **SQM**（供应商质量管理 / 追溯 / 绩效）
- **Patrol**（巡检）
- **Archive**（档案）
- **CS**（客户服务：工单 / 反馈）
- **TLM**（工装管理）
- **QMS 管理**（qms-mgmt）
- **KPI**（指标看板）
- **系统管理**（角色权限、通知配置、审核配置等）
- 仪表盘（dashboard）/ 工作台（workbench）

## 设计体系

遵循「Swiss Light · 精密白」设计规范（详见 `docs/UI-DESIGN-SPEC.md`）：

- 纸白底 `#f8f7f4`、墨黑字 `#141414`、发丝线 `#e4e2dd`、钴蓝点睛 `#0047ab`
- 三字体分工：Archivo（标题/大数）、IBM Plex Mono（编号/数值/时间）、Noto Sans SC（正文）
- 颜色只用 `src/styles/variables.scss` token 表内的值，禁止硬编码新色值
- 业务状态一律 `StatusPill`（p-wait/run/sign/lock/done/mute 六变体）
- Element Plus 外观唯一入口是 `src/styles/element.scss`，禁止业务代码 `:deep(.el-*)`

## 说明

- 自动导入：`unplugin-auto-import` 与 `unplugin-vue-components` 已实现 API 与组件的按需自动引入，生成的 `src/auto-imports.d.ts` 与 `src/components.d.ts` 已被 `.gitignore` 忽略。
- 按钮级权限：`v-permission` 指令 / `perm.has()` 引用权限码（`{module}.{resource}.{action}`），码须与后端 `sys_role_button` 一致。