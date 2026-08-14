import { request } from '@/api/client'
import type { UserSelectVo } from '@/api/types/uop'

export const usersApi = {
  /** GET /v1/uop/users/select - 启用用户下拉项(采集任务选择接收人) */
  select: () => request.get<UserSelectVo[]>('/v1/uop/users/select'),
}
