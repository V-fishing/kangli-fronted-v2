import { request } from '@/api/client'
import type { SqmIncomingAbnormal, CloseAbnormalRequest, AbnormalRectificationRequest } from '@/api/types/sqm'

export const sqmAbnormalApi = {
  list: () => request.get<SqmIncomingAbnormal[]>('/v1/sqm/abnormals'),
  create: (body: Partial<SqmIncomingAbnormal>) => request.post<SqmIncomingAbnormal>('/v1/sqm/abnormals', body),
  close: (id: string, body: CloseAbnormalRequest) => request.post<void>(`/v1/sqm/abnormals/${id}/close`, body),
  saveRectification: (id: string, body: AbnormalRectificationRequest) => request.put<void>(`/v1/sqm/abnormals/${id}/rectification`, body),
  loadRectification: (id: string) => request.get<Record<string, unknown[]>>(`/v1/sqm/abnormals/${id}/rectification`),
  checkEscalation: () => request.post<void>('/v1/sqm/abnormals/check-escalation'),
}
