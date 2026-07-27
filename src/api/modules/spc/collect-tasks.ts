import { request } from '@/api/client'
import type { SpcCollectTask } from '@/api/types/spc'

export const spcCollectTaskApi = {
  list: () => request.get<SpcCollectTask[]>('/v1/spc/collect-tasks'),
  create: (body: Partial<SpcCollectTask>) => request.post<SpcCollectTask>('/v1/spc/collect-tasks', body),
  markDowntime: (id: string, body: { isPlannedDowntime: boolean; reason?: string }) => request.post<void>(`/v1/spc/collect-tasks/${id}/downtime`, body),
  scanMissing: () => request.post<number>('/v1/spc/collect-tasks/scan-missing'),
}
