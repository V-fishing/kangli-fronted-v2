<template>
  <div class="param-list">
    <div class="head-b"><AppBreadcrumb /><h1>SPC 参数</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="视图">
          <el-radio-group v-model="viewMode">
            <el-radio-button value="first">首件 SPC</el-radio-button>
            <el-radio-button value="sample">产品抽样 SPC</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="产品料号"><el-input v-model="filterProduct" clearable placeholder="搜索产品料号/名称" style="width:200px" @keyup.enter="fetchData" /></el-form-item>
        <el-form-item label="工序">
          <el-select v-model="filterProcName" clearable placeholder="全部" style="width:180px">
            <el-option v-for="p in procOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="viewMode === 'first'" label="参数名"><el-input v-model="filterParamName" clearable placeholder="搜索" style="width:180px" /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button v-if="filterProduct" @click="clearProduct">清除产品筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="card-b">
      <!-- 首件 SPC:新建参数按钮 -->
      <div v-if="viewMode === 'first'" style="margin-bottom:12px">
        <el-button type="primary" @click="openCreate()">+ 新建参数</el-button>
      </div>
      <!-- 产品抽样 SPC:创建抽样任务按钮 -->
      <div v-else style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between">
        <span class="block-title">抽样任务参数</span>
        <el-button type="primary" size="small" @click="router.push('/spc/sample-tasks')">+ 创建抽样任务</el-button>
      </div>

      <!-- 统一分组表格:首件=产品分组→参数行;抽样=产品分组→(有抽样任务的)参数行 -->
      <el-table :data="renderRows" :span-method="spanMethod" v-loading="loading" size="small"
                :row-key="rowKey" :row-class-name="rowClassName">
        <el-table-column label="产品 / 参数" min-width="200">
          <template #default="{row}">
            <template v-if="isGroupNode(row)">
              <div class="prod-node">
                <span class="prod-name">{{ row.productName }}</span>
                <span class="prod-part mono" v-if="row.partNo">{{ row.partNo }}</span>
                <span class="prod-kind" v-if="row.kind">{{ kindLabel(row.kind) }}</span>
                <span class="prod-src" v-if="row.srcLabel">{{ row.srcLabel }}</span>
                <span class="prod-count">{{ row.count }} 个参数</span>
              </div>
            </template>
            <template v-else>
              <span>{{ row.paramName }}</span>
            </template>
          </template>
        </el-table-column>

        <el-table-column prop="procName" label="工序" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="规格下限" width="100">
          <template #default="{row}"><span v-if="!isGroupNode(row)" class="mono">{{ row.specLower }}</span></template>
        </el-table-column>
        <el-table-column label="规格上限" width="100">
          <template #default="{row}"><span v-if="!isGroupNode(row)" class="mono">{{ row.specUpper }}</span></template>
        </el-table-column>
        <el-table-column label="目标值" width="100">
          <template #default="{row}"><span v-if="!isGroupNode(row)" class="mono">{{ row.targetValue ?? '—' }}</span></template>
        </el-table-column>
        <el-table-column prop="subgroupSize" label="子组大小" width="90" />
        <!-- 图类型: 主图(mono) + 候选 tag, 按标准库推荐集合展示 -->
        <el-table-column label="图类型" min-width="160">
          <template #default="{row}">
            <span v-if="!isGroupNode(row)">
              <span class="mono chart-main">{{ row.chartType || '—' }}</span>
              <span v-for="c in chartCandidateList(row)" :key="c" class="chart-tag" :class="{ 'is-primary': c === row.chartType }">{{ c }}</span>
            </span>
          </template>
        </el-table-column>

        <!-- 状态列(仅抽样视图:填任务状态) -->
        <el-table-column v-if="viewMode === 'sample'" label="状态" width="90">
          <template #default="{row}">
            <span v-if="!isGroupNode(row)">
              <span v-if="row._task" class="pill" :class="statusPill(row._task.status)"><span class="d"></span>{{ row._task.status }}</span>
              <span v-else class="muted">—</span>
            </span>
          </template>
        </el-table-column>
        <!-- 进度列(仅抽样视图:填 当前/目标) -->
        <el-table-column v-if="viewMode === 'sample'" label="进度" width="100">
          <template #default="{row}">
            <span v-if="!isGroupNode(row)">
              <span v-if="row._task" class="mono" :class="row._task.targetCount > 0 && row._task.currentCount >= row._task.targetCount ? 'c-green' : ''">
                {{ row._task.currentCount }} / {{ row._task.targetCount > 0 ? row._task.targetCount : '不限' }}
              </span>
              <span v-else class="muted">—</span>
            </span>
          </template>
        </el-table-column>

        <!-- 操作列(两视图按钮集合完全一致:去采集/控制图/编辑/删除;位置固定不位移) -->
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{row}">
            <span v-if="!isGroupNode(row)" style="white-space:nowrap">
              <el-button v-if="row._task" link type="primary" size="small"
                         @click="router.push({ path: `/spc/sample-collect/${row._task.id}` })">去采集</el-button>
              <el-button link type="primary" size="small" @click="goChart(row)">控制图</el-button>
              <el-button link type="warning" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑参数' : '新建参数'" width="480px" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="参数名" required><el-input v-model="form.paramName" /></el-form-item>
        <el-form-item label="工序"><el-input v-model="form.procName" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item>
        <el-form-item v-if="needsSpec" label="规格下限"><el-input-number v-model="form.specLower" :step="0.01" /></el-form-item>
        <el-form-item v-if="needsSpec" label="规格上限"><el-input-number v-model="form.specUpper" :step="0.01" /></el-form-item>
        <el-form-item v-if="needsSpec" label="目标值"><el-input-number v-model="form.targetValue" :step="0.01" /></el-form-item>
        <el-form-item label="子组大小"><el-input-number v-model="form.subgroupSize" :min="2" :max="10" /></el-form-item>
        <el-form-item label="采集频率"><el-input v-model="form.collectFreq" /></el-form-item>
        <el-form-item label="控制图类型">
          <el-select v-model="chartCandidateArr" multiple collapse-tags collapse-tags-tooltip style="width:100%" placeholder="选择该参数需要绘制的控制图（可多选）">
            <el-option v-for="c in chartTypes" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
          <span class="hint">可多选基础图：如勾选 Xbar+R 等同原 Xbar-R；勾选 Xbar+R+S 即同时挂 Xbar-R 与 Xbar-S 两种方案，控制图页按勾选项各展示一张独立卡片（同类不重复）</span>
        </el-form-item>
        <el-divider content-position="left">能力计算配置</el-divider>
        <el-form-item label="σ 算法">
          <el-select v-model="form.sigmaMethod" style="width:100%">
            <el-option label="组内 (within)" value="within" />
            <el-option label="整体 (overall)" value="overall" />
          </el-select>
        </el-form-item>
        <el-form-item label="σ 倍数 k">
          <el-input-number v-model="form.sigmaK" :min="1" :max="5" :step="0.1" />
          <span class="hint">控制限/能力指数 σ 倍数(默认 3)</span>
        </el-form-item>
        <el-form-item label="CPK 周期">
          <el-select v-model="form.cpkPeriod" clearable style="width:100%">
            <el-option label="不自动" value="" />
            <el-option label="批次" value="批次" />
            <el-option label="日" value="日" />
            <el-option label="周" value="周" />
          </el-select>
        </el-form-item>
        <el-form-item label="激活"><el-switch v-model="form.isActive" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck -- el-select v-model 与 Element Plus EpPropMergeType 严格类型不兼容,运行时正常
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcSampleTaskApi } from '@/api/modules/spc/sampleTasks'
import type { SpcParam, SpcSampleTask } from '@/api/types/spc'

