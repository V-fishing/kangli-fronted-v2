import { request } from '@/api/client'
import type { PatlAbnormal } from '@/api/types/patrol'
import type { PageResult } from '@/api/types/common'

export const patlAbnormalApi = {
  list: () => request.get<PatlAbnormal[]>('/v1/patrol/abnormals'),
  listPage: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<PatlAbnormal>>('/v1/patrol/abnormals/page', { params }),
  close: (id: string, body: { handleRemark: string }) => request.post<void>(`/v1/patrol/abnormals/${id}/close`, body),
}