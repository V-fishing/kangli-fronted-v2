import { request } from '@/api/client'
import type { SpcSampleTask, CreateSampleTaskRequest } from '@/api/types/spc'

export const spcSampleTaskApi = {
  list: (params?: { woNo?: string; partNo?: string; status?: string }) =>
    request.get<SpcSampleTask[]>('/v1/spc/sample-tasks', { params }),
  get: (id: string) => request.get<SpcSampleTask>(`/v1/spc/sample-tasks/${id}`),
  create: (body: CreateSampleTaskRequest) =>
    request.post<SpcSampleTask[]>('/v1/spc/sample-tasks', body),
}
