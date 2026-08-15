import { request } from '@/api/client'
import type { CsWorkOrder, CsWorkOrderDashboard, SatisfactionStats } from '@/api/types/cs'
import type { PageResult } from '@/api/types/common'
import type { UserSelectVo } from '@/api/types/uop'

export const csWorkOrderApi = {
  page: (params: { keyword?: string; woType?: string; status?: string; priority?: string; page?: number; size?: number }) =>
    request.get<PageResult<CsWorkOrder>>('/v1/cs/work-orders/page', { params }),
  get: (id: string) =>
    request.get<CsWorkOrder>(`/v1/cs/work-orders/${id}`),
  dashboard: () =>
    request.get<CsWorkOrderDashboard>('/v1/cs/work-orders/dashboard'),
  satisfactionStats: () =>
    request.get<SatisfactionStats>('/v1/cs/work-orders/satisfaction-stats'),
  assignableUsers: () =>
    request.get<UserSelectVo[]>('/v1/cs/work-orders/assignable-users'),
  create: (data: CsWorkOrder) =>
    request.post<CsWorkOrder>('/v1/cs/work-orders', data),
  update: (data: CsWorkOrder) =>
    request.put<CsWorkOrder>('/v1/cs/work-orders', data),
  delete: (id: string) =>
    request.delete(`/v1/cs/work-orders/${id}`),
  assign: (id: string, responsibleId: string, responsibleName?: string) =>
    request.post(`/v1/cs/work-orders/${id}/assign`, null, { params: { responsibleId, responsibleName } }),
  complete: (id: string, handleDetail?: string) =>
    request.post(`/v1/cs/work-orders/${id}/complete`, null, { params: { handleDetail } }),
  close: (id: string, satisfaction?: number, satisfactionComment?: string) =>
    request.post(`/v1/cs/work-orders/${id}/close`, null, { params: { satisfaction, satisfactionComment } }),
}
