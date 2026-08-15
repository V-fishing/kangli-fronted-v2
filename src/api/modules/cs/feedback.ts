import { request } from '@/api/client'
import type { CsFeedback } from '@/api/types/cs'
import type { PageResult } from '@/api/types/common'

export const csFeedbackApi = {
  page: (params: { keyword?: string; fbType?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<CsFeedback>>('/v1/cs/feedbacks/page', { params }),
  get: (id: string) =>
    request.get<CsFeedback>(`/v1/cs/feedbacks/${id}`),
  create: (data: CsFeedback) =>
    request.post<CsFeedback>('/v1/cs/feedbacks', data),
  update: (data: CsFeedback) =>
    request.put<CsFeedback>('/v1/cs/feedbacks', data),
  delete: (id: string) =>
    request.delete(`/v1/cs/feedbacks/${id}`),
  handle: (id: string, handleDetail?: string, ownerName?: string) =>
    request.post(`/v1/cs/feedbacks/${id}/handle`, null, { params: { handleDetail, ownerName } }),
  markHandling: (id: string, ownerName?: string) =>
    request.post(`/v1/cs/feedbacks/${id}/handling`, null, { params: { ownerName } }),
}
