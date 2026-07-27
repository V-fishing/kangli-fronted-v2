<template>
  <div class="trend-report">
    <div class="head-b">
      <div class="crumb">NCM / 不良管理</div>
      <h1>不良趋势报表</h1>
      <div class="sub">按产品自动生成日 / 周 / 月粒度不良趋势,含环比·同比与恶化告警</div>
    </div>

    <!-- 筛选栏 -->
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="粒度">
          <el-radio-group v-model="filter.granularity">
            <el-radio-button value="day">日</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="filter.productModel" clearable placeholder="全部产品" style="width:160px">
            <el-option label="全部产品" value="" />
            <el-option v-for="p in products" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.range" type="daterange" value-format="YYYY-MM-DD"
            start-placeholder="开始" end-placeholder="结束" style="width:240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadRealtime">实时查询</el-button>
          <el-button :loading="genLoading" @click="generate">生成当前周期报表</el-button>
          <el-button link type="primary" @click="openRule">恶化规则配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 概览指标 -->
    <div class="kpi-row" v-if="summary">
      <div class="kpi"><div class="kpi-v">{{ summary.periodCount ?? 0 }}</div><div class="kpi-l">统计周期数</div></div>
      <div class="kpi"><div class="kpi-v danger" :class="{ on: summary.deteriorationCount > 0 }">{{ summary.deteriorationCount ?? 0 }}</div><div class="kpi-l">恶化周期</div></div>
      <div class="kpi"><div class="kpi-v">{{ summary.peakPeriod || '—' }}</div><div class="kpi-l">峰值周期</div></div>
      <div class="kpi"><div class="kpi-v">{{ summary.peakRate != null ? summary.peakRate + '%' : '—' }}</div><div class="kpi-l">峰值不良率</div></div>
    </div>

    <!-- 趋势图 -->
    <el-card shadow="never" class="card-b">
      <div class="card-title">不良率趋势{{ filter.productModel ? ' · ' + filter.productModel : ' · 全部产品' }}</div>
      <div ref="chartEl" class="chart"></div>
    </el-card>

    <!-- 周期数据表 -->
    <el-card shadow="never" class="card-b">
      <div class="card-title">周期明细</div>
      <el-table :data="points" size="small" max-height="420" v-loading="loading">
        <el-table-column prop="period" label="周期" width="130" />
        <el-table-column prop="defectCount" label="不良数" width="90" />
        <el-table-column prop="batchTotal" label="批次数" width="90" />
        <el-table-column label="不良率" width="100">
          <template #default="{row}"><span class="mono">{{ row.defectRate }}%</span></template>
        </el-table-column>
        <el-table-column label="环比" width="100">
          <template #default="{row}"><span :class="pctClass(row.momPct)">{{ fmtPct(row.momPct) }}</span></template>
        </el-table-column>
        <el-table-column label="同比" width="100">
          <template #default="{row}"><span :class="pctClass(row.yoyPct)">{{ fmtPct(row.yoyPct) }}</span></template>
        </el-table-column>
        <el-table-column label="恶化" width="150">
          <template #default="{row}">
            <el-tag v-if="row.deterioration" type="danger" effect="dark" size="small">{{ row.reason }}</el-tag>
            <span v-else class="muted">正常</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 已生成报表 -->
    <el-card shadow="never" class="card-b">
      <div class="card-title">已生成报表<el-button link type="primary" size="small" style="margin-left:8px" @click="loadReports">刷新</el-button></div>
      <el-table :data="reports" size="small" v-loading="repLoading">
        <el-table-column prop="productModel" label="产品" width="130" />
        <el-table-column prop="granularity" label="粒度" width="90" />
        <el-table-column prop="periodValue" label="周期" width="130" />
        <el-table-column prop="generatedAt" label="生成时间" width="170" />
        <el-table-column label="操作">
          <template #default="{row}"><el-button link type="primary" size="small" @click="viewReport(row)">查看快照</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 规则配置抽屉 -->
    <el-drawer v-model="ruleVisible" title="趋势恶化规则配置" size="380px">
      <el-form label-width="140px">
        <el-form-item label="连续上升天数 N">
          <el-input-number v-model="ruleForm.consecutiveDays" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="启用 超均值+kσ">
          <el-switch v-model="ruleForm.useMeanPlus2sigma" />
        </el-form-item>
        <el-form-item label="σ 倍数 k">
          <el-input-number v-model="ruleForm.sigmaMultiplier" :min="0.5" :max="5" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item label="基线窗口(天)">
          <el-input-number v-model="ruleForm.baselineDays" :min="7" :max="180" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleVisible=false">取消</el-button>
        <el-button type="primary" :loading="ruleSaving" @click="saveRule">保存并生效</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { ncmTrendReportApi } from '@/api/modules/ncm/trend-report'
import type { TrendPoint, TrendRule } from '@/api/types/ncm'

