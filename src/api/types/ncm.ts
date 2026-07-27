// ── 不良字典 ──
export interface NcmDefectDict {
  id: string
  code: string
  name: string
  category?: string
  level?: string
  status?: string
  referenceCount?: number
  orgId?: string | null
}

// ── 不良记录 ──
export interface NcmDefectRecord {
  id: string
  defectNo: string
  orgId?: string
  woNo?: string
  processCode?: string
  defectDictCode?: string
  severity?: string
  defectCount: number
  batchTotal?: number
  defectRate?: number
  deviceCode?: string
  batchNo?: string
  productModel?: string
  operatorId?: string
  source?: string
  devicePayload?: string
  occurredAt?: string
  remark?: string
  disposition?: string
  createdAt?: string
}

// ── 8D 报告 ──
export type D8Stage = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8'

// ── 8D 阶段审核配置 ──
export interface EightDApprovalConfig {
  id?: string
  stageCode: D8Stage
  needApproval: boolean
  signer?: string | null
  sortOrder?: number
}

export interface Qms8dReport {
  id: string
  d8No: string
  orgId?: string
  source?: string // NCM/SQM/SPC
  sourceRefId?: string
  severity?: string
  issue?: string
  team?: string
  flowType?: string // 8D/简易
  status: string // 进行中/已闭环
  currentStage?: D8Stage
  capaTriggered?: boolean
  closeDate?: string
  createdAt?: string
}

export interface Qms8dStageDetail {
  id: string
  d8Id: string
  orgId?: string
  stageCode: D8Stage
  content?: string
  owner?: string
  approvalStatus?: string // 待审批/已通过/已驳回
  approvalComment?: string
  approvedBy?: string
}

export interface EightDVo {
  report: Qms8dReport
  stages: Qms8dStageDetail[]
}

export interface AdvanceStageRequest {
  stageCode: string
  content: string
  owner: string
}

export interface StageApproveDTO {
  stageCode: string
  approved: boolean
  comment: string
  approver: string
}

// ── CAPA ──
export interface QmsCapa {
  id: string
  capaNo: string
  orgId?: string
  issue?: string
  d8Id?: string
  abnormalId?: string
  /** 通用来源单据 ID(内审不符合项 / 不良记录等)。 */
  sourceRefId?: string
  /** 来源类型:8D / 来料异常 / 审核不符合项 / 不良记录。 */
  sourceType?: string
  triggerType?: string
  triggerStage?: string
  triggerCondition?: string
  capaType?: string
  owner?: string
  dueDate?: string
  progress?: number
  status: string // 待启动/分析中/待审批/实施中/已验证/已关闭
  createdAt?: string
}

export interface CapaVo {
  capa: QmsCapa
  actions?: QmsCapaAction[]
}

export interface QmsCapaAction {
  id: string
  capaId: string
  seq?: number
  actionContent?: string
  executor?: string
  completeDate?: string
  status?: string
}

// ── 鱼骨图 ──
export interface Qms8dFishbone {
  id: string
  d8Id: string
  branch?: string
  content?: string
  sortOrder?: number
}

// ── 纠止措施 ──
export interface NcmCorrectiveAction {
  id: string
  caNo?: string
  orgId?: string
  title?: string
  progress?: number
  status: string
}

// ── 告警升级配置 ──
export interface NcmAlertEscalation {
  id: string
  orgId?: string | null
  level: number
  timeoutMinutes: number
  notifyRole?: string
  offHoursDelay?: boolean
}

// ── 分析方案(过滤方案) ──
export interface NcmFilterScheme {
  id: string
  name?: string
  filters?: string
  ownerId?: string
  createdAt?: string
}

// ── BI 报表 ──
export interface NcmBiReport {
  id: string
  title?: string
  status?: string
  createdAt?: string
}

// ── 日报配置 ──
export interface NcmDailyReportConfig {
  id?: string
  orgId?: string
  pushTime?: string
  receivers?: string
  enabled?: boolean
}

// ── 分析聚合 ──
export interface NcmAggregateItem {
  dim: string
  totalCount: number
  severeCount?: number
  normalCount?: number
}

// ── 不良趋势报表 ──
export interface TrendPoint {
  period: string
  defectCount: number
  batchTotal: number
  recordCount: number
  defectRate: number
  momPct?: number | null
  yoyPct?: number | null
  risingStreak: number
  exceedMean2Sigma: boolean
  deterioration: boolean
  reason?: string
}

export interface TrendRule {
  id?: string
  orgId?: string | null
  consecutiveDays?: number
  useMeanPlus2sigma?: boolean
  sigmaMultiplier?: number
  baselineDays?: number
  enabled?: boolean
}

export interface TrendRealtimeResult {
  generatedAt: string
  rule: TrendRule
  points: TrendPoint[]
  summary: Record<string, any>
}

export interface TrendReport {
  id: string
  orgId?: string
  productModel?: string
  granularity?: string
  periodValue?: string
  summaryJson?: string
  ruleSnapshot?: string
  generatedAt?: string
}
