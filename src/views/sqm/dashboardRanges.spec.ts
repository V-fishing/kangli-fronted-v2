import { describe, it, expect } from 'vitest'
import {
  DASHBOARD_CARD_KEYS,
  buildDefaultRange,
  buildDashboardRanges,
} from './dashboardRanges'

// 模拟近 18 个月倒序列表(与 SqmDashboard.vue 的 MONTHS 生成逻辑一致)
const MONTHS = (() => {
  const arr: string[] = []
  const d = new Date(2026, 7, 1) // 2026-08
  for (let i = 0; i < 18; i++) {
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return arr
})()

describe('dashboardRanges.ts — 每卡独立时间段', () => {
  it('默认区间为最近 12 个月(MONTHS[11] ~ MONTHS[0])', () => {
    expect(buildDefaultRange(MONTHS)).toEqual({ startYm: MONTHS[11], endYm: MONTHS[0] })
  })

  it('五个卡片均获得独立时间段对象', () => {
    const ranges = buildDashboardRanges(MONTHS)
    expect(Object.keys(ranges)).toEqual([...DASHBOARD_CARD_KEYS])
    for (const k of DASHBOARD_CARD_KEYS) {
      expect(ranges[k]).toEqual({ startYm: MONTHS[11], endYm: MONTHS[0] })
    }
  })

  it('各卡片时间段互不共享引用(修改互不影响)', () => {
    const ranges = buildDashboardRanges(MONTHS)
    ranges.pie.startYm = '2025-01'
    ranges.trend.endYm = '2026-05'
    expect(ranges.inspect.startYm).toBe(MONTHS[11])
    expect(ranges.bar.endYm).toBe(MONTHS[0])
    expect(ranges.pie.startYm).toBe('2025-01')
    expect(ranges.trend.endYm).toBe('2026-05')
  })
})