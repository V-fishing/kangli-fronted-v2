import { request } from '@/api/client'
import type { SpcRule } from '@/api/types/spc'

/** 规则触发统计项(列表展示用) */
export interface SpcRuleTriggerVo {
  name?: string
  cnt?: number
  ruleCode?: string
  count?: number
}

export const spcRuleApi = {
  list: () => request.get<SpcRule[]>('/v1/spc/rules'),
  toggle: (id: string, enabled: boolean) => request.put<void>(`/v1/spc/rules/${id}`, undefined, { params: { enabled } }),
  triggers: () => request.get<SpcRuleTriggerVo[]>('/v1/spc/rules/triggers'),
}
