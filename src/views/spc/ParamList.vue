<template>
  <div class="param-list">
    <div class="head-b"><AppBreadcrumb /><h1>SPC 参数</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="来源">
          <el-select v-model="filterSource" clearable placeholder="全部" style="width:160px">
            <el-option label="产线首件" value="FIA" />
            <el-option label="工装首件" value="TOOLING" />
            <el-option label="产品抽样" value="SAMPLE" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品料号"><el-input v-model="filterProduct" clearable placeholder="搜索产品料号/名称" style="width:200px" @keyup.enter="fetchData" /></el-form-item>
        <el-form-item label="工序">
          <el-select v-model="filterProcName" clearable placeholder="全部" style="width:180px">
            <el-option v-for="p in procOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数名"><el-input v-model="filterParamName" clearable placeholder="搜索" style="width:180px" /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button v-if="filterProduct" @click="clearProduct">清除产品筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="card-b">
      <!-- 新建入口:手动建参(归产线首件) + 创建抽样任务(走独立流程) -->
      <div style="margin-bottom:12px; display:flex; align-items:center; gap:12px">
        <el-button type="primary" v-if="canCreateParam" @click="openCreate()">+ 新建参数</el-button>
        <el-button type="primary" size="small" @click="router.push('/spc/sample-tasks')">+ 创建抽样任务</el-button>
      </div>

      <!-- 统一参数表:平铺所有来源(产线首件/工装首件/产品抽样),每行一条参数,列表仅展示关键字段 -->
      <el-table :data="pagedRows" v-loading="loading" size="small">
        <el-table-column label="来源" width="110">
          <template #default="{row}"><span class="src-tag">{{ row.srcLabel }}</span></template>
        </el-table-column>
        <el-table-column prop="productName" label="产品" min-width="150" show-overflow-tooltip />
        <el-table-column prop="partNo" label="料号" width="130">
          <template #default="{row}"><span class="mono" v-if="row.partNo">{{ row.partNo }}</span><span v-else class="muted">—</span></template>
        </el-table-column>
        <el-table-column prop="paramName" label="参数名" min-width="140" show-overflow-tooltip />
        <el-table-column prop="procName" label="工序" width="120" />
        <!-- 状态列:抽样任务参数填任务状态(采集中/已结案),首件类参数统一显示"已建参"(标准已生效),整列均为胶囊无空置 -->
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <span v-if="row._task" class="pill" :class="statusPill(row._task.status)"><span class="d"></span>{{ row._task.status }}</span>
            <span v-else class="pill p-wait"><span class="d"></span>已建参</span>
          </template>
        </el-table-column>

        <!-- 操作列:详情(打开详情弹窗,内聚全部字段与操作)/控制图 -->
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <span style="white-space:nowrap">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" size="small" @click="goChart(row)">控制图</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex; justify-content:flex-end; padding:14px 22px 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="flatRows.length"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
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

    <!-- 参数详情:列表仅展示关键字段,其余字段在此集中呈现 -->
    <el-dialog v-model="detailVisible" title="参数详情" width="560px" append-to-body>
      <el-descriptions :column="2" border size="small" v-if="detailRow">
        <el-descriptions-item label="产品">{{ detailRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="料号"><span class="mono">{{ detailRow.partNo || '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="参数名">{{ detailRow.paramName }}</el-descriptions-item>
        <el-descriptions-item label="工序">{{ detailRow.procName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源"><span class="src-tag">{{ detailRow.srcLabel }}</span></el-descriptions-item>
        <el-descriptions-item label="单位">{{ detailRow.unit || '—' }}</el-descriptions-item>
        <el-descriptions-item label="规格下限"><span class="mono">{{ detailRow.specLower ?? '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="规格上限"><span class="mono">{{ detailRow.specUpper ?? '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="目标值"><span class="mono">{{ detailRow.targetValue ?? '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="子组大小">{{ detailRow.subgroupSize }}</el-descriptions-item>
        <el-descriptions-item label="图类型" :span="2">
          <span class="mono chart-main">{{ detailRow.chartType || '—' }}</span>
          <span v-for="c in chartCandidateList(detailRow)" :key="c" class="chart-tag" :class="{ 'is-primary': c === detailRow.chartType }">{{ c }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="采集频率">{{ detailRow.collectFreq || '—' }}</el-descriptions-item>
        <el-descriptions-item label="σ 算法">{{ detailRow.sigmaMethod || '—' }}</el-descriptions-item>
        <el-descriptions-item label="σ 倍数 k">{{ detailRow.sigmaK ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="CPK 周期">{{ detailRow.cpkPeriod || '不自动' }}</el-descriptions-item>
        <el-descriptions-item label="激活">{{ detailRow.isActive ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span v-if="detailRow._task" class="pill" :class="statusPill(detailRow._task.status)"><span class="d"></span>{{ detailRow._task.status }}</span>
          <span v-else class="pill p-wait"><span class="d"></span>已建参</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailRow._task" label="采集进度">
          <span class="mono" :class="detailRow._task.targetCount > 0 && detailRow._task.currentCount >= detailRow._task.targetCount ? 'c-green' : ''">
            {{ detailRow._task.currentCount }} / {{ detailRow._task.targetCount > 0 ? detailRow._task.targetCount : '不限' }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" size="small" @click="goCollect(detailRow)">去采集</el-button>
        <el-button type="primary" size="small" @click="goChart(detailRow)">控制图</el-button>
        <el-button type="warning" size="small" v-if="canCreateParam" @click="openEdit(detailRow); detailVisible=false">编辑</el-button>
        <el-button type="danger" size="small" v-if="canDeleteParam" @click="handleDelete(detailRow.id); detailVisible=false">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck -- el-select v-model 与 Element Plus EpPropMergeType 严格类型不兼容,运行时正常
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcSampleTaskApi } from '@/api/modules/spc/sampleTasks'
import type { SpcParam, SpcSampleTask } from '@/api/types/spc'

// 基础图码(单一体系): 直接勾选需要绘制的基础控制图, 控制图页按勾选项各渲染一张卡。
// 取代原 Xbar-R/Xbar-S/I-MR 组合码, 避免"组合码"与"基础图码"两套重复权限码。
const ALL_CHART_TYPES = [
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
const MEASURE_VALUES = ['Xbar', 'R', 'S', 'I', 'MR']
const COUNT_VALUES = ['P', 'NP', 'C', 'U']

// 编辑弹窗可选的图类型: 根据当前已选图集自动收窄为单一数据类型,
// 避免计量型(Xbar/R/S/I/MR)与计数型(P/NP/C/U)混杂(后端亦会拦截混选)。
const chartTypes = computed(() => {
  const sel = chartCandidateArr.value
  const hasMeasure = sel.some(v => MEASURE_VALUES.includes(v))
  const hasCount = sel.some(v => COUNT_VALUES.includes(v))
  if (hasMeasure && !hasCount) return ALL_CHART_TYPES.filter(c => MEASURE_VALUES.includes(c.value))
  if (hasCount && !hasMeasure) return ALL_CHART_TYPES.filter(c => COUNT_VALUES.includes(c.value))
  // 尚未选择任何图: 展示全量,让用户先确定一类
  return ALL_CHART_TYPES
})

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
const perm = usePermissionStore()
// 参数增删改按钮权限(后端 spc.param.create/delete 守卫)
const canCreateParam = computed(() => perm.has('spc.param.create'))
const canDeleteParam = computed(() => perm.has('spc.param.delete'))
// 视图切换:首件 SPC / 产品抽样 SPC(与筛选条件同级);路由 ?view=sample 默认切抽样

const paramList = ref<SpcParam[]>([])
const sampleTasks = ref<SpcSampleTask[]>([])
const loading = ref(false)
// 前端分页:flatRows 为内存合并+筛选后的完整结果,pagedRows 按页码切片展示
const currentPage = ref(1)
const pageSize = ref(20)
const pagedRows = computed<ParamRow[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return flatRows.value.slice(start, start + pageSize.value)
})
const filterProduct = ref('')
const filterParamName = ref('')
const filterProcName = ref<any>('')
// 来源筛选:全部(空)/产线首件(FIA)/工装首件(TOOLING)/产品抽样(SAMPLE)
const filterSource = ref('')
// 任一筛选条件变化(来源/产品/参数名/工序)重置回第一页,避免停留在越界页码
watch([filterSource, filterProduct, filterParamName, filterProcName], () => { currentPage.value = 1 })
const procOptions = computed(() => {
  const src = filterSource.value === 'SAMPLE' ? sampleTasks.value : paramList.value
  return [...new Set(src.map((p: any) => p.procName).filter(Boolean))].sort()
})
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const form = reactive<Partial<SpcParam>>({ paramName: '', subgroupSize: 5, isActive: true })

// 抽样参数行挂载关联的抽样任务(_task)
type ParamRow = SpcParam & { _task?: SpcSampleTask; srcLabel?: string }

// 平铺参数表:首件三类(FIA_FIRST/MANUAL/TOOLING)与抽样参数合并,每行一条参数,带产品/料号/来源。
const flatRows = computed<ParamRow[]>(() => {
  const rows: ParamRow[] = []
  const sampledParamIds = new Set(sampleTasks.value.map(t => t.paramId))

  function pushFirst(p: SpcParam) {
    const base = (p.products && p.products.length) ? p.products[0] : null
    const productName = base?.productName || p.productName || '未绑定产品'
    const partNo = base?.partNo || p.partNo || ''
    const src = p.paramSource || 'FIA_FIRST'
    const srcLabel = src === 'TOOLING' ? '工装首件' : '产线首件'
    rows.push({ ...p, productName, partNo, srcLabel })
  }
  function pushSample(p: SpcParam, t: SpcSampleTask) {
    const base = (p.products && p.products.length) ? p.products[0] : null
    const productName = base?.productName || t.productName || p.productName || '未绑定产品'
    const partNo = base?.partNo || t.partNo || p.partNo || ''
    rows.push({ ...p, productName, partNo, procName: t.procName || p.procName, srcLabel: '抽样', _task: t })
  }

  if (!filterSource.value || filterSource.value === 'FIA' || filterSource.value === 'TOOLING') {
    // 首件类:按来源筛选(FIA=产线首件,TOOLING=工装首件);全部时三类并入,工装经"工装首件任务"渠道进入,本质同属首件
    paramList.value
      .filter(p => {
        if (sampledParamIds.has(p.id)) return false
        const src = p.paramSource || 'FIA_FIRST'
        if (filterSource.value === 'FIA') return src === 'FIA_FIRST' || src === 'MANUAL'
        if (filterSource.value === 'TOOLING') return src === 'TOOLING'
        return src === 'FIA_FIRST' || src === 'MANUAL' || src === 'TOOLING'
      })
      .forEach(pushFirst)
  }
  if (!filterSource.value || filterSource.value === 'SAMPLE') {
    // 产品抽样:仅展示有抽样任务关联的参数(任务 paramId 集合为唯一判定)
    const byParam = new Map<string, SpcSampleTask>()
    for (const t of sampleTasks.value) if (!byParam.has(t.paramId)) byParam.set(t.paramId, t)
    paramList.value
      .filter(p => byParam.has(p.id))
      .forEach(p => pushSample(p, byParam.get(p.id)!))
  }

  // 产品/参数名/工序筛选(参数级)
  return rows.filter(r => {
    if (filterProduct.value) {
      const hit = ((r.productName || '').includes(filterProduct.value) || (r.partNo || '').includes(filterProduct.value))
      if (!hit) return false
    }
    if (filterParamName.value && !(r.paramName || '').includes(filterParamName.value)) return false
    if (filterProcName.value && r.procName !== filterProcName.value) return false
    return true
  })
})

async function fetchData() {
  loading.value = true
  try {
    // 拉全量参数 + 抽样任务:首件三类(FIA_FIRST/MANUAL/TOOLING)与抽样参数合并展示,
    // 来源筛选与分组均在 flatRows 的 in-memory 逻辑完成。
    const all = await spcParamApi.list({})
    paramList.value = all
    // 始终拉取抽样任务,用于抽样参数挂载任务状态/进度,以及首件参数排除已被抽样任务占用的项
    sampleTasks.value = await spcSampleTaskApi.list()
  } finally { loading.value = false }
  currentPage.value = 1
}
function clearProduct() { filterProduct.value = ''; fetchData() }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { paramName: '', procName: '', unit: '', specLower: undefined, specUpper: undefined, targetValue: undefined, subgroupSize: 5, collectFreq: '', chartType: 'Xbar', chartCandidates: 'Xbar,R', dataType: 'VARIABLE', isActive: true, sigmaMethod: 'within', sigmaK: 3, cpkPeriod: '' }); dialogVisible.value = true }
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
  // 抽样任务参数走量产监控(ROUTINE)+ 抽样任务过滤;首件(产线/工装)参数走首件能力验证(FIRST)
  const q: any = { stage: row._task ? 'ROUTINE' : 'FIRST' }
  if (row._task) q.sampleTaskId = row._task.id
  router.push({ path: `/spc/params/${row.id}`, query: q })
}
// 详情弹窗:列表仅展示关键字段,其余字段与操作内聚于此
const detailVisible = ref(false)
const detailRow = ref<ParamRow | null>(null)
function openDetail(row: ParamRow) { detailRow.value = row; detailVisible.value = true }
function goCollect(row: ParamRow) {
  // 抽样任务参数走抽样采集页;首件参数(产线/工装)走首件采集页(带 paramId 预选 + 来源单号/批号自动填充)
  if (row._task) router.push({ path: `/spc/sample-collect/${row._task.id}` })
  else router.push({ path: '/spc/collect', query: { paramId: row.id, woNo: row.srcWoNo || '', batchNo: row.srcBatchNo || '' } })
}

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
// 来源列: 分类标签(非业务状态,用淡底胶囊区分 产线首件/工装首件/抽样)
.src-tag {
  display: inline-block; font-family: $font-mono; font-size: 11px; line-height: 1;
  padding: 3px 8px; border-radius: 4px; background: $hairline-soft; color: $ink-soft;
  white-space: nowrap;
}
</style>
