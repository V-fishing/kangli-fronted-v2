import { request } from '@/utils/request'
import type { FiaWoLockAlert } from '@/api/types/fia'
import type { FiaWoLock } from '@/api/types/fia'

export const fiaWoLockApi = {
  active: () => request.get<FiaWoLockAlert[]>('/v1/fia/wo-lock/active'),
  list: (params: { status?: string; woNo?: string }) =>
    request.get<FiaWoLock[]>('/v1/fia/wo-lock/list', { params }),
  release: (data: { woNo: string; releaseReason?: string; traceTag?: string }) =>
    request.post('/v1/fia/wo-lock/release', null, { params: data }),
  emergencyRelease: (data: { woNo: string; releaseReason?: string; traceTag?: string }) =>
    request.post('/v1/fia/wo-lock/emergency-release', null, { params: data }),
}
