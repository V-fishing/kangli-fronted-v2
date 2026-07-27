// ── SpcParam ──
export interface SpcParam {
  id: string
  paramName: string
  procName?: string
  unit?: string
  specLower?: number
  specUpper?: number
  targetValue?: number
  subgroupSize: number
  collectFreq?: string
  chartType?: string // Xbar-R ...
  // 可配置项
  sigmaMethod?: string // within(组内) / overall(整体)
  sigmaK?: number // 控制限/能力 σ 倍数(默认 3)
  cpkPeriod?: string // 批次 / 日 / 周(CPK 自动滚动周期)
  isActive?: boolean
  orgId?: string
}

// ── SpcSubgroup ──
export interface SpcSubgroup {
  id: string
  orgId?: string
  paramId: string
  subgroupTime?: string
  shift?: string
  woNo?: string
  batchNo?: string
  xbar: number
  rangeR: number
  isOutlier?: boolean
  outlierRule?: string
  judge?: string
  dataSource?: string
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
  values: number[]
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

// ── SpcControlLimit ── (后端字段:xbarUcl/xbarCl/xbarLcl 为均值图限;rUcl/rCl/rLcl 为极差图限)
export interface SpcControlLimit {
  id: string
  paramId: string
  chartType?: string
  baselineSource?: string
  nSubgroups?: number
  xbarUcl?: number
  xbarCl?: number
  xbarLcl?: number
  rUcl?: number
  rCl?: number
  rLcl?: number
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
export interface ControlChartVo {
  subgroups: SpcSubgroup[]
  limit?: SpcControlLimit
  marks?: { i: number; rule: string; level: string }[]
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
