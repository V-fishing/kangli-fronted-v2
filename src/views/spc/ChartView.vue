<template>
  <div class="chart-view">
    <div class="head-b"><div class="crumb">SPC / 过程控制</div><h1>控制图 · {{ param?.paramName || '选择参数' }}</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="参数"><el-select v-model="paramId" @change="loadChart" placeholder="选择SPC参数" style="width:240px"><el-option v-for="p in params" :key="p.id" :label="p.paramName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="时间范围"><el-date-picker v-model="timeRange" type="datetimerange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD HH:mm:ss" style="width:360px" @change="loadChart" /></el-form-item>
        <el-form-item><el-button type="primary" plain @click="openManual">设置控制限</el-button></el-form-item>
      </el-form>
    </el-card>

    <div class="grid-b">
      <div class="left-b">
        <div class="card-b">
          <div class="card-head"><h2>Xbar 控制图</h2><span class="sub">{{ chartData?.subgroups?.length || 0 }} 个子组</span></div>
          <div class="chart" ref="xbarChartRef"></div>
        </div>
        <div class="card-b">
          <div class="card-head"><h2>R 控制图（极差）</h2></div>
          <div class="chart" ref="rChartRef"></div>
        </div>
      </div>
      <div class="right-b">
        <div class="card-b">
          <div class="card-head"><h2>过程能力</h2></div>
          <div style="padding:16px 22px">
            <div class="cpk-row"><div class="cpk"><span class="l">Cpk</span><span class="v mono" :class="cpkLevel">{{ capability?.cpk?.toFixed(2) || '-' }}</span></div><div class="cpk"><span class="l">Ppk</span><span class="v mono">{{ capability?.ppk?.toFixed(2) || '-' }}</span></div></div>
            <div class="cpk-row"><div class="cpk"><span class="l">Cp</span><span class="v mono">{{ capability?.cp?.toFixed(2) || '-' }}</span></div><div class="cpk"><span class="l">Pp</span><span class="v mono">{{ capability?.pp?.toFixed(2) || '-' }}</span></div></div>
            <div class="cap-foot">样本子组: {{ capability?.sampleCount || 0 }} · σ算法: {{ param?.sigmaMethod || 'within' }} · k={{ param?.sigmaK || 3 }}</div>
            <div v-if="!capability" class="cap-note cap-note--err">过程能力数据未返回(计算失败或被拦截)</div>
            <div v-else-if="capability.cpk == null" class="cap-note"><span class="cap-note__icon">⚠</span><span>{{ capability.calcNote || '该参数暂无过程能力数据' }}</span></div>
            <div v-else-if="capability.level === '数据量不足，CPK仅供参考'" class="cap-note"><span class="cap-note__icon">⚠</span><span>数据量不足，CPK仅供参考（子组 &lt; 25）</span></div>
            <div v-else class="cap-note cap-note--ok"><span class="cap-note__icon">✓</span><span>判定：{{ capability.level }}</span></div>
          </div>
        </div>
        <div class="card-b">
          <div class="card-head"><h2>直方图</h2><span class="sub" v-if="hist">μ={{ hist.mean?.toFixed(3) }} σ={{ hist.sigma?.toFixed(3) }}</span></div>
          <div class="chart" ref="histChartRef" style="height:220px"></div>
        </div>
        <div class="card-b">
          <div class="card-head"><h2>CPK 历史趋势</h2></div>
          <div class="chart" ref="trendChartRef" style="height:190px"></div>
          <div style="padding:0 22px 14px">
            <div class="trend-tbl">
              <div class="tr th"><span>周期</span><span>Cpk</span><span>Ppk</span><span>判定</span></div>
              <div class="tr" v-for="t in trendRows" :key="t.periodValue"><span class="mono">{{ t.periodValue }}</span><span class="mono">{{ t.cpk?.toFixed(2) }}</span><span class="mono">{{ t.ppk?.toFixed(2) }}</span><span class="pill" :class="levelClass(t.level)"><span class="d"></span>{{ t.level }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置控制限(人工覆盖) -->
    <el-dialog v-model="manualVisible" title="设置控制限（人工覆盖）" width="640px" append-to-body>
      <div class="m-help">
        <div class="m-help__title">什么是人工覆盖？</div>
        <p>系统默认根据最近 25 个子组自动计算控制限（Xbar 图：CL = X̿，UCL/LCL = X̿ ± k·σ，σ 由参数配置的「σ 算法」决定；R 图：CL = R̄，UCL/LCL = R̄ ± k·d3·R̄/d2）。保存人工覆盖后，该基线<b>优先于自动计算</b>，控制图与报警判定将直接采用下列数值，直到再次覆盖或重新计算。</p>
        <div class="m-help__title">适用场景</div>
        <ul>
          <li>过程刚切换/试产，历史数据不能代表当前过程，需沿用工艺验证阶段的控制限；</li>
          <li>客户/行业标准指定了固定控制限；</li>
          <li>自动基线受异常点污染，需临时采用剔除异常后人工计算的数值。</li>
        </ul>
        <div class="m-help__title">配置建议</div>
        <ul>
          <li>必须满足 <b>UCL &gt; CL &gt; LCL</b>；R 图 LCL 不得小于 0（子组容量 n ≤ 6 时通常取 0）；</li>
          <li>控制限应<b>窄于规格限</b>（LSL {{ fmtNum(param?.specLower) }} / USL {{ fmtNum(param?.specUpper) }}），否则会漏报过程异常；</li>
          <li>建议以右侧「自动计算参考值」为基础微调，偏离过大将使控制图失去统计意义；</li>
          <li>过程稳定后应尽快恢复自动基线（重新执行控制限计算即可生成新的自动基线）。</li>
        </ul>
      </div>

      <div class="m-ref" v-if="autoRef">
        <div class="m-ref__head">
          <span>自动计算参考值（{{ autoRef.baselineSource || '最近基线' }}，{{ autoRef.calcAt || '-' }}）</span>
          <el-button size="small" text type="primary" @click="fillFromAuto">一键填入</el-button>
        </div>
        <div class="m-ref__grid mono">
          <span>Xbar：UCL {{ fmtNum(autoRef.xbarUcl) }} · CL {{ fmtNum(autoRef.xbarCl) }} · LCL {{ fmtNum(autoRef.xbarLcl) }}</span>
          <span>R：UCL {{ fmtNum(autoRef.rUcl) }} · CL {{ fmtNum(autoRef.rCl) }} · LCL {{ fmtNum(autoRef.rLcl) }}</span>
        </div>
      </div>
      <el-alert v-else type="warning" :closable="false" style="margin-bottom:12px" title="该参数暂无自动计算基线，请谨慎人工设定（可先在数据采集后执行控制限计算获得参考值）。" />

      <el-form label-width="110px">
        <el-divider content-position="left">Xbar 图（子组均值）</el-divider>
        <el-form-item label="UCL 上控制限" required><el-input-number v-model="manual.xbarUcl" :step="0.001" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="CL 中心线" required><el-input-number v-model="manual.xbarCl" :step="0.001" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="LCL 下控制限" required><el-input-number v-model="manual.xbarLcl" :step="0.001" controls-position="right" style="width:100%" /></el-form-item>
        <el-divider content-position="left">R 图（子组极差，选填）</el-divider>
        <el-form-item label="UCL 上控制限"><el-input-number v-model="manual.rUcl" :step="0.001" :min="0" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="CL 中心线"><el-input-number v-model="manual.rCl" :step="0.001" :min="0" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="LCL 下控制限"><el-input-number v-model="manual.rLcl" :step="0.001" :min="0" controls-position="right" style="width:100%" /></el-form-item>
      </el-form>
      <div v-if="manualWarn" class="m-warn">⚠ {{ manualWarn }}</div>
      <template #footer><el-button @click="manualVisible=false">取消</el-button><el-button type="primary" :loading="manualSaving" @click="saveManual">保存覆盖</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcChartApi } from '@/api/modules/spc/chart'
import { spcCapabilityApi } from '@/api/modules/spc/capability'
import { spcControlLimitApi } from '@/api/modules/spc/control-limits'
import type { SpcParam, ControlChartVo, SpcCapability, SpcHistogramVo, SpcControlLimit } from '@/api/types/spc'

const route = useRoute()
const params = ref<SpcParam[]>([])
const paramId = ref((route.params.id as string) || '')
const param = computed(() => params.value.find(p => p.id === paramId.value))
const timeRange = ref<[string, string] | null>(null)
const chartData = ref<ControlChartVo | null>(null)
const capability = ref<SpcCapability | null>(null)
const hist = ref<SpcHistogramVo | null>(null)
const trend = ref<SpcCapability[]>([])
const trendRows = computed(() => trend.value.slice(0, 6))

const xbarChartRef = ref<HTMLElement>()
const rChartRef = ref<HTMLElement>()
const histChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
let xbarChart: echarts.ECharts | null = null
let rChart: echarts.ECharts | null = null
let histChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const manualVisible = ref(false)
const manual = ref<Partial<SpcControlLimit>>({})
const manualSaving = ref(false)
const autoRef = ref<SpcControlLimit | null>(null)

function fmtNum(v: any) { return v == null ? '-' : Number(v).toFixed(3) }

const manualWarn = computed(() => {
  const m = manual.value
  if (m.xbarUcl == null && m.xbarCl == null && m.xbarLcl == null) return ''
  if (m.xbarUcl != null && m.xbarCl != null && m.xbarUcl <= m.xbarCl) return 'Xbar 图必须满足 UCL > CL'
  if (m.xbarCl != null && m.xbarLcl != null && m.xbarCl <= m.xbarLcl) return 'Xbar 图必须满足 CL > LCL'
  if (m.rUcl != null && m.rLcl != null && m.rUcl < m.rLcl) return 'R 图必须满足 UCL ≥ LCL'
  const pu = param.value?.specUpper, pl = param.value?.specLower
  if (pu != null && m.xbarUcl != null && m.xbarUcl > pu) return `UCL 超出规格上限 USL=${pu}，控制限通常应窄于规格限`
  if (pl != null && m.xbarLcl != null && m.xbarLcl < pl) return `LCL 低于规格下限 LSL=${pl}，控制限通常应窄于规格限`
  return ''
})

function fillFromAuto() {
  const a = autoRef.value
  if (!a) return
  manual.value = { xbarUcl: a.xbarUcl, xbarCl: a.xbarCl, xbarLcl: a.xbarLcl, rUcl: a.rUcl, rCl: a.rCl, rLcl: a.rLcl }
}

const cpkLevel = computed(() => { const v = capability.value?.cpk; if (v == null) return ''; return v >= 1.33 ? 'c-green' : v >= 1.0 ? 'c-amber' : 'c-red' })
function levelClass(l: string) { return { '充足': 'p-done', '尚可': 'p-run', '不足': 'p-wait', '数据量不足，CPK仅供参考': 'p-sign', '样本过少,无法计算': 'p-wait' }[l] || 'p-wait' }

async function loadChart() {
  if (!paramId.value) return
  const p = { paramId: paramId.value, startTime: timeRange.value?.[0], endTime: timeRange.value?.[1] }
  const [data, cap, h] = await Promise.all([
    spcChartApi.controlChart(p).catch(() => null),
    spcCapabilityApi.calc({ paramId: paramId.value }).catch(() => null),
    spcChartApi.histogram(p).catch(() => null),
  ])
  chartData.value = data
  capability.value = cap
  hist.value = h
  trend.value = await spcCapabilityApi.trend({ paramId: paramId.value }).catch(() => [])
  nextTick(() => { drawXbar(); drawR(); drawHist(); drawTrend() })
}

function specLines(): any[] {
  const ml: any[] = []
  const pu = param.value?.specUpper, pl = param.value?.specLower
  if (pu != null) ml.push({ yAxis: pu, lineStyle: { color: '#7a3ff2', type: 'dotted', width: 1 }, label: { formatter: 'USL', color: '#7a3ff2', fontSize: 9 } })
  if (pl != null) ml.push({ yAxis: pl, lineStyle: { color: '#7a3ff2', type: 'dotted', width: 1 }, label: { formatter: 'LSL', color: '#7a3ff2', fontSize: 9 } })
  return ml
}

function drawXbar() {
  if (!xbarChartRef.value) return
  xbarChart?.dispose(); xbarChart = echarts.init(xbarChartRef.value)
  const d = chartData.value; if (!d?.subgroups?.length) return
  const xbars = d.subgroups.map(s => s.xbar)
  const limit = d.limit
  const ml: any[] = []
  if (limit) {
    ml.push({ yAxis: limit.xbarUcl, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'UCL', color: '#e03616', fontSize: 9 } })
    ml.push({ yAxis: limit.xbarCl, lineStyle: { color: '#0047ab', width: 1 }, label: { formatter: 'CL', color: '#0047ab', fontSize: 9 } })
    ml.push({ yAxis: limit.xbarLcl, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'LCL', color: '#e03616', fontSize: 9 } })
  }
  xbarChart.setOption({
    tooltip: { trigger: 'axis' }, grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: xbars.map((_, i) => '子组' + (i + 1)), axisLine: { lineStyle: { color: '#e4e2dd' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    series: [{
      type: 'line', data: xbars, smooth: true, symbolSize: 5,
      lineStyle: { color: '#141414', width: 1.5 }, itemStyle: { color: '#141414', borderColor: '#fff', borderWidth: 1 },
      markLine: { symbol: 'none', data: [...ml, ...specLines()] },
    }, ...(d.marks?.length ? [{ type: 'scatter', data: d.marks.filter(m => m.level === '报警').map(m => [m.i, xbars[m.i]]), itemStyle: { color: '#e03616' }, symbolSize: 10 }] : [] as any)]
  })
}

function drawR() {
  if (!rChartRef.value) return
  rChart?.dispose(); rChart = echarts.init(rChartRef.value)
  const d = chartData.value; if (!d?.subgroups?.length) return
  const ranges = d.subgroups.map(s => s.rangeR)
  const limit = d.limit
  const ml: any[] = []
  if (limit) {
    ml.push({ yAxis: limit.rUcl, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'RUCL', color: '#e03616', fontSize: 9 } })
    ml.push({ yAxis: limit.rCl, lineStyle: { color: '#0047ab', width: 1 }, label: { formatter: 'RCL', color: '#0047ab', fontSize: 9 } })
    ml.push({ yAxis: limit.rLcl, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'RLCL', color: '#e03616', fontSize: 9 } })
  }
  rChart.setOption({
    tooltip: { trigger: 'axis' }, grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ranges.map((_, i) => '子组' + (i + 1)), axisLine: { lineStyle: { color: '#e4e2dd' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    series: [{
      type: 'line', data: ranges, smooth: true, symbolSize: 5,
      lineStyle: { color: '#141414', width: 1.5 }, itemStyle: { color: '#141414', borderColor: '#fff', borderWidth: 1 },
      markLine: { symbol: 'none', data: ml },
    }, ...(d.marks?.length ? [{ type: 'scatter', data: d.marks.filter(m => m.level === '报警').map(m => [m.i, ranges[m.i]]), itemStyle: { color: '#e03616' }, symbolSize: 10 }] : [] as any)]
  })
}

function drawHist() {
  if (!histChartRef.value) return
  histChart?.dispose(); histChart = echarts.init(histChartRef.value)
  const h = hist.value; if (!h?.bins?.length) return
  const ml: any[] = []
  if (h.usl != null) ml.push({ yAxis: h.usl, lineStyle: { color: '#7a3ff2', type: 'dotted', width: 1 }, label: { formatter: 'USL', color: '#7a3ff2', fontSize: 9 } })
  if (h.lsl != null) ml.push({ yAxis: h.lsl, lineStyle: { color: '#7a3ff2', type: 'dotted', width: 1 }, label: { formatter: 'LSL', color: '#7a3ff2', fontSize: 9 } })
  histChart.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['频次', '正态拟合'], top: 0, textStyle: { fontSize: 10, color: '#9e9e9e' } },
    xAxis: { type: 'category', data: h.bins.map(b => b.toFixed(2)), axisLabel: { color: '#9e9e9e', fontSize: 9 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 9 } },
    series: [
      { name: '频次', type: 'bar', data: h.freq, itemStyle: { color: '#0047ab', borderRadius: [2, 2, 0, 0] }, markLine: { symbol: 'none', data: ml } },
      { name: '正态拟合', type: 'line', data: h.normalFreq || [], smooth: true, symbol: 'none', lineStyle: { color: '#e03616', width: 2 } },
    ]
  })
}

