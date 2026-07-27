import { request } from '@/api/client'
import type { SpcRule } from '@/api/types/spc'

export const spcRuleApi = {
  list: () => request.get<SpcRule[]>('/v1/spc/rules'),
  toggle: (id: string, enabled: boolean) => request.put<void>(`/v1/spc/rules/${id}`, undefined, { params: { enabled } }),
  triggers: () => request.get<{ ruleCode: string; count: number }[]>('/v1/spc/rules/triggers'),
}
