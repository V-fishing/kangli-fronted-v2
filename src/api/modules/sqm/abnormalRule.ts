/**
 * SQM — 来料异常严重度判定规则 API
 * Controller: SqmAbnormalRuleController  (/api/v1/sqm/abnormal-rule)
 */
import { request } from '@/api/client'
import type { SqmAbnormalRule } from '@/api/types/sqm'

export const sqmAbnormalRuleApi = {
  /** 规则列表(admin 看全部, 非 admin 按 org 过滤) */
  list: () =>
    request.get<SqmAbnormalRule[]>('/v1/sqm/abnormal-rule'),

  /** 保存(新建/更新) */
  save: (data: Partial<SqmAbnormalRule>) =>
    request.post<SqmAbnormalRule>('/v1/sqm/abnormal-rule', data),

  /** 删除 */
  remove: (id: string) =>
    request.delete<void>(`/v1/sqm/abnormal-rule/${id}`),
}
