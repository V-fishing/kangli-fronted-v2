<template>
  <div class="board">
    <!-- 标题区 + 筛选条 -->
    <div class="head-b">
      <AppBreadcrumb />
      <div class="head-row">
        <h1>供应商质量看板</h1>
        <div class="filters">
          <el-select v-model="filters.level" multiple collapse-tags clearable placeholder="等级"
            class="f-sel" @change="reloadAll">
            <el-option v-for="l in LEVELS" :key="l" :label="l" :value="l" />
          </el-select>
          <el-input v-model="filters.keyword" placeholder="供应商关键词" clearable class="f-input"
            @keyup.enter="reloadAll" @clear="reloadAll" />
          <el-select v-model="filters.startYm" placeholder="起始月" class="f-sel" @change="reloadAll">
            <el-option v-for="m in MONTHS" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="tilde">~</span>
          <el-select v-model="filters.endYm" placeholder="截止月" class="f-sel" @change="reloadAll">
            <el-option v-for="m in MONTHS" :key="m" :label="m" :value="m" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 总览行:等级占比 + 检验结论 + 双率散点 -->
    <div class="overview">
      <el-card shadow="never" class="card-b">
        <template #header><span class="card-title">供应商等级占比</span></template>
        <div ref="pieRef" class="chart tall" v-loading="loading.pie"></div>
      </el-card>
      <el-card shadow="never" class="card-b">
        <template #header><span class="card-title">检验结论分布</span></template>
        <div ref="inspectRef" class="chart" v-loading="loading.inspect"></div>
      </el-card>
      <el-card shadow="never" class="card-b">
        <template #header><span class="card-title">交付及时率 × 来料合格率</span></template>
        <div ref="scatterRef" class="chart" v-loading="loading.scatter"></div>
      </el-card>
    </div>

    <!-- 合格率分布(可下钻) -->
    <el-card shadow="never" class="card-b block">
      <template #header>
        <div class="card-head">
          <span class="card-title">来料合格率分布</span>
          <div class="legend">
            <span v-for="b in BUCKETS" :key="b.bucket" class="lg">
              <i class="dot" :style="{ background: bucketColor(b.bucket) }"></i>{{ b.label }}
            </span>
          </div>
        </div>
      </template>
      <div ref="barRef" class="chart tall" v-loading="loading.bar"></div>
    </el-card>

    <!-- 合格率趋势 -->
    <el-card shadow="never" class="card-b block">
      <template #header>
        <div class="card-head">
          <span class="card-title">重点供应商合格率趋势</span>
          <el-select v-model="compareIds" multiple filterable clearable placeholder="追加对比供应商"
            class="compare-sel" @change="loadTrend">
            <el-option v-for="s in allSuppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
      </template>
      <div ref="lineRef" class="chart tall" v-loading="loading.line"></div>
    </el-card>

    <!-- 异常热力图 -->
    <el-card shadow="never" class="card-b block">
      <template #header>
        <div class="card-head">
          <span class="card-title">质量异常热力图（供应商 × 月份）</span>
          <div class="heat-ctrl">
            <el-select v-model="heatYear" placeholder="年份" class="f-sel" @change="loadHeat">
              <el-option v-for="y in YEARS" :key="y" :label="y" :value="y" />
            </el-select>
            <el-input-number v-model="heatTopN" :min="5" :max="30" :step="5" controls-position="right"
              @change="loadHeat" />
          </div>
        </div>
      </template>
      <div ref="heatRef" class="chart heat" v-loading="loading.heat"></div>
    </el-card>

    <!-- 下钻抽屉 -->
    <el-drawer v-model="drawer.visible" :title="drawer.title" size="620px" direction="rtl">
      <div v-if="drawer.loading" v-loading="true" class="drawer-loading"></div>
      <el-table v-else :data="drawer.list" size="small" border @row-click="goSupplier">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="supplierName" label="供应商" min-width="160" />
        <el-table-column label="等级" width="70">
          <template #default="{ row }"><span class="pill" :class="levelClass(row.level)">{{ row.level || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="passRate" label="合格率" width="100" align="right">
          <template #default="{ row }"><span class="mono">{{ row.passRate != null ? Number(row.passRate).toFixed(1) + '%' : '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="abnormalCount" label="异常数" width="80" align="right">
          <template #default="{ row }"><span class="mono">{{ row.abnormalCount }}</span></template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, ScatterChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  VisualMapComponent, DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { supplierBoardApi, type PassRateDistItem, type DeliveryVsPassItem, type InspectResultItem } from '@/api/modules/sqm/supplierBoard'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import type { SqmSupplier } from '@/api/types/sqm'