function drawTrend() {
  if (!trendChartRef.value) return
  trendChart?.dispose(); trendChart = echarts.init(trendChartRef.value)
  const t = trend.value
  if (!t?.length) return
  trendChart.setOption({
    grid: { left: 35, right: 15, top: 20, bottom: 45 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: t.map(c => c.periodValue), axisLabel: { color: '#9e9e9e', fontSize: 9, rotate: 35 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 9 } },
    series: [{
      type: 'line', data: t.map(c => c.cpk), smooth: true, symbolSize: 6,
      lineStyle: { color: '#0047ab', width: 2 }, itemStyle: { color: '#0047ab' },
      markLine: { symbol: 'none', data: [
        { yAxis: 1.33, lineStyle: { color: '#2e9e5b', type: 'dashed' }, label: { formatter: '1.33', color: '#2e9e5b', fontSize: 9 } },
        { yAxis: 1.0, lineStyle: { color: '#e03616', type: 'dashed' }, label: { formatter: '1.0', color: '#e03616', fontSize: 9 } },
      ] },
    }]
  })
}

async function openManual() {
  if (!paramId.value) { ElMessage.warning('请先选择 SPC 参数'); return }
  manual.value = {}
  autoRef.value = null
  try {
    const listRes = await spcControlLimitApi.list(paramId.value)
    // 参考值优先取最近一条自动基线;当前值优先回显激活基线
    autoRef.value = listRes?.find(l => !l.manual) || null
    const active = listRes?.find(l => l.isActive) || listRes?.[0]
    if (active) manual.value = { xbarUcl: active.xbarUcl, xbarCl: active.xbarCl, xbarLcl: active.xbarLcl, rUcl: active.rUcl, rCl: active.rCl, rLcl: active.rLcl }
  } catch (e) { /* 无基线则留空 */ }
  manualVisible.value = true
}

