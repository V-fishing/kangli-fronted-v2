import { request } from '@/api/client'
import type { PageResult } from '@/api/types/common'
import type { SpcSubgroup, SpcSubgroupVo, CreateSubgroupRequest, CountCapabilityVo } from '@/api/types/spc'

export const spcSubgroupApi = {
  list: (params?: { paramId?: string; page?: number; size?: number }) =>
    request.get<PageResult<SpcSubgroup>>('/v1/spc/subgroups', { params }),
  get: (id: string) => request.get<SpcSubgroupVo>(`/v1/spc/subgroups/${id}`),
  create: (body: CreateSubgroupRequest) => request.post<SpcSubgroup>('/v1/spc/subgroups', body),
  countCapability: (paramId: string) =>
    request.get<CountCapabilityVo>('/v1/spc/subgroups/count-capability', { params: { paramId } }),
}
