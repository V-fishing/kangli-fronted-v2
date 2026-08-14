<template>
  <div class="audit-log-list rise">
    <div class="head-b">
      <AppBreadcrumb />
      <h1>审计日志<span class="no">AUDIT LOG</span></h1>
    </div>

    <div class="card-b">
      <div class="filter-b">
        <el-select v-model="q.module" placeholder="模块" clearable style="width: 140px" @change="search">
          <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
        </el-select>
        <el-input v-model="q.action" placeholder="动作 (CREATE/APPROVE…)" clearable style="width: 170px" @keyup.enter="search" @clear="search" />
        <el-input v-model="q.operator" placeholder="操作人 (姓名/ID)" clearable style="width: 170px" @keyup.enter="search" @clear="search" />
        <el-input v-model="q.recordId" placeholder="业务单号/记录ID" clearable style="width: 180px" @keyup.enter="search" @clear="search" />
        <el-select v-model="q.status" placeholder="状态" clearable style="width: 120px" @change="search">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAIL" />
        </el-select>
        <el-date-picker v-model="range" type="datetimerange" range-separator="~" start-placeholder="起始时间" end-placeholder="结束时间" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 360px" @change="search" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" size="small" border stripe style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }"><span class="mono">{{ fmt(row.createdAt) }}</span></template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="operatorName" label="操作人" width="130" />
        <el-table-column prop="recordId" label="业务ID" min-width="160">
          <template #default="{ row }"><span class="mono">{{ row.recordId || '—' }}</span></template>
        </el-table-column>
        <el-table-column prop="detail" label="操作摘要" min-width="240" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span class="pill" :class="row.status === 'SUCCESS' ? 'pill-ok' : 'pill-fail'">{{ row.status === 'SUCCESS' ? '成功' : '失败' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="page-b">
        <el-pagination background layout="total, sizes, prev, pager, next" :total="total" :page-size="q.size" :current-page="q.page" :page-sizes="[20, 50, 100]" @current-change="onPage" @size-change="onSize" />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="审计详情" width="560px">
      <el-descriptions :column="1" border size="small" v-if="current">
        <el-descriptions-item label="时间"><span class="mono">{{ fmt(current.createdAt) }}</span></el-descriptions-item>
        <el-descriptions-item label="模块">{{ current.module }}</el-descriptions-item>
        <el-descriptions-item label="动作">{{ current.action }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ current.operatorName }} <span class="mono faint">({{ current.operatorId }})</span></el-descriptions-item>
        <el-descriptions-item label="业务ID"><span class="mono">{{ current.recordId || '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="方法">{{ current.method || '—' }}</el-descriptions-item>
        <el-descriptions-item label="耗时"><span class="mono">{{ current.costMs != null ? current.costMs + ' ms' : '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="状态">
          <span class="pill" :class="current.status === 'SUCCESS' ? 'pill-ok' : 'pill-fail'">{{ current.status === 'SUCCESS' ? '成功' : '失败' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="摘要">{{ current.detail || '—' }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="current.status !== 'SUCCESS'">{{ current.error || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button type="primary" @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { auditLogApi, type AuditLogVO, type AuditLogQuery } from '@/api/modules/system/audit-log'

const loading = ref(false)
const rows = ref<AuditLogVO[]>([])
const total = ref(0)
const modules = ref<string[]>([])
const range = ref<string[]>([])

const q = reactive<AuditLogQuery & { page: number; size: number }>({
  module: '', action: '', operator: '', recordId: '', status: '',
  start: '', end: '', page: 1, size: 20,
})

const detailVisible = ref(false)
const current = ref<AuditLogVO | null>(null)

function fmt(s: string) {
  if (!s) return '—'
  return s.replace('T', ' ').slice(0, 19)
}

async function fetchModules() {
  try { modules.value = await auditLogApi.modules() } catch { modules.value = [] }
}

async function fetchData() {
  loading.value = true
  try {
    q.start = range.value?.[0] || ''
    q.end = range.value?.[1] || ''
    const r = await auditLogApi.page({ ...q })
    rows.value = r.records
    total.value = r.total
  } finally {
    loading.value = false
  }
}

function search() { q.page = 1; fetchData() }
function reset() {
  Object.assign(q, { module: '', action: '', operator: '', recordId: '', status: '', start: '', end: '', page: 1, size: 20 })
  range.value = []
  fetchData()
}
function onPage(p: number) { q.page = p; fetchData() }
function onSize(s: number) { q.size = s; q.page = 1; fetchData() }
function openDetail(row: AuditLogVO) { current.value = row; detailVisible.value = true }

onMounted(() => { fetchModules(); fetchData() })
</script>

<style lang="scss" scoped>
.audit-log-list { width: 100%; }
.head-b { margin-bottom: 20px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; display: flex; align-items: baseline; gap: 12px; }
.head-b .no { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 2px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; padding: 16px; }
.filter-b { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
.page-b { margin-top: 14px; display: flex; justify-content: flex-end; }
.mono { font-family: $font-mono; }
.faint { color: $ink-faint; }
.pill { display: inline-block; padding: 1px 10px; border-radius: 999px; font-size: 12px; font-family: $font-mono; border: 1px solid; }
.pill-ok { color: $green; border-color: $green; }
.pill-fail { color: $signal-red; border-color: $signal-red; }
</style>
