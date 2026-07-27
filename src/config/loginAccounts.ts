// 登录演示账号配置（驱动登录页卡片）。
// 账号权限由后端 SeedRunner 的 9 种角色 × 公司 + 集团管理员决定，
// 此处仅做“展示”用途：公司、真实姓名、角色名称与权限说明。
// 登录统一走真实后端 auth.login，密码 123456。

export type CompanyCode = 'MZ' | 'SZ' | 'GROUP'

export interface LoginAccount {
  username: string
  realName: string
  company: '梅州' | '深圳' | '集团'
  companyCode: CompanyCode
  roleName: string
  roleCode: string
  permDesc: string
}

export interface LoginGroup {
  label: string
  companyCode: CompanyCode
  /** 公司主题色（梅州蓝 / 深圳绿 / 集团金） */
  accent: string
  accounts: LoginAccount[]
}

const MZ = '梅州' as const
const SZ = '深圳' as const
const GP = '集团' as const

export const LOGIN_GROUPS: LoginGroup[] = [
  {
    label: '梅州分公司',
    companyCode: 'MZ',
    accent: '#0047AB',
    accounts: [
      { username: 'mz.operator',   realName: '张伟', company: MZ, companyCode: 'MZ', roleName: '操作工',     roleCode: 'operator',   permDesc: '产线操作 · 首件送检 · 自检录入' },
      { username: 'mz.inspector',  realName: '李静', company: MZ, companyCode: 'MZ', roleName: '检验员',     roleCode: 'inspector',  permDesc: '首件/来料检验 · 不良录入 · 电子签名' },
      { username: 'mz.shiftleader',realName: '刘明', company: MZ, companyCode: 'MZ', roleName: '班组长',     roleCode: 'shiftleader',permDesc: '产线管理 · 报警确认 · 工装状态' },
      { username: 'mz.qe',         realName: '陈晓', company: MZ, companyCode: 'MZ', roleName: '质量工程师', roleCode: 'qe',         permDesc: '质量分析 · SPC 监控 · 8D/CAPA' },
      { username: 'mz.sqe',        realName: '周婷', company: MZ, companyCode: 'MZ', roleName: '供应商质量工程师', roleCode: 'sqe',   permDesc: '供应商审核 · 来料异常 · 整改验证' },
      { username: 'mz.qmanager',   realName: '赵磊', company: MZ, companyCode: 'MZ', roleName: '质量经理',   roleCode: 'qmanager',   permDesc: '审批授权 · 趋势分析 · 团队管理' },
      { username: 'mz.purchaser',  realName: '孙丽', company: MZ, companyCode: 'MZ', roleName: '采购员',     roleCode: 'purchaser',  permDesc: '采购订单 · 供应商准入 · 物料变更' },
      { username: 'mz.rd',         realName: '郑昊', company: MZ, companyCode: 'MZ', roleName: '研发工程师', roleCode: 'rd',         permDesc: '物料/工艺变更研发审批 · 验证评估' },
      { username: 'mz.admin',      realName: '吴敏', company: MZ, companyCode: 'MZ', roleName: '分公司管理员', roleCode: 'admin',     permDesc: '本分公司用户/角色/组织管理 · 系统配置' },
    ],
  },
  {
    label: '深圳分公司',
    companyCode: 'SZ',
    accent: '#2E9E5B',
    accounts: [
      { username: 'sz.operator',   realName: '王强', company: SZ, companyCode: 'SZ', roleName: '操作工',     roleCode: 'operator',   permDesc: '产线操作 · 首件送检 · 自检录入' },
      { username: 'sz.inspector',  realName: '黄敏', company: SZ, companyCode: 'SZ', roleName: '检验员',     roleCode: 'inspector',  permDesc: '首件/来料检验 · 不良录入 · 电子签名' },
      { username: 'sz.shiftleader',realName: '林峰', company: SZ, companyCode: 'SZ', roleName: '班组长',     roleCode: 'shiftleader',permDesc: '产线管理 · 报警确认 · 工装状态' },
      { username: 'sz.qe',         realName: '徐洋', company: SZ, companyCode: 'SZ', roleName: '质量工程师', roleCode: 'qe',         permDesc: '质量分析 · SPC 监控 · 8D/CAPA' },
      { username: 'sz.sqe',        realName: '何静', company: SZ, companyCode: 'SZ', roleName: '供应商质量工程师', roleCode: 'sqe',   permDesc: '供应商审核 · 来料异常 · 整改验证' },
      { username: 'sz.qmanager',   realName: '高翔', company: SZ, companyCode: 'SZ', roleName: '质量经理',   roleCode: 'qmanager',   permDesc: '审批授权 · 趋势分析 · 团队管理' },
      { username: 'sz.purchaser',  realName: '罗燕', company: SZ, companyCode: 'SZ', roleName: '采购员',     roleCode: 'purchaser',  permDesc: '采购订单 · 供应商准入 · 物料变更' },
      { username: 'sz.rd',         realName: '宋涛', company: SZ, companyCode: 'SZ', roleName: '研发工程师', roleCode: 'rd',         permDesc: '物料/工艺变更研发审批 · 验证评估' },
      { username: 'sz.admin',      realName: '梁宇', company: SZ, companyCode: 'SZ', roleName: '分公司管理员', roleCode: 'admin',     permDesc: '本分公司用户/角色/组织管理 · 系统配置' },
    ],
  },
  {
    label: '集团',
    companyCode: 'GROUP',
    accent: '#C9971B',
    accounts: [
      { username: 'admin',         realName: '钱伟', company: GP, companyCode: 'GROUP', roleName: '集团管理员', roleCode: 'admin',   permDesc: '全平台用户/角色/组织/菜单治理 · 跨公司数据' },
    ],
  },
]
