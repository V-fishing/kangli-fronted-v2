import { request } from '@/api/client'
import type { Qms8dFishbone } from '@/api/types/ncm'

/** 8D 鱼骨图(5M1E) CRUD,后端地址 /api/v1/ncm/fishbones */
export const fishboneApi = {
  list: (d8Id: string) => request.get<Qms8dFishbone[]>('/v1/ncm/fishbones', { params: { d8Id } }),
  create: (body: Partial<Qms8dFishbone>) => request.post<Qms8dFishbone>('/v1/ncm/fishbones', body),
  update: (id: string, body: Partial<Qms8dFishbone>) =>
    request.put<void>(`/v1/ncm/fishbones/${id}`, body),
  remove: (id: string) => request.delete<void>(`/v1/ncm/fishbones/${id}`),
}
