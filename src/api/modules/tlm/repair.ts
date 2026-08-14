import { request } from '@/api/client'
import type { TlmRepair } from '@/api/types/tlm'
import type { PageResult } from '@/api/types/common'

export const tlmRepairApi = {
  page: (params: { keyword?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<TlmRepair>>('/v1/tlm/repair/page', { params }),
}
