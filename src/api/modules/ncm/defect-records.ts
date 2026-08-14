import { request } from '@/api/client'
import type { NcmDefectRecord, NcmAggregateItem } from '@/api/types/ncm'

export interface DefectRecordPageResult {
  records: NcmDefectRecord[]
  total: number
  page: number
  size: number
}

/** 指派处理人 + 通知方式 请求体(发起8D/CAPA/CA时携带) */
export interface DefectLaunchRequest {
  /** 指定负责人(8D 发起时单选必填,团队由负责人在 D1 自行组建) */
  ownerUserId?: string
  /** 被指派用户ID列表 */
  assigneeUserIds?: string[]
  /** 被指派角色码列表 */
  assignRoleCodes?: string[]
  /** 通知方式(渠道名列表,如 站内弹窗;为空默认站内弹窗) */
  notifyChannels?: string[]
  /** 指派备注 */
  remark?: string
}

export interface AssignCandidate {
  id: string
  username?: string
  realName?: string
  roleCode?: string
  roleName?: string
}

export interface NotifyChannelCandidate {
  code: string
  name: string
  /** 是否可勾选:direct 渠道未配置凭据时为 false */
  enabled: boolean
  /** 是否默认勾选(站内弹窗与已配置事件渠道默认 true) */
  checked?: boolean
}

export interface AssignCandidatesResult {
  users: AssignCandidate[]
  roles: AssignCandidate[]
  channels: NotifyChannelCandidate[]
}

export const ncmDefectRecordApi = {
  list: (params?: { page?: number; size?: number }) => request.get<NcmDefectRecord[]>('/v1/ncm/defect-records', { params }),
  listPage: (params: { keyword?: string; defectDictCode?: string; woNo?: string; severity?: string; source?: string; page: number; size: number }) =>
    request.get<DefectRecordPageResult>('/v1/ncm/defect-records/page', { params }),
  get: (id: string) => request.get<NcmDefectRecord>(`/v1/ncm/defect-records/${id}`),
  getByDefectNo: (defectNo: string) => request.get<NcmDefectRecord>(`/v1/ncm/defect-records/by-number/${encodeURIComponent(defectNo)}`),
  create: (body: Partial<NcmDefectRecord>) => request.post<NcmDefectRecord>('/v1/ncm/defect-records', body),
  dashboard: () => request.get<Record<string, unknown>>('/v1/ncm/dashboard'),
  multiDimAnalysis: (params: { dim: string; startTime?: string; endTime?: string }) =>
    request.get<NcmAggregateItem[]>('/v1/ncm/analysis/multi-dim', { params }),
  trendAnalysis: (params: { granularity: string; startTime?: string; endTime?: string }) =>
    request.get<Record<string, number>[]>('/v1/ncm/analysis/trend', { params }),
  assignCandidates: () => request.get<AssignCandidatesResult>('/v1/ncm/assign-candidates'),
  launch8d: (id: string, body?: DefectLaunchRequest) => request.post<Record<string, unknown>>(`/v1/ncm/defect-records/${id}/launch-8d`, body),
  launchCapa: (id: string, body?: DefectLaunchRequest) => request.post<Record<string, unknown>>(`/v1/ncm/defect-records/${id}/launch-capa`, body),
  launchCa: (id: string, body?: DefectLaunchRequest) => request.post<Record<string, unknown>>(`/v1/ncm/defect-records/${id}/launch-ca`, body),
}
