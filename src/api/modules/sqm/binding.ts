import { request } from '@/api/client'
import type { MaterialBindingCreate, MaterialBindingRow } from '@/api/types/sqm'

/** MES 绑定父子级(完工检验「更多▾」快捷绑定, 直写 critical_material_binding) */
export const sqmBindingApi = {
  /** 新增绑定 */
  create: (body: MaterialBindingCreate) =>
    request.post<MaterialBindingRow>('/v1/sqm/bindings', body),
  /** 绑定候选搜索: role=child 搜子件(半成品/来料); role=parent 搜父级(成品/半成品) */
  candidates: (params: { role: 'child' | 'parent'; keyword?: string; limit?: number }) =>
    request.get<MaterialBindingRow[]>('/v1/sqm/bindings/candidates', { params }),
}
