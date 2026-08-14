import { request } from '@/api/client'
import type {
  SqmAuditPlan, SqmAuditRecord, SqmAuditNc, SqmAuditApproval, SqmAuditReportArchive,
  CloseNcRequest, ApproveAuditRequest, SqmAuditApprovalCfg, SqmAuditorItem,
} from '@/api/types/sqm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import type { PageResult } from '@/api/types/common'

export const sqmAuditApi = {
  listPlans: () => request.get<SqmAuditPlan[]>('/v1/sqm/audits/plans'),
  listPlansPage: (params: { status?: string; auditType?: string; supplierId?: string; page?: number; size?: number }) =>
    request.get<PageResult<SqmAuditPlan>>('/v1/sqm/audits/plans/page', { params }),
  /** 按来源变更单 id 反查其联动生成的审核计划(双向追溯:变更单详情 → 审核计划)。 */
  listByChangeId: (changeId: string) => request.get<SqmAuditPlan[]>(`/v1/sqm/audits/plans/by-change/${changeId}`),
  getPlan: (id: string) => request.get<SqmAuditPlan>(`/v1/sqm/audits/plans/${id}`),
  createPlan: (body: Partial<SqmAuditPlan>) => request.post<SqmAuditPlan>('/v1/sqm/audits/plans', body),
  confirmPlan: (id: string) => request.put<void>(`/v1/sqm/audits/plans/${id}/confirm`),
  startPlan: (id: string) => request.post<SqmAuditPlan>(`/v1/sqm/audits/plans/${id}/start`),
  listRecords: () => request.get<SqmAuditRecord[]>('/v1/sqm/audits/records'),
  getRecord: (id: string) => request.get<SqmAuditRecord>(`/v1/sqm/audits/records/${id}`),
  createRecord: (body: Partial<SqmAuditRecord>) => request.post<SqmAuditRecord>('/v1/sqm/audits/records', body),
  listNcs: () => request.get<SqmAuditNc[]>('/v1/sqm/audits/ncs'),
  createNc: (body: Partial<SqmAuditNc>) => request.post<SqmAuditNc>('/v1/sqm/audits/ncs', body),
  closeNc: (id: string, body: CloseNcRequest) => request.post<void>(`/v1/sqm/audits/ncs/${id}/close`, body),
  downloadReport: (id: string) => request.get<Blob>(`/v1/sqm/audits/records/${id}/report`, { responseType: 'blob' }),
  listApprovals: (planId: string) => request.get<SqmAuditApproval[]>(`/v1/sqm/audits/plans/${planId}/approvals`),
  approve: (planId: string, body: ApproveAuditRequest) => request.post<void>(`/v1/sqm/audits/plans/${planId}/approvals`, body),
  generateArchive: (recordId: string) => request.post<SqmAuditReportArchive>(`/v1/sqm/audits/records/${recordId}/archive/generate`),
  // 审核会签配置(按审核类型可配置会签人员/否决权)
  getAuditApprovalCfg: () => request.get<SqmAuditApprovalCfg[]>('/v1/sqm/audits/audit-approval-cfg'),
  saveAuditApprovalCfg: (body: { auditType: string; auditors: SqmAuditorItem[] }) =>
    request.put<void>('/v1/sqm/audits/audit-approval-cfg', body),
  /** 列表级指派/改派审核组长(单人 ownerUserId 或 角色团队 assignRoleCodes) */
  reassign: (id: string, body?: DefectLaunchRequest) => request.post<void>(`/v1/sqm/audits/plans/${id}/reassign`, body),
}
