# SPC API Reference

> 生成日期: 2026-07-24 | 数据源: OpenAPI 3.0 + Controller 源码 + Service 源码
> 前端路径: `qms-web/src/api/modules/spc/` (10 个模块,全部已对接)

---

## 1. SpcParamController -- SPC 参数主数据

**Base**: `GET/POST/PUT/DELETE /api/v1/spc/params`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/params` | `spc.param.list` | -- | `R<List<SpcParam>>` | 参数列表 |
| 2 | GET | `/api/v1/spc/params/{id}` | `spc.param.list` | `{id}` 路径参数 | `R<SpcParam>` | 参数详情 |
| 3 | POST | `/api/v1/spc/params` | `spc.param.create` | `SpcParam` 对象 | `R<SpcParam>` | 创建参数 |
| 4 | PUT | `/api/v1/spc/params/{id}` | `spc.param.create` | `{id}` + `SpcParam` 对象 | `R<Void>` | 更新参数 |
| 5 | DELETE | `/api/v1/spc/params/{id}` | `spc.param.delete` | `{id}` 路径参数 | `R<Void>` | 删除参数(软删除) |

**SpcParam 请求/响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 主键 |
| orgId | string | 所属组织 |
| paramName | string | 参数名称 |
| procName | string | 工序名称 |
| unit | string | 单位 |
| specLower | number | 规格下限(LSL) |
| specUpper | number | 规格上限(USL) |
| specText | string | 规格文本 |
| targetValue | number | 目标值 |
| subgroupSize | integer | 子组大小(n,默认 5) |
| collectFreq | string | 采集频率 |
| chartType | string | 控制图类型,见附录 |
| isActive | boolean | 是否启用 |

---

## 2. SpcSubgroupController -- 子组录入与查询

**Base**: `GET/POST /api/v1/spc/subgroups`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/subgroups` | `spc.subgroup.list` | ?paramId(可选) | `R<List<SpcSubgroup>>` | 子组列表 |
| 2 | GET | `/api/v1/spc/subgroups/{id}` | `spc.subgroup.list` | `{id}` 路径参数 | `R<SpcSubgroupVo>` | 子组详情含测量值 |
| 3 | POST | `/api/v1/spc/subgroups` | `spc.subgroup.create` | `CreateSubgroupRequest` | `R<SpcSubgroup>` | 录入子组(核心流程) |

**CreateSubgroupRequest 字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orgId | string | 否 | 组织 ID(集团管理员可空,自动取参数所属组织) |
| paramId | string | 是 | 关联 SPC 参数 ID |
| subgroupTime | string (datetime) | 否 | 采集时间(默认当前时间) |
| shift | string | 否 | 班次 |
| woNo | string | 否 | 工单号 |
| batchNo | string | 否 | 批次号 |
| values | number[] | 是 | 测量值数组(长度应与 subgroupSize 一致) |

**SpcSubgroupVo 响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| subgroup | SpcSubgroup | 子组信息 |
| measurements | SpcMeasurement[] | 测量值列表(含 seq, value) |

### 子组录入流程 (create 内部)

```
POST /api/v1/spc/subgroups
  |
  +-- 1. 校验参数存在 + 参数激活
  +-- 2. 兜底 orgId(集团管理员取参数 orgId)
  +-- 3. 计算 xbar = SUM(values)/n, rangeR = MAX(values) - MIN(values)
  +-- 4. WECO 8 规则判异(查最近 14 个子组,逐一检查①-⑧)
  |      - 命中: judge="异常", isOutlier=true, outlierRule=命中规则编号
  |      - 未命中: judge="正常", isOutlier=false
  |      - SR-SPC-015: 同时触发预警和报警时,仅展示报警(高级别优先)
  +-- 5. INSERT spc_subgroup (分区表,不做 update)
  +-- 6. INSERT spc_measurement (每个测量值独立一行)
  +-- 7. 判异命中 -> 生成告警
         - SR-SPC-018: 30 分钟内同参数同级别已报过则抑制(不建新 alarm)
         - 级别升级(预警->报警)视为新告警,不抑制
         - 新建 alarm(status="待确认"),推送通知(按启用渠道)
```

**注意**: 子组表为分区表,仅 INSERT + SELECT,不做 updateById。如需更新,用 LambdaUpdateWrapper 带分区键。

---

## 3. SpcAlarmController -- 告警查询与处置

