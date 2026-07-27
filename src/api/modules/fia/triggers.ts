import { request } from '@/api/client'
import type { FiaTriggerType } from '@/api/types/fia'

export const fiaTriggerApi = {
  list: () => request.get<FiaTriggerType[]>('/v1/fia/triggers'),
  create: (body: Partial<FiaTriggerType>) => request.post<FiaTriggerType>('/v1/fia/triggers', body),
  update: (id: string, body: Partial<FiaTriggerType>) => request.put<void>(`/v1/fia/triggers/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/fia/triggers/${id}`),
  toggle: (id: string, enabled: boolean) => request.put<void>(`/v1/fia/triggers/${id}/toggle`, undefined, { params: { enabled } }),
}
