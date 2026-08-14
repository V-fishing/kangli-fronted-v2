import { request } from '@/api/client'
import type { TlmScrap } from '@/api/types/tlm'
import type { PageResult } from '@/api/types/common'

export const tlmScrapApi = {
  page: (params: { keyword?: string; scrapNo?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<TlmScrap>>('/v1/tlm/scrap/page', { params }),
}
