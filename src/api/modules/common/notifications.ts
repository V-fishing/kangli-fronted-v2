import { request } from '@/api/client'
import type { SysNotification } from '@/api/types/notify'

/** 全平台站内消息中心 */
export const notificationApi = {
  list: () => request.get<SysNotification[]>('/v1/notifications'),
  unreadCount: () => request.get<number>('/v1/notifications/unread-count'),
  read: (id: string) => request.post<void>(`/v1/notifications/${id}/read`),
  readAll: () => request.post<void>('/v1/notifications/read-all'),
}
