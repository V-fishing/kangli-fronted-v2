import { request } from '@/api/client'
import type { SpcProcess } from '@/api/types/spc'
import type { PageResult } from '@/api/types/common'

export const spcProcessApi = {
  list: () => request.get<SpcProcess[]>('/v1/spc/processes'),
  listPage: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<SpcProcess>>('/v1/spc/processes/page', { params }),
  get: (id: string) => request.get<SpcProcess>(`/v1/spc/processes/${id}`),
  create: (body: Partial<SpcProcess>) => request.post<SpcProcess>('/v1/spc/processes', body),
  update: (id: string, body: Partial<SpcProcess>) => request.put<void>(`/v1/spc/processes/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/spc/processes/${id}`),
}
