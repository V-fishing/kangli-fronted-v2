# QMS 前端字段对照表

> 生成日期: 2026-07-25 | 数据源: `.openapi.json` components/schemas + 7 域 API 参考文档 + `BaseEntity.java`
> 用途: 前端开发时按域查阅每个实体/DTO 的字段和前端处理方式

**图例**:
- **只读**: 后端自动处理，前端不传，仅展示
- **隐藏**: 取 `auth.user.orgId`，表单中隐藏自动填
- **下拉**: 有后端列表接口，前端做下拉选择
- **枚举**: 枚举值，前端做下拉(值从后端代码/字典提取)
- **自由输入**: 无后端列表接口，前端自由输入(等补接口)
- **自动计算**: 后端计算，前端不传
- **必填**: 创建/更新时必填

---

## 通用 BaseEntity 字段(所有继承 BaseEntity 的实体)

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | UUIDv7，后端自动生成 |
| createdAt | string(date-time) | **只读** | 创建时间，自动填充 |
| updatedAt | string(date-time) | **只读** | 更新时间，自动填充 |
| createdBy | string | **只读** | 创建人 ID，自动填充 |
| updatedBy | string | **只读** | 更新人 ID，自动填充 |
| isDeleted | boolean | **只读** | 软删除标志，后端管理 |
| version | integer | **只读** | 乐观锁版本号，后端管理 |
| orgId | string | **隐藏** | 取 auth.user.orgId(管理员可手动选) |

> 以下各域实体中，BaseEntity 字段不重复列出，仅列出**业务字段**。标注"继承 BaseEntity"的实体包含上述全部字段。

---

## 1. UOP 域

### 1.1 SysUser (用户)

**表**: `ops.sys_user` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| username | string | 自由输入 | 用户名 |
| passwordHash | string | **只读** | 密码哈希，列表不展示 |
| orgId | string | **隐藏** | null=跨公司管理员 |
| realName | string | 自由输入 | 真实姓名 |
| status | string | **枚举** | 启用/停用 |
| failCount | integer | **只读** | 登录失败次数 |
| lockUntil | string(date-time) | **只读** | 锁定截止时间 |

### 1.2 CreateUserRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| username | string | 是 | 自由输入 | |
| password | string | 是 | 自由输入 | 明文密码 |
| realName | string | 是 | 自由输入 | |
| orgId | string | 否 | **隐藏** | |
| status | string | 否 | **枚举** | 默认"启用" |

### 1.3 UpdateUserRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| realName | string | 否 | 自由输入 | |
| orgId | string | 否 | **隐藏** | |
| status | string | 否 | **枚举** | 启用/停用 |

### 1.4 SysRole (角色)

**表**: `ops.sys_role` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| roleCode | string | 自由输入 | 如 `mz.qe`, `sz.sqe` |
| roleName | string | 自由输入 | 角色名称 |
| roleType | string | 自由输入 | 角色类型 |
| permDesc | string | 自由输入 | 权限描述 |
| status | string | **枚举** | 启用/停用 |

### 1.5 SysOrg (组织)

**表**: `ops.sys_org` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| orgCode | string | 自由输入 | 组织编码 |
| orgName | string | 自由输入 | 组织名称 |
| parentId | string | **下拉** | 父组织，null=顶级 |
| sortOrder | integer | 自由输入 | 排序 |
| orgType | string | **枚举** | 公司/工厂/车间/产线/工位 |
| status | string | **枚举** | 启用/停用 |

### 1.6 SysMenu (菜单)

**表**: `ops.sys_menu` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| parentId | string | **下拉** | 父菜单ID，null=顶级 |
| menuCode | string | 自由输入 | 菜单编码 |
| menuName | string | 自由输入 | 菜单名称 |
| menuType | string | **枚举** | 菜单/按钮/目录 |
| path | string | 自由输入 | 前端路由路径 |
| component | string | 自由输入 | 前端组件路径 |
| icon | string | 自由输入 | 图标 |
| sortOrder | integer | 自由输入 | 排序 |
| visible | boolean | 自由输入 | 是否可见 |

### 1.7 SysDict (字典)

**表**: `ops.sys_dict` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| dictType | string | 自由输入 | 如 `fia_trigger_type` |
| dictKey | string | 自由输入 | 字典键(value) |
| dictValue | string | 自由输入 | 字典值(label) |
| sortOrder | integer | 自由输入 | 排序 |
| enabled | boolean | 自由输入 | 是否启用 |

### 1.8 SysDelegation (代班)

**表**: `ops.sys_delegation` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| delegatorId | string | **下拉** | 委托人，用户列表 |
| delegateeId | string | **下拉** | 被委托人，用户列表 |
| roleId | string | **下拉** | 委托角色 |
| startAt | string(date-time) | 日期选择 | 开始时间 |
| endAt | string(date-time) | 日期选择 | 结束时间 |
| status | string | **枚举** | 生效/已过期/已撤销 |

### 1.9 LoginRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| username | string | 是 | 自由输入 | |
| password | string | 是 | 自由输入 | 明文密码 |

### 1.10 LoginResponse

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| accessToken | string | **只读** | 存 localStorage['qms_token'] |
| tokenType | string | **只读** | 固定 "Bearer" |
| expiresIn | integer(int64) | **只读** | 28800 秒 |

### 1.11 CurrentUserVo

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| userId | string | **只读** | |
| username | string | **只读** | |
| orgId | string | **只读** | null=管理员 |
| dataScope | string | **只读** | "all" 或 UUID |
| permissions | string[] | **只读** | 权限码数组 |

---

## 2. FIA 域

### 2.1 FiaTask (首件检验任务)

**表**: `ops.fia_task` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| code | string | **只读** | 自动生成 `FA-{timestamp}` |
| woNo | string | 自由输入 | 工单号 |
| lineName | string | 自由输入 | 产线名称 |
| productName | string | 自由输入 | 产品名称 |
| procName | string | 自由输入 | 工序名称 |
| triggerType | string | **下拉** | GET /v1/fia/triggers |
| stdId | string | **下拉** | GET /v1/fia/stds，可选 |
| stdVersion | string | **只读** | 从标准库复制 |
| aql | string | **只读** | 从标准库复制 |
| sampleSize | integer | **只读** | 来料批次自动计算 |
| sampleCount | integer | **只读** | 实际检验数量 |
| batchNo | string | 自由输入 | 批次号 |
| status | string | **只读+色标** | 9 态枚举，自动流转 |
| overallJudge | string | **只读** | 综合判定 |
| inspectorId | string | **只读** | 检验人 |
| isUrgent | boolean | 自由输入 | 是否紧急 |
| slaDueAt | string(date-time) | **只读** | 默认 now+2小时 |
| isOverdue | boolean | **只读** | 是否超时 |
| disposition | string | **枚举** | 处置路径 |
| remark | string | 自由输入 | 备注 |
| submittedAt | string(date-time) | **只读** | 提交时间 |
| reviewerId | string | **只读** | 复核人 |
| reviewedAt | string(date-time) | **只读** | 复核时间 |
| approverId | string | **只读** | 批准人 |
| approvedAt | string(date-time) | **只读** | 批准时间 |

