<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const loading = ref(false)
const startDate = ref('')
const endDate = ref('')

const analysis = ref<{
  total?: number
  faultTypeDist?: { fault_type: string; cnt: number; ratio: number }[]
  topTools?: { tool_no: string; tool_name: string; cnt: number }[]
  monthlyTrend?: { ym: string; cnt: number }[]
}>({ faultTypeDist: [], topTools: [], monthlyTrend: [] })

const distChart = ref<HTMLDivElement | null>(null)
const topChart = ref<HTMLDivElement | null>(null)
const trendChart = ref<HTMLDivElement | null>(null)
let distInst: any = null
let topInst: any = null
let trendInst: any = null

async function load() {
  loading.value = true
  try {
    const res = await tlmToolingApi.repairAnalysis({ startDate: startDate.value || undefined, endDate: endDate.value || undefined })
    analysis.value = res as any
    await nextTick()
    renderCharts()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载根因分析失败')
  } finally {
    loading.value = false
  }
}

function onSearch() { load() }

function renderCharts() {
  const dist = analysis.value.faultTypeDist || []
  const top = analysis.value.topTools || []
  const trend = analysis.value.monthlyTrend || []

  if (distInst) distInst.dispose()
  if (distChart.value) {
    distInst = echarts.init(distChart.value)
    distInst.setOption({
      title: { text: '故障类型分布（柏拉图）', left: 0, textStyle: { fontFamily: 'Archivo, sans-serif', fontSize: 14, color: '#141414' } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 48, right: 48, top: 48, bottom: 28 },
      xAxis: { type: 'category', data: dist.map((d: any) => d.fault_type), axisLabel: { color: '#5c5a55', fontSize: 12 } },
      yAxis: [
        { type: 'value', name: '次数', axisLabel: { color: '#5c5a55' } },
        { type: 'value', name: '占比%', max: 100, axisLabel: { color: '#5c5a55', formatter: '{value}%' } },
      ],
      series: [
        { name: '次数', type: 'bar', data: dist.map((d: any) => d.cnt), itemStyle: { color: '#0047ab' }, barWidth: '46%' },
        { name: '占比', type: 'line', yAxisIndex: 1, data: dist.map((d: any) => d.ratio), itemStyle: { color: '#e03616' }, symbol: 'circle', symbolSize: 7 },
      ],
    })
  }

  if (topInst) topInst.dispose()
  if (topChart.value) {
    topInst = echarts.init(topChart.value)
    topInst.setOption({
      title: { text: '高频维修工装 TOP10', left: 0, textStyle: { fontFamily: 'Archivo, sans-serif', fontSize: 14, color: '#141414' } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 16, right: 24, top: 48, bottom: 28, containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: '#5c5a55' } },
      yAxis: { type: 'category', data: top.map((t: any) => (t.tool_no || '—') + (t.tool_name ? ' ' + t.tool_name : '')).reverse(), axisLabel: { color: '#5c5a55', fontSize: 12 } },
      series: [{ name: '维修次数', type: 'bar', data: top.map((t: any) => t.cnt).reverse(), itemStyle: { color: '#c77800' }, barWidth: '56%' }],
    })
  }

  if (trendInst) trendInst.dispose()
  if (trendChart.value) {
    trendInst = echarts.init(trendChart.value)
    trendInst.setOption({
      title: { text: '月度维修趋势', left: 0, textStyle: { fontFamily: 'Archivo, sans-serif', fontSize: 14, color: '#141414' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 16, right: 24, top: 48, bottom: 28, containLabel: true },
      xAxis: { type: 'category', data: trend.map((t: any) => t.ym), axisLabel: { color: '#5c5a55', fontSize: 12 } },
      yAxis: { type: 'value', axisLabel: { color: '#5c5a55' } },
      series: [{ name: '维修单数', type: 'line', smooth: true, data: trend.map((t: any) => t.cnt), itemStyle: { color: '#0047ab' }, areaStyle: { color: 'rgba(0,71,171,0.08)' } }],
    })
  }
}

function onResize() {
  distInst?.resize(); topInst?.resize(); trendInst?.resize()
}
onMounted(() => { load(); window.addEventListener('resize', onResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize); distInst?.dispose(); topInst?.dispose(); trendInst?.dispose() })
</script>

<template>
  <div class="page-wrap rise" v-loading="loading">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">维修根因分析</span></div>
        <h1>工装维修根因分析<span class="no mono">TLM</span></h1>
      </div>
      <div v-if="analysis.total != null" class="mute" style="font-size:13px;">统计周期维修工单合计 <span class="mono c-cobalt">{{ analysis.total }}</span> 单</div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="起始日期">
          <el-date-picker v-model="startDate" type="date" value-format="YYYY-MM-DD" placeholder="不限" style="width:160px" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="endDate" type="date" value-format="YYYY-MM-DD" placeholder="不限" style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="grid-2">
      <el-card class="card-b" :body-style="{ padding: '0' }">
        <div class="card-head"><h2>故障类型分布</h2></div>
        <div ref="distChart" style="height:320px;padding:8px 12px;"></div>
      </el-card>
      <el-card class="card-b" :body-style="{ padding: '0' }">
        <div class="card-head"><h2>高频维修工装 TOP10</h2></div>
        <div ref="topChart" style="height:320px;padding:8px 12px;"></div>
      </el-card>
    </div>

    <el-card class="card-b" :body-style="{ padding: '0' }" style="margin-top:18px">
      <div class="card-head"><h2>月度维修趋势</h2></div>
      <div ref="trendChart" style="height:320px;padding:8px 12px;"></div>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }" style="margin-top:18px" v-if="analysis.faultTypeDist && analysis.faultTypeDist.length">
      <div class="card-head"><h2>故障类型明细</h2></div>
      <el-table :data="analysis.faultTypeDist" style="width:100%">
        <el-table-column label="故障类型" width="180"><template #default="{ row }"><span class="tag-b">{{ row.fault_type }}</span></template></el-table-column>
        <el-table-column label="维修单数" width="140"><template #default="{ row }"><span class="mono">{{ row.cnt }}</span></template></el-table-column>
        <el-table-column label="占比" min-width="200"><template #default="{ row }">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="flex:1;height:8px;background:#e4e2dd;border-radius:4px;overflow:hidden;"><div :style="{ width: row.ratio + '%', height:'100%', background: row.ratio >= 30 ? '#e03616' : '#0047ab' }"></div></div>
            <span class="mono">{{ row.ratio }}%</span>
          </div>
        </template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
@media (max-width: 1100px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
