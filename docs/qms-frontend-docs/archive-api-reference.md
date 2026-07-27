# Archive 域 API 参考文档

> 生成日期: 2026-07-25 | 数据源: `.openapi.json` + Controller 源码 + Service 源码
> 域: 统一归档查询 (Archive)

---

## 1. ArchiveController -- 统一归档查询

**路径前缀**: `/api/v1/archives` | **实现**: `ArchiveServiceImpl` (JdbcTemplate 跨表 UNION 查询)

### 1.1 接口列表

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 1 | GET | `/api/v1/archives` | `sqm.audit.list` OR `fia.task.list` | -- | `R<List<Map<String,Object>>>` | 统一归档查询(跨表 UNION) |
| 2 | GET | `/api/v1/archives/expiring` | `sqm.audit.list` OR `fia.task.list` | -- | `R<List<Map<String,Object>>>` | 留存到期提醒 |

### 1.2 接口 1: 统一归档查询

**GET** `/api/v1/archives`

**权限**: 具备 `sqm.audit.list` 或 `fia.task.list` 任一权限即可访问(OR 逻辑)

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | string | 否 | -- | 归档类型: `fia` / `audit` / `8d`; 不传或空 = 全部(UNION) |
| `keyword` | string | 否 | -- | 模糊匹配 reportNo / woNo / archiveNo |
| `page` | integer | 否 | 1 | 页码(从 1 开始) |
| `size` | integer | 否 | 20 | 每页条数 |

**响应格式**: `R<List<Map<String,Object>>>`，每个 Map 包含:

| 字段 | 类型 | 说明 |
|------|------|------|
| `archiveType` | string | 归档类型: `fia` / `audit` |
| `archiveNo` | string | 归档编号(fia: report_no; audit: archive_no) |
| `refId` | string | 关联业务 ID(fia: task_id; audit: record_id) |
| `refNo` | string | 关联业务编号(fia: wo_no; audit: record_no) |
| `archiveDate` | string (date) | 归档日期 |
| `retentionUntil` | string (date) | 留存截止日期 |
| `reportHash` | string | 报告哈希值(SHA-256) |

**查询逻辑**:
- `type=fia`: 仅查 `ops.fia_archived_report`
- `type=audit`: 仅查 `ops.sqm_audit_report_archive`(LEFT JOIN `ops.sqm_audit_record` 获取 record_no)
- `type=8d`: 返回空列表(8D 归档表未建)
- `type` 为空: UNION ALL 合并 fia + audit 子查询,按 `archive_date DESC NULLS LAST` 排序,分页

**关键字搜索**:
- FIA 子查询: `report_no LIKE %keyword% OR wo_no LIKE %keyword%`
- Audit 子查询: `archive_no LIKE %keyword% OR record_no LIKE %keyword%`

**DataScope**: JdbcTemplate 不走 MyBatis-Plus 拦截器,手工拼接 `org_id` 过滤(对齐 DataScopeInterceptor 语义):
- 管理员(dataScope=all): 不过滤
- 普通用户: FIA 子查询用 `AND org_id = '{orgId}'`, Audit 子查询用 `AND a.org_id = '{orgId}'`

### 1.3 接口 2: 留存到期提醒

**GET** `/api/v1/archives/expiring`

**权限**: 与接口 1 相同

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | integer | 否 | 30 | 提前天数(查询 retentionUntil <= now()+days 的记录) |

**响应格式**: `R<List<Map<String,Object>>>`，每个 Map 包含:

| 字段 | 类型 | 说明 |
|------|------|------|
| `archiveType` | string | 归档类型: `fia` / `audit` |
| `archiveNo` | string | 归档编号 |
| `refId` | string | 关联业务 ID |
| `retentionUntil` | string (date) | 留存截止日期 |
| `daysRemaining` | long | 剩余天数(可为负数,表示已过期) |

**查询逻辑**: UNION ALL 合并 fia + audit 子查询,按 `retention_until ASC` 排序,无分页。

---

## 附录 A: 已存在的 FIA/Audit 归档接口

以下接口属于各自域 Controller,不在 `ArchiveController` 中,但提供归档数据:

| 方法 | 路径 | 所属 Controller | 说明 |
|------|------|-----------------|------|
| GET | `/api/v1/fia/tasks/archives` | FiaTaskController | FIA 归档报告列表 |
| GET | `/api/v1/fia/tasks/{id}/archive` | FiaTaskController | 单任务 FIA 归档报告 |
| GET | `/api/v1/sqm/audits/records/{id}/archive` | SqmAuditController | 单审核记录归档列表 |
| POST | `/api/v1/sqm/audits/records/{id}/archive/generate` | SqmAuditController | 生成审核归档报告 |

