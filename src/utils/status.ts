/**
 * 业务状态 → StatusPill 变体映射（铁律第 2 条：业务状态一律 StatusPill）
 *
 * StatusPill 六变体：p-wait(待处理/待派单) / p-run(进行中/处理中)
 *                    p-sign(待签批/已完成待确认) / p-lock(锁定/作废/驳回)
 *                    p-done(已通过/已闭环) / p-mute(静默/未知/停用)
 *
 * 该模块是各列表页内联 statusPill() 函数的权威单一来源，便于单元测试与一致性维护。
 */

export type StatusPillVariant =
  | 'p-wait'
  | 'p-run'
  | 'p-sign'
  | 'p-lock'
  | 'p-done'
  | 'p-mute'

export const STATUS_PILL_VARIANTS: StatusPillVariant[] = [
  'p-wait',
  'p-run',
  'p-sign',
  'p-lock',
  'p-done',
  'p-mute',
]

/** 售后工单状态（cs_work_order.status） */
export const csWorkOrderPill: Record<string, StatusPillVariant> = {
  PENDING: 'p-wait',
  ASSIGNED: 'p-run',
  DONE: 'p-sign',
  CLOSED: 'p-done',
}

/** 工装状态（tlm_tooling.status） */
export const tlmToolingPill: Record<string, StatusPillVariant> = {
  IN_USE: 'p-done',
  DISABLED: 'p-mute',
  REPAIRING: 'p-run',
  SCRAPPED: 'p-lock',
}

/** 8D / 缺陷阶段审批状态 */
export const ncmStagePill: Record<string, StatusPillVariant> = {
  WAIT: 'p-wait',
  RUNNING: 'p-run',
  PENDING_APPROVE: 'p-sign',
  REJECTED: 'p-lock',
  APPROVED: 'p-done',
  MUTE: 'p-mute',
}

/** 通用状态映射：先从指定模块表取，未命中回退 p-mute */
export function statusPill(
  map: Record<string, StatusPillVariant>,
  code: string | undefined | null,
): StatusPillVariant {
  if (!code) return 'p-mute'
  return map[code] ?? 'p-mute'
}

/** 校验变体合法性（开发期防御） */
export function isStatusPillVariant(v: string): v is StatusPillVariant {
  return (STATUS_PILL_VARIANTS as string[]).includes(v)
}
