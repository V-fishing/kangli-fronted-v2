import { request } from '@/api/client'
import type { NcmDefectDict } from '@/api/types/ncm'

export const ncmDefectDictApi = {
  list: () => request.get<NcmDefectDict[]>('/v1/ncm/defect-dicts'),
  get: (id: string) => request.get<NcmDefectDict>(`/v1/ncm/defect-dicts/${id}`),
  create: (body: Partial<NcmDefectDict>) => request.post<NcmDefectDict>('/v1/ncm/defect-dicts', body),
  update: (id: string, body: Partial<NcmDefectDict>) => request.put<void>(`/v1/ncm/defect-dicts/${id}`, body),
  delete: (id: string) => request.delete<void>(`/v1/ncm/defect-dicts/${id}`),
}
