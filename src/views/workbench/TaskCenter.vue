<template>
  <div class="task-center">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>个人任务中心</h1>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" circle @click="load" title="刷新" />
      </div>
    </div>

    <el-tabs v-model="activeTab" class="tc-tabs" @tab-change="onTabChange">
      <el-tab-pane name="my">
        <template #label>我的任务 <span class="tab-badge">{{ myTasks.length }}</span></template>
        <TaskTable :rows="myTasks" :loading="loading" @open="go" empty-text="暂无指派给我的待办任务" />
      </el-tab-pane>

      <el-tab-pane name="approval">
        <template #label>待我审批 <span class="tab-badge cobalt">{{ pendingApprovals.length }}</span></template>
        <div v-loading="loadingApproval" class="appr-wrap">
          <div class="appr-item" v-for="a in pendingApprovals" :key="a.id" @click="go(a.url)">
            <div class="ic" :class="moduleClass(a.module)">{{ moduleAbbr(a.module) }}</div>
            <div class="info">
              <div class="t">{{ a.title }}</div>
              <div class="s">{{ a.bizType }} · {{ a.bizNo || '—' }} · {{ a.applicant || '—' }} · {{ timeAgo(a.appliedAt) }}</div>
            </div>
            <span class="arrow">›</span>
          </div>
          <div v-if="!loadingApproval && !pendingApprovals.length" class="empty-b">暂无待我审批事项</div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="overdue">
        <template #label>已逾期 <span class="tab-badge red">{{ overdueList.length }}</span></template>
        <TaskTable :rows="overdueList" :loading="loading" @open="go" empty-text="暂无逾期任务，保持得很好" />
      </el-tab-pane>

      <el-tab-pane name="closed">
        <template #label>已闭环(本月) <span class="tab-badge ink">{{ closedThisMonthList.length }}</span></template>
        <TaskTable :rows="closedThisMonthList" :loading="loading" @open="go" empty-text="本月暂无已闭环任务" />
      </el-tab-pane>

      <el-tab-pane name="history">
        <template #label>历史任务 <span class="tab-badge ink">{{ historyList.length }}</span></template>
        <div class="filter-b">
          <el-select v-model="filterModule" placeholder="全部模块" clearable style="width: 140px">
            <el-option label="首件(FIA)" value="FIA" />
            <el-option label="异常(NCM)" value="NCM" />
            <el-option label="巡检(PATROL)" value="PATROL" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 150px">
            <el-option v-for="s in CLOSED_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
          <el-input v-model="filterKeyword" placeholder="单号/事项关键词" clearable style="width: 220px" />
        </div>
        <TaskTable :rows="historyList" :loading="loadingClosed" @open="go" empty-text="暂无历史任务" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { Refresh } from '@element-plus/icons-vue'
import TaskTable from './TaskTable.vue'
import { myTasksApi } from '@/api/modules/myTasks'
import { approvalCenterApi } from '@/api/modules/approvalCenter'
import type { MyTask } from '@/api/types/myTask'
import type { PendingApproval } from '@/api/types/approval'

const router = useRouter()
const route = useRoute()

const TABS = ['my', 'approval', 'overdue', 'closed', 'history'] as const
type TabKey = (typeof TABS)[number]
const activeTab = ref<TabKey>((route.query.tab as TabKey) || 'my')

const myTasks = ref<MyTask[]>([])
const pendingApprovals = ref<PendingApproval[]>([])
const allClosedTasks = ref<MyTask[]>([]) // 含已闭环全集(历史任务用)
const loading = ref(false)
const loadingApproval = ref(false)
const loadingClosed = ref(false)

const CLOSED_STATUS = ['已完成', '已关闭', '已通过', '已闭环']

