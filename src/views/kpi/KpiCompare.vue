<template>
  <div class="kpi-compare">
    <!-- 头部 -->
    <header class="kc-head">
      <div>
        <h1 class="kc-title">分公司 KPI 对比</h1>
        <p class="kc-sub">跨公司质量指标并列对比 · 当前视图：<b>{{ viewLabel }}</b></p>
      </div>
      <div class="kc-legend" v-if="data">
        <span v-for="(o, i) in data.orgs" :key="o.orgCode" class="kc-legend-item">
          <span class="dot" :style="{ background: orgColors[i] }"></span>{{ o.orgName }}
        </span>
      </div>
    </header>

    <!-- 加载态 -->
    <div v-if="loading" class="kc-state">
      <el-icon class="is-loading"><Loading /></el-icon> 数据加载中…
    </div>
    <div v-else-if="!data || data.items.length === 0" class="kc-state">暂无对比数据</div>

    <template v-else>
      <!-- 指标卡片区 -->
      <section class="kc-cards">
        <div v-for="item in data.items" :key="item.key" class="kc-card">
          <div class="kc-card-name">{{ item.name }}</div>
          <div class="kc-card-rows">
            <div v-for="(o, i) in data.orgs" :key="o.orgCode" class="kc-card-row">
              <span class="kc-dot" :style="{ background: orgColors[i] }"></span>
              <span class="kc-org">{{ o.orgName }}</span>
              <span class="kc-val">{{ fmt(item.values[o.orgCode], item.type) }}</span>
              <span class="kc-track">
                <span class="kc-fill" :style="{ width: barWidth(item, o.orgCode) + '%', background: orgColors[i] }"></span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 图表区 -->
      <section class="kc-charts">
        <el-card class="kc-chart-card" shadow="never">
          <template #header><span class="kc-chart-title">数量类指标对比</span></template>
          <div ref="countChartRef" class="kc-chart"></div>
        </el-card>
        <el-card class="kc-chart-card" shadow="never">
          <template #header><span class="kc-chart-title">率类指标对比（%）</span></template>
          <div ref="rateChartRef" class="kc-chart"></div>
        </el-card>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { Loading } from '@element-plus/icons-vue'
import { kpiApi } from '@/api/modules/kpi/compare'
import type { KpiCompareVo, KpiItem } from '@/api/types/kpi'

const ORG_COLORS = ['#1F6FEB', '#F2994A', '#22C55E', '#9B51E0']

const data = ref<KpiCompareVo | null>(null)
const loading = ref(false)
const orgColors = computed(() => data.value?.orgs.map((_, i) => ORG_COLORS[i % ORG_COLORS.length]) ?? [])

const viewLabel = computed(() => {
  const cur = (window.localStorage.getItem('qms_current_org') || 'ALL')
  if (cur === 'ALL') return '全部（全局）'
  const o = data.value?.orgs.find((x) => x.orgCode === cur)
  return o ? o.orgName : cur
})

function fmt(v: number | null | undefined, type: string): string {
  if (v == null) return '—'
  return type === 'rate' ? `${v}%` : String(v)
}

// 卡片内迷你条:以该指标两公司较大值为基准的占比
function barWidth(item: KpiItem, orgCode: string): number {
  const vals = data.value?.orgs.map((o) => Number(item.values[o.orgCode] ?? 0)) ?? [0, 0]
  const max = Math.max(...vals, 1)
  const v = Number(item.values[orgCode] ?? 0)
  return Math.round((v / max) * 100)
}

const countChartRef = ref<HTMLElement>()
const rateChartRef = ref<HTMLElement>()
let countChart: echarts.ECharts | null = null
let rateChart: echarts.ECharts | null = null

function buildOption(metricType: 'count' | 'rate') {
  const orgs = data.value?.orgs ?? []
  const items = (data.value?.items ?? []).filter((i) => i.type === metricType)
  const names = items.map((i) => i.name)
  const series = orgs.map((o, idx) => ({
    name: o.orgName,
    type: 'bar' as const,
    barMaxWidth: 30,
    itemStyle: { color: ORG_COLORS[idx % ORG_COLORS.length], borderRadius: [4, 4, 0, 0] },
    data: items.map((i) => i.values[o.orgCode] ?? 0),
  }))
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => (metricType === 'rate' ? `${v}%` : String(v)) },
    legend: { top: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
    grid: { left: 8, right: 16, bottom: 8, top: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { interval: 0, rotate: names.length > 6 ? 22 : 0, fontSize: 11, color: '#606266' },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#909399', formatter: (v: number) => (metricType === 'rate' ? `${v}%` : String(v)) },
      splitLine: { lineStyle: { color: '#EEF1F5' } },
    },
    series,
  }
}

