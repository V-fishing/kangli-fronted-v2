import { request } from '@/api/client'
import type { SqmChangeOrder, SqmChangeOrderListVo, SqmChangeOrderVo, ApproveChangeRequest } from '@/api/types/sqm'
import type { PageResult } from '@/api/types/common'

export const sqmChangeApi = {
  list: () => request.get<SqmChangeOrderListVo[]>('/v1/sqm/changes'),
  listPage: (params: { keyword?: string; status?: string; supplierId?: string; page?: number; size?: number }) =>
    request.get<PageResult<SqmChangeOrderListVo>>('/v1/sqm/changes/page', { params }),
  get: (id: string) => request.get<SqmChangeOrderVo>(`/v1/sqm/changes/${id}`),
  create: (body: Partial<SqmChangeOrder>) => request.post<SqmChangeOrder>('/v1/sqm/changes', body),
  submit: (id: string) => request.post<void>(`/v1/sqm/changes/${id}/submit`),
  approve: (id: string, body: ApproveChangeRequest) => request.post<void>(`/v1/sqm/changes/${id}/approve`, body),
  close: (id: string) => request.post<void>(`/v1/sqm/changes/${id}/close`),
  rollback: (id: string, reason?: string) => request.post<void>(`/v1/sqm/changes/${id}/rollback`, undefined, { params: { reason } }),
  verifySign: (id: string, params: { approvalRole: string; username: string; password: string }) =>
    request.post<void>(`/v1/sqm/changes/${id}/verify-sign`, undefined, { params }),
}
