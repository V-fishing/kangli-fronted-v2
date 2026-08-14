import { onUnmounted, ref } from 'vue'
import { notificationApi } from '@/api/modules/common/notifications'
import type { SysNotification } from '@/api/types/notify'

/**
 * 统一的前端消息接收封装:列表 / 未读计数 / 单条已读 / 全部已读 / 时间格式化。
 * 供顶栏铃铛(BasicLayout)与消息中心(MessageCenter)复用。
 *
 * 注意:notices/unread 为模块级单例状态——铃铛与消息中心共享同一数据源,
 * 任何一方 markRead/markAll 都会实时反映到另一方的未读徽标/圆点。
 * 轮询 timer 仍为调用方各自持有,互不干扰。
 */
const notices = ref<SysNotification[]>([])
const unread = ref(0)

export function useNotifications() {
  let timer = 0

  function fmtTime(t?: string) {
    return t ? String(t).replace('T', ' ').slice(0, 16) : ''
  }

  async function loadNotices() {
    try {
      notices.value = await notificationApi.list()
    } catch {
      notices.value = []
    }
    await pollUnread()
  }

  async function pollUnread() {
    try {
      unread.value = await notificationApi.unreadCount()
    } catch {
      /* 未登录 / 网络异常时静默 */
    }
  }

  async function markRead(n: SysNotification) {
    if (!n.isRead && n.id) {
      try {
        await notificationApi.read(n.id)
        n.isRead = true
        unread.value = Math.max(0, unread.value - 1)
      } catch {
        /* ignore */
      }
    }
  }

  async function markAll() {
    try {
      await notificationApi.readAll()
      notices.value.forEach((x) => (x.isRead = true))
      unread.value = 0
    } catch {
      /* ignore */
    }
  }

  function startPolling(ms = 30000) {
    pollUnread()
    timer = window.setInterval(pollUnread, ms)
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = 0
    }
  }

  onUnmounted(stopPolling)

  return { notices, unread, fmtTime, loadNotices, pollUnread, markRead, markAll, startPolling, stopPolling }
}
