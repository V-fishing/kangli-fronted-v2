import { request } from '@/api/client'
import type { Qms8dReport, EightDVo, AdvanceStageRequest, StageApproveDTO, EightDApprovalConfig } from '@/api/types/ncm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import type { PageResult } from '@/api/types/common'

export interface AuditLogItem {
  id: number
  module: string
  action: string
  operatorId: string | null
  operatorName: string
  recordId: string
  detail: string | null
  status: string
  costMs: number | null
  createdAt: string | null
}

export const ncm8dApi = {
  list: () => request.get<Qms8dReport[]>('/v1/ncm/8d-reports'),
  listPage: (params?: { keyword?: string; status?: string; source?: string; page?: number; size?: number }) =>
    request.get<PageResult<Qms8dReport>>('/v1/ncm/8d-reports/page', { params }),
  get: (id: string) => request.get<EightDVo>(`/v1/ncm/8d-reports/${id}`),
  create: (body: Partial<Qms8dReport>) => request.post<Qms8dReport>('/v1/ncm/8d-reports', body),
  launchFromAbnormal: (body: { report: Partial<Qms8dReport>; launch?: Partial<DefectLaunchRequest> }) =>
    request.post<Qms8dReport>('/v1/ncm/8d-reports/launch', body),
  advance: (id: string, body: AdvanceStageRequest) => request.post<void>(`/v1/ncm/8d-reports/${id}/advance`, body),
  approve: (id: string, body: StageApproveDTO) => request.post<void>(`/v1/ncm/8d-reports/${id}/approve`, body),
  reopen: (id: string, reason?: string) => request.post<void>(`/v1/ncm/8d-reports/${id}/reopen`, undefined, { params: { reason } }),
  getApprovalConfig: () => request.get<EightDApprovalConfig[]>('/v1/ncm/8d-reports/approval-config'),
  saveApprovalConfig: (items: EightDApprovalConfig[]) => request.post<void>('/v1/ncm/8d-reports/approval-config', items),
  /** 列表级改派责任人(单人 ownerUserId 或 角色团队 assignRoleCodes) */
  reassign: (id: string, body?: DefectLaunchRequest) => request.post<void>(`/v1/ncm/8d-reports/${id}/reassign`, body),
  /** 操作轨迹:按记录 ID 查该 8D 报告全流程留痕(时间倒序) */
  getAuditTrail: (recordId: string, params?: { module?: string; action?: string; page?: number; size?: number }) =>
    request.get<PageResult<AuditLogItem>>('/v1/ncm/audit/log', { params: { recordId, ...params } }),
}