echarts.use([
  BarChart, LineChart, PieChart, ScatterChart, HeatmapChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  VisualMapComponent, DataZoomComponent, CanvasRenderer,
])

const router = useRouter()

const LEVELS = ['A', 'B', 'C', 'D']
const BUCKETS = [
  { bucket: '100', label: '100%' },
  { bucket: '90_100', label: '90%~100%' },
  { bucket: '80_90', label: '80%~90%' },
  { bucket: '70_80', label: '70%~80%' },
  { bucket: 'lt70', label: '<70%' },
]
const LEVEL_COLOR: Record<string, string> = {
  A: '#1a7f4b', B: '#0047ab', C: '#c77800', D: '#e03616', '未知': '#9e9e9e',
}
const BUCKET_COLOR: Record<string, string> = {
  '100': '#1a7f4b', '90_100': '#0047ab', '80_90': '#c77800', '70_80': '#e03616', 'lt70': '#b3261e',
}
function bucketColor(b: string) { return BUCKET_COLOR[b] || '#9e9e9e' }
function levelClass(l?: string) { return { A: 'p-done', B: 'p-run', C: 'p-wait', D: 'p-lock' }[l || ''] || '' }

const now = new Date()
const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i))
const MONTHS = (() => {
  const arr: string[] = []
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = 0; i < 18; i++) {
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return arr
})()

const filters = reactive<{ level?: string; keyword?: string; startYm?: string; endYm?: string }>({
  startYm: MONTHS[11], endYm: MONTHS[0],
})
const heatYear = ref(YEARS[0])
const heatTopN = ref(15)
const compareIds = ref<string[]>([])
const allSuppliers = ref<SqmSupplier[]>([])

const loading = reactive({ pie: false, scatter: false, bar: false, line: false, heat: false, inspect: false })

// echarts 实例
const pieRef = ref<HTMLElement | null>(null)
const inspectRef = ref<HTMLElement | null>(null)
const scatterRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)
const lineRef = ref<HTMLElement | null>(null)
const heatRef = ref<HTMLElement | null>(null)
let pieChart: echarts.ECharts | null = null
let inspectChart: echarts.ECharts | null = null
let scatterChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let heatChart: echarts.ECharts | null = null

const drawer = reactive<{ visible: boolean; title: string; loading: boolean; list: any[] }>({
  visible: false, title: '', loading: false, list: [],
})

function buildFilters() {
  return {
    level: filters.level,
    keyword: filters.keyword || undefined,
    startYm: filters.startYm || undefined,
    endYm: filters.endYm || undefined,
  }
}

