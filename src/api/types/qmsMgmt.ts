// 体系管理模块类型。

export interface QmsQualityGoal {
  id?: string
  orgId?: string
  goalName?: string
  goalType?: string
  period?: string
  targetValue?: number
  actualValue?: number
  unit?: string
  owner?: string
  deadline?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export interface QmsInternalAudit {
  id?: string
  orgId?: string
  auditNo?: string
  auditName?: string
  auditScope?: string
  planDate?: string
  auditor?: string
  status?: string
  remark?: string
  createdAt?: string
  [key: string]: any
}

export interface QmsAuditNc {
  id?: string
  orgId?: string
  auditId?: string
  ncNo?: string
  ncDesc?: string
  clause?: string
  severity?: string
  status?: string
  owner?: string
  dueDate?: string
  corrective?: string
  verifyResult?: string
  closedAt?: string
  [key: string]: any
}

export interface QmsAdverseEvent {
  id?: string
  orgId?: string
  eventNo?: string
  eventType?: string
  occurStage?: string
  severity?: string
  occurAt?: string
  reportAt?: string
  rootCause?: string
  handleDesc?: string
  handleTimeliness?: string
  owner?: string
  status?: string
  remark?: string
  createdAt?: string
  [key: string]: any
}

export interface QmsMgmtStats {
  [key: string]: any
}

export interface QmsComplianceBoard {
  goal?: any
  audit?: any
  adverse?: any
  feedback?: any
}