const products = ['MX-200', 'MX-300', 'MX-400', 'MX-500']
const today = new Date()
const d90 = new Date(today.getTime() - 89 * 86400000)
const fmtD = (d: Date) => d.toISOString().slice(0, 10)

const filter = reactive({ granularity: 'day', productModel: '', range: [fmtD(d90), fmtD(today)] as string[] })
const points = ref<TrendPoint[]>([])
const summary = ref<any>(null)
const loading = ref(false), genLoading = ref(false)
const reports = ref<any[]>([]), repLoading = ref(false)

const chartEl = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function pctClass(v: number | null) { return v == null ? 'muted' : v > 0 ? 'up' : v < 0 ? 'down' : 'muted' }
function fmtPct(v: number | null) { return v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%' }

async function loadRealtime() {
  loading.value = true
  try {
    const res = await ncmTrendReportApi.realtime({
      granularity: filter.granularity,
      productModel: filter.productModel || undefined,
      start: filter.range?.[0],
      end: filter.range?.[1],
    })
    points.value = res.points || []
    summary.value = res.summary || null
    await nextTick(); renderChart()
  } finally { loading.value = false }
}

async function generate() {
  genLoading.value = true
  try { await ncmTrendReportApi.generate(filter.granularity); ElMessage.success('已生成当前周期报表'); loadReports() }
  finally { genLoading.value = false }
}

async function loadReports() {
  repLoading.value = true
  try { reports.value = await ncmTrendReportApi.list({ granularity: filter.granularity, size: 50 }) } finally { repLoading.value = false }
}

async function viewReport(row: any) {
  try {
    const snap = JSON.parse(row.summaryJson || '{}')
    points.value = snap.points || []
    summary.value = snap.summary || null
    await nextTick(); renderChart()
    ElMessage.success('已载入历史快照')
  } catch { ElMessage.warning('快照解析失败') }
}

function renderChart() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const data = points.value
  const markPoints = data.filter(p => p.deterioration).map(p => ({
    coord: [p.period, p.defectRate], value: '恶化',
  }))
  chart.setOption({
    grid: { left: 48, right: 24, top: 36, bottom: 60 },
    tooltip: {
      trigger: 'axis',
      formatter: (ps: any) => {
        const p = data.find(d => d.period === ps[0].axisValue)
        if (!p) return ps[0].axisValue
        return `<b>${p.period}</b><br/>不良率: ${p.defectRate}%<br/>环比: ${fmtPct(p.momPct)}<br/>同比: ${fmtPct(p.yoyPct)}`
          + (p.deterioration ? `<br/><span style="color:#E5484D">⚠ ${p.reason}</span>` : '')
      },
    },
    xAxis: { type: 'category', data: data.map(p => p.period), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value', name: '不良率 %', axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'line', smooth: true, data: data.map(p => p.defectRate),
      itemStyle: { color: '#2F6BFF' },
      lineStyle: { width: 2.5 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(47,107,255,0.25)' }, { offset: 1, color: 'rgba(47,107,255,0.02)' }]) },
      markPoint: {
        symbol: 'pin', symbolSize: 46,
        itemStyle: { color: '#E5484D' },
        label: { color: '#fff', fontSize: 10, formatter: '恶化' },
        data: markPoints,
      },
    }],
  })
  chart.resize()
}

// ── 规则配置 ──
const ruleVisible = ref(false), ruleSaving = ref(false)
const ruleForm = reactive<TrendRule>({ consecutiveDays: 3, useMeanPlus2sigma: true, sigmaMultiplier: 2.0, baselineDays: 30 })
async function openRule() {
  try { const r = await ncmTrendReportApi.getRule(); Object.assign(ruleForm, r) } catch {}
  ruleVisible.value = true
}
async function saveRule() {
  ruleSaving.value = true
  try { await ncmTrendReportApi.saveRule(ruleForm); ElMessage.success('规则已保存'); ruleVisible.value = false; loadRealtime() }
  finally { ruleSaving.value = false }
}

onMounted(() => { loadRealtime(); loadReports() })
</script>

<style scoped>
.trend-report { padding: 0 4px 24px; }
.kpi-row { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
.kpi { flex: 1; min-width: 160px; background: #fff; border: 1px solid #eef1f5; border-radius: 12px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(20,40,80,.04); }
.kpi-v { font-size: 26px; font-weight: 700; color: #1F2733; line-height: 1.1; }
.kpi-v.danger { color: #E5484D; opacity: .35; }
.kpi-v.danger.on { opacity: 1; }
.kpi-l { font-size: 12px; color: #5A6675; margin-top: 6px; }
.card-title { font-size: 14px; font-weight: 600; color: #1F2733; margin-bottom: 12px; }
.chart { width: 100%; height: 360px; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
.up { color: #E5484D; font-weight: 600; }
.down { color: #28A745; font-weight: 600; }
.muted { color: #9aa6b2; }
</style>
