# FIA 域 API 参考文档

> 生成日期: 2026-07-24 | 数据源: `.openapi.json` + Controller 源码 + Service 源码 + QmsEnums
> 域: 首件检验 (First Item Approval)

---

## 1. FiaTaskController -- 产线首件检验任务

**路径前缀**: `/api/v1/fia/tasks` | **source**: `FACTORY` (产线首件)

### 1.1 看板与列表

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 1 | GET | `/api/v1/fia/tasks/dashboard` | `fia.task.list` | -- | `Map` | 看板:今日任务/完成数/合格率/超时数/状态分布/近7天趋势 |
| 2 | GET | `/api/v1/fia/tasks` | `fia.task.list` | -- | `List<FiaTask>` | 任务列表(DataScope 按 orgId 过滤) |
| 3 | GET | `/api/v1/fia/tasks/{id}` | `fia.task.list` | -- | `FiaTaskVo` | 任务详情(含检验项列表) |
| 4 | GET | `/api/v1/fia/tasks/archives` | `fia.task.list` | -- | `List<Map>` | 归档报告列表 |
| 5 | GET | `/api/v1/fia/tasks/{id}/archive` | `fia.task.list` | -- | `FiaArchivedReport` | 单任务归档报告 |
| 6 | GET | `/api/v1/fia/tasks/{id}/log` | `fia.task.list` | -- | `List<Map>` | 任务审计日志(节点序列) |

### 1.2 创建与匹配

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 7 | POST | `/api/v1/fia/tasks` | `fia.task.create` | `CreateFiaTaskRequest` (必填) | `FiaTask` | 创建首件任务(触发:工单锁定+待检通知+标准匹配) |
| 8 | GET | `/api/v1/fia/tasks/match-std` | `fia.task.list` | -- | `FiaInspStd` | 按物料+供应商+工序匹配检验标准 |
| 9 | POST | `/api/v1/fia/tasks/batch-by-lot` | `fia.task.create` | `Map<String,String>` (必填) | `Map` | 来料批次驱动批量建单 |

**CreateFiaTaskRequest** (必填字段标 `*`):
| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `orgId`* | string | 是 | 否 | 所属公司 UUID |
| `woNo`* | string | 是 | 否 | 工单号 |
| `lineName`* | string | 是 | 否 | 产线名称 |
| `productName`* | string | 是 | 否 | 产品名称 |
| `procName`* | string | 是 | 否 | 工序名称 |
| `triggerType`* | string | 是 | 否 | 触发类型(换模/换设备/首班/换料/停线重启/来料入库) |
| `stdId` | string | 否 | 自动匹配 | 检验标准ID(可选,为空时按物料+工序自动匹配) |
| `partNo` | string | 否 | 自动匹配 | 物料编码(匹配标准库) |
| `supplierId` | string | 否 | 自动匹配 | 供应商ID(匹配标准库) |
| `lotId` | string | 否 | 否 | 来料批次ID |
| `batchNo` | string | 否 | 否 | 批次号 |
| `isUrgent` | boolean | 否 | 否 | 是否紧急 |
| `remark` | string | 否 | 否 | 备注 |

**后端自动处理**:
- `code`: 自动生成 `"FA-{timestamp}"`
- `source`: 默认 `"FACTORY"`(产线首件)，来料批次建单时设 `"SUPPLIER"`
- `status`: 默认 `"待检"`
- `stdVersion`: 从匹配的标准库复制
- `aql`: 从标准库复制(若未显式指定)
- `slaDueAt`: 默认 `now + 2小时`
- `isOverdue`: 默认 `false`
- `sampleSize`: 来料批次建单时按 AQL 抽样表自动计算
- 创建时自动: 从标准库复制检验项到 `fia_insp_item` + 工单锁定 + 推送待检通知

