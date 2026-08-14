import { request } from '@/api/client'
import type {
  FiaTask,
  FiaTaskVo,
  InspItemResultRequest,
  SignRequest,
  FiaInspStd,
  BatchByLotRequest,
  BatchByLotResult,
  IncomingDashboard,
} from '@/api/types/fia'

/** 供应商来料首件检验 (source=SUPPLIER)，前缀 /v1/fia/incoming-checks */
export const fiaIncomingApi = {
  /** GET /v1/fia/incoming-checks/dashboard */
  dashboard: () => request.get<IncomingDashboard>('/v1/fia/incoming-checks/dashboard'),

  /** GET /v1/fia/incoming-checks */
  list: () => request.get<FiaTask[]>('/v1/fia/incoming-checks'),

  /** GET /v1/fia/incoming-checks/{id} */
  get: (id: string) => request.get<FiaTaskVo>(`/v1/fia/incoming-checks/${id}`),

  /** GET /v1/fia/incoming-checks/match-std */
  matchStd: (params: { partNo: string; supplierId?: string; procName?: string }) =>
    request.get<FiaInspStd>('/v1/fia/incoming-checks/match-std', { params }),

  /** POST /v1/fia/incoming-checks/batch-by-lot */
  batchCreateByLot: (body: BatchByLotRequest) =>
    request.post<BatchByLotResult>('/v1/fia/incoming-checks/batch-by-lot', body),

  /** POST /v1/fia/incoming-checks/{id}/items */
  enterResults: (id: string, body: InspItemResultRequest) =>
    request.post<void>(`/v1/fia/incoming-checks/${id}/items`, body),

  /** POST /v1/fia/incoming-checks/{id}/sign-inspector */
  signInspector: (id: string, body: SignRequest) =>
    request.post<void>(`/v1/fia/incoming-checks/${id}/sign-inspector`, body),

  /** POST /v1/fia/incoming-checks/{id}/sign-reviewer */
  signReviewer: (id: string, body: SignRequest) =>
    request.post<void>(`/v1/fia/incoming-checks/${id}/sign-reviewer`, body),

  /** POST /v1/fia/incoming-checks/{id}/sign-approver */
  signApprover: (id: string, body: SignRequest) =>
    request.post<void>(`/v1/fia/incoming-checks/${id}/sign-approver`, body),

  /** POST /v1/fia/incoming-checks/{id}/disposition — 合格入库/退货/让步接收/挑选 */
  setDisposition: (id: string, params: { disposition: string; remark?: string }) =>
    request.post<void>(`/v1/fia/incoming-checks/${id}/disposition`, undefined, { params }),
}
