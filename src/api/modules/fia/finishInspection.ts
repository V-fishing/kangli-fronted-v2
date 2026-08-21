import { request } from '@/api/client'
import type {
  FinishInspectionVO,
  FinishInspectionCreateRequest,
  FinishInspectionUpdateRequest,
  EligibleFirstArticleVO,
  FinishInspectionPageQuery,
} from '@/api/types/fia'
import type { PageResult } from '@/api/types/common'

export const finishInspectionApi = {
  /** GET /v1/fia/finish-inspections/mes-production-orders 生产订单号下拉(MES 已存在 DISTINCT) */
  mesProductionOrders: (keyword?: string) =>
    request.get<string[]>('/v1/fia/finish-inspections/mes-production-orders', { params: { keyword } }),

  /** GET /v1/fia/finish-inspections/page 分页列表 */
  page: (params: FinishInspectionPageQuery) =>
    request.get<PageResult<FinishInspectionVO>>('/v1/fia/finish-inspections/page', { params }),

  /** GET /v1/fia/finish-inspections/{id} 详情(按行 ctid) */
  get: (id: string) =>
    request.get<FinishInspectionVO>(`/v1/fia/finish-inspections/${id}`),

  /** POST /v1/fia/finish-inspections 建单(插入 MES 新行) */
  create: (body: FinishInspectionCreateRequest) =>
    request.post<string>('/v1/fia/finish-inspections', body),

  /** PUT /v1/fia/finish-inspections/{id}/inspection 保存检验汇总 */
  updateInspection: (id: string, body: FinishInspectionUpdateRequest) =>
    request.put<void>(`/v1/fia/finish-inspections/${id}/inspection`, body),

  /** PUT /v1/fia/finish-inspections/{id}/signoff 保存数量信息与审核签核 */
  updateSignoff: (id: string, body: FinishInspectionUpdateRequest) =>
    request.put<void>(`/v1/fia/finish-inspections/${id}/signoff`, body),

  /** DELETE /v1/fia/finish-inspections/{id} 软删除 */
  remove: (id: string) =>
    request.delete<void>(`/v1/fia/finish-inspections/${id}`),

  /** GET /v1/fia/finish-inspections/{id}/first-articles 首件软绑定查询 */
  firstArticles: (id: string) =>
    request.get<EligibleFirstArticleVO[]>(`/v1/fia/finish-inspections/${id}/first-articles`),
}
