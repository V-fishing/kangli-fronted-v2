<template>
  <div class="spc-capability" v-loading="loading">
    <!-- ====== 页面头部 ====== -->
    <div class="head-b">
      <div class="pagenav">
        <span class="s1">S</span><span class="s1">P</span><span class="s1">C</span>
        <span class="sep">/</span>
        <span class="s2">能力分析</span>
      </div>
      <h1>过程能力分析</h1>
      <div class="head-extra">
        <el-button v-if="activePhase === 'detail'" type="default" size="default" @click="backToOverview" class="btn-back">
          返回概览
        </el-button>
      </div>
    </div>

    <!-- ====== 概览阶段 ====== -->
    <template v-if="activePhase === 'overview'">
      <!-- 统计卡 -->
      <div class="stats-row" :style="{ animationDelay: '0s' }">
        <div class="stat-item">
          <span class="stat-label">覆盖参数</span>
          <span class="stat-num">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">能力充足</span>
          <span class="stat-num c-green">{{ stats.levelA }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">能力尚可</span>
          <span class="stat-num c-amber">{{ stats.levelB }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">能力不足</span>
          <span class="stat-num c-red">{{ stats.levelC }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">样本不足</span>
          <span class="stat-num c-faint">{{ stats.levelNA }}</span>
        </div>
      </div>

      <!-- CPK 等级分布 + 能力表 -->
      <div class="card-b" :style="{ animationDelay: '0.05s' }">
        <div class="card-head">
          <h2 class="card-title">CPK 等级分布</h2>
        </div>
        <div class="overview-grid">
          <div class="pie-wrap">
            <div ref="pieChartRef" class="chart-box"></div>
          </div>
          <div class="table-wrap">
            <table class="native-table">
              <thead>
                <tr>
                  <th>参数名称</th>
                  <th>工序</th>
                  <th class="mono">CPK</th>
                  <th class="mono">PPK</th>
                  <th>等级</th>
                  <th class="mono">样本量</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in mergedList"
                  :key="row.paramId"
                  :style="{ animationDelay: (0.08 + i * 0.02) + 's' }"
                  :class="{ 'row-active': selectedParamId === row.paramId }"
                >
                  <td>{{ row.paramName }}</td>
                  <td class="mono">{{ row.procName || '-' }}</td>
                  <td class="mono">
                    <span :class="cpkClass(row.cpk)">{{ fmtNum(row.cpk) }}</span>
                  </td>
                  <td class="mono">
                    <span :class="cpkClass(row.ppk)">{{ fmtNum(row.ppk) }}</span>
                  </td>
                  <td>
                    <span :class="levelPill(row.level)">
                      {{ levelLabel(row.level) }}
                    </span>
                  </td>
                  <td class="mono">{{ row.sampleCount ?? '-' }}</td>
                  <td>
                    <template v-if="row.hasCapability">
                      <span class="row-hint" @click.stop="selectParam(row)">查看 &rarr;</span>
                    </template>
                    <template v-else>
                      <el-button
                        size="small"
                        type="primary"
                        :loading="!!computingIds[row.paramId]"
                        v-if="canCalc"
                        @click.stop="calcAndEnter(row)"
                      >计算</el-button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- ====== 详情阶段 ====== -->
    <template v-if="activePhase === 'detail'">
      <!-- 详情加载失败时显示错误提示 -->
      <div v-if="!detail" class="card-b" :style="{ animationDelay: '0s' }">
        <div class="empty-state">
          <p class="empty-hint">数据加载失败，请返回概览重试</p>
          <p class="empty-sub">
            可能原因：该参数暂无子组数据 / 没有操作权限 / 网络异常。请打开浏览器控制台(F12)查看具体错误。
          </p>
          <el-button type="primary" size="default" @click="backToOverview" style="margin-top:12px">返回概览</el-button>
        </div>
      </div>

      <!-- 参数信息卡 -->
      <div v-if="detail" class="card-b" :style="{ animationDelay: '0s' }">
        <div class="detail-header">
          <div class="detail-param">
            <h2 class="card-title">{{ detail.paramName }}</h2>
            <span class="mono dim">{{ detail.paramCode }}</span>
          </div>
          <div class="detail-meta">
            <div class="meta-item">
              <span class="meta-label">规格限</span>
              <span class="mono">{{ fmtNum(detail.lsl) }} ~ {{ fmtNum(detail.usl) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">均值</span>
              <span class="mono">{{ fmtNum(histogram?.mean) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">标准差</span>
              <span class="mono">{{ fmtNum(histogram?.sigma) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">计算时间</span>
              <span class="mono">{{ fmtTime(detail?.calcAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CPK/PPK 仪表盘(仅计量型;计数型走 countCapability 卡片) -->
      <div v-if="detail && !countCapability" class="card-b" :style="{ animationDelay: '0.05s' }">
        <div class="card-head">
          <h2 class="card-title">能力指标</h2>
        </div>
        <div class="gauge-row">
          <div class="gauge-item">
            <div ref="cpkGaugeRef" class="chart-box"></div>
          </div>
          <div class="gauge-item">
            <div ref="ppkGaugeRef" class="chart-box"></div>
          </div>
          <div class="gauge-stats">
            <div class="g-stat">
              <span class="g-label">CPU</span>
              <span class="g-val mono" :class="cpkClass(cpuCpl.cpu)">{{ fmtNum(cpuCpl.cpu) }}</span>
            </div>
            <div class="g-stat">
              <span class="g-label">CPL</span>
              <span class="g-val mono" :class="cpkClass(cpuCpl.cpl)">{{ fmtNum(cpuCpl.cpl) }}</span>
            </div>
            <div class="g-stat">
              <span class="g-label">样本量</span>
              <span class="g-val mono">{{ detail.sampleCount ?? '-' }}</span>
            </div>
            <div class="g-stat">
              <span class="g-label">等级</span>
              <span :class="levelPill(detail.level)">{{ levelLabel(detail.level) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 计数型过程水平(替代 Cp/Cpk) -->
      <div v-if="countCapability" class="card-b" :style="{ animationDelay: '0.07s' }">
        <div class="card-head">
          <h2 class="card-title">计数型过程水平</h2>
          <span class="sub">{{ countCapability.chartKind }} 图 · {{ countCapability.sampleCount }} 个子组</span>
        </div>
        <div style="padding:16px 22px">
          <template v-if="(countCapability.chartKind === 'P' || countCapability.chartKind === 'NP') && countCapability.pBar != null">
            <div class="gauge-stats">
              <div class="g-stat"><span class="g-label">过程平均不合格率 p̄</span><span class="g-val mono">{{ (Number(countCapability.pBar) * 100).toFixed(3) }}%</span></div>
              <div class="g-stat"><span class="g-label">PPM</span><span class="g-val mono" :class="(countCapability.ppm || 0) > 0 ? 'c-amber' : 'c-green'">{{ (countCapability.ppm || 0).toLocaleString() }}</span></div>
              <div class="g-stat"><span class="g-label">合格率(良品率)</span><span class="g-val mono c-green">{{ (Number(countCapability.yieldRate) * 100).toFixed(3) }}%</span></div>
            </div>
            <div class="cap-foot">计数型参数无规格上下限,不计算 Cp/Cpk;以上为过程平均质量水平</div>
          </template>
          <template v-else-if="(countCapability.chartKind === 'C' || countCapability.chartKind === 'U') && countCapability.uBar != null">
            <div class="gauge-stats">
              <div class="g-stat"><span class="g-label">平均单位缺陷数 ū</span><span class="g-val mono">{{ Number(countCapability.uBar).toFixed(4) }}</span></div>
              <div class="g-stat"><span class="g-label">DPU</span><span class="g-val mono" :class="(countCapability.dpu || 0) > 0 ? 'c-amber' : 'c-green'">{{ Number(countCapability.dpu).toFixed(4) }}</span></div>
            </div>
            <div class="cap-foot">计数型参数无规格上下限,不计算 Cp/Cpk;以上为单位缺陷水平</div>
          </template>
          <template v-else>
            <div class="cap-foot">尚无计数子组数据(请先在采集页录入不合格数/缺陷数)</div>
          </template>
        </div>
      </div>

      <!-- 直方图 + 趋势 双栏(仅计量型;计数型无直方图/CPK 趋势) -->
      <div v-if="detail && !countCapability" class="grid-b" :style="{ animationDelay: '0.10s' }">
        <div class="card-b card-b--flush">
          <div class="card-head">
            <h2 class="card-title">分布直方图</h2>
          </div>
          <div ref="histogramRef" class="chart-box chart-box--lg"></div>
        </div>
        <div class="card-b card-b--flush">
          <div class="card-head">
            <h2 class="card-title">CPK / PPK 趋势</h2>
          </div>
          <div ref="trendRef" class="chart-box chart-box--lg"></div>
        </div>
      </div>

      <!-- 供应商 CPK 对比 -->
      <div class="card-b" :style="{ animationDelay: '0.15s' }" v-if="detail && supplierData.length">
        <div class="card-head">
          <h2 class="card-title">供应商 CPK 对比</h2>
        </div>
        <table class="native-table">
          <thead>
            <tr>
              <th>参数名称</th>
              <th class="mono">CPK</th>
              <th>等级</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in supplierData" :key="s.mat || s.sup || i" :style="{ animationDelay: (0.18 + i * 0.02) + 's' }">
              <td>{{ s.mat || '-' }}</td>
              <td class="mono"><span :class="cpkClass(s.cpk)">{{ fmtNum(s.cpk) }}</span></td>
              <td>
                <span :class="levelPill(s.lvl || '')">{{ levelLabel(s.lvl || '') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-b" :style="{ animationDelay: '0.15s' }" v-if="detail && !supplierData.length">
        <p class="empty-hint">暂无供应商对比数据</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { usePermissionStore } from '@/stores/permission'
import * as echarts from 'echarts'
import { spcCapabilityApi } from '@/api/modules/spc/capability'
import { spcChartApi } from '@/api/modules/spc/chart'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcSubgroupApi } from '@/api/modules/spc/subgroups'
const perm = usePermissionStore()
// 能力计算权限(后端 spc.capability.list 守卫)
const canCalc = computed(() => perm.has('spc.capability.list'))
import type { SpcCapability, SpcSupplierCpkVo, SpcHistogramVo, SpcParam, CountCapabilityVo } from '@/api/types/spc'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

/** 合并视图：参数基础信息 + 能力计算结果（若有） */
interface MergedCapability extends SpcCapability {
  procName?: string
  hasCapability: boolean
}

// ====== 状态 ======
const loading = ref(false)
const activePhase = ref<'overview' | 'detail'>('overview')

const capabilities = ref<SpcCapability[]>([])
const params = ref<SpcParam[]>([])
const mergedList = ref<MergedCapability[]>([])
const computingIds = ref<Record<string, boolean>>({})
const selectedParamId = ref<string | null>(null)

const detail = ref<SpcCapability | null>(null)
/** 计数型参数过程水平聚合(替代 Cp/Cpk) */
const countCapability = ref<CountCapabilityVo | null>(null)
const histogram = ref<SpcHistogramVo | null>(null)
const trends = ref<SpcCapability[]>([])
const supplierData = ref<SpcSupplierCpkVo[]>([])

// ====== 图表 DOM ======
const pieChartRef = ref<HTMLDivElement>()
const cpkGaugeRef = ref<HTMLDivElement>()
const ppkGaugeRef = ref<HTMLDivElement>()
const histogramRef = ref<HTMLDivElement>()
const trendRef = ref<HTMLDivElement>()

let pieInstance: echarts.ECharts | null = null
let cpkGaugeInstance: echarts.ECharts | null = null
let ppkGaugeInstance: echarts.ECharts | null = null
let histogramInstance: echarts.ECharts | null = null
let trendInstance: echarts.ECharts | null = null

// ====== 统计 ======
const stats = computed(() => {
  let levelA = 0, levelB = 0, levelC = 0, levelNA = 0
  mergedList.value.forEach(c => {
    if (!c.hasCapability) { levelNA++; return }
    const lv = normalizeLevel(c.level)
    if (lv === 'A') levelA++
    else if (lv === 'B') levelB++
    else if (lv === 'C') levelC++
    else levelNA++
  })
  return { total: mergedList.value.length, levelA, levelB, levelC, levelNA }
})

// ====== 工具函数 ======
const fmtNum = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return '-'
  return v.toFixed(3)
}

const cpkClass = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return 'c-faint'
  if (v >= 1.33) return 'c-green'
  if (v >= 1.0) return 'c-amber'
  return 'c-red'
}

/** 计算时间格式化(ISO -> yyyy-MM-dd HH:mm) */
const fmtTime = (v: string | null | undefined): string => {
  if (!v) return '-'
  return v.replace('T', ' ').slice(0, 16)
}

/** 单侧能力指数 CPU/CPL:基于规格限与直方图的整体 σ(默认 k=3),与 Ppk 同口径 */
const cpuCpl = computed(() => {
  const u = detail.value?.usl
  const l = detail.value?.lsl
  const m = histogram.value?.mean
  const s = histogram.value?.sigma
  if (u == null || l == null || m == null || !s) return { cpu: null as number | null, cpl: null as number | null }
  const k = 3
  return { cpu: (u - m) / (k * s), cpl: (m - l) / (k * s) }
})

/** 等级归一化：后端返回 level 可能是中文(充足/尚可/不足)或英文码(A/B/C)，统一映射。 */
const normalizeLevel = (l: string | undefined | null): 'A' | 'B' | 'C' | 'NA' => {
  if (!l) return 'NA'
  if (l === 'A' || l === '充足') return 'A'
  if (l === 'B' || l === '尚可') return 'B'
  if (l === 'C' || l === '不足') return 'C'
  return 'NA'
}

const levelLabel = (l: string | undefined | null): string =>
  ({ A: '充足', B: '尚可', C: '不足' } as Record<string, string>)[normalizeLevel(l)] || '数据不足'

const levelPill = (l: string | undefined | null): string =>
  ({ A: 'pill p-done', B: 'pill p-run', C: 'pill p-lock' } as Record<string, string>)[normalizeLevel(l)] || 'pill p-mute'

// ====== 数据加载 ======
const loadOverview = async () => {
  loading.value = true
  try {
    // 并行加载参数列表和已有能力记录
    const [paramRes, capRes] = await Promise.all([
      spcParamApi.list().catch((e: any) => { console.error('[能力分析] paramApi.list 失败:', e?.message, e); return [] as SpcParam[] }),
      spcCapabilityApi.list().catch((e: any) => { console.error('[能力分析] capApi.list 失败:', e?.message, e); return [] as SpcCapability[] }),
    ])
    params.value = paramRes || []
    capabilities.value = capRes || []

    // 构建能力索引：paramId → capability
    const capMap = new Map<string, SpcCapability>()
    capabilities.value.forEach(c => { if (c.paramId) capMap.set(c.paramId, c) })

    // 合并：全部参数 + 已有能力数据
    mergedList.value = params.value.map(p => {
      const cap = capMap.get(p.id)
      if (cap) {
        return {
          ...cap,
          id: p.id,
          paramId: p.id,
          paramCode: p.paramName,     // 后端无 paramCode，用 paramName 代替
          paramName: p.paramName,
          procName: p.procName,
          hasCapability: true,
        } as MergedCapability
      }
      return {
        id: p.id,
        paramId: p.id,
        paramCode: p.paramName,
        paramName: p.paramName,
        procName: p.procName,
        hasCapability: false,
        usl: p.specUpper,
        lsl: p.specLower,
      } as MergedCapability
    })

    await nextTick()
    renderPieChart()
  } finally {
    loading.value = false
  }
}

/** 从概览触发计算并进入详情 */
const calcAndEnter = async (row: MergedCapability) => {
  const pid = row.paramId
  computingIds.value[pid] = true
  try {
    await spcCapabilityApi.calc({ paramId: pid })
    ElMessage.success('能力计算完成')
  } catch (e: any) {
    const msg = e?.message || ''
    console.error('[能力分析] calcAndEnter calc 失败:', msg, e)
    if (msg.includes('无子组数据')) {
      ElMessage.warning('该参数暂无子组数据，请先在控制图页面录入测量值')
    } else if (msg.includes('403') || msg.includes('无权限')) {
      ElMessage.warning('没有操作权限，请联系管理员')
    } else {
      ElMessage.warning('计算失败：' + (msg || '请确认该参数有足够的子组数据'))
    }
  } finally {
    delete computingIds.value[pid]
  }
  // 重新加载概览（刷新合并列表）
  await loadOverview()
  // 进入详情
  const updated = mergedList.value.find(m => m.paramId === pid)
  if (updated && updated.hasCapability) {
    await selectParam(updated)
  }
}

const selectParam = async (row: SpcCapability) => {
  selectedParamId.value = row.paramId
  activePhase.value = 'detail'
  loading.value = true
  try {
    // 同时调用 calc（确保最新数据）和图表数据
    const pid = row.paramId
    const [det, hist, trend, supplier, cc] = await Promise.all([
      spcCapabilityApi.calc({ paramId: pid }).catch((e: any) => { console.error('[能力分析] selectParam calc 失败:', e?.message, e); return null }),
      spcChartApi.histogram({ paramId: pid }).catch((e: any) => { console.error('[能力分析] histogram 失败:', e?.message, e); return null }),
      spcCapabilityApi.trend({ paramId: pid, months: 12 }).catch((e: any) => { console.error('[能力分析] trend 失败:', e?.message, e); return [] as SpcCapability[] }),
      spcCapabilityApi.supplierCpk().catch((e: any) => { console.error('[能力分析] supplierCpk 失败:', e?.message, e); return [] as SpcSupplierCpkVo[] }),
      spcSubgroupApi.countCapability(pid).catch((e: any) => { console.error('[能力分析] countCapability 失败:', e?.message, e); return null }),
    ])
    // calc 返回实体不含 paramName/paramCode,从所点击行补全,保证详情头正确显示
    detail.value = det ? { ...det, paramName: row.paramName, paramCode: (row as any).paramCode } as SpcCapability : null
    histogram.value = hist
    countCapability.value = cc?.countType ? cc : null
    trends.value = trend || []
    supplierData.value = supplier || []
    await nextTick()
    renderGauges()
    renderHistogram()
    renderTrend()
  } finally {
    loading.value = false
  }
}

const backToOverview = () => {
  activePhase.value = 'overview'
  selectedParamId.value = null
  detail.value = null
  histogram.value = null
  trends.value = []
  supplierData.value = []
  countCapability.value = null
  loadOverview()
}

// ====== ECharts 图表 ======

const baseChartOption = () => ({
  backgroundColor: 'transparent',
  grid: { left: 50, right: 20, top: 18, bottom: 30 },
  textStyle: { fontFamily: "'Noto Sans SC', sans-serif" },
})

const renderPieChart = () => {
  if (!pieChartRef.value) return
  if (!pieInstance) pieInstance = echarts.init(pieChartRef.value)

  const data = [
    { value: stats.value.levelA, name: '充足 (Cpk≥1.33)', itemStyle: { color: '#1a7f4b' } },
    { value: stats.value.levelB, name: '尚可 (1.0≤Cpk<1.33)', itemStyle: { color: '#c77800' } },
    { value: stats.value.levelC, name: '不足 (Cpk<1.0)', itemStyle: { color: '#e03616' } },
    { value: stats.value.levelNA, name: '数据不足', itemStyle: { color: '#e4e2dd' } },
  ].filter(d => d.value > 0)

  pieInstance.setOption({
    ...baseChartOption(),
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['54%', '74%'],
      center: ['50%', '50%'],
      itemStyle: { borderColor: '#ffffff', borderWidth: 2, borderRadius: 2 },
      label: { show: false },
      emphasis: { scaleSize: 6 },
      data,
    }],
  }, true)
}

const gaugeOption = (value: number, title: string) => {
  const max = Math.max(value * 1.4, 2.0)
  return {
    series: [{
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      center: ['50%', '58%'],
      radius: '88%',
      min: 0,
      max,
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 14,
          color: [
            [0.67 / max, '#1a7f4b'],
            [1.0 / max, '#c77800'],
            [1.33 / max, '#e03616'],
            [1, '#e03616'],
          ],
        },
      },
      pointer: { length: '62%', width: 5, itemStyle: { color: '#141414' } },
      axisTick: { distance: -14, length: 6, lineStyle: { width: 1, color: '#9e9e9e' } },
      splitLine: { distance: -18, length: 12, lineStyle: { width: 2, color: '#9e9e9e' } },
      axisLabel: { distance: 22, color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      detail: {
        valueAnimation: true,
        formatter: (v: number) => v.toFixed(3),
        fontSize: 44,
        fontFamily: "'Archivo', 'Noto Sans SC', sans-serif",
        color: '#141414',
        offsetCenter: [0, '64%'],
      },
      title: {
        offsetCenter: [0, '88%'],
        fontSize: 12,
        color: '#5c5c5c',
        fontFamily: "'Noto Sans SC', sans-serif",
      },
      data: [{ value, name: title }],
    }],
  }
}

const renderGauges = () => {
  if (!detail.value) return
  if (cpkGaugeRef.value) {
    if (!cpkGaugeInstance) cpkGaugeInstance = echarts.init(cpkGaugeRef.value)
    cpkGaugeInstance.setOption(gaugeOption(detail.value.cpk ?? 0, 'CPK'), true)
  }
  if (ppkGaugeRef.value) {
    if (!ppkGaugeInstance) ppkGaugeInstance = echarts.init(ppkGaugeRef.value)
    ppkGaugeInstance.setOption(gaugeOption(detail.value.ppk ?? 0, 'PPK'), true)
  }
}

const renderHistogram = () => {
  if (!histogramRef.value || !histogram.value) return
  if (!histogramInstance) histogramInstance = echarts.init(histogramRef.value)

  const bins = histogram.value.bins || []
  const freq = histogram.value.freq || []
  // bins 与 freq 为并行数组:bins[i] 是分箱中心(数值),freq[i] 是对应频次
  const xData = bins.map(b => b.toFixed(3))
  const yData = freq

  histogramInstance.setOption({
    ...baseChartOption(),
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'category', data: xData,
      axisLabel: { color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e4e2dd' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      splitLine: { lineStyle: { color: '#f2f1ee' } },
    },
    series: [{
      type: 'bar', data: yData,
      itemStyle: { color: '#0047ab', borderRadius: [2, 2, 0, 0] },
      barWidth: '92%',
    }],
    // 规格限标记线
    ...(histogram.value.usl != null ? {
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#e03616', type: 'dashed', width: 1 },
        label: { color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
        data: [
          { xAxis: fmtNum(histogram.value.usl), label: { formatter: `USL ${fmtNum(histogram.value.usl)}` } },
          ...(histogram.value.lsl != null ? [{ xAxis: fmtNum(histogram.value.lsl), label: { formatter: `LSL ${fmtNum(histogram.value.lsl)}` } }] : []),
        ],
      },
    } : {}),
  }, true)
}

const renderTrend = () => {
  if (!trendRef.value || !trends.value.length) return
  if (!trendInstance) trendInstance = echarts.init(trendRef.value)

  const months = trends.value.map(t => t.calcTime?.slice(0, 7) || '')
  const cpkData = trends.value.map(t => t.cpk ?? null)
  const ppkData = trends.value.map(t => t.ppk ?? null)

  trendInstance.setOption({
    ...baseChartOption(),
    tooltip: { trigger: 'axis' },
    grid: { left: 52, right: 24, top: 20, bottom: 30 },
    xAxis: {
      type: 'category', data: months,
      axisLabel: { color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e4e2dd' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      splitLine: { lineStyle: { color: '#f2f1ee' } },
    },
    series: [
      {
        name: 'CPK', type: 'line', data: cpkData,
        lineStyle: { color: '#0047ab', width: 2 },
        itemStyle: { color: '#0047ab' },
        symbol: 'circle', symbolSize: 5,
      },
      {
        name: 'PPK', type: 'line', data: ppkData,
        lineStyle: { color: '#6b4fd8', width: 2, type: 'dashed' },
        itemStyle: { color: '#6b4fd8' },
        symbol: 'diamond', symbolSize: 5,
      },
    ],
    // 基准线
    ...{
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', width: 1 },
        label: { fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
        data: [
          { yAxis: 1.33, lineStyle: { color: '#1a7f4b' }, label: { formatter: '1.33', color: '#1a7f4b' } },
          { yAxis: 1.0, lineStyle: { color: '#e03616' }, label: { formatter: '1.0', color: '#e03616' } },
        ],
      },
    },
  }, true)
}

// ====== Resize ======
const handleResize = () => {
  pieInstance?.resize()
  cpkGaugeInstance?.resize()
  ppkGaugeInstance?.resize()
  histogramInstance?.resize()
  trendInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadOverview()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  pieInstance?.dispose()
  cpkGaugeInstance?.dispose()
  ppkGaugeInstance?.dispose()
  histogramInstance?.dispose()
  trendInstance?.dispose()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.spc-capability {
  animation: rise 0.4s ease both;
}

// ====== 统计卡 ======
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}

.stat-item {
  background: $white;
  border: 1px solid $hairline;
  border-radius: $radius-md;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: rise 0.4s ease both;
}

.stat-label {
  font-size: 12px;
  color: $ink-faint;
  letter-spacing: 0.5px;
}

.stat-num {
  font-family: $font-display;
  font-size: 30px;
  color: $ink;
  line-height: 1.1;
}

// ====== 概览双栏 ======
.overview-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

.pie-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-wrap {
  max-height: 400px;
  overflow-y: auto;
}

// ====== 原生表格 ======
.native-table {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 10px 12px;
    font-size: 11px;
    color: $ink-faint;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid $hairline;
  }

  td {
    padding: 10px 12px;
    font-size: 13px;
    color: $ink;
    border-bottom: 1px solid $hairline-soft;
  }

  tbody tr {
    animation: rise 0.4s ease both;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: $cobalt-dim;
    }
  }

  .row-active {
    background: $cobalt-dim;
  }
}

.row-hint {
  font-size: 11px;
  color: $ink-faint;
  white-space: nowrap;
}

// ====== 详情头部 ======
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.detail-param {
  display: flex;
  flex-direction: column;
  gap: 2px;

  h2 { margin-bottom: 0; }
}

.detail-meta {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.meta-label {
  font-size: 11px;
  color: $ink-faint;
  letter-spacing: 0.3px;
}

.meta-item .mono {
  font-size: 13px;
  color: $ink;
}

.dim {
  color: $ink-faint;
  font-size: 12px;
}

// ====== 仪表盘行 ======
.gauge-row {
  display: grid;
  grid-template-columns: 1fr 1fr 240px;
  gap: 24px;
  align-items: center;
}

.gauge-item {
  height: 260px;
}

.gauge-stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-left: 16px;
  border-left: 1px solid $hairline-soft;
}

.g-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.g-label {
  font-size: 11px;
  color: $ink-faint;
  letter-spacing: 0.3px;
}

.g-val {
  font-size: 17px;
  color: $ink;
}

// ====== 图表框 ======
.chart-box {
  width: 100%;
  height: 320px;
}

.chart-box--lg {
  height: 340px;
}

// ====== 通用 ======
.c-green { color: $green; }
.c-amber { color: $amber; }
.c-red   { color: $signal-red; }
.c-faint { color: $ink-faint; }

.mono {
  font-family: $font-mono;
  font-feature-settings: 'tnum';
}

.empty-hint {
  font-size: 13px;
  color: $ink-faint;
  text-align: center;
  padding: 32px 0 8px;
}

.empty-sub {
  font-size: 12px;
  color: $ink-faint;
  text-align: center;
  padding-bottom: 12px;
  line-height: 1.6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}

.btn-back {
  border-color: $hairline;
  color: $ink;
  font-size: 13px;
}
</style>
