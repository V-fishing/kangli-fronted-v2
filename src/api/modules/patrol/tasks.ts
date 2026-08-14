import { request } from '@/api/client'
import type { PatlTask, PatlTaskVo } from '@/api/types/patrol'
import type { PageResult } from '@/api/types/common'

export const patlTaskApi = {
  list: () => request.get<PatlTask[]>('/v1/patrol/tasks'),
  listPage: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<PatlTask>>('/v1/patrol/tasks/page', { params }),
  get: (id: string) => request.get<PatlTaskVo>(`/v1/patrol/tasks/${id}`),
  create: (body: Record<string, unknown>) => request.post<PatlTask>('/v1/patrol/tasks', body),
  submitRecord: (id: string, body: Record<string, unknown>) => request.post<void>(`/v1/patrol/tasks/${id}/records`, body),
  close: (id: string) => request.post<void>(`/v1/patrol/tasks/${id}/close`),
}