# QMS 前端全局约定汇总文档

> 生成日期: 2026-07-25 | 数据源: `.openapi.json` + `R.java` + `BaseEntity.java` + `JwtUtil.java` + `application.yml` + 7 域 API 参考文档 + 前端 `request.ts` + `CLAUDE.md`
> 适用: 所有前端开发者，必读

---

## 1. 后端契约

### 1.1 统一响应 R\<T\>

```json
{ "code": 0, "msg": "success", "data": { ... } }
```

- `code=0` 成功，非 0 为错误码
- `code=200` 也兼容为成功(前端 `request.ts` 响应拦截器同时处理 `code===0` 和 `code===200`)
- 读 `msg` 字段，**非 `message`**(后端 `R.java` 字段名为 `msg`)
- 错误时 `data=null`，`msg` 含错误描述
- 业务异常 `code=500`(默认)

### 1.2 路径前缀

- 后端全部接口以 `/api/v1/` 开头
- 前端 **baseURL** = `/api`(Vite 代理 `/api` -> `http://localhost:8080`，不剥离 `/api`)
- 前端 API 模块内写路径时省略 `/api`，从 `/v1/...` 写起
- 示例: `request.get('/v1/fia/tasks')` -> 实际请求 `http://localhost:5173/api/v1/fia/tasks` -> 代理到 `http://localhost:8080/api/v1/fia/tasks`

### 1.3 JWT 认证

- **存储**: `localStorage['qms_token']`
- **请求头**: `Authorization: Bearer <token>`
- **无 refresh token**，token 过期需重新登录
- JWT Claims: `sub`=userId, `username`, `orgId`, `dataScope`
- 有效期: 28800 秒(8 小时)，由 `application.yml` 的 `qms.jwt.expiry` 控制
- 签名算法: HS256，密钥由 `qms.jwt.secret` 注入

### 1.4 401 处理

- **HTTP 401** 或 **业务 code=401** 时:
  1. 清 `localStorage['qms_token']`
  2. 跳转 `/login?redirect=` 携带当前页面路径
  3. **防并发标志位** `redirecting`，避免多个请求同时触发跳转

### 1.5 X-Trace-Id

- 格式: `trace-{Date.now()}-{random(6位)}`
- 示例: `trace-1753420800000-a3kf2m`
- 请求拦截器自动注入，无需手动处理

### 1.6 日期时间格式

- 后端 Jackson 配置: `yyyy-MM-dd HH:mm:ss`，时区 `Asia/Shanghai`
- 前端接收: ISO 8601 字符串(`date-time` 格式) 或 `date` 格式
- 发送: 字符串格式，无需转换

---

## 2. 权限码

### 2.1 格式

```
{module}.{resource}.{action}
```

示例: `fia.task.create`, `spc.param.list`, `ncm.8d.approve`

### 2.2 前端使用方式

- **指令**: `v-permission="'fia.task.create'"` 或 `v-permission="['fia.task.create','fia.task.disposition']"`
- **函数**: `permissionStore.has('fia.task.create')` 或 `hasAny(['...'])`
- **模板**: `store.has(code)`
- **管理员**: `permissions.includes('*')` 或 `isAdmin`

### 2.3 权限码来源

- `GET /api/v1/uop/me` 返回 `CurrentUserVo.permissions[]`(字符串数组)
- 权限码从 `sys_role_menu` + `sys_role_button` 的 `menu_code`/`btn_code` 聚合
- Redis 缓存 key `qms:perms:{userId}`，TTL 30min
- 角色/权限变更后自动清缓存

### 2.4 各域权限码汇总

| 域 | 权限码数 | 示例 |
|-----|---------|------|
| UOP | 12 | `system.user.list`, `system.role.assign`, `system.org.list` |
| FIA | 10 | `fia.task.list`, `fia.sign.inspector`, `fia.std.create` |
| SPC | 8 | `spc.param.list`, `spc.alarm.close`, `spc.subgroup.create` |
| NCM | 17 | `ncm.record.list`, `ncm.8d.advance`, `ncm.capa.close` |
| SQM | 20 | `sqm.supplier.list`, `sqm.audit.create`, `sqm.change.approve` |
| Patrol | 5 | `patrol.route.list`, `patrol.task.create` |
| Archive | 2 | `archive.record.list` |

