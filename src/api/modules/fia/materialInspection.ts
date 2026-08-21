import { request } from '@/api/client'
import type {
  MaterialInspectionVO,
  MaterialInspectionCreateRequest,
  MaterialInspectionUpdateRequest,
  MaterialInspectionPageQuery,
} from '@/api/types/fia'
import type { PageResult } from '@/api/types/common'

export const materialInspectionApi = {
  /** GET /v1/fia/material-inspections/material-codes 物料编码下拉(MES 已存在 DISTINCT) */
  materialCodes: (keyword?: string) =>
    request.get<string[]>('/v1/fia/material-inspections/material-codes', { params: { keyword } }),

  /** GET /v1/fia/material-inspections/page 分页列表 */
  page: (params: MaterialInspectionPageQuery) =>
    request.get<PageResult<MaterialInspectionVO>>('/v1/fia/material-inspections/page', { params }),

  /** GET /v1/fia/material-inspections/{id} 详情(按 record_no) */
  get: (id: string) =>
    request.get<MaterialInspectionVO>(`/v1/fia/material-inspections/${id}`),

  /** POST /v1/fia/material-inspections 建单(插入 MES 新行) */
  create: (body: MaterialInspectionCreateRequest) =>
    request.post<string>('/v1/fia/material-inspections', body),

  /** PUT /v1/fia/material-inspections/{id}/inspection 保存检验汇总 */
  updateInspection: (id: string, body: MaterialInspectionUpdateRequest) =>
    request.put<void>(`/v1/fia/material-inspections/${id}/inspection`, body),

  /** PUT /v1/fia/material-inspections/{id}/signoff 保存数量信息与审核签核 */
  updateSignoff: (id: string, body: MaterialInspectionUpdateRequest) =>
    request.put<void>(`/v1/fia/material-inspections/${id}/signoff`, body),

  /** DELETE /v1/fia/material-inspections/{id} 软删除 */
  remove: (id: string) =>
    request.delete<void>(`/v1/fia/material-inspections/${id}`),
}