**match-std 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orgId`* | string | 是 | 公司ID |
| `partNo`* | string | 是 | 物料编码 |
| `supplierId` | string | 否 | 供应商ID |
| `procName` | string | 否 | 工序名称 |

**batch-by-lot 请求体**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `lotNo`* | string | 是 | 来料批次号 |
| `orgId`* | string | 是 | 公司ID |

### 1.3 检验录入与签名

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 10 | POST | `/api/v1/fia/tasks/{id}/items` | `fia.task.create` | `InspItemResultRequest` (必填) | `void` | 检验结果录入(每项 measuredValue + judge) |
| 11 | POST | `/api/v1/fia/tasks/{id}/sign-inspector` | `fia.sign.inspector` | `SignRequest` (必填) | `void` | 检验人签名(状态: 进行中 -> 待复核) |
| 12 | POST | `/api/v1/fia/tasks/{id}/sign-reviewer` | `fia.sign.reviewer` | `SignRequest` (必填) | `void` | 复核人签名(状态: 待复核 -> 待批准/审批中/已完成) |
| 13 | POST | `/api/v1/fia/tasks/{id}/sign-approver` | `fia.sign.approver` | `SignRequest` (必填) | `void` | 批准人签名(三级签名第三签) |

**InspItemResultRequest**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `items` | array | 否 | 检验项数组 |
| `items[].id` | string | 否 | fia_insp_item.id |
| `items[].measuredValue` | string | 否 | 测量值 |
| `items[].judge` | string | 否 | 判定: "合格"/"不合格"/"-" |

**SignRequest**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `password` | string | 否 | 密码(signMethods 含 password 时必填) |
| `itemId` | string | 否 | 逐项签名时传入检验项ID |

**后端自动处理(签名)**:
- 密码校验: 按 `signMethods` 配置判断是否需要密码，需密码时用 BCrypt 校验
- 失败锁定: 连续失败 `lockAfterFail` 次后锁定 `lockMinutes` 分钟
- 逐项签名: `itemId` 非空时仅记日志，不改 task 状态
- 整单签名: 校验当前状态是否允许签名，更新签名人+状态流转
- 复核签名后判断: 三级签名配置 -> 待批准; 需审批路径 -> 创建审批单置审批中; 否则 -> 完成归档

### 1.4 处置

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 14 | POST | `/api/v1/fia/tasks/{id}/disposition` | `fia.task.disposition` | -- | `void` | 设置处置路径 |

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `disposition`* | string | 是 | 产线: 合格放行/退货/返工/让步接收/紧急放行/豁免开工 |
| `remark` | string | 否 | 备注 |

**处置路径与审批联动**:
- 让步接收/紧急放行/豁免开工 -> 签名后自动创建审批单(AP-{timestamp})，任务置"审批中"
- 合格放行/退货/返工 -> 直接完成归档

---

## 2. FiaIncomingCheckController -- 供应商来料首件检验

**路径前缀**: `/api/v1/fia/incoming-checks` | **source**: `SUPPLIER` (来料首件)

> 注意: 此 Controller 不在 OpenAPI 规范中(新增模块)，以下来自源码分析。

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 15 | GET | `/api/v1/fia/incoming-checks/dashboard` | `fia.task.list` | -- | `Map` | 来料首件看板(source=SUPPLIER 统计) |
| 16 | GET | `/api/v1/fia/incoming-checks` | `fia.task.list` | -- | `List<FiaTask>` | 来料首件任务列表 |
| 17 | GET | `/api/v1/fia/incoming-checks/{id}` | `fia.task.list` | -- | `FiaTaskVo` | 任务详情 |
| 18 | GET | `/api/v1/fia/incoming-checks/match-std` | `fia.task.list` | -- | `FiaInspStd` | 匹配检验标准(无需 orgId) |
| 19 | POST | `/api/v1/fia/incoming-checks/batch-by-lot` | `fia.task.create` | `Map<String,String>` (必填) | `Map` | 来料批次驱动批量建单 |
| 20 | POST | `/api/v1/fia/incoming-checks/{id}/items` | `fia.task.create` | `InspItemResultRequest` (必填) | `void` | 检验结果录入 |
| 21 | POST | `/api/v1/fia/incoming-checks/{id}/sign-inspector` | `fia.sign.inspector` | `SignRequest` (必填) | `void` | 检验人签名 |
| 22 | POST | `/api/v1/fia/incoming-checks/{id}/sign-reviewer` | `fia.sign.reviewer` | `SignRequest` (必填) | `void` | 复核人签名 |
| 23 | POST | `/api/v1/fia/incoming-checks/{id}/sign-approver` | `fia.sign.approver` | `SignRequest` (必填) | `void` | 批准人签名 |
| 24 | POST | `/api/v1/fia/incoming-checks/{id}/disposition` | `fia.sign.disposition` | -- | `void` | 处置(合格入库/退货/让步接收/挑选) |

**与产线首件的区别**:
- 触发: 来料批次入库(SqmIncomingLot)，非产线换模/换设备
- source 自动设为 `"SUPPLIER"`
- disposition 允许: 合格入库/退货/让步接收/挑选 (不允许"拦截/放行")
- 不触发工单锁定(FiaWoLock)
- AQL 抽样计算

---

## 3. FiaApprovalController -- 审批管理

**路径前缀**: `/api/v1/fia/approvals`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 25 | GET | `/api/v1/fia/approvals` | `fia.std.create` | -- | `List<FiaApproval>` | 审批单列表 |
| 26 | GET | `/api/v1/fia/approvals/{id}` | `fia.std.create` | -- | `FiaApproval` | 审批单详情 |
| 27 | POST | `/api/v1/fia/approvals` | `fia.std.create` | `FiaApproval` (必填) | `FiaApproval` | 创建审批单 |
| 28 | POST | `/api/v1/fia/approvals/{id}/approve` | `fia.std.create` | -- | `void` | 审批(通过/驳回) |

**FiaApproval** 字段:
| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `approvalType` | string | 否 | 否 | 让步接收/紧急放行/豁免开工 |
| `woNo` | string | 否 | 否 | 工单号 |
| `taskId` | string | 否 | 否 | 关联的任务ID |
| `reason` | string | 否 | 否 | 申请原因 |
| `code` | string | 否 | 自动生成 | AP-{timestamp} |
| `status` | string | 否 | 默认"待审批" | 待审批/已通过/已驳回 |
| `applicantId` | string | 否 | 自动填充 | 申请人(当前用户) |
| `applyAt` | datetime | 否 | 自动填充 | 申请时间 |

**approve 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `opinion`* | string | 是 | 审批意见 |
| `approved`* | boolean | 是 | 是否通过 |

**审批通过后的联动**:
- 任务状态: 审批中 -> 已完成(归档)
- SPC 联动: CTQ 数据写入 SPC 基准
- 来料追溯联动: 合格免审直录物料表
- 工单解锁: 放行审批通过 -> 工单解锁(紧急放行/让步接收/豁免)

**审批驳回后的联动**:
- 任务状态: 审批中 -> 已驳回(不放行，不归档)

---

## 4. InspStdController -- 检验标准库

**路径前缀**: `/api/v1/fia/stds`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 29 | GET | `/api/v1/fia/stds` | `fia.std.list` | -- | `List<FiaInspStd>` | 标准列表 |
| 30 | GET | `/api/v1/fia/stds/{id}` | `fia.std.list` | -- | `InspStdVo` | 标准详情(含检验项) |
| 31 | POST | `/api/v1/fia/stds` | `fia.std.create` | `CreateInspStdRequest` (必填) | `FiaInspStd` | 创建标准 |
| 32 | PUT | `/api/v1/fia/stds/{id}` | `fia.std.create` | `CreateInspStdRequest` (必填) | `void` | 更新标准 |
| 33 | DELETE | `/api/v1/fia/stds/{id}` | `fia.std.delete` | -- | `void` | 删除标准(软删除) |

**CreateInspStdRequest** (必填字段标 `*`):
| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `orgId`* | string | 是 | 否 | 所属公司 |
| `code`* | string | 是 | 否 | 标准编码(如 STD-001) |
| `material`* | string | 是 | 否 | 物料/产品名称 |
| `procName`* | string | 是 | 否 | 工序名称 |
| `aql` | string | 否 | 否 | AQL 值 |
| `inspectLevel` | string | 否 | 否 | 检验水平 |
| `samplePlan` | string | 否 | 否 | 抽样方案 |
| `ctqText` | string | 否 | 否 | CTQ 描述 |
| `stdVersion` | string | 否 | 否 | 版本号(v1/v2/v3) |
| `status` | string | 否 | 默认"草稿" | 草稿/生效/停用 |
| `items` | array | 否 | 否 | 检验项列表 |

**FiaStdItemRequest** (检验项):
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `seq` | int | 否 | 序号 |
| `itemName` | string | 否 | 检验项名称 |
| `isCtq` | boolean | 否 | 是否 CTQ(关键质量特性) |
| `stdValue` | string | 否 | 标准值 |
| `tolerance` | string | 否 | 公差 |
| `unit` | string | 否 | 单位 |
| `valueType` | string | 否 | numeric/enum |
| `enumValues` | string | 否 | 枚举值(如"合格,不合格") |

**后端自动处理**:
- `id`/`createdAt`/`updatedAt`/`createdBy`/`updatedBy` 由 BaseEntity 自动填充
- 创建标准时同时创建检验项(子表)

---

## 5. FiaTriggerTypeController -- 触发类型管理

**路径前缀**: `/api/v1/fia/triggers`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 34 | GET | `/api/v1/fia/triggers` | `fia.std.create` | -- | `List<FiaTriggerType>` | 触发类型列表 |
| 35 | POST | `/api/v1/fia/triggers` | `fia.std.create` | `FiaTriggerType` (必填) | `FiaTriggerType` | 创建触发类型 |
| 36 | PUT | `/api/v1/fia/triggers/{id}` | `fia.std.create` | `FiaTriggerType` (必填) | `void` | 更新触发类型 |
| 37 | DELETE | `/api/v1/fia/triggers/{id}` | `fia.std.delete` | -- | `void` | 删除触发类型 |
| 38 | PUT | `/api/v1/fia/triggers/{id}/toggle` | `fia.std.create` | -- | `void` | 启用/停用 |

**FiaTriggerType** 字段:
| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `name` | string | 否 | 否 | 触发名称(换模/换设备/首班/换料/停线重启/来料入库) |
| `isEnabled` | boolean | 否 | 否 | 是否启用 |
| `description` | string | 否 | 否 | 描述 |

**toggle 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled`* | boolean | 是 | true=启用, false=停用 |

