<template>
  <div class="tg-root">
    <div class="card-head">
      <h2>批次 × 物料行 追溯图谱</h2>
      <span class="sub">BIPARTITE GENEALOGY · {{ graphStats }}</span>
    </div>
    <div v-if="showFocusTip && !highlightId" class="tg-focustip">聚焦链路模式：点击任意节点，仅显示其追溯上下游链路（方向见上方切换）</div>
    <div v-else-if="showAutoFocusTip" class="tg-focustip warn">当前追溯树较大（共 {{ totalNodes }} 个节点），已自动聚焦显示链路。点击任意节点可切换焦点，或用更精确的批号缩小范围查看全貌。</div>
    <div class="tg-graph">
      <svg v-if="renderBatches.length || renderRows.length" class="tg-svg" :viewBox="'0 0 ' + svgW + ' ' + svgH">
        <!-- column dividers (stage mode) -->
        <line v-if="layoutMode !== 'depth'" v-for="d in dividers" :key="'d' + d.x" :x1="d.x" :y1="0" :x2="d.x" :y2="svgH" class="tg-div" />
        <!-- edges -->
        <g v-for="(e, ei) in renderEdges" :key="'e' + ei" :class="edgeCls(e)" class="teg">
          <path :d="e.path" class="te" />
          <text v-if="e.label" :x="e.lx" :y="e.ly" class="teq">{{ e.label }}</text>
        </g>
        <!-- batch nodes -->
        <g v-for="b in renderBatches" :key="b.id" :class="bCls(b)" class="tn" @click="onNode(b.treeNode)">
          <rect :x="b.x" :y="b.y" :width="BW" :height="BH" rx="10" class="tn-box" />
          <text :x="b.x + 12" :y="b.y + 22" class="tn-id">{{ b.batchNo || '—' }}</text>
          <text :x="b.x + 12" :y="b.y + 38" class="tn-nm">{{ b.nodeName || '—' }}</text>
          <text :x="b.x + 12" :y="b.y + 52" class="tn-qt">{{ b.qty != null ? b.qty + (b.unit || '') : '' }}</text>
          <circle v-if="b.status" :cx="b.x + BW - 12" :cy="b.y + 12" r="5" :fill="sC(b.status)" />
        </g>
        <!-- row nodes -->
        <g v-for="r in renderRows" :key="'r' + r.id" :class="rCls(r)" class="tn tn-r" @click="onNode(r.treeNode)">
          <rect :x="r.x" :y="r.y" :width="RW" :height="RH" rx="8" class="tn-rbox" />
          <text :x="r.x + 10" :y="r.y + 20" class="tn-rnm">{{ r.nodeName || r.name || '—' }}</text>
          <text :x="r.x + 10" :y="r.y + 34" class="tn-rqt">{{ r.qty != null ? r.qty + (r.unit || '') : '' }}</text>
          <circle v-if="r.status" :cx="r.x + RW - 10" :cy="r.y + 10" r="4.5" :fill="sC(r.status)" />
        </g>
        <!-- column headers (stage mode) -->
        <text v-if="layoutMode !== 'depth'" v-for="(h, hi) in COL_HEADERS" :key="'h' + hi" :x="CX[hi]" :y="18" text-anchor="middle" class="tg-colh">{{ h }}</text>
      </svg>
      <div v-else class="tg-empty">
        <p>暂无追溯数据，可查询 物料 / 半成品 / 成品 批次开始追溯</p>
      </div>
    </div>
    <div class="tg-legend">
      <span class="tg-lg"><i class="sq" style="background:var(--white);border:1px solid var(--hairline)"></i>批次节点</span>
      <span class="tg-lg"><i class="sq" style="background:var(--paper);border:1px solid var(--hairline)"></i>物料行</span>
      <span class="tg-lg-sep"></span>
      <span class="tg-lg"><i style="background:var(--green)"></i>合格</span>
      <span class="tg-lg"><i style="background:var(--amber)"></i>待检</span>
      <span class="tg-lg"><i style="background:var(--signal-red)"></i>锁定</span>
      <span class="tg-lg-sep"></span>
      <span class="tg-lg"><i class="ln" style="background:var(--cobalt)"></i>追溯路径</span>
      <span class="tg-lg"><i class="ln ln-sec"></i>多父次关系</span>
      <span class="tg-lg"><i class="ln" style="background:var(--hairline)"></i>无关节点</span>
      <span class="tg-lg-sep"></span>
      <span class="tg-lg-note">{{ layoutMode === 'depth' ? '根→叶为层级纵深' : '左→右为物流方向' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TraceNodeTreeVO } from '@/api/types/sqm'
import { flattenTree, sC, CX, BW, BH, RW, RH, DX, LEFTM, COL_HEADERS } from './traceGraph'

// 共享追溯图谱组件：物料表(TraceView)与 MES 追溯页(MesTraceView)共用同一套 SVG 渲染、
// 配色与样式，确保两处追溯树视觉完全一致。原 TraceTreeGraph.vue 已并入本组件。
const props = withDefaults(defineProps<{
  tree: TraceNodeTreeVO | null
  /** 上游树（MES 页双向布局用，与 tree 共享同一中心节点时自动合成一张图） */
  upTree?: TraceNodeTreeVO | null
  layoutMode?: 'stage' | 'depth' | 'focus'
  /** 当前选中/聚焦节点 id（.sel 高亮、作为路径起点） */
  highlightId?: string | null
  /** 聚焦模式下要显示的节点集合；不传=显示全部 */
  visibleSet?: Set<string> | null
  /** 路径集合（.on 高亮） */
  pathSet?: Set<string> | null
  /** 物料表页签过滤：master=全部, mat=raw, semi=semi, fg=ship */
  tabFilter?: 'master' | 'mat' | 'semi' | 'fg'
  /** 是否展示"聚焦模式"提示（物料表） */
  showFocusTip?: boolean
  /** 自动聚焦提示 + 大树阈值判断（物料表） */
  autoFocus?: boolean
}>(), {
  tree: null,
  upTree: null,
  layoutMode: 'depth',
  highlightId: null,
  visibleSet: null,
  pathSet: null,
  tabFilter: 'master',
  showFocusTip: false,
  autoFocus: false,
})

const emit = defineEmits<{ (e: 'node-click', node: TraceNodeTreeVO): void }>()

const graphData = computed(() => flattenTree(props.tree, props.layoutMode, { upRoot: props.upTree }))
const rawBatches = computed(() => graphData.value.batches)
const rawRows = computed(() => graphData.value.rows)
const rawEdges = computed(() => graphData.value.edges)

const totalNodes = computed(() => rawBatches.value.length + rawRows.value.length)
const MAX_RENDER_NODES = 1500
const needAutoFocus = computed(() => props.autoFocus && totalNodes.value > MAX_RENDER_NODES)

const batches = computed(() => props.visibleSet ? rawBatches.value.filter(b => props.visibleSet!.has(b.id)) : rawBatches.value)
const rows = computed(() => props.visibleSet ? rawRows.value.filter(r => props.visibleSet!.has(r.id)) : rawRows.value)
const edgeList = computed(() => {
  const vis = new Set<string>([...batches.value.map(b => b.id), ...rows.value.map(r => r.id)])
  return rawEdges.value.filter(e => vis.has(e.from) && vis.has(e.to))
})

// ── 四表页签(tab)过滤：保留目标类型节点 + 其直接关联节点(淡化)，而非只压暗或重排 ──
// master=全部；mat=物料行(raw)+下游 semi/ship；semi=半成品(semi)+直接上下游；fg=成品(ship)+直接上下游
// 关键：保留 flattenTree 算好的真实列位(来料0/物料行1/半成品2/成品4…)，使关联边自然可见，不重排到 col0
const relVisibleIds = computed<Set<string> | null>(() => {
  if (props.tabFilter === 'master') return null
  const ids = new Set<string>()
  const addDirect = (id: string) => {
    // 直接下游(edges where from === id)
    for (const e of rawEdges.value) {
      if (e.from === id) ids.add(e.to)
    }
  }
  // 收集主类型节点 + 它们的直接下游(构成"主类型 → 下游"关联)
  const seedTypes: string[] = props.tabFilter === 'mat' ? ['raw']
    : props.tabFilter === 'semi' ? ['semi'] : ['ship']
  for (const b of batches.value) if (seedTypes.includes(b.nodeType || '')) { ids.add(b.id); addDirect(b.id) }
  for (const r of rows.value) if (seedTypes.includes(r.nodeType || '')) { ids.add(r.id); addDirect(r.id) }
  return ids
})
const renderBatches = computed<GraphBatch[]>(() => {
  if (!relVisibleIds.value) return batches.value
  return batches.value.filter(b => relVisibleIds.value!.has(b.id))
})
const renderRows = computed<GraphRow[]>(() => {
  if (!relVisibleIds.value) return rows.value
  return rows.value.filter(r => relVisibleIds.value!.has(r.id))
})
const renderEdges = computed(() => {
  if (!relVisibleIds.value) return edgeList.value
  const vis = relVisibleIds.value
  return rawEdges.value.filter(e => vis.has(e.from) && vis.has(e.to))
})

function tabOk(nt?: string): boolean {
  return props.tabFilter === 'master' || (props.tabFilter === 'mat' && nt === 'raw') || (props.tabFilter === 'semi' && nt === 'semi') || (props.tabFilter === 'fg' && nt === 'ship')
}
// 主类型节点=高亮;其直接关联(下游)节点=淡化
function isSeed(id: string): boolean {
  const seedTypes: string[] = props.tabFilter === 'mat' ? ['raw']
    : props.tabFilter === 'semi' ? ['semi'] : ['ship']
  return seedTypes.includes(nodeTypeOf(id))
}
function nodeTypeOf(id: string): string {
  const b = batches.value.find(x => x.id === id); if (b) return b.nodeType || ''
  const r = rows.value.find(x => x.id === id); return r?.nodeType || ''
}
function bCls(b: GraphBatch): string[] {
  if (b.id === props.highlightId) return ['sel']
  if (props.highlightId && props.pathSet && props.pathSet.size) return [props.pathSet.has(b.id) ? 'on' : 'dim']
  if (relVisibleIds.value) return isSeed(b.id) ? ['on'] : ['dim']
  return []
}
function rCls(r: GraphRow): string[] {
  if (r.id === props.highlightId) return ['sel']
  if (props.highlightId && props.pathSet && props.pathSet.size) return [props.pathSet.has(r.id) ? 'on' : 'dim']
  if (relVisibleIds.value) return isSeed(r.id) ? ['on'] : ['dim']
  return []
}
function edgeCls(e: GraphEdge): string[] {
  const cls: string[] = []
  if (e.secondary) cls.push('sec')
  if (props.highlightId && props.pathSet && props.pathSet.size) return [...cls, props.pathSet.has(e.from) && props.pathSet.has(e.to) ? 'on' : 'dim']
  if (relVisibleIds.value) return isSeed(e.from) || isSeed(e.to) ? cls : ['dim']
  return cls
}

const svgW = computed(() => {
  if (props.layoutMode === 'depth') {
    const maxD = Math.max(0, ...renderBatches.value.map(b => b.depth ?? 0), ...renderRows.value.map(r => r.depth ?? 0))
    return LEFTM + (maxD + 1) * DX + 40
  }
  return CX[CX.length - 1] + BW + 40
})
const svgH = computed(() => {
  const my = Math.max(0, ...renderBatches.value.map(b => b.y + BH), ...renderRows.value.map(r => r.y + RH))
  return Math.max(my, 300) + 40
})
const dividers = computed(() => props.layoutMode === 'depth' ? [] : CX.slice(1).map(x => ({ x: x - 10 })))
const graphStats = computed(() => `${renderBatches.value.length}批次 · ${renderRows.value.length}物料行 · ${renderEdges.value.length}流转`)
const showAutoFocusTip = computed(() => needAutoFocus.value)

function onNode(node?: TraceNodeTreeVO) {
  if (node) emit('node-click', node)
}
</script>

<style scoped>
/* ═══════════════════ 设计变量(物料表与 MES 页共用) ═══════════════════ */
.tg-root {
  --paper:#f8f7f4;--white:#fff;--ink:#141414;--ink-soft:#5c5c5c;--ink-faint:#9e9e9e;
  --hairline:#e4e2dd;--cobalt:#0047ab;--cobalt-dim:#eef3fa;
  --signal-red:#e03616;--signal-red-dim:#fdf0ed;--amber:#c77800;--amber-dim:#fdf6e9;
  --green:#1a7f4b;--green-dim:#edf7f1;
  background: var(--white); border: 1px solid var(--hairline); border-radius: 12px; padding: 16px 18px;
}
.card-head { display: flex; justify-content: space-between; align-items: baseline; padding: 0 2px 12px; border-bottom: 1px solid var(--hairline); }
.card-head h2 { font-size: 16px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
.card-head .sub { font-size: 11px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: .04em; }

.tg-focustip { padding: 10px 16px; margin-bottom: 12px; font-size: 12px; color: var(--cobalt); background: rgba(0,71,171,.06); border: 1px dashed var(--cobalt); border-radius: 8px; }
.tg-focustip.warn { color: var(--amber); background: var(--amber-dim); border-color: var(--amber); }

.tg-graph { position: relative; min-height: 320px; overflow-x: auto; overflow-y: auto; max-height: 68vh; }
.tg-svg { width: 100%; min-width: 900px; }
.tg-div { stroke: var(--hairline); stroke-width: 1; stroke-dasharray: 6 4; }
.tg-colh { font-size: 11px; font-weight: 700; fill: var(--ink-soft); letter-spacing: .03em; }

/* edges */
.teg .te { fill: none; stroke: var(--hairline); stroke-width: 1.6; transition: stroke .25s, opacity .25s; }
.teg.on .te { stroke: var(--cobalt); stroke-width: 2.2; opacity: 1; }
.teg.dim .te { opacity: .12; }
.teg.sec .te { stroke: var(--cobalt); stroke-width: 1.3; stroke-dasharray: 5 4; opacity: .4; }
.teg.sec.on .te { opacity: .9; }
.teq { font-size: 10px; fill: var(--ink-faint); text-anchor: middle; transition: fill .25s, opacity .25s; }
.teg.on .teq { fill: var(--cobalt); font-weight: 700; }
.teg.dim .teq { opacity: .15; }
.teg.sec .teq { opacity: .4; }

/* batch nodes */
.tn { cursor: pointer; transition: opacity .25s; }
.tn-box { fill: var(--white); stroke: var(--hairline); stroke-width: 1.5; transition: stroke .2s, fill .2s, filter .2s; }
.tn.on .tn-box { stroke: var(--cobalt); stroke-width: 2.2; }
.tn.sel .tn-box { stroke: var(--cobalt); stroke-width: 2.8; filter: drop-shadow(0 4px 12px rgba(0,71,171,.18)); }
.tn.dim .tn-box { opacity: .28; }
.tn-id { font-size: 10px; font-weight: 700; fill: var(--ink); letter-spacing: .01em; text-transform: uppercase; }
.tn-nm { font-size: 11px; fill: var(--ink-soft); overflow: hidden; }
.tn-qt { font-size: 11px; font-weight: 600; fill: var(--cobalt); }
.tn.on .tn-id { fill: var(--cobalt); }
.tn.sel .tn-id { fill: var(--cobalt); font-size: 11px; }
.tn.dim .tn-id, .tn.dim .tn-nm, .tn.dim .tn-qt { opacity: .2; }

/* row nodes */
.tn-rbox { fill: var(--paper); stroke: var(--hairline); stroke-width: 1.2; transition: stroke .2s, fill .2s, opacity .25s; }
.tn-r.on .tn-rbox { stroke: var(--cobalt); stroke-width: 2; }
.tn-r.sel .tn-rbox { stroke: var(--cobalt); stroke-width: 2.5; filter: drop-shadow(0 3px 8px rgba(0,71,171,.14)); }
.tn-r.dim .tn-rbox { opacity: .25; }
.tn-rnm { font-size: 10px; font-weight: 600; fill: var(--ink-soft); }
.tn-rqt { font-size: 10px; fill: var(--ink-faint); }
.tn-r.on .tn-rnm { fill: var(--cobalt); }
.tn-r.sel .tn-rnm { fill: var(--cobalt); font-weight: 700; }

/* legend */
.tg-legend { display: flex; align-items: center; gap: 14px; padding-top: 12px; margin-top: 12px; border-top: 1px solid var(--hairline); font-size: 11px; color: var(--ink-soft); flex-wrap: wrap; }
.tg-lg { display: inline-flex; align-items: center; gap: 5px; }
.tg-lg i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
.tg-lg i.ln { width: 18px; height: 3px; border-radius: 2px; }
.tg-lg i.ln-sec { width: 18px; height: 0; border-top: 2px dashed var(--cobalt); opacity: .55; }
.tg-lg i.sq { width: 10px; height: 10px; border-radius: 2px; }
.tg-lg-sep { width: 1px; height: 14px; background: var(--hairline); }
.tg-lg-note { font-size: 10px; color: var(--ink-faint); margin-left: auto; }

/* empty */
.tg-empty { display: flex; align-items: center; justify-content: center; height: 320px; color: var(--ink-faint); font-size: 14px; }
</style>
