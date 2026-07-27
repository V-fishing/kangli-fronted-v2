# SQM 供应商质量管理 API 参考文档

> 基于康立 QMS 后端 OpenAPI 3.0 规范 + Controller/Service 源码生成，2026-07-24 更新。
> SQM 域共 **16 个 Controller，102 个接口**，是 QMS 系统中最大的业务域。

---

## 目录

1. [供应商档案 (SqmSupplierController)](#1-供应商档案)
2. [评级规则 (SqmSupplierGradeRuleController)](#2-评级规则)
3. [绩效 (SqmSupplierPerformanceController)](#3-绩效)
4. [来料异常 (SqmAbnormalController)](#4-来料异常)
5. [审核 (SqmAuditController)](#5-审核)
6. [物料变更 (SqmChangeController)](#6-物料变更)
7. [加严检验 (SqmChangeStrictInspectController)](#7-加严检验)
8. [FMEA (SqmFmeaController)](#8-fmea)
9. [SQE 验证 (SqmSqeVerificationController)](#9-sqe-验证)
10. [改善措施 (SqmSupplierMeasureController)](#10-改善措施)
11. [份额 (SqmSupplierShareController)](#11-份额)
12. [升级 (SqmSupplierEscalationController)](#12-升级)
13. [资质 (SqmSupplierCertController)](#13-资质)
14. [追溯 (SqmTraceController)](#14-追溯)
15. [分析报表 (SqmAnalysisController + SqmAuditFreqRuleController)](#15-分析报表)
16. [联动关系总览](#16-联动关系总览)
17. [前端对接检查清单](#17-前端对接检查清单)

---

## 1. 供应商档案

**Controller**: `SqmSupplierController`  
**Base Path**: `/api/v1/sqm/suppliers`  
**Entity**: `SqmSupplier` (表 `ops.sqm_supplier`)  
**接口数**: 5

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/suppliers` | `sqm.supplier.list` | - | `R<List<SqmSupplier>>` | 供应商列表 |
| GET | `/api/v1/sqm/suppliers/{id}` | `sqm.supplier.list` | - | `R<SqmSupplier>` | 单个供应商详情 |
| POST | `/api/v1/sqm/suppliers` | `sqm.supplier.create` | `SqmSupplier` | `R<SqmSupplier>` | 新增供应商 |
| PUT | `/api/v1/sqm/suppliers` | `sqm.supplier.create` | `SqmSupplier` (partial) | `R<Void>` | 编辑供应商 |
| DELETE | `/api/v1/sqm/suppliers/{id}` | `sqm.supplier.delete` | - | `R<Void>` | 软删除供应商 |

**后端自动处理**:
- `supplierNo`: 自动生成 `SUP-{timestamp}`
- `status`: 不传默认 `"启用"`，前端准入申请传 `"待审核"`
- `orgId`: 自动从登录上下文注入
- `certs`: 前端传 JSON 字符串，非数组格式自动兜底为 `[]`
- `creditCode`: 不传自动用 `supplierCode` 兜底

**上下游关联**:
- 供应商被审核后，`level` 和 `score` 由审核记录联动更新（A: >=90, B: >=75, C: >=60, D: <60）
- 供应商被重复异常升级后，`next_audit_date` 自动设为 `today+30` 天
- 供应商等级变更联动审核频次推荐（查 `sqm_audit_freq_rule`）

---

## 2. 评级规则

**Controller**: `SqmSupplierGradeRuleController`  
**Base Path**: `/api/v1/sqm/grade-rules`  
**Entity**: `SqmSupplierGradeRule` (表 `ops.sqm_supplier_grade_rule`)  
**接口数**: 4

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/grade-rules` | `sqm.supplier.create` | - | `R<List<SqmSupplierGradeRule>>` | 规则列表 |
| POST | `/api/v1/sqm/grade-rules` | `sqm.supplier.create` | `SqmSupplierGradeRule` | `R<SqmSupplierGradeRule>` | 新增规则 |
| PUT | `/api/v1/sqm/grade-rules` | `sqm.supplier.create` | `SqmSupplierGradeRule` | `R<Void>` | 编辑规则 |
| DELETE | `/api/v1/sqm/grade-rules/{id}` | `sqm.supplier.delete` | - | `R<Void>` | 删除规则 |

**业务规则**: 规则按区间匹配 `[scoreMin, scoreMax)` -> 返回对应 `level`。绩效计算时优先用规则表匹配，未配置或无匹配时回退到简单算法。

---

## 3. 绩效

**Controller**: `SqmSupplierPerformanceController`  
**Base Path**: `/api/v1/sqm/performance`  
**Entity**: `SqmSupplierPerformance` (表 `ops.sqm_supplier_performance`)  
**接口数**: 5

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/performance` | `sqm.supplier.list` | Query: `supplierId`(可选) | `R<List<SqmSupplierPerformance>>` | 绩效列表 |
| GET | `/api/v1/sqm/performance/{id}` | `sqm.supplier.list` | - | `R<SqmSupplierPerformance>` | 绩效详情 |
| POST | `/api/v1/sqm/performance` | `sqm.supplier.list` | `SqmSupplierPerformance` | `R<SqmSupplierPerformance>` | 手动新增绩效 |
| POST | `/api/v1/sqm/performance/calc` | `sqm.supplier.list` | Query: `supplierId`, `period` | `R<SqmSupplierPerformance>` | 自动计算绩效 |
| GET | `/api/v1/sqm/performance/audit-freq` | `sqm.supplier.list` | Query: `supplierLevel` | `R<Map>` | 查推荐审核频次 |

**绩效计算逻辑**:
- `incomingPassRate` = iqcPass=true 的批次数 / 总批次数 * 100
- `deliveryTimelyRate` = 100%（当前无 due_date 字段）
- `score` = (incomingPassRate + deliveryTimelyRate) / 2
- `level` 由 `sqm_supplier_grade_rule` 区间匹配，无匹配回退简单算法：A>=90, B>=80, C>=70, D<70
- 同一 `(supplierId, period)` 唯一，重复计算会先删旧再插新

**审核频次联动**: `/performance/audit-freq` 按供应商等级查 `sqm_audit_freq_rule`，返回推荐的 `freqPerYear` 和 `auditType`。

---

## 4. 来料异常

**Controller**: `SqmAbnormalController`  
**Base Path**: `/api/v1/sqm`  
**Entity**: `SqmIncomingAbnormal` (表 `ops.sqm_incoming_abnormal`)  
**接口数**: 6

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/abnormals` | `sqm.abnormal.list` | - | `R<List<SqmIncomingAbnormal>>` | 异常列表 |
| POST | `/api/v1/sqm/abnormals` | `sqm.abnormal.create` | `SqmIncomingAbnormal` | `R<SqmIncomingAbnormal>` | 创建异常单 |
| POST | `/api/v1/sqm/abnormals/{id}/close` | `sqm.abnormal.close` | `CloseAbnormalRequest` | `R<Void>` | 关闭异常单 |
| PUT | `/api/v1/sqm/abnormals/{id}/rectification` | `sqm.abnormal.create` | `AbnormalRectificationRequest` | `R<Void>` | 保存整改记录 |
| GET | `/api/v1/sqm/abnormals/{id}/rectification` | `sqm.abnormal.list` | - | `R<Map>` | 加载整改详情 |
| POST | `/api/v1/sqm/abnormals/check-escalation` | `sqm.abnormal.escalation-check` | - | `R<Void>` | 手动触发重复升级扫描 |

**请求体 DTO**:

`CloseAbnormalRequest`:
- `disposal` (String): 处置方式
- `disposalRemark` (String): 处置备注

`AbnormalRectificationRequest`:
- `abnormal` (SqmIncomingAbnormal): 异常主体更新字段
- `measures` (List\<SqmAbnormalMeasure\>): 整改措施列表
- `batchVerifies` (List\<SqmAbnormalBatchVerify\>): 三批验证列表

**来料异常状态机**:

```
待处理 ──(创建)──> 待处理
   │
   ├──(saveRectification 更新 status)──> 整改中
   │
   └──(close)──> 已关闭
        │
        └── 前置校验:
            1. 已是"已关闭" -> 400 拒绝
            2. 关联 8D 报告(d8Id)未闭环 -> 400 拒绝，提示 8D 编号和当前阶段
            3. 通过则写入 closeDate + disposal + disposalRemark
```

**创建时自动行为**:
- `abnormalNo`: 自动生成 `ABN-{timestamp}`
- `status`: 初始 `"待处理"`
- `rectifyType`: 严重不良自动 `"8D"`；一般不良累计>=3件(30天内同供应商+物料)也自动 `"8D"`
- **严重异常** -> 自动创建专项审核计划（`auditType="专项审核"`, `status="待执行"`）
- **涉及安全/召回的严重异常** -> 自动创建 CAPA（`triggerType="来料异常"`）

**超期扫描** (`@Scheduled cron = "0 5 8 * * ?"`):
- 每天 8:05 扫描 occurDate>7 天未闭环的异常
- 超 7 天通知 SQE，超 14 天通知"质量经理,采购"
- 写入 `notification_log` 表

**重复异常升级** (`checkRepeatEscalation`):
- 近 30 天同一 `(supplierId, partNo)` 出现 >=2 次异常则创建升级记录
- 自动降份额：>=3 次异常时 `share_ratio` 减 5%（最低 5%）
- 自动联动审核频次：`next_audit_date` = today+30 天

---

## 5. 审核

**Controller**: `SqmAuditController`  
**Base Path**: `/api/v1/sqm/audits`  
**接口数**: 14

### 5.1 审核计划 (Plans)

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/audits/plans` | `sqm.audit.list` | - | `R<List<SqmAuditPlan>>` | 计划列表 |
| POST | `/api/v1/sqm/audits/plans` | `sqm.audit.create` | `SqmAuditPlan` | `R<SqmAuditPlan>` | 创建计划 |
| PUT | `/api/v1/sqm/audits/plans/{id}/confirm` | `sqm.audit.plan.confirm` | - | `R<Void>` | 确认排期 |
| POST | `/api/v1/sqm/audits/plans/{id}/start` | `sqm.audit.plan.start` | - | `R<SqmAuditPlan>` | 开始执行 |

**审核计划状态机**:

```
计划中 ──(confirm)──> 待执行 ──(start)──> 进行中 ──(createRecord 提交报告)──> 已完成
  │                    │                │
  └─ 仅"计划中"可确认    └─ 仅"待执行"可开始  └─ 带 @Version 乐观锁防并发
```

**后端自动处理**:
- `planNo`: 自动生成 `AP-{timestamp}`
- `status`: 不传默认 `"计划中"`
- `orgId`: 自动从登录上下文注入

### 5.2 审核记录 (Records)

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/audits/records` | `sqm.audit.list` | - | `R<List<SqmAuditRecord>>` | 记录列表 |
| POST | `/api/v1/sqm/audits/records` | `sqm.audit.create` | `SqmAuditRecord` | `R<SqmAuditRecord>` | 创建审核记录 |

**创建审核记录时自动行为**:
- `recordNo`: 自动生成 `AR-{timestamp}`
- `status`: 不传默认 `"已完成"`
- `ncCount`: 不传默认 0
- `result`: 不传时按 `conclusion` 兜底 (`"推荐通过"`->`"通过"`)
- **审核得分联动供应商等级**: score>=90->A, >=75->B, >=60->C, 否则 D；同时更新 `lastAuditDate`
- **提交报告后自动推进计划状态**: 对应 plan 的 status 设为 `"已完成"`

### 5.3 不符合项 (NCs)

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/audits/ncs` | `sqm.audit.list` | - | `R<List<SqmAuditNc>>` | NC 列表 |
| POST | `/api/v1/sqm/audits/ncs` | `sqm.audit.create` | `SqmAuditNc` | `R<SqmAuditNc>` | 创建 NC |
| POST | `/api/v1/sqm/audits/ncs/{id}/close` | `sqm.audit.nc.close` | `CloseNcRequest` | `R<Void>` | 关闭 NC |

`CloseNcRequest`:
- `verifyResult` (String): 验证结论
- `verifyComment` (String): 验证备注

**NC 自动行为**:
- `ncNo`: 自动生成 `NC-{timestamp}`
- `status`: 不传默认 `"待整改"`
- **严重 NC 自动创建 CAPA**: `triggerType="内审"`, `owner="质量经理"`, `dueDate=now+30`

**NC 超期扫描** (`@Scheduled cron = "0 10 8 * * ?"`): 每天 8:10 扫描 deadline 已过未闭环的 NC，通知"采购,质量经理"。

### 5.4 审核报告与照片

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/audits/records/{id}/report` | `sqm.audit.list` | - | `ResponseEntity<byte[]>` (PDF) | 下载审核报告 PDF |
| GET | `/api/v1/sqm/audits/records/{id}/archive` | `sqm.audit.list` | - | `R<List<SqmAuditReportArchive>>` | 查归档列表 |
| POST | `/api/v1/sqm/audits/records/{id}/archive/generate` | `sqm.audit.archive` | - | `R<SqmAuditReportArchive>` | 生成归档（PDF+SHA-256+15年保留） |
| POST | `/api/v1/sqm/audits/records/{recordId}/photos` | `sqm.audit.create` | Multipart: `file` | `R<String>` (filePath) | 上传审核照片 |
| GET | `/api/v1/sqm/audits/photos/{fileName}` | `sqm.audit.list` | - | `ResponseEntity<byte[]>` (JPEG) | 下载审核照片 |

**照片存储**: 本地 `logs/photos/` 目录，不接 MinIO。文件名格式: `audit-{recordId}-{timestamp}-{originalName}`。有路径穿越防护。

---

## 6. 物料变更

**Controller**: `SqmChangeController`  
**Base Path**: `/api/v1/sqm/changes`  
**Entity**: `SqmChangeOrder` (表 `ops.sqm_change_order`)  
**接口数**: 9

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/changes` | `sqm.change.list` | - | `R<List<SqmChangeOrder>>` | 变更单列表 |
| GET | `/api/v1/sqm/changes/{id}` | `sqm.change.list` | - | `R<SqmChangeOrderVo>` | 变更单详情（含会签记录） |
| POST | `/api/v1/sqm/changes/batch-detail` | `sqm.change.list` | `List<String>` (ids) | `R<Map<String, SqmChangeOrderVo>>` | 批量查详情 |
| POST | `/api/v1/sqm/changes` | `sqm.change.rollback` | `SqmChangeOrder` | `R<SqmChangeOrder>` | 创建变更单 |
| POST | `/api/v1/sqm/changes/{id}/submit` | `sqm.change.submit` | - | `R<Void>` | 提交变更单 |
| POST | `/api/v1/sqm/changes/{id}/approve` | `sqm.change.approve` | `ApproveChangeRequest` | `R<Void>` | 会签审批 |
| POST | `/api/v1/sqm/changes/{id}/close` | `sqm.change.close` | - | `R<Void>` | 关闭变更单 |
| POST | `/api/v1/sqm/changes/{id}/rollback` | `sqm.change.rollback` | Query: `reason`(可选) | `R<Void>` | 回滚变更 |
| POST | `/api/v1/sqm/changes/{id}/verify-sign` | `sqm.change.verify-sign` | Query: `approvalRole`, `username`, `password` | `R<Void>` | 电子签名校验 |

`ApproveChangeRequest`:
- `approvalRole` (String): 会签角色 quality/purchase/rd
- `approved` (boolean): 是否批准
- `opinion` (String): 审批意见

**变更会签状态机**:

```
待申请 ──(create)──> 待申请
   │
   └──(submit)──> 审批中 (冻结收货 receiveFrozen=true)
        │
        ├──(approve: quality 一票否决 rejected)──> 已驳回
        │
        ├──(approve: 三方全部 done)──> 已批准
        │    │
        │    ├── 联动: 创建 FIA 检验标准新版本(旧停用+新草稿)
        │    └── 联动: 自动创建 3 批加严检验 (aqlLevel="II")
        │
        └──(approve: 部分 done, 部分 rejected 无否决权)──> 仍审批中(等待)
             │
             └──(close)──> 已关闭 (解冻收货 receiveFrozen=false)
                  │
                  └──(rollback: 加严检验不合格)──> 已回滚 (恢复冻结 receiveFrozen=true)
```

**三方并行会签**: quality / purchase / rd，quality 的 `hasVeto=true`（一票否决权）。

**创建时自动行为**:
- `changeNo`: 自动生成 `ECN-{timestamp}`
- `status`: 初始 `"待申请"`
- `applyDate`: 不传默认当天
- `source`: 不传默认 `"门户提报"`
- `urgency`: 不传默认 `"中"`
- `riskPreMark="高"` -> 强制 `strictFlag=true`
- 预建三方会签记录（quality/purchase/rd，status=pending）

**提交时联动**: 自动创建"物料变更审核"审核计划（`status="待执行"`，独立事务，失败不阻断变更主流程）。

**电子签名校验**: 校验用户名+密码（PasswordEncoder 比对），不落库，仅校验。同时验证该角色属于本变更单。

---

## 7. 加严检验

**Controller**: `SqmChangeStrictInspectController`  
**Base Path**: `/api/v1/sqm/strict-inspects`  
**Entity**: `SqmChangeStrictInspect` (表 `ops.sqm_change_strict_inspect`)  
**接口数**: 4

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/strict-inspects` | `sqm.change.create` | Query: `changeId`(可选) | `R<List<SqmChangeStrictInspect>>` | 列表 |
| GET | `/api/v1/sqm/strict-inspects/{id}` | `sqm.change.create` | - | `R<SqmChangeStrictInspect>` | 详情 |
| POST | `/api/v1/sqm/strict-inspects` | `sqm.change.create` | `SqmChangeStrictInspect` | `R<SqmChangeStrictInspect>` | 新增 |
| POST | `/api/v1/sqm/strict-inspects/{id}/restore` | `sqm.change.create` | - | `R<Void>` | 恢复 |

**与变更联动**: 变更批准后自动创建 3 批加严检验（`totalSeq=3`, `aqlLevel="II"`），加严检验不合格->回滚变更。

---

## 8. FMEA

**Controller**: `SqmFmeaController`  
**Base Path**: `/api/v1/sqm/fmea`  
**Entity**: `QmsFmeaRisk` (表 `ops.qms_fmea_risk`), `QmsFmeaRiskTrack` (表 `ops.qms_fmea_risk_track`)  
**接口数**: 9

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/fmea/types` | `sqm.fmea.list` | - | `R<List<String>>` | FMEA 类型列表（PFMEA/DFMEA/SFMEA） |
| GET | `/api/v1/sqm/fmea/predict` | `sqm.fmea.list` | Query: `severity`, `occurrence`, `detection` | `R<Map>` | 预测 RPN 与风险等级 |
| GET | `/api/v1/sqm/fmea` | `sqm.fmea.list` | Query: `status`(可选) | `R<List<QmsFmeaRisk>>` | 风险项列表 |
| POST | `/api/v1/sqm/fmea` | `sqm.fmea.edit` | `QmsFmeaRisk` | `R<QmsFmeaRisk>` | 新建风险项 |
| PUT | `/api/v1/sqm/fmea/{id}` | `sqm.fmea.edit` | `QmsFmeaRisk` (partial) | `R<QmsFmeaRisk>` | 更新风险项 |
| POST | `/api/v1/sqm/fmea/{id}/close` | `sqm.fmea.close` | `Map` (evidence, note, recurrenceVerified) | `R<QmsFmeaRisk>` | 闭环 |
| GET | `/api/v1/sqm/fmea/{id}/tracks` | `sqm.fmea.list` | - | `R<List<QmsFmeaRiskTrack>>` | 闭环轨迹 |
| POST | `/api/v1/sqm/fmea/{id}/reopen` | `sqm.fmea.reopen` | Query: `reason`(可选) | `R<QmsFmeaRisk>` | 重新打开 |
| POST | `/api/v1/sqm/fmea/scan-overdue` | `sqm.fmea.scan-overdue` | - | `R<Integer>` | 扫描超期措施 |

**FMEA 状态机**:

```
创建 ──> 待闭环 (高风险: RPN>=100 或 S>=9)
   │     或 进行中 (低风险)
   │
   ├──(update: 分配措施/责任人/目标日期)──> 可更新状态
   │
   ├──(close)──> 已闭环
   │    │
   │    ├── 前置条件: 必须提交 evidence
   │    └── 高风险额外条件: recurrenceVerified=true (3个月无复发)
   │
   └──(reopen)──> 进行中 (仅已闭环可重开，清空 closeDate)
```

**RPN 计算**: `RPN = S × O × D`
- **高风险** (highRiskFlag=true): S>=9 或 RPN>=100
- **中风险**: RPN>=50
- **低风险**: RPN<50

**超期扫描** (`@Scheduled cron = "0 0 8 * * ?"`): 每天 8:00 扫描 targetDate 已过未闭环项，超 7 天通知责任人，超 14 天通知质量经理。

**闭环轨迹**: 每次状态变更自动记录 `QmsFmeaRiskTrack`（操作人、来源状态、目标状态、备注、证据、时间）。

---

## 9. SQE 验证

**Controller**: `SqmSqeVerificationController`  
**Base Path**: `/api/v1/sqm/verifications`  
**Entity**: `SqmSqeVerification` (表 `ops.sqm_sqe_verification`)  
**接口数**: 3

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/verifications` | `sqm.abnormal.create` | Query: `abnormalId`(可选) | `R<List<SqmSqeVerification>>` | 列表 |
| GET | `/api/v1/sqm/verifications/{id}` | `sqm.abnormal.create` | - | `R<SqmSqeVerification>` | 详情 |
| POST | `/api/v1/sqm/verifications` | `sqm.abnormal.create` | `SqmSqeVerification` | `R<SqmSqeVerification>` | 新增 |

---

## 10. 改善措施

**Controller**: `SqmSupplierMeasureController`  
**Base Path**: `/api/v1/sqm/measures`  
**Entity**: `SqmSupplierMeasure` (表 `ops.sqm_supplier_measure`)  
**接口数**: 3

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/measures` | `sqm.abnormal.create` | Query: `abnormalId`(可选) | `R<List<SqmSupplierMeasure>>` | 列表 |
| GET | `/api/v1/sqm/measures/{id}` | `sqm.abnormal.create` | - | `R<SqmSupplierMeasure>` | 详情 |
| POST | `/api/v1/sqm/measures` | `sqm.abnormal.create` | `SqmSupplierMeasure` | `R<SqmSupplierMeasure>` | 新增 |

---

## 11. 份额

**Controller**: `SqmSupplierShareController`  
**Base Path**: `/api/v1/sqm/shares`  
**Entity**: `SqmSupplierShare` (表 `ops.sqm_supplier_share`)  
**接口数**: 3

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/shares` | `sqm.supplier.create` | Query: `supplierId`(可选) | `R<List<SqmSupplierShare>>` | 列表 |
| GET | `/api/v1/sqm/shares/{id}` | `sqm.supplier.create` | - | `R<SqmSupplierShare>` | 详情 |
| POST | `/api/v1/sqm/shares` | `sqm.supplier.create` | `SqmSupplierShare` | `R<SqmSupplierShare>` | 新增 |

**与升级联动**: 重复异常升级（>=3次）时自动降份额 `share_ratio - 5%`（最低 5%），`change_reason="重复异常自动降份额(>=3次)"`。

---

## 12. 升级

**Controller**: `SqmSupplierEscalationController`  
**Base Path**: `/api/v1/sqm/escalations`  
**Entity**: `SqmSupplierEscalation` (表 `ops.sqm_supplier_escalation`)  
**接口数**: 3

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/escalations` | `sqm.supplier.create` | Query: `supplierId`(可选) | `R<List<SqmSupplierEscalation>>` | 列表 |
| GET | `/api/v1/sqm/escalations/{id}` | `sqm.supplier.create` | - | `R<SqmSupplierEscalation>` | 详情 |
| POST | `/api/v1/sqm/escalations` | `sqm.supplier.create` | `SqmSupplierEscalation` | `R<SqmSupplierEscalation>` | 新增 |

**自动生成逻辑** (checkRepeatEscalation):
- 近 30 天同一 `(supplierId, partNo)` 出现 >=2 次异常 -> 创建升级记录
- `suggestedAction="增加审核频次"`, `escalationStatus="观察中"`
- 同时统计 `qualityIssueCount6m`（近 180 天异常总数）
- >=3 次异常时自动降份额 + 审核频次联动

---

## 13. 资质

**Controller**: `SqmSupplierCertController`  
**Base Path**: `/api/v1/sqm/supplier-certs`  
**Entity**: `SqmSupplierCert` (表 `ops.sqm_supplier_cert`)  
**接口数**: 5

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/supplier-certs` | `sqm.supplier.create` | Query: `supplierId`(可选) | `R<List<SqmSupplierCert>>` | 列表 |
| GET | `/api/v1/sqm/supplier-certs/expiring` | `sqm.supplier.list` | Query: `days`(默认30) | `R<List<SqmSupplierCert>>` | 即将过期资质 |
| GET | `/api/v1/sqm/supplier-certs/{id}` | `sqm.supplier.create` | - | `R<SqmSupplierCert>` | 详情 |
| POST | `/api/v1/sqm/supplier-certs` | `sqm.supplier.create` | `SqmSupplierCert` | `R<SqmSupplierCert>` | 新增 |
| DELETE | `/api/v1/sqm/supplier-certs/{id}` | `sqm.supplier.delete` | - | `R<Void>` | 删除 |

---

## 14. 追溯

**Controller**: `SqmTraceController`  
**Base Path**: `/api/v1/sqm`  
**接口数**: 21 — SQM 最复杂子模块

### 14.1 来料批次管理

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/lots` | `sqm.trace.list` | - | `R<List<SqmIncomingLot>>` | 批次列表 |
| POST | `/api/v1/sqm/lots` | `sqm.trace.create` | `SqmIncomingLot` | `R<SqmIncomingLot>` | 来料入库（自动建 incoming 节点） |

**入库自动行为**: 创建 `SqmIncomingLot` 后自动生成 `nodeType="incoming"` 的追溯节点（`treeLevel=0`, `isValid="是"`），作为追溯链起点。批次号重复（同 orgId+lotNo）返回 409。

### 14.2 追溯树查询

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/trace/tree` | `sqm.trace.list` | Query: `rootLotId` | `R<List<SqmTraceNode>>` | 扁平追溯树（按 treeLevel 排序） |
| GET | `/api/v1/sqm/trace/tree-recursive` | `sqm.trace.list` | Query: `rootLotId` | `R<List<SqmTraceNode>>` | 递归追溯树（WITH RECURSIVE CTE） |
| GET | `/api/v1/sqm/trace/full-tree` | `sqm.trace.list` | Query: `rootLotId` | `R<TraceFullTreeVO>` | 完整嵌套树（含明细+供应商名） |
| GET | `/api/v1/sqm/trace/full-tree-by-root` | `sqm.trace.list` | Query: `rootNodeId` | `R<TraceFullTreeVO>` | 按根节点查完整嵌套树 |
| GET | `/api/v1/sqm/trace/tree-from-node` | `sqm.trace.list` | Query: `nodeId` | `R<TraceFullTreeVO>` | 以任意节点为根展开下游子树 |
| GET | `/api/v1/sqm/trace/tree-by-root` | `sqm.trace.list` | Query: `rootNodeId` | `R<List<SqmTraceNode>>` | 按根节点查扁平树 |
| GET | `/api/v1/sqm/trace/roots` | `sqm.trace.list` | Query: `orgId` | `R<List<SqmTraceNode>>` | 列出全部根节点 |
| GET | `/api/v1/sqm/trace/nodes/search` | `sqm.trace.list` | Query: `nodeType`, `keyword`, `orgId`, `page`, `size` | `R<PageResult<TraceNodeSearchVO>>` | 全局节点检索（分页） |

### 14.3 追溯节点录入

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| POST | `/api/v1/sqm/trace/nodes` | `sqm.trace.create` | `SqmTraceNode` | `R<SqmTraceNode>` | 创建节点 |
| POST | `/api/v1/sqm/trace/nodes/save` | `sqm.trace.create` | `TraceNodeSaveRequest` | `R<SqmTraceNode>` | 新建产出节点（semi/ship/customer）+明细+组成 |
| POST | `/api/v1/sqm/trace/nodes/{parentId}/components` | `sqm.trace.create` | `ComponentItem` | `R<SqmTraceNode>` | 挂接组成（raw/semi） |

`TraceNodeSaveRequest` 关键字段:
- `nodeType` (必填): semi / ship / customer
- `orgId` (必填)
- `parentNodeId` (可选): 挂父节点，不传则为树根
- `components` (可选): 一次性建树时带组成列表
- `ComponentItem`: `componentType`(raw/semi), `refNodeId`(引用已有节点), `materialCode`(raw 物料编码), `usageQty`(用量) 等

**防超卖机制**: 挂接 raw 组件时实时校验物料批次剩余库存（`qty - usedQty`），用量超过剩余则拒绝。通过后累加 `usedQty`。

**多对多支持**: 引用已有节点 (`refNodeId`) 直接建 link，实现同一次来料被多个产出复用的场景。跨聚合根引用自动 reroot 子树。

### 14.4 追溯明细

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/trace/nodes/{nodeId}/raw-detail` | `sqm.trace.list` | - | `R<SqmTraceRawDetail>` | 原料明细 |
| PUT | `/api/v1/sqm/trace/nodes/{nodeId}/raw-detail` | `sqm.trace.create` | `SqmTraceRawDetail` | `R<Void>` | 保存原料明细 |
| GET | `/api/v1/sqm/trace/nodes/{nodeId}/product-detail` | `sqm.trace.list` | - | `R<SqmTraceProductDetail>` | 产品明细 |
| PUT | `/api/v1/sqm/trace/nodes/{nodeId}/product-detail` | `sqm.trace.create` | `SqmTraceProductDetail` | `R<Void>` | 保存产品明细 |
| GET | `/api/v1/sqm/trace/nodes/{nodeId}/detail` | `sqm.trace.list` | - | `R<TraceNodeFullVO>` | 节点完整详情（含上下游引用） |

### 14.5 方向追溯 + 关键件 SN

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/trace/nodes/{nodeId}/direction` | `sqm.trace.list` | Query: `direction`(forward/backward/both) | `R<List<TraceDirectionNode>>` | 按方向追溯 |
| GET | `/api/v1/sqm/key-part-sns` | `sqm.trace.list` | Query: `lotId` | `R<List<SqmKeyPartSn>>` | 关键件 SN 列表 |
| POST | `/api/v1/sqm/key-part-sns` | `sqm.trace.create` | `SqmKeyPartSn` | `R<Void>` | 新增关键件 SN |

**方向追溯**: `forward` = 本节点被哪些上层使用，`backward` = 本节点由哪些下层组成，`both` = 连通分量全部。

---

## 15. 分析报表

### 15.1 SqmAnalysisController

**Base Path**: `/api/v1/sqm`  
**接口数**: 4

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/analysis/incoming` | `sqm.supplier.list` | Query: `dim`, `startTime`, `endTime` | `R<List<Map>>` | 来料多维分析 |
| GET | `/api/v1/sqm/analysis/abnormal` | `sqm.supplier.list` | Query: `dim`, `startTime`, `endTime` | `R<List<Map>>` | 来料异常多维分析 |
| GET | `/api/v1/sqm/dashboard/incoming` | `sqm.supplier.list` | - | `R<Map>` | 来料看板 |
| GET | `/api/v1/sqm/performance/ranking` | `sqm.supplier.list` | Query: `period`(可选,默认当月) | `R<List<Map>>` | 供应商绩效排名 |

**来料多维分析**: dim 可选 `supplierId` / `partNo` / `inspectResult`，返回每组 totalCount、passCount、failCount、passRate。

**来料异常多维分析**: dim 可选 `supplierId` / `partNo` / `level`，返回每组 totalCount、severityCount（严重/一般）。

**来料看板响应字段**:
- `todayLots`: 今日批次数
- `passRate`: 今日合格率
- `pendingAbnormals`: 待处理异常数
- `top5BadSuppliers`: Top5 不良供应商（按不合格批次数）
- `trend7d`: 近 7 日趋势（date, total, pass, passRate）

**绩效排名**: period 格式 `YYYY-MM`，按 score 降序。

### 15.2 SqmAuditFreqRuleController

**Base Path**: `/api/v1/sqm/audit-freq-rules`  
**Entity**: `SqmAuditFreqRule` (表 `ops.sqm_audit_freq_rule`)  
**接口数**: 4

| 方法 | 路径 | 权限码 | 请求体 | 响应 | 说明 |
|------|------|--------|--------|------|------|
| GET | `/api/v1/sqm/audit-freq-rules` | `sqm.audit.create` | - | `R<List<SqmAuditFreqRule>>` | 规则列表 |
| POST | `/api/v1/sqm/audit-freq-rules` | `sqm.audit.create` | `SqmAuditFreqRule` | `R<SqmAuditFreqRule>` | 新增规则 |
| PUT | `/api/v1/sqm/audit-freq-rules` | `sqm.audit.create` | `SqmAuditFreqRule` | `R<Void>` | 编辑规则 |
| DELETE | `/api/v1/sqm/audit-freq-rules/{id}` | `sqm.audit.delete` | - | `R<Void>` | 删除规则 |

---

## 16. 联动关系总览

```
来料异常(严重)
  ├──> 自动创建专项审核计划 (auditType="专项审核")
  ├──> 涉及安全/召回 -> 自动创建 CAPA
  └──> 重复异常(>=2次) -> 升级 + 降份额 + 审核频次联动

审核记录
  ├──> 得分 -> 更新供应商等级(A/B/C/D) + lastAuditDate
  ├──> 严重 NC -> 自动创建 CAPA
  └──> 提交报告 -> 推进计划状态为"已完成"

物料变更
  ├──> 提交 -> 冻结收货 + 创建"物料变更审核"计划
  ├──> 批准 -> FIA 检验标准新版本 + 3 批加严检验
  └──> 加严检验不合格 -> 回滚变更(恢复冻结)

FMEA
  ├──> RPN=S×O×D, >=100 或 S>=9 为高风险
  └──> 超期措施 -> 7 天通知责任人, 14 天通知质量经理

供应商绩效
  └──> 等级 -> 审核频次推荐 (查 sqm_audit_freq_rule)

异常超期
  └──> 7 天通知 SQE, 14 天通知质量经理+采购
```

---

## 17. 前端对接检查清单

### 17.1 按子模块接口对接状态

| 子模块 | 接口数 | 前端对接状态 | 备注 |
|--------|--------|------------|------|
| 供应商档案 | 5 | 待确认 | 需要供应商下拉列表（/api/v1/sqm/suppliers） |
| 评级规则 | 4 | 待确认 | 配置页面 |
| 绩效 | 5 | 待确认 | 需要 `/calc` 计算按钮 + `/audit-freq` 联动展示 |
| 来料异常 | 6 | 待确认 | 整改编辑需要加载措施+批验列表，关闭前需校验 8D 闭环状态 |
| 审核 | 14 | 待确认 | 照片上传用 multipart/form-data；报告下载用 blob 处理 |
| 物料变更 | 9 | 待确认 | 三方会签 UI 需要展示 quality/purchase/rd 状态；签名校验弹窗 |
| 加严检验 | 4 | 待确认 | 与变更页面联动 |
| FMEA | 9 | 待确认 | 需要 `/predict` 预览 RPN；闭环需要上传 evidence；轨迹时间线展示 |
| SQE 验证 | 3 | 待确认 | 关联异常单 |
| 改善措施 | 3 | 待确认 | 关联异常单 |
| 份额 | 3 | 待确认 | 饼图/柱状图展示 |
| 升级 | 3 | 待确认 | 列表+详情 |
| 资质 | 5 | 待确认 | 需要 `/expiring` 到期预警 |
| 追溯 | 21 | 待确认 | 树形组件渲染；节点搜索分页；防超卖提示 |
| 分析报表 | 4 | 待确认 | 看板+图表；dim 维度选择器 |
| 审核频次规则 | 4 | 待确认 | 配置页面 |

### 17.2 需要前端提供下拉数据源的接口

| 接口 | 需要的下拉数据 | 数据来源 |
|------|-------------|---------|
| 创建异常单 | 供应商列表 | `GET /api/v1/sqm/suppliers` |
| 创建审核计划 | 供应商列表 | `GET /api/v1/sqm/suppliers` |
| 创建变更单 | 供应商列表 | `GET /api/v1/sqm/suppliers` |
| 来料入库 | 供应商列表 | `GET /api/v1/sqm/suppliers` |
| FMEA | 类型列表 | `GET /api/v1/sqm/fmea/types` |
| 分析报表 | dim 维度列表 | 前端硬编码即可（supplierId/partNo/inspectResult/level） |
| 绩效审核频次 | 供应商等级 | 前端硬编码即可（A/B/C/D） |

### 17.3 后端自动处理、前端不应传的字段

| 实体 | 字段 | 说明 |
|------|------|------|
| SqmSupplier | `supplierNo` | 自动生成 `SUP-{timestamp}` |
| SqmSupplier | `orgId` | 自动从登录上下文注入 |
| SqmIncomingAbnormal | `abnormalNo` | 自动生成 `ABN-{timestamp}` |
| SqmIncomingAbnormal | `status` | 初始 `"待处理"`，无需前端传 |
| SqmIncomingAbnormal | `rectifyType` | 严重不良自动 `"8D"` |
| SqmIncomingAbnormal | `orgId` | 自动注入 |
| SqmAuditPlan | `planNo` | 自动生成 `AP-{timestamp}` |
| SqmAuditPlan | `status` | 初始 `"计划中"`，无需前端传 |
| SqmAuditPlan | `orgId` | 自动注入 |
| SqmAuditRecord | `recordNo` | 自动生成 `AR-{timestamp}` |
| SqmAuditRecord | `status` | 默认 `"已完成"` |
| SqmAuditRecord | `ncCount` | 默认 0 |
| SqmAuditRecord | `result` | 按 conclusion 兜底 |
| SqmAuditRecord | `orgId` | 自动注入 |
| SqmAuditNc | `ncNo` | 自动生成 `NC-{timestamp}` |
| SqmAuditNc | `status` | 默认 `"待整改"` |
| SqmAuditNc | `orgId` | 自动注入 |
| SqmChangeOrder | `changeNo` | 自动生成 `ECN-{timestamp}` |
| SqmChangeOrder | `status` | 初始 `"待申请"` |
| SqmChangeOrder | `applyDate` | 默认当天 |
| SqmChangeOrder | `source` | 默认 `"门户提报"` |
| SqmChangeOrder | `urgency` | 默认 `"中"` |
| SqmChangeOrder | `orgId` | 自动注入 |
| SqmChangeOrder | `receiveFrozen` | 提交时自动设为 true |
| QmsFmeaRisk | `riskNo` | 自动生成 `FMEA-{timestamp}` |
| QmsFmeaRisk | `rpn` | 自动计算 S×O×D |
| QmsFmeaRisk | `riskLevel` | 自动计算 |
| QmsFmeaRisk | `highRiskFlag` | 自动计算 |
| QmsFmeaRisk | `status` | 高风险默认 `"待闭环"`，否则 `"进行中"` |
| QmsFmeaRisk | `orgId` | 自动注入 |
| SqmIncomingLot | `lotNo` | 不传则自动生成 `LOT-{timestamp}` |
| SqmIncomingLot | `inspectResult` | 默认 `"待检"` |
| SqmIncomingLot | `inspectType` | 默认 `"正常"` |
| SqmIncomingLot | `incomingDate` | 默认当天 |
| SqmTraceNode | `isValid` | 默认 `"是"` |
| SqmTraceNode | `treeLevel` | 自动计算 |
| SqmSupplierPerformance | `level` | 自动按规则匹配 |
| SqmSupplierPerformance | `score` | calc 自动计算 |
| SqmSupplierPerformance | `observeFlag` | 默认 false |
| SqmSupplierPerformance | `dataMissingFlag` | 自动按数据情况设置 |

### 17.4 特别注意

1. **变更会签 UI**: 三方并行会签需要展示 quality/purchase/rd 各自状态（pending/done/rejected），quality 有否决权。`verify-sign` 接口需要弹出用户名+密码输入框。
2. **来料异常关闭按钮**: 点击前应先调用 `GET /api/v1/sqm/abnormals/{id}` 检查 `d8Id` 是否关联 8D，若关联且未闭环，应提示用户先完成 8D 闭环。
3. **FMEA 闭环弹窗**: 需要上传 evidence 并勾选 "3 个月无复发"（高风险项时必选）。
4. **追溯树渲染**: 前端收到的 `TraceFullTreeVO.tree` 是嵌套结构（children 递归），需用树形组件渲染。`getTraceTreeFromNode` 同时返回 `tree`（下游去向）和 `upTree`（上游组成），需要双树展示。
5. **审核报告 PDF**: 响应的 Content-Type 是 `application/pdf`，前端需用 `blob` 下载处理。
6. **审核照片上传**: 使用 `multipart/form-data`，字段名 `file`。
7. **分析报表时间参数**: 支持 epoch 毫秒、ISO 日期时间、ISO 日期三种格式。

---

> **接口总数**: 102  
> **Controller 数**: 16  
> **状态机**: 4 个（来料异常、审核计划、变更会签、FMEA）  
> **定时任务**: 3 个（异常超期扫描、NC 超期扫描、FMEA 超期扫描）  
> **自动联动**: 7 条（异常->审核+CAPA、审核->供应商等级、变更->FIA+加严检验、加严检验->变更回滚、重复异常->升级+降份额+审核频次、绩效->审核频次推荐、NC->CAPA）