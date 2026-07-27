import { request } from '@/api/client'
import type { CurrentUserVo } from '@/api/types/uop'

export const meApi = {
  /** GET /v1/uop/me - 当前登录用户信息 + 权限码集合 */
  me: () => request.get<CurrentUserVo>('/v1/uop/me'),
}
