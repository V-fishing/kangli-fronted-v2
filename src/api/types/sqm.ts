// ── 供应商 ──
export interface SqmSupplier {
  id: string
  supplierNo?: string
  supplierCode?: string
  /** MES 供应商编号(VEN 编号, 如 VEN00417) */
  venCode?: string
  name: string
  level?: string // A/B/C/D
  status?: string // 待审核/启用/冻结/淘汰
  category?: string
  creditCode?: string
  contactPerson?: string
  contactPhone?: string
  address?: string
  score?: number
  lastAuditDate?: string
  nextAuditDate?: string
  observeFlag?: boolean
  soleSourceFlag?: boolean
  orgId?: string
}

// ── 来料异常 ──
export type AbnormalStatus = '待处理' | '整改中' | '已关闭'

export interface SqmIncomingAbnormal {
  id: string
  abnormalNo: string
  orgId?: string
  supplierId?: string
  supplierName?: string // 关联供应商名称(后端列表填充)
  lotId?: string // 批次(原始,可能为来料批次UUID)
  batchNo?: string // 可读批次号(优先展示,后端V43起填充)
  partNo?: string
  partName?: string
  description?: string
  qty?: number // 不良数
  incomingQty?: number // 来料数
  level?: string // 严重/一般
  status: AbnormalStatus
  rectifyType?: string // 8D/CAPA
  d8Id?: string
  capaId?: string
  occurDate?: string
  closeDate?: string
  overdueDays?: number
  disposal?: string
  disposalRemark?: string
  createdAt?: string
  /** 处理人用户 id(列表级改派写入 handler_id) */
  handlerId?: string
  /** 处理人姓名(后端由 handler_id 关联 sys_user 解析) */
  handlerName?: string
}

export interface CloseAbnormalRequest {
  disposal: string
  disposalRemark: string
}

export interface AbnormalRectificationRequest {
  abnormal: Partial<SqmIncomingAbnormal>
  measures?: SqmSupplierMeasure[]
  batchVerifies?: SqmAbnormalBatchVerify[]
}

export interface SqmSupplierMeasure {
  id?: string
  abnormalId?: string
  seq?: number
  content?: string
  executor?: string
  completeDate?: string
  status?: string
}

export interface SqmAbnormalBatchVerify {
  id?: string
  abnormalId?: string
  batchNo?: string
  result?: string
  verifyDate?: string
}

// ── 审核计划 ──
export type AuditPlanStatus = '计划中' | '待执行' | '进行中' | '已完成'

export interface SqmAuditPlan {
  id: string
  planNo?: string
  orgId?: string
  supplierId?: string
  auditType?: string // 年度复审/过程审核/专项审核/物料变更审核/飞行检查
  planDate?: string
  actualDate?: string
  auditLead?: string
  auditorTeam?: string
  /** 实际参与审核人(会签执行人),签字后由后端同步,用于审核组栏反映真实参与人 */
  actualAuditors?: string
  scope?: string
  riskLevel?: string // 高/中/低
  recordId?: string // 关联的审核记录 id(状态为已完成时存在)
  status: AuditPlanStatus
  /** 各审核类型特有字段(JSON 字符串), 按 auditType 区分 */
  extJson?: string
  /** 来源变更单 id(仅「物料变更审核」由变更单提交联动生成时存在,用于双向追溯) */
  changeId?: string
  /** 审核组长用户 id(列表级指派写入 audit_lead_user_id) */
  auditLeadUserId?: string
  /** 审核组长姓名(后端由 audit_lead_user_id 关联 sys_user 解析) */
  auditLeadUserName?: string
}

// ── 审核记录 ──
export interface SqmAuditRecord {
  id: string
  recordNo?: string
  planId?: string
  orgId?: string
  supplierId?: string
  auditType?: string
  auditDate?: string
  auditLead?: string
  auditorTeam?: string
  score?: number
  ncCount?: number
  result?: string // 通过/不通过
  conclusion?: string
  status?: string
  /** 审核记录类型特有字段(JSON 字符串) */
  extJson?: string
}

// ── 审核不符合项 ──
export interface SqmAuditNc {
  id: string
  ncNo?: string
  recordId?: string
  orgId?: string
  level?: string // 严重/一般/观察项
  clause?: string
  description?: string
  responsible?: string
  deadline?: string
  rectifyMeasure?: string
  verifyResult?: string
  verifyComment?: string
  verifyDate?: string
  status?: string // 待整改/待验证/已闭环
}

export interface CloseNcRequest {
  verifyResult: string
  verifyComment: string
}