async function saveManual() {
  const m = manual.value
  if (m.xbarUcl == null || m.xbarCl == null || m.xbarLcl == null) {
    ElMessage.warning('请完整填写 Xbar 图 UCL / CL / LCL')
    return
  }
  if (!(m.xbarUcl > m.xbarCl && m.xbarCl > m.xbarLcl)) {
    ElMessage.error('控制限必须满足 UCL > CL > LCL')
    return
  }
  if (m.rUcl != null && m.rLcl != null && m.rUcl < m.rLcl) {
    ElMessage.error('R 图控制限必须满足 UCL ≥ LCL')
    return
  }
  manualSaving.value = true
  try {
    await spcControlLimitApi.saveManual(paramId.value, m)
    ElMessage.success('人工控制限已保存并生效')
    manualVisible.value = false
    loadChart()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败，请检查数值后重试')
  } finally {
    manualSaving.value = false
  }
}

onMounted(async () => { params.value = await spcParamApi.list(); if (paramId.value) loadChart() })
onUnmounted(() => { xbarChart?.dispose(); rChart?.dispose(); histChart?.dispose(); trendChart?.dispose() })
</script>

<style lang="scss" scoped>
.grid-b { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
.left-b { display: flex; flex-direction: column; gap: 16px; }
.chart { height: 300px; }
.right-b { display: flex; flex-direction: column; gap: 16px; }
.cpk-row { display: flex; gap: 24px; }
.cpk { .l { font-size: 11px; color: $ink-faint; letter-spacing: 1px; } .v { font-size: 22px; font-weight: 700; } }
.c-green { color: $green; } .c-amber { color: $amber; } .c-red { color: $signal-red; }
.cap-foot { margin-top: 8px; font-size: 11px; color: $ink-faint; }
.cap-note { margin-top: 10px; padding: 8px 10px; border-radius: 6px; font-size: 12px; line-height: 1.5; background: #fff7e6; border: 1px solid #ffe1a8; color: #a05a00; display: flex; gap: 6px; align-items: flex-start; }
.cap-note__icon { flex: none; }
.cap-note--err { background: #fdecec; border-color: #f5c2c2; color: #b3261e; }
.cap-note--ok { background: #ecf7f0; border-color: #b6e2c8; color: #1f7a47; }
.trend-tbl { font-size: 11px; border: 1px solid $hairline; border-radius: 6px; overflow: hidden; }
.trend-tbl .tr { display: grid; grid-template-columns: 1.4fr 0.8fr 0.8fr 1.1fr; padding: 6px 8px; border-bottom: 1px solid $hairline; }
.trend-tbl .tr:last-child { border-bottom: none; }
.trend-tbl .th { background: $paper; color: $ink-faint; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; }
.pill .d { width: 5px; height: 5px; border-radius: 50%; }
.p-done { background: #ecf7f0; color: #1f7a47; } .p-done .d { background: #2e9e5b; }
.p-run { background: #e8f0fe; color: #0047ab; } .p-run .d { background: #0047ab; }
.p-wait { background: #fff3e0; color: #a05a00; } .p-wait .d { background: #f5a623; }
.p-sign { background: #f3e8fd; color: #6a1fb0; } .p-sign .d { background: #8a3ff2; }

/* 人工覆盖弹窗 */
.m-help { background: $paper; border: 1px solid $hairline; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; font-size: 12px; line-height: 1.7; color: $ink-soft; }
.m-help__title { font-weight: 700; color: $ink; margin: 6px 0 2px; &:first-child { margin-top: 0; } }
.m-help p { margin: 0 0 4px; }
.m-help ul { margin: 0 0 4px; padding-left: 18px; }
.m-ref { border: 1px dashed $cobalt; background: $cobalt-dim; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
.m-ref__head { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: $cobalt; }
.m-ref__grid { display: flex; flex-direction: column; gap: 2px; font-size: 12px; margin-top: 4px; }
.m-warn { margin-top: 4px; padding: 8px 10px; border-radius: 6px; font-size: 12px; background: #fff7e6; border: 1px solid #ffe1a8; color: #a05a00; }
</style>