// 基础图码(单一体系): 直接勾选需要绘制的基础控制图, 控制图页按勾选项各渲染一张卡。
// 取代原 Xbar-R/Xbar-S/I-MR 组合码, 避免"组合码"与"基础图码"两套重复权限码。
const chartTypes = [
  { label: 'Xbar (均值)', value: 'Xbar' },
  { label: 'R (极差)', value: 'R' },
  { label: 'S (标准差)', value: 'S' },
  { label: 'I (单值)', value: 'I' },
  { label: 'MR (移动极差)', value: 'MR' },
  { label: 'P (不合格品率)', value: 'P' },
  { label: 'NP (不合格品数)', value: 'NP' },
  { label: 'C (缺陷数)', value: 'C' },
  { label: 'U (单位缺陷数)', value: 'U' },
]

// 参数行候选控制图集合(来自 chartCandidates 逗号串),列表展示用
function chartCandidateList(row: any): string[] {
  if (!row.chartCandidates) return []
  return String(row.chartCandidates).split(',').map((s: string) => s.trim()).filter(Boolean)
}

// 编辑弹窗: 多选控制图类型 <-> chartCandidates 逗号串 桥接; 同时把首个值回填 chartType(主图,向后兼容)
const chartCandidateArr = computed<string[]>({
  get() {
    const raw = (form as any).chartCandidates
    if (!raw) return []
    return String(raw).split(',').map((s: string) => s.trim()).filter(Boolean)
  },
  set(val: string[]) {
    const arr = (val || []).filter(Boolean)
    ;(form as any).chartCandidates = arr.join(',')
    ;(form as any).chartType = arr[0] || 'Xbar'
  },
})

