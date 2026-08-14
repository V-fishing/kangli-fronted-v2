/**
 * SPC 通知渠道 API
 * 对应后端 SpcNotifyChannelController
 */
import { request } from '@/api/client'
import type { SpcNotifyChannel } from '@/api/types/spc'

const BASE = '/v1/spc/notify-channels'

export const spcNotifyChannelApi = {
  /** 获取通知渠道配置列表 */
  list() {
    return request.get<SpcNotifyChannel[]>(BASE)
  },

  /** 启用/停用通知渠道（后端通过 @RequestParam 接收，需用 URL 参数传参） */
  toggle(id: string, enabled: boolean) {
    return request.put<void>(`${BASE}/${id}/toggle`, undefined, { params: { enabled } })
  },

  /** 更新通知渠道配置 */
  update(id: string, data: Partial<SpcNotifyChannel>) {
    return request.put<void>(`${BASE}/${id}`, data)
  },

  /** 获取发送记录 */
  records(params: { channelId?: string; page?: number; size?: number }) {
    return request.get(`${BASE}/records`, { params })
  },
}