### 2.2 CreateFiaTaskRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| orgId | string | 是 | **隐藏** | |
| woNo | string | 是 | 自由输入 | |
| lineName | string | 是 | 自由输入 | |
| productName | string | 是 | 自由输入 | |
| procName | string | 是 | 自由输入 | |
| triggerType | string | 是 | **下拉** | GET /v1/fia/triggers |
| stdId | string | 否 | **下拉** | 可选，为空时自动匹配 |
| batchNo | string | 否 | 自由输入 | |
| isUrgent | boolean | 否 | 自由输入 | |
| remark | string | 否 | 自由输入 | |

### 2.3 FiaInspStd (检验标准)

**表**: `ops.fia_insp_std` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| code | string | 自由输入 | 标准编码 |
| material | string | 自由输入 | 物料/产品名称 |
| procName | string | 自由输入 | 工序名称 |
| aql | string | 自由输入 | AQL 值 |
| inspectLevel | string | 自由输入 | 检验水平 |
| samplePlan | string | 自由输入 | 抽样方案 |
| ctqText | string | 自由输入 | CTQ 描述 |
| stdVersion | string | 自由输入 | 版本号 |
| status | string | **枚举** | 草稿/生效/停用 |
| prevVersionId | string | **只读** | 上一版本ID |

### 2.4 CreateInspStdRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| orgId | string | 是 | **隐藏** | |
| code | string | 是 | 自由输入 | |
| material | string | 是 | 自由输入 | |
| procName | string | 是 | 自由输入 | |
| aql | string | 否 | 自由输入 | |
| inspectLevel | string | 否 | 自由输入 | |
| samplePlan | string | 否 | 自由输入 | |
| ctqText | string | 否 | 自由输入 | |
| stdVersion | string | 否 | 自由输入 | |
| status | string | 否 | **枚举** | 默认"草稿" |
| items | FiaStdItemRequest[] | 否 | 嵌套表单 | 检验项列表 |

### 2.5 FiaStdItemRequest (检验项)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| seq | integer | 否 | 自由输入 | 序号 |
| itemName | string | 否 | 自由输入 | 检验项名称 |
| isCtq | boolean | 否 | 自由输入 | 是否 CTQ |
| stdValue | string | 否 | 自由输入 | 标准值 |
| tolerance | string | 否 | 自由输入 | 公差 |
| unit | string | 否 | 自由输入 | 单位 |
| valueType | string | 否 | **枚举** | numeric/enum |
| enumValues | string | 否 | 自由输入 | 枚举值 |

### 2.6 FiaTriggerType (触发类型)

**表**: `ops.fia_trigger_type` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| name | string | 自由输入 | 换模/换设备/首班/换料/停线重启/来料入库 |
| isEnabled | boolean | 自由输入 | 是否启用 |
| description | string | 自由输入 | 描述 |

### 2.7 FiaSignConfig (签名配置)

**表**: `ops.fia_sign_config` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **隐藏** | 自动从 CompanyContext 填充 |
| signMethods | string[] | 多选 | password/handwriting/ca |
| signNodes | string | **枚举** | 两级/三级 |
| signGranularity | string | **枚举** | 整单签名/逐项签名 |
| lockAfterFail | integer | 自由输入 | 默认3 |
| lockMinutes | integer | 自由输入 | 默认5 |

### 2.8 FiaInterceptConfig (拦截配置)

**表**: `ops.fia_intercept_config` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **隐藏** | 自动填充 |
| interceptMode | string | **枚举** | 拦截模式 |
| multiTriggerMode | string | **枚举** | 多触发模式 |
| slaHours | number | 自由输入 | SLA 超时小时数 |
| escalateFailCount | integer | 自由输入 | 升级失败次数阈值 |

### 2.9 FiaApproval (审批单)

**表**: `ops.fia_approval` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| code | string | **只读** | 自动生成 `AP-{timestamp}` |
| approvalType | string | **枚举** | 让步接收/紧急放行/豁免开工 |
| woNo | string | 自由输入 | 工单号 |
| taskId | string | 关联 | 关联任务 |
| reason | string | 自由输入 | 申请原因 |
| applicantId | string | **只读** | 自动填充申请人 |
| applyAt | string(date-time) | **只读** | 自动填充申请时间 |
| status | string | **只读+色标** | 待审批/已通过/已驳回 |
| approverId | string | **只读** | 审批人 |
| approveOpinion | string | **只读** | 审批意见 |
| approveAt | string(date-time) | **只读** | 审批时间 |
| esignId | string | **只读** | 电子签名ID |

### 2.10 SignRequest (签名请求)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| password | string | 否 | 自由输入 | signMethods 含 password 时必填 |
| itemId | string | 否 | 关联 | 逐项签名时传检验项ID |

### 2.11 InspItemResultRequest (检验结果录入)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| items | Item[] | 否 | 嵌套表单 | 检验项数组 |
| items[].id | string | 否 | 关联 | fia_insp_item.id |
| items[].measuredValue | string | 否 | 自由输入 | 测量值 |
| items[].judge | string | 否 | **枚举** | 合格/不合格/- |

### 2.12 FiaInspItem (检验项，响应)

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| taskId | string | **只读** | |
| seq | integer | **只读** | 序号 |
| itemName | string | **只读** | |
| isCtq | boolean | **只读** | |
| stdValue | string | **只读** | |
| tolerance | string | **只读** | |
| unit | string | **只读** | |
| measuredValue | string | **只读** | |
| judge | string | **只读** | |
| stdItemId | string | **只读** | |

---

## 3. SPC 域

### 3.1 SpcParam (SPC 参数)

**表**: `ops.spc_param` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| paramName | string | 自由输入 | 参数名称 |
| procName | string | 自由输入 | 工序名称 |
| unit | string | 自由输入 | 单位 |
| specLower | number | 自由输入 | 规格下限(LSL) |
| specUpper | number | 自由输入 | 规格上限(USL) |
| specText | string | 自由输入 | 规格文本 |
| targetValue | number | 自由输入 | 目标值 |
| subgroupSize | integer | 自由输入 | 子组大小(默认5) |
| collectFreq | string | 自由输入 | 采集频率 |
| chartType | string | **枚举** | Xbar-R/Xbar-S/I-MR/P |
| isActive | boolean | 自由输入 | 是否启用 |

