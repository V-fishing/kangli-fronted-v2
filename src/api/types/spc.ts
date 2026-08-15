// ── SpcParam ──
export interface SpcParam {
  id: string
  paramName: string
  fiaStdItemId?: string
  procName?: string
  /** 工序显示名(非工序代码),由后端按标准 procName 回填 */
  processName?: string
  /** 是否可制图:数值型可制图,文本/枚举型不可制图 */
  chartable?: boolean
  /** 关联 SPC 工序字典 id(参数归属工序分组) */
  processId?: string
  /** 关联 SPC 标准线 id(参数归属标准线规格) */
  specStandardId?: string
  unit?: string
  specLower?: number
  specUpper?: number
  targetValue?: number
  subgroupSize: number
  collectFreq?: string
  chartType?: string // Xbar-R ...
  /** 带入时的推荐控制图全集(逗号分隔);编辑弹窗据此限定 chartType 可选范围,空则用全量 */
  chartCandidates?: string
  /** 数据类型:VARIABLE=计量型(Xbar/R/S/I/MR),ATTRIBUTE=计数型(P/NP/C/U)。由后端 deriveDataType 自动推断 */
  dataType?: 'VARIABLE' | 'ATTRIBUTE'
  // 可配置项
  sigmaMethod?: string // within(组内) / overall(整体)
  sigmaK?: number // 控制限/能力 σ 倍数(默认 3)
  cpkPeriod?: string // 批次 / 日 / 周(CPK 自动滚动周期)
  isActive?: boolean
  orgId?: string
  // 参数来源:FIA_FIRST(首件标准库派生)/ SAMPLE(抽样任务创建)/ MANUAL(手动新建)
  // 后端对派生参数放宽供应商必填校验,编辑提交时需透传此字段
  paramSource?: string
  // 参数↔产品关联(由 FIA 任务派生时回填)
  products?: SpcParamProduct[]
  /** 来源 FIA 任务单号(首件派生时带入,供采集页自动填充) */
  srcWoNo?: string
  /** 来源 FIA 任务批号(首件派生时带入,供采集页自动填充) */
  srcBatchNo?: string
}

// ── SpcSpecStandard(SPC 标准线规格,供首件标准库「从SPC拉取」复用) ──
export interface SpcSpecStandard {
  id?: string
  material?: string
  procName?: string
  unit?: string
  specLower?: number | null
  specUpper?: number | null
  targetValue?: number | null
  /** 默认控制图类型(Xbar/R/S/I/MR/P/NP/C/U) */
  chartType?: string
}

// ── SpcParamProduct(参数↔产品多对多) ──
export interface SpcParamProduct {
  id?: string
  paramId?: string
  orgId?: string
  productName?: string
  partNo?: string
  kind?: string // material / semi / product
}

// ── SpcProcess(SPC 工序字典:参数的父级分组维度) ──
export interface SpcProcess {
  id: string
  orgId?: string
  processName?: string
  processCode?: string
  description?: string
  sortNo?: number
  isActive?: boolean
}

// ── SpcSubgroup ──
export interface SpcSubgroup {
  id: string
  orgId?: string
  paramId: string
  subgroupNo?: number
  subgroupTime?: string
  shift?: string
  n?: number
  woNo?: string
  batchNo?: string
  operatorId?: string
  operatorName?: string
  createdBy?: string
  createdByName?: string
  xbar: number
  rangeR: number
  stdDev?: number
  isOutlier?: boolean
  outlierRule?: string
  judge?: string
  dataSource?: string
  /** SPC 数据阶段: FIRST=首件能力验证; ROUTINE=量产过程监控 */
  stage?: string
  taskId?: string
  /** 关联抽样批次任务(ROUTINE 量产采集载体) */
  sampleTaskId?: string
  productCode?: string
  createdAt?: string
}

export interface SpcSubgroupVo extends SpcSubgroup {
  measurements?: SpcMeasurement[]
}

/** 计数型(P/NP/C/U)参数过程水平聚合(替代计量型 Cp/Cpk)。 */
export interface CountCapabilityVo {
  countType: boolean
  /** 计数图主类型: P / NP / C / U */
  chartKind?: 'P' | 'NP' | 'C' | 'U'
  /** 过程平均不合格率 p̄ = Σ不合格数/Σ检验数(P/NP) */
  pBar?: number
  /** 百万机会缺陷数 PPM = p̄×1e6(P/NP) */
  ppm?: number
  /** 合格率 = 1 − p̄(P/NP) */
  yieldRate?: number
  /** 平均单位缺陷数 ū = Σ缺陷数/Σ检验单位数(C/U) */
  uBar?: number
  /** 单位缺陷数 DPU = ū(C/U) */
  dpu?: number
  /** 参与聚合的计数子组数 */
  sampleCount: number
}

export interface SpcMeasurement {
  id: string
  subgroupId: string
  value: number
  seq: number
}

export interface CreateSubgroupRequest {
  orgId?: string
  paramId: string
  subgroupTime?: string
  shift?: string
  woNo?: string
  batchNo?: string
  /** SPC 数据阶段: FIRST=首件能力验证; ROUTINE=量产过程监控 */
  stage?: string
  taskId?: string
  /** 关联抽样批次任务(ROUTINE 量产采集载体) */
  sampleTaskId?: string
  productCode?: string
  values: number[]
  /** 计数型 P/NP 图:子组不合格数(非计数型为 null) */
  nonconforming?: number
  /** 计数型 P/NP 图:子组检验总数(样本量 n, 非计数型为 null) */
  inspectN?: number
  /** 计数型 C/U 图:子组缺陷数(非计数型为 null) */
  defectCount?: number
}

