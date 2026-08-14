/** 用户(ops.sys_user) */
export interface SysUser {
  id: string
  username: string
  passwordHash?: string
  orgId: string | null // null = 跨公司管理员(dataScope=all)
  realName?: string
  status: string // 启用/停用/锁定
  /** 邮箱(点对点通知·邮件渠道接收人) */
  email?: string
  /** 手机号(点对点通知·短信/钉钉/企微按手机号桥接) */
  phone?: string
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
  /** 所属分公司 org_id；null = 集团(跨公司，如 sysadmin) */
  orgId?: string | null
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
  /** 后端菜单树节点排序(与 sort 同义,树接口返回此字段) */
  sortOrder?: number
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
  /** 按角色菜单权限过滤后的菜单树(绝对路径;前端据此动态渲染导航) */
  menus?: SysMenu[]
}

/** GET /v1/uop/users/select 返回:采集任务"选择接收人"下拉项(仅启用用户) */
export interface UserSelectVo {
  id: string
  username: string
  realName?: string
  orgId?: string | null
}