### 3.2 CreateSubgroupRequest (子组录入)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| orgId | string | 否 | **隐藏** | 集团管理员可空 |
| paramId | string | 是 | **下拉** | GET /v1/spc/params |
| subgroupTime | string(date-time) | 否 | 日期选择 | 默认当前时间 |
| shift | string | 否 | 自由输入 | 班次 |
| woNo | string | 否 | 自由输入 | 工单号 |
| batchNo | string | 否 | 自由输入 | 批次号 |
| values | number[] | 是 | 数组输入 | 长度应与 subgroupSize 一致 |

### 3.3 SpcSubgroup (子组，响应)

**表**: `ops.spc_subgroup`(分区表) | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| paramId | string | **只读** | |
| subgroupNo | integer | **只读** | 子组序号 |
| subgroupTime | string(date-time) | **只读** | |
| shift | string | **只读** | |
| n | integer | **只读** | 子组大小 |
| xbar | number | **只读** | 均值 |
| rangeR | number | **只读** | 极差 |
| judge | string | **只读** | 正常/异常 |
| isOutlier | boolean | **只读** | 是否异常 |
| outlierRule | string | **只读** | 命中规则编号 |
| dataSource | string | **只读** | 数据来源 |
| operatorId | string | **只读** | 操作人 |
| woNo | string | **只读** | |
| batchNo | string | **只读** | |
| createdAt | string(date-time) | **只读** | |
| createdBy | string | **只读** | |

### 3.4 SpcAlarm (SPC 告警)

**表**: `ops.spc_alarm` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| code | string | **只读** | 自动生成 `AL-{timestamp}` |
| paramId | string | **只读** | 关联参数 |
| paramName | string | **只读** | 参数名称 |
| currentValue | number | **只读** | 触发时 xbar 值 |
| triggeredRule | string | **只读** | 命中规则编号(①-⑧) |
| level | string | **只读** | 预警/报警 |
| subgroupStartNo | integer | **只读** | 起始子组号 |
| subgroupEndNo | integer | **只读** | 结束子组号 |
| alarmTime | string(date-time) | **只读** | 告警时间 |
| status | string | **只读+色标** | 待确认/已关闭 |
| closeReason | string | **只读** | 关闭原因 |
| disposition | string | **只读** | 处置措施 |
| closedBy | string | **只读** | 关闭人 |
| closedAt | string(date-time) | **只读** | 关闭时间 |
| suppressUntil | string(date-time) | **只读** | 抑制截止时间 |
| woNo | string | **只读** | 工单号 |
| batchNo | string | **只读** | 批次号 |

### 3.5 CloseAlarmRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| closeReason | string | 是 | 自由输入 | 关闭原因 |
| disposition | string | 是 | 自由输入 | 处置措施 |

### 3.6 SpcControlLimit (控制限)

**表**: `ops.spc_control_limit` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| paramId | string | **只读** | |
| chartType | string | **只读** | |
| baselineSource | string | **只读** | |
| xbarUcl | number | **只读** | 上控制限 |
| xbarCl | number | **只读** | 中心线 |
| xbarLcl | number | **只读** | 下控制限 |
| rlcl | number | **只读** | R 图下控制限 |
| rcl | number | **只读** | R 图中心线 |
| rucl | number | **只读** | R 图上控制限 |
| nsubgroups | integer | **只读** | 参与计算的子组数 |
| calcAt | string(date-time) | **只读** | |
| isActive | boolean | **只读** | 是否当前激活 |

### 3.7 SpcRule (判异规则)

**表**: `ops.spc_rule` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| ruleCode | string | **只读** | 规则编号(①-⑧) |
| ruleName | string | **只读** | 规则名称 |
| level | string | **只读** | 预警/报警 |
| isEnabled | boolean | 自由输入 | 启用/停用 |
| sortNo | integer | **只读** | 排序号 |

### 3.8 SpcCapability (过程能力)

**表**: `ops.spc_capability` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| paramId | string | **只读** | |
| periodType | string | **只读** | 周期类型 |
| periodValue | string | **只读** | 周期值 |
| cpk | number | **只读** | Cpk 值 |
| ppk | number | **只读** | Ppk 值 |
| level | string | **只读** | 能力等级 |
| sampleCount | integer | **只读** | 样本数 |
| usl | number | **只读** | 规格上限 |
| lsl | number | **只读** | 规格下限 |
| calcWindowDays | integer | **只读** | 计算窗口(天) |
| calcAt | string(date-time) | **只读** | 计算时间 |

### 3.9 SpcCollectTask (采集任务)

**表**: `ops.spc_collect_task` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| paramId | string | **下拉** | GET /v1/spc/params |
| collectFreq | string | 自由输入 | 采集频率 |
| lastValue | number | **只读** | 上次采集值 |
| lastAt | string(date-time) | **只读** | 上次采集时间 |
| nextDueAt | string(date-time) | **只读** | 下次到期时间 |
| status | string | **只读** | 状态 |
| isPlannedDowntime | boolean | 自由输入 | 是否计划停机 |

### 3.10 SpcNotifyChannel (通知渠道)

**表**: `ops.spc_notify_channel` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| channel | string | **枚举** | 站内/邮件/短信/钉钉/企微 |
| isEnabled | boolean | 自由输入 | 启用/停用 |
| configJson | string | 自由输入 | 渠道配置 JSON |

### 3.11 SpcGlobalConfig (全局配置)

**表**: `ops.spc_global_config` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **隐藏** | |
| baselineMode | string | **枚举** | 默认"前25子组动态" |
| defaultSubgroupSize | integer | 自由输入 | 默认5 |
| chartAutoRules | string | 自由输入 | 默认"①,④,⑤" |
| cpkPeriod | string | 自由输入 | 默认"month" |
| cpkSufficient | number | 自由输入 | 默认1.33 |
| cpkAcceptable | number | 自由输入 | 默认1.00 |
| specSource | string | 自由输入 | |
| alertLevel | string | **枚举** | 默认"提醒" |
| suppressMinutes | integer | 自由输入 | 默认30 |

### 3.12 DowntimeRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| isPlannedDowntime | boolean | 是 | 自由输入 | |
| reason | string | 否 | 自由输入 | |

---

## 4. NCM 域

### 4.1 NcmDefectRecord (不良记录)

