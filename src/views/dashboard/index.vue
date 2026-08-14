<template>
  <div class="dashboard">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>任务看板</h1>
      </div>
    </div>

    <div v-if="woLockAlert" class="alert-b clickable" @click="go('/fia/wo-lock?woNo=' + encodeURIComponent(woLockAlert.woNo || ''))">
      <span class="ic">!</span>
      <span>
        <strong>工单锁定</strong> - {{ woLockAlert.woNo }}({{ woLockAlert.productName || '—' }})首件{{ woLockAlert.lockReason === '首件不合格' ? '不合格' : '未完成' }},{{ woLockAlert.lineName || '产线' }}已锁定 {{ lockDuration(woLockAlert.lockedAt) }},{{ woLockAlert.lockReason === '首件不合格' ? '等待处置决策' : '等待首件检验完成' }}
      </span>
      <span class="act">立即处理 ›</span>
    </div>

    <div class="stats-b">
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">今日待检</div><div class="value c-amber">{{ todayTasks }}</div><div class="foot"><span class="up">实时</span> 首件任务</div></div>
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">检验中</div><div class="value c-cobalt">{{ inProgress }}</div><div class="foot">进行中任务</div></div>
      <div class="stat-b clickable" @click="go('/fia/approvals')"><div class="label">待签名确认</div><div class="value c-purple">{{ pendingSign }}</div><div class="foot">等待质量确认</div></div>
      <div class="stat-b clickable" @click="go('/fia/wo-lock')"><div class="label">工单锁定</div><div class="value c-red">{{ woLockCount }}</div><div class="foot">需质量主管处置</div></div>
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">首检通过率</div><div class="value c-ink">{{ passRate != null ? passRate : '—' }}<small v-if="passRate != null">%</small></div><div class="foot">目标 ≥ 95%</div></div>
    </div>

    <div class="grid-b">
      <div class="card-b">
        <div class="card-head"><h2>我的任务</h2><span class="sub clickable" @click="go('/workbench/tasks')">全部 ›</span></div>
        <TaskTable :rows="myTasks" :loading="loading" empty-text="暂无指派给我的任务" @open="go" />
      </div>

      <div class="right-b">
        <div class="card-b clickable" @click="go('/spc/params')">
          <div class="card-head"><h2>SPC 基准 · Xbar 图</h2><span class="sub">BRG-440 内径</span></div>
          <div class="spc-b" ref="chartRef"></div>
        </div>
        <div class="card-b">
          <div class="card-head"><h2>待我审批</h2><span class="sub clickable" @click="go('/fia/approvals')">{{ pendingApprovals.length }} 项待办 ›</span></div>
          <div class="appr-list">
            <div class="appr-item" v-for="a in pendingApprovals" :key="a.id" @click="go(a.url)">
              <div class="ic" :class="moduleClass(a.module)">{{ moduleAbbr(a.module) }}</div>
              <div class="info">
                <div class="t">{{ a.title }}</div>
                <div class="s">{{ a.bizType }} · {{ a.applicant || '—' }} · {{ timeAgo(a.appliedAt) }}</div>
              </div>
              <span class="arrow">›</span>
            </div>
            <div v-if="!pendingApprovals.length" class="empty-b">暂无待我审批事项</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import * as echarts from 'echarts'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { fiaWoLockApi } from '@/api/modules/fia/woLock'
import { approvalCenterApi } from '@/api/modules/approvalCenter'
import { myTasksApi } from '@/api/modules/myTasks'
import TaskTable from '@/views/workbench/TaskTable.vue'
import type { PendingApproval } from '@/api/types/approval'
import type { MyTask } from '@/api/types/myTask'

// 工单锁定告警的展示字段(后端 fiaWoLockApi.active 返回结构)
interface WoLockAlert {
  woNo?: string
  productName?: string
  lockReason?: string
  lineName?: string
  lockedAt?: string
}

const router = useRouter()
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 工作台数据：轻度对接真实 FIA 看板接口,其余卡片保留展示并支持点击跳转
const loading = ref(false)
const todayTasks = ref(0)
const inProgress = ref(0)
const pendingSign = ref(0)
const passRate = ref<number | null>(null)
const myTasks = ref<MyTask[]>([])
const pendingApprovals = ref<PendingApproval[]>([])
const woLockAlert = ref<WoLockAlert | null>(null)
const woLockCount = ref(0)

function load() {
  loading.value = true
  fiaTaskApi
    .dashboard()
    .then((d) => {
      // 后端返回 todayCount(今日新建任务数); 兼容旧字段 todayTasks
      todayTasks.value = d.todayCount ?? d.todayTasks ?? 0
      const sd = (d.statusDistribution ?? {}) as Record<string, number>
      inProgress.value = sd['进行中'] ?? 0
      pendingSign.value = (sd['待复核'] ?? 0) + (sd['待批准'] ?? 0)
      // 后端返回 passRate(全局合格率); 兼容旧字段 todayPassRate
      const raw = d.passRate ?? d.todayPassRate
      passRate.value = typeof raw === 'number' ? Math.round(raw * 1000) / 10 : null
    })
    .catch(() => {
      /* 接口异常时保留默认展示值,不阻断页面 */
    })
    .finally(() => {
      loading.value = false
    })

  myTasksApi
    .list({ limit: 6 })
    .then((list) => {
      myTasks.value = Array.isArray(list) ? list : []
    })
    .catch(() => {})

  approvalCenterApi
    .pending()
    .then((list) => {
      pendingApprovals.value = Array.isArray(list) ? list : []
    })
    .catch(() => {
      /* 审批中心接口异常时保留空态,不阻断页面 */
    })

  // 工单锁定告警:锁定中且等待处置的工单(取锁定最久的一条展示)
  fiaWoLockApi
    .active()
    .then((list) => {
      const arr = Array.isArray(list) ? list : []
      woLockCount.value = arr.length
      woLockAlert.value = arr.length ? arr[0] : null
    })
    .catch(() => {})

}

