import { request } from '@/api/client'
import type { SqmIncomingAbnormal, CloseAbnormalRequest, AbnormalRectificationRequest } from '@/api/types/sqm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import type { PageResult } from '@/api/types/common'

export const sqmAbnormalApi = {
  list: () => request.get<SqmIncomingAbnormal[]>('/v1/sqm/abnormals'),
  listPage: (params: { keyword?: string; level?: string; status?: string; supplierId?: string; page?: number; size?: number }) =>
    request.get<PageResult<SqmIncomingAbnormal>>('/v1/sqm/abnormals/page', { params }),
  create: (body: Partial<SqmIncomingAbnormal>) => request.post<SqmIncomingAbnormal>('/v1/sqm/abnormals', body),
  close: (id: string, body: CloseAbnormalRequest) => request.post<void>(`/v1/sqm/abnormals/${id}/close`, body),
  saveRectification: (id: string, body: AbnormalRectificationRequest) => request.put<void>(`/v1/sqm/abnormals/${id}/rectification`, body),
  loadRectification: (id: string) => request.get<Record<string, unknown[]>>(`/v1/sqm/abnormals/${id}/rectification`),
  checkEscalation: () => request.post<void>('/v1/sqm/abnormals/check-escalation'),
  /** 列表级指派/改派处理人(单人 ownerUserId 或 角色团队 assignRoleCodes) */
  reassign: (id: string, body?: DefectLaunchRequest) => request.post<void>(`/v1/sqm/abnormals/${id}/reassign`, body),
}
