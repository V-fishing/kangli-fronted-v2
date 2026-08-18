<template>
  <div class="incoming-list">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>来料首件检验</h1>
      </div>
      <div class="head-actions">
        <button class="btn-fill" @click="openBatchDialog">+ 按批次建单</button>
      </div>
    </div>

    <!-- 看板统计 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="l">今日任务</div>
        <div class="v mono">{{ dash?.today?.total ?? 0 }}</div>
        <div class="s">今日新建来料检验单</div>
      </div>
      <div class="stat-card">
        <div class="l">今日完成</div>
        <div class="v mono c-green">{{ dash?.today?.completed ?? 0 }}</div>
        <div class="s">今日已完成检验</div>
      </div>
      <div class="stat-card">
        <div class="l">今日超时</div>
        <div class="v mono" :class="{ 'c-red': (dash?.today?.overdue ?? 0) > 0 }">{{ dash?.today?.overdue ?? 0 }}</div>
        <div class="s">SLA 超时任务</div>
      </div>
      <div class="stat-card">
        <div class="l">批次覆盖</div>
        <div class="v mono">{{ dash?.lotCoverage ?? 0 }}</div>
        <div class="s">已覆盖来料批次数</div>
      </div>
    </div>

    <!-- 状态分布条 -->
    <div v-if="statusCounts.length" class="status-strip">
      <span v-for="sc in statusCounts" :key="sc.status" class="pill" :class="statusClass(sc.status)">
        <span class="d"></span>{{ sc.status }} · {{ sc.cnt }}
      </span>
    </div>

    <!-- 筛选 -->
    <el-card class="card-b filter-bar" shadow="never">
      <el-form :inline="true" :model="filter" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width:140px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="单号/批次">
          <el-input v-model="filter.keyword" clearable placeholder="校验单号或批次号" style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务表格 -->
    <div class="card-b">
      <el-table :data="filteredList" v-loading="loading" size="small">
        <el-table-column label="校验单号" width="170">
          <template #default="{ row }">
            <span class="mono">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="pill" :class="statusClass(row.status)"><span class="d"></span>{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="物料/产品" min-width="130" />
        <el-table-column prop="partNo" label="物料号" width="120" />
        <el-table-column prop="batchNo" label="来料批次" width="140" />
        <el-table-column prop="procName" label="工序" width="90" />
        <el-table-column label="AQL / 抽样" width="110">
          <template #default="{ row }">
            <span class="mono">{{ row.aql || '-' }} / {{ row.sampleSize ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="判定" width="90">
          <template #default="{ row }">
            <span class="pill" :class="judgeClass(row.overallJudge)">{{ judgeText(row.overallJudge) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="disposition" label="处置" width="100" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push(`/fia/incoming/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 按批次建单弹窗 -->
    <el-dialog v-model="batchVisible" title="按来料批次建单" width="520px">
      <el-form label-width="90px">
        <el-form-item label="来料批次号" required>
          <el-input v-model="batchLotNo" placeholder="请输入来料批次号 lotNo" />
        </el-form-item>
      </el-form>
      <div v-if="batchResult" class="batch-result">
        <div class="br-head">
          <span>批次 <b class="mono">{{ batchResult.lotNo }}</b>（物料 {{ batchResult.partNo || '-' }}）</span>
          <span>计划 {{ batchResult.plansFound }} · 建单 <b class="c-green">{{ batchResult.tasksCreated }}</b> · 失败 <b :class="{ 'c-red': (batchResult.tasksFailed ?? 0) > 0 }">{{ batchResult.tasksFailed ?? 0 }}</b></span>
        </div>
        <el-table v-if="batchResult.tasks?.length" :data="batchResult.tasks" border size="small">
          <el-table-column label="任务单号" width="160">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="goCreated(row.taskId)">{{ row.code }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="procName" label="工序" width="100" />
          <el-table-column prop="sampleSize" label="抽样数" width="80" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="batchVisible = false">关闭</el-button>
        <el-button type="primary" :loading="batchLoading" @click="submitBatch" v-if="canCreateTask">生成检验单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { fiaIncomingApi } from '@/api/modules/fia/incoming'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import type { FiaTask, FiaTaskStatus, IncomingDashboard, BatchByLotResult } from '@/api/types/fia'

const router = useRouter()
const auth = useAuthStore()
const perm = usePermissionStore()
const canCreateTask = computed(() => perm.has('fia.task.create'))
const list = ref<FiaTask[]>([])
const loading = ref(false)
const dash = ref<IncomingDashboard | null>(null)
const filter = reactive({ status: '', keyword: '' })
const statusOptions: FiaTaskStatus[] = ['待检', '进行中', '待复核', '待批准', '审批中', '已完成', '超时', '已作废', '已驳回']

const statusCounts = computed(() => dash.value?.statusCounts ?? [])

const filteredList = computed(() => {
  return list.value.filter(t => {
    if (filter.status && t.status !== filter.status) return false
    if (filter.keyword) {
      const k = filter.keyword.trim()
      if (!(t.code?.includes(k) || t.batchNo?.includes(k) || t.woNo?.includes(k))) return false
    }
    return true
  })
})

// ── 批次建单 ──
const batchVisible = ref(false)
const batchLoading = ref(false)
const batchLotNo = ref('')
const batchResult = ref<BatchByLotResult | null>(null)

function openBatchDialog() {
  batchLotNo.value = ''
  batchResult.value = null
  batchVisible.value = true
}

async function submitBatch() {
  if (!batchLotNo.value.trim()) { ElMessage.warning('请输入来料批次号'); return }
  batchLoading.value = true
  try {
    batchResult.value = await fiaIncomingApi.batchCreateByLot({
      lotNo: batchLotNo.value.trim(),
      orgId: auth.user?.orgId || '',
    })
    if ((batchResult.value.tasksCreated ?? 0) > 0) {
      ElMessage.success(`已生成 ${batchResult.value.tasksCreated ?? 0} 张来料检验单`)
      fetchData()
    } else {
      ElMessage.warning('未生成检验单，请检查批次与检验计划配置')
    }
  } catch { /* request 已弹错 */ }
  finally { batchLoading.value = false }
}

function goCreated(taskId: string) {
  batchVisible.value = false
  router.push(`/fia/incoming/${taskId}`)
}

// ── 样式映射 ──
function statusClass(s: string): string {
  const m: Record<string, string> = {
    '待检': 'p-wait', '进行中': 'p-run', '待复核': 'p-sign', '待批准': 'p-sign',
    '审批中': 'p-run', '已完成': 'p-done', '超时': 'p-lock', '已作废': 'p-lock', '已驳回': 'p-lock',
  }
  return m[s] || ''
}
function judgeText(j?: string): string {
  return j === '合格' || j === '不合格' || j === '警告' ? j : '未判定'
}
function judgeClass(j?: string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '警告': 'p-wait' }
  return m[j || ''] || ''
}

// ── 数据加载 ──
async function fetchData() {
  loading.value = true
  try {
    list.value = (await fiaIncomingApi.list()) ?? []
  } finally {
    loading.value = false
  }
}

async function loadDashboard() {
  try { dash.value = await fiaIncomingApi.dashboard() } catch { /* 降级：不展示看板 */ }
}

onMounted(() => { fetchData(); loadDashboard() })
</script>

<style lang="scss" scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}
@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .stat-grid { grid-template-columns: 1fr; } }
.stat-card {
  background: $white;
  border: 1px solid $hairline;
  border-radius: 8px;
  padding: 16px 20px;
  transition: box-shadow 0.25s, transform 0.25s;
}
.stat-card:hover { box-shadow: 0 4px 14px rgba(45, 108, 223, 0.1); transform: translateY(-1px); }
.stat-card .l { font-size: 12px; color: $ink-faint; letter-spacing: 1px; }
.stat-card .v { font-size: 26px; font-weight: 600; margin: 6px 0 2px; color: $cobalt; }
.stat-card .v.c-green { color: $green; }
.stat-card .v.c-red { color: #dc2626; }
.stat-card .s { font-size: 11px; color: $ink-faint; }
.status-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.batch-result { margin-top: 4px; }
.br-head { display: flex; justify-content: space-between; font-size: 12px; color: $ink-faint; margin-bottom: 8px; flex-wrap: wrap; gap: 6px; }
.c-green { color: $green; }
.c-red { color: #dc2626; }
</style>