function renderCharts() {
  if (!data.value) return
  // 必须等 DOM 完成布局后再 init,否则初次挂载时容器宽度可能为 0,ECharts 取到 0 宽后
  // 即便后续 setOption 也不会自动撑开,导致两个图表区域空白。
  nextTick(() => {
    if (countChartRef.value && !countChart) countChart = echarts.init(countChartRef.value)
    if (rateChartRef.value && !rateChart) rateChart = echarts.init(rateChartRef.value)
    countChart?.setOption(buildOption('count'))
    rateChart?.setOption(buildOption('rate'))
    countChart?.resize()
    rateChart?.resize()
  })
}

function onResize() {
  countChart?.resize()
  rateChart?.resize()
}

async function load() {
  loading.value = true
  try {
    data.value = await kpiApi.compare()
  } catch {
    data.value = null
  } finally {
    // 必须等 loading 置为 false、v-else 图表区域真正挂载到 DOM 后再渲染,
    // 否则 echarts.init 时图表 div 还不存在(ref 为 null),会导致图表区域永久空白。
    loading.value = false
    await nextTick()
    renderCharts()
  }
}

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  countChart?.dispose()
  rateChart?.dispose()
})

// currentOrgId 变化(切换器)时,本页随 BasicLayout 重挂载,会自动重新 load
// 同时监听 loading:数据加载完成且 loading 置 false 后图表区域才会挂载,需重新渲染
watch([data, loading], () => renderCharts())
</script>

<style scoped lang="scss">
.kpi-compare { max-width: 1200px; margin: 0 auto; }

.kc-head {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 6px 2px 18px;
}
.kc-title { margin: 0; font-size: 20px; font-weight: 600; color: #1F2329; letter-spacing: .5px; }
.kc-sub { margin: 6px 0 0; font-size: 13px; color: #909399; }
.kc-sub b { color: #1F6FEB; font-weight: 600; }
.kc-legend { display: flex; gap: 16px; }
.kc-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #606266; }
.kc-legend-item .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

.kc-state { padding: 80px 0; text-align: center; color: #909399; font-size: 14px; }
.kc-state .is-loading { margin-right: 6px; }

/* 卡片区 */
.kc-cards {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-bottom: 18px;
}
.kc-card {
  background: #fff; border: 1px solid #EBEEF5; border-radius: 12px; padding: 16px 18px;
  box-shadow: 0 1px 2px rgba(16,24,40,.04); transition: box-shadow .2s, transform .2s;
}
.kc-card:hover { box-shadow: 0 8px 24px rgba(31,111,235,.10); transform: translateY(-2px); }
.kc-card-name { font-size: 13px; font-weight: 600; color: #1F2329; margin-bottom: 14px; }
.kc-card-rows { display: flex; flex-direction: column; gap: 12px; }
.kc-card-row { display: grid; grid-template-columns: 12px 64px auto 1fr; align-items: center; gap: 8px; }
.kc-dot { width: 9px; height: 9px; border-radius: 50%; }
.kc-org { font-size: 12px; color: #606266; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kc-val { font-size: 15px; font-weight: 600; color: #1F2329; font-family: 'PingFang SC', monospace; min-width: 56px; text-align: right; }
.kc-track { height: 6px; background: #F0F2F5; border-radius: 4px; overflow: hidden; }
.kc-fill { display: block; height: 100%; border-radius: 4px; transition: width .4s ease; }

/* 图表区 */
.kc-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.kc-chart-card { border-radius: 12px; border-color: #EBEEF5; }
.kc-chart-title { font-size: 14px; font-weight: 600; color: #1F2329; }
.kc-chart { width: 100%; height: 320px; min-width: 200px; }

@media (max-width: 900px) {
  .kc-charts { grid-template-columns: 1fr; }
}
</style>
