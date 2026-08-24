/** FIA 任务状态(含硬编码"待批准",未入 QmsEnums.FiaTaskStatus) */
export type FiaTaskStatus =
  | '待检' | '进行中' | '待复核' | '待批准'
  | '审批中' | '已完成' | '超时' | '已作废' | '已驳回'

/** 综合判定 */
export type InspResult = '合格' | '不合格' | '警告' | '-'

/** 触发来源 */
export type FiaSource = 'FACTORY' | 'SUPPLIER'

/** 处置路径 */
export type FiaDisposition = '合格放行' | '合格入库' | '退货' | '返工' | '让步接收' | '紧急放行' | '豁免开工' | '挑选'

// ── FiaTask ──
export interface FiaTask {
  id: string
  code: string // FA-{timestamp},后端自动生成
  orgId: string
  source: FiaSource
  woNo?: string
  lineName?: string
  productName?: string
  procName?: string
  triggerType?: string
  stdId?: string
  aql?: string
  stdVersion?: string
  partNo?: string
  supplierId?: string
  lotId?: string
  batchNo?: string
  isUrgent?: boolean
  remark?: string
  status: FiaTaskStatus
  overallJudge?: InspResult
  disposition?: FiaDisposition
  inspectorId?: string
  reviewerId?: string
  approverId?: string
  submittedAt?: string
  reviewedAt?: string
  approvedAt?: string
  sampleSize?: number
  sampleCount?: number
  slaDueAt?: string
  isOverdue?: boolean
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  version?: number
  changeId?: string // 关联物料变更单 ID(变更驱动的首件)
  firstArticleId?: string // 关联首件任务 ID(完工检验单↔首件 1:1 绑定,放行前须非空)
  // ---- 完工检验补收字段(V248) ----
  modelSpec?: string // 型号规格
  productionDate?: string // 生产日期(YYYY-MM-DD)
  submittedQty?: number // 提交数量
  unit?: string // 单位
  plantCode?: string // 工厂编码
  plantName?: string // 工厂名称
}

/** 某工单「最近一次首件」视图(完工检验建单 1:1 选择并带出生产字段) */
export interface EligibleFirstArticleVO {
  taskId: string
  code: string
  woNo?: string
  productName?: string
  partNo?: string
  procName?: string
  overallJudge?: string
  status?: string // 任务状态(已完成=已放行可绑定;其余为未放行,仅用于带字段)
  createdAt?: string
  // ---- 生产字段(从 MES 成品表按工单带出,定死不可手填) ----
  modelSpec?: string // 型号规格
  productionDate?: string // 生产日期(YYYY-MM-DD)
  submittedQty?: number // 提交数量
  unit?: string // 单位
}

// ── 检验项 ──
export interface FiaInspItem {
  id: string
  taskId: string
  seq: number
  itemName: string
  isCtq: boolean
  stdValue?: string
  tolerance?: string
  unit?: string
  valueType?: string // enum/numeric/text
  enumValues?: string
  measuredValue?: string
  judge: string // 合格/不合格/-
  /** 枚举型合格值(如 合格) */
  passValues?: string
  /** 推荐控制图类型集合(标准库明细项含此字段;逗号分隔字符串) */
  chartTypes?: string
}

/** 首件任务追溯结果(最小结构,字段由后端 trace 接口返回) */
export interface StdTraceResult {
  [key: string]: any
}

export interface InspItemResultRequest {
  items: { id: string; measuredValue: string; judge: string }[]
}

// ── 实时判定预览(录入时按标准值±公差 / passValues 自动判定) ──
export interface PreviewJudgeItem {
  id: string
  measuredValue: string
}
export interface PreviewJudgeRequest {
  items: PreviewJudgeItem[]
}
export interface PreviewJudgeResult {
  id: string
  judge?: string // 合格/不合格(不可匹配时为 null)
  matchable: boolean // 是否按标准规则命中可自动判定
  autoJudged?: boolean
}

// ── 创建任务请求 ──
export interface CreateFiaTaskRequest {
  orgId: string
  woNo?: string
  lineName?: string
  productName: string
  procName: string
  triggerType: string
  category?: string
  stdId?: string
  partNo?: string
  supplierId?: string
  lotId?: string
  batchNo?: string
  stdItemIds?: string[]
  isUrgent?: boolean
  remark?: string
  changeId?: string // 关联物料变更单 ID(非空时后端强制绑定 supplier/partNo + source=SUPPLIER)
  // ---- 完工检验补收字段(trigger_type='完工检验' 时使用,普通首件忽略) ----
  eligibleFirstArticleId?: string // 选中的最近合格首件任务 ID
  modelSpec?: string // 型号规格
  productionDate?: string // 生产日期(YYYY-MM-DD)
  submittedQty?: number // 提交数量
  unit?: string // 单位
  plantCode?: string // 工厂编码
  plantName?: string // 工厂名称
}