**Base**: `GET/POST /api/v1/spc/alarms`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/alarms` | `spc.alarm.list` | -- | `R<List<SpcAlarm>>` | 告警列表 |
| 2 | POST | `/api/v1/spc/alarms/{id}/close` | `spc.alarm.close` | `{id}` + `CloseAlarmRequest` | `R<Void>` | 关闭告警 |
| 3 | POST | `/api/v1/spc/alarms/{id}/launch-8d` | `spc.alarm.launch-8d` | `{id}` 路径参数 | `R<Qms8dReport>` | 告警一键发起 8D |

**CloseAlarmRequest 字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| closeReason | string | 是 | 关闭原因(SR-SPC-017: 必须填写) |
| disposition | string | 是 | 处置措施(SR-SPC-017: 必须填写) |

**SpcAlarm 响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| code | string | 告警编号(AL-{timestamp}) |
| paramId | string | 关联参数 ID |
| paramName | string | 参数名称 |
| currentValue | number | 触发时 xbar 值 |
| triggeredRule | string | 命中规则编号(①-⑧) |
| level | string | 级别: 预警/报警 |
| subgroupStartNo | integer | 起始子组号 |
| subgroupEndNo | integer | 结束子组号 |
| alarmTime | string | 告警时间 |
| status | string | 状态: 待确认/已关闭 |
| closeReason | string | 关闭原因 |
| disposition | string | 处置措施 |
| closedBy | string | 关闭人 |
| closedAt | string | 关闭时间 |
| suppressUntil | string | 抑制截止时间 |
| woNo | string | 工单号 |
| batchNo | string | 批次号 |

### 告警状态机

```
[子组判异命中] --> status="待确认"
                      |
                      | POST /alarms/{id}/close (必须填 closeReason + disposition)
                      v
                  status="已关闭"
```

- 关闭校验: 仅 `待确认` 状态可关闭,`closeReason` 和 `disposition` 均不能为空
- SPC->8D 联动: `/alarms/{id}/launch-8d` 创建 8D 报告(source="SPC报警", severity=根据告警级别映射)

---

## 4. SpcControlLimitController -- 控制限管理

**Base**: `GET/POST /api/v1/spc/control-limits`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/control-limits` | `spc.param.list` | ?paramId(可选) | `R<List<SpcControlLimit>>` | 控制限列表 |
| 2 | POST | `/api/v1/spc/control-limits/calc` | `spc.param.list` | ?paramId(必填) | `R<SpcControlLimit>` | 计算控制限 |

**SpcControlLimit 响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| paramId | string | 关联参数 |
| chartType | string | 控制图类型 |
| baselineSource | string | 基线来源 |
| xbarUcl / xbarCl / xbarLcl | number | Xbar 图上控制限/中心线/下控制限 |
| rlcl / rcl / rucl | number | R 图下控制限/中心线/上控制限 |
| nsubgroups | integer | 参与计算的子组数 |
| isActive | boolean | 是否当前激活 |
| calcAt | string | 计算时间 |

---

## 5. SpcRuleController -- 判异规则管理

**Base**: `GET/PUT /api/v1/spc/rules`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/rules` | `spc.rule.list` | -- | `R<List<SpcRule>>` | 规则列表 |
| 2 | PUT | `/api/v1/spc/rules/{id}` | `spc.rule.list` | `{id}` + ?enabled(必填) | `R<Void>` | 启用/停用规则 |
| 3 | GET | `/api/v1/spc/rules/triggers` | `spc.rule.list` | -- | `R<List<SpcRuleTriggerVo>>` | 各规则触发次数统计 |

**SpcRule 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| ruleCode | string | 规则编号(①-⑧) |
| ruleName | string | 规则名称 |
| level | string | 级别: 预警/报警 |
| isEnabled | boolean | 是否启用 |
| sortNo | integer | 排序号 |

---

## 6. SpcCapabilityController -- 过程能力指数

**Base**: `GET/POST /api/v1/spc/capability`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/capability` | `spc.capability.list` | ?paramId(可选) | `R<List<SpcCapability>>` | 能力列表 |
| 2 | POST | `/api/v1/spc/capability/calc` | `spc.capability.list` | ?paramId(必填), ?periodType, ?periodValue | `R<SpcCapability>` | 计算 Cpk/Ppk |
| 3 | GET | `/api/v1/spc/capability/trend` | `spc.capability.list` | ?paramId, ?months(默认12) | `R<List<SpcCapability>>` | 能力趋势 |
| 4 | GET | `/api/v1/spc/capability/supplier-cpk` | `spc.capability.list` | -- | `R<List<SpcSupplierCpkVo>>` | 跨参数 CPK 对比 |

**SpcCapability 响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| paramId | string | 关联参数 |
| periodType | string | 周期类型 |
| periodValue | string | 周期值 |
| cpk | number | Cpk 值 |
| ppk | number | Ppk 值 |
| level | string | 能力等级,见附录 |
| sampleCount | integer | 样本数 |
| usl / lsl | number | 规格上下限 |
| calcWindowDays | integer | 计算窗口(天) |
| calcAt | string | 计算时间 |

