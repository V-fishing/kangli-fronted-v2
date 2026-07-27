import { request } from '@/utils/request'
import type { TrendRealtimeResult, TrendRule, TrendReport } from '@/api/types/ncm'

export const ncmTrendReportApi = {
  realtime: (params: { granularity?: string; productModel?: string; start?: string; end?: string }) =>
    request.get<TrendRealtimeResult>('/v1/ncm/trend-reports/realtime', { params }),
  list: (params: { productModel?: string; granularity?: string; page?: number; size?: number }) =>
    request.get<TrendReport[]>('/v1/ncm/trend-reports', { params }),
  getRule: () => request.get<TrendRule>('/v1/ncm/trend-reports/rule'),
  saveRule: (data: Partial<TrendRule>) => request.put<TrendRule>('/v1/ncm/trend-reports/rule', data),
  generate: (granularity: string) =>
    request.post<void>('/v1/ncm/trend-reports/generate', null, { params: { granularity } }),
}
