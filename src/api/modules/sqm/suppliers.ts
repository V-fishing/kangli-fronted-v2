import { request } from '@/api/client'
import type { SqmSupplier } from '@/api/types/sqm'

export const sqmSupplierApi = {
  list: () => request.get<SqmSupplier[]>('/v1/sqm/suppliers'),
  get: (id: string) => request.get<SqmSupplier>(`/v1/sqm/suppliers/${id}`),
  create: (body: Partial<SqmSupplier>) => request.post<SqmSupplier>('/v1/sqm/suppliers', body),
  update: (body: Partial<SqmSupplier>) => request.put<void>('/v1/sqm/suppliers', body),
  delete: (id: string) => request.delete<void>(`/v1/sqm/suppliers/${id}`),
}
