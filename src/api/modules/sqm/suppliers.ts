import { request } from '@/api/client'
import type { SqmSupplier } from '@/api/types/sqm'
import type { PageResult } from '@/api/types/common'

export const sqmSupplierApi = {
  list: () => request.get<SqmSupplier[]>('/v1/sqm/suppliers'),
  page: (params?: { keyword?: string; level?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<SqmSupplier>>('/v1/sqm/suppliers/page', { params }),
  get: (id: string) => request.get<SqmSupplier>(`/v1/sqm/suppliers/${id}`),
  create: (body: Partial<SqmSupplier>) => request.post<SqmSupplier>('/v1/sqm/suppliers', body),
  update: (body: Partial<SqmSupplier>) => request.put<void>('/v1/sqm/suppliers', body),
  delete: (id: string) => request.delete<void>(`/v1/sqm/suppliers/${id}`),
}
