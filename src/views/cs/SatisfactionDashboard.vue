<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { csWorkOrderApi } from '@/api/modules/cs/workOrder'
import type { SatisfactionStats } from '@/api/types/cs'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const stats = ref<SatisfactionStats>({})
const distRef = ref<HTMLElement | null>(null)
const trendRef = ref<HTMLElement | null>(null)
let distChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

async function load() {
  try {
    stats.value = await csWorkOrderApi.satisfactionStats()
    await nextTick()
    renderCharts()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载满意度统计失败')
  }
}

function renderCharts() {
  if (distRef.value) {
    if (!distChart) distChart = echarts.init(distRef.value)
    const dist = stats.value.distribution || {}
    const scores = [1, 2, 3, 4, 5]
    distChart.setOption({
      title: { text: '评分分布', left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#141414' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 40, bottom: 28 },
      xAxis: { type: 'category', data: scores.map(s => s + '★'), axisLabel: { fontFamily: 'IBM Plex Mono', fontSize: 11 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar', barWidth: '46%',
        data: scores.map(s => dist[String(s)] || 0),
        itemStyle: { color: '#0047ab', borderRadius: [4, 4, 0, 0] },
      }],
    })
  }
  if (trendRef.value) {
    if (!trendChart) trendChart = echarts.init(trendRef.value)
    const monthly = stats.value.monthly || []
    trendChart.setOption({
      title: { text: '月度满意度趋势', left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#141414' } },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 50 },
      xAxis: { type: 'category', data: monthly.map(m => m.month), axisLabel: { fontFamily: 'IBM Plex Mono', fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: 5 },
      series: [
        { name: '平均分', type: 'line', smooth: true, data: monthly.map(m => m.avgScore), itemStyle: { color: '#0047ab' }, lineStyle: { color: '#0047ab' } },
        { name: '评价数', type: 'bar', yAxisIndex: 0, data: monthly.map(m => m.cnt), itemStyle: { color: '#e4e2dd' }, barWidth: '30%' },
      ],
    })
  }
}

function onResize() { distChart?.resize(); trendChart?.resize() }
window.addEventListener('resize', onResize)

onMounted(load)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">售后管理</span><span class="crumb-sep">/</span><span class="crumb-link">满意度看板</span></div>
        <h1>客户满意度<span class="no mono">CS</span></h1>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-num mono c-cobalt">{{ stats.avgScore != null ? stats.avgScore : '—' }}</div>
        <div class="stat-lbl">平均满意度（满分 5）</div>
      </div>
      <div class="stat-card">
        <div class="stat-num mono p-done-t">{{ stats.rated || 0 }}</div>
        <div class="stat-lbl">已评价工单</div>
      </div>
    </div>

    <div class="chart-grid">
      <el-card class="card-b" :body-style="{ padding: '16px 22px' }">
        <div ref="distRef" class="chart"></div>
      </el-card>
      <el-card class="card-b" :body-style="{ padding: '16px 22px' }">
        <div ref="trendRef" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.stat-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border: 1px solid $hairline; border-radius: 8px; padding: 14px 16px; }
.stat-num { font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-lbl { font-size: 12px; color: $ink-faint; margin-top: 4px; }
.chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.chart { width: 100%; height: 320px; }
</style>
