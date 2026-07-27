import { request } from '@/api/client'
import type { SpcParam } from '@/api/types/spc'

export const spcParamApi = {
  list: () => request.get<SpcParam[]>('/v1/spc/params'),
  get: (id: string) => request.get<SpcParam>(`/v1/spc/params/${id}`),
  create: (body: Partial<SpcParam>) => request.post<SpcParam>('/v1/spc/params', body),
  update: (id: string, body: Partial<SpcParam>) => request.put<void>(`/v1/spc/params/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/spc/params/${id}`),
}