---

## 附录 B: ArchiveController @PreAuthorize 括号 bug

**严重级别**: 阻断 (两个接口均不可用)

**问题描述**:

`ArchiveController` 的两个 `@PreAuthorize` 注解多写了一个右括号,导致 SpEL 表达式解析失败:

```java
// 第 38 行 -- 当前(错误)
@PreAuthorize("hasAuthority('sqm.audit.list')) or hasAuthority('fia.task.list')")

// 第 51 行 -- 当前(错误)
@PreAuthorize("hasAuthority('sqm.audit.list')) or hasAuthority('fia.task.list')")

// 正确写法
@PreAuthorize("hasAuthority('sqm.audit.list') or hasAuthority('fia.task.list')")
```

**错误原因**: `hasAuthority('sqm.audit.list')` 后面多了一个 `)` -- 正确的 SpEL 表达式应该是 `hasAuthority('sqm.audit.list') or hasAuthority('fia.task.list')`，当前写法 `hasAuthority('sqm.audit.list'))` 会让 SpEL 解析器在第二个 `)` 处报错。

**影响**:
- `GET /api/v1/archives` -- 403 Forbidden(SpEL 解析失败,权限校验抛异常)
- `GET /api/v1/archives/expiring` -- 403 Forbidden(同上)

**修复方案**: 删除两个注解中 `sqm.audit.list'` 后多余的 `)`。

---

## 附录 C: 8D 归档与 SPC 归档未落地

### C.1 8D 归档

- `ArchiveServiceImpl.list()` 中 `type=8d` 直接返回空列表
- `ArchiveServiceImpl.expiring()` 中无 8D 子查询
- 原因: `ops.8d_archive` 表未建,Service 接口注释已标注"8D 归档表暂未建"
- 影响: 8D 报告无法通过统一归档查询接口检索

### C.2 SPC 归档

- `ArchiveServiceImpl` 无 SPC 归档子查询
- 原因: SPC 控制图/子组/能力分析报告无归档表,未纳入统一归档范围
- 影响: SPC 数据无法通过统一归档查询接口检索

### C.3 当前覆盖范围

| 归档类型 | 数据表 | 是否覆盖 | 备注 |
|----------|--------|----------|------|
| FIA 首件检验 | `ops.fia_archived_report` | 已覆盖 | 归档查询 + 留存提醒 |
| Audit 审核 | `ops.sqm_audit_report_archive` | 已覆盖 | 归档查询 + 留存提醒 |
| 8D 报告 | 无 | 未覆盖 | 表未建 |
| SPC 分析 | 无 | 未覆盖 | 无归档表 |
| NCM 报告 | 无 | 未覆盖 | 未纳入范围 |

---

## 附录 D: 权限码说明

ArchiveController 复用现有权限码,不新增 `archive.*` 权限:

| 权限码 | 所属域 | 说明 |
|--------|--------|------|
| `sqm.audit.list` | SQM | 查看审核记录(来自 SQM 域) |
| `fia.task.list` | FIA | 查看首件任务(来自 FIA 域) |

**设计意图**: 用户具备上述任一权限即可访问归档查询(OR 逻辑),避免为归档模块单独分配权限。

---

## 附录 E: 实现细节

### E.1 JdbcTemplate 跨表 UNION

`ArchiveServiceImpl` 使用 JdbcTemplate 而非 MyBatis-Plus Mapper:
- 原因: 跨表 UNION ALL 查询不适合单一 Mapper 绑定
- 参考: `SqmAnalysisServiceImpl` 的聚合查询写法
- 注意: JdbcTemplate 不走 MyBatis-Plus 拦截器,org_id 过滤需手工拼接

### E.2 分页方式

外层包装 SQL 实现 LIMIT/OFFSET 分页:
```sql
SELECT * FROM ({unionSql}) u ORDER BY archive_date DESC NULLS LAST LIMIT ? OFFSET ?
```

### E.3 响应格式

返回 `List<Map<String,Object>>` 而非强类型实体,支持跨表字段统一映射:
- 原始 DB 列(蛇形)转为 camelCase 键
- 日期类型统一转为 ISO 日期字符串(`YYYY-MM-DD`)
- `daysRemaining` 在 Java 层计算(`ChronoUnit.DAYS.between(today, retentionUntil)`)