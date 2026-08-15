<template>
  <div class="chart-view">
    <div class="head-b"><AppBreadcrumb /><h1>控制图 · {{ param?.paramName || '选择参数' }}<span v-if="sampleTaskId" class="mode-tag">抽样任务视图</span></h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="参数"><el-select v-model="paramId" @change="loadChart" placeholder="选择SPC参数" style="width:240px"><el-option v-for="p in sameProductParams" :key="p.id" :label="paramOptionLabel(p)" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="阶段">
          <span class="stage-hint"><span class="dot" :class="stageClass"></span>{{ stageLabel }}（控制图基于全部样本子组计算，不受阶段限制）</span>
        </el-form-item>
        <el-form-item label="时间范围"><el-date-picker v-model="timeRange" type="datetimerange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD HH:mm:ss" style="width:360px" @change="loadChart" /></el-form-item>
        <el-form-item><el-button type="primary" plain :disabled="hasCountChart" @click="openManual">设置控制限</el-button></el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!paramId" @click="goCollect">
            <span style="display:inline-flex;align-items:center;gap:4px">去采集<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="13" height="13"><path fill="currentColor" d="M339.2 768a32 32 0 0 1 0-45.2L626.8 435.2H416a32 32 0 0 1 0-64h288a32 32 0 0 1 32 32v288a32 32 0 0 1-64 0V435.2L384.4 722.8A32 32 0 0 1 339.2 768"/></svg></span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="grid-b">
      <div class="left-b">
        <template v-for="(card, idx) in chartCards" :key="idx">
          <div class="card-b">
            <div class="card-head"><h2>{{ card.title }}</h2><span class="sub">{{ cardSubtitle(card) }}</span></div>
            <div class="chart" :ref="el => setCardRef(el, idx)"></div>
          </div>
        </template>
        <div v-if="!chartCards.length" class="card-b card-empty">该参数未配置控制图类型（chartCandidates 为空）</div>
      </div>
      <div class="right-b">
        <div class="card-b" v-if="isVariable">
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
        <!-- 计数型过程水平(替代 Cp/Cpk):P/NP 显示 p̄/PPM/合格率;C/U 显示 ū/DPU -->
        <div class="card-b" v-if="countCapability">
          <div class="card-head"><h2>计数型过程水平</h2><span class="sub">{{ countCapability.chartKind }} 图 · {{ countCapability.sampleCount }} 个子组</span></div>
          <div style="padding:16px 22px">
            <template v-if="(countCapability.chartKind === 'P' || countCapability.chartKind === 'NP') && countCapability.pBar != null">
              <div class="cpk-row">
                <div class="cpk"><span class="l">过程平均不合格率 p̄</span><span class="v mono">{{ (Number(countCapability.pBar) * 100).toFixed(3) }}%</span></div>
                <div class="cpk"><span class="l">PPM</span><span class="v mono" :class="(countCapability.ppm || 0) > 0 ? 'c-amber' : 'c-green'">{{ (countCapability.ppm || 0).toLocaleString() }}</span></div>
              </div>
              <div class="cpk-row">
                <div class="cpk"><span class="l">合格率(良品率)</span><span class="v mono c-green">{{ (Number(countCapability.yieldRate) * 100).toFixed(3) }}%</span></div>
                <div class="cpk"><span class="l">样本量</span><span class="v mono">{{ countCapability.sampleCount }}</span></div>
              </div>
              <div class="cap-foot">计数型参数无规格上下限,不计算 Cp/Cpk;以上为过程平均质量水平</div>
            </template>
            <template v-else-if="(countCapability.chartKind === 'C' || countCapability.chartKind === 'U') && countCapability.uBar != null">
              <div class="cpk-row">
                <div class="cpk"><span class="l">平均单位缺陷数 ū</span><span class="v mono">{{ Number(countCapability.uBar).toFixed(4) }}</span></div>
                <div class="cpk"><span class="l">DPU</span><span class="v mono" :class="(countCapability.dpu || 0) > 0 ? 'c-amber' : 'c-green'">{{ Number(countCapability.dpu).toFixed(4) }}</span></div>
              </div>
              <div class="cap-foot">计数型参数无规格上下限,不计算 Cp/Cpk;以上为单位缺陷水平</div>
            </template>
            <template v-else>
              <div class="cap-foot">尚无计数子组数据(请先在采集页录入不合格数/缺陷数)</div>
            </template>
          </div>
        </div>
        <div class="card-b" v-if="isVariable">
          <div class="card-head"><h2>直方图</h2><span class="sub" v-if="hist">μ={{ hist.mean?.toFixed(3) }} σ={{ hist.sigma?.toFixed(3) }}</span></div>
          <div class="chart" ref="histChartRef" style="height:220px"></div>
        </div>
        <div class="card-b" v-if="isVariable">
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

    <!-- 子组数据(每个节点的录入溯源:批号/工单/录入人) -->
    <div class="card-b sg-card" v-if="chartData?.subgroups?.length">
      <div class="card-head">
        <h2>子组数据</h2>
        <span class="sub">{{ chartData.subgroups.length }} 个子组 · 按录入时间升序</span>
      </div>
      <el-table :data="pagedSubgroups" :row-class-name="subgroupRowClass" size="default" style="width: 100%" :cell-style="{ padding: '7px 0' }">
        <el-table-column type="index" label="#" width="52" align="center" />
        <el-table-column label="子组号" width="84" align="center">
          <template #default="{ row }"><span class="mono">{{ row.subgroupNo ?? '-' }}</span></template>
        </el-table-column>
        <el-table-column label="批号" min-width="120">
          <template #default="{ row }"><span class="mono">{{ row.batchNo || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="工单号" min-width="120">
          <template #default="{ row }"><span class="mono">{{ row.woNo || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="录入人" min-width="100">
          <template #default="{ row }">{{ row.operatorName || row.operatorId || '系统' }}</template>
        </el-table-column>
        <el-table-column label="录入时间" min-width="150">
          <template #default="{ row }"><span class="mono">{{ fmtTime(row.subgroupTime || row.createdAt) }}</span></template>
        </el-table-column>
        <el-table-column label="均值 X̄" width="96" align="right">
          <template #default="{ row }"><span class="mono">{{ fmtNum(row.xbar) }}</span></template>
        </el-table-column>
        <el-table-column label="极差 R" width="88" align="right">
          <template #default="{ row }"><span class="mono">{{ fmtNum(row.rangeR) }}</span></template>
        </el-table-column>
        <el-table-column label="数据源" width="92" align="center">
          <template #default="{ row }"><span class="src-tag">{{ srcLabel(row.dataSource) }}</span></template>
        </el-table-column>
        <el-table-column label="判定" width="140" align="center">
          <template #default="{ row }">
            <span class="pill" :class="judgePill(row)"><span class="d"></span>{{ row.isOutlier ? '异常' : (row.judge || '正常') }}</span>
            <span v-if="row.isOutlier && row.outlierRule" class="rule-tag">规则 {{ row.outlierRule }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="sg-foot">
        <el-pagination
          v-model:current-page="subgroupPage"
          v-model:page-size="subgroupSize"
          :total="chartData.subgroups.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="onSubgroupPage" />
      </div>
    </div>
    <div class="card-b sg-card sg-empty" v-else-if="chartData && !chartData.subgroups?.length">
      <div class="card-head"><h2>子组数据</h2></div>
      <p class="empty-tip">该参数暂无子组数据（请先采集或录入测量值）</p>
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
          <span>R：UCL {{ fmtNum(autoRef.rucl) }} · CL {{ fmtNum(autoRef.rcl) }} · LCL {{ fmtNum(autoRef.rlcl) }}</span>
        </div>
      </div>
      <el-alert v-else type="warning" :closable="false" style="margin-bottom:12px" title="该参数暂无自动计算基线，请谨慎人工设定（可先在数据采集后执行控制限计算获得参考值）。" />

      <el-form label-width="110px">
        <el-divider content-position="left">Xbar 图（子组均值）</el-divider>
        <el-form-item label="UCL 上控制限" required><el-input-number v-model="manual.xbarUcl" :step="0.001" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="CL 中心线" required><el-input-number v-model="manual.xbarCl" :step="0.001" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="LCL 下控制限" required><el-input-number v-model="manual.xbarLcl" :step="0.001" controls-position="right" style="width:100%" /></el-form-item>
        <el-divider content-position="left">R 图（子组极差，选填）</el-divider>
        <el-form-item label="UCL 上控制限"><el-input-number v-model="manual.rucl" :step="0.001" :min="0" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="CL 中心线"><el-input-number v-model="manual.rcl" :step="0.001" :min="0" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="LCL 下控制限"><el-input-number v-model="manual.rlcl" :step="0.001" :min="0" controls-position="right" style="width:100%" /></el-form-item>
      </el-form>
      <div v-if="manualWarn" class="m-warn">⚠ {{ manualWarn }}</div>
      <template #footer><el-button @click="manualVisible=false">取消</el-button><el-button type="primary" :loading="manualSaving" @click="saveManual">保存覆盖</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcChartApi } from '@/api/modules/spc/chart'
import { spcCapabilityApi } from '@/api/modules/spc/capability'
import { spcSubgroupApi } from '@/api/modules/spc/subgroups'
import { spcControlLimitApi } from '@/api/modules/spc/control-limits'
import type { SpcParam, ControlChartVo, SpcCapability, SpcHistogramVo, SpcControlLimit, SpcSubgroup, CountCapabilityVo } from '@/api/types/spc'

const route = useRoute()
const router = useRouter()
const params = ref<SpcParam[]>([])
const paramId = ref((route.params.id as string) || '')
const param = computed(() => params.value.find(p => p.id === paramId.value))
const timeRange = ref<[string, string] | null>(null)
// 阶段由进入来源确定(首件列表→FIRST,抽样列表→ROUTINE),不再提供手动切换
const stage = ref((route.query.stage as string) || (route.query.sampleTaskId ? 'ROUTINE' : 'ROUTINE') as string)
const sampleTaskId = ref((route.query.sampleTaskId as string) || '')

// 阶段说明(只读展示)
const stageLabel = computed(() => ({ FIRST: '首件点', ROUTINE: '量产线', ALL: '全部' }[stage.value] || '量产线'))
const stageClass = computed(() => ({ FIRST: 'first', ROUTINE: 'routine', ALL: 'all' }[stage.value] || 'routine'))

// 参数下拉:按工单号(srcWoNo)聚拢——SPC 首件/工装参数都关联一个工单,同一工单的首件参数应归一组;
// 无工单号(手动新建等)时回退按产品料号(partNo)收敛,避免混入其他产品的参数。
const sameProductParams = computed(() => {
  const cur = param.value
  const wo = cur?.srcWoNo
  if (wo) {
    return params.value.filter(p => p.srcWoNo === wo)
  }
  const curParts = new Set((cur?.products || []).map(p => p.partNo).filter(Boolean))
  if (curParts.size === 0) return params.value.filter(p => p.id === paramId.value)
  return params.value.filter(p => (p.products || []).some(pr => curParts.has(pr.partNo)))
})
// 下拉选项文案:参数名 + 来源(产线首件/工装首件/手动/抽样) + 来源工单号,区分同产品同名参数
const SRC_LABEL: Record<string, string> = { FIA_FIRST: '产线首件', TOOLING: '工装首件', MANUAL: '手动', SAMPLE: '抽样' }
function paramOptionLabel(p: SpcParam): string {
  const src = SRC_LABEL[p.paramSource || ''] || ''
  const suffix = [src, p.srcWoNo].filter(Boolean).join(' · ')
  return suffix ? `${p.paramName}（${suffix}）` : p.paramName
}
const chartData = ref<ControlChartVo | null>(null)
const capability = ref<SpcCapability | null>(null)
const hist = ref<SpcHistogramVo | null>(null)
const trend = ref<SpcCapability[]>([])
const trendRows = computed(() => trend.value.slice(0, 6))
/** 计数型(P/NP/C/U)参数过程水平聚合(替代 Cp/Cpk) */
const countCapability = ref<CountCapabilityVo | null>(null)

const histChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
const cardRefs = ref<(HTMLElement | null)[]>([])
const cardCharts = ref<(echarts.ECharts | null)[]>([])
function setCardRef(el: any, idx: number) { if (cardRefs.value) cardRefs.value[idx] = el }
let histChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const manualVisible = ref(false)
const manual = ref<Partial<SpcControlLimit>>({})
const manualSaving = ref(false)
const autoRef = ref<SpcControlLimit | null>(null)

function fmtNum(v: any) { return v == null ? '-' : Number(v).toFixed(3) }
function fmtTime(v: string | null | undefined): string {
  if (!v) return '-'
  return v.replace('T', ' ').slice(0, 19)
}

/** 子组数据列表:前端分页(controlChart 已全量返回 subgroups) */
const subgroupPage = ref(1)
const subgroupSize = usePageSize()
const pagedSubgroups = computed(() => {
  const all = chartData.value?.subgroups || []
  const start = (subgroupPage.value - 1) * subgroupSize.value
  return all.slice(start, start + subgroupSize.value)
})
function onSubgroupPage(p: number) { subgroupPage.value = p }
/** 异常子组(isOutlier)行高亮,与控制图异常点呼应 */
function subgroupRowClass({ row }: { row: SpcSubgroup }): string {
  return row.isOutlier ? 'row-outlier' : ''
}
/** 判定 StatusPill:异常/报警锁红,正常通过绿 */
function judgePill(row: SpcSubgroup): string {
  return row.isOutlier ? 'p-lock' : 'p-done'
}
/** 数据源中文标签 */
function srcLabel(s: string | undefined): string {
  return ({ manual: '手动录入', fia: '首件联动', sample: '抽样任务', auto: '自动' } as Record<string, string>)[s || ''] || (s || '其他')
}

const manualWarn = computed(() => {
  const m = manual.value
  if (m.xbarUcl == null && m.xbarCl == null && m.xbarLcl == null) return ''
  if (m.xbarUcl != null && m.xbarCl != null && m.xbarUcl <= m.xbarCl) return 'Xbar 图必须满足 UCL > CL'
  if (m.xbarCl != null && m.xbarLcl != null && m.xbarCl <= m.xbarLcl) return 'Xbar 图必须满足 CL > LCL'
  if (m.rucl != null && m.rlcl != null && m.rucl < m.rlcl) return 'R 图必须满足 UCL ≥ LCL'
  const pu = param.value?.specUpper, pl = param.value?.specLower
  if (pu != null && m.xbarUcl != null && m.xbarUcl > pu) return `UCL 超出规格上限 USL=${pu}，控制限通常应窄于规格限`
  if (pl != null && m.xbarLcl != null && m.xbarLcl < pl) return `LCL 低于规格下限 LSL=${pl}，控制限通常应窄于规格限`
  return ''
})

function fillFromAuto() {
  const a = autoRef.value
  if (!a) return
  manual.value = { xbarUcl: a.xbarUcl, xbarCl: a.xbarCl, xbarLcl: a.xbarLcl, rucl: a.rucl, rcl: a.rcl, rlcl: a.rlcl }
}

const cpkLevel = computed(() => { const v = capability.value?.cpk; if (v == null) return ''; return v >= 1.33 ? 'c-green' : v >= 1.0 ? 'c-amber' : 'c-red' })
function levelClass(l: string) { return { '充足': 'p-done', '尚可': 'p-run', '不足': 'p-wait', '数据量不足，CPK仅供参考': 'p-sign', '样本过少,无法计算': 'p-wait' }[l] || 'p-wait' }

async function loadChart() {
  if (!paramId.value) return
  // 控制图/直方图统一基于全量子组计算(忽略 stage 维度), 与过程能力口径一致;
  // stage 入口参数在此作废(不再作为过滤条件), 仅保留展示标签意义。
  const p = { paramId: paramId.value, startTime: timeRange.value?.[0], endTime: timeRange.value?.[1], stage: 'ALL', sampleTaskId: sampleTaskId.value || undefined }
  const [data, cap, h, cc] = await Promise.all([
    spcChartApi.controlChart(p).catch(() => null),
    spcCapabilityApi.calc({ paramId: paramId.value }).catch(() => null),
    spcChartApi.histogram(p).catch(() => null),
    spcSubgroupApi.countCapability(paramId.value).catch(() => null),
  ])
  chartData.value = data
  subgroupPage.value = 1
  capability.value = cap
  hist.value = h
  countCapability.value = cc?.countType ? cc : null
  trend.value = await spcCapabilityApi.trend({ paramId: paramId.value }).catch(() => [])
  // 先销毁旧图实例,再按 chartCards 动态渲染(卡片数量随 chartCandidates 变化)
  cardCharts.value.forEach(c => c?.dispose())
  cardCharts.value = []
  nextTick(() => {
    // 单图绘制异常不应中断其余图(如某类控制图 markLine 解析失败),逐项容错
    chartCards.value.forEach((card, idx) => { try { drawCard(card, idx) } catch (e) { console.warn('drawCard fail', card.kind, e) } })
    try { drawHist() } catch (e) { console.warn('drawHist fail', e) }
    try { drawTrend() } catch (e) { console.warn('drawTrend fail', e) }
  })
}

/** 图类型 → 卡片列表:每个图类型一张独立卡片(沿用 Xbar/R 卡片结构)。 */
const chartCards = computed(() => {
  const raw = param.value?.chartCandidates
  if (!raw || !raw.trim()) {
    // 兜底:用 chartType 单元素,兼容历史数据
    const t = param.value?.chartType
    if (!t) return []
    return expandTypes([t])
  }
  const types = raw.split(',').map(s => s.trim()).filter(Boolean)
  return expandTypes(types)
})

/** 参数是否含计数型图(P/NP/C/U):控制限由系统自动计算,不支持人工覆盖 */
const hasCountChart = computed(() => {
  const raw = param.value?.chartCandidates || param.value?.chartType || ''
  return raw.split(',').map(s => s.trim()).filter(Boolean).some(t => ['P', 'NP', 'C', 'U'].includes(t))
})

/** 计量型参数(VARIABLE):展示 Cp/Cpk 过程能力、直方图、CPK 历史趋势;
 *  计数型参数(含计数图)走 countCapability 卡片,以上三卡隐藏。 */
const isVariable = computed(() => !!param.value && !hasCountChart.value)

/** 控制图页卡片生成: 输入已统一为基础图码(Xbar/R/S/I/MR/P/NP/C/U)直接映射为卡片;
 *  同时向下兼容历史组合码(Xbar-R→[Xbar,R]; Xbar-S→[Xbar,S]; I-MR→[I,MR])。
 *  按基础图 kind 去重(保留首次出现顺序): 勾选 Xbar+R+S 仅得 [Xbar,R,S], 不重复。 */
function expandTypes(types: string[]) {
  const cards: { kind: string; title: string }[] = []
  const seen = new Set<string>()
  const titleMap: Record<string, string> = {
    Xbar: 'Xbar 控制图（均值）', R: 'R 控制图（极差）', S: 'S 控制图（标准差）',
    I: 'I 控制图（单值）', MR: 'MR 控制图（移动极差）',
    P: 'P 控制图（不合格品率）', NP: 'NP 控制图（不合格品数）',
    C: 'C 控制图（缺陷数）', U: 'U 控制图（单位缺陷数）',
  }
  const pushKind = (k: string) => {
    if (seen.has(k)) return
    seen.add(k)
    cards.push({ kind: k, title: titleMap[k] })
  }
  for (const t of types) {
    if (t === 'Xbar-R') { pushKind('Xbar'); pushKind('R') }
    else if (t === 'Xbar-S') { pushKind('Xbar'); pushKind('S') }
    else if (t === 'I-MR') { pushKind('I'); pushKind('MR') }
    else if (titleMap[t]) pushKind(t)
  }
  return cards
}

function cardSubtitle(card: { kind: string }) {
  if (['P', 'NP', 'C', 'U'].includes(card.kind)) {
    const cs = chartData.value?.countSeries?.find(s => s.chartType === card.kind)
    const n = cs?.values?.filter(v => v != null).length || 0
    return `${n} 个子组`
  }
  return `${chartData.value?.subgroups?.length || 0} 个子组`
}

function specLines(): any[] {
  const ml: any[] = []
  const pu = param.value?.specUpper, pl = param.value?.specLower
  if (pu != null) ml.push({ yAxis: pu, lineStyle: { color: '#7a3ff2', type: 'dotted', width: 1 }, label: { formatter: 'USL', color: '#7a3ff2', fontSize: 9 } })
  if (pl != null) ml.push({ yAxis: pl, lineStyle: { color: '#7a3ff2', type: 'dotted', width: 1 }, label: { formatter: 'LSL', color: '#7a3ff2', fontSize: 9 } })
  return ml
}

/** 通用计量型折线控制图绘制(单序列 + 控制限线 + 异常点)。
 *  showSpec: 是否叠加规格限 USL/LSL。极差/标准差类图(R/S/MR)量纲与特性值不同,
 *  规格限为特性值绝对值(如 50±0.05),若纳入会把 Y 轴拉爆、把极差线压成一条,故关闭。 */
function drawLineChart(chart: echarts.ECharts, values: any[], limitLines: { yAxis: number; label: string }[], alertIdx: number[], firstIdx: number[], showSpec = true) {
  const d = chartData.value
  const specML = showSpec ? specLines() : []
  const series: any[] = [{
    type: 'line', data: values, smooth: true, symbolSize: 5, connectNulls: false,
    lineStyle: { color: '#141414', width: 1.5 }, itemStyle: { color: '#141414', borderColor: '#fff', borderWidth: 1 },
    markLine: { symbol: ['none', 'none'], data: [...limitLines.map(l => ({ yAxis: l.yAxis, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: l.label, color: '#e03616', fontSize: 9 } })), ...specML] },
  }]
  if (alertIdx.length) series.push({ type: 'scatter', data: alertIdx.map(i => [i, values[i]]), itemStyle: { color: '#e03616' }, symbolSize: 10 })
  if (firstIdx.length) series.push({ type: 'scatter', data: firstIdx.map(i => [i, values[i]]), name: '首件点', symbol: 'diamond', symbolSize: 11, itemStyle: { color: '#0047ab', borderColor: '#fff', borderWidth: 1.5 } })
  // Y 轴自适应:以数据 + 过程控制限为参考范围(规格限仅特性值图参与),避免波动被压成一条线。
  // 极差/非负类图(参考下界贴近 0)锁定 Y 轴从 0 起、上端留 15% 余量;
  // 其余(如 Xbar 中心远离 0)居中对称留 15% 余量。
  const refVals: number[] = values.filter((v): v is number => v != null)
  ;[...limitLines, ...specML].forEach(l => { if (l && typeof l.yAxis === 'number') refVals.push(l.yAxis) })
  let yMin: number | undefined
  let yMax: number | undefined
  if (refVals.length) {
    const lo = Math.min(...refVals)
    const hi = Math.max(...refVals)
    // 参考上界(优先控制限 UCL,其次数据/规格上限)
    const top = Math.max(hi, Math.abs(hi) < 1e-9 ? 1e-6 : 0)
    if (lo <= top * 0.1) {
      // 下界贴近 0:从 0 起,上端留 15% 余量(极差图场景)
      yMin = 0
      yMax = top * 1.15
    } else {
      const span = hi - lo
      const margin = Math.max(span * 0.15, 1e-9)
      const center = (lo + hi) / 2
      const half = (hi - lo) / 2 + margin
      yMin = center - half
      yMax = center + half
    }
  }
  chart.setOption({
    tooltip: { trigger: 'axis' }, grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: values.map((_, i) => '子组' + (i + 1)), axisLine: { lineStyle: { color: '#e4e2dd' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    yAxis: { type: 'value', min: yMin, max: yMax, splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    series,
  })
}

/** 通用计数型控制图绘制(变限 UCL/LCL + CL 线)。 */
function drawCountChart(chart: echarts.ECharts, cs: any) {
  const labels = cs.values.map((_: any, i: number) => '子组' + (i + 1))
  const limitLines: any[] = []
  cs.cl.forEach((v: number, i: number) => { if (v != null) limitLines.push({ yAxis: v, lineStyle: { color: '#0047ab', width: 1 }, label: { formatter: 'CL', color: '#0047ab', fontSize: 9 } }) })
  cs.ucl.forEach((v: number, i: number) => { if (v != null) limitLines.push({ yAxis: v, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'UCL', color: '#e03616', fontSize: 9 } }) })
  cs.lcl.forEach((v: number, i: number) => { if (v != null) limitLines.push({ yAxis: v, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'LCL', color: '#e03616', fontSize: 9 } }) })
  // Y 轴自适应:以数据 + 控制限为参考范围,留出 15% 余量
  const refVals2: number[] = cs.values.filter((v: any): v is number => v != null)
  limitLines.forEach(l => { if (l && typeof l.yAxis === 'number') refVals2.push(l.yAxis) })
  let yMin2: number | undefined
  let yMax2: number | undefined
  if (refVals2.length) {
    const lo = Math.min(...refVals2)
    const hi = Math.max(...refVals2)
    const margin2 = Math.max((hi - lo) * 0.15, Math.abs(hi - lo) < 1e-9 ? Math.max(Math.abs(hi), 1e-6) * 0.1 : 0)
    const center = (lo + hi) / 2
    const half = Math.max((hi - lo) / 2 + margin2, 1e-9)
    yMin2 = center - half
    yMax2 = center + half
  }
  chart.setOption({
    tooltip: { trigger: 'axis' }, grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e4e2dd' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    yAxis: { type: 'value', min: yMin2, max: yMax2, splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    series: [{
      type: 'line', data: cs.values, smooth: true, symbolSize: 5, connectNulls: false,
      lineStyle: { color: '#141414', width: 1.5 }, itemStyle: { color: '#141414', borderColor: '#fff', borderWidth: 1 },
      markLine: { symbol: ['none', 'none'], data: limitLines },
    }],
  })
}

