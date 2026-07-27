import { request } from '@/api/client'
import type { PatlAbnormal } from '@/api/types/patrol'

export const patlAbnormalApi = {
  list: () => request.get<PatlAbnormal[]>('/v1/patrol/abnormals'),
  close: (id: string, body: { handleRemark: string }) => request.post<void>(`/v1/patrol/abnormals/${id}/close`, body),
}