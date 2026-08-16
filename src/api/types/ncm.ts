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
  stage?: string
  defectCount: number
  batchTotal?: number
  defectRate?: number
  deviceCode?: string
  /** 来源工装 ID(工装发起不良时回填)。 */
  toolId?: string
  /** 来源工装编号(工装发起不良时回填,列表直接展示)。 */
  toolNo?: string
  batchNo?: string
  productModel?: string
  operatorId?: string
  source?: string
  devicePayload?: string
  occurredAt?: string
  remark?: string
  disposition?: string
  createdAt?: string
  /** 关联 8D 报告单号,已发起则有值 */
  d8No?: string
  /** 关联 CAPA 单号,已发起则有值 */
  capaNo?: string
  /** 关联 CA 纠正措施单号,已发起则有值 */
  caNo?: string
  /** 8D 报告 id(UUID),用于跳转详情页 */
  d8Id?: string
  /** CAPA id(UUID),用于跳转详情页 */
  capaId?: string
  /** CA id(UUID),用于跳转详情页 */
  caId?: string
  /** 8D 报告状态(进行中/已闭环),列表查询时后端回填 */
  d8Status?: string
  /** CAPA 状态(待启动/分析中/待审批/实施中/已验证/已关闭),列表查询时后端回填 */
  capaStatus?: string
  /** CA 状态(待启动/进行中/已完成/已关闭),列表查询时后端回填 */
  caStatus?: string
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
  /** 关联 CAPA 主键(双向追溯)。 */
  capaId?: string
  closeDate?: string
  createdAt?: string
  /** 责任人用户 id(列表级改派写入) */
  ownerUserId?: string
  /** 责任人姓名(后端由 owner_user_id 关联 sys_user 解析) */
  ownerUserName?: string
  /** 责任人(兼容旧字段,实际以 ownerUserName 为准) */
  owner?: string
}

export interface Qms8dStageDetail {
  id: string
  d8Id: string
  orgId?: string
  stageCode: D8Stage
  content?: string
  teamMembers?: string // D1 团队组建阶段:负责人自建团队成员名单
  owner?: string
  approvalStatus?: string // 待审批/已通过/已驳回
  approvalComment?: string
  approvedBy?: string
}

export interface EightDVo {
  report: Qms8dReport
  stages: Qms8dStageDetail[]
  /** 关联 CAPA(CAPA↔8D 互锁门禁提示与跳转)。 */
  capa?: QmsCapa | null
}

export interface AdvanceStageRequest {
  stageCode: string
  content: string
  owner: string
  teamMembers?: string // D1 团队组建阶段:团队成员名单
}

export interface StageApproveDTO {
  stageCode: string
  approved: boolean
  comment: string
  password?: string // 电子签名口令(后端按当前登录用户校验)
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
  /** 责任人用户 id(列表级改派写入) */
  ownerUserId?: string
  /** 责任人姓名(后端由 owner_user_id 关联 sys_user 解析) */
  ownerUserName?: string
  dueDate?: string
  progress?: number
  status: string // 待立项审批/分析中/待审批/实施中/已验证/已关闭/已驳回
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

// ── 鱼骨图(5M1E) ──
export interface Qms8dFishbone {
  id: string
  d8Id: string
  orgId?: string
  problem?: string
  /** 5M1E 类别:人/机/料/法/环/测 */
  category: string
  causeText: string
  sortOrder?: number
}

// ── 5Why 根因追问(序列化进 D4 阶段明细 content) ──
export interface Qms8dWhyItem {
  why: string
  answer: string
}

// ── 纠正措施(轻量,区别于 CAPA;可关联不良记录 defectNo) ──
export interface NcmCorrectiveAction {
  id: string
  caNo?: string
  orgId?: string
  /** 关联不良单号(外键 ncm_defect_record.defect_no),可空。 */
  defectNo?: string
  /** 问题描述。 */
  issue?: string
  /** 责任人(存储为 sys_user.id)。 */
  owner?: string
  /** 责任人姓名(后端由 owner 关联 sys_user 解析,可能为空)。 */
  ownerName?: string
  /** 期限(LocalDate)。 */
  dueDate?: string
  /** 状态:待启动 / 已完成 / 已关闭。 */
  status: string
  /** 进度 0-100,=100 时后端自动置状态为已完成。 */
  progress?: number
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
