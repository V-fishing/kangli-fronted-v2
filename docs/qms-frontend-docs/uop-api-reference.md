# UOP 域 API 参考文档

> 生成日期: 2026-07-24 | 数据源: `.openapi.json` + Controller 源码 + Service 源码
> 域: 用户/组织/权限 (User-Organization-Permission)

---

## 1. AuthController -- 登录认证

**路径前缀**: `/api/v1/auth`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 1 | POST | `/api/v1/auth/login` | 无(公开) | `LoginRequest` (必填) | `LoginResponse` | 用户名+密码登录，签发 JWT |

**LoginRequest** (必填字段标 `*`):
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username`* | string | 是 | 用户名 |
| `password`* | string | 是 | 明文密码 |

**LoginResponse**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `accessToken` | string | JWT 令牌 |
| `tokenType` | string | 固定 `"Bearer"` |
| `expiresIn` | long | 过期时间(秒) |

**后端自动处理**: 密码 BCrypt 校验，失败抛 BusinessException(401)。

---

## 2. UserController -- 用户管理

**路径前缀**: `/api/v1/uop`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 2 | GET | `/api/v1/uop/me` | 无(已认证即可) | -- | `CurrentUserVo` | 当前登录用户信息+权限码集合 |
| 3 | GET | `/api/v1/uop/users` | `system.user.list` | -- | `List<SysUser>` | 用户列表(DataScope 自动过滤) |
| 4 | POST | `/api/v1/uop/users` | `system.user.create` | `CreateUserRequest` (必填) | `SysUser` | 创建用户 |
| 5 | PUT | `/api/v1/uop/users/{id}` | `system.user.create` | `UpdateUserRequest` (必填) | `void` | 更新用户(realName/orgId/status) |
| 6 | DELETE | `/api/v1/uop/users/{id}` | `system.user.delete` | -- | `void` | 删除用户(软删除) |
| 7 | POST | `/api/v1/uop/users/{id}/reset-password` | `system.user.create` | `Map<String,String>` (必填) | `void` | 重置密码，body: `{"password":"新密码"}` |
| 8 | POST | `/api/v1/uop/users/{id}/roles` | `system.role.assign` | `List<String>` (必填) | `void` | 分配角色，body 为 roleId 数组 |
| 9 | GET | `/api/v1/uop/users/{id}/roles` | `system.user.list` | -- | `List<SysRole>` | 查询用户已分配角色 |

**CreateUserRequest** (必填字段标 `*`):
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username`* | string | 是 | 用户名 |
| `password`* | string | 是 | 明文密码 |
| `realName`* | string | 是 | 真实姓名 |
| `orgId` | string | 否 | 所属公司 UUID，null=跨公司管理员 |
| `status` | string | 否 | 默认"启用" |

**UpdateUserRequest**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `realName` | string | 否 | 真实姓名 |
| `orgId` | string | 否 | 所属公司 |
| `status` | string | 否 | 启用/停用 |

**后端自动处理**:
- `orgId` 为 null 时，`dataScope` = `"all"`（跨公司管理员，看全部数据）
- `orgId` 非 null 时，`dataScope` = 该 orgId（仅看本公司数据）
- 密码 BCrypt 加密存储
- 软删除(isDeleted=true)

**Service 层业务规则**:
- 创建用户时分配角色，角色变更后调用 `permissionLoader.evictUser(userId)` 清权限缓存
- 重置密码直接写 passwordHash，不触发旧密码校验

---

## 3. OrgController -- 组织管理

**路径前缀**: `/api/v1/uop/orgs`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 10 | GET | `/api/v1/uop/orgs` | `system.org.list` | -- | `List<SysOrg>` | 组织列表(扁平) |
| 11 | GET | `/api/v1/uop/orgs/tree` | `system.org.list` | -- | `List<OrgTreeNode>` | 组织树(含 children) |
| 12 | POST | `/api/v1/uop/orgs` | `system.org.create` | `SysOrg` (必填) | `void` | 创建组织 |
| 13 | DELETE | `/api/v1/uop/orgs/{id}` | `system.org.delete` | -- | `void` | 删除组织(软删除) |

**SysOrg** 字段:
| 字段 | 类型 | 说明 |
|------|------|------|
| `orgCode` | string | 组织编码 |
| `orgName` | string | 组织名称 |
| `parentId` | string | 父组织 ID，null=顶级 |
| `sortOrder` | int | 排序 |
| `orgType` | string | 公司/工厂/车间/产线/工位 |
| `status` | string | 启用/停用 |

**后端自动处理**: `id`/`createdAt`/`updatedAt`/`createdBy`/`updatedBy` 由 BaseEntity + AuditMetaObjectHandler 自动填充。

---

## 4. RoleController -- 角色管理

