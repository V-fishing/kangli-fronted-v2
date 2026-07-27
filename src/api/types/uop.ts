/** 用户(ops.sys_user) */
export interface SysUser {
  id: string
  username: string
  passwordHash?: string
  orgId: string | null // null = 跨公司管理员(dataScope=all)
  realName?: string
  status: string // 启用/停用/锁定
  failCount?: number
  lockUntil?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  isDeleted?: boolean
  version?: number
}

export interface SysRole {
  id: string
  roleCode: string
  roleName: string
  roleType?: string
  permDesc?: string
  status?: string
  createdAt?: string
}

export interface SysOrg {
  id: string
  orgCode: string
  orgName: string
  sortOrder?: number
  orgType: string // 公司/工厂/车间/产线/工位
  status?: string
  parentId?: string | null
}

export interface OrgTreeNode extends SysOrg {
  children?: OrgTreeNode[]
}

export interface SysMenu {
  id: string
  menuCode: string
  menuName: string
  path?: string
  component?: string
  sort?: number
  icon?: string
  parentId?: string | null
  children?: SysMenu[]
}

export interface SysButton {
  id: string
  menuId: string
  btnCode: string
  btnName: string
}

export interface SysDelegation {
  id: string
  delegatorId: string
  delegateeId: string
  roleId: string
  startAt: string
  endAt: string
  status: string // 生效/已过期/已撤销
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

/** GET /v1/uop/me 返回 */
export interface CurrentUserVo {
  userId: string
  username: string
  orgId: string | null
  dataScope: string // all = 跨公司,否则 = org_id
  permissions: string[]
}
