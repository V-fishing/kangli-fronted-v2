/**
 * SQM — FMEA 风险管控 API
 * Controller: SqmFmeaController  (/api/v1/sqm/fmea)
 */
import { request } from '@/api/client'
import type { QmsFmeaRisk, QmsFmeaRiskTrack, FmeaPredictResult } from '@/api/types/sqm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import type { PageResult } from '@/api/types/common'

export const sqmFmeaApi = {
  /** FMEA 类型列表(PFMEA/DFMEA/SFMEA) */
  types: () =>
    request.get<string[]>('/v1/sqm/fmea/types'),

  /** 预测 RPN 与风险等级 */
  predict: (severity: number, occurrence: number, detection: number) =>
    request.get<FmeaPredictResult>('/v1/sqm/fmea/predict', { params: { severity, occurrence, detection } }),

  /** 风险项列表(可按状态筛选) */
  list: (status?: string) =>
    request.get<QmsFmeaRisk[]>('/v1/sqm/fmea', { params: status ? { status } : undefined }),

  listPage: (params: { status?: string; keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<QmsFmeaRisk>>('/v1/sqm/fmea/page', { params }),

  /** 新建风险项 */
  create: (data: Partial<QmsFmeaRisk>) =>
    request.post<QmsFmeaRisk>('/v1/sqm/fmea', data),

  /** 更新风险项 */
  update: (id: string, data: Partial<QmsFmeaRisk>) =>
    request.put<QmsFmeaRisk>(`/v1/sqm/fmea/${id}`, data),

  /** 闭环(提交证据; 高风险需 recurrenceVerified) */
  close: (id: string, body: { evidence: string; note?: string; recurrenceVerified?: boolean }) =>
    request.post<QmsFmeaRisk>(`/v1/sqm/fmea/${id}/close`, body),

  /** 闭环轨迹 */
  tracks: (id: string) =>
    request.get<QmsFmeaRiskTrack[]>(`/v1/sqm/fmea/${id}/tracks`),

  /** 重新打开 */
  reopen: (id: string, reason?: string) =>
    request.post<QmsFmeaRisk>(`/v1/sqm/fmea/${id}/reopen`, null, { params: reason ? { reason } : undefined }),

  /** 扫描超期措施, 返回超期条数 */
  scanOverdue: () =>
    request.post<number>('/v1/sqm/fmea/scan-overdue'),

  /** 列表级改派责任人(仅支持单人 ownerUserId,复用 UPDATE 并通知新责任人) */
  reassign: (id: string, body?: DefectLaunchRequest) =>
    request.put<QmsFmeaRisk>(`/v1/sqm/fmea/${id}`, { ownerUserId: body?.ownerUserId } as Partial<QmsFmeaRisk>),
}
