import { request } from '@/api/client'
import type { SqmSupplierCert } from '@/api/types/sqm'

/** 供应商资质证书管理(后端 /api/v1/sqm/supplier-certs)。 */
export const supplierCertsApi = {
  list: (supplierId?: string) =>
    request.get<SqmSupplierCert[]>('/v1/sqm/supplier-certs', { params: { supplierId } }),
  get: (id: string) => request.get<SqmSupplierCert>(`/v1/sqm/supplier-certs/${id}`),
  create: (body: Partial<SqmSupplierCert>) =>
    request.post<SqmSupplierCert>('/v1/sqm/supplier-certs', body),
  delete: (id: string) => request.delete<void>(`/v1/sqm/supplier-certs/${id}`),
  /** 即将过期资质(expiryDate 在 now ~ now+days 之间) */
  expiring: (days = 30) =>
    request.get<SqmSupplierCert[]>('/v1/sqm/supplier-certs/expiring', { params: { days } }),
}