**表**: `ops.ncm_defect_record` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| defectNo | string | **只读** | 自动生成 `DF-{timestamp}` |
| woNo | string | 自由输入 | 工单号 |
| processCode | string | 自由输入 | 工序编码 |
| defectDictCode | string | **下拉** | GET /v1/ncm/defect-dicts |
| severity | string | **枚举** | 严重/一般 |
| defectCount | integer | 自由输入 | 缺陷数量 |
| batchTotal | integer | 自由输入 | 批次总量 |
| defectRate | number | **自动计算** | defectCount/batchTotal |
| deviceCode | string | 自由输入 | 设备编码 |
| batchNo | string | 自由输入 | 批次号 |
| productModel | string | 自由输入 | 产品型号 |
| operatorId | string | **只读** | 自动取当前用户 ID |
| source | string | **只读** | 默认"手动" |
| devicePayload | string | 自由输入 | 设备载荷(JSON) |
| occurredAt | string(date-time) | **只读** | 默认当前时间 |
| remark | string | 自由输入 | 备注 |
| disposition | string | **枚举** | 处置方式 |

### 4.2 NcmDefectDict (不良字典)

**表**: `ops.ncm_defect_dict` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| code | string | 自由输入 | 字典编码 |
| name | string | 自由输入 | 不良名称 |
| category | string | 自由输入 | 分类 |
| level | string | **枚举** | 级别 |
| status | string | **枚举** | 状态 |
| referenceCount | integer | **只读** | 引用次数 |

### 4.3 Qms8dReport (8D 报告)

**表**: `ops.qms_8d_report` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| d8No | string | **只读** | 自动 `8D-{timestamp}` 或 `8D-S-{timestamp}` |
| source | string | **枚举** | 手动/SPC报警/不良记录/SQM异常 |
| sourceRefId | string | 关联 | 来源单据ID |
| issue | string | 自由输入 | 问题描述 |
| severity | string | **枚举** | 高/中/低 |
| currentStage | string | **只读+色标** | D1-D8 |
| status | string | **只读+色标** | 进行中/已闭环 |
| flowType | string | **枚举** | 8D/简易 |
| team | string | 自由输入 | 团队成员 |
| capaTriggered | boolean | **只读** | D4+高严重度自动触发 |
| closeDate | string(date) | **只读** | 闭环日期 |

### 4.4 AdvanceStageRequest (阶段推进)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| stageCode | string | 是 | **枚举** | D1-D8 |
| content | string | 是 | 自由输入 | 阶段内容 |
| owner | string | 是 | 自由输入 | 负责人 |

### 4.5 StageApproveDTO (阶段审批)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| stageCode | string | 是 | **枚举** | D3/D5/D7 |
| approved | boolean | 是 | 自由输入 | 是否通过 |
| comment | string | 否 | 自由输入 | 审批意见 |
| approver | string | 是 | 自由输入 | 审批人 |

### 4.6 QmsCapa (CAPA)

**表**: `ops.qms_capa` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| capaNo | string | **只读** | 自动 `CAPA-{timestamp}` |
| d8Id | string | 关联 | 关联8D ID |
| abnormalId | string | 关联 | 关联异常单ID |
| issue | string | 自由输入 | 问题描述 |
| triggerStage | string | **只读** | 触发阶段 |
| triggerType | string | **枚举** | 8D/重复问题/不良趋势异常/手动 |
| triggerCondition | string | **只读** | 触发条件描述 |
| capaType | string | **枚举** | 纠正/纠正措施/预防措施 |
| rootcause | string | 自由输入 | 根因分析 |
| actionPlan | string | 自由输入 | 行动计划 |
| owner | string | 自由输入 | 负责人 |
| dueDate | string(date) | 日期选择 | 默认30天后 |
| progress | integer | 自由输入 | 0-100 |
| status | string | **只读+色标** | 6态: 待启动/分析中/待审批/实施中/已验证/已关闭 |
| esignId | string | **只读** | 电子签名ID |

### 4.7 NcmCorrectiveAction (纠正措施)

**表**: `ops.ncm_corrective_action` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| caNo | string | **只读** | 自动生成 |
| defectNo | string | 关联 | 关联不良编号 |
| issue | string | 自由输入 | 问题描述 |
| owner | string | 自由输入 | 负责人 |
| dueDate | string(date) | 日期选择 | 截止日期 |
| status | string | **只读+色标** | 状态 |
| progress | integer | 自由输入 | 0-100 |

### 4.8 NcmAlertEscalation (告警升级)

**表**: `ops.ncm_alert_escalation` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **隐藏** | |
| level | integer | 自由输入 | 升级级别 |
| timeoutMinutes | integer | 自由输入 | 超时分钟数 |
| notifyRole | string | 自由输入 | 通知角色 |
| offHoursDelay | boolean | 自由输入 | 非工作时间延时 |

### 4.9 NcmFilterScheme (筛选方案)

**表**: `ops.ncm_filter_scheme` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| schemeName | string | 自由输入 | 方案名称 |
| ownerId | string | **只读** | 所有者 |
| filterJson | string | 自由输入 | 筛选条件 JSON |

### 4.10 Qms8dFishbone (鱼骨图)

**表**: `ops.qms_8d_fishbone` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| d8Id | string | 关联 | 关联8D ID |
| problem | string | 自由输入 | 问题描述 |
| category | string | **枚举** | 人/机/料/法/环/测 |
| causeText | string | 自由输入 | 原因描述 |
| sortOrder | integer | 自由输入 | 排序 |

### 4.11 NcmBiReport (BI 报表)

**表**: `ops.ncm_bi_report` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| reportNo | string | **只读** | 报表编号 |
| reportType | string | **枚举** | 报表类型 |
| period | string | 自由输入 | 周期 |
| generatedAt | string(date-time) | **只读** | 生成时间 |
| fileUrl | string | **只读** | 文件URL |
| status | string | **只读** | 状态 |

### 4.12 NcmDailyReportConfig (日报配置)

**表**: `ops.ncm_daily_report_config` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| pushTime | LocalTime | 时间选择 | `{hour,minute,second,nano}` |
| receivers | string | 自由输入 | 接收人列表 |
| enabled | boolean | 自由输入 | 是否启用 |

---

## 5. SQM 域

### 5.1 SqmSupplier (供应商)

**表**: `ops.sqm_supplier` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| supplierNo | string | **只读** | 自动 `SUP-{timestamp}` |
| supplierCode | string | 自由输入 | 供应商编码 |
| name | string | 自由输入 | 供应商名称 |
| creditCode | string | 自由输入 | 统一社会信用代码 |
| category | string | 自由输入 | 分类 |
| level | string | **只读+色标** | A/B/C/D，审核联动 |
| status | string | **枚举** | 启用/停用/待审核 |
| score | number | **只读** | 自动联动更新 |
| contactPerson | string | 自由输入 | 联系人 |
| contactPhone | string | 自由输入 | 联系电话 |
| address | string | 自由输入 | 地址 |
| certs | string | 自由输入 | 资质JSON |
| lastAuditDate | string(date) | **只读** | 最近审核日期 |
| nextAuditDate | string(date) | **只读** | 下次审核日期 |
| observeFlag | boolean | **只读** | 观察期标识 |
| soleSourceFlag | boolean | 自由输入 | 独家供应商标识 |

