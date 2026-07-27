/** 后端统一响应 R<T> = {code, msg, data},code=0 成功 */
export interface R<T> {
  code: number
  msg: string
  data: T
}

/** 分页结果 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** 分页查询 */
export interface PageQuery {
  page?: number
  size?: number
}
