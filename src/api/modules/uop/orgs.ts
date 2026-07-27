import { request } from '@/api/client'
import type { SysOrg, OrgTreeNode } from '@/api/types/uop'

export const orgApi = {
  /** GET /v1/uop/orgs — 组织列表(扁平) */
  list: () => request.get<SysOrg[]>('/v1/uop/orgs'),
  /** GET /v1/uop/orgs/tree — 组织树 */
  tree: () => request.get<OrgTreeNode[]>('/v1/uop/orgs/tree'),
}