function moduleClass(module?: string) {
  switch (module) {
    case 'FIA':
      return 'ic-cobalt'
    case 'NCM':
      return 'ic-red'
    case 'SQM':
      return 'ic-green'
    default:
      return 'ic-cobalt'
  }
}
function moduleAbbr(module?: string) {
  switch (module) {
    case 'FIA':
      return '首'
    case 'NCM':
      return '8D'
    case 'SQM':
      return '审'
    default:
      return '审'
  }
}
function timeAgo(iso?: string) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return '刚刚'
  const m = Math.floor(ms / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

// 已锁定时长:ISO 字符串 -> "3h12m" / "45min"
function lockDuration(iso?: string) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(m / 60)
  const mm = m % 60
  return h > 0 ? `${h}h${mm}m` : `${mm}min`
}

function go(path?: string) {
  router.push(path || '/')
}

function draw() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  const data = [22.1, 22.3, 22.0, 22.4, 22.2, 22.5, 22.1, 22.6, 22.3, 22.0, 22.4, 22.2]
  chart.setOption({
    grid: { left: 45, right: 15, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.map((_, i) => '子组' + (i + 1)), axisLine: { lineStyle: { color: '#e4e2dd' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    yAxis: { type: 'value', min: 21.6, max: 23, axisLine: { show: false }, splitLine: { lineStyle: { color: '#f2f1ee' } }, axisLabel: { color: '#9e9e9e', fontSize: 10 } },
    series: [
      {
        type: 'line', data, smooth: true, symbolSize: 5,
        lineStyle: { color: '#141414', width: 1.5 }, itemStyle: { color: '#141414', borderColor: '#fff', borderWidth: 1 },
        markLine: { symbol: 'none', data: [
          { yAxis: 22.9, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'UCL', color: '#e03616', fontSize: 9 } },
          { yAxis: 22.4, lineStyle: { color: '#0047ab', width: 1 }, label: { formatter: 'CL', color: '#0047ab', fontSize: 9 } },
          { yAxis: 22.0, lineStyle: { color: '#e03616', width: 1, type: 'dashed' }, label: { formatter: 'LCL', color: '#e03616', fontSize: 9 } },
        ] }
      },
      { type: 'scatter', data: [[7, 22.6]], itemStyle: { color: '#e03616' }, symbolSize: 8 }
    ]
  })
}
onMounted(() => {
  load()
  draw()
})
onUnmounted(() => chart?.dispose())
</script>

<style lang="scss" scoped>
.head-b h1 { font-size: 30px; }
.alert-b { display: flex; align-items: center; gap: 14px; background: $signal-red-dim; border: 1px solid #f3cfc5; border-left: 4px solid $signal-red; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
.alert-b .ic { width: 22px; height: 22px; border-radius: 50%; background: $signal-red; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.alert-b strong { color: $signal-red; }
.alert-b .act { margin-left: auto; font-size: 12px; font-weight: 500; color: $signal-red; cursor: pointer; white-space: nowrap; }
.clickable { cursor: pointer; }
.sub.clickable:hover { color: $cobalt; }
.empty-b { text-align: center; color: $ink-faint; padding: 26px; font-size: 13px; }
.stats-b { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-b { background: $white; border: 1px solid $hairline; border-radius: 10px; padding: 20px 22px; box-shadow: $shadow-sm; transition: box-shadow 0.2s, transform 0.2s; }
.stat-b:hover { box-shadow: $shadow-md; transform: translateY(-2px); }
.stat-b .label { font-size: 12px; color: $ink-faint; margin-bottom: 10px; }
.stat-b .value { font-family: $font-display; font-size: 32px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
.stat-b .value small { font-size: 15px; font-weight: 600; }
.stat-b .foot { font-size: 11px; color: $ink-faint; margin-top: 10px; }
.stat-b .foot .up { color: $green; font-weight: 500; }
.stat-b .foot .down { color: $signal-red; font-weight: 500; }
.grid-b { grid-template-columns: 1fr 330px; }
.wo-b { font-family: $font-mono; font-size: 12px; color: $cobalt; font-weight: 500; }
.prod-b small { display: block; color: $ink-faint; font-size: 11px; margin-top: 3px; }
.elapsed-b { font-family: $font-mono; font-size: 12px; color: $ink-soft; }
.elapsed-b.over { color: $signal-red; font-weight: 500; }
.spc-b { padding: 18px 22px; height: 200px; }
.appr-list { padding: 8px 0; max-height: 360px; overflow-y: auto; }
.appr-item { display: flex; align-items: center; gap: 14px; padding: 13px 22px; cursor: pointer; transition: background 0.12s; }
.appr-item:hover { background: #fafaf8; }
.appr-item + .appr-item { border-top: 1px solid $hairline-soft; }
.appr-item .ic { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; font-weight: 500; }
.ic-red { background: $signal-red-dim; color: $signal-red; }
.ic-cobalt { background: $cobalt-dim; color: $cobalt; }
.ic-green { background: #e7f4ec; color: #1f9d55; }
.appr-item .info { flex: 1; min-width: 0; }
.appr-item .t { font-size: 13px; font-weight: 500; }
.appr-item .s { font-size: 11px; color: $ink-faint; margin-top: 3px; }
.appr-item .arrow { color: $ink-faint; font-size: 14px; }
.p-lock .d { animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
