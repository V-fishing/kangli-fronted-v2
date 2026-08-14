import { request } from '@/api/client'
import type { PendingApproval } from '@/api/types/approval'

export const approvalCenterApi = {
  /** GET /v1/approvals/pending —— 当前用户跨模块待审批聚合 */
  pending: () => request.get<PendingApproval[]>('/v1/approvals/pending'),
}
