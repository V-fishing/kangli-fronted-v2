import { request } from '@/api/client'
import type { PageResult } from '@/api/types/common'

/** 完工 + 物料 合并行(列表「全部」档) */
export interface MergedInspectionVO {
  srcType?: 'finish' | 'material' | string
  id?: string
  reportNo?: string
  recordNo?: string
  productionOrderNo?: string
  materialCode?: string
  productName?: string
  materialName?: string
  supplierName?: string
  materialBatchNo?: string
  category?: string
  inspectionResult?: string
  signatureUser?: string
  qcReviewer?: string
  reviewer?: string
  inspectedQty?: string | number | null
  createdAt?: string
}

export const mergedInspectionApi = {
  /** GET /v1/fia/inspections/merged-page 合并分页(全部档) */
  page: (params: { materialCode?: string; keyword?: string; page?: number; size?: number }) =>
    request.get<PageResult<MergedInspectionVO>>('/v1/fia/inspections/merged-page', { params }),
}
