# NCM API Reference

> 生成日期: 2026-07-24 | 数据源: OpenAPI 3.0 + Controller 源码 + Service 源码
> 前端路径: `qms-web/src/api/modules/ncm/` (10 个模块,全部已对接)

---

## 1. NcmDefectRecordController -- 不良记录与报表

**Base**: `GET/POST /api/v1/ncm`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/defect-records` | `ncm.record.list` | ?params(可选) | `R<List<NcmDefectRecord>>` | 不良记录列表 |
| 2 | GET | `/api/v1/ncm/defect-records/{id}` | `ncm.record.list` | `{id}` 路径参数 | `R<NcmDefectRecord>` | 不良记录详情 |
| 3 | POST | `/api/v1/ncm/defect-records` | `ncm.record.create` | `NcmDefectRecord` 对象 | `R<NcmDefectRecord>` | 录入不良记录 |
| 4 | GET | `/api/v1/ncm/dashboard` | `ncm.record.list` | -- | `R<Map>` | 实时看板 |
| 5 | GET | `/api/v1/ncm/analysis/multi-dim` | `ncm.record.list` | ?dim(必填), ?startTime, ?endTime | `R<List<Map>>` | 多维分析 |
| 6 | GET | `/api/v1/ncm/analysis/trend` | `ncm.record.list` | ?granularity, ?startTime, ?endTime | `R<List<Map>>` | 趋势分析 |
| 7 | GET | `/api/v1/ncm/analysis/compare` | `ncm.record.list` | ?period(必填), ?type(默认month) | `R<Map>` | 环比/同比分析 |
| 8 | POST | `/api/v1/ncm/analysis/check-anomaly` | `ncm.record.list` | -- | `R<Map>` | 趋势异常检测(SR-NCM-017) |
| 9 | POST | `/api/v1/ncm/defect-records/{id}/launch-8d` | `ncm.8d.create` | `{id}` 路径参数 | `R<Qms8dReport>` | 不良记录发起 8D |
| 10 | POST | `/api/v1/ncm/defect-records/{id}/launch-capa` | `ncm.capa.create` | `{id}` 路径参数 | `R<QmsCapa>` | 不良记录发起 CAPA |

### NcmDefectRecord 实体字段

| 字段 | 类型 | 后端自动 | 说明 |
|------|------|----------|------|
| id | string (UUID) | -- | 主键 |
| orgId | string | **是** | 自动取登录用户 orgId,管理员兜底取首个 sys_org |
| defectNo | string | **是** | 自动生成: DF-{timestamp} |
| woNo | string | 否 | 工单号 |
| processCode | string | 否 | 工序编码 |
| defectDictCode | string | 否 | 不良字典编码(录入时校验字典存在) |
| severity | string | 否 | 严重度: 严重/一般 |
| defectCount | integer | 否 | 缺陷数量 |
| batchTotal | integer | 否 | 批次总量 |
| defectRate | number | **是** | 自动计算: defectCount / batchTotal |
| deviceCode | string | 否 | 设备编码 |
| batchNo | string | 否 | 批次号 |
| productModel | string | 否 | 产品型号 |
| operatorId | string | **是** | 自动取当前登录用户 ID |
| source | string | **是** | 默认 "手动" |
| devicePayload | string | 否 | 设备载荷(JSON) |
| occurredAt | string | **是** | 默认当前时间 |
| remark | string | 否 | 备注 |
| disposition | string | 否 | 处置方式 |

### 报表接口说明

**dashboard** 返回:
- `todayDefectCount`: 今日不良数
- `currentShiftDefectRate`: 当前班次不良率
- `ppm`: PPM(百万分之不良)
- `top5DefectTypes`: Top5 不良类型(按 defectDictCode 分组)
- `processHeatmap`: 工序热力图(按 processCode 分组)
- `dataFreshness`: 最新数据时间

**multi-dim** 维度(dim): `processCode` / `defectDictCode` / `deviceCode` / `batchNo`

**trend** 粒度(granularity): `day` / `week` / `month`

**compare** 类型(type): `week` / `month` / `year` / `mtd`(本月至今),返回不良率百分比 + 环比/同比变化率

**check-anomaly** (SR-NCM-017): 连续 5 天不良率上升 -> 标红预警,写入 ncm_trend_alert + 通知质量工程师

---

## 2. Ncm8dController -- 8D 报告

**Base**: `GET/POST /api/v1/ncm/8d-reports`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/8d-reports` | `ncm.8d.list` | -- | `R<List<Qms8dReport>>` | 8D 列表 |
| 2 | GET | `/api/v1/ncm/8d-reports/{id}` | `ncm.8d.list` | `{id}` 路径参数 | `R<EightDVo>` | 8D 详情含阶段 |
| 3 | POST | `/api/v1/ncm/8d-reports` | `ncm.8d.create` | `Qms8dReport` 对象 | `R<Qms8dReport>` | 创建 8D |
| 4 | POST | `/api/v1/ncm/8d-reports/launch` | `ncm.8d.create` | `Qms8dReport`(含 sourceRefId) | `R<Qms8dReport>` | 从异常单发起 8D |
| 5 | POST | `/api/v1/ncm/8d-reports/{id}/advance` | `ncm.8d.advance` | `{id}` + `AdvanceStageRequest` | `R<Void>` | 推进到下一阶段 |
| 6 | POST | `/api/v1/ncm/8d-reports/{id}/approve` | `ncm.8d.approve` | `{id}` + `StageApproveDTO` | `R<Void>` | 审批/驳回阶段 |
| 7 | POST | `/api/v1/ncm/8d-reports/{id}/reopen` | `ncm.8d.reopen` | `{id}` + ?reason | `R<Void>` | 重开已闭环 8D |