### 5.2 SqmSupplierGradeRule (评级规则)

**表**: `ops.sqm_supplier_grade_rule` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| scoreMin | number | 自由输入 | 分数下限 |
| scoreMax | number | 自由输入 | 分数上限 |
| level | string | **枚举** | A/B/C/D |
| observeFirstYear | boolean | 自由输入 | 首年观察期 |

### 5.3 SqmSupplierPerformance (绩效)

**表**: `ops.sqm_supplier_performance` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| supplierId | string | **下拉** | GET /v1/sqm/suppliers |
| period | string | 自由输入 | 周期(YYYY-MM) |
| score | number | **自动计算** | calc 自动计算 |
| deliveryScore | number | **只读** | |
| qualityScore | number | **只读** | |
| serviceScore | number | **只读** | |
| incomingPassRate | number | **只读** | |
| defectRate | number | **只读** | |
| rectifyTimelyRate | number | **只读** | |
| deliveryTimelyRate | number | **只读** | |
| complianceRate | number | **只读** | |
| level | string | **自动计算** | 按规则匹配 |
| observeFlag | boolean | **只读** | 默认 false |
| dataMissingFlag | boolean | **自动计算** | 自动按数据情况设置 |

### 5.4 SqmIncomingAbnormal (来料异常)

**表**: `ops.sqm_incoming_abnormal` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| abnormalNo | string | **只读** | 自动 `ABN-{timestamp}` |
| lotId | string | 关联 | 来料批次ID |
| supplierId | string | **下拉** | GET /v1/sqm/suppliers |
| partNo | string | 自由输入 | 物料编码 |
| partName | string | 自由输入 | 物料名称 |
| description | string | 自由输入 | 异常描述 |
| qty | integer | 自由输入 | 异常数量 |
| level | string | **枚举** | 严重/一般 |
| occurDate | string(date) | 日期选择 | 发生日期 |
| handlerId | string | 自由输入 | 处理人 |
| status | string | **只读+色标** | 待处理/整改中/已关闭 |
| disposal | string | **枚举** | 处置方式 |
| disposalRemark | string | 自由输入 | 处置备注 |
| d8Id | string | **只读** | 关联8D |
| capaId | string | **只读** | 关联CAPA |
| rectifyType | string | **只读** | 自动"8D" |
| overdueDays | integer | **只读** | 超期天数 |
| closeDate | string(date) | **只读** | 关闭日期 |

### 5.5 CloseAbnormalRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| disposal | string | 是 | **枚举** | 处置方式 |
| disposalRemark | string | 是 | 自由输入 | 处置备注 |

### 5.6 SqmAuditPlan (审核计划)

**表**: `ops.sqm_audit_plan` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| planNo | string | **只读** | 自动 `AP-{timestamp}` |
| supplierId | string | **下拉** | GET /v1/sqm/suppliers |
| auditType | string | **枚举** | 审核类型 |
| planDate | string(date) | 日期选择 | 计划日期 |
| auditLead | string | 自由输入 | 审核组长 |
| auditorTeam | string | 自由输入 | 审核组 |
| scope | string | 自由输入 | 审核范围 |
| riskLevel | string | **枚举** | 风险等级 |
| actualDate | string(date) | **只读** | 实际执行日期 |
| status | string | **只读+色标** | 计划中/待执行/进行中/已完成 |
| recordId | string | **只读** | 关联审核记录 |

### 5.7 SqmAuditRecord (审核记录)

**表**: `ops.sqm_audit_record` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| recordNo | string | **只读** | 自动 `AR-{timestamp}` |
| planId | string | 关联 | 审核计划ID |
| supplierId | string | **下拉** | |
| auditType | string | **枚举** | |
| auditDate | string(date) | 日期选择 | |
| auditLead | string | 自由输入 | |
| auditorTeam | string | 自由输入 | |
| result | string | **只读** | 按 conclusion 兜底 |
| score | number | 自由输入 | 审核得分 |
| ncCount | integer | **只读** | 默认0 |
| conclusion | string | 自由输入 | 审核结论 |
| status | string | **只读** | 默认"已完成" |
| archiveId | string | **只读** | 归档ID |

### 5.8 SqmAuditNc (不符合项)

**表**: `ops.sqm_audit_nc` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| ncNo | string | **只读** | 自动 `NC-{timestamp}` |
| recordId | string | 关联 | 审核记录ID |
| supplierId | string | 关联 | |
| clause | string | 自由输入 | 条款 |
| description | string | 自由输入 | 不符合描述 |
| level | string | **枚举** | 严重/一般 |
| status | string | **只读+色标** | 待整改/整改中/已关闭 |
| responsible | string | 自由输入 | 责任人 |
| deadline | string(date) | 日期选择 | 截止日期 |
| rectifyMeasure | string | 自由输入 | 整改措施 |
| rectifyAttachment | string | 自由输入 | 整改附件 |
| rectifyDate | string(date-time) | 自由输入 | 整改日期 |
| needSiteReview | boolean | 自由输入 | 是否需要现场验证 |
| verifyResult | string | 自由输入 | 验证结论 |
| verifyComment | string | 自由输入 | 验证备注 |
| verifyDate | string(date-time) | 自由输入 | 验证日期 |
| verifyBy | string | 自由输入 | 验证人 |
| verifiedBatches | integer | 自由输入 | 已验证批次数 |
| closeDate | string(date-time) | **只读** | 关闭日期 |

### 5.9 CloseNcRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| verifyResult | string | 是 | 自由输入 | 验证结论 |
| verifyComment | string | 是 | 自由输入 | 验证备注 |

### 5.10 SqmChangeOrder (物料变更单)

**表**: `ops.sqm_change_order` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| changeNo | string | **只读** | 自动 `ECN-{timestamp}` |
| title | string | 自由输入 | 变更标题 |
| supplierId | string | **下拉** | GET /v1/sqm/suppliers |
| partNo | string | 自由输入 | 物料编码 |
| changeType | string | **枚举** | 变更类型 |
| reason | string | 自由输入 | 变更原因 |
| applicant | string | 自由输入 | 申请人 |
| applyDate | string(date) | **只读** | 默认当天 |
| urgency | string | **枚举** | 高/中/低，默认"中" |
| strictFlag | boolean | **只读** | 风险预标"高"时强制true |
| riskPreMark | string | **枚举** | 风险预标 |
| source | string | **只读** | 默认"门户提报" |
| receiveFrozen | boolean | **只读** | 提交时自动true |
| status | string | **只读+色标** | 待申请/审批中/已批准/已驳回/已关闭 |