**路径前缀**: `/api/v1/uop/roles`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 14 | GET | `/api/v1/uop/roles` | `system.role.list` | -- | `List<SysRole>` | 角色列表 |
| 15 | POST | `/api/v1/uop/roles` | `system.role.create` | `SysRole` (必填) | `void` | 创建角色 |
| 16 | DELETE | `/api/v1/uop/roles/{id}` | `system.role.delete` | -- | `void` | 删除角色 |
| 17 | POST | `/api/v1/uop/roles/{id}/menus` | `system.role.assign` | `List<String>` (必填) | `void` | 分配菜单(body 为 menuId 数组) |
| 18 | POST | `/api/v1/uop/roles/{id}/buttons` | `system.role.assign` | `List<String>` (必填) | `void` | 分配按钮(body 为 buttonId 数组) |
| 19 | POST | `/api/v1/uop/roles/{id}/users` | `system.role.assign` | `List<String>` (必填) | `void` | 分配用户(body 为 userId 数组) |
| 20 | GET | `/api/v1/uop/roles/{id}/users` | `system.role.list` | -- | `List<SysUser>` | 查询角色下用户 |

**SysRole** 字段:
| 字段 | 类型 | 说明 |
|------|------|------|
| `roleCode` | string | 角色编码(如 `mz.qe`, `sz.sqe`) |
| `roleName` | string | 角色名称 |
| `roleType` | string | 角色类型 |
| `permDesc` | string | 权限描述 |
| `status` | string | 启用/停用 |

**后端自动处理**:
- 分配菜单/按钮/用户后，调用 `permissionLoader.evictAll()` 清全部权限缓存
- 软删除(isDeleted=true)

---

## 5. MenuController -- 菜单管理

**路径前缀**: `/api/v1/uop/menus`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 21 | GET | `/api/v1/uop/menus` | `system.menu.list` | -- | `List<SysMenu>` | 菜单列表(扁平) |
| 22 | GET | `/api/v1/uop/menus/tree` | `system.menu.list` | -- | `List<Map>` | 菜单树(含 children)，供前端动态路由 |
| 23 | POST | `/api/v1/uop/menus` | `system.menu.create` | `SysMenu` (必填) | `void` | 创建菜单 |
| 24 | DELETE | `/api/v1/uop/menus/{id}` | `system.menu.delete` | -- | `void` | 删除菜单 |

**SysMenu** 字段:
| 字段 | 类型 | 说明 |
|------|------|------|
| `parentId` | string | 父菜单 ID，null=顶级 |
| `menuCode` | string | 菜单编码 |
| `menuName` | string | 菜单名称 |
| `menuType` | string | 菜单/按钮/目录 |
| `path` | string | 前端路由路径 |
| `component` | string | 前端组件路径 |
| `icon` | string | 图标 |
| `sortOrder` | int | 排序 |
| `visible` | boolean | 是否可见 |

---

## 6. DictController -- 字典管理

**路径前缀**: `/api/v1/dict`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 25 | GET | `/api/v1/dict` | 无(已认证即可) | -- | `List<SysDict>` | 全量字典(前端启动预加载) |
| 26 | GET | `/api/v1/dict/{type}` | 无(已认证即可) | -- | `List<SysDict>` | 按类型查询字典 |

**SysDict** 字段:
| 字段 | 类型 | 说明 |
|------|------|------|
| `dictType` | string | 字典类型(如 `fia_trigger_type`) |
| `dictKey` | string | 字典键(value) |
| `dictValue` | string | 字典值(label) |
| `sortOrder` | int | 排序 |
| `enabled` | boolean | 是否启用 |

**说明**: 前端 value=dictKey, label=dictValue。任何已认证用户可读，供下拉框/枚举展示。

---

## 7. DelegationController -- 代班管理

**路径前缀**: `/api/v1/uop/delegations`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 27 | GET | `/api/v1/uop/delegations` | `system.delegation.manage` | -- | `List<SysDelegation>` | 代班列表 |
| 28 | POST | `/api/v1/uop/delegations` | `system.delegation.manage` | `SysDelegation` (必填) | `void` | 创建代班 |
| 29 | POST | `/api/v1/uop/delegations/{id}/revoke` | `system.delegation.manage` | -- | `void` | 撤销代班 |

**SysDelegation** 字段:
| 字段 | 类型 | 说明 |
|------|------|------|
| `delegatorId` | string | 委托人 userId |
| `delegateeId` | string | 被委托人 userId |
| `roleId` | string | 委托角色 Id |
| `startAt` | datetime | 开始时间 |
| `endAt` | datetime | 结束时间 |
| `status` | string | 生效/已过期/已撤销 |

---

## 附录 A: UOP 权限码清单