**Qms8dReport 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| d8No | string | 8D 编号(自动: 8D-{timestamp} 或 8D-S-{timestamp} 简易流程) |
| source | string | 来源: 手动/SPC报警/不良记录/SQM异常 |
| sourceRefId | string | 来源单据 ID |
| issue | string | 问题描述 |
| severity | string | 严重度: 高/中/低 |
| currentStage | string | 当前阶段: D1-D8 |
| status | string | 状态: 进行中/已闭环 |
| flowType | string | 流程类型: 8D/简易(简易流程直接 D8 闭环) |
| team | string | 团队成员 |
| capaTriggered | boolean | 是否已触发 CAPA |
| closeDate | string | 闭环日期 |

**AdvanceStageRequest 字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| stageCode | string | 是 | 当前阶段(D1-D8) |
| content | string | 是 | 阶段内容 |
| owner | string | 是 | 负责人 |

**StageApproveDTO 字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| stageCode | string | 是 | 审批阶段(D3/D5/D7) |
| approved | boolean | 是 | 是否通过 |
| comment | string | 否 | 审批意见 |
| approver | string | 是 | 审批人 |

**EightDVo 响应**:
| 字段 | 类型 | 说明 |
|------|------|------|
| report | Qms8dReport | 8D 报告 |
| stages | Qms8dStageDetail[] | 阶段明细列表 |

### 8D 状态机

```
                      创建
                       |
                       v
  D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8(闭环)
              |         |         |
           审批关    审批关    审批关
         (D3通过    (D5通过    (D7通过
          才可推     才可推     才可推
          进D4)     进D6)     进D8)
```

**核心规则**:
- **阶段顺序**: D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7 -> D8,必须按序推进
- **审批关口**: D3、D5、D7 需审批通过才能推进到下一阶段
- **驳回**: 审批不通过 -> currentStage 退回至审批阶段,允许重新提交
- **D4 自动触发 CAPA**: 8D-D4 阶段完成且 severity="高" 时,自动创建 CAPA(关联 d8Id + abnormalId);低/中不触发
- **D8 闭环**: 推进到 D8 完成最后一阶段 -> status="已闭环",回写来源异常单 status="已关闭"
- **重开** (reopen): 仅已闭环的 8D 可重开,status="进行中",currentStage 退回 D6(重新验证)
- **简易流程** (flowType="简易"): 创建时直接 D8 闭环,无中间阶段
- **乐观锁**: advance/approve/reopen 均使用 @Version 乐观锁,冲突时返回 409

---

## 3. NcmCapaController -- CAPA 纠正与预防措施