### 5.11 ApproveChangeRequest (变更审批)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| approvalRole | string | 是 | **枚举** | quality/purchase/rd |
| approved | boolean | 是 | 自由输入 | 是否批准 |
| opinion | string | 否 | 自由输入 | 审批意见 |

### 5.12 SqmChangeStrictInspect (加严检验)

**表**: `ops.sqm_change_strict_inspect` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| strictNo | string | **只读** | 自动生成 |
| changeId | string | 关联 | 变更单ID |
| lotId | string | 关联 | 批次ID |
| inspectType | string | **枚举** | 检验类型 |
| aqlLevel | string | **枚举** | AQL 等级 |
| result | string | **枚举** | 检验结果 |
| inspectDate | string(date) | 日期选择 | |
| seq | integer | **只读** | 第几批 |
| totalSeq | integer | **只读** | 总批数 |
| restored | boolean | **只读** | 是否已恢复 |

### 5.13 QmsFmeaRisk (FMEA 风险项)

**表**: `ops.qms_fmea_risk` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| riskNo | string | **只读** | 自动 `FMEA-{timestamp}` |
| fmeaType | string | **下拉** | GET /v1/sqm/fmea/types |
| product | string | 自由输入 | 产品/过程 |
| process | string | 自由输入 | 过程 |
| failureMode | string | 自由输入 | 失效模式 |
| severityS | integer | 自由输入 | 严重度 S(1-10) |
| occurrenceO | integer | 自由输入 | 频度 O(1-10) |
| detectionD | integer | 自由输入 | 探测度 D(1-10) |
| rpn | integer | **自动计算** | S×O×D |
| riskLevel | string | **自动计算** | 高/中/低 |
| highRiskFlag | boolean | **自动计算** | S>=9 或 RPN>=100 |
| status | string | **只读+色标** | 待闭环/进行中/已闭环 |
| action | string | 自由输入 | 措施 |
| owner | string | 自由输入 | 责任人 |
| targetDate | string(date) | 日期选择 | 目标日期 |
| evidence | string | 自由输入 | 证据 |
| closeDate | string(date) | **只读** | 闭环日期 |
| changeOrderId | string | 关联 | 变更单ID |

### 5.14 SqmIncomingLot (来料批次)

**表**: `ops.sqm_incoming_lot` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| lotNo | string | **只读** | 不传则自动 `LOT-{timestamp}` |
| supplierId | string | **下拉** | GET /v1/sqm/suppliers |
| partNo | string | 自由输入 | 物料编码 |
| partName | string | 自由输入 | 物料名称 |
| qty | number | 自由输入 | 数量 |
| unit | string | 自由输入 | 单位 |
| incomingDate | string(date) | **只读** | 默认当天 |
| inspectResult | string | **只读** | 默认"待检" |
| inspectType | string | **只读** | 默认"正常" |
| iqcPass | boolean | **只读** | IQC 是否通过 |
| poNo | string | 自由输入 | 采购订单号 |
| changeId | string | 关联 | 变更单ID |
| isKeyPart | boolean | 自由输入 | 是否关键件 |

### 5.15 CreateLotRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| orgId | string | 是 | **隐藏** | |
| supplierId | string | 是 | **下拉** | GET /v1/sqm/suppliers |
| partNo | string | 是 | 自由输入 | |
| partName | string | 是 | 自由输入 | |
| qty | number | 是 | 自由输入 | |
| unit | string | 是 | 自由输入 | |
| incomingDate | string(date) | 否 | 日期选择 | 默认当天 |
| inspectResult | string | 否 | **枚举** | 默认"待检" |
| inspectType | string | 否 | **枚举** | 默认"正常" |
| poNo | string | 否 | 自由输入 | |
| isKeyPart | boolean | 否 | 自由输入 | |

### 5.16 SqmTraceNode (追溯节点)

**表**: `ops.sqm_trace_node` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| rootLotId | string | 关联 | 根批次ID |
| parentNodeId | string | 关联 | 父节点ID |
| nodeType | string | **枚举** | incoming/raw/semi/ship/customer |
| nodeName | string | 自由输入 | 节点名称 |
| batchNo | string | 自由输入 | 批次号 |
| qty | number | 自由输入 | 数量 |
| unit | string | 自由输入 | 单位 |
| nodeDate | string(date) | 日期选择 | 节点日期 |
| supplierId | string | **下拉** | |
| remark | string | 自由输入 | 备注 |
| treeLevel | integer | **自动计算** | 树层级 |
| isValid | string | **只读** | 默认"是" |
| invalidBy | string | **只读** | 作废人 |
| invalidTime | string(date-time) | **只读** | 作废时间 |

### 5.17 SqmSupplierCert (供应商资质)

**表**: `ops.sqm_supplier_cert` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| supplierId | string | **下拉** | GET /v1/sqm/suppliers |
| certType | string | **枚举** | 资质类型 |
| certName | string | 自由输入 | 资质名称 |
| certNo | string | 自由输入 | 证书编号 |
| issueDate | string(date) | 日期选择 | 发证日期 |
| expiryDate | string(date) | 日期选择 | 到期日期 |
| fileUrl | string | 自由输入 | 文件URL |
| fileHash | string | **只读** | 文件哈希 |
| certVersion | integer | **只读** | 版本号 |
| status | string | **枚举** | 有效/即将过期/已过期 |
| warnLevel | string | **只读** | 预警等级 |

### 5.18 SqmSupplierShare (供应商份额)

**表**: `ops.sqm_supplier_share` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| supplierId | string | **下拉** | |
| partNo | string | 自由输入 | 物料编码 |
| shareRatio | number | 自由输入 | 份额比例 |
| effectiveDate | string(date) | 日期选择 | 生效日期 |
| changeReason | string | 自由输入 | 变更原因 |
| prevRatio | number | **只读** | 上次比例 |
| linkedLevel | string | **只读** | 关联等级 |

### 5.19 SqmSupplierEscalation (供应商升级)

**表**: `ops.sqm_supplier_escalation` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| supplierId | string | **下拉** | |
| currentLevel | string | **只读** | 当前等级 |
| qualityIssueCount6m | integer | **只读** | 近6月问题数 |
| repeatProblemCount | integer | **只读** | 重复问题数 |
| suggestedAction | string | **只读** | 建议措施 |
| escalationStatus | string | **只读** | 升级状态 |
| escalationAction | string | **只读** | 升级措施 |
| noticeSentFlag | boolean | **只读** | 通知已发 |