| 权限码 | 应用接口 | 说明 |
|--------|----------|------|
| `system.user.list` | GET /users, GET /users/{id}/roles | 查看用户列表 |
| `system.user.create` | POST /users, PUT /users/{id}, POST /users/{id}/reset-password | 创建/更新用户，重置密码 |
| `system.user.delete` | DELETE /users/{id} | 删除用户 |
| `system.role.list` | GET /roles, GET /roles/{id}/users | 查看角色列表 |
| `system.role.create` | POST /roles | 创建角色 |
| `system.role.delete` | DELETE /roles/{id} | 删除角色 |
| `system.role.assign` | POST /roles/{id}/menus, /roles/{id}/buttons, /roles/{id}/users, /users/{id}/roles | 分配菜单/按钮/用户/角色 |
| `system.org.list` | GET /orgs, GET /orgs/tree | 查看组织 |
| `system.org.create` | POST /orgs | 创建组织 |
| `system.org.delete` | DELETE /orgs/{id} | 删除组织 |
| `system.menu.list` | GET /menus, GET /menus/tree | 查看菜单 |
| `system.menu.create` | POST /menus | 创建菜单 |
| `system.menu.delete` | DELETE /menus/{id} | 删除菜单 |
| `system.delegation.manage` | GET/POST/DELETE /delegations | 代班管理 |

**总权限码数**: 12 个

---

## 附录 B: 前端对接检查清单

### 已对接接口

| 接口 | 前端模块 | 状态 |
|------|----------|------|
| POST /api/v1/auth/login | `src/api/modules/uop/auth.ts` | 已对接 |
| GET /api/v1/uop/me | `src/api/modules/uop/me.ts` | 已对接 |
| GET /api/v1/uop/orgs | `src/api/modules/uop/orgs.ts` | 已对接 |
| GET /api/v1/uop/orgs/tree | `src/api/modules/uop/orgs.ts` | 已对接 |

### 未对接接口

| 接口 | 说明 | 优先级 |
|------|------|--------|
| GET /api/v1/uop/users | 用户列表 | 高(用户管理页) |
| POST /api/v1/uop/users | 创建用户 | 高 |
| PUT /api/v1/uop/users/{id} | 更新用户 | 高 |
| DELETE /api/v1/uop/users/{id} | 删除用户 | 高 |
| POST /api/v1/uop/users/{id}/reset-password | 重置密码 | 中 |
| POST /api/v1/uop/users/{id}/roles | 分配角色 | 高 |
| GET /api/v1/uop/users/{id}/roles | 查看用户角色 | 高 |
| GET /api/v1/uop/roles | 角色列表 | 高(角色管理页) |
| POST /api/v1/uop/roles | 创建角色 | 高 |
| DELETE /api/v1/uop/roles/{id} | 删除角色 | 中 |
| POST /api/v1/uop/roles/{id}/menus | 分配菜单 | 高 |
| POST /api/v1/uop/roles/{id}/buttons | 分配按钮 | 中 |
| POST /api/v1/uop/roles/{id}/users | 分配用户给角色 | 中 |
| GET /api/v1/uop/roles/{id}/users | 查询角色下用户 | 中 |
| GET /api/v1/uop/menus | 菜单列表 | 高(菜单管理页) |
| POST /api/v1/uop/menus | 创建菜单 | 中 |
| GET /api/v1/uop/menus/tree | 菜单树 | 高(动态路由) |
| DELETE /api/v1/uop/menus/{id} | 删除菜单 | 低 |
| GET /api/v1/dict | 全量字典 | 高(启动预加载) |
| GET /api/v1/dict/{type} | 按类型字典 | 高(下拉框数据源) |
| POST /api/v1/uop/orgs | 创建组织 | 中 |
| DELETE /api/v1/uop/orgs/{id} | 删除组织 | 低 |
| GET /api/v1/uop/delegations | 代班列表 | 低 |
| POST /api/v1/uop/delegations | 创建代班 | 低 |
| POST /api/v1/uop/delegations/{id}/revoke | 撤销代班 | 低 |

### 缺少下拉数据源接口

| 页面 | 需要 | 现有接口 | 状态 |
|------|------|----------|------|
| 用户管理 - 公司选择 | 组织列表(公司级) | GET /uop/orgs | 可用 |
| 用户管理 - 角色选择 | 角色列表 | GET /uop/roles | 需对接 |
| 角色管理 - 菜单分配 | 菜单树 | GET /uop/menus/tree | 需对接 |
| 角色管理 - 按钮分配 | 按钮列表 | 暂无独立接口 | 需确认(按钮在菜单树中) |
| 通用下拉框 | 字典数据 | GET /dict/{type} | 需对接 |

### 缺少字段

- 前端 `SysMenu` 类型缺少 `menuType`、`visible` 字段
- 前端 `SysUser` 类型缺少 `updatedAt`、`updatedBy` 字段(审计需要)
- 前端 `SysRole` 类型缺少 `roleType`、`permDesc` 字段