**能力指数计算逻辑**:
- 样本 < 10: cpk/ppk = null, level = "样本过少,无法计算"
- 样本 10-29: 仍计算但 level = "数据不足,仅供参考"
- 样本 >= 30: 按 Cpk 值分级(见附录)

---

## 7. SpcChartController -- 控制图与看板

**Base**: `GET /api/v1/spc`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/control-chart` | `spc.param.list` | ?paramId(必填), ?startTime, ?endTime | `R<ControlChartVo>` | 控制图数据 |
| 2 | GET | `/api/v1/spc/histogram` | `spc.param.list` | ?paramId(可选) | `R<SpcHistogramVo>` | 直方图(12 分箱) |
| 3 | GET | `/api/v1/spc/dashboard` | `spc.param.list` | -- | `R<SpcDashboardVo>` | SPC 看板 |

**ControlChartVo 响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| subgroups | SpcSubgroup[] | 子组时间序列 |
| limit | SpcControlLimit | 当前激活控制限 |
| marks | ControlChartMark[] | 异常点标记(含 rule, level, 索引 i) |

**SpcDashboardVo 响应字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| cpkDistribution | object | Cpk 分布 |
| pendingAlarms | integer | 待确认告警数 |
| todaySubgroups | integer | 今日采集子组数 |
| todayDue | integer | 今日到期采集数 |

---

## 8. SpcCollectTaskController -- 采集任务管理

**Base**: `GET/POST /api/v1/spc/collect-tasks`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/collect-tasks` | `spc.subgroup.create` | -- | `R<List<SpcCollectTask>>` | 采集任务列表 |
| 2 | POST | `/api/v1/spc/collect-tasks` | `spc.subgroup.create` | `SpcCollectTask` 对象 | `R<SpcCollectTask>` | 创建采集任务 |
| 3 | POST | `/api/v1/spc/collect-tasks/{id}/downtime` | `spc.subgroup.create` | `{id}` + `DowntimeRequest` | `R<Void>` | 标记计划停机 |
| 4 | POST | `/api/v1/spc/collect-tasks/{id}/mark-missing` | `spc.subgroup.create` | `{id}` + ?reason | `R<Void>` | 标记采集缺失(SR-SPC-003) |
| 5 | POST | `/api/v1/spc/collect-tasks/scan-missing` | `spc.subgroup.create` | -- | `R<Integer>` | 扫描逾期未采集 |

**SpcCollectTask 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| paramId | string | 关联参数 |
| collectFreq | string | 采集频率 |
| lastValue | number | 上次采集值 |
| lastAt | string | 上次采集时间 |
| nextDueAt | string | 下次到期时间 |
| status | string | 状态 |
| isPlannedDowntime | boolean | 是否计划停机 |

**DowntimeRequest 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| isPlannedDowntime | boolean | 是否计划停机 |
| reason | string | 原因 |

---

## 9. SpcNotifyChannelController -- 通知渠道管理

