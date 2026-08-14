// 全系统审计日志查询 API
import { request } from '@/api/client'
import type { PageResult } from '@/api/types/common'

const BASE = '/v1/ncm/audit'

export interface AuditLogVO {
  id: number
  module: string
  action: string
  operatorId: string
  operatorName: string
  recordId: string
  detail: string
  status: string
  costMs: number | null
  createdAt: string
}

export interface AuditLogQuery {
  module?: string
  action?: string
  operator?: string
  recordId?: string
  status?: string
  start?: string
  end?: string
  page?: number
  size?: number
}

export const auditLogApi = {
  /** 全系统审计日志分页查询 */
  page(q: AuditLogQuery) {
    return request.get<PageResult<AuditLogVO>>(`${BASE}/logs`, { params: q })
  },
  /** 已记录模块枚举(下拉) */
  modules() {
    return request.get<string[]>(`${BASE}/modules`)
  },
}
