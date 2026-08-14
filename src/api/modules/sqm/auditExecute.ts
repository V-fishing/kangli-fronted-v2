import { request } from '@/api/client'
import type {
  SqmAuditChecklistItem, SqmAuditPhoto, SqmAuditWorkflowLog, SqmAuditNc, SqmAuditApproval,
} from '@/api/types/sqm'

/**
 * 审核执行环节接口:检查项打分、现场照片、流程轨迹、提交复核。
 * 照片上传复用既有 POST /v1/sqm/audits/records/{recordId}/photos 端点(本地 logs/photos/)。
 */
export const auditExecuteApi = {
  /** 列出某审核记录的现场审核检查项 */
  listChecklist: (recordId: string) =>
    request.get<SqmAuditChecklistItem[]>(`/v1/sqm/audits/records/${recordId}/checklist`),

  /** 批量保存检查项(全量 upsert,首次保存惰性建审核记录) */
  saveChecklist: (recordId: string, items: Partial<SqmAuditChecklistItem>[]) =>
    request.put<void>(`/v1/sqm/audits/records/${recordId}/checklist`, items),

  /** 列出某审核记录的现场照片 */
  listPhotos: (recordId: string) =>
    request.get<SqmAuditPhoto[]>(`/v1/sqm/audits/records/${recordId}/photos`),

  /** 保存一条照片元数据(上传后回填 filePath) */
  addPhoto: (recordId: string, body: Partial<SqmAuditPhoto>) =>
    request.post<SqmAuditPhoto>(`/v1/sqm/audits/records/${recordId}/photos/meta`, body),

  /** 删除照片 */
  removePhoto: (photoId: string) =>
    request.delete<void>(`/v1/sqm/audits/photos/${photoId}`),

  /** 读取照片文件(按 MinIO objectKey,如 audit-photos/{uuid}-name) */
  photoUrl: (objectKey: string) => `/v1/sqm/audits/photos/${objectKey.split('/').map(encodeURIComponent).join('/')}`,

  /** 列出某审核记录的现场不符合项 */
  listNcs: (recordId: string) =>
    request.get<SqmAuditNc[]>(`/v1/sqm/audits/records/${recordId}/ncs`),

  /** 新增不符合项 */
  createNc: (recordId: string, body: Partial<SqmAuditNc>) =>
    request.post<SqmAuditNc>(`/v1/sqm/audits/records/${recordId}/ncs`, body),

  /** 某计划的流程轨迹(时间轴) */
  workflowLog: (planId: string) =>
    request.get<SqmAuditWorkflowLog[]>(`/v1/sqm/audits/plans/${planId}/workflow-log`),

  /** 提交执行结果复核(追加 review 会签节点) */
  submitReview: (planId: string) =>
    request.post<SqmAuditApproval>(`/v1/sqm/audits/plans/${planId}/submit-review`),

  /** 复核通过后闭环归档(生成最终审核记录并归档)。conclusion 为人工兜底结论，留空则自动判定 */
  completeReview: (planId: string, conclusion?: string) =>
    request.post<void>(`/v1/sqm/audits/plans/${planId}/complete-review`, { conclusion: conclusion || '' }),

  /** 执行页初始化:返回计划 + 关联记录(recordId 为空时由后端惰性建) + 当前复核节点 */
  loadExecute: (planId: string) =>
    request.get<{ plan: any; recordId: string | null; review: any | null }>(
      `/v1/sqm/audits/plans/${planId}/execute-init`),
}
