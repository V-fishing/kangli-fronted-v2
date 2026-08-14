import { request } from '@/api/client'
import type { SpcAlarm } from '@/api/types/spc'
import type { Qms8dReport } from '@/api/types/ncm'
import type { PageResult } from '@/api/types/common'

export const spcAlarmApi = {
  list: (params?: { status?: string; page?: number; size?: number }) =>
    request.get<SpcAlarm[]>('/v1/spc/alarms', { params }),
  listPage: (params?: { keyword?: string; status?: string; level?: string; page?: number; size?: number }) =>
    request.get<PageResult<SpcAlarm>>('/v1/spc/alarms/page', { params }),
  close: (id: string, body: { closeReason: string; disposition: string }) =>
    request.post<void>(`/v1/spc/alarms/${id}/close`, body),
  launch8d: (id: string) => request.post<Record<string, unknown>>(`/v1/spc/alarms/${id}/launch-8d`),
  linked8d: (id: string) => request.get<Qms8dReport | null>(`/v1/spc/alarms/${id}/8d`),
}
