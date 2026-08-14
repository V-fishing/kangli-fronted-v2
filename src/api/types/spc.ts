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
  unit?: string
  specLower?: number
  specUpper?: number
  targetValue?: number
  subgroupSize: number
  collectFreq?: string
  chartType?: string // Xbar-R ...
  /** 带入时的推荐控制图全集(逗号分隔);编辑弹窗据此限定 chartType 可选范围,空则用全量 */
  chartCandidates?: string
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
}

// ── SpcCapability ──
export interface SpcCapability {
  id: string
  paramId: string
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
}

export interface SpcSupplierCpkVo {
  paramId: string
  paramName: string
  cpk?: number
  level?: string
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