// 是否需要规格上下限/目标值:仅当勾选的图含计量型(均值/极差/标准差/单值/移动极差)时才有意义;
// 纯计数型(P/NP/C/U)控制限基于过程不合格率/缺陷率,无规格上下限概念,编辑时隐藏这些字段。
const MEASURE_KINDS = ['Xbar', 'R', 'S', 'I', 'MR']
const needsSpec = computed(() => chartCandidateArr.value.some(k => MEASURE_KINDS.includes(k)))

const router = useRouter()
const route = useRoute()
// 视图切换:首件 SPC / 产品抽样 SPC(与筛选条件同级);路由 ?view=sample 默认切抽样
const viewMode = ref<string>((route.query.view as string) === 'sample' ? 'sample' : 'first')

const paramList = ref<SpcParam[]>([])
const sampleTasks = ref<SpcSampleTask[]>([])
const loading = ref(false)
const filterProduct = ref('')
const filterParamName = ref('')
const filterProcName = ref<any>('')
const procOptions = computed(() => {
  const src = viewMode.value === 'first' ? paramList.value : sampleTasks.value
  return [...new Set(src.map((p: any) => p.procName).filter(Boolean))].sort()
})
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const form = reactive<Partial<SpcParam>>({ paramName: '', subgroupSize: 5, isActive: true })

// ── 分组结构(两种视图均为:产品为父 → 参数为子) ──
interface GroupNode { isGroup: true; gkey: string; productName: string; partNo?: string; kind?: string; count: number; srcLabel?: string }
// 抽样视图的参数行挂载关联的抽样任务(_task)
type ParamRow = SpcParam & { _task?: SpcSampleTask }
type Row = ParamRow | GroupNode
const isGroupNode = (r: Row): r is GroupNode => (r as GroupNode).isGroup === true

