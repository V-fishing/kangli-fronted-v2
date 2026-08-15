// 售后管理(CS) · 工单流程控制 类型定义
export interface CsWorkOrder {
  id?: string
  orgId?: string
  orderNo?: string
  customerName: string
  customerContact?: string
  woType: 'INSTALL' | 'REPAIR' // 安装 / 维修
  priority: 'URGENT' | 'NORMAL' | 'LOW' // 紧急 / 普通 / 低
  productName?: string
  faultDesc?: string
  status: 'PENDING' | 'ASSIGNED' | 'DONE' | 'CLOSED' // 待派单 / 处理中 / 已完成 / 已闭环
  ownerId?: string
  ownerName?: string
  assignAt?: string
  handleDetail?: string
  handleAt?: string
  closeAt?: string
  satisfaction?: number // 1~5 满意度评分
  satisfactionComment?: string
  expectTime?: string
  address?: string
  createdAt?: string
  updatedAt?: string
}

export interface CsWorkOrderDashboard {
  pending?: number
  assigned?: number
  done?: number
  closed?: number
  urgentPending?: number
  total?: number
  monthly?: Array<{ month: string; created: number; closed: number }>
}

// 客户反馈(投诉/建议/表扬/咨询)
export interface CsFeedback {
  id?: string
  orgId?: string
  customerName: string
  customerContact?: string
  fbType: 'COMPLAINT' | 'SUGGESTION' | 'PRAISE' | 'INQUIRY'
  content: string
  relatedWoNo?: string
  status: 'OPEN' | 'HANDLING' | 'DONE'
  handleDetail?: string
  handleAt?: string
  ownerName?: string
  satisfaction?: number
  cause?: 'RESPONSE_SLOW' | 'REPAIR_INCOMPLETE' | 'ATTITUDE' | 'OTHER' // 低分诱因维度
  relatedNcmId?: string // 联动 NCM 8D/CAPA 纠正措施 ID
  createdAt?: string
  updatedAt?: string
}

// 满意度统计(基于已闭环工单评分 + 客户反馈评分)
export interface SatisfactionStats {
  avgScore?: number
  rated?: number
  distribution?: Record<string, number> // score(1~5) -> count
  monthly?: Array<{ month: string; avgScore: number; cnt: number }>
  fbAvgScore?: number // 客户反馈评分均值
  fbRated?: number // 客户反馈已评分数
  causeDist?: Record<string, number> // 低分诱因维度分布
}
