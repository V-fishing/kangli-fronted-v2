import { request } from '@/api/client'
import type { PageResult } from '@/api/types/common'
import type { QmsQualityGoal, QmsInternalAudit, QmsAuditNc, QmsAdverseEvent, QmsMgmtStats, QmsComplianceBoard } from '@/api/types/qmsMgmt'

export const qmsGoalApi = {
  page: (params: { keyword?: string; goalType?: string; period?: string; page?: number; size?: number }) =>
    request.get<PageResult<QmsQualityGoal>>('/v1/qms-mgmt/goals/page', { params }),
  get: (id: string) => request.get<QmsQualityGoal>(`/v1/qms-mgmt/goals/${id}`),
  stats: () => request.get<QmsMgmtStats>('/v1/qms-mgmt/goals/stats'),
  create: (data: QmsQualityGoal) => request.post<QmsQualityGoal>('/v1/qms-mgmt/goals', data),
  update: (data: QmsQualityGoal) => request.put<QmsQualityGoal>('/v1/qms-mgmt/goals', data),
  delete: (id: string) => request.delete(`/v1/qms-mgmt/goals/${id}`),
}

export const qmsAuditApi = {
  page: (params: { keyword?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<QmsInternalAudit>>('/v1/qms-mgmt/audits/page', { params }),
  get: (id: string) => request.get<QmsInternalAudit>(`/v1/qms-mgmt/audits/${id}`),
  stats: () => request.get<QmsMgmtStats>('/v1/qms-mgmt/audits/stats'),
  create: (data: QmsInternalAudit) => request.post<QmsInternalAudit>('/v1/qms-mgmt/audits', data),
  update: (data: QmsInternalAudit) => request.put<QmsInternalAudit>('/v1/qms-mgmt/audits', data),
  delete: (id: string) => request.delete(`/v1/qms-mgmt/audits/${id}`),
  advance: (id: string, status: string) =>
    request.post(`/v1/qms-mgmt/audits/${id}/advance`, null, { params: { status } }),
  ncPage: (params: { auditId?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<QmsAuditNc>>('/v1/qms-mgmt/audits/nc/page', { params }),
  ncSave: (data: QmsAuditNc) => request.post<QmsAuditNc>('/v1/qms-mgmt/audits/nc', data),
  ncDelete: (id: string) => request.delete(`/v1/qms-mgmt/audits/nc/${id}`),
}

export const qmsAdverseApi = {
  page: (params: { keyword?: string; eventType?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<QmsAdverseEvent>>('/v1/qms-mgmt/adverse/page', { params }),
  get: (id: string) => request.get<QmsAdverseEvent>(`/v1/qms-mgmt/adverse/${id}`),
  stats: () => request.get<QmsMgmtStats>('/v1/qms-mgmt/adverse/stats'),
  create: (data: QmsAdverseEvent) => request.post<QmsAdverseEvent>('/v1/qms-mgmt/adverse', data),
  update: (data: QmsAdverseEvent) => request.put<QmsAdverseEvent>('/v1/qms-mgmt/adverse', data),
  delete: (id: string) => request.delete(`/v1/qms-mgmt/adverse/${id}`),
  handle: (id: string, status: string, handleDesc?: string, owner?: string) =>
    request.post(`/v1/qms-mgmt/adverse/${id}/handle`, null, { params: { status, handleDesc, owner } }),
}

export const qmsBoardApi = {
  board: () => request.get<QmsComplianceBoard>('/v1/qms-mgmt/board'),
}