---

## 3. 多分公司

### 3.1 模型

- 公司 = 顶级 org(`org_type='公司'`，如梅州 MZ/深圳 SZ)
- 用户 `orgId=null` = 跨公司管理员(dataScope=all，看全部数据)
- 用户 `orgId=UUID` = 普通用户(仅看本公司数据，dataScope 等于该 orgId)

### 3.2 前端处理

- 登录后从 `auth.user.orgId` 取当前用户公司
- 跨公司管理员无需选择公司(但前端可能展示公司切换器)
- 普通用户所有表单中 `orgId` **隐藏，自动填** `auth.user.orgId`
- 列表/查询接口后端 DataScopeInterceptor 自动按 `org_id` 过滤 SELECT

### 3.3 后端处理

- `OrgIdResolver`: 普通用户强制取本公司 orgId，管理员可传任意 orgId
- `DataScopeInterceptor`: MyBatis-Plus SQL 改写，非管理员用户的 SELECT 自动追加 `org_id = '<dataScope>'`
- 管理员(dataScope=all)不过滤，看到全部数据

---

## 4. 字段约定

### 4.1 命名

- **camelCase**(驼峰)，无 snake_case 到 camelCase 转换
- 后端 MyBatis-Plus 配置 `map-underscore-to-camel-case: true` 自动转换
- 前端收到的 JSON 字段直接是 camelCase

### 4.2 类型映射

| 后端类型 | JSON 类型 | 前端 TS 类型 |
|---------|----------|-------------|
| String | string | `string` |
| UUID | string | `string` |
| Integer/Long | integer(int32/int64) | `number` |
| BigDecimal/Double | number | `number` |
| Boolean | boolean | `boolean` |
| LocalDateTime | string(date-time) | `string` (ISO 8601) |
| LocalDate | string(date) | `string` (YYYY-MM-DD) |
| LocalTime | object({hour,minute,second,nano}) | `LocalTime` |
| Array | array | `T[]` |

### 4.3 BaseEntity 审计字段(只读)

所有继承 BaseEntity 的实体都包含以下字段，**前端只读，不传**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | UUIDv7 主键，后端自动生成 |
| `createdAt` | string(date-time) | 创建时间，自动填充 |
| `updatedAt` | string(date-time) | 更新时间，自动填充 |
| `createdBy` | string | 创建人 ID，自动填充 |
| `updatedBy` | string | 更新人 ID，自动填充 |
| `isDeleted` | boolean | 软删除标志，后端自动管理 |
| `version` | integer | 乐观锁版本号，后端自动管理 |

### 4.4 业务实体额外字段

所有业务实体还包含 `orgId`(string)，由 BaseEntity 子类自行声明，前端按 3.2 规则处理。

---

## 5. 分页

### 5.1 请求

```json
{ "page": 1, "size": 20 }
```

- `page`: 页码，从 1 开始
- `size`: 每页条数，默认 20
- 部分接口使用 Query 参数: `?page=1&size=20`

### 5.2 响应

```json
{
  "records": [ ... ],
  "total": 150,
  "page": 1,
  "size": 20
}
```

- `PageResult<T>`: `{ records: T[], total: number, page: number, size: number }`

---

## 6. 前端表单规则

### 6.1 orgId 处理

- **全部隐藏**，取 `auth.user.orgId`
- 跨公司管理员可能需手动选择(如切换公司视角)

### 6.2 后端自动处理的字段(前端不传)

通用规则:
- `id`: 创建时不传，后端自动生成 UUIDv7
- `createdAt`/`updatedAt`/`createdBy`/`updatedBy`/`isDeleted`/`version`: 全部不传
- `orgId`: 自动从登录上下文注入
- 编码类字段(如 `code`, `defectNo`, `taskNo`): 后端自动生成，前端不传
- 状态类字段(如 `status`): 创建时后端设默认值，前端不传
- 各域具体自动填充字段见 [qms-field-mapping.md](./qms-field-mapping.md)

