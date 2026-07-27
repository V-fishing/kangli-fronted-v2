import { request } from '@/api/client'
import type { QmsCapa, CapaVo } from '@/api/types/ncm'

export const ncmCapaApi = {
  list: () => request.get<QmsCapa[]>('/v1/ncm/capas'),
  get: (id: string) => request.get<CapaVo>(`/v1/ncm/capas/${id}`),
  create: (body: Partial<QmsCapa>) => request.post<QmsCapa>('/v1/ncm/capas', body),
  launchFromAbnormal: (body: Partial<QmsCapa>) => request.post<QmsCapa>('/v1/ncm/capas/launch', body),
  updateProgress: (id: string, progress: number) => request.post<void>(`/v1/ncm/capas/${id}/progress`, undefined, { params: { progress } }),
  close: (id: string) => request.post<void>(`/v1/ncm/capas/${id}/close`),
  approve: (id: string, body: { approved: boolean; comment: string }) =>
    request.post<void>(`/v1/ncm/capas/${id}/approve`, body),
  reset: (id: string) => request.post<void>(`/v1/ncm/capas/${id}/reset`),
}