/** 工装首件检验任务创建(人工入口): 按 toolId 取工装档案自动匹配标准,批次号必填 */
export interface CreateFromToolingRequest {
  orgId: string
  toolId: string
  triggerType?: string
  batchNo: string
  isUrgent?: boolean
  remark?: string
}

// ── 产品→工序 二级树节点 ──
export interface ProductTreeNode {
  productName: string
  partNo?: string
  category?: string
  procNames: string[]
}

// ── 签名 ──
export interface SignRequest {
  password: string
  itemId?: string
}

// ── FiaTaskVo(详情,含检验项) ──
export interface FiaTaskVo {
  task: FiaTask
  items: FiaInspItem[]
  log?: TaskLogItem[]
}

export interface TaskLogItem {
  node: string
  t?: string
  o?: string
  done?: boolean
}

// ── 审批 ──
export type ApprovalStatus = '待审批' | '已通过' | '已驳回'

export interface FiaApproval {
  id: string
  code?: string
  taskId?: string
  approvalType?: string // disposition
  applicantId?: string
  approverId?: string
  approveOpinion?: string
  approveAt?: string
  applyAt?: string
  status: ApprovalStatus
}

// ── 检验标准 ──
export interface FiaInspStd {
  id: string
  orgId?: string
  code: string
  material?: string
  procName?: string
  partNo?: string
  aql?: string
  inspectLevel?: string
  samplePlan?: string
  ctqText?: string
  stdVersion?: string
  status: string // 草稿/生效/停用
  isDefault?: boolean
  prevVersionId?: string
  createdAt?: string
}

export interface FiaStdItemRequest {
  seq: number
  itemName: string
  isCtq?: boolean
  stdValue?: string
  tolerance?: string
  unit?: string
  valueType?: string
  enumValues?: string
  passValues?: string
  /** 推荐控制图类型集合: 前端编辑态为 string[] (多选), 提交后端归一为逗号分隔字符串。 */
  chartTypes?: string | string[]
}

export interface CreateInspStdRequest {
  orgId?: string
  code: string
  material?: string
  procName?: string
  aql?: string
  inspectLevel?: string
  samplePlan?: string
  ctqText?: string
  stdVersion?: string
  status?: string
  items?: FiaStdItemRequest[]
}

export interface InspStdVo {
  std: FiaInspStd
  items: FiaInspItem[]
}

// ── 触发类型 ──
export interface FiaTriggerType {
  id: string
  name: string
  isEnabled?: boolean
}

// ── 签名配置 ──
export interface FiaSignConfig {
  id?: string
  orgId?: string
  signMethods: string[] // [password, handwriting, ca]
  signNodes: string // 两级/三级
  signGranularity?: string // 整单签名/逐项签名
  lockAfterFail?: number
  lockMinutes?: number
}

// ── 拦截配置 ──
export interface FiaInterceptConfig {
  id?: string
  orgId?: string
  interceptMode?: string
  multiTriggerMode?: string
  slaHours?: number
  escalateFailCount?: number
}

// ── 工单锁 ──
export interface FiaWoLock {
  id: string
  orgId?: string
  woNo: string
  lockStatus: string
  lockReason?: string
  unlockType?: string
  approverId?: string
  releaseReason?: string
  traceTag?: string
  wipHold?: boolean
  createdAt?: string
  /** 锁定时间 */
  lockedAt?: string
  /** 解锁时间 */
  unlockedAt?: string
  /** 触发首件任务单号 */
  taskCode?: string
}

/** 工单锁告警(active 列表) */
export interface FiaWoLockAlert {
  id: string
  woNo: string
  lockStatus?: string
  lockReason?: string
  traceTag?: string
  wipHold?: boolean
  lockedAt?: string
  [key: string]: unknown
}

