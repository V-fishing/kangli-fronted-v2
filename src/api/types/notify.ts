// ── 全平台站内消息通知 ──
export interface SysNotification {
  id: string
  orgId?: string
  userId?: string
  userName?: string
  title?: string
  content?: string
  bizType?: string // 如 sqm_change
  bizId?: string
  link?: string // 前端跳转路径
  isRead?: boolean
  createTime?: string
}