/** 按卡片 kind 调度对应绘图(计量型 Xbar/R/S/I/MR 取 subgroups;计数型 P/NP/C/U 取 countSeries)。 */
function drawCard(card: { kind: string }, idx: number) {
  const el = cardRefs.value[idx]
  if (!el) return
  const chart = echarts.init(el)
  cardCharts.value[idx] = chart
  const d = chartData.value
  const sg = d?.subgroups || []
  const alertIdx = (d?.marks || []).filter(m => m.level === '报警').map(m => m.i)
  const firstIdx = sg.map((s: any, i: number) => s.stage === 'FIRST' ? i : -1).filter((i: number) => i >= 0)
  const limit = d?.limit
  const lim = (ucl: number, cl: number, lcl: number) => [
    { yAxis: ucl, label: 'UCL' }, { yAxis: cl, label: 'CL' }, { yAxis: lcl, label: 'LCL' },
  ]
  // 由数据序列自动计算 CL ± 3σ 控制限(用于 S/I/MR 等无独立基线字段的图)
  const autoLim = (vals: (number | null)[]) => {
    const xs = vals.filter((v): v is number => v != null) as number[]
    if (!xs.length) return null
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length)
    return lim(mean + 3 * sd, mean, Math.max(0, mean - 3 * sd))
  }
  switch (card.kind) {
    case 'Xbar': {
      if (!sg.length) return
      const L = limit ? lim(limit.xbarUcl, limit.xbarCl, limit.xbarLcl) : autoLim(sg.map((s: any) => s.xbar))
      if (!L) return
      drawLineChart(chart, sg.map((s: any) => s.xbar), L, alertIdx, firstIdx)
      break
    }
    case 'R': {
      if (!sg.length) return
      const L = limit ? lim(limit.rucl, limit.rcl, limit.rlcl) : autoLim(sg.map((s: any) => s.rangeR))
      if (!L) return
      drawLineChart(chart, sg.map((s: any) => s.rangeR), L, alertIdx, [], false)
      break
    }
    case 'S': {
      const vals = sg.map((s: any) => s.stdDev)
      const L = autoLim(vals); if (!L) return
      drawLineChart(chart, vals, L, alertIdx, [], false)
      break
    }
    case 'I': {
      const vals = sg.map((s: any) => s.xbar)
      const L = autoLim(vals); if (!L) return
      drawLineChart(chart, vals, L, alertIdx, firstIdx)
      break
    }
    case 'MR': {
      const mr = sg.map((s: any, i: number) => i === 0 ? null : Math.abs((sg[i].xbar ?? 0) - (sg[i - 1].xbar ?? 0)))
      const xs = mr.filter((v: number | null): v is number => v != null)
      if (!xs.length) return
      const mrBar = xs.reduce((a, b) => a + b, 0) / xs.length
      drawLineChart(chart, mr, lim(mrBar * 3.267, mrBar, 0), alertIdx, [], false)
      break
    }
    case 'P': case 'NP': case 'C': case 'U': {
      const cs = d?.countSeries?.find((s: any) => s.chartType === card.kind)
      if (!cs) { chart.setOption({ title: { text: '无计数数据', left: 'center', top: 'center', textStyle: { color: '#9e9e9e', fontSize: 12 } } }); return }
      drawCountChart(chart, cs)
      break
    }
  }
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
      { name: '频次', type: 'bar', data: h.freq, itemStyle: { color: '#0047ab', borderRadius: [2, 2, 0, 0] }, markLine: { symbol: ['none', 'none'], data: ml } },
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
      markLine: { symbol: ['none', 'none'], data: [
        { yAxis: 1.33, lineStyle: { color: '#2e9e5b', type: 'dashed' }, label: { formatter: '1.33', color: '#2e9e5b', fontSize: 9 } },
        { yAxis: 1.0, lineStyle: { color: '#e03616', type: 'dashed' }, label: { formatter: '1.0', color: '#e03616', fontSize: 9 } },
      ] },
    }]
  })
}