### 6.3 下拉数据源

- **有后端列表接口的字段**: 做下拉，调用 GET 列表接口
- **无接口的字段**: 自由输入，标注"等补接口"
- 示例:
  - `triggerType` -> 下拉 -> `GET /v1/fia/triggers`
  - `stdId` -> 下拉 -> `GET /v1/fia/stds`
  - `woNo` -> 自由输入 -> 无列表接口

### 6.4 枚举字段

- 做下拉，值从后端代码/字典提取
- 常见枚举: `severity`(严重/一般), `status`(各域状态枚举), `disposition`(处置方式), `source`(来源)
- 字典数据源: `GET /api/v1/dict`(全量) 或 `GET /api/v1/dict/{type}`(按类型)

---

## 7. 状态机

### 7.1 通用规则

- 每个实体 `status` 字段对应一组状态值
- 前端需实现:
  - **状态色标映射**: 不同状态对应不同颜色 pill/tag
  - **条件按钮**: 按当前状态显隐操作按钮
  - **状态筛选下拉**: 列表页按状态筛选

### 7.2 状态色标约定

| 状态类别 | 颜色 | 色值 | 适用状态 |
|---------|------|------|---------|
| 待处理 | 琥珀 | `#f59e0b` | 待检/待处理/待复核/待审批/待申请/待确认 |
| 进行中 | 钴蓝 | `#0047ab` | 进行中/分析中/审批中/整改中/实施中 |
| 待签名 | 紫色 | `#7c3aed` | 待批准(三级签名) |
| 锁定/不合格 | 红色 | `#dc2626` | 锁定/不合格/已驳回/超时/已作废/报警 |
| 通过/完成 | 绿色 | `#16a34a` | 已完成/已通过/已闭环/已关闭/合格/正常 |

### 7.3 各域状态机

详细状态流转见各域 flow-reference.md:
- **FIA**: 9 态(待检/进行中/待复核/待批准/审批中/已完成/超时/已作废/已驳回)
- **SPC 告警**: 2 态(待确认/已关闭)
- **NCM 8D**: D1-D8 阶段推进 + 审批关(D3/D5/D7)
- **NCM CAPA**: 6 态(待启动/分析中/待审批/实施中/已验证/已关闭)
- **SQM 审核**: 4 态(计划中/待执行/进行中/已完成)
- **SQM 变更**: 5 态(待申请/审批中/已批准/已驳回/已关闭)
- **SQM FMEA**: 4 态(创建/待闭环/进行中/已闭环)
- **Patrol**: 3 态(待执行/进行中/已完成)

---

## 8. 路由

### 8.1 静态路由

- `/login`: 登录页
- `/dashboard` 或 `/overview`: 首页/概览
- `/404`: 404 页面
- `/company-select`: 公司选择页(多公司模式)

### 8.2 动态路由

- 从 `GET /api/v1/uop/menus/tree` 构建菜单树
- 前端根据 `menuCode` -> `component` 映射懒加载 Vue 组件
- 需在 `buildDynamicRoutes()` 中 `router.addRoute()`

### 8.3 路由守卫

- **登录守卫**: 无 token -> `/login`
- **恢复守卫**: 有 token 无 user info -> 调用 `GET /v1/uop/me` 恢复
- **公司选择守卫**: 有 token 但未选公司 -> `/company-select`
- **权限守卫**: 模块级(路由级)/卡片级/按钮级(指令)

---

## 9. 样式

### 9.1 设计系统

**瑞士精密白** 风格:

| 色板 | 色值 | 用途 |
|------|------|------|
| 钴蓝 | `#0047ab` | 主色、链接、进行中状态 |
| 纸白 | `#f8f7f4` | 页面背景 |
| 墨黑 | `#141414` | 正文 |
| 发线 | `#e4e2dd` | 分割线、边框 |