**Base**: `GET/POST /api/v1/ncm/capas`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/capas` | `ncm.capa.list` | -- | `R<List<QmsCapa>>` | CAPA 列表 |
| 2 | GET | `/api/v1/ncm/capas/{id}` | `ncm.capa.list` | `{id}` 路径参数 | `R<CapaVo>` | CAPA 详情含行动项 |
| 3 | POST | `/api/v1/ncm/capas` | `ncm.capa.create` | `QmsCapa` 对象 | `R<QmsCapa>` | 创建 CAPA |
| 4 | POST | `/api/v1/ncm/capas/{id}/progress` | `ncm.capa.create` | `{id}` + ?progress(必填) | `R<Void>` | 更新进度 |
| 5 | POST | `/api/v1/ncm/capas/{id}/close` | `ncm.capa.close` | `{id}` 路径参数 | `R<Void>` | 关闭 CAPA(闭环链路) |
| 6 | POST | `/api/v1/ncm/capas/{id}/approve` | `ncm.capa.approve` | `{id}` + `{approved,comment}` | `R<Void>` | 审批纠正/预防措施 |
| 7 | POST | `/api/v1/ncm/capas/{id}/reset` | `ncm.capa.reset` | `{id}` 路径参数 | `R<Void>` | 效果验证无效->重新分析 |

**QmsCapa 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| capaNo | string | CAPA 编号(自动: CAPA-{timestamp}) |
| d8Id | string | 关联 8D ID |
| abnormalId | string | 关联异常单 ID |
| issue | string | 问题描述 |
| triggerStage | string | 触发阶段(D4 等) |
| triggerType | string | 触发类型: 8D/重复问题/不良趋势异常/手动 |
| triggerCondition | string | 触发条件描述 |
| capaType | string | 类型: 纠正/纠正措施/预防措施 |
| rootcause | string | 根因分析 |
| actionPlan | string | 行动计划 |
| owner | string | 负责人 |
| dueDate | string | 截止日期(默认 30 天后) |
| progress | short | 进度(0-100) |
| status | string | 状态,见状态机 |
| esignId | string | 电子签名 ID |

**CapaVo 响应**:
| 字段 | 类型 | 说明 |
|------|------|------|
| capa | QmsCapa | CAPA 信息 |
| actions | QmsCapaAction[] | 行动项列表 |

### CAPA 状态机

```
待启动 ──(create)──> 分析中 ──(progress>=60)──> 待审批
                        ^                          |
                        |                    ┌─────┴─────┐
                        |                    |           |
                        |                 通过        驳回
                        |                    |           |
                        |                    v           v
                        |                 实施中 ──> 分析中(progress回退至50)
                        |                    |
                        |           (progress=100)
                        |                    |
                        |                    v
                        |                 已验证
                        |                    |
                        |             (close: 必须progress>=100)
                        |                    |
                        +──(reset)───        v
                        |              已关闭
                        |                    |
                        |                    +──> 关联8D闭环
                        |                    +──> 回写来源异常单
                        +────────────────────┘
```

**核心规则**:
- **创建**: 自动生成 capaNo, status="待启动", progress=0, dueDate 默认 30 天后
- **重复问题检测** (SR-CAR 分支4): 从异常单触发时,自动检测同供应商同物料 30 天内 >=2 次异常,满足则 triggerType="重复问题"
- **进度更新**: progress=100 -> status="已验证"; progress>=60 且当前非"实施中" -> status="待审批"
- **审批**: 通过 -> status="实施中"; 驳回 -> progress=50, status="分析中"
- **关闭** (close): 必须 progress>=100 且 status="已验证",否则拒绝
- **重置** (reset): progress=0, status="分析中"
- **闭环链路** (CAPA close 内部):
  - CAPA 关联 8D -> 自动将 8D 置为 D8 已闭环 -> 回写来源异常单 status="已关闭"
  - CAPA 仅关联异常单 -> 直接回写异常单 status="已关闭"

---

## 4. NcmCorrectiveActionController -- 纠正措施

**Base**: `GET/POST /api/v1/ncm/corrective-actions`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/corrective-actions` | `ncm.record.create` | -- | `R<List<NcmCorrectiveAction>>` | 纠正措施列表 |
| 2 | GET | `/api/v1/ncm/corrective-actions/{id}` | `ncm.record.create` | `{id}` 路径参数 | `R<NcmCorrectiveAction>` | 纠正措施详情 |
| 3 | POST | `/api/v1/ncm/corrective-actions` | `ncm.record.create` | `NcmCorrectiveAction` 对象 | `R<NcmCorrectiveAction>` | 创建纠正措施 |
| 4 | POST | `/api/v1/ncm/corrective-actions/{id}/progress` | `ncm.record.create` | `{id}` + ?progress(必填) | `R<Void>` | 更新进度 |
| 5 | POST | `/api/v1/ncm/corrective-actions/{id}/close` | `ncm.corrective.close` + `ncm.record.create` | `{id}` 路径参数 | `R<Void>` | 关闭纠正措施 |

