import { request } from '@/api/client'
import type { ControlChartVo, SpcHistogramVo, SpcDashboardVo } from '@/api/types/spc'

export const spcChartApi = {
  controlChart: (params: { paramId: string; startTime?: string; endTime?: string; stage?: string; sampleTaskId?: string }) =>
    request.get<ControlChartVo>('/v1/spc/control-chart', { params }),
  histogram: (params: { paramId: string; stage?: string; sampleTaskId?: string }) =>
    request.get<SpcHistogramVo>('/v1/spc/histogram', { params }),
  dashboard: () => request.get<SpcDashboardVo>('/v1/spc/dashboard'),
}