### 9.2 字体

- 显示字体: Archivo(英文数字)
- 等宽字体: IBM Plex Mono(数据、代码)
- 中文: Noto Sans SC
- 备选: system-ui, -apple-system

### 9.3 状态 Pill

| 状态 | 颜色 | 色值 |
|------|------|------|
| 待检/待处理 | 琥珀 | `#f59e0b` |
| 进行中 | 钴蓝 | `#0047ab` |
| 待签名 | 紫色 | `#7c3aed` |
| 锁定/不合格 | 红色 | `#dc2626` |
| 通过/已完成 | 绿色 | `#16a34a` |

### 9.4 布局

```
┌─────────────────────────────────────────────────────┐
│  topbar (60px)                                       │
│  左侧 logo + 公司切换器 | 右侧 用户头像 + 通知       │
├─────────────────────────────────────────────────────┤
│  subnav (46px)                                       │
│  面包屑 + 模块切换 tab                                │
├─────────────────────────────────────────────────────┤
│  main (max-width: 1360px, 居中)                       │
│  ┌───────────────┐  ┌──────────────────────────────┐ │
│  │  sidebar      │  │  content                     │ │
│  │  (220px)      │  │                              │ │
│  │               │  │                              │ │
│  └───────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 10. 依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5 | 前端框架 |
| Vite | 6 | 构建工具 |
| TypeScript | 5.6 | 类型系统 |
| Element Plus | 2.8 | UI 组件库 |
| Pinia | 2.2 | 状态管理 |
| vue-router | 4.4 | 路由 |
| axios | 1.7 | HTTP 请求 |
| echarts | 5.5 | 图表 |
| @antv/g6 | 5.0 | 图可视化(鱼骨图/追溯树) |
| vue-i18n | 9.x | 国际化(当前仅 zh-CN) |
| @vueuse/core | 10.x | 组合式工具函数 |
| SCSS | - | 样式预处理 |
| pnpm | 9 | 包管理器 |

---

## 11. 代码规范

### 11.1 TypeScript

- **禁止 `any`**: `@typescript-eslint/no-explicit-any: error`
- 未使用的参数加 `_` 前缀
- 单文件组件名允许单单词

### 11.2 术语规范

- UI 文本禁止使用技术术语: `CRUD, DTO, VO, POJO, ORM, JPA, RPC, SKU, SPU, UUID, DAO, BO, PO, BFF`
- 使用中文行业术语

### 11.3 提交规范

- Commitlint 类型: `feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert`
- Husky pre-commit: ESLint + Prettier + Stylelint

### 11.4 测试覆盖率

- Vitest 覆盖率门禁: 80%(statements/branches/functions/lines)
- 排除: `src/api/**`, `src/mock/**`, `src/types/**`, `*.d.ts`

---

## 12. 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE` | `/api` | 后端 API 代理前缀 |
| `VITE_OSS_BASE` | - | 对象存储基地址 |
| `VITE_SSE_BASE` | - | SSE 推送基地址 |
| `VITE_APP_TITLE` | - | 应用标题 |

---

## 附录: 快速参考

### 常见错误码

| code | 含义 | 前端处理 |
|------|------|---------|
| 0 | 成功 | 正常处理 |
| 200 | 成功(兼容) | 正常处理 |
| 401 | 未认证 | 跳转登录 |
| 403 | 无权限 | 提示无权访问 |
| 404 | 资源不存在 | 提示 |
| 500 | 服务器错误 | 提示 msg |

### 文件上传

- 审核照片: `POST /api/v1/sqm/audits/records/{id}/photos`，multipart/form-data
- 文件下载(PDF): `GET /api/v1/sqm/audits/records/{id}/report`，Content-Type: application/pdf，前端用 blob 处理

### 乐观锁冲突

- 后端使用 `@Version` 乐观锁
- 冲突时返回 HTTP 409 或业务异常
- 前端应提示用户"数据已被他人修改，请刷新后重试"