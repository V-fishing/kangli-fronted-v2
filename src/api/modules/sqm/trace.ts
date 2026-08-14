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
} from '@/api/types/sqm'
import type { PageResult } from '@/api/types/common'

export interface TraceSearchParams {
  nodeType?: string
  keyword?: string
  orgId?: string
  page?: number
  size?: number
}

export const sqmTraceApi = {
  // ── 来料批次 ──
  /** 查询来料批次列表(支持供应商 + IQC 通过状态过滤) */
  listLots: (params?: { keyword?: string; supplierId?: string; iqcPass?: boolean; page?: number; size?: number; orgId?: string }) =>
    request.get<SqmIncomingLot[] | PageResult<SqmIncomingLot>>('/v1/sqm/lots', { params }),
  /** 来料批次分页列表(大数据量分页加载,避免一次性拉取全部导致前端卡顿) */
  listLotsPage: (params?: { keyword?: string; supplierId?: string; page?: number; size?: number }) =>
    request.get<PageResult<SqmIncomingLot>>('/v1/sqm/lots/page', { params }),
  /** 某供应商名下已通过 IQC 的合格物料批次(级联下拉数据源) */
  qualifiedMaterials: (supplierId: string) =>
    request.get<SqmIncomingLot[]>('/v1/sqm/lots', { params: { supplierId, iqcPass: true } }),
  /** 按 MES VEN 编号解析供应商 */
  getSupplierByVenCode: (venCode: string) =>
    request.get<import('@/api/types/sqm').SqmSupplier>('/v1/sqm/suppliers/by-ven/' + venCode),
  /** 创建来料批次 */
  createLot: (body: Partial<SqmIncomingLot>) => request.post<SqmIncomingLot>('/v1/sqm/lots', body),

  // ── 追溯树查询 ──
  /** 按来料批次获取完整追溯树 */
  getFullTree: (rootLotId: string, orgId?: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/full-tree', { params: { rootLotId, ...(orgId ? { orgId } : {}) } }),
  /** 按根节点获取完整追溯树(嵌套) */
  getFullTraceTreeByRootNode: (rootNodeId: string, orgId?: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/full-tree-by-root', { params: { rootNodeId, ...(orgId ? { orgId } : {}) } }),
  /** 按任意节点获取其下完整子树 */
  getTraceTreeFromNode: (nodeId: string, orgId?: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/tree-from-node', { params: { nodeId, ...(orgId ? { orgId } : {}) } }),
  /** 按根节点获取扁平追溯树(含link关系) */
  traceTreeByRootNode: (rootNodeId: string, orgId?: string) =>
    request.get<SqmTraceNode[]>('/v1/sqm/trace/tree-by-root', { params: { rootNodeId, ...(orgId ? { orgId } : {}) } }),
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
  /**
   * 为节点挂载子节点:
   * - 引用模式(refNodeId 非空): 复用已有节点建 link, 跳过物料身份校验;
   * - 新建模式(refNodeId 为空): 须提供 materialCode+batchNo(须命中已通过 IQC 的来料批次), 可带 processCode/componentWorkOrder。
   */
  attachComponent: (nodeId: string, item: TraceComponentItem) =>
    request.post<SqmTraceNode>('/v1/sqm/trace/nodes/' + nodeId + '/components', item),
  /**
   * 方案 B: 手动往 sqm_trace_relation 插入一条 parent→child 条码边(物料表关联半成品/成品)。
   * 入参为业务条码(keypart 的 id 即关键件条码; incoming 用 material_barcode), 非 UUID。
   */
  saveRelation: (parentBarcode: string, childBarcode: string, relationType: string, orgId?: string) =>
    request.post<void>('/v1/sqm/trace/mes-relation', null, {
      params: { parentBarcode, childBarcode, relationType, ...(orgId ? { orgId } : {}) },
    }),
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

  // ── 方案 B: 源表分页(三源表路由) ──
  /** 源表分页: 按 type(material/semi/finished/all) 路由三源表, type=all 时返回各类型计数。plantCode 用于组织隔离。 */
  sourcePage: (params: { type?: string; keyword?: string; plantCode?: string; page?: number; size?: number }) =>
    request.get<PageResult<Record<string, any>>>('/v1/sqm/trace/source/page', { params }),

  // ── 方案 B: 基于 sqm_trace_relation + 三源表的 MES 追溯树 ──
  /** 以源表业务条码(来料 material_barcode / 成品 prod_batch_or_sn / 半成品 prod_batch_or_sn)为根,
   *  沿 sqm_trace_relation 递归连通分量, 回查三源表取节点详情。
   *  direction: 'forward' 正向(向下追到物料) / 'backward' 反向(向上追到客户) / 'all' 全链路(默认)。 */
  getMesTraceTree: (barcode: string, direction?: 'forward' | 'backward' | 'all', orgId?: string) =>
    request.get<TraceFullTreeVO>('/v1/sqm/trace/mes-tree', {
      params: { barcode, direction: direction || 'all', ...(orgId ? { orgId } : {}) },
    }),

  /** 按批号查产品树: 批号可为来料批次号(material_batch_no)或成品/半成品批号(prod_batch_or_sn)。返回森林(可能多棵)。 */
  getMesTraceTreeByBatch: (batchNo: string, direction?: 'forward' | 'backward' | 'all', orgId?: string) =>
    request.get<TraceFullTreeVO[]>('/v1/sqm/trace/mes-tree-by-batch', {
      params: { batchNo, direction: direction || 'all', ...(orgId ? { orgId } : {}) },
    }),

  /** 按来料批次号(lotNo)查 MES 追溯森林: 先由来料批次号定位源表业务条码集合, 再逐条码追溯合并森林。返回森林(可能多棵)。 */
  getMesTraceTreeByLotNo: (lotNo: string, direction?: 'forward' | 'backward' | 'all', orgId?: string) =>
    request.get<TraceFullTreeVO[]>('/v1/sqm/trace/mes-tree-by-lotno', {
      params: { lotNo, direction: direction || 'all', ...(orgId ? { orgId } : {}) },
    }),

  /**
   * 源表全字段明细(供物料表/半成品表/成品表「详情」弹窗): 按 sourceType + 业务条码(key)查三源表全字段。
   * sourceType ∈ {material, finished, semi, critical}; 返回剔除别名/审计列后的业务字段 Map。
   */
  getSourceDetail: (sourceType: string, key: string) =>
    request.get<Record<string, any>>('/v1/sqm/trace/source-detail', { params: { sourceType, key } }),
}