### 5.20 SqmAuditFreqRule (审核频次规则)

**表**: `ops.sqm_audit_freq_rule` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| riskLevel | string | **枚举** | 风险等级 |
| level | string | **枚举** | A/B/C/D |
| freqPerYear | integer | 自由输入 | 每年频次 |
| auditType | string | **枚举** | 审核类型 |

### 5.21 SqmSupplierMeasure (改善措施)

**表**: `ops.sqm_supplier_measure` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| measureId | string | **只读** | |
| abnormalId | string | 关联 | 异常单ID |
| supplierId | string | 关联 | |
| content | string | 自由输入 | 措施内容 |
| rootcause | string | 自由输入 | 根因 |
| prevention | string | 自由输入 | 预防措施 |
| deadline | string(date) | 日期选择 | 截止日期 |
| owner | string | 自由输入 | 负责人 |
| submitDate | string(date) | 自由输入 | 提交日期 |
| evidenceFiles | string | 自由输入 | 证据文件 |
| esignId | string | **只读** | |

### 5.22 SqmSqeVerification (SQE 验证)

**表**: `ops.sqm_sqe_verification` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| verificationId | string | **只读** | |
| abnormalId | string | 关联 | 异常单ID |
| sqeId | string | 自由输入 | SQE ID |
| verifyResult | string | **枚举** | 验证结果 |
| verifyComment | string | 自由输入 | 验证备注 |
| verifyDate | string(date) | 日期选择 | 验证日期 |
| qualifiedBatchCount | integer | 自由输入 | 合格批次数 |
| esignId | string | **只读** | |

---

## 6. Patrol 域

### 6.1 PatlRoute (巡检路线)

**表**: `ops.patl_route` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| routeCode | string | 自由输入 | 路线编码 |
| routeName | string | 自由输入 | 路线名称 |
| procName | string | 自由输入 | 工序名称 |
| freq | string | 自由输入 | 巡检频率 |
| status | string | **枚举** | 启用/停用 |

### 6.2 CreateRouteRequest

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| orgId | string | 是 | **隐藏** | |
| routeCode | string | 是 | 自由输入 | |
| routeName | string | 是 | 自由输入 | |
| procName | string | 是 | 自由输入 | |
| freq | string | 是 | 自由输入 | |
| status | string | 是 | **枚举** | |
| checkpoints | CheckpointInput[] | 否 | 嵌套表单 | 巡检点列表 |

### 6.3 CheckpointInput (巡检点输入)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| seq | integer | 是 | 自由输入 | 序号 |
| pointName | string | 是 | 自由输入 | 巡检点名称 |
| location | string | 是 | 自由输入 | 位置 |
| needPhoto | boolean | 否 | 自由输入 | 是否需要拍照 |
| items | ItemInput[] | 否 | 嵌套表单 | 检查项列表 |

### 6.4 ItemInput (检查项输入)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| seq | integer | 是 | 自由输入 | 序号 |
| itemName | string | 是 | 自由输入 | 检查项名称 |
| checkType | string | 是 | **枚举** | 检查类型 |
| stdValue | string | 否 | 自由输入 | 标准值 |
| enumValues | string | 否 | 自由输入 | 枚举值 |
| isRequired | boolean | 否 | 自由输入 | 是否必检 |

### 6.5 PatlTask (巡检任务)

**表**: `ops.patl_task` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| taskNo | string | **只读** | 自动生成 |
| routeId | string | **下拉** | GET /v1/patrol/routes |
| shift | string | 自由输入 | 班次 |
| planTime | string(date-time) | 日期选择 | 计划时间 |
| actualTime | string(date-time) | **只读** | 实际开始时间 |
| finishTime | string(date-time) | **只读** | 完成时间 |
| inspectorId | string | **只读** | 巡检人 |
| status | string | **只读+色标** | 待执行/进行中/已完成 |
| totalPoints | integer | **只读** | 总巡检点数 |
| donePoints | integer | **只读** | 已完成点数 |
| abnormalCount | integer | **只读** | 异常数 |
| remark | string | 自由输入 | 备注 |

### 6.6 CreateTaskRequest (创建巡检任务)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| orgId | string | 是 | **隐藏** | |
| routeId | string | 是 | **下拉** | GET /v1/patrol/routes |
| shift | string | 否 | 自由输入 | |
| planTime | string | 否 | 日期选择 | |

### 6.7 PatlRecord (巡检记录)

**表**: `ops.patl_record` | **不继承 BaseEntity(plain)**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| id | string | **只读** | |
| orgId | string | **只读** | |
| taskId | string | **只读** | |
| checkpointId | string | **只读** | |
| checkpointName | string | **只读** | |
| result | string | **只读** | 正常/异常 |
| checkTime | string(date-time) | **只读** | |
| operatorId | string | **只读** | |
| photoRef | string | **只读** | 照片引用 |
| remark | string | **只读** | |
| itemResults | string | **只读** | 检查项结果JSON |

### 6.8 SubmitRecordRequest (提交巡检记录)

| 字段 | 类型 | 必填 | 前端处理 | 备注 |
|------|------|------|---------|------|
| checkpointId | string | 是 | 关联 | 巡检点ID |
| checkpointName | string | 是 | 自由输入 | 巡检点名称 |
| result | string | 是 | **枚举** | 正常/异常 |
| remark | string | 否 | 自由输入 | 备注 |

### 6.9 PatlAbnormal (巡检异常)

**表**: `ops.patl_abnormal` | **继承 BaseEntity**

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| taskId | string | 关联 | 巡检任务ID |
| recordId | string | 关联 | 巡检记录ID |
| checkpointName | string | **只读** | 巡检点名称 |
| description | string | 自由输入 | 异常描述 |
| severity | string | **枚举** | 严重度 |
| status | string | **只读+色标** | 待处理/已处理 |
| d8Id | string | **只读** | 关联8D |
| ncmRecordId | string | **只读** | 关联不良记录 |
| handleRemark | string | 自由输入 | 处理备注 |
| handledBy | string | **只读** | 处理人 |
| handledAt | string(date-time) | **只读** | 处理时间 |

---

## 7. 通用/跨域 VO

### 7.1 PageResult\<T\> (分页响应)

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| records | T[] | **只读** | 数据列表 |
| total | integer | **只读** | 总记录数 |
| page | integer | **只读** | 当前页码 |
| size | integer | **只读** | 每页条数 |

### 7.2 LocalTime (时间)