---

## 6. FiaInterceptConfigController -- 拦截配置

**路径前缀**: `/api/v1/fia/intercept-config`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 39 | GET | `/api/v1/fia/intercept-config` | `fia.std.create` | -- | `FiaInterceptConfig` | 获取拦截配置(每公司一行) |
| 40 | PUT | `/api/v1/fia/intercept-config` | `fia.std.create` | `FiaInterceptConfig` (必填) | `void` | 保存拦截配置 |

**FiaInterceptConfig** 字段:
| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `orgId` | string | 否 | 自动填充 | 公司ID(自动从 CompanyContext 填充) |
| `interceptMode` | string | 否 | 否 | 拦截模式 |
| `multiTriggerMode` | string | 否 | 否 | 多触发模式 |
| `slaHours` | integer | 否 | 否 | SLA 超时小时数 |
| `escalateFailCount` | integer | 否 | 否 | 升级失败次数阈值 |

**GET 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orgId` | string | 否 | 不传则取当前用户 orgId |

---

## 7. SignConfigController -- 签名配置

**路径前缀**: `/api/v1/fia/sign-config`

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 41 | GET | `/api/v1/fia/sign-config` | 无(已认证即可) | -- | `FiaSignConfig` | 获取签名配置(每公司一行) |
| 42 | PUT | `/api/v1/fia/sign-config` | `fia.std.create` | `FiaSignConfig` (必填) | `void` | 保存签名配置 |

**FiaSignConfig** 字段:
| 字段 | 类型 | 必填 | 后端自动处理 | 说明 |
|------|------|------|--------------|------|
| `orgId` | string | 否 | 自动填充 | 公司ID(自动从 CompanyContext 填充) |
| `signMethods` | string[] | 否 | 否 | 签名方式: ["password","handwriting","ca"] |
| `signNodes` | string | 否 | 否 | 签名节点: "两级"(检验+复核) / "三级"(检验+复核+批准) |
| `signGranularity` | string | 否 | 否 | 签名粒度: "整单签名" / "逐项签名" |
| `lockAfterFail` | integer | 否 | 否 | 密码错误锁定阈值(默认3) |
| `lockMinutes` | integer | 否 | 否 | 锁定分钟数(默认5) |

**GET 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orgId` | string | 否 | 不传则取当前用户 orgId |

