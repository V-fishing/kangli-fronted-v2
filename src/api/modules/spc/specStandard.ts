import { request } from '@/api/client'
import type { SpcSpecStandard } from '@/api/types/spc'
import type { PageResult } from '@/api/types/common'

export const spcSpecStandardApi = {
  list: () => request.get<SpcSpecStandard[]>('/v1/spc/spec-standards'),
  listPage: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<SpcSpecStandard>>('/v1/spc/spec-standards/page', { params }),
  get: (id: string) => request.get<SpcSpecStandard>(`/v1/spc/spec-standards/${id}`),
  create: (body: Partial<SpcSpecStandard>) => request.post<SpcSpecStandard>('/v1/spc/spec-standards', body),
  update: (id: string, body: Partial<SpcSpecStandard>) => request.put<void>(`/v1/spc/spec-standards/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/spc/spec-standards/${id}`),
}
