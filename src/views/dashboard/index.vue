<template>
  <div class="dashboard">
    <div class="head-b">
      <div>
        <div class="crumb">FIRST ARTICLE INSPECTION / 首件检验</div>
        <h1>任务看板</h1>
      </div>
      <div class="head-actions">
        <button class="btn-line" @click="exportExcel">导出 Excel</button>
        <button class="btn-fill" @click="go('/fia/tasks/create')">+ 新建检验任务</button>
      </div>
    </div>

    <div class="alert-b clickable" @click="go('/fia/tasks')">
      <span class="ic">!</span>
      <span>
        <strong>工单锁定</strong> - WO-260724-003(减速箱体 GB-150)首件不合格,C线-装配2号已锁定 3h12m,等待处置决策
      </span>
      <span class="act">立即处理 ›</span>
    </div>

    <div class="stats-b">
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">今日待检</div><div class="value c-amber">{{ todayTasks }}</div><div class="foot"><span class="up">实时</span> 首件任务</div></div>
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">检验中</div><div class="value c-cobalt">{{ inProgress }}</div><div class="foot">进行中任务</div></div>
      <div class="stat-b clickable" @click="go('/fia/approvals')"><div class="label">待签名确认</div><div class="value c-purple">{{ pendingSign }}</div><div class="foot">等待质量确认</div></div>
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">工单锁定</div><div class="value c-red">1</div><div class="foot">需质量主管处置</div></div>
      <div class="stat-b clickable" @click="go('/fia/tasks')"><div class="label">本月首检通过率</div><div class="value c-ink">{{ passRate != null ? passRate : '94.2' }}<small>%</small></div><div class="foot">目标 ≥ 95%</div></div>
    </div>

    <div class="grid-b">
      <div class="card-b">
        <div class="card-head"><h2>任务队列</h2><span class="sub clickable" @click="go('/fia/tasks')">全部 {{ taskTotal }} 条 ›</span></div>
        <table>
          <thead>
            <tr><th>工单号</th><th>产品 / 产线</th><th>触发类型</th><th>状态</th><th>检验员</th><th>耗时</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in tasks" :key="t.id" class="clickable" @click="clickTask(t)">
              <td class="wo-b">{{ t.woNo || t.code }}</td>
              <td class="prod-b">{{ t.productName }}<small v-if="t.lineName">{{ t.lineName }}</small></td>
              <td><span class="tag-b">{{ t.triggerType || '常规' }}</span></td>
              <td><span class="pill" :class="statusPill(t.status)"><span class="d"></span>{{ t.status || '待检' }}</span></td>
              <td>{{ t.inspectorId || '—' }}</td>
              <td class="elapsed-b">{{ elapsed(t) }}</td>
            </tr>
            <tr v-if="!tasks.length"><td colspan="6" class="empty-b">暂无检验任务</td></tr>
          </tbody>
        </table>
      </div>

      <div class="right-b">
        <div class="card-b clickable" @click="go('/spc/params')">
          <div class="card-head"><h2>SPC 基准 · Xbar 图</h2><span class="sub">BRG-440 内径</span></div>
          <div class="spc-b" ref="chartRef"></div>
        </div>
        <div class="card-b">
          <div class="card-head"><h2>待我审批</h2><span class="sub clickable" @click="go('/fia/approvals')">2 项待办 ›</span></div>
          <div class="appr-list">
            <div class="appr-item" @click="go('/fia/approvals')">
              <div class="ic ic-red">编</div>
              <div class="info"><div class="t">紧急放行申请 · WO-260724-003</div><div class="s">C线装配2号 · 刘班长 · 10 分钟前</div></div>
              <span class="arrow">›</span>
            </div>
            <div class="appr-item" @click="go('/fia/approvals')">
              <div class="ic ic-cobalt">核</div>
              <div class="info"><div class="t">让步接收审批 · WO-260724-019</div><div class="s">连接器外壳 CN-56 · 陈敏 · 1 小时前</div></div>
              <span class="arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import type { FiaTask } from '@/api/types/fia'

const router = useRouter()
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 工作台数据：轻度对接真实 FIA 看板接口,其余卡片保留展示并支持点击跳转
const loading = ref(false)
const todayTasks = ref(0)
const inProgress = ref(0)
const pendingSign = ref(0)
const passRate = ref<number | null>(null)
const tasks = ref<FiaTask[]>([])
const taskTotal = ref(0)

function load() {
  loading.value = true
  fiaTaskApi
    .dashboard()
    .then((d) => {
      todayTasks.value = d.todayTasks ?? 0
      const sd = (d.statusDistribution ?? {}) as Record<string, number>
      inProgress.value = sd['进行中'] ?? 0
      pendingSign.value = (sd['待复核'] ?? 0) + (sd['待批准'] ?? 0)
      passRate.value = typeof d.todayPassRate === 'number' ? Math.round(d.todayPassRate * 1000) / 10 : null
    })
    .catch(() => {
      /* 接口异常时保留默认展示值,不阻断页面 */
    })
    .finally(() => {
      loading.value = false
    })

  fiaTaskApi
    .list({ page: 1, size: 6 })
    .then((res) => {
      const list = Array.isArray(res) ? res : []
      tasks.value = list.slice(0, 6)
      taskTotal.value = list.length
    })
    .catch(() => {})
}

function go(path: string) {
  router.push(path)
}
function clickTask(t: FiaTask) {
  if (t.id) go(`/fia/tasks/${t.id}`)
}
function exportExcel() {
  ElMessage.info('导出功能开发中')
}
function statusPill(s?: string) {
  switch (s) {
    case '待检':
      return 'p-wait'
    case '进行中':
      return 'p-run'
    case '待复核':
    case '待批准':
      return 'p-sign'
    case '超时':
    case '已作废':
    case '已驳回':
      return 'p-lock'
    case '已完成':
    case '审批中':
      return 'p-done'
    default:
      return 'p-wait'
  }
}
function elapsed(t?: FiaTask) {
  if (!t?.createdAt) return '—'
  const ms = Date.now() - new Date(t.createdAt).getTime()
  const m = Math.max(0, Math.floor(ms / 60000))
  if (m < 60) return `等待 ${m}min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
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
.appr-list { padding: 8px 0; }
.appr-item { display: flex; align-items: center; gap: 14px; padding: 13px 22px; cursor: pointer; transition: background 0.12s; }
.appr-item:hover { background: #fafaf8; }
.appr-item + .appr-item { border-top: 1px solid $hairline-soft; }
.appr-item .ic { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; font-weight: 500; }
.ic-red { background: $signal-red-dim; color: $signal-red; }
.ic-cobalt { background: $cobalt-dim; color: $cobalt; }
.appr-item .info { flex: 1; min-width: 0; }
.appr-item .t { font-size: 13px; font-weight: 500; }
.appr-item .s { font-size: 11px; color: $ink-faint; margin-top: 3px; }
.appr-item .arrow { color: $ink-faint; font-size: 14px; }
.p-lock .d { animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
