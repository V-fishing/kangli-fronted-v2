import { request } from '@/api/client'
import type { FiaApproval } from '@/api/types/fia'

export const fiaApprovalApi = {
  /** GET /v1/fia/approvals */
  list: () => request.get<FiaApproval[]>('/v1/fia/approvals'),

  /** GET /v1/fia/approvals/{id} */
  get: (id: string) => request.get<FiaApproval>(`/v1/fia/approvals/${id}`),

  /** POST /v1/fia/approvals */
  create: (body: Partial<FiaApproval>) => request.post<FiaApproval>('/v1/fia/approvals', body),

  /** POST /v1/fia/approvals/{id}/approve */
  approve: (id: string, params: { opinion: string; approved: boolean }) =>
    request.post<void>(`/v1/fia/approvals/${id}/approve`, undefined, { params }),
}
