import { request } from '@/api/client'
import type { NcmCorrectiveAction } from '@/api/types/ncm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import type { PageResult } from '@/api/types/common'

export const ncmCorrectiveActionApi = {
  list: (defectNo?: string) => request.get<NcmCorrectiveAction[]>('/v1/ncm/corrective-actions', { params: defectNo ? { defectNo } : undefined }),
  listByDefectNo: (defectNo: string) => request.get<NcmCorrectiveAction[]>('/v1/ncm/corrective-actions', { params: { defectNo } }),
  listPage: (params?: { defectNo?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<NcmCorrectiveAction>>('/v1/ncm/corrective-actions/page', { params }),
  get: (id: string) => request.get<NcmCorrectiveAction>(`/v1/ncm/corrective-actions/${id}`),
  create: (body: Partial<NcmCorrectiveAction>) =>
    request.post<NcmCorrectiveAction>('/v1/ncm/corrective-actions', body),
  updateProgress: (id: string, progress: number) =>
    request.post<void>(`/v1/ncm/corrective-actions/${id}/progress`, undefined, { params: { progress } }),
  close: (id: string) => request.post<void>(`/v1/ncm/corrective-actions/${id}/close`),
  /** 列表级改派责任人(单人 ownerUserId 或 角色团队 assignRoleCodes) */
  reassign: (id: string, body?: DefectLaunchRequest) => request.post<void>(`/v1/ncm/corrective-actions/${id}/reassign`, body),
}
