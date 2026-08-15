import { request } from '@/api/client'
import type { TlmTooling, TlmCalibPlan } from '@/api/types/tlm'
import type { PageResult } from '@/api/types/common'

// 计量管理(Metrology) 前端接口。计量器具即 TLM 中的 tool_category='GAUGE' 监视测量设备。
// 列表复用 tlmToolingApi.page(category=GAUGE)；看板与校准录入为计量专属接口(P2 落地)。
export const metroApi = {
  // 计量器具台账(GAUGE)
  gaugeList: (params: { keyword?: string; calibStatus?: string; page?: number; size?: number }) =>
    request.get<PageResult<TlmTooling>>('/v1/tlm/tooling/page', { params: { ...params, category: 'GAUGE' } }),
  // 校准计划单分页
  planPage: (params: { keyword?: string; status?: string; page?: number; size?: number }) =>
    request.get<PageResult<TlmCalibPlan>>('/v1/tlm/calib-plans/page', { params }),
  // 校准状态看板(合格/限用/超期统计), 后端基于全量 GAUGE 计算
  dashboard: () => request.get<MetroDashboard>('/v1/tlm/tooling/metro/dashboard'),
  // 校准结果录入(上限记录、合格判定,回写校准日期/到期)
  recordCalib: (planId: string, body: { calibDate: string; calibDueDate?: string; calibCycle?: number; upperLimit?: string; result: string; remark?: string }) =>
    request.post<void>(`/v1/tlm/calib-plans/${planId}/record`, body),
  // 手动新建校准计划单
  createManual: (toolId: string, planCycle: number | undefined, planDueDate: string) =>
    request.post<TlmCalibPlan>('/v1/tlm/calib-plans/manual', null, { params: { toolId, planCycle, planDueDate } }),
  // 工装-工单绑定记录(含 GAUGE 校准快照)
  bindRecords: (toolId: string) => request.get<any[]>('/v1/tlm/tooling/' + toolId + '/binds'),
}

export interface MetroDashboard {
  total: number
  qualified: number // 合格(未到期)
  limited: number   // 限用(临期预警, 到期前 30 天)
  overdue: number   // 超期
}
