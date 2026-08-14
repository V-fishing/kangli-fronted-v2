import { request } from '@/api/client'
import type { MyTask } from '@/api/types/myTask'

/** 工作台「我的任务」聚合接口（跨 FIA / NCM 8D·CAPA / 巡检）。后端聚合服务缺失时返回空列表兜底。 */
export const myTasksApi = {
  list: (params?: { limit?: number; includeClosed?: boolean }) =>
    request.get<MyTask[]>('/v1/my/tasks', { params }),
}