**NcmCorrectiveAction 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| caNo | string | 纠正措施编号(自动) |
| defectNo | string | 关联不良编号 |
| issue | string | 问题描述 |
| owner | string | 负责人 |
| dueDate | string | 截止日期 |
| status | string | 状态 |
| progress | short | 进度(0-100) |

---

## 5. NcmDefectDictController -- 不良字典

**Base**: `GET/POST/PUT/DELETE /api/v1/ncm/defect-dicts`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/defect-dicts` | `ncm.defect.list` | -- | `R<List<NcmDefectDict>>` | 字典列表 |
| 2 | GET | `/api/v1/ncm/defect-dicts/{id}` | `ncm.defect.list` | `{id}` 路径参数 | `R<NcmDefectDict>` | 字典详情 |
| 3 | POST | `/api/v1/ncm/defect-dicts` | `ncm.defect.create` | `NcmDefectDict` 对象 | `R<NcmDefectDict>` | 创建字典 |
| 4 | PUT | `/api/v1/ncm/defect-dicts/{id}` | `ncm.defect.create` | `{id}` + `NcmDefectDict` 对象 | `R<Void>` | 更新字典 |
| 5 | DELETE | `/api/v1/ncm/defect-dicts/{id}` | `ncm.defect.delete` | `{id}` 路径参数 | `R<Void>` | 删除字典 |

**NcmDefectDict 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| code | string | 字典编码 |
| name | string | 不良名称 |
| category | string | 分类 |
| level | string | 级别 |
| status | string | 状态 |
| referenceCount | integer | 引用次数 |

---

## 6. NcmAlertEscalationController -- 告警升级配置

**Base**: `GET/POST/PUT/DELETE /api/v1/ncm/escalations`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/escalations` | `ncm.record.create` | -- | `R<List<NcmAlertEscalation>>` | 配置列表 |
| 2 | POST | `/api/v1/ncm/escalations` | `ncm.record.create` | `NcmAlertEscalation` 对象 | `R<NcmAlertEscalation>` | 创建配置 |
| 3 | PUT | `/api/v1/ncm/escalations/{id}` | `ncm.record.create` | `{id}` + `NcmAlertEscalation` 对象 | `R<Void>` | 更新配置 |
| 4 | DELETE | `/api/v1/ncm/escalations/{id}` | `ncm.record.delete` | `{id}` 路径参数 | `R<Void>` | 删除配置 |

**NcmAlertEscalation 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| level | integer | 升级级别 |
| timeoutMinutes | integer | 超时分钟数 |
| notifyRole | string | 通知角色 |
| offHoursDelay | boolean | 非工作时间延时 |

---

## 7. NcmFilterSchemeController -- 筛选方案

**Base**: `GET/POST/DELETE /api/v1/ncm/filter-schemes`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/filter-schemes` | `ncm.record.list` | -- | `R<List<NcmFilterScheme>>` | 方案列表 |
| 2 | POST | `/api/v1/ncm/filter-schemes` | `ncm.record.create` | `NcmFilterScheme` 对象 | `R<NcmFilterScheme>` | 创建方案 |
| 3 | DELETE | `/api/v1/ncm/filter-schemes/{id}` | `ncm.record.delete` | `{id}` 路径参数 | `R<Void>` | 删除方案 |

**NcmFilterScheme 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| schemeName | string | 方案名称 |
| ownerId | string | 所有者 |
| filterJson | string | 筛选条件 JSON |

---

## 8. NcmBiReportController -- BI 报表

**Base**: `GET/POST /api/v1/ncm/bi-reports`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/bi-reports` | `ncm.record.list` | -- | `R<List<NcmBiReport>>` | 报表列表 |
| 2 | GET | `/api/v1/ncm/bi-reports/{id}` | `ncm.record.list` | `{id}` 路径参数 | `R<NcmBiReport>` | 报表详情 |
| 3 | POST | `/api/v1/ncm/bi-reports` | `ncm.record.list` | `NcmBiReport` 对象 | `R<NcmBiReport>` | 生成报表 |

**NcmBiReport 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| reportNo | string | 报表编号 |
| reportType | string | 报表类型 |
| period | string | 周期 |
| generatedAt | string | 生成时间 |
| fileUrl | string | 文件 URL |
| status | string | 状态 |

