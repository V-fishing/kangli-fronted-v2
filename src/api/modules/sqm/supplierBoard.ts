import { request } from '@/api/client'

// ==================== 供应商看板 五聚合接口 ====================

export interface PassRateDistSupplier {
  supplierId: string
  supplierName: string
  level: string
  passRate: number
  abnormalCount: number
}
export interface PassRateDistItem {
  bucket: string
  label: string
  count: number
  suppliers: PassRateDistSupplier[]
}
export interface PassRateTrendPoint {
  period: string
  supplierId: string
  supplierName: string
  passRate: number
}
export interface AbnormalHeatItem {
  supplierId: string
  supplierName: string
  months: Record<string, number>
}
export interface LevelRatioItem {
  level: string
  count: number
}
export interface InspectResultItem {
  result: string
  count: number
}
export interface DeliveryVsPassItem {
  supplierId: string
  supplierName: string
  level: string
  deliveryRate: number
  incomingPassRate: number
  lotCount: number
}

export interface BoardFilters {
  level?: string
  keyword?: string
  startYm?: string
  endYm?: string
}

// 数组参数自定义序列化(supplierIds=a&supplierIds=b),避免 axios 默认的 supplierIds[]= 后缀
function arraySerializer(params: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item != null) parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`)
      }
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    }
  }
  return parts.join('&')
}

export const supplierBoardApi = {
  /** GET /v1/sqm/supplier/pass-rate-dist */
  passRateDist: (f: BoardFilters = {}) =>
    request.get<PassRateDistItem[]>('/v1/sqm/supplier/pass-rate-dist', { params: f, paramsSerializer: { serialize: arraySerializer } }),

  /** GET /v1/sqm/supplier/pass-rate-trend */
  passRateTrend: (observeOnly = true, supplierIds: string[] = [], startYm?: string, endYm?: string) =>
    request.get<PassRateTrendPoint[]>('/v1/sqm/supplier/pass-rate-trend', {
      params: { observeOnly, supplierIds, startYm, endYm },
      paramsSerializer: { serialize: arraySerializer },
    }),

  /** GET /v1/sqm/supplier/abnormal-heat */
  abnormalHeat: (year?: string, topN = 15) =>
    request.get<AbnormalHeatItem[]>('/v1/sqm/supplier/abnormal-heat', { params: { year, topN } }),

  /** GET /v1/sqm/supplier/level-ratio */
  levelRatio: (f: BoardFilters = {}) =>
    request.get<LevelRatioItem[]>('/v1/sqm/supplier/level-ratio', { params: f }),

  /** GET /v1/sqm/supplier/inspect-result */
  inspectResult: (f: BoardFilters = {}) =>
    request.get<InspectResultItem[]>('/v1/sqm/supplier/inspect-result', { params: f }),

  /** GET /v1/sqm/supplier/delivery-vs-pass */
  deliveryVsPass: (f: BoardFilters = {}) =>
    request.get<DeliveryVsPassItem[]>('/v1/sqm/supplier/delivery-vs-pass', { params: f }),
}
