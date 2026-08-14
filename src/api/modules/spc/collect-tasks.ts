import { request } from '@/api/client'
import type { SpcCollectTask } from '@/api/types/spc'
import type { PageResult } from '@/api/types/common'

export const spcCollectTaskApi = {
  list: () => request.get<SpcCollectTask[]>('/v1/spc/collect-tasks'),
  listPage: (params?: { status?: string; collectMode?: string; page?: number; size?: number }) =>
    request.get<PageResult<SpcCollectTask>>('/v1/spc/collect-tasks/page', { params }),
  create: (body: Partial<SpcCollectTask>) => request.post<SpcCollectTask>('/v1/spc/collect-tasks', body),
  update: (id: string, body: Partial<SpcCollectTask>) => request.put<void>(`/v1/spc/collect-tasks/${id}`, body),
  remove: (id: string) => request.delete<void>(`/v1/spc/collect-tasks/${id}`),
  markDowntime: (id: string, body: { isPlannedDowntime: boolean; reason?: string }) => request.post<void>(`/v1/spc/collect-tasks/${id}/downtime`, body),
  markMissing: (id: string, reason?: string) => request.post<void>(`/v1/spc/collect-tasks/${id}/mark-missing`, reason ? { reason } : undefined),
  scanMissing: () => request.post<number>('/v1/spc/collect-tasks/scan-missing'),
}
