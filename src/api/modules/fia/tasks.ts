import { request } from '@/api/client'
import type {
  FiaTask,
  FiaTaskVo,
  CreateFiaTaskRequest,
  CreateFromToolingRequest,
  InspItemResultRequest,
  SignRequest,
  FiaDashboard,
  FiaInspStd,
  BatchByLotRequest,
  BatchByLotResult,
  TaskLogItem,
  PreviewJudgeRequest,
  PreviewJudgeResult,
  StdTraceResult,
  ProductSearchResult,
  TaskStdItemVo,
  ProductTreeNode,
  FiaTriggerType,
} from '@/api/types/fia'
import type { PageResult } from '@/api/types/common'

export const fiaTaskApi = {
  /** GET /v1/fia/tasks/dashboard */
  dashboard: () => request.get<FiaDashboard>('/v1/fia/tasks/dashboard'),

  /** GET /v1/fia/tasks */
  list: (params?: { status?: string; woNo?: string; productName?: string; partNo?: string; procName?: string; triggerType?: string; page?: number; size?: number }) =>
    request.get<FiaTask[]>('/v1/fia/tasks', { params }),

  /** GET /v1/fia/tasks/page 分页列表 */
  listPage: (params?: { status?: string; woNo?: string; productName?: string; partNo?: string; procName?: string; triggerType?: string; page?: number; size?: number }) =>
    request.get<PageResult<FiaTask>>('/v1/fia/tasks/page', { params }),

  /** GET /v1/fia/triggers 触发类型列表(供筛选下拉) */
  triggerTypes: () =>
    request.get<FiaTriggerType[]>('/v1/fia/triggers'),

  /** GET /v1/fia/tasks/products 产品→工序 二级树 */
  productTree: () =>
    request.get<ProductTreeNode[]>('/v1/fia/tasks/products'),

  /** GET /v1/fia/tasks/{id} */
  get: (id: string) => request.get<FiaTaskVo>(`/v1/fia/tasks/${id}`),

  /** POST /v1/fia/tasks */
  create: (body: CreateFiaTaskRequest) => request.post<FiaTask>('/v1/fia/tasks', body),

  /** POST /v1/fia/tasks/from-tooling 工装首件(人工创建,按 toolId 自动匹配标准,批次必填) */
  createFromTooling: (body: CreateFromToolingRequest) =>
    request.post<FiaTask>('/v1/fia/tasks/from-tooling', body),

  /** GET /v1/fia/tasks/match-std */
  matchStd: (params: { orgId: string; partNo?: string; supplierId?: string; procName?: string }) =>
    request.get<FiaInspStd>('/v1/fia/tasks/match-std', { params }),

  /** POST /v1/fia/tasks/{id}/items */
  enterResults: (id: string, body: InspItemResultRequest) => request.post<void>(`/v1/fia/tasks/${id}/items`, body),

  /** POST /v1/fia/tasks/{id}/items/preview */
  previewJudge: (id: string, body: PreviewJudgeRequest) =>
    request.post<PreviewJudgeResult[]>(`/v1/fia/tasks/${id}/items/preview`, body),

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

  /** GET /v1/fia/tasks/trace?stdId=&itemId= 标准引用追溯 */
  traceByStd: (params: { stdId: string; itemId?: string }) =>
    request.get<StdTraceResult>('/v1/fia/tasks/trace', { params }),

  /** GET /v1/fia/tasks/search-product?orgId=&keyword=&category= 产品料号模糊搜索 */
  searchProduct: (params: { orgId: string; keyword: string; category?: string }) =>
    request.get<ProductSearchResult[]>('/v1/fia/tasks/search-product', { params }),

  /** GET /v1/fia/tasks/{id}/std-items 获取任务关联的标准项(供SPC采集页) */
  getTaskStdItems: (id: string) =>
    request.get<TaskStdItemVo[]>(`/v1/fia/tasks/${id}/std-items`),

  /** GET /v1/fia/tasks/by-change?changeId= 变更单关联的供应商来料首件(变更→首件绑定追溯) */
  byChange: (changeId: string) =>
    request.get<FiaTask | null>('/v1/fia/tasks/by-change', { params: { changeId } }),
}