**读权限**: 任意已认证用户可读(写需 `fia.std.create`)

---

## 8. FiaWoLockController -- 工单锁定查询

**路径前缀**: `/api/v1/fia/wo-lock`

> 注意: 此 Controller 不在 OpenAPI 规范中(新增模块)，以下来自源码分析。

| # | 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|---|------|------|--------|--------|------|------|
| 43 | GET | `/api/v1/fia/wo-lock` | `fia.task.list` | -- | `FiaWoLock` | 按工单号查当前锁定记录(无则 data=null) |

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `woNo`* | string | 是 | 工单号 |

**FiaWoLock** 字段:
| 字段 | 类型 | 说明 |
|------|------|------|
| `woNo` | string | 工单号 |
| `lockStatus` | string | 锁定/正常 |
| `lockReason` | string | 锁定原因(首件未完成/首件不合格) |
| `unlockType` | string | 解锁类型(自动解锁/紧急放行) |
| `approverId` | string | 放行审批人 |
| `releaseReason` | string | 放行原因 |
| `traceTag` | string | 追溯标签(REL-{code}-{ts}) |
| `wipHold` | boolean | 在制品是否暂停 |

**后端自动处理**: 管理员(dataScope=all)不按公司过滤，普通用户按本公司 orgId 过滤。

