import { request } from '@/api/client'
import type {
  FiaTask,
  FiaTaskVo,
  CreateFiaTaskRequest,
  InspItemResultRequest,
  SignRequest,
  FiaDashboard,
  FiaInspStd,
  BatchByLotRequest,
  BatchByLotResult,
  TaskLogItem,
} from '@/api/types/fia'

export const fiaTaskApi = {
  /** GET /v1/fia/tasks/dashboard */
  dashboard: () => request.get<FiaDashboard>('/v1/fia/tasks/dashboard'),

  /** GET /v1/fia/tasks */
  list: (params?: { status?: string; woNo?: string; page?: number; size?: number }) =>
    request.get<FiaTask[]>('/v1/fia/tasks', { params }),

  /** GET /v1/fia/tasks/{id} */
  get: (id: string) => request.get<FiaTaskVo>(`/v1/fia/tasks/${id}`),

  /** POST /v1/fia/tasks */
  create: (body: CreateFiaTaskRequest) => request.post<FiaTask>('/v1/fia/tasks', body),

  /** GET /v1/fia/tasks/match-std */
  matchStd: (params: { orgId: string; partNo?: string; supplierId?: string; procName?: string }) =>
    request.get<FiaInspStd>('/v1/fia/tasks/match-std', { params }),

  /** POST /v1/fia/tasks/{id}/items */
  enterResults: (id: string, body: InspItemResultRequest) => request.post<void>(`/v1/fia/tasks/${id}/items`, body),

  /** POST /v1/fia/tasks/{id}/sign-inspector */
  signInspector: (id: string, body: SignRequest) => request.post<void>(`/v1/fia/tasks/${id}/sign-inspector`, body),

  /** POST /v1/fia/tasks/{id}/sign-reviewer */
  signReviewer: (id: string, body: SignRequest) => request.post<void>(`/v1/fia/tasks/${id}/sign-reviewer`, body),

  /** POST /v1/fia/tasks/{id}/sign-approver */
  signApprover: (id: string, body: SignRequest) => request.post<void>(`/v1/fia/tasks/${id}/sign-approver`, body),

  /** POST /v1/fia/tasks/{id}/disposition */
  setDisposition: (id: string, params: { disposition: string; remark?: string }) =>
    request.post<void>(`/v1/fia/tasks/${id}/disposition`, undefined, { params }),

  /** GET /v1/fia/tasks/{id}/archive */
  getArchive: (id: string) => request.get<Record<string, unknown>>(`/v1/fia/tasks/${id}/archive`),

  /** GET /v1/fia/tasks/archives */
  listArchives: () => request.get<Record<string, unknown>[]>('/v1/fia/tasks/archives'),

  /** GET /v1/fia/tasks/{id}/log */
  getLog: (id: string) => request.get<TaskLogItem[]>(`/v1/fia/tasks/${id}/log`),

  /** POST /v1/fia/tasks/batch-by-lot */
  batchCreateByLot: (body: BatchByLotRequest) => request.post<BatchByLotResult>('/v1/fia/tasks/batch-by-lot', body),
}
