# Patrol 域 API 参考文档

> 生成日期: 2026-07-25 | 数据源: `.openapi.json` + Controller 源码 + Service 源码
> 域: 过程巡检 (Patrol Inspection)

---

## 1. PatlRouteController -- 巡检路线管理

**路径前缀**: `/api/v1/patrol/routes` | **表**: `ops.patl_route` + `ops.patl_checkpoint` + `ops.patl_check_item`

### 1.1 接口列表

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 1 | GET | `/api/v1/patrol/routes` | `patl.route.list` | -- | `R<List<PatlRoute>>` | 路线列表(DataScope 按 orgId 过滤) |
| 2 | GET | `/api/v1/patrol/routes/{id}` | `patl.route.list` | -- | `R<PatlRouteVo>` | 路线详情(含点位+检查项,按 seq 排序) |
| 3 | POST | `/api/v1/patrol/routes` | `patl.route.create` | `CreateRouteRequest` (必填) | `R<PatlRoute>` | 创建路线(含点位与检查项,事务) |
| 4 | PUT | `/api/v1/patrol/routes/{id}` | `patl.route.create` | `PatlRoute` (必填) | `R<Void>` | 更新路线基本信息(仅路线表,不更新子表) |
| 5 | DELETE | `/api/v1/patrol/routes/{id}` | `patl.route.delete` | -- | `R<Void>` | 级联删除:路线+点位+检查项(事务) |

### 1.2 CreateRouteRequest

| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `orgId` | string | 否 | 否 | 所属公司 UUID |
| `routeCode` | string | 否 | 否 | 路线编码 |
| `routeName` | string | 否 | 否 | 路线名称 |
| `procName` | string | 否 | 否 | 关联工序(如:注塑/焊接/组装) |
| `freq` | string | 否 | 否 | 频次: 1次/班 / 1次/天 / 1次/周 |
| `status` | string | 否 | 默认"启用" | 启用/停用 |
| `checkpoints` | CheckpointInput[] | 否 | 否 | 点位列表 |

**CheckpointInput** (嵌套):

| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `seq` | short | 否 | 否 | 点位顺序 |
| `pointName` | string | 否 | 否 | 点位名称(如:注塑机A区/焊接工位3) |
| `location` | string | 否 | 否 | 位置描述 |
| `needPhoto` | boolean | 否 | 默认 false | 是否必拍照片 |
| `items` | ItemInput[] | 否 | 否 | 检查项列表 |

**ItemInput** (嵌套):

| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `seq` | short | 否 | 否 | 检查项顺序 |
| `itemName` | string | 否 | 否 | 检查内容(如:温度是否正常/有无异物) |
| `checkType` | string | 否 | 默认"enum" | enum / numeric / text |
| `stdValue` | string | 否 | 否 | 标准值/合格值 |
| `enumValues` | string | 否 | 否 | 枚举选项(逗号分隔,如:正常,异常) |
| `isRequired` | boolean | 否 | 默认 true | 是否必检 |

### 1.3 PatlRoute

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `orgId` | string | 所属公司 |
| `routeCode` | string | 路线编码 |
| `routeName` | string | 路线名称 |
| `procName` | string | 关联工序 |
| `freq` | string | 频次 |
| `status` | string | 启用/停用 |
| `createdAt` | datetime | 创建时间 |
| `updatedAt` | datetime | 更新时间 |
| `createdBy` | string | 创建人 |
| `updatedBy` | string | 更新人 |
| `isDeleted` | boolean | 软删除标记 |
| `version` | int | 乐观锁版本 |

### 1.4 PatlRouteVo (详情响应)

| 字段 | 类型 | 说明 |
|------|------|------|
| `route` | PatlRoute | 路线基本信息 |
| `checkpoints` | CheckpointVo[] | 点位列表(每个含检查项,按 seq 排序) |

**CheckpointVo**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `checkpoint` | PatlCheckpoint | 点位信息 |
| `items` | PatlCheckItem[] | 该点位的检查项列表 |

**PatlCheckpoint**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `orgId` | string | 所属公司 |
| `routeId` | string | 关联路线 ID |
| `seq` | short | 顺序 |
| `pointName` | string | 点位名称 |
| `location` | string | 位置描述 |
| `needPhoto` | boolean | 是否必拍照片 |