const renderRows = computed<Row[]>(() => {
  const rows: Row[] = []
  const map = new Map<string, { node: GroupNode; params: ParamRow[] }>()
  const keyOf = (prod: { productName?: string; partNo?: string }) => `${prod.productName || '未绑定产品'}|${prod.partNo || ''}`

  // 把首件参数按 products 数组展开成「产品 → 参数」分组;无 products 落入「未绑定产品」
  function addFirstParam(p: ParamRow) {
    const prods = (p.products && p.products.length) ? p.products : [{ productName: p.productName || '', partNo: p.partNo || '', kind: (p as any).kind }]
    for (const prod of prods) {
      if (filterProduct.value && !((prod.productName || '').includes(filterProduct.value) || (prod.partNo || '').includes(filterProduct.value))) continue
      if (filterParamName.value && !(p.paramName || '').includes(filterParamName.value)) continue
      if (filterProcName.value && p.procName !== filterProcName.value) continue
      const key = keyOf(prod)
      let g = map.get(key)
      if (!g) {
        const node = { isGroup: true, gkey: key, productName: prod.productName || '未绑定产品', partNo: prod.partNo || '', kind: prod.kind, count: 0 } as GroupNode
        g = { node, params: [] }
        map.set(key, g)
      }
      if (!g.params.includes(p)) g.params.push(p)
    }
  }

  // 抽样视图:仅展示"有抽样任务关联"的参数,分组键优先取参数的 products(保证中文正常),
  // 任务名仅用于状态/进度/工序回填;任务里可能因历史编码问题存了乱码
  function addSampleParam(p: ParamRow, t: SpcSampleTask) {
    if (!t) return  // 无关联抽样任务的参数(SAMPLE 孤儿)不进入抽样视图
    const base = (p.products && p.products.length) ? p.products[0] : { productName: p.productName || '', partNo: p.partNo || '', kind: (p as any).kind }
    const prod = {
      productName: base.productName || t.productName || p.productName || '',
      partNo: base.partNo || t.partNo || p.partNo || '',
      kind: base.kind || (p as any).kind,
    }
    if (filterProduct.value && !((prod.productName || '').includes(filterProduct.value) || (prod.partNo || '').includes(filterProduct.value))) return
    if (filterProcName.value && t.procName !== filterProcName.value) return
    const key = keyOf(prod)
    let g = map.get(key)
    if (!g) {
      const node = { isGroup: true, gkey: key, productName: prod.productName || '未绑定产品', partNo: prod.partNo || '', kind: prod.kind, count: 0 } as GroupNode
      g = { node, params: [] }
      map.set(key, g)
    }
    if (!g.params.some(x => x.id === p.id)) g.params.push({ ...p, productName: prod.productName, partNo: prod.partNo, procName: t.procName || p.procName, _task: t })
  }

  if (viewMode.value === 'first') {
    // 首件视图:展示首件派生的参数(FIA_FIRST / MANUAL / 工装 TOOLING 一并归入);
    // 工装通过"工装首件任务"这一条渠道进入 SPC,本质是首件视图的一部分,不再单独拆分。
    // 抽样流程派生的参数(paramSource=SAMPLE)严格隔离在"产品抽样 SPC"视图,不污染首件视图。
    const sampledParamIds = new Set(sampleTasks.value.map(t => t.paramId))
    paramList.value
      .filter(p => {
        if (sampledParamIds.has(p.id)) return false
        const src = p.paramSource || 'FIA_FIRST'
        return src === 'FIA_FIRST' || src === 'MANUAL' || src === 'TOOLING'
      })
      .forEach(addFirstParam)
  } else {
    // 抽样视图:仅展示"有抽样任务引用"的参数(任务 paramId 集合为唯一判定,与首件视图隔离)
    const byParam = new Map<string, SpcSampleTask>()
    for (const t of sampleTasks.value) if (!byParam.has(t.paramId)) byParam.set(t.paramId, t)
    paramList.value
      .filter(p => byParam.has(p.id))
      .forEach(p => addSampleParam(p, byParam.get(p.id)!))
  }

  // 保持首次出现顺序(按 map 首次写入顺序)
  map.forEach(g => {
    g.node.count = g.params.length
    rows.push(g.node)
    g.params.forEach(p => rows.push(p))
  })
  return rows
})
const groupSpans = computed<Record<number, number>>(() => {
  const m: Record<number, number> = {}
  renderRows.value.forEach((r, i) => { if (isGroupNode(r)) m[i] = (r as GroupNode).count })
  return m
})

function kindLabel(k?: string) {
  return ({ material: '物料', semi: '半成品', product: '成品' }[k || ''] || (k || ''))
}
function rowKey(row: Row) { return isGroupNode(row) ? `g-${row.gkey}` : (row as ParamRow).id }
function rowClassName({ row }: { row: Row }) { return isGroupNode(row) ? 'grp-row' : '' }
// 产品节点行(第一级)作为整行分组标题:第0列跨满中间列,第8列(fixed-right 操作列)悬浮不滑动
// 首件视图 8 列(含目标值,无状态/进度):第0列跨 7(0-6);抽样视图 10 列,第0列跨 9(0-8)
const MID_COLS = computed(() => (viewMode.value === 'sample' ? 9 : 7))
function spanMethod({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) {
  if (groupSpans.value[rowIndex] !== undefined) {
    if (columnIndex === 0) return { rowspan: 1, colspan: MID_COLS.value }    // 跨满中间列
    if (columnIndex >= 1 && columnIndex < MID_COLS.value) return { rowspan: 0, colspan: 0 } // 被第0列覆盖
    // 最后一列(fixed-right 操作列): 保持独立渲染, 产品行由全局样式隐藏
  }
  return { rowspan: 1, colspan: 1 }
}

async function fetchData() {
  loading.value = true
  try {
    // 两种视图都需要参数全量(用于分组与回填)
    // 首件视图不再做来源筛选(工装参数经"工装首件任务"渠道并入首件视图,统一展示);
    // 抽样流程派生的参数靠 renderRows 的 in-memory 过滤与抽样视图隔离。
    const all = await spcParamApi.list({
      productName: filterProduct.value || undefined,
      procName: filterProcName.value || undefined,
    })
    paramList.value = all.filter(r => !filterParamName.value || (r.paramName || '').includes(filterParamName.value))
    // 始终拉取抽样任务,用于:抽样视图按任务分组 + 首件视图排除已被抽样任务占用的参数
    sampleTasks.value = await spcSampleTaskApi.list()
  } finally { loading.value = false }
}
function clearProduct() { filterProduct.value = ''; fetchData() }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { paramName: '', procName: '', unit: '', specLower: undefined, specUpper: undefined, targetValue: undefined, subgroupSize: 5, collectFreq: '', chartType: 'Xbar', chartCandidates: 'Xbar,R', isActive: true, sigmaMethod: 'within', sigmaK: 3, cpkPeriod: '' }); dialogVisible.value = true }
function openEdit(row: SpcParam) {
  isEdit.value = true
  editId.value = row.id
  // 关键:用 plain copy 而非 Object.assign(form, row)。
  // row 上 products 等为引用类型,直接 Object.assign 会让 form 与列表行共享引用,
  // 连续编辑两条参数时上次的内存对象残留,导致弹窗显示上一条的数据。
  Object.keys(form).forEach(k => delete (form as any)[k])
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}
async function handleSubmit() {
  if (isEdit.value) { await spcParamApi.update(editId.value, form); ElMessage.success('已更新') }
  else { await spcParamApi.create(form); ElMessage.success('已创建') }
  dialogVisible.value = false; fetchData()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await spcParamApi.delete(id); ElMessage.success('已删除'); fetchData() }
