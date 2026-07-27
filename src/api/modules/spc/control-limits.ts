import { request } from '@/api/client'
import type { SpcControlLimit } from '@/api/types/spc'

export const spcControlLimitApi = {
  list: (paramId: string) =>
    request.get<SpcControlLimit[]>('/v1/spc/control-limits', { params: { paramId } }),
  calc: (paramId: string) =>
    request.post<SpcControlLimit>('/v1/spc/control-limits/calc', undefined, { params: { paramId } }),
  /** 人工覆盖控制限:优先级高于自动计算。 */
  saveManual: (paramId: string, limits: Partial<SpcControlLimit>) =>
    request.post<SpcControlLimit>('/v1/spc/control-limits/manual', limits, { params: { paramId } }),
}
