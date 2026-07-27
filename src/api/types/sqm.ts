// ── 供应商 ──
export interface SqmSupplier {
  id: string
  supplierNo?: string
  supplierCode?: string
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
}

export interface SqmAuditApprovalCfg {
  id?: string
  orgId?: string
  auditType: string
  auditors: string // JSON 数组字符串
}

// ── 追溯 ──

/** 节点类型 */
export type TraceNodeType = 'incoming' | 'raw' | 'semi' | 'ship' | 'customer'

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
  iqcPass?: boolean
  inspectResult?: string
  inspectType?: string
  isKeyPart?: boolean
  remark?: string
  receiveDate?: string
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
  children: TraceNodeTreeVO[]
}

/** 完整追溯树 — 后端返回 { tree, rootLotId, rootLotNo, rootNodeId, isKeyPart, upTree } */
export interface TraceFullTreeVO {
  rootLotId?: string
  rootLotNo?: string
  rootNodeId?: string
  isKeyPart?: boolean
  /** 以树根节点为起始的嵌套追溯树 */
  tree?: TraceNodeTreeVO
  /** 上游组成树(tree-from-node 接口填充) */
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
  materialCode?: string  // raw: 物料编码
  materialName?: string  // raw: 物料名称
  specModel?: string     // raw: 规格型号
  usageQty?: number      // 用量
  unit?: string
  processName?: string   // 工序
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

// ── FMEA ──
export interface QmsFmeaRisk {
  id: string
  riskNo?: string
  orgId?: string
  fmeaType?: string // PFMEA/DFMEA/SFMEA
  severity?: number
  occurrence?: number
  detection?: number
  rpn?: number
  riskLevel?: string // 高/中/低
  highRiskFlag?: boolean
  action?: string
  owner?: string
  targetDate?: string
  status: string // 待闭环/进行中/已闭环
  closeDate?: string
  evidence?: string
  recurrenceVerified?: boolean
}