function goChart(row: ParamRow) {
  // 首件视图:首件能力验证(FIRST);抽样视图:量产监控(ROUTINE)+ 抽样任务过滤
  const q: any = { stage: viewMode.value === 'sample' ? 'ROUTINE' : 'FIRST' }
  if (row._task) q.sampleTaskId = row._task.id
  router.push({ path: `/spc/params/${row.id}`, query: q })
}
// 切换视图时重新拉取对应数据
watch(viewMode, fetchData)

function statusPill(s?: string) {
  if (s === '已结案') return 'p-done'
  if (s === '采集中') return 'p-run'
  return 'p-wait'
}
onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.block-title { font-family: $font-display; font-size: 15px; font-weight: 700; color: $ink; margin: 0; }
.mono { font-family: $font-mono; }
.muted { color: $ink-faint; }
// 图类型列: 主图 + 候选 tag
.chart-main { font-weight: 600; color: $ink; margin-right: 6px; }
.chart-tag {
  display: inline-block; font-family: $font-mono; font-size: 11px; line-height: 1;
  padding: 3px 6px; margin: 2px 4px 2px 0; border-radius: 4px;
  background: $hairline-soft; color: $ink-soft;
}
.chart-tag.is-primary { background: $cobalt-dim; color: $cobalt; font-weight: 600; }
.c-green { color: $green; }
.c-red { color: $signal-red; }
.prod-node { display: flex; align-items: center; gap: 10px; }
.prod-name { font-family: $font-display; font-size: 15px; font-weight: 700; color: $ink; }
.prod-part { font-size: 12px; color: $ink-faint; font-family: $font-mono; }
.prod-kind { font-size: 11px; padding: 1px 8px; border-radius: 4px; background: $cobalt-dim; color: $cobalt; }
.prod-count { font-size: 11px; color: $ink-soft; }
:deep(.el-table__row.grp-row) td.el-table__cell { background: $hairline-soft; }
:deep(.el-table__row.grp-row) td.el-table__cell:first-child { border-left: 3px solid $cobalt; }
.prod-node { display: flex; align-items: center; gap: 10px; padding: 2px 0 2px 14px; }
.prod-name { font-family: $font-display; font-size: 15px; font-weight: 700; color: $ink; }
// 参数行缩进,体现"产品 → 参数"父子级
:deep(.el-table__row:not(.grp-row)) td.el-table__cell:first-child .cell { padding-left: 32px; position: relative; }
:deep(.el-table__row:not(.grp-row)) td.el-table__cell:first-child .cell::before {
  content: ''; position: absolute; left: 14px; top: 50%; width: 10px; height: 1px; background: $hairline;
}
</style>

<!-- 非 scoped:隐藏产品分组行在 fixed 右列(操作列)上的空白 cell,避免分组行右侧出现空洞 -->
<style lang="scss">
.param-list .el-table__row.grp-row td.el-table-fixed-column--right {
  visibility: hidden;
}
</style>
