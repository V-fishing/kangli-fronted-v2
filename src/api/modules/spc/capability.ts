import { request } from '@/api/client'
import type { SpcCapability, SpcSupplierCpkVo } from '@/api/types/spc'

export const spcCapabilityApi = {
  list: () => request.get<SpcCapability[]>('/v1/spc/capability'),
  calc: (params: { paramId: string; periodType?: string; periodValue?: string }) =>
    request.post<SpcCapability>('/v1/spc/capability/calc', undefined, { params }),
  trend: (params: { paramId: string; months?: number }) =>
    request.get<SpcCapability[]>('/v1/spc/capability/trend', { params }),
  supplierCpk: () => request.get<SpcSupplierCpkVo[]>('/v1/spc/capability/supplier-cpk'),
}
