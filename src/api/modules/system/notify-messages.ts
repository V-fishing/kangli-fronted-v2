// 通知中心 API:点对点通知手动发起 + 发送记录查询
import { request } from '@/api/client'
import type { NotifyMessage, NotifyChannel, NotifyCenterRow } from '@/api/types/system'
import type { PageResult } from '@/api/types/common'

const BASE = '/v1/system/notify-messages'

export interface SendNotifyRequest {
  /** 接收人用户 ID 列表 */
  receiverIds: string[]
  /** 渠道名列表(点对点渠道), 如 ['钉钉应用消息','邮件'] */
  channels: string[]
  title: string
  content: string
  /** 业务类型, 默认 MANUAL */
  bizType?: string
  bizId?: string
  bizNo?: string
}

export const notifyMessageApi = {
  /** 手动发起通知(向多接收人按渠道点对点发送, 返回发送记录条数) */
  send(body: SendNotifyRequest) {
    return request.post<number>(`${BASE}/send`, body)
  },
  /** 发送记录分页查询(状态/渠道/关键字筛选) */
  list(params?: { status?: string; channel?: string; keyword?: string; page?: number; size?: number }) {
    return request.get<PageResult<NotifyMessage>>(BASE, { params })
  },
  /** 点对点渠道列表(凭据已脱敏, 仅启用渠道) */
  channels() {
    return request.get<NotifyChannel[]>(`${BASE}/channels`)
  },
  /** 通知中心统一视图: 以通知为粒度聚合多渠道投递明细 */
  centerPage(params?: { status?: string; channel?: string; keyword?: string; page?: number; size?: number }) {
    return request.get<PageResult<NotifyCenterRow>>(`${BASE}/center/page`, { params })
  },
}
