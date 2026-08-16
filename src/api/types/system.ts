// 系统管理相关类型
export interface NotifyConfig {
  id: string
  module: string
  eventCode: string
  eventName: string
  roleCodes: string | null
  /** 具体接收人用户ID(逗号分隔, 与角色并存取并集) */
  receiverIds?: string | null
  channels: string | null
  enabled: boolean
  orgId: string | null
}

export interface NotifyChannel {
  id: string
  channel: string
  webhookUrl: string | null
  isEnabled: boolean
  level: string
  remark: string | null
  /** 渠道类型: webhook=群机器人 / direct=点对点 */
  channelType?: string
  /** 点对点渠道凭据 JSON(secret 字段后端脱敏为 ****) */
  configJson?: string | null
}

/** 点对点通知发送记录(ops.notify_message) */
export interface NotifyMessage {
  id: string
  orgId: string | null
  /** 发送人用户 ID */
  senderId: string | null
  senderName: string | null
  /** 接收人用户 ID */
  receiverId: string | null
  receiverName: string | null
  /** 接收人类型: user / role(预留) */
  receiverType?: string
  /** 渠道名, 如 钉钉应用消息 / 邮件 */
  channel: string | null
  /** 渠道类型: direct / webhook(预留) */
  channelType?: string
  title: string | null
  content: string | null
  /** 业务类型: 8D / CAPA / CA / MANUAL */
  bizType?: string
  bizId?: string | null
  bizNo?: string | null
  /** 发送状态: 发送中 / 成功 / 失败 */
  status: string
  failReason?: string | null
  sendTime?: string | null
  createdAt?: string
}

/** 通知中心聚合行: 以「通知」为粒度(同一 notification_id 的多渠道投递明细归并为一行) */
export interface NotifyCenterRow {
  /** 聚合主键: notification_id 或 明细自身 id */
  id: string
  sendTime?: string | null
  senderName?: string | null
  receiverId?: string | null
  receiverName?: string | null
  title?: string | null
  bizType?: string | null
  bizId?: string | null
  bizNo?: string | null
  /** 主渠道(通常为 站内弹窗) */
  channel?: string | null
  /** 综合状态: 成功 / 发送中 / 失败(任一明细失败即失败, 否则任一发送中即发送中) */
  status: string
  /** 该通知的全部投递明细 */
  deliveries: NotifyDelivery[]
}

/** 单条投递明细(渠道 + 状态) */
export interface NotifyDelivery {
  channel?: string | null
  status?: string | null
  failReason?: string | null
}

// 角色码 -> 中文名(与 ops.sys_role 对齐)
export const ROLE_LABELS: Record<string, string> = {
  operator: '操作工',
  inspector: '生产检验员',
  shiftleader: '班组长',
  qe: '质量工程师',
  sqe: 'SQE',
  qmanager: '质量经理',
  purchaser: '采购员',
  rd: '研发工程师',
  admin: '管理员',
  sysadmin: '超级管理员',
}

// 模块 -> 中文名
export const MODULE_LABELS: Record<string, string> = {
  ncm: '不合格管理(NCM)',
  sqm: '供应商质量管理(SQM)',
  fia: '首件检验(FIA)',
  patrol: '巡检(Patrol)',
  spc: '统计过程控制(SPC)',
  schedule: '定时任务(超期扫描)',
}

export function roleLabel(code: string): string {
  return ROLE_LABELS[code] ?? code
}