async function loadPie() {
  loading.pie = true
  try {
    const data = await supplierBoardApi.levelRatio(buildFilters())
    const total = data.reduce((s, d) => s + Number(d.count), 0) || 1
    // 横向条形排名:等级 × 供应商数,小占比也清晰可见
    const rows = data.slice().sort((a, b) => Number(b.count) - Number(a.count))
    const option = {
      grid: { left: 8, right: 56, top: 10, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p: any) => {
          const d = p[0]; const v = Number(d.value)
          return `${d.name}<br/>${v} 家 (${((v / total) * 100).toFixed(2)}%)`
        },
      },
      xAxis: { type: 'value', axisLabel: { fontFamily: 'IBM Plex Mono' }, splitLine: { lineStyle: { color: '#ecebe7' } } },
      yAxis: {
        type: 'category', inverse: true,
        data: rows.map(d => d.level),
        axisLabel: { fontFamily: 'IBM Plex Mono', fontWeight: 'bold', fontSize: 13 },
        axisLine: { lineStyle: { color: '#e4e2dd' } },
      },
      series: [{
        type: 'bar', barWidth: '56%',
        data: rows.map(d => ({
          value: Number(d.count),
          itemStyle: { color: LEVEL_COLOR[d.level] || '#9e9e9e', borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true, position: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12,
          formatter: (p: any) => {
            const v = Number(p.value); const pct = ((v / total) * 100).toFixed(2)
            return v === 0 ? '0' : `${v} (${pct}%)`
          },
        },
      }],
    }
    pieChart?.setOption(option, true)
  } finally { loading.pie = false }
}

// 检验结论分布饼图配色(语义映射)
const INSPECT_COLOR: Record<string, string> = {
  合格: '#1a7f4b', 不合格: '#e03616', 待检: '#c77800', 未知: '#9e9e9e',
}
function inspectColor(r: string): string {
  return INSPECT_COLOR[r] || '#8a8a8a'
}

async function loadInspect() {
  loading.inspect = true
  try {
    const data: InspectResultItem[] = await supplierBoardApi.inspectResult(buildFilters())
    const total = data.reduce((s, d) => s + Number(d.count), 0) || 1
    // 横向条形排名:结论 × 批次,小项独立可见(与等级占比风格一致)
    const rows = data.slice().sort((a, b) => Number(b.count) - Number(a.count))
    const option = {
      grid: { left: 8, right: 64, top: 10, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p: any) => {
          const d = p[0]; const v = Number(d.value)
          return `${d.name}<br/>${v} 批 (${((v / total) * 100).toFixed(2)}%)`
        },
      },
      xAxis: { type: 'value', axisLabel: { fontFamily: 'IBM Plex Mono' }, splitLine: { lineStyle: { color: '#ecebe7' } } },
      yAxis: {
        type: 'category', inverse: true,
        data: rows.map(d => d.result),
        axisLabel: { fontFamily: 'IBM Plex Mono', fontWeight: 'bold', fontSize: 13 },
        axisLine: { lineStyle: { color: '#e4e2dd' } },
      },
      series: [{
        type: 'bar', barWidth: '56%',
        data: rows.map(d => ({
          value: Number(d.count),
          itemStyle: { color: inspectColor(d.result), borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true, position: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12,
          formatter: (p: any) => {
            const v = Number(p.value); const pct = ((v / total) * 100).toFixed(2)
            return v === 0 ? '0' : `${v} (${pct}%)`
          },
        },
      }],
    }
    inspectChart?.setOption(option, true)
  } finally { loading.inspect = false }
}

async function loadScatter() {
  loading.scatter = true
  try {
    const data: DeliveryVsPassItem[] = await supplierBoardApi.deliveryVsPass(buildFilters())
    // 按等级分组
    const groups: Record<string, any[]> = {}
    for (const d of data) {
      const lv = d.level || '未知'
      ;(groups[lv] ||= []).push([Number(d.deliveryRate), Number(d.incomingPassRate), Number(d.lotCount), d.supplierName])
    }
    const series = Object.keys(groups).map(lv => ({
      name: lv, type: 'scatter',
      itemStyle: { color: LEVEL_COLOR[lv] || '#9e9e9e', opacity: 0.8 },
      symbolSize: (v: number[]) => Math.max(8, Math.min(48, Math.sqrt(v[2]) * 2.2)),
      data: groups[lv],
    }))
    const option = {
      tooltip: {
        formatter: (p: any) => `${p.data[3]}<br/>交付率: ${p.data[0]}%<br/>合格率: ${p.data[1]}%<br/>批次: ${p.data[2]}`,
      },
      legend: { bottom: 0, left: 'center' },
      grid: { left: 56, right: 24, top: 24, bottom: 56 },
      xAxis: { name: '交付及时率(%)', nameLocation: 'middle', nameGap: 30, min: 0, max: 100, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      yAxis: { name: '来料合格率(%)', min: 0, max: 100, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      series: [
        ...series,
        {
          type: 'line', markLine: { silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: '#c8c5bf' },
            data: [{ xAxis: 90 }, { yAxis: 90 }], label: { show: false } }, data: [],
        },
      ],
    }
    scatterChart?.setOption(option, true)
  } finally { loading.scatter = false }
}

async function loadBar() {
  loading.bar = true
  try {
    const data: PassRateDistItem[] = await supplierBoardApi.passRateDist(buildFilters())
    const cats = data.map(d => d.label)
    const vals = data.map(d => d.count)
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>供应商数: ${p[0].value}` },
      grid: { left: 90, right: 40, top: 20, bottom: 30 },
      xAxis: { type: 'value', axisLine: { lineStyle: { color: '#e4e2dd' } } },
      yAxis: { type: 'category', data: cats, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      series: [{
        type: 'bar', data: data.map(d => ({ value: d.count, itemStyle: { color: bucketColor(d.bucket) } })),
        barWidth: '56%',
        label: { show: true, position: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 700 },
      }],
    }
    barChart?.setOption(option, true)
  } finally { loading.bar = false }
}

async function loadTrend() {
  loading.line = true
  try {
    const data = await supplierBoardApi.passRateTrend(true, compareIds.value, filters.startYm, filters.endYm)
    // 按 supplier 聚合
    const map: Record<string, { name: string; points: [string, number][] }> = {}
    for (const p of data) {
      const k = p.supplierId
      ;(map[k] ||= { name: p.supplierName, points: [] }).points.push([p.period, Number(p.passRate)])
    }
    const palette = ['#0047ab', '#1a7f4b', '#c77800', '#e03616', '#6b4fd8', '#0a9396', '#bb3e03', '#3a86ff']
    const series = Object.keys(map).map((k, i) => ({
      name: map[k].name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 2 }, itemStyle: { color: palette[i % palette.length] },
      data: map[k].points.sort((a, b) => a[0].localeCompare(b[0])),
    }))
    const option = {
      tooltip: { trigger: 'axis', valueFormatter: (v: any) => (v == null ? '-' : Number(v).toFixed(1) + '%') },
      legend: { bottom: 0, left: 'center', type: 'scroll' },
      grid: { left: 56, right: 24, top: 24, bottom: 56 },
      xAxis: { type: 'category', boundaryGap: false, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' }, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      series,
    }
    lineChart?.setOption(option, true)
  } finally { loading.line = false }
}

async function loadHeat() {
  loading.heat = true
  try {
    const data = await supplierBoardApi.abnormalHeat(heatYear.value, heatTopN.value)
    const months: string[] = []
    for (let m = 1; m <= 12; m++) months.push(`${heatYear.value}-${String(m).padStart(2, '0')}`)
    const suppliers = data.map(d => d.supplierName)
    const cells: [number, number, number][] = []
    let maxV = 0
    data.forEach((d, yi) => {
      months.forEach((m, xi) => {
        const v = d.months[m] || 0
        if (v > maxV) maxV = v
        cells.push([xi, yi, v])
      })
    })
    const option = {
      tooltip: {
        formatter: (p: any) => `${suppliers[p.value[1]]}<br/>${months[p.value[0]]}: ${p.value[2]} 次`,
      },
      grid: { left: 140, right: 20, top: 10, bottom: 60 },
      xAxis: { type: 'category', data: months.map(m => m.slice(5)), splitArea: { show: true }, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      yAxis: { type: 'category', data: suppliers, splitArea: { show: true }, axisLine: { lineStyle: { color: '#e4e2dd' } } },
      visualMap: { min: 0, max: Math.max(1, maxV), calculable: true, orient: 'horizontal', left: 'center', bottom: 10,
        inRange: { color: ['#eef3fa', '#9bc0ee', '#0047ab'] } },
      series: [{ type: 'heatmap', data: cells, label: { show: false }, emphasis: { itemStyle: { borderColor: '#141414', borderWidth: 1 } } }],
    }
    heatChart?.setOption(option, true)
  } finally { loading.heat = false }
}

async function reloadAll() {
  await Promise.all([loadPie(), loadInspect(), loadScatter(), loadBar(), loadTrend()])
  loadHeat()
}

// 下钻:点击分布长条
async function drillBucket(bucket: string, label: string) {
  drawer.visible = true
  drawer.title = `合格率区间：${label}`
  drawer.loading = true
  drawer.list = []
  try {
    const data: PassRateDistItem[] = await supplierBoardApi.passRateDist(buildFilters())
    const item = data.find(d => d.bucket === bucket)
    drawer.list = item ? item.suppliers : []
  } finally { drawer.loading = false }
}

function goSupplier(row: any) {
  drawer.visible = false
  router.push({ path: '/sqm/suppliers', query: { supplierId: row.supplierId, supplierName: row.supplierName } })
}

function initCharts() {
  pieChart = echarts.init(pieRef.value!)
  inspectChart = echarts.init(inspectRef.value!)
  scatterChart = echarts.init(scatterRef.value!)
  barChart = echarts.init(barRef.value!)
  lineChart = echarts.init(lineRef.value!)
  heatChart = echarts.init(heatRef.value!)
  // 点击长条下钻
  barChart.on('click', (p: any) => {
    const bucket = BUCKETS[p.dataIndex]?.bucket
    const label = BUCKETS[p.dataIndex]?.label
    if (bucket) drillBucket(bucket, label)
  })
}

function resizeAll() {
  pieChart?.resize(); inspectChart?.resize(); scatterChart?.resize(); barChart?.resize(); lineChart?.resize(); heatChart?.resize()
}
const onResize = () => resizeAll()

onMounted(async () => {
  await nextTick()
  initCharts()
  window.addEventListener('resize', onResize)
  try {
    allSuppliers.value = await sqmSupplierApi.list()
  } catch { allSuppliers.value = [] }
  await reloadAll()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  pieChart?.dispose(); inspectChart?.dispose(); scatterChart?.dispose(); barChart?.dispose(); lineChart?.dispose(); heatChart?.dispose()
})

// 筛选变化时 bar/trend 依赖月份,scatter/pie/inspect 依赖 level/keyword
watch(() => [filters.level, filters.keyword], () => { loadPie(); loadInspect(); loadScatter() })
watch(() => [filters.startYm, filters.endYm], () => { loadBar(); loadTrend() })
</script>

<style lang="scss" scoped>
.board { padding: 16px; }
.head-b { margin-bottom: 18px; }
.crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.head-row h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.f-sel { width: 130px; }
.f-input { width: 180px; }
.tilde { color: $ink-faint; }

.overview { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.card-b.block { margin-bottom: 16px; }
.card-title { font-family: $font-display; font-weight: 700; font-size: 16px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.chart { width: 100%; height: 320px; }
.chart.tall { height: 360px; }
.chart.heat { height: 460px; }

.legend { display: flex; gap: 14px; flex-wrap: wrap; }
.lg { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: $ink-soft; }
.dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }

.compare-sel { width: 240px; }
.heat-ctrl { display: flex; align-items: center; gap: 10px; }
.heat-ctrl .f-sel { width: 110px; }

.pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.p-done { background: $green-dim; color: $green; }
.p-run { background: $cobalt-dim; color: $cobalt; }
.p-wait { background: $amber-dim; color: $amber; }
.p-lock { background: $signal-red-dim; color: $signal-red; }
.mono { font-family: $font-mono; }
.drawer-loading { height: 200px; }

@media (max-width: 1100px) {
  .overview { grid-template-columns: 1fr; }
}
</style>
