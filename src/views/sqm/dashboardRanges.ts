/**
 * 供应商质量看板 - 每卡独立时间段（纯函数，供 SqmDashboard.vue 与单测共用）
 *
 * 每个卡片(等级占比/检验结论/双率散点/合格率分布/合格率趋势)拥有独立的时间段,
 * 默认取最近 12 个月区间(MONTHS[11] ~ MONTHS[0])。各卡片时间段互不影响,
 * 由各自 YmRange 的 @change 单独触发对应 loader。
 */
export const DASHBOARD_CARD_KEYS = ['pie', 'inspect', 'scatter', 'bar', 'trend'] as const

export type DashboardCardKey = (typeof DASHBOARD_CARD_KEYS)[number]

export interface YmRangeState {
  startYm: string
  endYm: string
}

/** 默认区间:最近 12 个月(months 为近 18 个月倒序列表,index 0 为当前月) */
export function buildDefaultRange(months: string[]): YmRangeState {
  return { startYm: months[11], endYm: months[0] }
}

/** 为每个卡片构建独立的时间段对象(互不共享引用,修改互不影响) */
export function buildDashboardRanges(months: string[]): Record<DashboardCardKey, YmRangeState> {
  const ranges = {} as Record<DashboardCardKey, YmRangeState>
  for (const k of DASHBOARD_CARD_KEYS) ranges[k] = buildDefaultRange(months)
  return ranges
}