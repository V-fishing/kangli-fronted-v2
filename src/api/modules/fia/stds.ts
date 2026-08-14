import { request } from '@/api/client'
import type { FiaInspStd, CreateInspStdRequest, InspStdVo, CtqItemVo } from '@/api/types/fia'
import type { PageResult } from '@/api/types/common'

export const fiaStdApi = {
  /** GET /v1/fia/stds?keyword=&limit= */
  list: (params?: { keyword?: string; limit?: number }) =>
    request.get<FiaInspStd[]>('/v1/fia/stds', { params }),

  /** GET /v1/fia/stds/page 分页列表 */
  listPage: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<FiaInspStd>>('/v1/fia/stds/page', { params }),

  /** GET /v1/fia/stds/{id} */
  get: (id: string) => request.get<InspStdVo>(`/v1/fia/stds/${id}`),

  /** POST /v1/fia/stds */
  create: (body: CreateInspStdRequest) => request.post<FiaInspStd>('/v1/fia/stds', body),

  /** PUT /v1/fia/stds/{id} */
  update: (id: string, body: CreateInspStdRequest) => request.put<void>(`/v1/fia/stds/${id}`, body),

  /** PUT /v1/fia/stds/{id}/status — 启用(生效)/停用状态切换，不删除数据 */
  changeStatus: (id: string, status: '生效' | '停用') => request.put<void>(`/v1/fia/stds/${id}/status`, null, { params: { status } }),

  /** DELETE /v1/fia/stds/{id} — 仅草稿且未被 SPC 引用的标准可删除 */
  delete: (id: string) => request.delete<void>(`/v1/fia/stds/${id}`),

  /** GET /v1/fia/stds/ctq-items — 生效标准下的 CTQ 检验项(供 SPC 参数关联选择) */
  getCtqItems: () => request.get<CtqItemVo[]>('/v1/fia/stds/ctq-items'),
}
