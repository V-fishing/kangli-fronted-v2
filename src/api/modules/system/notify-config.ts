// 统一通知配置 API
import { request } from '@/api/client'
import type { NotifyConfig, NotifyChannel } from '@/api/types/system'
import type { UserSelectVo } from '@/api/types/uop'

const BASE = '/v1/system/notify-config'

export const notifyConfigApi = {
  /** 全部通知配置 */
  list() {
    return request.get<NotifyConfig[]>(BASE)
  },
  /** 全部外部渠道 */
  channels() {
    return request.get<NotifyChannel[]>(`${BASE}/channels`)
  },
  /** 启用用户下拉(指定具体接收人用) */
  users() {
    return request.get<UserSelectVo[]>(`${BASE}/users`)
  },
  /** 更新某事件配置 */
  update(id: string, data: { roleCodes?: string; receiverIds?: string; channels?: string; enabled?: boolean }) {
    return request.put<void>(`${BASE}/${id}`, data)
  },
  /** 更新外部渠道(webhook/启停/点对点凭据) */
  updateChannel(id: string, data: { webhookUrl?: string; enabled?: boolean; channelType?: string; configJson?: string }) {
    return request.put<void>(`${BASE}/channels/${id}`, data)
  },
}