/** 双向通道①:控制图页 → 采集页(预选当前参数 + 来源单号/批号,便于回看)。 */
function goCollect() {
  if (!paramId.value) { ElMessage.warning('请先选择 SPC 参数'); return }
  const p = param.value
  router.push({
    path: '/spc/collect',
    query: {
      paramId: paramId.value,
      woNo: p?.srcWoNo || '',
      batchNo: p?.srcBatchNo || '',
      from: 'chart',
    },
  })
}

async function openManual() {
  if (!paramId.value) { ElMessage.warning('请先选择 SPC 参数'); return }
  // 含计数型图(P/NP/C/U)时,控制限由系统按近期数据自动计算,不支持人工覆盖
  if (hasCountChart.value) {
    ElMessage.info('该参数含计数型控制图(P/NP/C/U),控制限由系统按近期数据自动计算,暂不支持人工覆盖')
    return
  }
  manual.value = {}
  autoRef.value = null
  try {
    const listRes = await spcControlLimitApi.list(paramId.value)
    // 参考值优先取最近一条自动基线;当前值优先回显激活基线
    autoRef.value = listRes?.find(l => !l.manual) || null
    const active = listRes?.find(l => l.isActive) || listRes?.[0]
    if (active) manual.value = { xbarUcl: active.xbarUcl, xbarCl: active.xbarCl, xbarLcl: active.xbarLcl, rucl: active.rucl, rcl: active.rcl, rlcl: active.rlcl }
  } catch (e) { /* 无基线则留空 */ }
  manualVisible.value = true
}

