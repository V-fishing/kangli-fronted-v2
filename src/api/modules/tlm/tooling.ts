import { request } from '@/api/client'
import type { TlmTooling, TlmToolVersion, TlmToolProduct, TlmProductCandidate, TlmProductDetail } from '@/api/types/tlm'
import type { PageResult } from '@/api/types/common'

export const tlmToolingApi = {
  page: (params: { keyword?: string; category?: string; status?: string; ownerId?: string; page?: number; size?: number }) =>
    request.get<PageResult<TlmTooling>>('/v1/tlm/tooling/page', { params }),
  get: (id: string) => request.get<TlmTooling>(`/v1/tlm/tooling/${id}`),
  create: (body: Partial<TlmTooling>) => request.post<TlmTooling>('/v1/tlm/tooling', body),
  update: (body: Partial<TlmTooling>) => request.put<void>('/v1/tlm/tooling', body),
  delete: (id: string) => request.delete<void>(`/v1/tlm/tooling/${id}`),
  repair: (id: string, params: { faultDesc?: string; approverId?: string }) =>
    request.post<void>(`/v1/tlm/tooling/${id}/repair`, null, { params }),
  repairComplete: (id: string) => request.post<void>(`/v1/tlm/tooling/${id}/repair-complete`),
  scrap: (id: string, params: { scrapMethod?: string; reason?: string; approverId?: string }) =>
    request.post<void>(`/v1/tlm/tooling/${id}/scrap`, null, { params }),
  lock: (id: string, locked: boolean) => request.post<void>(`/v1/tlm/tooling/${id}/lock`, null, { params: { locked } }),
  bind: (id: string, woNo: string) => request.post<void>(`/v1/tlm/tooling/${id}/bind`, null, { params: { woNo } }),
  abnormal: (type: 'locked' | 'life' | 'calib') => request.get<TlmTooling[]>(`/v1/tlm/tooling/abnormal/${type}`),
  approveScrap: (scrapId: string) => request.post<void>(`/v1/tlm/scrap/${scrapId}/approve`),
  rejectScrap: (scrapId: string) => request.post<void>(`/v1/tlm/scrap/${scrapId}/reject`),
  versions: (id: string) => request.get<TlmToolVersion[]>(`/v1/tlm/tooling/${id}/versions`),
  addVersion: (id: string, body: Partial<TlmToolVersion>) => request.post<TlmToolVersion>(`/v1/tlm/tooling/${id}/version`, body),
  products: (id: string) => request.get<TlmToolProduct[]>(`/v1/tlm/tooling/${id}/products`),
  productCandidates: (keyword?: string, kind?: string) =>
    request.get<TlmProductCandidate[]>('/v1/tlm/products/candidates', { params: { keyword, kind } }),
  productDetail: (code: string) => request.get<TlmProductDetail[]>(`/v1/tlm/products/${code}/detail`),
  relateProduct: (id: string, body: Partial<TlmToolProduct>) => request.post<TlmToolProduct>(`/v1/tlm/tooling/${id}/product`, body),
  unrelateProduct: (id: string, pid: string) => request.delete<void>(`/v1/tlm/tooling/${id}/product/${pid}`),
}
