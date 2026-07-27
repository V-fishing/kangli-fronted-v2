import { request } from '@/api/client'
import type { FiaSignConfig } from '@/api/types/fia'

export const fiaSignConfigApi = {
  get: (params: { orgId: string }) => request.get<FiaSignConfig>('/v1/fia/sign-config', { params }),
  save: (body: FiaSignConfig) => request.put<void>('/v1/fia/sign-config', body),
}