**PatlCheckItem**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `orgId` | string | 所属公司 |
| `checkpointId` | string | 关联点位 ID |
| `seq` | short | 顺序 |
| `itemName` | string | 检查项名称 |
| `checkType` | string | enum / numeric / text |
| `stdValue` | string | 标准值 |
| `enumValues` | string | 枚举选项 |
| `isRequired` | boolean | 是否必检 |

---

## 2. PatlTaskController -- 巡检任务管理

**路径前缀**: `/api/v1/patrol/tasks` | **表**: `ops.patl_task` + `ops.patl_record` + `ops.patl_abnormal`

### 2.1 接口列表

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 6 | GET | `/api/v1/patrol/tasks` | `patl.task.list` | -- | `R<List<PatlTask>>` | 任务列表(DataScope 按 orgId 过滤) |
| 7 | GET | `/api/v1/patrol/tasks/{id}` | `patl.task.list` | -- | `R<PatlTaskVo>` | 任务详情(含巡检记录,按 checkTime 排序) |
| 8 | POST | `/api/v1/patrol/tasks` | `patl.task.create` | `CreateTaskRequest` (必填) | `R<PatlTask>` | 按路线生成任务(复制点位,事务) |
| 9 | POST | `/api/v1/patrol/tasks/{id}/records` | `patl.task.record` | `SubmitRecordRequest` (必填) | `R<Void>` | 提交点位结果(事务) |
| 10 | POST | `/api/v1/patrol/tasks/{id}/close` | `patl.task.close` | -- | `R<Void>` | 关闭任务(强制完成,事务) |

### 2.2 CreateTaskRequest

| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `orgId` | string | 否 | 否 | 所属公司 UUID |
| `routeId` | string | 否 | 否 | 路线 ID |
| `shift` | string | 否 | 否 | 班次: 早班/中班/晚班 |
| `planTime` | string | 否 | 否 | 计划巡检时间(ISO LocalDateTime 字符串) |

**后端自动处理**:
- `taskNo`: 自动生成 `"PT-{timestamp}"`
- `status`: 默认 `"待巡检"`
- `totalPoints`: 从路线复制点位数量
- `donePoints`: 默认 0
- `abnormalCount`: 默认 0

### 2.3 SubmitRecordRequest

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `checkpointId` | string | 否 | 点位 ID |
| `checkpointName` | string | 否 | 点位名称(快照) |
| `result` | string | 否 | 结果: 正常/异常 |
| `remark` | string | 否 | 备注 |

**后端自动处理**:
- 创建巡 检记录(`PatlRecord`),记录 checkTime=now, operatorId=当前用户
- 若 `result="异常"`: 自动创建 `PatlAbnormal`(severity="一般", status="待处理"),任务异常数+1
- 已检点位数+1;若 `donePoints >= totalPoints` 则自动置任务状态为"已完成"并记录 finishTime
- 任务已完成后再次提交会抛 `BusinessException(400, "任务已完成,无法继续提交")`

### 2.4 PatlTask

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `orgId` | string | 所属公司 |
| `taskNo` | string | 任务编号(PT-{timestamp}) |
| `routeId` | string | 关联路线 ID |
| `shift` | string | 班次 |
| `planTime` | datetime | 计划时间 |
| `actualTime` | datetime | 实际开始时间 |
| `finishTime` | datetime | 完成时间 |
| `inspectorId` | string | 巡检人 ID |
| `status` | string | 待巡检/进行中/已完成/超时 |
| `totalPoints` | int | 应检点位数 |
| `donePoints` | int | 已检点位数 |
| `abnormalCount` | int | 异常数 |
| `remark` | string | 备注 |

### 2.5 PatlTaskVo (详情响应)

| 字段 | 类型 | 说明 |
|------|------|------|
| `task` | PatlTask | 任务基本信息 |
| `records` | PatlRecord[] | 巡检记录列表(按 checkTime 升序) |

