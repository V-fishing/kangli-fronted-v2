import { request } from '@/api/client'
import type { KpiCompareVo } from '@/api/types/kpi'

export const kpiApi = {
  /** GET /v1/kpi/compare — 按 A/B 组织分别聚合核心质量指标,并列对比 */
  compare: () => request.get<KpiCompareVo>('/v1/kpi/compare'),
}
