export interface PatlRoute {
  id: string
  routeCode?: string
  routeName?: string
  procName?: string
  freq?: string
  status?: string
  orgId?: string
}

export interface PatlRouteVo extends PatlRoute {
  checkpoints?: PatlCheckpoint[]
}

export interface PatlCheckpoint {
  id: string
  routeId: string
  seq: number
  pointName?: string
  location?: string
  needPhoto?: boolean
  items?: PatlCheckItem[]
}

export interface PatlCheckItem {
  id: string
  checkpointId: string
  seq: number
  itemName?: string
  checkType?: string
  stdValue?: string
  isRequired?: boolean
}

export interface PatlTask {
  id: string
  taskNo?: string
  routeId?: string
  shift?: string
  planTime?: string
  status: string
  totalPoints?: number
  donePoints?: number
  abnormalCount?: number
  orgId?: string
}

export interface PatlTaskVo {
  task: PatlTask
  records?: PatlRecord[]
}

export interface PatlRecord {
  id: string
  taskId: string
  checkpointId: string
  checkpointName?: string
  result?: string
  photoRef?: string
  checkTime?: string
}

export interface PatlAbnormal {
  id: string
  taskId?: string
  checkpointName?: string
  description?: string
  severity?: string
  status: string
  handleRemark?: string
}