**PatlRecord**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `orgId` | string | 所属公司 |
| `taskId` | string | 关联任务 ID |
| `checkpointId` | string | 点位 ID |
| `checkpointName` | string | 点位名称(快照) |
| `result` | string | 正常/异常 |
| `checkTime` | datetime | 检查时间 |
| `operatorId` | string | 操作人 ID |
| `photoRef` | string | MinIO key(如有照片) |
| `remark` | string | 备注 |
| `itemResults` | string (JSONB) | 检查项明细 JSON: `[{itemId, itemName, value, result}]` |

---

## 3. PatlAbnormalController -- 巡检异常管理

**路径前缀**: `/api/v1/patrol/abnormals` | **表**: `ops.patl_abnormal`

### 3.1 接口列表

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 11 | GET | `/api/v1/patrol/abnormals` | `patl.task.list` | -- | `R<List<PatlAbnormal>>` | 异常列表(DataScope 按 orgId 过滤) |
| 12 | POST | `/api/v1/patrol/abnormals/{id}/close` | `patl.task.create` | `CloseAbnormalRequest` (必填) | `R<Void>` | 关闭异常(事务) |

### 3.2 CloseAbnormalRequest

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `handleRemark` | string | 否 | 处理备注 |

**注意**: OpenAPI 规范中 `CloseAbnormalRequest` 定义了 `disposal` 和 `disposalRemark` 字段,
但 Controller 源码实际使用 `handleRemark` 字段。前端对接时以 Controller 源码为准。

**后端自动处理**:
- `status`: 更新为 `"已关闭"`
- `handledBy`: 自动填充当前用户(CompanyContext)
- `handledAt`: 自动填充当前时间

### 3.3 PatlAbnormal

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `orgId` | string | 所属公司 |
| `taskId` | string | 关联任务 ID |
| `recordId` | string | 关联巡检记录 ID |
| `checkpointName` | string | 点位名称 |
| `description` | string | 异常描述(来自 SubmitRecordRequest.remark) |
| `severity` | string | 严重/一般(默认"一般") |
| `status` | string | 待处理/已转NCM/已关闭 |
| `d8Id` | string | 转 8D 的 ID(预留) |
| `ncmRecordId` | string | 转 NCM 不良记录的 ID(预留) |
| `handleRemark` | string | 处理备注 |
| `handledBy` | string | 处理人 |
| `handledAt` | datetime | 处理时间 |

---

## 附录 A: 权限码清单

| 权限码 | 应用接口 | 说明 |
|--------|----------|------|
| `patl.route.list` | GET /routes, GET /routes/{id} | 查看巡检路线 |
| `patl.route.create` | POST /routes, PUT /routes/{id} | 创建/更新巡检路线 |
| `patl.route.delete` | DELETE /routes/{id} | 删除巡检路线 |
| `patl.task.list` | GET /tasks, GET /tasks/{id}, GET /abnormals | 查看巡检任务/异常 |
| `patl.task.create` | POST /tasks, POST /abnormals/{id}/close | 创建任务/关闭异常 |
| `patl.task.record` | POST /tasks/{id}/records | 提交巡检记录 |
| `patl.task.close` | POST /tasks/{id}/close | 关闭任务 |

**总权限码数**: 7 个

**注意**: `PatlAbnormalController` 使用的权限码为 `patl.task.list` 和 `patl.task.create`(复用任务域权限),
未单独定义 `patl.abnormal.*` 权限码。

---

## 附录 B: 巡检任务状态机

```
                    ┌──────────────┐
                    │    待巡检    │  (PENDING) -- 创建任务时
                    │  status=待巡检 │
                    └──────┬───────┘
                           │ submitRecord() 首次提交记录
                           ▼
                    ┌──────────────┐
                    │   进行中     │  (IN_PROGRESS) -- 已提交部分点位
                    │status=待巡检  │  (注意:当前代码未区分"待巡检"与"进行中")
                    └──────┬───────┘
                           │ submitRecord() 逐点位提交
                           │ donePoints 递增
                           │ donePoints >= totalPoints 时自动:
                           ▼
                    ┌──────────────┐
                    │   已完成     │  (COMPLETED)
                    │status=已完成  │
                    │ finishTime=now│
                    └──────────────┘

    强制关闭: close() 直接将 status 置为"已完成"(不检查 donePoints)
```