// ── 物料变更 ECN ──
export type ChangeStatus = '待申请' | '审批中' | '已批准' | '已驳回' | '已关闭' | '已回滚'

export interface SqmChangeOrder {
  id: string
  changeNo: string
  orgId?: string
  supplierId?: string
  title?: string
  partNo?: string
  changeType?: string
  reason?: string // 变更说明(评估资料之一)
  verifyReport?: string // 验证报告附件路径(评估资料之一)
  riskFile?: string // 风险评估附件路径(评估资料之一)
  applicant?: string
  riskPreMark?: string // 高/中/低
  urgency?: string
  source?: string
  status: ChangeStatus
  receiveFrozen?: boolean
  strictFlag?: boolean
  applyDate?: string
  createdAt?: string
}

/** 变更单列表行(后端 SqmChangeOrderListVo:含供应商名 + 评估资料) */
export interface SqmChangeOrderListVo {
  id: string
  changeNo: string
  title?: string
  supplierId?: string
  supplierName?: string
  partNo?: string
  changeType?: string
  urgency?: string
  status: ChangeStatus
  applicant?: string
  applyDate?: string
  reason?: string
  verifyReport?: string
  riskFile?: string
  riskPreMark?: string
}

export interface SqmChangeApproval {
  id: string
  changeId: string
  approvalRole: string // purchase/rd/quality(串行:采购→研发→质量)
  roleLabel?: string
  status: string // pending/done/rejected
  hasVeto?: boolean
  seqOrder?: number // 串行顺序 1/2/3
  operator?: string
  operateDate?: string
  opinion?: string
}

export interface SqmChangeOrderVo {
  order: SqmChangeOrder
  approvals: SqmChangeApproval[]
}

export interface ApproveChangeRequest {
  approvalRole: string
  approved: boolean
  opinion: string
}

// ── 审核会签(质量/采购/研发并行 + 质量一票否决) ──
export interface SqmAuditApproval {
  id: string
  auditId: string
  approvalRole: string // quality/purchase/rd
  roleLabel?: string
  status: string // pending/done/rejected
  hasVeto?: boolean
  operator?: string
  operateDate?: string
  opinion?: string
}

export interface ApproveAuditRequest {
  approvalRole: string
  approved: boolean
  opinion: string
}

// ── 审核检查项(现场审核打分) ──
export interface SqmAuditChecklistItem {
  id?: string
  recordId?: string
  orgId?: string
  seq?: number
  clause?: string       // 条款
  itemName?: string     // 检查内容
  result?: string       // 符合/不符合/观察项
  evidence?: string     // 证据说明
  ncId?: string         // 关联的不符合项(判为不符合时)
}

// ── 审核现场照片 ──
export interface SqmAuditPhoto {
  id?: string
  recordId?: string
  checklistItemId?: string
  filePath?: string     // 上传后返回的文件路径(logs/photos/...)
  fileName?: string
  shootBy?: string
  shootTime?: string
  createdAt?: string
}

// ── 审核流程轨迹 ──
export interface SqmAuditWorkflowLog {
  id?: string
  planId?: string
  orgId?: string
  node?: string         // plan_created/start/checklist_saved/nc_added/review/archived
  action?: string
  operator?: string
  remark?: string
  createdAt?: string
}

export interface SqmAuditReportArchive {
  id?: string
  recordId?: string
  hash?: string
  fileRef?: string
  retentionUntil?: string
  createdAt?: string
}

// ── 审核会签配置(按审核类型可配置会签人员/否决权) ──
export interface SqmAuditorItem {
  role: string
  label: string
  veto: boolean
  /** 指定审批人 user_id(单人);多人会签时由 userIds 合并写入(逗号串) */
  userId?: string
  /** 多选会签人:同一节点多名审批人 user_id 列表 */
  userIds?: string[]
}

export interface SqmAuditApprovalCfg {
  id?: string
  orgId?: string
  auditType: string
  auditors: string // JSON 数组字符串
}

// ── 追溯 ──

/** 节点类型 */
export type TraceNodeType = 'incoming' | 'raw' | 'semi' | 'ship' | 'customer' | 'keypart' | 'virtualCustomer'

/** 合格判定类型 */
export type QualificationType = '合格' | '资格直通' | '常规'

