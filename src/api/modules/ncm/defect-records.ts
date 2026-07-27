import { request } from '@/api/client'
import type { NcmDefectRecord, NcmAggregateItem } from '@/api/types/ncm'

export const ncmDefectRecordApi = {
  list: (params?: { page?: number; size?: number }) => request.get<NcmDefectRecord[]>('/v1/ncm/defect-records', { params }),
  get: (id: string) => request.get<NcmDefectRecord>(`/v1/ncm/defect-records/${id}`),
  create: (body: Partial<NcmDefectRecord>) => request.post<NcmDefectRecord>('/v1/ncm/defect-records', body),
  dashboard: () => request.get<Record<string, unknown>>('/v1/ncm/dashboard'),
  multiDimAnalysis: (params: { dim: string; startTime?: string; endTime?: string }) =>
    request.get<NcmAggregateItem[]>('/v1/ncm/analysis/multi-dim', { params }),
  trendAnalysis: (params: { granularity: string; startTime?: string; endTime?: string }) =>
    request.get<Record<string, number>[]>('/v1/ncm/analysis/trend', { params }),
  launch8d: (id: string) => request.post<Record<string, unknown>>(`/v1/ncm/defect-records/${id}/launch-8d`),
  launchCapa: (id: string) => request.post<Record<string, unknown>>(`/v1/ncm/defect-records/${id}/launch-capa`),
}
