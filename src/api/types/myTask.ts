/** 跨模块"我的任务"统一结构(对应后端 MyTaskDTO)。 */
export interface MyTask {
  /** 模块:FIA / NCM / PATROL */
  module: string
  /** 业务类型:首件检验 / 8D报告 / 巡检任务 */
  taskType?: string
  /** 业务单号 */
  bizNo?: string
  /** 展示标题 */
  title?: string
  /** 负责人(姓名) */
  assignee?: string
  /** 业务状态 */
  status?: string
  /** 截止时间(ISO 字符串) */
  dueAt?: string
  /** 前端跳转路径 */
  url?: string
}