// ── 来料批次 ──
export interface SqmIncomingLot {
  id: string
  lotNo: string
  orgId?: string
  supplierId?: string
  supplierCode?: string
  supplierName?: string
  partNo?: string
  partName?: string
  qty?: number
  usedQty?: number
  unit?: string
  iqcPass?: boolean
  inspectResult?: string
  inspectType?: string
  isKeyPart?: boolean
  remark?: string
  receiveDate?: string
  /** 采购订单/工单号 */
  poNo?: string
  /** MES 供应商编号(VEN 编号) */
  venCode?: string
}

// ── 追溯节点(实体) ──
export interface SqmTraceNode {
  id: string
  orgId?: string
  nodeType: TraceNodeType
  rootLotId?: string
  rootNodeId?: string
  parentNodeId?: string
  treeLevel?: number
  nodeName?: string
  batchNo?: string
  materialCode?: string
  materialName?: string
  qty?: number
  unit?: string
  isValid?: string
  nodeDate?: string
  supplierId?: string
  supplierCode?: string
  supplierName?: string
  remark?: string
  isKeyPart?: boolean
  serialNo?: string
  /** 生产工单号(MO, MES 枢纽) */
  productionOrderNo?: string
  /** MES 检验阶段 IQC/IPQC/SQC/FQC/OQC/RQC/PKG */
  stage?: string
  qualificationType?: string
  children?: SqmTraceNode[]
}

// ── 追溯树 VO ──
export interface TraceNodeTreeVO {
  id: string
  rootLotId?: string
  parentNodeId?: string
  nodeType: TraceNodeType
  nodeName?: string
  batchNo?: string
  materialCode?: string
  qty?: number
  unit?: string
  nodeDate?: string
  supplierId?: string
  supplierName?: string
  remark?: string
  treeLevel?: number
  isValid?: string
  /** nodeType 对应的明细表行数据 */
  detail?: Record<string, any>
  /** 详情来源表: finished_goods_inspection / material_inspection / binding(绑定表兜底) / product_no(料号聚合)。如实标注, 不编造。 */
  detailSource?: string
  /** 源表缺失 material_barcode 字段(绑定表 material_barcode 为空的来料/半成品子件), 节点仍展示但标注"无 material_barcode"。 */
  noBarcode?: boolean
  children: TraceNodeTreeVO[]
}

/** 完整追溯树 — 后端返回 { tree, rootLotId, rootLotNo, rootNodeId, isKeyPart, upTree } */
export interface TraceFullTreeVO {
  rootLotId?: string
  rootLotNo?: string
  rootNodeId?: string
  isKeyPart?: boolean
  /** 追溯方向: forward 正向 / backward 反向 / all 全链路 */
  direction?: 'forward' | 'backward' | 'all'
  /** 以树根节点为起始的嵌套追溯树(下游去向) */
  tree?: TraceNodeTreeVO
  /** 上游组成树(来源) */
  upTree?: TraceNodeTreeVO
}

// ── 追溯节点搜索 VO ──
export interface TraceNodeSearchVO {
  id: string
  rootLotId?: string
  rootLotNo?: string
  nodeType: TraceNodeType
  nodeName?: string
  batchNo?: string
  materialCode?: string
  qty?: number
  unit?: string
  nodeDate?: string
  supplierId?: string
  supplierName?: string
  remark?: string
  treeLevel?: number
  isValid?: string
  materialBarcode?: string // 来料/关键件条码
  productBarcode?: string  // 成品条码
}

// ── 方向追溯结果节点 ──
export interface TraceDirectionNode {
  id: string
  nodeType: TraceNodeType
  nodeName?: string
  batchNo?: string
  materialCode?: string
  materialName?: string
  qty?: number
  unit?: string
  isValid?: string
  remark?: string
  nodeDate?: string
  supplierId?: string
  supplierName?: string
  direction?: string // forward/backward/both
}

// ── 节点录入/编辑请求 ──
export interface TraceNodeSaveRequest {
  orgId?: string
  rootLotId?: string
  nodeType?: TraceNodeType
  parentNodeId?: string
  nodeName?: string
  batchNo?: string
  qty?: number
  unit?: string
  nodeDate?: string
  supplierId?: string
  remark?: string
  qualificationType?: QualificationType
  /** MES 检验阶段: IQC/IPQC/SQC/FQC/OQC/RQC/PKG(必填, 须与 nodeType 匹配) */
  stage?: string
  // 产出明细(semi/ship)
  productName?: string
  materialCode?: string
  modelSpec?: string
  productionOrderNo?: string
  productionDate?: string
  inspectQty?: number
  inspector?: string
  // 药监合规(仅 ship)
  drugRegNo?: string
  perfInspectMethod?: string
  perfBatchNo?: string
  // 客户出货(仅 customer)
  customerName?: string
  customerCode?: string
  customerOrderNo?: string
  shipDate?: string
  trackingNo?: string
  shipAddress?: string
  contactPerson?: string
  contactPhone?: string
  // 一次性建树: 头节点带组成
  components?: TraceComponentItem[]
}

