import { request } from '@/api/client'
import type { PatlRoute, PatlRouteVo } from '@/api/types/patrol'

export const patlRouteApi = {
  list: () => request.get<PatlRoute[]>('/v1/patrol/routes'),
  get: (id: string) => request.get<PatlRouteVo>(`/v1/patrol/routes/${id}`),
  create: (body: Record<string, unknown>) => request.post<PatlRoute>('/v1/patrol/routes', body),
  update: (id: string, body: Partial<PatlRoute>) => request.put<void>(`/v1/patrol/routes/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/patrol/routes/${id}`),
}