---

## 9. NcmDailyReportConfigController -- 日报配置

**Base**: `GET/PUT /api/v1/ncm/daily-report-config`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/daily-report-config` | `ncm.record.create` | -- | `R<List<NcmDailyReportConfig>>` | 配置列表 |
| 2 | PUT | `/api/v1/ncm/daily-report-config` | `ncm.record.create` | `NcmDailyReportConfig` 对象 | `R<NcmDailyReportConfig>` | 保存配置 |
| 3 | PUT | `/api/v1/ncm/daily-report-config/{id}/toggle` | `ncm.record.create` | `{id}` + ?enabled(必填) | `R<Void>` | 启用/停用 |

**NcmDailyReportConfig 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| pushTime | LocalTime | 推送时间 |
| receivers | string | 接收人列表 |
| enabled | boolean | 是否启用 |

---

## 10. Qms8dFishboneController -- 8D 鱼骨图

**Base**: `GET/POST/PUT/DELETE /api/v1/ncm/fishbones`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/fishbones` | `ncm.8d.create` | ?d8Id(必填) | `R<List<Qms8dFishbone>>` | 鱼骨图列表 |
| 2 | POST | `/api/v1/ncm/fishbones` | `ncm.8d.create` | `Qms8dFishbone` 对象 | `R<Qms8dFishbone>` | 创建因素 |
| 3 | PUT | `/api/v1/ncm/fishbones/{id}` | `ncm.8d.create` | `{id}` + `Qms8dFishbone` 对象 | `R<Void>` | 更新因素 |
| 4 | DELETE | `/api/v1/ncm/fishbones/{id}` | `ncm.8d.delete` | `{id}` 路径参数 | `R<Void>` | 删除因素 |

**Qms8dFishbone 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| d8Id | string | 关联 8D ID |
| problem | string | 问题描述 |
| category | string | 分类(人/机/料/法/环/测) |
| causeText | string | 原因描述 |
| sortOrder | integer | 排序 |

---

## 11. NcmAnalysisController -- 不良分析报表(聚合)