export interface TraceComponentItem {
  componentType?: string // raw / semi
  sourceNodeId?: string  // semi: 引用已存在半成品节点
  refNodeId?: string     // 引用已存在节点(不新建,直接建link)
  materialCode?: string  // raw: 物料编码(物料代码, ≠批号)
  qualifiedLotId?: string // 合格物料批次(级联下拉选中项, 命中已通过 IQC 的来料批次)
  supplierId?: string    // 供应商(由命中批次推导, 随组件提交用于后端校验)
  batchNo?: string       // raw: 组件批号(SON_LOT_NO, 新建组件必填)
  materialName?: string  // raw: 物料名称
  specModel?: string     // raw: 规格型号
  usageQty?: number      // 用量
  unit?: string
  processName?: string   // 工序名称
  processCode?: string   // 工序编码(PROCESS_CODE)
  componentWorkOrder?: string // 组件工单(SON_TASK)
}

// ── 原材料明细 ──
export interface SqmTraceRawDetail {
  id?: string
  nodeId?: string
  rawMaterialName?: string
  specification?: string
  batchNo?: string
  supplierId?: string
  supplierName?: string
  qty?: number
  unit?: string
  certificateNo?: string
  inspectResult?: string
  remark?: string
}

// ── 产品/产出明细 ──
export interface SqmTraceProductDetail {
  id?: string
  nodeId?: string
  productName?: string
  specification?: string
  batchNo?: string
  qty?: number
  unit?: string
  productionLine?: string
  shift?: string
  operator?: string
  productionDate?: string
  inspectResult?: string
  remark?: string
}

// ── 节点完整详情 VO ──
export interface TraceLinkRef {
  id: string
  nodeType: string
  nodeName: string
  batchNo: string
}

export interface TraceNodeFullVO {
  node: SqmTraceNode
  detail: Record<string, any>
  supplierName: string | null
  parents: TraceLinkRef[] | null
  children: TraceLinkRef[] | null
}

// ── 关键件SN ──
export interface SqmKeyPartSn {
  id?: string
  nodeId?: string
  partName?: string
  serialNo?: string
  batchNo?: string
  remark?: string
}

// ── FMEA 风险项 ──
/** FMEA 状态机四态 */
export type FmeaStatus = '创建' | '待闭环' | '进行中' | '已闭环'

export interface QmsFmeaRisk {
  id: string
  riskNo?: string
  orgId?: string
  fmeaType?: string // PFMEA/DFMEA/SFMEA
  /** 工序/功能 */
  process?: string
  /** 产品/项目 */
  product?: string
  /** 潜在失效模式 */
  failureMode?: string
  /** 失效影响 */
  failureEffect?: string
  /** 失效原因 */
  failureCause?: string
  /** 现有预防控制措施 */
  currentPreventCtrl?: string
  /** 现有探测控制措施 */
  currentDetectCtrl?: string
  /** 严重度 S (1-10) — 后端字段 severityS */
  severityS?: number
  /** 频度 O (1-10) — 后端字段 occurrenceO */
  occurrenceO?: number
  /** 探测度 D (1-10) — 后端字段 detectionD */
  detectionD?: number
  /** 风险优先数 RPN = S × O × D */
  rpn?: number
  /** 风险等级 高/中/低 */
  riskLevel?: string
  /** 高风险标志(后端: S>=9 或 RPN>=100) */
  highRiskFlag?: boolean
  /** 建议措施 */
  suggestMeasure?: string
  /** 采取后的措施/现状 */
  action?: string
  /** 责任部门 */
  ownerDept?: string
  /** 责任部门编码(ops.sys_org.org_code) */
  ownerDeptCode?: string
  /** 责任人 */
  owner?: string
  /** 责任人用户 id(ops.sys_user.id) */
  ownerUserId?: string
  /** 来源类型(INCOMING_ABNORMAL/NCM_DEFECT, 手工创建为空) */
  sourceType?: string
  /** 来源业务主键(异常/缺陷 id, 手工创建为空) */
  sourceId?: string
  /** 目标完成日期 */
  targetDate?: string
  status: FmeaStatus
  /** 闭环日期 */
  closeDate?: string
  /** 闭环证据 */
  evidence?: string
  /** 高风险闭环前置: 已验证三个月无复发 */
  recurrenceVerified?: boolean
  /** 闭环备注 */
  note?: string
  createdAt?: string
  updatedAt?: string
}

