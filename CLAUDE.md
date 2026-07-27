# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

康立 QMS 新前端(qms-web-new)--基于后端 QMS 7 域全新构建的 Vue 3 前端,严格对齐后端契约。后端在 `QMS-backend/`(Java 21 + Spring Boot 3.3.5,localhost:8080)。

## Commands

```bash
cd C:\Users\18280\Desktop\kangli\QMS-fronted\konliQMS\qms-web-new
pnpm install        # 安装依赖
pnpm dev            # 启动开发服务器 (localhost:5176)
pnpm type-check     # TypeScript 类型检查
pnpm build          # 生产构建
```

## Tech Stack

Vue 3.5 + Vite 6 + TypeScript 5.6 + Element Plus 2.8 + Pinia 2.2 + vue-router 4.4 + axios 1.7 + echarts 5.5 + @antv/g6 5.0

## Architecture

### 项目结构
```
src/
├── main.ts / App.vue              # 入口
├── utils/request.ts               # axios + R<T> 对齐(契约中枢)
├── api/
│   ├── client.ts                  # re-export request
│   ├── types/                     # TS 类型,按域分文件,基于后端实体/DTO
│   │   ├── common.ts              # R<T>, PageResult<T>
│   │   ├── uop.ts / fia.ts / spc.ts / ncm.ts / sqm.ts
│   └── modules/                   # API 模块,按后端 Controller 1:1
│       ├── uop/ (auth, me, users, orgs, roles, menus)
│       ├── fia/ (tasks, approvals, stds, triggers)
│       ├── spc/ (params, subgroups, alarms, chart, rules, capability, collect-tasks)
│       ├── ncm/ (defect-dicts, defect-records, 8d-reports, capas)
│       └── sqm/ (suppliers, abnormals, audits, changes, trace)
├── stores/ (auth, permission)
├── permission/ (directive.ts - v-permission)
├── router/ (index, guard)
├── layouts/ (BasicLayout - topbar + subnav + mega dropdown)
├── styles/ (variables.scss, index.scss - 瑞士精密白主题)
└── views/ (login, dashboard, 404, fia/, spc/, ncm/, sqm/)
```

### 后端契约(必须对齐)
- **R\<T\>** = `{code, msg, data}`, `code===0` 成功,读 **msg** 非 message
- **路径**: `/api/v1/{module}/...`, 前端 baseURL=`/api`, 模块内写 `/v1/...`
- **JWT**: 存 `localStorage['qms_token']`, `Authorization: Bearer <token>`, 无 refresh token
- **401**: 清 token 跳 `/login?redirect=`
- **权限码**: `{module}.{resource}.{action}`, 从 `GET /v1/uop/me` 的 `permissions[]` 注入, `isAdmin = permissions.includes('*')`
- **camelCase** 字段,无 snake→camel 转换
- **vite 代理**: `/api` → `localhost:8080`, 不剥离前缀

### 设计主题
瑞士精密白:钴蓝 #0047ab, 纸白 #f8f7f4, 墨黑 #141414, 发线 #e4e2dd
字体: Archivo(显示), IBM Plex Mono(等宽), Noto Sans SC(中文)
布局: topbar(60px) + subnav(46px) + main(1360px 居中)

### 已建页面
| 域 | 页面 | 状态 |
|---|---|---|
| login | 登录页(左右分屏) | ✓ |
| dashboard | 工作台(mock 数据) | ✓ |
| fia | TaskList, TaskCreate, TaskDetail | 需对照文档重审 |
| spc | ParamList, ChartView, AlarmList | 需对照文档重审 |
| ncm | NcmIndex, DefectDictList, DefectRecordList, 8dList, 8dDetail | 需对照文档重审 |
| sqm | SupplierList, AbnormalList, AuditList, ChangeList | 需对照文档重审 |
| patrol | 未建 | @patrol-flow-reference.md |
| archive | 未建 | @archive-flow-reference.md |
| system | 未建 | @uop-flow-reference.md |

### 参考文档(构建前端唯一依据)
16 份文档在 `../../开发文档/qms-frontend-docs/`:
- 7 份 API 参考(`*-api-reference.md`): 接口路径/方法/权限码/请求体/响应类型
- 7 份流程文档(`*-flow-reference.md`): Mermaid 状态机/时序图/接口调用链/业务规则
- `qms-frontend-conventions.md`: 全局约定(后端契约/权限/字段/分页/表单规则/状态机/路由/样式)
- `qms-field-mapping.md`: 87 个实体/DTO 字段对照表(标注前端处理方式:下拉/隐藏/枚举/自由输入)

编写前端代码前,必须对照对应域的两份文档(API 参考 + 流程文档)。

## Known Issues

- **Element Plus TS 严格类型**: el-select v-model 与 EpPropMergeType 不兼容,部分页面用了 `// @ts-nocheck` 和 `ref<any>` 绕过
- **unplugin 版本**: 升级到最新版(unplugin-auto-import@21, unplugin-vue-components@32)后启动正常,需显式依赖 chokidar@3
- **后端 admin 权限空**: 后端 `seedRbac` 有 `count>0 return` 幂等跳过,admin 可能没关联 sysadmin 角色。已在 `seedExtraPerms` 补幂等分配,需重启后端生效
- **后端命令行编译**: mvn 编译时 Lombok annotation processor 不生效(@Data/@Slf4j 不生成 getter/log),IDE 启动正常
- **后端 ArchiveController**: @PreAuthorize 多一个右括号,两个归档接口 403