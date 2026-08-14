/**
 * SQM — 供应商绩效分析 / 指标配置 API
 * Controller: PerfAnalysisController (/api/v1/sqm/perf-analysis)
 *             SqmPerfMetricCfgController (/api/v1/sqm/perf-metric-cfg)
 */
import { request } from '@/api/client'
import type { SqmPerfMetricCfg, PerfRankRow, PerfParetoRow } from '@/api/types/sqm'
import type { SqmSupplierPerformance } from '@/api/types/sqm'
import type { PageResult } from '@/api/types/common'

export const sqmPerfAnalysisApi = {
  /** 排名榜(按周期对供应商综合分排名,分页) */
  rank: (period: string, category?: string, page = 1, size = 20) =>
    request.get<PageResult<PerfRankRow>>('/v1/sqm/perf-analysis/rank', { params: { period, category, page, size } }),

  /** 趋势(多供应商近 N 周期绩效序列) */
  trend: (supplierIds: string[], periodStart: string, periodEnd: string) =>
    request.get<SqmSupplierPerformance[]>('/v1/sqm/perf-analysis/trend', {
      params: { supplierIds, periodStart, periodEnd },
    }),

  /** 柏拉图(按缺陷类型累计占比 TOP N) */
  pareto: (periodStart: string, periodEnd: string, topN = 10) =>
    request.get<PerfParetoRow[]>('/v1/sqm/perf-analysis/pareto', {
      params: { periodStart, periodEnd, topN },
    }),
}

export const sqmPerfMetricCfgApi = {
  /** 指标配置列表 */
  list: () => request.get<SqmPerfMetricCfg[]>('/v1/sqm/perf-metric-cfg'),

  /** 保存(新增/更新)指标配置 */
  save: (data: SqmPerfMetricCfg) => request.post<SqmPerfMetricCfg>('/v1/sqm/perf-metric-cfg', data),
}
