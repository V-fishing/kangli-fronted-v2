import { request } from '@/api/client'
import type { Qms8dReport, EightDVo, AdvanceStageRequest, StageApproveDTO, EightDApprovalConfig } from '@/api/types/ncm'

export const ncm8dApi = {
  list: () => request.get<Qms8dReport[]>('/v1/ncm/8d-reports'),
  get: (id: string) => request.get<EightDVo>(`/v1/ncm/8d-reports/${id}`),
  create: (body: Partial<Qms8dReport>) => request.post<Qms8dReport>('/v1/ncm/8d-reports', body),
  launchFromAbnormal: (body: Partial<Qms8dReport>) => request.post<Qms8dReport>('/v1/ncm/8d-reports/launch', body),
  advance: (id: string, body: AdvanceStageRequest) => request.post<void>(`/v1/ncm/8d-reports/${id}/advance`, body),
  approve: (id: string, body: StageApproveDTO) => request.post<void>(`/v1/ncm/8d-reports/${id}/approve`, body),
  reopen: (id: string, reason?: string) => request.post<void>(`/v1/ncm/8d-reports/${id}/reopen`, undefined, { params: { reason } }),
  getApprovalConfig: () => request.get<EightDApprovalConfig[]>('/v1/ncm/8d-reports/approval-config'),
  saveApprovalConfig: (items: EightDApprovalConfig[]) => request.post<void>('/v1/ncm/8d-reports/approval-config', items),
}