async function saveManual() {
  if (hasCountChart.value) return
  const m = manual.value
  if (m.xbarUcl == null || m.xbarCl == null || m.xbarLcl == null) {
    ElMessage.warning('请完整填写 Xbar 图 UCL / CL / LCL')
    return
  }
  if (!(m.xbarUcl > m.xbarCl && m.xbarCl > m.xbarLcl)) {
    ElMessage.error('控制限必须满足 UCL > CL > LCL')
    return
  }
  if (m.rucl != null && m.rlcl != null && m.rucl < m.rlcl) {
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

onMounted(async () => {
  params.value = await spcParamApi.list()
  if (paramId.value) loadChart()
  // 从采集页"查看参数图"返回时(from=collect)刷新一次, 让刚提交的子组立即可见
  if (route.query.from === 'collect') {
    setTimeout(() => { if (paramId.value) loadChart() }, 0)
  }
})
onUnmounted(() => { cardCharts.value.forEach(c => c?.dispose()); histChart?.dispose(); trendChart?.dispose() })
</script>

<style lang="scss" scoped>
.mode-tag { margin-left: 10px; font-size: 12px; font-weight: 500; color: $cobalt; background: $cobalt-dim; border: 1px solid $cobalt; border-radius: 20px; padding: 2px 10px; vertical-align: middle; }
.stage-hint { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: $ink-soft; }
.stage-hint .dot { width: 7px; height: 7px; border-radius: 50%; }
.stage-hint .dot.first { background: $cobalt; }
.stage-hint .dot.routine { background: #2e9e5b; }
.stage-hint .dot.all { background: $ink-faint; }
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
.p-lock { background: #fdecec; color: #b3261e; } .p-lock .d { background: #e03616; }

/* 人工覆盖弹窗 */
.m-help { background: $paper; border: 1px solid $hairline; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; font-size: 12px; line-height: 1.7; color: $ink-soft; }
.m-help__title { font-weight: 700; color: $ink; margin: 6px 0 2px; &:first-child { margin-top: 0; } }
.m-help p { margin: 0 0 4px; }
.m-help ul { margin: 0 0 4px; padding-left: 18px; }
.m-ref { border: 1px dashed $cobalt; background: $cobalt-dim; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
.m-ref__head { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: $cobalt; }
.m-ref__grid { display: flex; flex-direction: column; gap: 2px; font-size: 12px; margin-top: 4px; }
.m-warn { margin-top: 4px; padding: 8px 10px; border-radius: 6px; font-size: 12px; background: #fff7e6; border: 1px solid #ffe1a8; color: #a05a00; }

/* 子组数据列表 */
.sg-card { margin-top: 16px; }
.sg-card .el-table { font-size: 13px; }
.src-tag { font-size: 11px; color: $ink-faint; padding: 1px 7px; border: 1px solid $hairline; border-radius: 4px; }
.rule-tag { display: inline-block; margin-left: 6px; font-size: 10px; color: $signal-red; font-family: 'IBM Plex Mono', monospace; }
.sg-foot { display: flex; justify-content: flex-end; margin-top: 12px; }
.empty-tip { margin: 8px 0 14px; font-size: 13px; color: $ink-faint; }
</style>
