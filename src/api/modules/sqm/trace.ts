import { request } from '@/api/client'
import type {
  SqmIncomingLot,
  SqmTraceNode,
  TraceFullTreeVO,
  TraceNodeFullVO,
  TraceNodeTreeVO,
  TraceNodeSearchVO,
  TraceNodeSaveRequest,
  TraceComponentItem,
  SqmTraceRawDetail,
  SqmTraceProductDetail,
  SqmKeyPartSn,
  TraceDirectionNode,
  PageResult,
} from '@/api/types/sqm'

export interface TraceSearchParams {
  nodeType?: string
  keyword?: string
  orgId?: string
  page?: number
  size?: number
}

export const sqmTraceApi = {
  // ── 来料批次 ──
  /** 查询全部来料批次列表 */
  listLots: (params?: { keyword?: string; page?: number; size?: number }) =>
    request.get<SqmIncomingLot[] | PageResult<SqmIncomingLot>>('/v1/sqm/lots', { params }),
  /** 创建来料批次 */
  createLot: (body: Partial<SqmIncomingLot>) => request.post<SqmIncomingLot>('/v1/sqm/lots', body),

  // ── 追溯树查询 ──
  /** 按来料批次获取完整追溯树 */
  getFullTree: (rootLotId: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/full-tree', { params: { rootLotId } }),
  /** 按根节点获取完整追溯树(嵌套) */
  getFullTraceTreeByRootNode: (rootNodeId: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/full-tree-by-root', { params: { rootNodeId } }),
  /** 按任意节点获取其下完整子树 */
  getTraceTreeFromNode: (nodeId: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/tree-from-node', { params: { nodeId } }),
  /** 按根节点获取扁平追溯树(含link关系) */
  traceTreeByRootNode: (rootNodeId: string) =>
    request.get<SqmTraceNode[]>('/v1/sqm/trace/tree-by-root', { params: { rootNodeId } }),
  /** 查询追溯树根节点列表 */
  listRoots: (orgId: string) =>
    request.get<SqmTraceNode[]>('/v1/sqm/trace/roots', { params: { orgId } }),

  // ── 节点 CRUD ──
  /** @deprecated 旧版直接创建 SqmTraceNode 实体，请使用 saveNode */
  createNode: (body: Partial<SqmTraceNode>) =>
    request.post<SqmTraceNode>('/v1/sqm/trace/nodes', body),
  /** 新增/保存追溯节点（含父节点link、detail写入、components） */
  saveNode: (body: TraceNodeSaveRequest) =>
    request.post<SqmTraceNode>('/v1/sqm/trace/nodes/save', body),
  /** 获取节点详情 */
  getNodeDetail: (nodeId: string) =>
    request.get<TraceNodeFullVO>('/v1/sqm/trace/nodes/' + nodeId + '/detail'),
  /** 为节点挂载子节点（通过 refNodeId 引用已有节点建立link）。可传 usageQty/unit，挂接来料/物料时按用量扣减库存 */
  attachComponent: (
    nodeId: string,
    item: { refNodeId: string; usageQty?: number; unit?: string; componentType?: string },
  ) => request.post<SqmTraceNode>('/v1/sqm/trace/nodes/' + nodeId + '/components', item),
  /** 全局搜索追溯节点 */
  searchNodes: (params: TraceSearchParams) =>
    request.get<PageResult<TraceNodeSearchVO>>('/v1/sqm/trace/nodes/search', { params }),
  /** 作废节点 */
  invalidateNode: (nodeId: string) =>
    request.put<void>('/v1/sqm/trace/nodes/' + nodeId + '/invalidate'),

  // ── 方向追溯 ──
  /** 按方向追溯(forward/backward/both) */
  traceDirection: (nodeId: string, direction?: string) =>
    request.get<TraceDirectionNode[]>('/v1/sqm/trace/nodes/' + nodeId + '/direction', { params: { direction } }),

  // ── 原材料/产品明细 ──
  /** 获取节点原材料明细 */
  getRawDetail: (nodeId: string) =>
    request.get<SqmTraceRawDetail>('/v1/sqm/trace/nodes/' + nodeId + '/raw-detail'),
  /** 保存原材料明细 */
  saveRawDetail: (nodeId: string, body: Partial<SqmTraceRawDetail>) =>
    request.put<SqmTraceRawDetail>('/v1/sqm/trace/nodes/' + nodeId + '/raw-detail', body),
  /** 获取产出产品明细 */
  getProductDetail: (nodeId: string) =>
    request.get<SqmTraceProductDetail>('/v1/sqm/trace/nodes/' + nodeId + '/product-detail'),
  /** 保存产出产品明细 */
  saveProductDetail: (nodeId: string, body: Partial<SqmTraceProductDetail>) =>
    request.put<SqmTraceProductDetail>('/v1/sqm/trace/nodes/' + nodeId + '/product-detail', body),

  // ── 关键件 SN ──
  /** 查询关键件序列号列表(按来料批次) */
  listKeyPartSn: (lotId: string) =>
    request.get<SqmKeyPartSn[]>('/v1/sqm/trace/key-part-sns', { params: { lotId } }),
  /** 新增关键件序列号 */
  createKeyPartSn: (body: Partial<SqmKeyPartSn>) =>
    request.post<SqmKeyPartSn>('/v1/sqm/trace/key-part-sns', body),
}
