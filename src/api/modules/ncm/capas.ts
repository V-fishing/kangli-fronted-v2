import { request } from '@/api/client'
import type { QmsCapa, CapaVo } from '@/api/types/ncm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import type { PageResult } from '@/api/types/common'

export const ncmCapaApi = {
  list: () => request.get<QmsCapa[]>('/v1/ncm/capas'),
  listPage: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<QmsCapa>>('/v1/ncm/capas/page', { params }),
  get: (id: string) => request.get<CapaVo>(`/v1/ncm/capas/${id}`),
  create: (body: Partial<QmsCapa>) => request.post<QmsCapa>('/v1/ncm/capas', body),
  launchFromAbnormal: (body: { capa: Partial<QmsCapa>; launch?: Partial<DefectLaunchRequest> }) =>
    request.post<QmsCapa>('/v1/ncm/capas/launch', body),
  updateProgress: (id: string, progress: number) => request.post<void>(`/v1/ncm/capas/${id}/progress`, undefined, { params: { progress } }),
  close: (id: string) => request.post<void>(`/v1/ncm/capas/${id}/close`),
  approve: (id: string, body: { approved: boolean; comment: string }) =>
    request.post<void>(`/v1/ncm/capas/${id}/approve`, body),
  reset: (id: string) => request.post<void>(`/v1/ncm/capas/${id}/reset`),
  /** 列表级改派责任人(单人 ownerUserId 或 角色团队 assignRoleCodes) */
  reassign: (id: string, body?: DefectLaunchRequest) => request.post<void>(`/v1/ncm/capas/${id}/reassign`, body),
}
