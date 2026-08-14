<!--
  @ts-nocheck
  物料追溯 — 追溯树详情页
-->
<template>
  <div class="trace-detail-page">
    <div class="head-b">
      <AppBreadcrumb />
      <h1>{{ treeRoot?.nodeName || '追溯树' }}</h1>
      <p class="desc-s" v-if="rootLotNo">来料批次 {{ rootLotNo }}</p>
      <div class="head-actions">
        <el-button @click="$router.back()">← 返回列表</el-button>
        <el-button type="primary" @click="openCreateChild(null)">+ 新建根节点</el-button>
      </div>
    </div>

    <!-- 根节点摘要 -->
    <div class="card-b root-summary" v-if="treeRoot">
      <div class="summary-grid">
        <div class="sum-item"><label>节点名称</label><span>{{ treeRoot.nodeName || '—' }}</span></div>
        <div class="sum-item"><label>类型</label><span class="pill dim">{{ nodeTypeLabel(treeRoot.nodeType) }}</span></div>
        <div class="sum-item"><label>批次号</label><span>{{ treeRoot.batchNo || '—' }}</span></div>
        <div class="sum-item"><label>数量/单位</label><span>{{ treeRoot.qty != null ? treeRoot.qty + ' ' + (treeRoot.unit || '') : '—' }}</span></div>
        <div class="sum-item"><label>供应商</label><span>{{ treeRoot.supplierName || '—' }}</span></div>
        <div class="sum-item"><label>日期</label><span>{{ treeRoot.nodeDate || '—' }}</span></div>
        <div class="sum-item"><label>合格判定</label><span>{{ treeRoot.isValid || '—' }}</span></div>
        <div class="sum-item"><label>备注</label><span class="sum-remark">{{ treeRoot.remark || '—' }}</span></div>
      </div>
    </div>

    <!-- 方向追溯 -->
    <div class="card-b trace-bar">
      <span class="bar-label">方向追溯：</span>
      <el-radio-group v-model="traceDir" @change="onDirChange" size="small">
        <el-radio-button value="">完整树</el-radio-button>
        <el-radio-button value="forward">前向</el-radio-button>
        <el-radio-button value="backward">后向</el-radio-button>
        <el-radio-button value="both">双向</el-radio-button>
      </el-radio-group>
      <el-button link type="primary" size="small" style="margin-left:12px" @click="expandAll">全部展开</el-button>
      <el-button link size="small" @click="collapseAll">全部折叠</el-button>
    </div>

    <!-- 方向追溯结果 -->
    <div class="card-b dir-results" v-if="dirNodes.length">
      <div class="dir-label">追溯结果（{{ dirNodes.length }} 节点）<el-button link type="primary" size="small" style="margin-left:8px" @click="resetDir">返回完整树</el-button></div>
      <div v-for="n in dirNodes" :key="n.id" class="dir-badge" :class="'dir-'+(n.direction||'both')" @click="focusNode(n)">
        <span class="dir-arrow">{{ n.direction==='forward'?'→':n.direction==='backward'?'←':'↔' }}</span>
        <span class="dir-name">{{ n.nodeName||n.batchNo }}</span>
        <span class="dir-type">{{ nodeTypeLabel(n.nodeType) }}</span>
      </div>
    </div>

    <!-- 追溯树 -->
    <div class="card-b tree-wrap" v-loading="treeLoading">
      <template v-if="flatNodes.length">
        <div v-for="n in flatNodes" :key="n.id" class="tn-row" :class="'tn-depth-'+Math.min(n._depth||0,5)"
          :style="{paddingLeft:((n._depth||0)*28+12)+'px'}">
          <span class="tn-expand" :class="{expanded:expandedSet.has(n.id)}" @click="toggleExpand(n.id)">
            {{ expandedSet.has(n.id) ? '▾' : n.children?.length ? '▸' : '·' }}</span>
          <span class="pill dim">{{ nodeTypeLabel(n.nodeType) }}</span>
          <span class="tn-info" @click="openNodeDetail(n)">
            <span class="tn-name">{{ n.nodeName||n.batchNo||'—' }}</span>
            <span class="tn-sub" v-if="n.batchNo">{{ n.batchNo }}</span>
          </span>
          <span class="tn-supplier" v-if="n.supplierName">{{ n.supplierName }}</span>
          <span class="tn-qty" v-if="n.qty!=null">{{ n.qty }}{{ n.unit||'' }}</span>
          <span class="tn-date" v-if="n.nodeDate">{{ String(n.nodeDate).slice(0,10) }}</span>
          <span class="tn-actions">
            <el-button link type="primary" size="small" @click="openCreateChild(n)">+子节点</el-button>
            <el-button link size="small" @click="openAttachComponent(n)">挂载</el-button>
          </span>
        </div>
      </template>
      <el-empty v-else description="暂无追溯数据" :image-size="80" />
    </div>

    <!-- 节点详情 Dialog -->
    <el-dialog v-model="detailVis" title="节点详情" width="660px" destroy-on-close>
      <template v-if="curDetail">
        <el-descriptions :column="3" border size="small" title="基本信息">
          <el-descriptions-item label="名称">{{ curDetail.nodeName||'—' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ nodeTypeLabel(curDetail.nodeType) }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ curDetail.batchNo||'—' }}</el-descriptions-item>
          <el-descriptions-item label="物料编码">{{ curDetail.materialCode||'—' }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ curDetail.materialName||'—' }}</el-descriptions-item>
          <el-descriptions-item label="数量/单位">{{ curDetail.qty!=null?curDetail.qty+' '+(curDetail.unit||''):'—' }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ curDetail.supplierName||curDetail.supplierId||'—' }}</el-descriptions-item>
          <el-descriptions-item label="合格判定">{{ curDetail.isValid||'—' }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ curDetail.nodeDate||'—' }}</el-descriptions-item>
          <el-descriptions-item label="层级">{{ curDetail.treeLevel??'—' }}</el-descriptions-item>
          <el-descriptions-item label="关键件">{{ curDetail.isKeyPart?'是':'否' }}</el-descriptions-item>
          <el-descriptions-item label="序列号">{{ curDetail.serialNo||'—' }}</el-descriptions-item>
        </el-descriptions>
        <template v-if="rawDetail">
          <el-divider content-position="left">原材料明细</el-divider>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="名称">{{ rawDetail.rawMaterialName||'—' }}</el-descriptions-item>
            <el-descriptions-item label="规格">{{ rawDetail.specification||'—' }}</el-descriptions-item>
            <el-descriptions-item label="批次">{{ rawDetail.batchNo||'—' }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ rawDetail.supplierName||'—' }}</el-descriptions-item>
            <el-descriptions-item label="数量/单位">{{ rawDetail.qty!=null?rawDetail.qty+' '+(rawDetail.unit||''):'—' }}</el-descriptions-item>
            <el-descriptions-item label="合格证">{{ rawDetail.certificateNo||'—' }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <template v-if="prodDetail">
          <el-divider content-position="left">产出明细</el-divider>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="产品">{{ prodDetail.productName||'—' }}</el-descriptions-item>
            <el-descriptions-item label="规格">{{ prodDetail.specification||'—' }}</el-descriptions-item>
            <el-descriptions-item label="批次">{{ prodDetail.batchNo||'—' }}</el-descriptions-item>
            <el-descriptions-item label="产线">{{ prodDetail.productionLine||'—' }}</el-descriptions-item>
            <el-descriptions-item label="班次">{{ prodDetail.shift||'—' }}</el-descriptions-item>
            <el-descriptions-item label="操作员">{{ prodDetail.operator||'—' }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <template v-if="keyParts.length">
          <el-divider content-position="left">关键件SN</el-divider>
          <el-table :data="keyParts" size="small" border>
            <el-table-column prop="partName" label="部件" width="130" />
            <el-table-column prop="serialNo" label="序列号" width="170" />
            <el-table-column prop="batchNo" label="批次" width="120" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </template>
      </template>
      <template #footer>
        <el-button @click="detailVis=false">关闭</el-button>
        <el-button type="primary" @click="openCreateChild(curNode)">添加子节点</el-button>
        <el-button @click="openAttachComponent(curNode)">挂载组成</el-button>
      </template>
    </el-dialog>

    <!-- 新建子节点 Dialog -->
    <el-dialog v-model="childVis" :title="childParent?'添加子节点':'新建节点'" width="540px" destroy-on-close>
      <el-form :model="childForm" label-width="80px">
        <el-form-item label="类型" required><el-select v-model="childForm.nodeType" style="width:100%"><el-option v-for="o in NODE_OPTS" :key="o.v" :label="o.l" :value="o.v" /></el-select></el-form-item>
        <el-form-item label="名称" required><el-input v-model="childForm.nodeName" /></el-form-item>
        <el-form-item label="批次号"><el-input v-model="childForm.batchNo" /></el-form-item>
        <el-form-item label="物料编码"><el-input v-model="childForm.materialCode" /></el-form-item>
        <el-form-item label="数量"><el-input-number v-model="childForm.qty" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="childForm.unit" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="childForm.nodeDate" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="判定"><el-select v-model="childForm.isValid" style="width:100%"><el-option v-for="v in JUGE_OPTS" :key="v" :label="v" :value="v" /></el-select></el-form-item>
        <el-form-item label="备注"><el-input v-model="childForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="childVis=false">取消</el-button><el-button type="primary" @click="submitChild" :loading="childIng">确认</el-button></template>
    </el-dialog>

    <!-- 挂载组成 Dialog -->
    <el-dialog v-model="attachVis" title="挂载组成" width="500px" destroy-on-close>
      <el-form :model="attachForm" label-width="90px">
        <el-form-item label="挂载方式">
          <el-radio-group v-model="attachMode" size="small">
            <el-radio-button label="new">新建节点</el-radio-button>
            <el-radio-button label="ref">引用已有节点</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="attachMode==='ref'">
          <el-form-item label="选择节点" required>
            <el-select v-model="attachForm.refNodeId" style="width:100%" filterable placeholder="搜索已有节点...">
              <el-option v-for="fn in flatNodes" :key="fn.id" :label="(fn.nodeName||fn.batchNo||'') + ' [' + nodeTypeLabel(fn.nodeType) + ']'" :value="fn.id" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="类型" required><el-select v-model="attachForm.componentType" style="width:100%"><el-option label="原材料" value="raw" /><el-option label="半成品" value="semi" /><el-option label="成品出货" value="ship" /><el-option label="客户交付" value="customer" /></el-select></el-form-item>
          <el-form-item label="物料编码"><el-input v-model="attachForm.materialCode" /></el-form-item>
          <el-form-item label="物料名称" v-if="attachForm.componentType==='raw'"><el-input v-model="attachForm.materialName" /></el-form-item>
          <el-form-item label="规格型号" v-if="attachForm.componentType==='raw'"><el-input v-model="attachForm.specModel" /></el-form-item>
        </template>
        <el-form-item label="用量"><el-input-number v-model="attachForm.usageQty" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="attachForm.unit" /></el-form-item>
        <el-form-item label="工序"><el-input v-model="attachForm.processName" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="attachVis=false">取消</el-button><el-button type="primary" @click="submitAttach" :loading="attachIng">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import type { TraceNodeTreeVO, SqmTraceNode, SqmTraceRawDetail, SqmTraceProductDetail, SqmKeyPartSn, TraceDirectionNode, TraceComponentItem, TraceFullTreeVO } from '@/api/types/sqm'

const route = useRoute()
const auth = useAuthStore()
const rootLotId = ref((route.query.rootLotId as string) || '')
const rootLotNo = ref((route.query.lotNo as string) || '')
const rootNodeId = ref((route.query.rootNodeId as string) || '')

const NODE_OPTS = [{ v: 'incoming', l: '来料入库' }, { v: 'raw', l: '原材料' }, { v: 'semi', l: '半成品' }, { v: 'ship', l: '成品出货' }, { v: 'customer', l: '客户交付' }]
const JUGE_OPTS = ['合格', '资格直通', '不合格']
const TYPE_MAP: Record<string, string> = { incoming: '来料入库', raw: '原材料', semi: '半成品', ship: '成品出货', customer: '客户交付' }
const nodeTypeLabel = (t: string) => TYPE_MAP[t] || t

// 树数据
const treeLoading = ref(false)
const treeRoot = ref<TraceNodeTreeVO | null>(null)
const flatNodes = ref<(TraceNodeTreeVO & { _depth: number })[]>([])
const expandedSet = ref(new Set<string>())

function flatten(n: TraceNodeTreeVO, d: number, out: (TraceNodeTreeVO & { _depth: number })[]) {
  out.push({ ...n, _depth: d })
  if (expandedSet.value.has(n.id) && n.children?.length) n.children.forEach(c => flatten(c, d + 1, out))
}
function rebuild() { const r: (TraceNodeTreeVO & { _depth: number })[] = []; if (treeRoot.value) flatten(treeRoot.value, 0, r); flatNodes.value = r }
function toggleExpand(id: string) { if (expandedSet.value.has(id)) expandedSet.value.delete(id); else expandedSet.value.add(id); rebuild() }
function expandAll() { if (!treeRoot.value) return; const walk = (n: TraceNodeTreeVO) => { expandedSet.value.add(n.id); n.children?.forEach(walk) }; walk(treeRoot.value); rebuild() }
function collapseAll() { expandedSet.value.clear(); if (treeRoot.value) expandedSet.value.add(treeRoot.value.id); rebuild() }

// 方向追溯
const traceDir = ref('')
const dirNodes = ref<TraceDirectionNode[]>([])
async function onDirChange(v: string) { if (!v) { dirNodes.value = []; return }; const nid = treeRoot.value?.id; if (!nid) { dirNodes.value = []; return }; try { dirNodes.value = await sqmTraceApi.traceDirection(nid, v) } catch { dirNodes.value = [] } }
function resetDir() { traceDir.value = ''; dirNodes.value = [] }
function focusNode(tn: TraceDirectionNode) { resetDir(); if (!tn.id || !treeRoot.value) return; const p: string[] = []; if (findPath(treeRoot.value, tn.id, p)) { p.forEach(id => expandedSet.value.add(id)); rebuild() } }
function findPath(n: TraceNodeTreeVO, tid: string, path: string[]): boolean { if (n.id === tid) { path.push(n.id); return true }; for (const c of n.children || []) if (findPath(c, tid, path)) { path.push(n.id); return true }; return false }

// 加载树
async function loadTree() {
  treeLoading.value = true; dirNodes.value = []; traceDir.value = ''
  try {
    // 两个接口都返回 TraceFullTreeVO { tree, rootLotId, rootLotNo, ... }
    const res: TraceFullTreeVO | null = rootNodeId.value
      ? await sqmTraceApi.getFullTraceTreeByRootNode(rootNodeId.value)
      : rootLotId.value
        ? await sqmTraceApi.getFullTree(rootLotId.value)
        : null
    treeRoot.value = res?.tree ?? null
    expandedSet.value.clear()
    if (treeRoot.value) { expandedSet.value.add(treeRoot.value.id); treeRoot.value.children?.forEach(c => expandedSet.value.add(c.id)); rebuild() }
  } catch { treeRoot.value = null }
  finally { treeLoading.value = false }
}

// 详情
const detailVis = ref(false)
const curNode = ref<TraceNodeTreeVO | null>(null)
const curDetail = ref<SqmTraceNode | null>(null)
const rawDetail = ref<SqmTraceRawDetail | null>(null)
const prodDetail = ref<SqmTraceProductDetail | null>(null)
const keyParts = ref<SqmKeyPartSn[]>([])
async function openNodeDetail(n: TraceNodeTreeVO) {
  curNode.value = n; curDetail.value = null; rawDetail.value = null; prodDetail.value = null; keyParts.value = []; detailVis.value = true
  try {
    const [d, r, p, k] = await Promise.all([
      sqmTraceApi.getNodeDetail(n.id).catch(() => null),
      sqmTraceApi.getRawDetail(n.id).catch(() => null),
      sqmTraceApi.getProductDetail(n.id).catch(() => null),
      sqmTraceApi.listKeyPartSn(rootLotId.value).catch(() => []),
    ])
    curDetail.value = d; rawDetail.value = r; prodDetail.value = p; keyParts.value = k || []
  } catch { /* ignore */ }
}

// 新建子节点
const childVis = ref(false); const childIng = ref(false); const childParent = ref<TraceNodeTreeVO | null>(null)
const childForm = reactive<any>({ nodeType: 'semi', nodeName: '', batchNo: '', materialCode: '', qty: undefined, unit: '', nodeDate: '', isValid: '合格', remark: '' })
function openCreateChild(p: TraceNodeTreeVO | null) { childParent.value = p; Object.assign(childForm, { nodeType: 'semi', nodeName: '', batchNo: '', materialCode: '', qty: undefined, unit: '', nodeDate: '', isValid: '合格', remark: '' }); childVis.value = true; detailVis.value && (detailVis.value = false) }
async function submitChild() {
  if (!childForm.nodeName) return ElMessage.warning('请输入节点名称')
  if (!childForm.nodeType) return ElMessage.warning('请选择节点类型')
  childIng.value = true
  try {
    await sqmTraceApi.saveNode({
      orgId: auth.user?.orgId,
      parentNodeId: childParent.value?.id || undefined,
      rootLotId: childParent.value ? undefined : (rootLotId.value || undefined),
      nodeType: childForm.nodeType,
      nodeName: childForm.nodeName,
      batchNo: childForm.batchNo || undefined,
      materialCode: childForm.materialCode || undefined,
      qty: childForm.qty,
      unit: childForm.unit || undefined,
      nodeDate: childForm.nodeDate || undefined,
      remark: childForm.remark || undefined,
    })
    ElMessage.success('已创建')
    childVis.value = false
    loadTree()
  } catch { /* 后端已提示 */ }
  finally { childIng.value = false }
}

// 挂载
const attachVis = ref(false); const attachIng = ref(false); const attachTarget = ref<TraceNodeTreeVO | null>(null)
const attachMode = ref<'new'|'ref'>('new')
const attachForm = reactive<TraceComponentItem & { refNodeId?: string }>({ componentType: 'raw', materialCode: '', materialName: '', specModel: '', usageQty: undefined, unit: '', processName: '' })
function openAttachComponent(n: TraceNodeTreeVO | null) { attachTarget.value = n; attachMode.value = 'new'; Object.assign(attachForm, { refNodeId: '', componentType: 'raw', materialCode: '', materialName: '', specModel: '', usageQty: undefined, unit: '', processName: '' }); attachVis.value = true; detailVis.value && (detailVis.value = false) }
async function submitAttach() {
  if (!attachTarget.value) return
  if (attachMode.value === 'ref') {
    if (!attachForm.refNodeId) return ElMessage.warning('请选择引用的节点')
    attachIng.value = true
    try {
      await sqmTraceApi.attachComponent(attachTarget.value.id, { refNodeId: attachForm.refNodeId, usageQty: attachForm.usageQty, unit: attachForm.unit, processName: attachForm.processName } as any)
      ElMessage.success('已挂载')
      attachVis.value = false; loadTree()
    } catch { /* 后端已提示 */ }
    finally { attachIng.value = false }
  } else {
    attachIng.value = true
    try {
      await sqmTraceApi.attachComponent(attachTarget.value.id, { ...attachForm, refNodeId: undefined })
      ElMessage.success('已挂载')
      attachVis.value = false; loadTree()
    } catch { /* 后端已提示 */ }
    finally { attachIng.value = false }
  }
}

onMounted(() => { if (rootLotId.value || rootNodeId.value) loadTree() })
</script>

<style scoped lang="scss">
.trace-detail-page {
  .head-b { margin-bottom: 16px;
    .crumb { color: #8c8c8c; font-size: 13px; margin-bottom: 6px; .crumb-link { color: #409eff; cursor: pointer; &:hover { text-decoration: underline; } } .crumb-sep { margin: 0 4px; } }
    h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px; }
    .desc-s { color: #8c8c8c; font-size: 13px; }
    .head-actions { margin-top: 12px; display: flex; gap: 8px; }
  }
  .card-b { background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
  .root-summary .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 24px; }
  .sum-item { label { display: block; font-size: 12px; color: #8c8c8c; margin-bottom: 2px; } span { font-size: 14px; color: #1a1a1a; } .sum-remark { font-size: 13px; color: #595959; } }
  .trace-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; .bar-label { font-size: 13px; color: #595959; font-weight: 500; } }
  .dir-results { .dir-label { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; }
    .dir-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 16px; margin: 0 8px 8px 0; cursor: pointer; font-size: 13px; transition: box-shadow .2s; &:hover { box-shadow: 0 2px 8px rgba(0,0,0,.12); }
      &.dir-forward { background: #e8f5e9; border: 1px solid #81c784; .dir-arrow { color: #2e7d32; } } &.dir-backward { background: #e3f2fd; border: 1px solid #64b5f6; .dir-arrow { color: #1565c0; } } &.dir-both { background: #f3e5f5; border: 1px solid #ba68c8; .dir-arrow { color: #7b1fa2; } }
      .dir-arrow { font-weight: 700; font-size: 16px; } .dir-name { color: #1a1a1a; font-weight: 500; } .dir-type { font-size: 11px; color: #8c8c8c; }
    }
  }
  .tree-wrap { min-height: 200px; }
}

// tree rows
.tn-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-left: 2px solid transparent; margin-bottom: 2px; border-radius: 0 6px 6px 0; transition: background .15s; font-size: 13px; &:hover { background: #fafafa; .tn-actions { opacity: 1; } }
  &.tn-depth-0 { border-left-color: #409eff; } &.tn-depth-1 { border-left-color: #e6a23c; } &.tn-depth-2 { border-left-color: #67c23a; } &.tn-depth-3 { border-left-color: #909399; }
  .tn-expand { flex-shrink: 0; width: 20px; text-align: center; cursor: pointer; font-size: 12px; color: #8c8c8c; user-select: none; &.expanded { color: #409eff; } }
  .tn-info { flex: 1; min-width: 0; cursor: pointer; .tn-name { font-weight: 600; color: #1a1a1a; &:hover { color: #409eff; } } .tn-sub { display: block; font-size: 12px; color: #8c8c8c; } }
  .tn-supplier { flex-shrink: 0; font-size: 12px; color: #595959; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tn-qty { flex-shrink: 0; font-size: 12px; color: #595959; white-space: nowrap; }
  .tn-date { flex-shrink: 0; font-size: 12px; color: #8c8c8c; }
  .tn-actions { flex-shrink: 0; display: flex; gap: 4px; opacity: 0.5; transition: opacity .15s; }
}
.pill { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 500; &.dim { background: #f5f5f5; color: #595959; } }
@media (max-width: 900px) { .root-summary .summary-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
