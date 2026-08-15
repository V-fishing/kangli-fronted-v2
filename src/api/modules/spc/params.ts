import { request } from '@/api/client'
import type { SpcParam } from '@/api/types/spc'
import type { PageResult } from '@/api/types/common'

export const spcParamApi = {
  // productName / procName / paramSource 可选:三者可独立或组合过滤
  list: (params?: { productName?: string; procName?: string; paramSource?: string }) => {
    const q: Record<string, string> = {}
    if (params?.productName) q.productName = params.productName
    if (params?.procName) q.procName = params.procName
    if (params?.paramSource) q.paramSource = params.paramSource
    return request.get<SpcParam[]>('/v1/spc/params', { params: q })
  },
  listPage: (params?: { productName?: string; procName?: string; paramSource?: string; keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<SpcParam>>('/v1/spc/params/page', { params }),
  get: (id: string) => request.get<SpcParam>(`/v1/spc/params/${id}`),
  // 按 FIA 检验标准列出可联动的 SPC 参数(创建首件任务时勾选用)
  listByStd: (stdId: string) => request.get<SpcParam[]>('/v1/spc/params/by-std', { params: { stdId } }),
  // 由 FIA 检验任务一键生成 SPC 参数,返回该任务对应的参数列表(已按来源检验项去重)
  fromFiaTask: (taskId: string) =>
    request.post<SpcParam[]>('/v1/spc/params/from-fia-task', null, { params: { taskId } }),
  create: (body: Partial<SpcParam>) => request.post<SpcParam>('/v1/spc/params', body),
  update: (id: string, body: Partial<SpcParam>) => request.put<void>(`/v1/spc/params/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/spc/params/${id}`),
}