// ── SpcSampleTask(抽样批次任务:量产监控采集载体) ──
export interface SpcSampleTask {
  id: string
  orgId?: string
  woNo: string
  partNo: string
  procName?: string
  productName?: string
  paramId: string
  targetCount: number
  currentCount: number
  /** 采集中 / 已结案 */
  status: string
  cpk?: number
  released?: boolean
  alarmFlag?: boolean
  // 对齐首件表单的业务元信息
  triggerType?: string
  category?: string
  supplierId?: string
  supplierName?: string
  isUrgent?: boolean
  remark?: string
  createdBy?: string
  createdAt?: string
}

export interface CreateSampleTaskRequest {
  orgId?: string
  woNo: string
  partNo: string
  procName?: string
  productName?: string
  targetCount: number
  /** SPC 参数 ID 列表:勾选已落 spc_param 的参数时,后端为同一 woNo 循环创建多个抽样任务 */
  paramIds?: string[]
  /** FIA 检验标准项 ID 列表:勾选 FIA 标准库检验项(尚未落 spc_param)时,后端按检验项自动派生 SPC 参数 */
  fiaStdItemIds?: string[]
  // ── 对齐首件表单的业务元信息(可选) ──
  triggerType?: string
  category?: string
  supplierId?: string
  supplierName?: string
  isUrgent?: boolean
  remark?: string
}

// ── SpcAlarm ──
export interface SpcAlarm {
  id: string
  code: string
  paramName?: string
  currentValue?: number
  triggeredRule?: string
  level: string // 预警/报警
  alarmTime: string
  status: string // 待确认/已关闭
  woNo?: string
  batchNo?: string
  closeReason?: string
  disposition?: string
  closedBy?: string
  closedAt?: string
}

// ── SpcControlLimit ── (后端字段:xbarUcl/xbarCl/xbarLcl 为均值图限;rucl/rcl/rlcl 为极差图限)
export interface SpcControlLimit {
  id: string
  paramId: string
  chartType?: string
  baselineSource?: string
  nSubgroups?: number
  xbarUcl?: number
  xbarCl?: number
  xbarLcl?: number
  rucl?: number
  rcl?: number
  rlcl?: number
  manual?: boolean // true=人工覆盖
  isActive?: boolean
  calcAt?: string
}

// ── SpcRule(WECO 8) ──
export interface SpcRule {
  id: string
  ruleCode: string
  ruleName: string
  ruleLevel: string // 预警/报警
  enabled: boolean
  description?: string
  triggerCount?: number
  /** 兼容旧字段名(前端组件展示用) */
  isEnabled?: boolean
  /** 兼容旧字段名(前端组件展示用) */
  level?: string
}

// ── SpcCapability ──
export interface SpcCapability {
  id: string
  paramId: string
  /** 参数名称(合并视图补全) */
  paramName?: string
  /** 参数代号(后端无独立 code,常以 paramName 代替) */
  paramCode?: string
  /** 工序显示名(合并视图补全) */
  procName?: string
  cp?: number
  cpk?: number
  pp?: number
  ppk?: number
  sigmaWithin?: number
  sigmaOverall?: number
  sampleCount?: number
  level?: string
  calcNote?: string
  periodType?: string
  periodValue?: string
  calcAt?: string
  /** 规格上限(合并视图/详情补全) */
  usl?: number
  /** 规格下限(合并视图/详情补全) */
  lsl?: number
  /** 计算时间(趋势序列) */
  calcTime?: string
}

export interface SpcSupplierCpkVo {
  paramId: string
  paramName: string
  cpk?: number
  level?: string
  /** 物料(供应商对比行) */
  mat?: string
  /** 供应商(供应商对比行) */
  sup?: string
  /** 等级(供应商对比行) */
  lvl?: string
}

// ── 控制图/直方图/看板 ──
export interface CountSeries {
  chartType: string // P / NP / C / U
  values: number[] | null[]
  ucl: number[] | null[]
  cl: number[] | null[]
  lcl: number[] | null[]
}

export interface ControlChartVo {
  subgroups: SpcSubgroup[]
  limit?: SpcControlLimit
  marks?: { i: number; rule: string; level: string }[]
  countSeries?: CountSeries[] // 计数型控制图序列(P/NP/C/U)
}

export interface SpcHistogramVo {
  bins: number[]
  freq: number[]
  usl?: number
  lsl?: number
  mean?: number
  sigma?: number
  normalFreq?: number[]
}

export interface SpcDashboardVo {
  cpkDistribution?: { sufficient: number; acceptable: number; insufficient: number }
  pendingAlarms?: number
  todaySubgroups?: number
  todayTasks?: number
  completionRate?: number
}

// ── 采集任务 ──
export interface SpcCollectTask {
  id: string
  orgId?: string
  paramId?: string
  status: string
  nextDueAt?: string
  isPlannedDowntime?: boolean
}

// ── 通知渠道 ──
export interface SpcNotifyChannel {
  id: string
  channelType: string
  configJson?: string
  enabled: boolean
  /** 兼容旧字段名(前端组件展示用) */
  channel?: string
  /** 启用状态(兼容旧字段名) */
  isEnabled?: boolean
  /** 预警级别(CRITICAL/WARN/INFO) */
  alertLevel?: string
  /** 抑制时长(分钟) */
  supressMinutes?: number
}

// ── 全局配置 ──
export interface SpcGlobalConfig {
  id?: string
  orgId?: string
  baselineMode?: string
  defaultSubgroupSize?: number
  chartAutoRules?: string
  cpkPeriod?: string
  cpkSufficient?: number
  cpkAcceptable?: number
  alertLevel?: string
  suppressMinutes?: number
}
