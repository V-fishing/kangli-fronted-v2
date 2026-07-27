import { request } from '@/api/client'
import type { PatlTask, PatlTaskVo } from '@/api/types/patrol'

export const patlTaskApi = {
  list: () => request.get<PatlTask[]>('/v1/patrol/tasks'),
  get: (id: string) => request.get<PatlTaskVo>(`/v1/patrol/tasks/${id}`),
  create: (body: Record<string, unknown>) => request.post<PatlTask>('/v1/patrol/tasks', body),
  submitRecord: (id: string, body: Record<string, unknown>) => request.post<void>(`/v1/patrol/tasks/${id}/records`, body),
  close: (id: string) => request.post<void>(`/v1/patrol/tasks/${id}/close`),
}