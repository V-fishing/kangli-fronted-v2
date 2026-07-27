import { request } from '@/api/client'
import type { FiaInspStd, CreateInspStdRequest, InspStdVo } from '@/api/types/fia'

export const fiaStdApi = {
  /** GET /v1/fia/stds */
  list: () => request.get<FiaInspStd[]>('/v1/fia/stds'),

  /** GET /v1/fia/stds/{id} */
  get: (id: string) => request.get<InspStdVo>(`/v1/fia/stds/${id}`),

  /** POST /v1/fia/stds */
  create: (body: CreateInspStdRequest) => request.post<FiaInspStd>('/v1/fia/stds', body),

  /** PUT /v1/fia/stds/{id} */
  update: (id: string, body: CreateInspStdRequest) => request.put<void>(`/v1/fia/stds/${id}`, body),

  /** DELETE /v1/fia/stds/{id} */
  delete: (id: string) => request.delete<void>(`/v1/fia/stds/${id}`),
}
