import { request } from '@/api/client'
import type { LoginRequest, LoginResponse } from '@/api/types/uop'

export const authApi = {
  /** POST /v1/auth/login - 登录签发 JWT */
  login: (data: LoginRequest) => request.post<LoginResponse>('/v1/auth/login', data),
  /** POST /v1/auth/logout - 登出 */
  logout: () => request.post<void>('/v1/auth/logout'),
}