// ── 看板 ──
export interface FiaDashboard {
  /** 今日新建任务数(后端 key: todayCount) */
  todayCount?: number
  todayTasks?: number
  /** 今日完成数(后端 key: todayCompleted) */
  todayCompleted?: number
  /** 全局合格率(后端 key: passRate, 全部已完成任务口径, 非今日/本月) */
  passRate?: number
  todayPassRate?: number
  overdueCount?: number
  statusDistribution?: Record<string, number>
  /** 来料看板状态计数 */
  statusCounts?: { status: string; count: number }[]
  recentTrend?: { date: string; count: number; passRate: number }[]
}

/** 来料看板(独立接口返回) */
export interface IncomingDashboard {
  /** 今日统计 */
  today?: { total?: number; completed?: number; overdue?: number }
  /** 批次覆盖率 */
  lotCoverage?: number
  /** 状态分布 */
  statusCounts?: { status: string; cnt: number }[]
  [key: string]: unknown
}

/** 产品料号模糊搜索结果 */
export interface ProductSearchResult {
  partNo?: string
  productName?: string
  category?: string
  matchedSupplierId?: string
  matchedSupplierName?: string
}

/** CTQ 检验项(供 SPC 参数关联选择) */
export interface CtqItemVo {
  id: string
  stdId?: string
  itemName?: string
  isCtq?: boolean
  stdValue?: string
  tolerance?: string
  unit?: string
  [key: string]: unknown
}

/** 任务关联标准项 */
export interface TaskStdItemVo {
  id: string
  stdId?: string
  itemName?: string
  isCtq?: boolean
  chartTypes?: string
  [key: string]: unknown
}

// ── 批量来料建单 ──
export interface BatchByLotRequest {
  lotNo: string
  orgId: string
}

export interface BatchByLotResult {
  matched: number
  missing: number
  lotNo?: string
  partNo?: string
  /** 匹配的检验计划数 */
  plansFound?: number
  /** 已建单数量 */
  tasksCreated?: number
  /** 建单失败数量 */
  tasksFailed?: number
  tasks?: FiaTask[]
}

