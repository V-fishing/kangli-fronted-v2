# 康立 QMS 新前端 (qms-web-new)

康立质量管理系统的新版前端，基于 Vue 3 + Vite 6 + Element Plus 构建，采用「瑞士精密白」主题风格。

## 技术栈

- **框架**：Vue 3（`<script setup>` 语法 + Composition API）
- **构建工具**：Vite 6
- **UI 组件库**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **图表**：ECharts 5 / @antv/g6
- **HTTP 客户端**：Axios

## 环境要求

- Node.js ≥ 18
- npm ≥ 9

## 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 5174，监听 0.0.0.0）
npm run dev
```

开发服务器启动后访问 `http://localhost:5174/`。

## 构建与预览

```bash
# 生产构建（类型检查 + 打包，产物输出到 dist/）
npm run build

# 本地预览生产构建（默认端口 4173，代理 /api 到后端 8080）
npm run preview
```

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
├── public/              # 静态资源
├── src/
│   ├── api/             # 接口封装（按模块划分）
│   ├── assets/          # 图片、样式资源
│   ├── components/       # 公共组件
│   ├── layout/          # 布局组件
│   ├── router/          # 路由配置
│   ├── store/           # Pinia 状态
│   ├── styles/          # 全局样式 / 主题变量
│   ├── utils/           # 工具函数
│   ├── views/           # 页面视图（按业务模块划分）
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
└── package.json
```

## 业务模块

- UOP（来料/过程/成品检验）
- FIA（首件检验）
- NCM（不合格品 / 8D）
- SPC（统计过程控制 / CPK）
- SQM（供应商质量管理 / 追溯）
- 巡检（Patrol）
- 档案（Archive）
- 系统管理（角色、权限等）

## 说明

- 自动导入：`unplugin-auto-import` 与 `unplugin-vue-components` 已实现 API 与组件的按需自动引入，生成的 `src/auto-imports.d.ts` 与 `src/components.d.ts` 已被 `.gitignore` 忽略。
- 生产构建如需跳过类型检查（仅打包），可运行 `npx vite build`。