---

## 附录 A: 权限码清单

| 权限码 | 应用接口 | 说明 |
|--------|----------|------|
| `fia.task.list` | GET /tasks/*, GET /tasks/dashboard, GET /tasks/{id}, GET /tasks/archives, GET /tasks/{id}/archive, GET /tasks/{id}/log, GET /tasks/match-std, GET /incoming-checks/*, GET /wo-lock | 查看首件任务 |
| `fia.task.create` | POST /tasks, POST /tasks/items, POST /tasks/batch-by-lot, POST /incoming-checks/batch-by-lot, POST /incoming-checks/{id}/items | 创建任务/录入检验结果 |
| `fia.task.disposition` | POST /tasks/{id}/disposition | 设置处置路径 |
| `fia.sign.inspector` | POST /tasks/{id}/sign-inspector, POST /incoming-checks/{id}/sign-inspector | 检验人签名 |
| `fia.sign.reviewer` | POST /tasks/{id}/sign-reviewer, POST /incoming-checks/{id}/sign-reviewer | 复核人签名 |
| `fia.sign.approver` | POST /tasks/{id}/sign-approver, POST /incoming-checks/{id}/sign-approver | 批准人签名 |
| `fia.sign.disposition` | POST /incoming-checks/{id}/disposition | 来料处置 |
| `fia.std.list` | GET /stds, GET /stds/{id} | 查看检验标准 |
| `fia.std.create` | POST /stds, PUT /stds/{id}, POST /triggers, PUT /triggers/*, PUT /intercept-config, PUT /sign-config, GET/POST /approvals/* | 管理检验标准/触发类型/审批/配置 |
| `fia.std.delete` | DELETE /stds/{id}, DELETE /triggers/{id} | 删除标准/触发类型 |

**总权限码数**: 10 个

---

## 附录 B: FIA 任务状态机

```
                    ┌──────────────┐
                    │    待检      │  (PENDING) -- 创建任务时
                    │   PENDING    │
                    └──────┬───────┘
                           │ enterResults() 首次录入
                           ▼
                    ┌──────────────┐
                    │   进行中     │  (IN_PROGRESS)
                    │ IN_PROGRESS  │
                    └──────┬───────┘
                           │ signInspector() 检验人签名
                           ▼
                    ┌──────────────┐
                    │   待复核     │  (WAIT_REVIEW)
                    │ WAIT_REVIEW  │
                    └──────┬───────┘
                           │ signReviewer() 复核人签名
                           ▼
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │  待批准    │ │  审批中    │ │  已完成    │
     │ (三级签名) │ │IN_APPROVAL │ │ COMPLETED  │
     └─────┬──────┘ └─────┬──────┘ └────────────┘
           │              │              ▲
           │ signApprover │ approve()    │
           │              │              │
           ▼              ▼              │
     ┌────────────┐ ┌────────────┐       │
     │  审批中    │ │  已完成    │───────┘
     │IN_APPROVAL │ │ COMPLETED  │ (无需审批路径直接完成)
     └─────┬──────┘ └────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│ 已完成 │  │ 已驳回   │
│COMPLETED│ │ REJECTED │
└────────┘  └──────────┘

超时: 定时任务扫描 slaDueAt < now 且 status != 已完成/已作废/已驳回，置 status=超时
已作废: 手动作废(业务逻辑，非状态机自动流转)
```

**状态枚举** (QmsEnums.FiaTaskStatus):
| 状态 | 常量 | 说明 |
|------|------|------|
| 待检 | PENDING | 新建任务，等待检验 |
| 进行中 | IN_PROGRESS | 已录入检验结果 |
| 待复核 | WAIT_REVIEW | 检验人已签名，等待复核 |
| 待批准 | (硬编码) | 三级签名复核后，等待批准人签名 |
| 审批中 | IN_APPROVAL | 需审批路径(让步接收/紧急放行/豁免)，审批单已创建 |
| 已完成 | COMPLETED | 归档完成 |
| 超时 | OVERDUE | 超过 SLA 时间 |
| 已作废 | CANCELLED | 手动作废 |
| 已驳回 | REJECTED | 审批驳回 |

---

## 附录 C: FIA 联动关系

### C.1 FIA -> SPC 联动

- **触发条件**: 任务完成后综合判定为"合格" OR 审批通过后放行
- **联动内容**: 扫描 CTQ 检验项的数值型测量值，按 procName 匹配激活的 SPC 参数，创建子组(SpcSubgroup)，触发 WECO 判异规则
- **异常处理**: 联动失败仅 log warn，不阻断 FIA 主流程

### C.2 FIA -> NCM 联动

- **触发条件**: 任务完成后综合判定为"不合格"(非审批路径)
- **联动内容**: 自动创建不良记录(NcmDefectRecord)，source="首件检验"，defectDictCode="D001"，severity="一般"
- **异常处理**: 联动失败仅 log warn，不阻断 FIA 主流程

### C.3 FIA -> 来料追溯 联动

- **触发条件**: 任务完成后综合判定为"合格" OR 审批通过后放行
- **联动内容**: 将同产品(同 partNo + supplier + org)免审直录到来料追溯物料表(SqmIncomingLot)，IQC 自动通过
- **幂等**: 同产品已存在批次时直接复用，不重复创建
- **异常处理**: 联动失败仅 log warn，不阻断 FIA 主流程

### C.4 FIA -> 工单锁 联动

| 事件 | 动作 | 说明 |
|------|------|------|
| 创建任务 | 锁定工单 | lockOnCreate(): 状态=锁定，原因=首件未完成，wipHold=true |
| 不合格完成 | 强化锁定 | lockOnFail(): 原因更新为"首件不合格" |
| 合格完成 | 自动解锁 | unlockAuto(): 状态=正常，原因=自动解锁 |
| 审批放行 | 放行解锁 | unlockByApproval(): 状态=正常，留痕+traceTag |

### C.5 标准匹配链

```
创建任务(stdId 为空时)
  -> 1. 按 productName + procName 匹配标准库(material + procName)
  -> 2. 按 partNo + supplierId + procName 匹配标准库
  -> 3. 按 partNo + procName 匹配(忽略供应商)
  -> 4. 按 partNo 匹配(仅物料编码)
  -> 5. 兜底: 通用默认标准(isDefault=true)
  -> 任一匹配成功即用，全部失败则抛 BusinessException(400)
```

---

## 附录 D: 前端对接检查清单

### 已对接接口

| 接口 | 前端模块 | 状态 |
|------|----------|------|
| GET /api/v1/fia/tasks/dashboard | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/tasks | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/tasks/{id} | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/tasks/match-std | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks/{id}/items | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks/{id}/sign-inspector | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks/{id}/sign-reviewer | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks/{id}/sign-approver | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks/{id}/disposition | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/tasks/{id}/archive | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/tasks/archives | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/tasks/{id}/log | `src/api/modules/fia/tasks.ts` | 已对接 |
| POST /api/v1/fia/tasks/batch-by-lot | `src/api/modules/fia/tasks.ts` | 已对接 |
| GET /api/v1/fia/approvals | `src/api/modules/fia/approvals.ts` | 已对接 |
| GET /api/v1/fia/approvals/{id} | `src/api/modules/fia/approvals.ts` | 已对接 |
| POST /api/v1/fia/approvals | `src/api/modules/fia/approvals.ts` | 已对接 |
| POST /api/v1/fia/approvals/{id}/approve | `src/api/modules/fia/approvals.ts` | 已对接 |
| GET /api/v1/fia/stds | `src/api/modules/fia/stds.ts` | 已对接 |
| GET /api/v1/fia/stds/{id} | `src/api/modules/fia/stds.ts` | 已对接 |
| POST /api/v1/fia/stds | `src/api/modules/fia/stds.ts` | 已对接 |
| PUT /api/v1/fia/stds/{id} | `src/api/modules/fia/stds.ts` | 已对接 |
| DELETE /api/v1/fia/stds/{id} | `src/api/modules/fia/stds.ts` | 已对接 |
| GET /api/v1/fia/triggers | `src/api/modules/fia/triggers.ts` | 已对接 |
| POST /api/v1/fia/triggers | `src/api/modules/fia/triggers.ts` | 已对接 |
| PUT /api/v1/fia/triggers/{id} | `src/api/modules/fia/triggers.ts` | 已对接 |
| DELETE /api/v1/fia/triggers/{id} | `src/api/modules/fia/triggers.ts` | 已对接 |
| PUT /api/v1/fia/triggers/{id}/toggle | `src/api/modules/fia/triggers.ts` | 已对接 |

### 未对接接口

| 接口 | 说明 | 优先级 |
|------|------|--------|
| GET /api/v1/fia/incoming-checks/dashboard | 来料首件看板 | 中(来料检验模块) |
| GET /api/v1/fia/incoming-checks | 来料首件列表 | 中 |
| GET /api/v1/fia/incoming-checks/{id} | 来料首件详情 | 中 |
| GET /api/v1/fia/incoming-checks/match-std | 来料标准匹配 | 中 |
| POST /api/v1/fia/incoming-checks/batch-by-lot | 来料批量建单 | 中 |
| POST /api/v1/fia/incoming-checks/{id}/items | 来料检验录入 | 中 |
| POST /api/v1/fia/incoming-checks/{id}/sign-inspector | 来料检验签名 | 中 |
| POST /api/v1/fia/incoming-checks/{id}/sign-reviewer | 来料复核签名 | 中 |
| POST /api/v1/fia/incoming-checks/{id}/sign-approver | 来料批准签名 | 中 |
| POST /api/v1/fia/incoming-checks/{id}/disposition | 来料处置 | 中 |
| GET /api/v1/fia/sign-config | 签名配置查询 | 高(签名页) |
| PUT /api/v1/fia/sign-config | 签名配置修改 | 中(配置页) |
| GET /api/v1/fia/intercept-config | 拦截配置查询 | 中(配置页) |
| PUT /api/v1/fia/intercept-config | 拦截配置修改 | 中(配置页) |
| GET /api/v1/fia/wo-lock | 工单锁定查询 | 高(TaskList.vue 工单锁定徽标) |

### 缺少下拉数据源接口

| 页面 | 需要 | 现有接口 | 状态 |
|------|------|----------|------|
| 创建任务 - 触发类型 | 触发类型列表 | GET /fia/triggers | 已对接 |
| 创建任务 - 检验标准 | 标准库列表 | GET /fia/stds | 已对接 |
| 创建任务 - 公司选择 | 组织列表(公司级) | GET /uop/orgs | 可用(需跨域调用) |
| 任务详情 - 工单锁定状态 | 工单锁定记录 | GET /fia/wo-lock | 未对接 |
| 签名页 - 签名配置 | 签名方式/节点/粒度 | GET /fia/sign-config | 未对接 |

### 缺少字段

- 前端 `FiaTask` 类型缺少 `source`、`sampleSize`、`sampleCount`、`reviewedAt`、`approvedAt` 字段
- 前端 `FiaTriggerType` 类型字段名不一致: 后端 `name`/`isEnabled`，前端 `triggerName`/`triggerCode`/`enabled`
- 前端 `FiaInterceptConfig` 类型字段名不一致: 后端 `multiTriggerMode`/`escalateFailCount`，前端 `mergeMode`/`maxFailCount`
- 前端 `CreateFiaTaskRequest` 类型缺少 `partNo`、`supplierId`、`lotId` 字段(来料批次驱动需要)
- 前端 `FiaSignConfig` 缺少 `signGranularity` 字段(逐项签名粒度)
- 前端 `FiaInspStd` 缺少 `partNo`、`isDefault`、`prevVersionId` 字段