// ── 完工检验(直读直写 MES qms.finished_goods_inspection) ──
/** 完工检验详情/列表视图(MES 表 40 列对齐)。id 为 PostgreSQL ctid 文本(无主键定位键)。 */
export interface FinishInspectionVO {
  id?: string
  reportNo?: string
  inspectionRequestNo?: string
  productionOrderNo?: string
  materialCode?: string
  productName?: string
  modelSpec?: string
  prodBatchOrSn?: string
  productionDate?: string
  expiryDate?: string
  submittedQty?: number | string
  inspectedQty?: number | string
  qualifiedQty?: number | string
  unqualifiedQty?: number | string
  unit?: string
  inspectorName?: string
  inspectionResult?: string // 合格/不合格/警告
  drugRegNo?: string // 药品注册号
  perfTestMethod?: string // 性能测试方法
  perfSampleBatchNo?: string // 性能样本批号
  qcReviewer?: string
  qcReviewTime?: string
  mgrRepresentative?: string
  mgrApprovalTime?: string
  signatureUser?: string
  signatureTime?: string
  signatureReason?: string
  qcReview?: string
  mgrApproval?: string
  isUrgent?: string // 0/1
  isEntrusted?: string // 0/1
  isValid?: string // 0/1
  category?: string // 成品/半成品
  plantCode?: string
  plantName?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

/** 完工检验建单请求(基本信息) */
export interface FinishInspectionCreateRequest {
  productionOrderNo: string
  materialCode: string
  productName?: string
  modelSpec?: string
  prodBatchOrSn?: string
  productionDate?: string
  category?: string // 成品/半成品
  isUrgent?: boolean
  isEntrusted?: boolean
  plantCode?: string
  plantName?: string
  unit?: string
}

/** 完工检验更新请求(检验汇总 / 审核签核 共用) */
export interface FinishInspectionUpdateRequest {
  inspectorName?: string
  inspectionResult?: string
  inspectionRequestNo?: string // 检验申请号
  expiryDate?: string // 有效期至
  drugRegNo?: string // 药品注册号
  perfTestMethod?: string // 性能测试方法
  perfSampleBatchNo?: string // 性能样本批号
  submittedQty?: number
  inspectedQty?: number
  qualifiedQty?: number
  unqualifiedQty?: number
  unit?: string
  qcReview?: string
  qcReviewer?: string
  qcReviewTime?: string
  mgrApproval?: string
  mgrRepresentative?: string
  mgrApprovalTime?: string
  signatureUser?: string
  signatureTime?: string
  signatureReason?: string
  isValid?: string
}

/** 完工检验分页查询 */
export interface FinishInspectionPageQuery {
  category?: string
  productionOrderNo?: string
  materialCode?: string
  keyword?: string
  page?: number
  size?: number
}

// ── 物料检验(来料检验,直读直写 MES qms.material_inspection) ──
/** 物料检验详情/列表视图(MES 表 62 列对齐)。id 为 record_no(新建行由应用生成 MI- 前缀唯一号)。 */
export interface MaterialInspectionVO {
  id?: string
  processNo?: string
  formVersion?: string
  isCustomerSupplied?: string // 0/1
  memo?: string
  materialCategory?: string
  isValid?: string // 0/1
  reviewStatus?: string
  signatureStatus?: string
  isUrgent?: string // 0/1
  dataRecordFlag?: string
  isInvalid?: string
  reportGenerated?: string
  recordNo?: string
  purchaseOrder?: string
  inboundNo?: string
  inspectionRequestNo?: string
  mesInspectionNo?: string
  inspectionDate?: string
  judgementDate?: string
  inspector?: string
  inspectionResult?: string // 合格/不合格/让步接收等
  supplierName?: string
  supplierCode?: string
  materialCode?: string
  materialName?: string
  specModel?: string
  materialBatchNo?: string
  qualifiedQty?: number | string
  unqualifiedQty?: number | string
  submittedQty?: number | string
  lossQty?: number | string
  unit?: string
  defectDesc?: string
  handlingMethod?: string
  unqualifiedFinalStatus?: string
  unqualifiedReview?: string
  unqualifiedReviewNo?: string
  inspectionCategory?: string
  arrivalDate?: string
  receivingNo?: string
  poLineNo?: string
  receivingLineNo?: string
  shelfLifeDays?: string
  reinspectRemark?: string
  judge?: string
  inspectionEndDate?: string
  reviewer?: string
  reviewDate?: string
  submitter?: string
  submitDate?: string
  remark?: string
  extId?: string
  lastModifiedBy?: string
  signatureUser?: string
  signatureTime?: string
  signatureReason?: string
  plantCode?: string
  plantName?: string
  createdBy?: string
  updatedBy?: string
  isDeleted?: string
  version?: string
  createdAt?: string
  updatedAt?: string
  materialBarcode?: string
}

/** 物料检验建单请求(基本信息) */
export interface MaterialInspectionCreateRequest {
  materialCode: string
  materialName?: string
  specModel?: string
  materialBatchNo?: string
  materialBarcode?: string
  supplierName?: string
  supplierCode?: string
  materialCategory?: string
  inspectionCategory?: string
  unit?: string
  isCustomerSupplied?: boolean
  isUrgent?: boolean
  plantCode?: string
  plantName?: string
  remark?: string
  purchaseOrder?: string
  inboundNo?: string
  arrivalDate?: string
  receivingNo?: string
  poLineNo?: string
  receivingLineNo?: string
  shelfLifeDays?: number
}

/** 物料检验更新请求(检验汇总 / 审核签核 共用) */
export interface MaterialInspectionUpdateRequest {
  inspector?: string
  inspectionResult?: string
  inspectionRequestNo?: string // 检验申请号
  mesInspectionNo?: string // MES 检验单号
  inspectionDate?: string // 检验日期
  judgementDate?: string // 判定日期
  inspectionEndDate?: string // 检验完成日期
  defectDesc?: string // 缺陷描述
  handlingMethod?: string // 处理方式
  purchaseOrder?: string // 采购订单号
  inboundNo?: string // 入库单号
  arrivalDate?: string // 到货日期
  receivingNo?: string // 收货单号
  poLineNo?: string // PO 行号
  receivingLineNo?: string // 收货行号
  shelfLifeDays?: number // 保质期天数
  submittedQty?: number
  qualifiedQty?: number
  unqualifiedQty?: number
  lossQty?: number
  unit?: string
  reviewer?: string
  reviewDate?: string
  unqualifiedReview?: string
  unqualifiedFinalStatus?: string
  unqualifiedReviewNo?: string
  judge?: string
  submitter?: string
  submitDate?: string
  reinspectRemark?: string
  signatureUser?: string
  signatureTime?: string
  signatureReason?: string
  remark?: string
}

/** 物料检验分页查询 */
export interface MaterialInspectionPageQuery {
  supplierName?: string
  materialCode?: string
  inspectionRequestNo?: string
  recordNo?: string
  inspectionResult?: string
  keyword?: string
  page?: number
  size?: number
}
