// 工装管理(TLM) 类型定义
export interface TlmTooling {
  id?: string
  orgId?: string
  toolNo: string
  toolName: string
  toolCategory: 'TOOL' | 'GAUGE' // 工装夹具 / 监视测量设备
  toolType?: string
  riskClass?: string // I/II/III/IV (GAUGE)
  verifyCycle?: string // 验证周期(工装夹具台账,如 一年)
  quantity?: number   // 数量
  processId?: string
  procName?: string    // 工序名称(与 processId 同源，用于 FIA/SPC 标准匹配)
  productCode?: string
  spec?: string
  material?: string    // 材质
  supplierId?: string
  supplierName?: string // 供应商/生产厂家(设备总表,纯文本)
  ownerId?: string
  ownerName?: string   // 领用人(设备总表,纯文本)
  adminId?: string
  adminName?: string   // 设备管理员(设备总表,纯文本)
  remark?: string      // 备注(工装夹具台账/设备总表)
  status: 'IN_USE' | 'DISABLED' | 'REPAIRING' | 'SCRAPPED'
  location?: string
  ownerId?: string
  adminId?: string // 设备管理员(GAUGE)
  softwareVer?: string
  precisionVal?: string
  measurePoint?: string
  calibDate?: string
  calibDueDate?: string
  calibCycle?: number
  bindCount?: number
  designLife?: number
  nextMaintDate?: string
  maintCycle?: number
  cost?: number
  inboundDate?: string
  purchaseDate?: string
  locked?: boolean
}

export interface TlmToolVersion {
  id?: string
  orgId?: string
  toolId?: string
  versionNo?: string
  changeType?: 'DESIGN' | 'UPGRADE' | 'OTHER'
  changeDesc?: string
  changedBy?: string
  changedAt?: string
}

export interface TlmToolProduct {
  id?: string
  toolId?: string
  productCode?: string
  productName?: string
  kind?: 'MATERIAL' | 'SEMI' | 'FINISHED'
  specModel?: string
}

export interface TlmProductCandidate {
  materialCode?: string
  productName?: string
  specModel?: string
  kind?: 'MATERIAL' | 'SEMI' | 'FINISHED'
}

export interface TlmProductDetail {
  kind?: string
  sourceTable?: string
  materialCode?: string
  productName?: string
  specModel?: string
  batchNo?: string
  supplierName?: string
  inspectionResult?: string
  inspectionDate?: string
  productionOrderNo?: string
  qty?: string
  unit?: string
  inspector?: string
  plantName?: string
}

export interface TlmMaintPlan {
  id?: string
  orgId?: string
  toolId?: string
  planNo?: string
  cycleType?: string // WEEK/MONTH/YEAR
  nextDate?: string
  responsibleId?: string
  remark?: string
}

export interface TlmMaintRecord {
  id?: string
  orgId?: string
  planId?: string
  toolId?: string
  maintDate?: string
  result?: string
  responsibleId?: string
  attachment?: string
}
