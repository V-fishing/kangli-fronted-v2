import { request } from '@/api/client'
import type { TlmMaintPlan, TlmMaintRecord } from '@/api/types/tlm'
import type { PageResult } from '@/api/types/common'

export const tlmMaintApi = {
  planPage: (params: { toolId?: string; page?: number; size?: number }) =>
    request.get<PageResult<TlmMaintPlan>>('/v1/tlm/maint/plans', { params }),
  createPlan: (body: Partial<TlmMaintPlan>) => request.post<TlmMaintPlan>('/v1/tlm/maint/plan', body),
  updatePlan: (body: Partial<TlmMaintPlan>) => request.put<void>('/v1/tlm/maint/plan', body),
  deletePlan: (id: string) => request.delete<void>(`/v1/tlm/maint/plan/${id}`),
  records: (toolId?: string) => request.get<TlmMaintRecord[]>('/v1/tlm/maint/records', { params: { toolId } }),
  createRecord: (body: Partial<TlmMaintRecord>) => request.post<TlmMaintRecord>('/v1/tlm/maint/record', body),
}