| 字段 | 类型 | 前端处理 | 备注 |
|------|------|---------|------|
| hour | integer | 自由输入 | 0-23 |
| minute | integer | 自由输入 | 0-59 |
| second | integer | 自由输入 | 0-59 |
| nano | integer | 自由输入 | 纳秒 |

---

## 附录: 前端自动填充字段速查表

### 创建时后端自动处理、前端不传的字段

| 域 | 实体 | 字段 | 自动值 |
|-----|------|------|--------|
| 通用 | 全部 | id | UUIDv7 |
| 通用 | 全部 | createdAt/updatedAt | 当前时间 |
| 通用 | 全部 | createdBy/updatedBy | 当前用户ID |
| 通用 | 全部 | isDeleted | false |
| 通用 | 全部 | version | 0 |
| 通用 | 业务实体 | orgId | 登录用户orgId |
| FIA | FiaTask | code | FA-{timestamp} |
| FIA | FiaTask | status | "待检" |
| FIA | FiaTask | slaDueAt | now+2h |
| FIA | FiaTask | isOverdue | false |
| FIA | FiaApproval | code | AP-{timestamp} |
| FIA | FiaApproval | status | "待审批" |
| NCM | NcmDefectRecord | defectNo | DF-{timestamp} |
| NCM | NcmDefectRecord | defectRate | 自动计算 |
| NCM | NcmDefectRecord | operatorId | 当前用户 |
| NCM | NcmDefectRecord | source | "手动" |
| NCM | NcmDefectRecord | occurredAt | 当前时间 |
| NCM | Qms8dReport | d8No | 8D-{timestamp} |
| NCM | Qms8dReport | currentStage | D1 |
| NCM | Qms8dReport | status | "进行中" |
| NCM | QmsCapa | capaNo | CAPA-{timestamp} |
| NCM | QmsCapa | status | "待启动" |
| SPC | SpcAlarm | code | AL-{timestamp} |
| SPC | SpcAlarm | status | "待确认" |
| SQM | SqmSupplier | supplierNo | SUP-{timestamp} |
| SQM | SqmSupplier | status | "启用" |
| SQM | SqmIncomingAbnormal | abnormalNo | ABN-{timestamp} |
| SQM | SqmIncomingAbnormal | status | "待处理" |
| SQM | SqmAuditPlan | planNo | AP-{timestamp} |
| SQM | SqmAuditPlan | status | "计划中" |
| SQM | SqmAuditRecord | recordNo | AR-{timestamp} |
| SQM | SqmAuditRecord | status | "已完成" |
| SQM | SqmAuditNc | ncNo | NC-{timestamp} |
| SQM | SqmAuditNc | status | "待整改" |
| SQM | SqmChangeOrder | changeNo | ECN-{timestamp} |
| SQM | SqmChangeOrder | status | "待申请" |
| SQM | SqmChangeOrder | applyDate | 当天 |
| SQM | SqmChangeOrder | source | "门户提报" |
| SQM | SqmChangeOrder | urgency | "中" |
| SQM | QmsFmeaRisk | riskNo | FMEA-{timestamp} |
| SQM | QmsFmeaRisk | rpn | 自动计算 |
| SQM | QmsFmeaRisk | riskLevel | 自动计算 |
| SQM | SqmIncomingLot | lotNo | LOT-{timestamp} |
| SQM | SqmIncomingLot | inspectResult | "待检" |
| SQM | SqmIncomingLot | inspectType | "正常" |
| SQM | SqmIncomingLot | incomingDate | 当天 |
| Patrol | PatlTask | taskNo | 自动生成 |
| Patrol | PatlTask | status | "待执行" |

### 有列表接口可做下拉的字段

| 域 | 字段 | 接口 |
|-----|------|------|
| UOP | parentId(SysOrg) | GET /v1/uop/orgs |
| UOP | parentId(SysMenu) | GET /v1/uop/menus |
| UOP | delegatorId/delegateeId | GET /v1/uop/users |
| UOP | roleId(SysDelegation) | GET /v1/uop/roles |
| FIA | triggerType | GET /v1/fia/triggers |
| FIA | stdId | GET /v1/fia/stds |
| SPC | paramId | GET /v1/spc/params |
| NCM | defectDictCode | GET /v1/ncm/defect-dicts |
| SQM | supplierId | GET /v1/sqm/suppliers |
| SQM | fmeaType | GET /v1/sqm/fmea/types |
| Patrol | routeId | GET /v1/patrol/routes |

### 枚举字段(前端做下拉，值从后端代码/字典提取)

| 域 | 字段 | 枚举值 |
|-----|------|--------|
| 通用 | status | 草稿/生效/停用/启用/停用 |
| UOP | orgType | 公司/工厂/车间/产线/工位 |
| UOP | menuType | 菜单/按钮/目录 |
| FIA | triggerType | 换模/换设备/首班/换料/停线重启/来料入库 |
| FIA | status(FiaTask) | 待检/进行中/待复核/待批准/审批中/已完成/超时/已作废/已驳回 |
| FIA | disposition | 合格放行/退货/返工/让步接收/紧急放行/豁免开工 |
| FIA | signNodes | 两级/三级 |
| FIA | signGranularity | 整单签名/逐项签名 |
| FIA | signMethods | password/handwriting/ca |
| FIA | approvalType | 让步接收/紧急放行/豁免开工 |
| SPC | chartType | Xbar-R/Xbar-S/I-MR/P |
| SPC | level(SpcAlarm) | 预警/报警 |
| SPC | level(SpcRule) | 预警/报警 |
| SPC | channel | 站内/邮件/短信/钉钉/企微 |
| NCM | severity | 严重/一般 |
| NCM | source(NcmDefectRecord) | 手动/首件检验/SPC报警 |
| NCM | source(Qms8dReport) | 手动/SPC报警/不良记录/SQM异常 |
| NCM | flowType | 8D/简易 |
| NCM | triggerType(QmsCapa) | 8D/重复问题/不良趋势异常/手动 |
| NCM | capaType | 纠正/纠正措施/预防措施 |
| NCM | category(Qms8dFishbone) | 人/机/料/法/环/测 |
| SQM | level(SqmSupplier) | A/B/C/D |
| SQM | level(SqmIncomingAbnormal) | 严重/一般 |
| SQM | changeType | (变更类型) |
| SQM | urgency | 高/中/低 |
| SQM | approvalRole | quality/purchase/rd |
| SQM | riskLevel | 高/中/低 |
| SQM | auditType | 常规审核/专项审核/年度审核 |
| SQM | nodeType | incoming/raw/semi/ship/customer |
| SQM | certType | (资质类型) |
| Patrol | status(PatlTask) | 待执行/进行中/已完成 |
| Patrol | result | 正常/异常 |
| Patrol | checkType | (检查类型) |