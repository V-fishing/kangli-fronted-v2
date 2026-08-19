<template>
  <div class="performance-page">
    <div class="head-b"><AppBreadcrumb /><h1>供应商绩效</h1></div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="perf-tabs">
      <el-tab-pane label="绩效列表" name="list" />
      <el-tab-pane label="排名榜" name="rank" />
      <el-tab-pane label="趋势分析" name="trend" />
      <el-tab-pane label="柏拉图" name="pareto" />
      <el-tab-pane label="评审报告" name="report" />
    </el-tabs>

    <!-- 筛选 -->
    <el-card shadow="never" class="card-b" style="margin-bottom:16px" v-if="activeTab==='list'">
      <el-form :inline="true">
        <el-form-item label="供应商">
          <el-select v-model="filterSupplierId" clearable filterable placeholder="全部供应商" style="width:200px" @change="page = 1; fetch()">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期">
          <el-input v-model="filterPeriod" clearable placeholder="如 2026-07" style="width:120px" @keyup.enter="fetch" />
        </el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1; fetch()">查询</el-button></el-form-item>
        <el-form-item>
          <el-button type="success" @click="openCalc" v-if="canCalc">自动计算</el-button>
          <el-button @click="openCreate" v-if="canCreate">+ 手工录入</el-button>
          <el-button @click="goConfig" v-if="canCfg">指标配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 绩效列表 -->
    <el-card shadow="never" class="card-b" v-if="activeTab==='list'">
      <el-table :data="list" v-loading="loading" size="small" border stripe>
        <el-table-column prop="supplierName" label="供应商" min-width="140" />
        <el-table-column prop="period" label="周期" width="90" sortable />
        <el-table-column label="等级" width="60">
          <template #default="{ row }">
            <span class="pill" :class="levelClass(row.level)">{{ row.level || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="综合分" width="90" sortable prop="score">
          <template #default="{ row }">
            <b :style="{ color: scoreColor(row.score) }">{{ row.score ?? '-' }}</b>
          </template>
        </el-table-column>
        <el-table-column label="交付分" width="80" prop="deliveryScore" />
        <el-table-column label="质量分" width="80" prop="qualityScore" />
        <el-table-column label="服务分" width="80" prop="serviceScore" />
        <el-table-column label="来料合格率" width="100">
          <template #default="{ row }">{{ fmtPct(row.incomingPassRate) }}</template>
        </el-table-column>
        <el-table-column label="交付及时率" width="100">
          <template #default="{ row }">{{ fmtPct(row.deliveryTimelyRate) }}</template>
        </el-table-column>
        <el-table-column label="不良率" width="80">
          <template #default="{ row }">{{ fmtPct(row.defectRate) }}</template>
        </el-table-column>
        <el-table-column label="观察期" width="75">
          <template #default="{ row }">
            <el-tag :type="row.observeFlag ? 'warning' : 'info'" size="small">{{ row.observeFlag ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据缺失" width="85">
          <template #default="{ row }">
            <el-tag v-if="row.dataMissingFlag" type="danger" size="small">缺失</el-tag>
            <span v-else style="color:#999">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="queryAuditFreq(row.level)">审核频次</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" v-model:current-page="page" v-model:page-size="size"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 手工录入弹窗 -->
    <el-dialog v-model="createVisible" title="手工录入绩效" width="480px" append-to-body>
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="供应商" required>
          <el-select v-model="createForm.supplierId" filterable placeholder="选择供应商" style="width:100%">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期" required>
          <el-input v-model="createForm.period" placeholder="如 2026-07" maxlength="7" />
        </el-form-item>
        <el-form-item label="综合分" required>
          <el-input-number v-model="createForm.score" :min="0" :max="100" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="来料合格率(%)">
          <el-input-number v-model="createForm.incomingPassRate" :min="0" :max="100" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="交付及时率(%)">
          <el-input-number v-model="createForm.deliveryTimelyRate" :min="0" :max="100" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" @click="submitCreate">确定</el-button></template>
    </el-dialog>

    <!-- 自动计算弹窗 -->
    <el-dialog v-model="calcVisible" title="自动计算绩效" width="420px" append-to-body>
      <p style="color:#666;margin-bottom:16px">基于来料批次数据自动采集指定供应商的绩效指标。</p>
      <el-form :model="calcForm" label-width="80px">
        <el-form-item label="供应商" required>
          <el-select v-model="calcForm.supplierId" filterable placeholder="选择供应商" style="width:100%">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期" required>
          <el-input v-model="calcForm.period" placeholder="如 2026-07" maxlength="7" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="calcVisible=false">取消</el-button><el-button type="primary" @click="submitCalc">开始计算</el-button></template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="绩效详情" width="580px" append-to-body>
      <template v-if="detailRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="供应商">{{ detailRow.supplierName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="周期">{{ detailRow.period }}</el-descriptions-item>
          <el-descriptions-item label="综合分"><b :style="{ color: scoreColor(detailRow.score) }">{{ detailRow.score }}</b></el-descriptions-item>
          <el-descriptions-item label="等级"><span class="pill" :class="levelClass(detailRow.level)">{{ detailRow.level || '—' }}</span></el-descriptions-item>
          <el-descriptions-item label="交付分">{{ detailRow.deliveryScore ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="质量分">{{ detailRow.qualityScore ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="服务分">{{ detailRow.serviceScore ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="来料合格率">{{ fmtPct(detailRow.incomingPassRate) }}</el-descriptions-item>
          <el-descriptions-item label="交付及时率">{{ fmtPct(detailRow.deliveryTimelyRate) }}</el-descriptions-item>
          <el-descriptions-item label="不良率">{{ fmtPct(detailRow.defectRate) }}</el-descriptions-item>
          <el-descriptions-item label="整改及时率">{{ fmtPct(detailRow.rectifyTimelyRate) }}</el-descriptions-item>
          <el-descriptions-item label="合规率">{{ fmtPct(detailRow.complianceRate) }}</el-descriptions-item>
          <el-descriptions-item label="观察期"><el-tag :type="detailRow.observeFlag ? 'warning' : 'info'" size="small">{{ detailRow.observeFlag ? '是' : '否' }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="数据缺失"><el-tag v-if="detailRow.dataMissingFlag" type="danger" size="small">是</el-tag><span v-else>否</span></el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <!-- 审核频次建议弹窗 -->
    <el-dialog v-model="freqVisible" title="审核频次建议" width="400px" append-to-body>
      <template v-if="freqResult">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="供应商等级"><span class="pill" :class="levelClass(freqResult.level)">{{ freqResult.level }}</span></el-descriptions-item>
          <el-descriptions-item label="建议频次">{{ freqResult.freqPerYear }} 次/年</el-descriptions-item>
          <el-descriptions-item label="审核类型">{{ freqResult.auditType }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer><el-button @click="freqVisible=false">关闭</el-button></template>
    </el-dialog>

    <!-- 排名榜 -->
    <el-card shadow="never" class="card-b" v-if="activeTab==='rank'">
      <el-form :inline="true" class="rank-filter">
        <el-form-item label="周期">
          <el-select v-model="rankPeriod" style="width:130px" @change="loadRank">
            <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="品类">
          <el-select v-model="rankCategory" clearable placeholder="全部" style="width:150px" @change="loadRank">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-table :data="rankList" v-loading="rankLoading" size="small" border stripe>
        <el-table-column label="排名" width="70">
          <template #default="{ row }"><b class="rank-no">{{ row.rank }}</b></template>
        </el-table-column>
        <el-table-column prop="supplierName" label="供应商" min-width="160" />
        <el-table-column prop="category" label="品类" width="120" />
        <el-table-column label="等级" width="60">
          <template #default="{ row }"><span class="pill" :class="levelClass(row.level)">{{ row.level || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="综合分" width="100" prop="score" sortable>
          <template #default="{ row }"><b :style="{ color: scoreColor(row.score) }">{{ row.score }}</b></template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="rankTotal > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="rankTotal"
          :page-sizes="[10, 20, 50, 100]" v-model:current-page="rankPage" v-model:page-size="rankSize"
          @current-change="loadRank" @size-change="loadRank" />
      </div>
    </el-card>

    <!-- 趋势分析 -->
    <el-card shadow="never" class="card-b" v-if="activeTab==='trend'">
      <el-form :inline="true" class="trend-filter">
        <el-form-item label="对比供应商">
          <el-select v-model="trendIds" multiple filterable placeholder="选择1-3家" style="width:320px" @change="loadTrend">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起止周期">
          <el-date-picker v-model="trendStart" type="month" value-format="YYYY-MM" placeholder="起始月" style="width:130px" @change="loadTrend" />
          <span class="tilde">~</span>
          <el-date-picker v-model="trendEnd" type="month" value-format="YYYY-MM" placeholder="结束月" style="width:130px" @change="loadTrend" />
        </el-form-item>
      </el-form>
      <div ref="trendScoreRef" class="chart tall"></div>
      <div ref="trendRadarRef" class="chart tall"></div>
    </el-card>

    <!-- 柏拉图 -->
    <el-card shadow="never" class="card-b" v-if="activeTab==='pareto'">
      <el-form :inline="true" class="pareto-filter">
        <el-form-item label="起止周期">
          <el-select v-model="paretoStart" style="width:120px" @change="loadPareto">
            <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
          </el-select>
          <span class="tilde">~</span>
          <el-select v-model="paretoEnd" style="width:120px" @change="loadPareto">
            <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
      </el-form>
      <div ref="paretoRef" class="chart tall"></div>
    </el-card>

    <!-- 评审报告 -->
    <el-card shadow="never" class="card-b report-card" v-if="activeTab==='report'">
      <div class="report-head">
        <h2>供应商绩效评审报告</h2>
        <el-button @click="printReport">打印 / 导出 PDF</el-button>
      </div>
      <el-form :inline="true" class="report-filter">
        <el-form-item label="周期">
          <el-select v-model="reportPeriod" style="width:130px" @change="reportPage = 1; loadReport">
            <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="reportRows.length" class="report-body">
        <p class="report-meta">评审周期：<b>{{ reportPeriod }}</b> ｜ 参评供应商：<b>{{ reportTotal }}</b> 家 ｜ 生成时间：<b>{{ reportGenAt }}</b></p>
        <table class="report-table">
          <thead><tr><th>排名</th><th>供应商</th><th>品类</th><th>等级</th><th>综合分</th><th>结论</th></tr></thead>
          <tbody>
            <tr v-for="r in reportRows" :key="r.supplierId">
              <td class="mono">{{ r.rank }}</td>
              <td>{{ r.supplierName }}</td>
              <td>{{ r.category || '—' }}</td>
              <td><span class="pill" :class="levelClass(r.level)">{{ r.level }}</span></td>
              <td class="mono" :style="{ color: scoreColor(r.score) }">{{ r.score }}</td>
              <td>{{ r.level === 'D' ? '限期整改 / 暂停新订单' : r.level === 'A' ? '优先份额 / 年度免审' : '维持监控' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="pager" v-if="reportTotal > 0">
          <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="reportTotal"
            :page-sizes="[10, 20, 50, 100]" v-model:current-page="reportPage" v-model:page-size="reportSize"
            @current-change="loadReport" @size-change="loadReport" />
        </div>
      </div>
      <el-empty v-else description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { sqmPerformanceApi } from '@/api/modules/sqm/performance'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { sqmPerfAnalysisApi } from '@/api/modules/sqm/perfAnalysis'
import type { SqmSupplierPerformance, SqmAuditFreqResult, PerfRankRow, PerfParetoRow } from '@/api/types/sqm'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()
// 绩效操作权限(后端须同步 seed sqm.perf.* 并改 Controller 校验一致码)
const canCalc = computed(() => perm.has('sqm.perf.calc'))
const canCreate = computed(() => perm.has('sqm.perf.create'))
const canCfg = computed(() => perm.has('sqm.perf.cfg'))

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const router = useRouter()

// 扩展行类型（前端拼接供应商名）
interface PerfRow extends SqmSupplierPerformance {
  supplierName?: string
}

// ── 供应商选项 ──
const supplierOptions = ref<{ id: string; name: string }[]>([])

async function loadSuppliers() {
  try {
    const list = await sqmSupplierApi.list()
    supplierOptions.value = list.map((s: any) => ({ id: s.id, name: s.name }))
  } catch { /* ignore */ }
}

// ── 列表 ──
const loading = ref(false)
const list = ref<PerfRow[]>([])
const filterSupplierId = ref('')
const filterPeriod = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)

function getSupplierName(id: string) {
  return supplierOptions.value.find(s => s.id === id)?.name || id
}

async function fetch() {
  loading.value = true
  try {
    const res = await sqmPerformanceApi.listPage({ supplierId: filterSupplierId.value || undefined, period: filterPeriod.value || undefined, page: page.value, size: size.value })
    list.value = res.records.map(r => ({
      ...r,
      supplierName: getSupplierName(r.supplierId),
    }))
    total.value = res.total
  } catch { /* 拦截器已提示 */ }
  finally { loading.value = false }
}

// ── 手工录入 ──
const createVisible = ref(false)
const createForm = reactive({ supplierId: '', period: '', score: 0, incomingPassRate: 0, deliveryTimelyRate: 100 })

function openCreate() {
  createForm.supplierId = ''
  createForm.period = new Date().toISOString().slice(0, 7)
  createForm.score = 0
  createForm.incomingPassRate = 0
  createForm.deliveryTimelyRate = 100
  createVisible.value = true
}

async function submitCreate() {
  if (!createForm.supplierId || !createForm.period || createForm.score <= 0) {
    ElMessage.warning('请填写供应商、周期与有效得分')
    return
  }
  try {
    await sqmPerformanceApi.create({
      supplierId: createForm.supplierId,
      period: createForm.period,
      score: createForm.score,
      incomingPassRate: createForm.incomingPassRate,
      deliveryTimelyRate: createForm.deliveryTimelyRate,
    })
    ElMessage.success('绩效记录已保存')
    createVisible.value = false
    await fetch()
  } catch { /* 拦截器已提示 */ }
}

// ── 自动计算 ──
const calcVisible = ref(false)
const calcForm = reactive({ supplierId: '', period: '' })

function openCalc() {
  calcForm.supplierId = ''
  calcForm.period = new Date().toISOString().slice(0, 7)
  calcVisible.value = true
}

async function submitCalc() {
  if (!calcForm.supplierId || !calcForm.period) {
    ElMessage.warning('请选择供应商和周期')
    return
  }
  try {
    await sqmPerformanceApi.calc(calcForm.supplierId, calcForm.period)
    const name = getSupplierName(calcForm.supplierId)
    ElMessage.success(`已自动采集【${name}】${calcForm.period} 绩效`)
    calcVisible.value = false
    await fetch()
  } catch { /* 拦截器已提示 */ }
}

// ── 详情 ──
const detailVisible = ref(false)
const detailRow = ref<PerfRow | null>(null)

function openDetail(row: any) {
  detailRow.value = row as PerfRow
  detailVisible.value = true
}

// ── 审核频次建议 ──
const freqVisible = ref(false)
const freqResult = ref<SqmAuditFreqResult | null>(null)

async function queryAuditFreq(level?: string) {
  if (!level) { ElMessage.warning('该供应商暂无等级'); return }
  try {
    freqResult.value = await sqmPerformanceApi.auditFreq(level)
    freqVisible.value = true
  } catch { /* 拦截器已提示 */ }
}

// ── 工具函数 ──
function levelClass(level?: string) {
  return { A: 'g', B: 'b', C: 'y', D: 'r' }[level || ''] || ''
}

function scoreColor(s: number | undefined) {
  if (s === undefined || s === null) return '#999'
  if (s >= 90) return '#2f7d32'
  if (s >= 75) return '#d4a017'
  return '#c62828'
}

function fmtPct(v: number | undefined) {
  if (v === undefined || v === null) return '—'
  return v.toFixed(1) + '%'
}

function goConfig() {
  router.push('/sqm/perf-config')
}

onMounted(async () => {
  initPeriods()
  await loadSuppliers()
  fetch()
})

// ── 周期/品类选项 ──
const periodOptions = ref<string[]>([])
const categoryOptions = ref<string[]>([])
const now = new Date()
function initPeriods() {
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  const arr: string[] = []
  for (let i = 0; i < 12; i++) {
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  periodOptions.value = arr
  // 默认周期/起止(必须在 periodOptions 就绪后再赋值,否则为 undefined 导致后端 missing param)
  const def = arr[0] || new Date().toISOString().slice(0, 7)
  const defStart = arr[arr.length - 1] || def
  rankPeriod.value = def
  reportPeriod.value = def
  trendStart.value = defStart
  trendEnd.value = def
  paretoStart.value = defStart
  paretoEnd.value = def
  // 品类从供应商列表推导
  sqmSupplierApi.list().then(list => {
    categoryOptions.value = Array.from(new Set((list as any[]).map((s: any) => s.category).filter(Boolean)))
    rankCategory.value = ''
  }).catch(() => {})
}

// ── Tab 状态 ──
const activeTab = ref<'list' | 'rank' | 'trend' | 'pareto' | 'report'>('list')

// ── 排名榜 ──
const rankPeriod = ref(periodOptions.value[0] || new Date().toISOString().slice(0, 7))
const rankCategory = ref('')
const rankLoading = ref(false)
const rankList = ref<PerfRankRow[]>([])
const rankPage = ref(1), rankSize = usePageSize(), rankTotal = ref(0)
async function loadRank() {
  if (!rankPeriod.value) return
  rankLoading.value = true
  try {
    const res = await sqmPerfAnalysisApi.rank(rankPeriod.value, rankCategory.value || undefined, rankPage.value, rankSize.value)
    rankList.value = res.records
    rankTotal.value = res.total
  } catch { /* ignore */ }
  finally { rankLoading.value = false }
}

// ── 趋势分析 ──
const trendIds = ref<string[]>([])
const trendStart = ref(periodOptions.value[11] || periodOptions.value[0])
const trendEnd = ref(periodOptions.value[0])
const trendScoreRef = ref<HTMLElement | null>(null)
const trendRadarRef = ref<HTMLElement | null>(null)
let trendScoreChart: echarts.ECharts | null = null
let trendRadarChart: echarts.ECharts | null = null

async function loadTrend() {
  if (trendIds.value.length === 0) { clearTrendCharts(); return }
  try {
    const rows = await sqmPerfAnalysisApi.trend(trendIds.value, trendStart.value, trendEnd.value)
    renderTrend(rows)
  } catch { /* ignore */ }
}
function clearTrendCharts() {
  trendScoreChart?.clear(); trendRadarChart?.clear()
}
function renderTrend(rows: SqmSupplierPerformance[]) {
  if (!trendScoreRef.value) return
  if (!trendScoreChart) trendScoreChart = echarts.init(trendScoreRef.value)
  if (!trendRadarChart) trendRadarChart = echarts.init(trendRadarRef.value!)
  const periods = Array.from(new Set(rows.map(r => r.period))).sort()
  const series = trendIds.value.map(id => {
    const name = getSupplierName(id)
    return {
      name, type: 'line', smooth: true,
      data: periods.map(p => {
        const r = rows.find(x => x.supplierId === id && x.period === p)
        return r ? r.score : null
      }),
    }
  })
  trendScoreChart.setOption({
    title: { text: '综合分趋势', left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#141414' } },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: periods, axisLabel: { fontFamily: 'IBM Plex Mono', fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 100 },
    series,
  })
  // 雷达图:取最新周期各供应商单项指标
  const latest = periods[periods.length - 1]
  const indicators = [
    { name: '来料合格率', max: 100 }, { name: '交付及时率', max: 100 },
    { name: '质量分', max: 100 }, { name: '综合分', max: 100 },
  ]
  const radarSeries = trendIds.value.map(id => {
    const r = rows.find(x => x.supplierId === id && x.period === latest)
    return {
      name: getSupplierName(id),
      value: [r?.incomingPassRate ?? 0, r?.deliveryTimelyRate ?? 0, r?.qualityScore ?? 0, r?.score ?? 0],
    }
  })
  trendRadarChart.setOption({
    title: { text: `指标画像（${latest}）`, left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#141414' } },
    tooltip: {}, legend: { bottom: 0 },
    radar: { indicator: indicators, radius: '62%', center: ['50%', '52%'] },
    series: [{ type: 'radar', data: radarSeries }],
  })
}

// ── 柏拉图 ──
const paretoStart = ref(periodOptions.value[11] || periodOptions.value[0])
const paretoEnd = ref(periodOptions.value[0])
const paretoRef = ref<HTMLElement | null>(null)
let paretoChart: echarts.ECharts | null = null
async function loadPareto() {
  try {
    const rows = await sqmPerfAnalysisApi.pareto(paretoStart.value, paretoEnd.value, 10)
    renderPareto(rows)
  } catch { /* ignore */ }
}
function renderPareto(rows: PerfParetoRow[]) {
  if (!paretoRef.value) return
  if (!paretoChart) paretoChart = echarts.init(paretoRef.value)
  const total = rows.reduce((s, r) => s + (r.cnt || 0), 0) || 1
  let acc = 0
  const cum: number[] = []
  rows.forEach(r => { acc += r.cnt; cum.push(Number(((acc / total) * 100).toFixed(1))) })
  paretoChart.setOption({
    title: { text: '不良类型柏拉图（缺陷数累计占比）', left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#141414' } },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, data: ['缺陷数', '累计占比%'] },
    grid: { left: 50, right: 50, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: rows.map(r => r.defectCode), axisLabel: { fontFamily: 'IBM Plex Mono', fontSize: 11, rotate: 30 } },
    yAxis: [
      { type: 'value', name: '缺陷数' },
      { type: 'value', name: '累计%', max: 100, axisLabel: { formatter: '{value}%' } },
    ],
    series: [
      { name: '缺陷数', type: 'bar', data: rows.map(r => r.cnt), itemStyle: { color: '#0047ab' } },
      { name: '累计占比%', type: 'line', yAxisIndex: 1, data: cum, itemStyle: { color: '#c0392b' } },
    ],
  })
}

// ── 评审报告 ──
const reportPeriod = ref(periodOptions.value[0] || new Date().toISOString().slice(0, 7))
const reportRows = ref<PerfRankRow[]>([])
const reportPage = ref(1), reportSize = usePageSize(), reportTotal = ref(0)
const reportGenAt = ref(new Date().toLocaleString('zh-CN'))
async function loadReport() {
  if (!reportPeriod.value) return
  try {
    const res = await sqmPerfAnalysisApi.rank(reportPeriod.value, '', reportPage.value, reportSize.value)
    reportRows.value = res.records
    reportTotal.value = res.total
    reportGenAt.value = new Date().toLocaleString('zh-CN')
  } catch { /* ignore */ }
}

function printReport() {
  window.print()
}

// tab 切换时触发对应加载
watch(activeTab, (t) => {
  if (t === 'rank') nextTick(loadRank)
  if (t === 'trend') nextTick(loadTrend)
  if (t === 'pareto') nextTick(loadPareto)
  if (t === 'report') nextTick(loadReport)
})

onBeforeUnmount(() => {
  trendScoreChart?.dispose(); trendRadarChart?.dispose(); paretoChart?.dispose()
})
</script>

<style lang="scss" scoped>
.performance-page {
  .head-b { margin-bottom: 20px; .crumb { font-size: 12px; color: $ink-faint; } h1 { font-size: 20px; font-weight: 600; margin: 4px 0 0; } }
  .card-b { border-radius: 10px; }
  .pager { display: flex; justify-content: flex-end; margin-top: 14px; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 500;
    &.g { background: #e8f5e9; color: #2f7d32; }
    &.b { background: #e3f2fd; color: #1565c0; }
    &.y { background: #fff8e1; color: #f9a825; }
    &.r { background: #ffebee; color: #c62828; }
  }
  .perf-tabs { margin-bottom: 8px; }
  .rank-no { font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: $cobalt; }
  .chart { width: 100%; height: 360px; margin-top: 8px; }
  .chart.tall { height: 360px; }
  .tilde { margin: 0 6px; color: $ink-faint; }
  .report-card {
    .report-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .report-meta { color: $ink-faint; font-size: 13px; margin-bottom: 12px; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 13px;
      th, td { border: 1px solid $hairline; padding: 8px 10px; text-align: left; }
      th { background: #faf9f6; font-weight: 600; }
      .mono { font-family: 'IBM Plex Mono', monospace; }
    }
  }
}
@media print {
  .perf-tabs, .el-button, .report-filter { display: none !important; }
}
</style>