**Base**: `GET/PUT /api/v1/spc/notify-channels`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/notify-channels` | `spc.param.list` | -- | `R<List<SpcNotifyChannel>>` | 渠道列表 |
| 2 | PUT | `/api/v1/spc/notify-channels/{id}/toggle` | `spc.param.list` | `{id}` + ?enabled(必填) | `R<Void>` | 启用/停用渠道 |
| 3 | GET | `/api/v1/spc/notify-channels/records` | `spc.param.list` | ?alarmId(可选) | `R<List<SpcNotifyRecord>>` | 通知发送记录 |

**SpcNotifyChannel 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| channel | string | 渠道类型(站内/邮件/短信/钉钉/企微) |
| isEnabled | boolean | 是否启用 |
| configJson | string | 渠道配置 JSON |

**SpcNotifyRecord 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| alarmId | string | 关联告警 |
| channel | string | 渠道 |
| channelName | string | 渠道名称 |
| message | string | 通知内容 |
| status | string | 发送状态 |
| sentAt | string | 发送时间 |
| error | string | 错误信息 |

---

## 10. SpcGlobalConfigController -- 全局配置

**Base**: `GET/PUT /api/v1/spc/global-config`

| # | 方法 | 路径 | 权限码 | 请求体/参数 | 响应 | 说明 |
|---|------|------|--------|------------|------|------|
| 1 | GET | `/api/v1/spc/global-config` | `spc.param.list` | ?orgId(可选) | `R<SpcGlobalConfig>` | 获取配置(无则返回默认) |
| 2 | PUT | `/api/v1/spc/global-config` | `spc.param.list` | `SpcGlobalConfig` 对象 | `R<Void>` | 保存配置 |

**SpcGlobalConfig 字段与默认值**:
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| baselineMode | string | "前25子组动态" | 基线模式 |
| defaultSubgroupSize | integer | 5 | 默认子组大小 |
| chartAutoRules | string | "①,④,⑤" | 默认启用的判异规则 |
| cpkPeriod | string | "month" | Cpk 计算周期 |
| cpkSufficient | number | 1.33 | Cpk 充足阈值 |
| cpkAcceptable | number | 1.00 | Cpk 尚可阈值 |
| specSource | string | "检验标准库" | 规格来源 |
| alertLevel | string | "提醒" | 默认告警级别 |
| suppressMinutes | integer | 30 | 重复告警抑制窗口(分钟) |

---

## 附录

### A. WECO 8 判异规则

| 编号 | 规则名称 | 判异条件 | 级别 | 默认启用 |
|------|----------|----------|------|----------|
| 1 | 1 点超出 3sigma | 1 个点超出 UCL 或 LCL | 报警 | 是 |
| 2 | 连续 3 点中 2 点在 A 区 | 连续 3 点中 2 点超出 2sigma 同侧 | 报警 | 否 |
| 3 | 连续 5 点中 4 点在 B 区外 | 连续 5 点中 4 点超出 1sigma 同侧 | 报警 | 否 |
| 4 | 连续 8 点在中心线一侧 | 连续 8 个点均在中心线同侧 | 预警 | 是 |
| 5 | 连续 6 点递增或递减 | 连续 6 个点单调上升或下降 | 预警 | 是 |
| 6 | 连续 14 点交替上下 | 连续 14 个点交替升降 | 预警 | 否 |
| 7 | 连续 15 点在 C 区 | 连续 15 个点均在 1sigma 内 | 预警 | 是 |
| 8 | 连续 8 点在 B 区外 | 连续 8 个点均在 1sigma 外 | 预警 | 否 |

> 级别映射: 规则 1/2/3 = 报警, 规则 4/5/6/7/8 = 预警
> 判异算法: 查最近 14 个子组(不含当前),计算 CL/UCL/LCL,与当前 xbar 比较
> 同时命中多规则: 报警优先返回(SR-SPC-015)

### B. 控制图类型枚举

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| Xbar-R | 均值-极差控制图 | 子组大小 2-10,计量值 |
| Xbar-S | 均值-标准差控制图 | 子组大小 >10,计量值 |
| I-MR | 单值-移动极差控制图 | 子组大小=1,计量值 |
| P | 不合格品率控制图 | 计数值,样本大小可变 |

> d2 因子表: n=2:1.128, n=3:1.693, n=4:2.059, n=5:2.326, n=6:2.534, n=7:2.704, n=8:2.847, n=9:2.970, n=10:3.078

### C. 能力指数分级

| 等级 | Cpk 范围 | 判定 |
|------|----------|------|
| 充足 | Cpk >= 1.33 | 过程能力充分 |
| 尚可 | 1.0 <= Cpk < 1.33 | 过程能力尚可,需关注 |
| 不足 | Cpk < 1.0 | 过程能力不足,需改进 |

> 样本数 < 10: 不计算,标注"样本过少,无法计算"
> 样本数 10-29: 仍计算但标注"数据不足,仅供参考"

### D. 告警状态机

```
待确认 ──(close: 需填 closeReason+disposition)──> 已关闭
```

- 关闭校验: status 必须为"待确认", `closeReason` 和 `disposition` 均不能为空
- 告警抑制: 30 分钟内同参数同级别不重复建告警;级别升级(预警->报警)视为新告警

---

## 前端对接检查清单

| Controller | 端点 | 前端模块 | 已对接 | 备注 |
|------------|------|----------|--------|------|
| SpcParamController | 5 端点 | `spc/params.ts` | 是 | CRUD 完整 |
| SpcSubgroupController | 3 端点 | `spc/subgroups.ts` | 是 | 含测量值详情 |
| SpcAlarmController | 3 端点 | `spc/alarms.ts` | 是 | 含 close + launch-8d |
| SpcControlLimitController | 2 端点 | `spc/control-limits.ts` | 是 | -- |
| SpcRuleController | 3 端点 | `spc/rules.ts` | 是 | 含 triggers 统计 |
| SpcCapabilityController | 4 端点 | `spc/capability.ts` | 是 | 含 supplier-cpk |
| SpcChartController | 3 端点 | `spc/dashboard.ts` | 是 | 含 histogram |
| SpcCollectTaskController | 5 端点 | `spc/collect-tasks.ts` | 是 | 含 mark-missing/scan-missing |
| SpcNotifyChannelController | 3 端点 | `spc/notify-channels.ts` | 是 | -- |
| SpcGlobalConfigController | 2 端点 | `spc/global-config.ts` | 是 | -- |

**总体**: SPC 域 10 个 Controller / 33 个端点,前端全部已对接。无缺失下拉数据源接口,无缺字段。

**SPC 接口总数**: 33 个端点 (10 个 Controller)