// 派生:我的任务(未闭环) = myTasks 本身
const overdueList = computed(() => myTasks.value.filter((t) => t.overdue === true))
const closedThisMonthList = computed(() => {
  const now = new Date()
  return myTasks.value.filter((t) => {
    if (!CLOSED_STATUS.includes(t.status || '')) return false
    // 按闭环完成时间(closedAt)判断当月; 无闭环时间则回退指派/创建时间(assignedAt)兜底
    const base = t.closedAt || t.assignedAt
    if (!base) return false
    const d = new Date(base)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
})

// 历史任务:从含闭环全集中筛选
const filterModule = ref('')
const filterStatus = ref('')
const filterKeyword = ref('')
const historyList = computed(() => {
  const kw = filterKeyword.value.trim().toLowerCase()
  return allClosedTasks.value.filter((t) => {
    // 历史任务 = 已闭环全集
    if (!CLOSED_STATUS.includes(t.status || '')) return false
    if (filterModule.value && t.module !== filterModule.value) return false
    if (filterStatus.value && t.status !== filterStatus.value) return false
    if (kw) {
      const hay = `${t.bizNo || ''} ${t.title || ''} ${t.bizType || ''}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
})

function load() {
  loading.value = true
  myTasksApi
    .list({})
    .then((list) => {
      myTasks.value = Array.isArray(list) ? list : []
    })
    .catch(() => {
      myTasks.value = []
    })
    .finally(() => (loading.value = false))

  loadingApproval.value = true
  approvalCenterApi
    .pending()
    .then((list) => {
      pendingApprovals.value = Array.isArray(list) ? list : []
    })
    .catch(() => {
      pendingApprovals.value = []
    })
    .finally(() => (loadingApproval.value = false))

  // 历史任务:拉取含已闭环全集(仅 history tab 需要,但提前预取避免切换卡顿)
  if (activeTab.value === 'history' || allClosedTasks.value.length === 0) {
    loadClosed()
  }
}

function loadClosed() {
  loadingClosed.value = true
  myTasksApi
    .list({ includeClosed: true })
    .then((list) => {
      allClosedTasks.value = Array.isArray(list) ? list : []
    })
    .catch(() => {
      allClosedTasks.value = []
    })
    .finally(() => (loadingClosed.value = false))
}

function onTabChange(name: string | number) {
  const key = String(name) as TabKey
  if (key === 'history' && allClosedTasks.value.length === 0) loadClosed()
  // 同步到 URL,便于刷新/分享保持 tab
  router.replace({ path: '/workbench/tasks', query: { tab: key } })
}

function go(path?: string) {
  if (path) router.push(path)
}

// 待我审批渲染辅助
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

// 路由参数变化时同步高亮(例如从工作台卡片跳入)
watch(
  () => route.query.tab,
  (tab) => {
    if (tab && TABS.includes(tab as TabKey)) activeTab.value = tab as TabKey
  },
)

onMounted(() => load())
</script>

<style lang="scss" scoped>
.head-b { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.head-b h1 { font-size: 28px; margin: 4px 0 0; }
.crumb { font-size: 12px; color: $ink-faint; letter-spacing: 1px; }
.head-actions { display: flex; align-items: center; gap: 10px; }
:deep(.tc-tabs .el-tabs__header) { margin-bottom: 18px; }
.tab-badge { display: inline-block; min-width: 18px; padding: 0 6px; margin-left: 6px; height: 18px; line-height: 18px; border-radius: 9px; background: $signal-red-dim; color: $signal-red; font-size: 11px; font-weight: 600; text-align: center; }
.tab-badge.cobalt { background: $cobalt-dim; color: $cobalt; }
.tab-badge.red { background: $signal-red-dim; color: $signal-red; }
.tab-badge.ink { background: #ececec; color: $ink-soft; }
.appr-wrap { background: $white; border: 1px solid $hairline; border-radius: 10px; padding: 6px 0; }
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
.filter-b { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.empty-b { text-align: center; color: $ink-faint; padding: 40px; font-size: 13px; }
</style>
