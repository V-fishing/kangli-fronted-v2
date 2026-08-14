import { request } from '@/api/client'

export interface SqmDashboardVo {
  todayLots: number
  passRate: number
  pendingAbnormals: number
  top5BadSuppliers: { supplierId: string; supplierName: string; failCount: number }[]
  trend7d: { date: string; total: number; pass: number; passRate: number }[]
}

export const sqmDashboardApi = {
  /** GET /v1/sqm/dashboard/incoming */
  incoming: () => request.get<SqmDashboardVo>('/v1/sqm/dashboard/incoming'),
}
