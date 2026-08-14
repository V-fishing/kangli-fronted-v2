/** 通用审批中心:待我审批条目 */
export interface PendingApproval {
  /** 审批记录主键 */
  id: string
  /** 业务模块: FIA / NCM / SQM */
  module: 'FIA' | 'NCM' | 'SQM' | string
  /** 审批类型(中文) */
  bizType: string
  /** 业务单号 */
  bizNo: string
  /** 展示标题 */
  title: string
  /** 申请人/责任人 */
  applicant?: string
  /** 发起时间(ISO) */
  appliedAt?: string
  /** 前端跳转路由 */
  url: string
}
