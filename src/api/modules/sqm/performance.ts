/**
 * SQM — 供应商绩效 API
 * Controller: SqmSupplierPerformanceController  (/api/v1/sqm/performance)
 */
import { request } from '@/api/client'
import type { SqmSupplierPerformance, SqmAuditFreqResult } from '@/api/types/sqm'
import type { PageResult } from '@/api/types/common'

export const sqmPerformanceApi = {
  /** 列表查询（可按 supplierId 过滤） */
  list: (supplierId?: string) =>
    request.get<SqmSupplierPerformance[]>('/v1/sqm/performance', { params: supplierId ? { supplierId } : undefined }),

  listPage: (params: { supplierId?: string; period?: string; page?: number; size?: number }) =>
    request.get<PageResult<SqmSupplierPerformance>>('/v1/sqm/performance/page', { params }),

  /** 获取单条绩效记录 */
  getById: (id: string) =>
    request.get<SqmSupplierPerformance>(`/v1/sqm/performance/${id}`),

  /** 手工录入绩效 */
  create: (data: Partial<SqmSupplierPerformance>) =>
    request.post<SqmSupplierPerformance>('/v1/sqm/performance', data),

  /** 自动计算绩效（基于来料批次） */
  calc: (supplierId: string, period: string) =>
    request.post<SqmSupplierPerformance>('/v1/sqm/performance/calc', null, { params: { supplierId, period } }),

  /** 审核频次建议（按供应商等级） */
  auditFreq: (supplierLevel: string) =>
    request.get<SqmAuditFreqResult>('/v1/sqm/performance/audit-freq', { params: { supplierLevel } }),
}