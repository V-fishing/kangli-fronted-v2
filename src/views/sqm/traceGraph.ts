// 共享追溯图谱逻辑（物料表与 MES 页共用，避免重复实现 flattenTree / 配色 / 布局常量）
import type { TraceNodeTreeVO } from '@/api/types/sqm'

// ── SVG 布局常量 ──
export const CX = [100, 290, 480, 670, 860, 1050] as const
export const BW = 180
export const BH = 58
export const RW = 150
export const RH = 44
export const ARC = 60
export const LEFTM = 60
export const DX = 250
export const COL_HEADERS = ['来料批', '物料行·条码', '半成品批', '半成品行·条码', '成品批', '成品行·客户']

export interface GraphBatch { id: string; col: number; depth?: number; x: number; y: number; batchNo?: string; nodeName?: string; qty?: number; unit?: string; status?: string; nodeType?: string; treeNode?: TraceNodeTreeVO; childIds: string[] }
export interface GraphRow { id: string; col: number; depth?: number; x: number; y: number; name?: string; nodeName?: string; qty?: number; unit?: string; status?: string; nodeType?: string; batchNo?: string; parentBatchId: string; treeNode?: TraceNodeTreeVO }
export interface GraphEdge { id: string; from: string; to: string; qty?: number; unit?: string; label?: string; path: string; lx: number; ly: number; secondary?: boolean }

export const typeLabelMap: Record<string, string> = { incoming: '来料批', raw: '物料行', keypart: '关键件', semi: '半成品批', ship: '成品批', customer: '客户' }
const typeBatchSet = new Set(['incoming', 'semi', 'ship', 'customer'])
const batchColMap: Record<string, number> = { incoming: 0, raw: 1, keypart: 1, semi: 2, ship: 4, customer: 5 }

export function sC(s?: string) {
  if (s === 'ok' || s === '合格' || s === '是') return 'var(--green)'
  if (s === 'pending' || s === '待检') return 'var(--amber)'
  if (s === 'locked' || s === '锁定') return 'var(--signal-red)'
  return 'var(--hairline)'
}

export function makePath(x1: number, y1: number, x2: number, y2: number): { d: string; lx: number; ly: number } {
  const dx = Math.max(Math.abs(x2 - x1) * 0.3, ARC)
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  return { d, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 - 10 }
}