**Base**: `GET /api/v1/ncm/aggregate`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/ncm/aggregate/analysis/aggregate` | (无 @PreAuthorize,全员可访问) | ?dim(必填) | `R<List<Map>>` | 维度聚合 |
| 2 | GET | `/api/v1/ncm/aggregate/analysis/cross` | (无 @PreAuthorize,全员可访问) | ?dim1, ?dim2(必填) | `R<List<Map>>` | 交叉分组 |
| 3 | GET | `/api/v1/ncm/aggregate/analysis/trend` | (无 @PreAuthorize,全员可访问) | ?period, ?start, ?end | `R<List<Map>>` | 时间趋势 |

**dim 参数**: `supplier` / `type` / `proc` / `dev` / `batch` / `product` / `severity`

**注意**: 此 Controller 使用独立 Base `/api/v1/ncm/aggregate`,与 `NcmDefectRecordController` 的 `/api/v1/ncm/analysis/*` 是不同路径,提供另一套聚合分析口径。

---

## 附录

### A. 8D 状态机总览

```
创建 8D
  |
  +-- flowType="简易" --> 直接 D8 闭环,status="已闭环"
  |
  +-- flowType="8D" --> D1(进行中)
                          |
                    advance D1 -> D2
                          |
                    advance D2 -> D3
                          |
                    advance D3 -> D4  (需 D3 审批通过)
                          |
                    advance D4 -> D5  (D4 完成时 severity="高" 自动触发 CAPA)
                          |
                    advance D5 -> D6  (需 D5 审批通过)
                          |
                    advance D6 -> D7
                          |
                    advance D7 -> D8  (需 D7 审批通过)
                          |
                    D8 闭环 -> status="已闭环" + 回写异常单
                          |
                    reopen -> status="进行中", currentStage=D6
```

### B. CAPA 状态机总览

```
待启动 ──> 分析中 ──> 待审批(progress>=60) ──> 实施中(审批通过) ──> 已验证(progress=100) ──> 已关闭
              ^            |                                                              |
              |            +── 驳回 -> 分析中(progress=50)                                 |
              |                                                                           |
              +── reset(效果验证无效) ────────────────────────────────────────────────────┘
```

### C. 联动关系

```
不良记录(NcmDefectRecord)
  ├── POST /defect-records/{id}/launch-8d  ──> 创建 8D(source="不良记录")
  └── POST /defect-records/{id}/launch-capa ──> 创建 CAPA(triggerType="不良趋势异常")

SPC 告警(SpcAlarm)
  └── POST /alarms/{id}/launch-8d ──> 创建 8D(source="SPC报警")

8D-D4 阶段完成 (severity="高")
  └── 自动触发 CAPA(triggerType="8D", triggerStage="D4")

CAPA 闭环(close)
  ├── 关联 8D -> 8D 闭环(D8) -> 回写异常单(status="已关闭")
  └── 仅关联异常单 -> 回写异常单(status="已关闭")

8D 闭环(D8 advance)
  └── 回写来源异常单(status="已关闭")
```

### D. 权限码汇总

| 权限码 | 说明 | 覆盖接口 |
|--------|------|----------|
| `ncm.record.list` | 查看不良记录/报表 | 8 个 GET 端点 |
| `ncm.record.create` | 录入不良记录/纠正措施/配置 | 8 个 POST + 7 个 PUT/DELETE |
| `ncm.record.delete` | 删除不良相关 | 筛选方案/告警配置删除 |
| `ncm.defect.list` | 查看不良字典 | 字典 GET |
| `ncm.defect.create` | 创建/编辑不良字典 | 字典 POST/PUT |
| `ncm.defect.delete` | 删除不良字典 | 字典 DELETE |
| `ncm.8d.list` | 查看 8D | 8D GET |
| `ncm.8d.create` | 创建 8D/鱼骨图/从不良发起 | 8D POST + launch + fishbone CRUD |
| `ncm.8d.advance` | 推进 8D 阶段 | 8D advance |
| `ncm.8d.approve` | 审批 8D 阶段 | 8D approve |
| `ncm.8d.reopen` | 重开 8D | 8D reopen |
| `ncm.8d.delete` | 删除鱼骨图 | fishbone DELETE |
| `ncm.capa.list` | 查看 CAPA | CAPA GET |
| `ncm.capa.create` | 创建 CAPA/更新进度/从不良发起 | CAPA POST + progress |
| `ncm.capa.close` | 关闭 CAPA | CAPA close |
| `ncm.capa.approve` | 审批 CAPA | CAPA approve |
| `ncm.capa.reset` | 重置 CAPA | CAPA reset |
| `ncm.corrective.close` | 关闭纠正措施 | CorrectiveAction close |

---

## 前端对接检查清单

| Controller | 端点 | 前端模块 | 已对接 | 备注 |
|------------|------|----------|--------|------|
| NcmDefectRecordController | 10 端点 | `defect-records.ts` | 是 | 含所有报表+launch-8d/capa |
| Ncm8dController | 7 端点 | `8d-reports.ts` | 是 | 含 launch/advance/approve/reopen |
| NcmCapaController | 7 端点 | `capas.ts` | 是 | 含 approve/reset |
| NcmCorrectiveActionController | 5 端点 | `corrective-actions.ts` | 是 | -- |
| NcmDefectDictController | 5 端点 | `defect-dicts.ts` | 是 | -- |
| NcmAlertEscalationController | 4 端点 | `escalations.ts` | 是 | -- |
| NcmFilterSchemeController | 3 端点 | `filter-schemes.ts` | 是 | -- |
| NcmBiReportController | 3 端点 | `bi-reports.ts` | 是 | -- |
| NcmDailyReportConfigController | 3 端点 | `daily-report-config.ts` | 是 | -- |
| Qms8dFishboneController | 4 端点 | `fishbones.ts` | 是 | -- |
| NcmAnalysisController | 3 端点 | **未对接** | 否 | `/api/v1/ncm/aggregate/analysis/*` 无前端模块 |

**总体**: NCM 域 11 个 Controller / 54 个端点,除 `NcmAnalysisController`(3 个聚合分析端点)外,前端全部已对接。

**缺失项**:
1. `NcmAnalysisController` (`/api/v1/ncm/aggregate/analysis/*`): 3 个端点前端无对应 API 模块,需新建 `src/api/modules/ncm/aggregate.ts` 或归入现有模块
2. 无缺失下拉数据源接口 -- 不良字典、筛选方案等均已有前端模块
3. 无缺失字段 -- 前端类型文件 `src/api/types/ncm.ts` 覆盖所有实体

**NCM 接口总数**: 54 个端点 (11 个 Controller)