/** RPN 预测响应(GET /v1/sqm/fmea/predict) */
export interface FmeaPredictResult {
  rpn: number
  riskLevel: string
  highRiskFlag?: boolean
}

/** FMEA 闭环轨迹(QmsFmeaRiskTrack) */
export interface QmsFmeaRiskTrack {
  id: string
  riskId?: string
  operator?: string
  fromStatus?: string
  toStatus?: string
  note?: string
  evidence?: string
  createdAt?: string
}

// ── 供应商绩效 ──
export interface SqmSupplierPerformance {
  id: string
  orgId?: string
  supplierId: string
  supplierName?: string // 供应商名称(后端关联填充)
  period: string          // CHAR(7) 如 2026-07
  score: number           // 综合分 NUMERIC(5,2)
  deliveryScore?: number  // 交付分
  qualityScore?: number   // 质量分
  serviceScore?: number   // 服务分
  incomingPassRate?: number // 来料合格率
  defectRate?: number       // 不良率
  rectifyTimelyRate?: number // 整改及时率
  deliveryTimelyRate?: number // 交付及时率
  complianceRate?: number    // 合规率
  level?: string             // A/B/C/D
  observeFlag?: boolean      // 首年观察期
  dataMissingFlag?: boolean  // 数据缺失标志
  createdAt?: string
}

// ── 审核频次建议 ──
export interface SqmAuditFreqResult {
  level: string
  freqPerYear: number
  auditType: string
}

// ── 供应商质量看板 ──

/** 合格率分布档位汇总 */
export interface RateBucketVO {
  key: string // 100 / 90-100 / 80-90 / 70-80 / 60-70 / lt60
  label: string
  count: number
}

/** 供应商合格率分布明细(供分布柱状图下钻 + 散点图) */
export interface SupplierRateItem {
  supplierId: string
  supplierName: string
  totalCount: number
  passCount: number
  failCount: number
  passRate: number
}

export interface PassRateDistributionVO {
  buckets: RateBucketVO[]
  suppliers: SupplierRateItem[]
}

/** 重点供应商逐月趋势点 */
export interface SupplierTrendPoint {
  ym: string // 2026-07
  supplierId: string
  supplierName: string
  totalCount: number
  passCount: number
  passRate: number
}

/** 系统推荐重点供应商 */
export interface KeySupplierItem {
  supplierId: string
  supplierName: string
  reasons: string[]
  totalLots?: number
  passRate?: number
  abnormalCount?: number
  level?: string
}

/** 异常热力图点(供应商×月份) */
export interface AbnormalHeatmapPoint {
  ym: string
  supplierId: string
  supplierName: string
  totalCount: number
  severeCount: number
  normalCount: number
}

/** 不合格物料 TOP 行 */
export interface DefectiveMaterialTopItem {
  partNo: string
  partName: string
  totalCount: number
  failCount: number
  failRate: number
  keyPartCount: number
}

/** 检验状态/检验类型分布 */
export interface InspectStatusDistributionVO {
  inspectResult: { name: string; count: number }[]
  inspectType: { name: string; count: number }[]
}

// ── 来料异常严重度判定规则 ──
export interface SqmAbnormalRule {
  id?: string
  orgId?: string | null
  /** 严重判定阈值: 来料不良数 >= 该值判「严重」 */
  severeMinQty?: number
  /** 一般不良累计窗口天数(同供应商+同物料) */
  generalAccumDays?: number
  /** 窗口内一般不良累计件数阈值, 达到触发 8D */
  generalAccumQty?: number
  remark?: string
  updatedAt?: string
}

// ── 供应商绩效评审 R3 补齐 ──

/** 绩效指标配置(权重/阈值可配置) */
export interface SqmPerfMetricCfg {
  id?: string
  orgId?: string | null
  metricCode: string      // INCOMING_PASS / DELIVERY / QUALITY / RECTIFY / COMPLIANCE
  metricName: string
  weight: number          // 权重,求和归一
  target?: number         // 达标阈值
  challenge?: number      // 挑战阈值
  enabled?: boolean       // 是否参与计算
  autoLinkage?: boolean   // 分级是否联动份额/状态
}

/** 排名榜行 */
export interface PerfRankRow {
  supplierId: string
  supplierName: string
  category?: string
  score: number
  level: string
  rank: number
}

/** 柏拉图行(缺陷类型累计占比) */
export interface PerfParetoRow {
  defectCode: string
  cnt: number
}