// ══════ Flatten tree → graph (tidy-tree 展开，DAG 额外父关系作次边淡化) ══════
// opts.upRoot: 上游树（与 root 共享同一中心节点，沿 parent 方向展开）。
//   传了 upRoot 时进入"中心双向布局"：中心节点 depth=0，下游 depth>0 向右，上游 depth<0 向左，
//   与物料表"来料在左→成品在右"的物流方向同构，MES 页一张图即可同时看上下游。
export interface FlattenOpts {
  upRoot?: TraceNodeTreeVO | null
}
export function flattenTree(root: TraceNodeTreeVO | null, mode: 'stage' | 'depth' | 'focus', opts?: FlattenOpts) {
  const upRoot = opts?.upRoot || null
  const bidirectional = !!upRoot && !!root && upRoot.id === root.id
  const batches: GraphBatch[] = []
  const rows: GraphRow[] = []
  const edges: GraphEdge[] = []

  const GAP = 10
  const TOP = 40
  const Y_STEP = (BH + RH) / 2 + GAP
  const typeBatchSetLocal = typeBatchSet

  function buildOneTree(
    r: TraceNodeTreeVO,
    depthSign: 1 | -1,
    yOffsetSlots: number,
    skipRoot: boolean,
  ): { bMap: Map<string, GraphBatch>; rMap: Map<string, GraphRow>; maxSlot: number; rootChildrenIds: string[] } {
    const allNodes: TraceNodeTreeVO[] = []
    const nodeMap = new Map<string, TraceNodeTreeVO>()
    function collect(n: TraceNodeTreeVO) {
      if (!n || nodeMap.has(n.id)) return
      if (skipRoot && n === r) { if (n.children) n.children.forEach(collect); return }
      nodeMap.set(n.id, n); allNodes.push(n)
      if (n.children) n.children.forEach(collect)
    }
    collect(r)

    const primaryParent = new Map<string, string | null>()
    const childPrimary = new Map<string, string[]>()
    const depthMap = new Map<string, number>()
    const colMap = new Map<string, number>()
    function dfsTree(n: TraceNodeTreeVO, parentId: string | null, d: number, col: number) {
      primaryParent.set(n.id, parentId)
      depthMap.set(n.id, d)
      colMap.set(n.id, col)
      for (const ch of (n.children || [])) {
        if (!primaryParent.has(ch.id)) {
          if (!childPrimary.has(n.id)) childPrimary.set(n.id, [])
          childPrimary.get(n.id)!.push(ch.id)
          dfsTree(ch, n.id, d + 1, Math.min(col + 1, 5))
        }
      }
    }
    if (skipRoot) {
      // 跳过 root 自身：直接从 root 的 children 起，depth 从 1 开始（再乘 depthSign）
      for (const ch of (r.children || [])) dfsTree(ch, r.id, 1, Math.min(1, 5))
    } else {
      dfsTree(r, null, 0, 0)
    }

    const yOrderMap = new Map<string, number>()
    let _slot = 0
    function assignYOrder(id: string): number {
      if (yOrderMap.has(id)) return yOrderMap.get(id)!
      const kids = childPrimary.get(id) || []
      let v: number
      if (!kids.length) { v = _slot++ }
      else {
        let lo = Infinity, hi = -Infinity
        for (const k of kids) { const yv = assignYOrder(k); if (yv < lo) lo = yv; if (yv > hi) hi = yv }
        v = (lo + hi) / 2
      }
      yOrderMap.set(id, v)
      return v
    }
    if (skipRoot) for (const ch of (r.children || [])) assignYOrder(ch.id)
    else assignYOrder(r.id)

    const localBatches: GraphBatch[] = []
    const localRows: GraphRow[] = []
    for (const n of allNodes) {
      const pid = n.parentNodeId || ''
      const col = Math.min(colMap.get(n.id) ?? batchColMap[n.nodeType] ?? 0, 5)
      const depth = (depthMap.get(n.id) ?? 0) * depthSign
      if (typeBatchSetLocal.has(n.nodeType)) {
        const bx = mode === 'depth' ? LEFTM + depth * DX : CX[Math.min(col, 5)]
        localBatches.push({ id: n.id, col, depth, x: bx, y: 0, batchNo: n.batchNo, nodeName: n.nodeName, qty: n.qty, unit: n.unit, status: n.isValid || undefined, nodeType: n.nodeType, treeNode: n, childIds: (n.children || []).map(c => c.id) })
      } else {
        const rx = mode === 'depth' ? LEFTM + depth * DX : CX[Math.min(col, 5)]
        localRows.push({ id: n.id, col, depth, x: rx, y: 0, name: n.materialCode || n.nodeName, nodeName: n.nodeName, qty: n.qty, unit: n.unit, status: n.isValid || undefined, nodeType: n.nodeType, batchNo: n.batchNo, parentBatchId: pid, treeNode: n })
      }
    }
    const yOf = (id: string) => TOP + ((yOrderMap.get(id) ?? 0) + yOffsetSlots) * Y_STEP
    for (const b of localBatches) b.y = yOf(b.id)
    for (const r2 of localRows) r2.y = yOf(r2.id)
    const rootChildrenIds = (r.children || []).map(c => c.id)
    return { bMap: new Map(localBatches.map(b => [b.id, b])), rMap: new Map(localRows.map(r => [r.id, r])), maxSlot: _slot, rootChildrenIds }
  }

  let upRootChildren: string[] = []
  if (root) {
    const down = buildOneTree(root, 1, 0, false)
    batches.push(...down.bMap.values())
    rows.push(...down.rMap.values())
    if (bidirectional) {
      const up = buildOneTree(upRoot!, -1, down.maxSlot + 2, true)
      batches.push(...up.bMap.values())
      rows.push(...up.rMap.values())
      upRootChildren = up.rootChildrenIds
    }
  } else if (upRoot) {
    const up = buildOneTree(upRoot, -1, 0, false)
    batches.push(...up.bMap.values())
    rows.push(...up.rMap.values())
  }

  const batchMap = new Map(batches.map(b => [b.id, b]))
  const rowMap = new Map(rows.map(r => [r.id, r]))

  // depth 模式: 上游 depth<0 会产生负 x, 全局左对齐到 LEFTM 起, 保证 SVG 不越界
  if (mode === 'depth' && (batches.length || rows.length)) {
    let minX = Infinity
    for (const b of batches) minX = Math.min(minX, b.x)
    for (const r of rows) minX = Math.min(minX, r.x)
    const shift = LEFTM - minX
    if (shift !== 0) {
      for (const b of batches) b.x += shift
      for (const r of rows) r.x += shift
    }
  }

  for (const b of batches) {
    if (!b.treeNode?.children) continue
    for (const ch of b.treeNode.children) {
      const cb = batchMap.get(ch.id); const cr = rowMap.get(ch.id)
      const tgt = cb || cr; if (!tgt) continue
      const p = makePath(b.x + BW, b.y + BH / 2, tgt.x, tgt.y + (cb ? BH : RH) / 2)
      const lbl = ch.qty != null ? `${ch.qty}${ch.unit || ''}` : ''
      edges.push({ id: `${b.id}>${ch.id}`, from: b.id, to: ch.id, qty: ch.qty, unit: ch.unit, label: lbl || undefined, path: p.d, lx: p.lx, ly: p.ly })
    }
  }
  for (const r of rows) {
    if (!r.treeNode?.children) continue
    for (const ch of r.treeNode.children) {
      const cb = batchMap.get(ch.id); if (!cb) continue
      const p = makePath(r.x + RW, r.y + RH / 2, cb.x, cb.y + BH / 2)
      const lbl = ch.qty != null ? `${ch.qty}${ch.unit || ''}` : ''
      edges.push({ id: `${r.id}>${ch.id}`, from: r.id, to: ch.id, qty: ch.qty, unit: ch.unit, label: lbl || undefined, path: p.d, lx: p.lx, ly: p.ly })
    }
  }
  // 双向布局: 补"中心节点 → 上游直接父"边(中心盒子来自下游树, 上游父来自上游树)
  if (bidirectional && root) {
    const center = batchMap.get(root.id) || rowMap.get(root.id)
    if (center) {
      for (const pid of upRootChildren) {
        const tgt = batchMap.get(pid) || rowMap.get(pid)
        if (!tgt) continue
        const p = makePath(center.x, center.y + (center === batchMap.get(root.id) ? BH : RH) / 2, tgt.x + BW, tgt.y + BH / 2)
        edges.push({ id: `${root.id}>up>${pid}`, from: root.id, to: pid, path: p.d, lx: p.lx, ly: p.ly })
      }
    }
  }
  return { batches, rows, edges }
}