**状态枚举**:
| 状态 | 说明 |
|------|------|
| 待巡检 | 新建任务,等待巡检 |
| 进行中 | 已提交部分点位(当前代码未显式设置,submitRecord 后 status 仍为"待巡检") |
| 已完成 | 全部点位已检 OR 手动关闭 |
| 超时 | 预留字段,当前代码未实现超时自动检测 |

**已知缺口**:
- 当前实现未在 submitRecord 首次调用时将 status 从"待巡检"切换到"进行中"
- 超时检测未实现(PatlTask 有 status="超时" 枚举值,但无定时任务扫描)

---

## 附录 C: 异常状态机

```
                    ┌──────────────┐
                    │   待处理     │  -- submitRecord(result="异常") 时自动创建
                    │status=待处理  │
                    │severity=一般  │
                    └──────┬───────┘
                           │ closeAbnormal(id, handleRemark)
                           ▼
                    ┌──────────────┐
                    │   已关闭     │
                    │status=已关闭  │
                    │handledBy=当前人│
                    │handledAt=now  │
                    └──────────────┘
```

**状态枚举**:
| 状态 | 说明 |
|------|------|
| 待处理 | 异常已创建,等待处理 |
| 已转NCM | 已转为不良记录(预留,当前代码未实现) |
| 已关闭 | 已处理完毕 |

---

## 附录 D: 后端已知缺口

### D.1 拍照功能未通

- `PatlCheckpoint.needPhoto` 字段已定义,但创建路线时仅存储该标志
- `PatlRecord.photoRef` 字段已定义(MinIO key),但 `submitRecord` 接口无文件上传参数
- 缺少独立的照片上传接口(如 `POST /api/v1/patrol/tasks/{id}/records/{recordId}/photo`)
- 影响:前端无法上传巡检照片

### D.2 检查项级判定未通

- `PatlCheckItem` 已定义(checkType/checkType/stdValue/enumValues/isRequired),在路线创建时支持配置
- `PatlRecord.itemResults` 字段已定义(JSONB: `[{itemId, itemName, value, result}]`),但 `SubmitRecordRequest` 无 `itemResults` 字段
- `submitRecord` 接口只能提交点位级的 `result`("正常/异常"),无法提交各检查项的逐项判定值
- 影响:巡检记录仅点位级,无法记录检查项明细

### D.3 异常转 NCM 未实现

- `PatlAbnormal` 表有 `d8Id` 和 `ncmRecordId` 字段,status 有"已转NCM"枚举值
- 但当前代码无任何转 NCM/8D 的逻辑,关闭异常仅设置 status="已关闭"和 handleRemark
- 缺少独立的接口(如 `POST /api/v1/patrol/abnormals/{id}/transfer-to-ncm`)
- 影响:巡检异常无法自动流转到 NCM 域

### D.4 其他未实现

- 任务超时检测: PatlTask 有 status="超时" 枚举值,但无定时任务自动扫描
- 任务"进行中"状态: submitRecord 首次调用后应切换到"进行中",当前未实现
- 路线更新: PUT /routes/{id} 仅更新路线表,不更新点位和检查项子表
- 巡检记录修改: 无 PUT 接口,提交后无法修正

---

## 附录 E: 数据表概览

| 表名 | 主键 | 审计字段 | 说明 |
|------|------|----------|------|
| `ops.patl_route` | UUID (BaseEntity) | 有 | 巡检路线(配置) |
| `ops.patl_checkpoint` | UUID (BaseEntity) | 有 | 巡检点位(路线下子表) |
| `ops.patl_check_item` | UUID (plain) | 无 | 检查项(点位下子表,无审计) |
| `ops.patl_task` | UUID (BaseEntity) | 有 | 巡检任务 |
| `ops.patl_record` | UUID (plain) | 无 | 巡检记录(点位级,无审计) |
| `ops.patl_abnormal` | UUID (BaseEntity) | 有 | 巡检异常(可转NCM/8D) |

**数据关系**:
```
patl_route (1) --< (N) patl_checkpoint (1) --< (N) patl_check_item
patl_route (1) --< (N) patl_task (1) --< (N) patl_record
patl_task (1) --< (N) patl_abnormal (1) -- (1) patl_record
```