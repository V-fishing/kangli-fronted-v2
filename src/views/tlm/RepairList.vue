<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TlmRepair } from '@/api/types/tlm'
import { tlmRepairApi } from '@/api/modules/tlm/repair'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const perm = usePermissionStore()

const list = ref<TlmRepair[]>([])
const loading = ref(false)
const keyword = ref('')
const filterStatus = ref('')
const page = ref(1), size = ref(20), total = ref(0)

const statusPill = (s: string) => {
  switch (s) {
    case 'PENDING': return 'p-wait'
    case 'REPAIRING': return 'p-run'
    case 'DONE': return 'p-done'
    case 'VERIFYING': return 'p-wait'
    case 'VERIFIED': return 'p-done'
    default: return 'p-wait'
  }
}
const statusText = (s: string) => ({
  PENDING: '待处理', REPAIRING: '维修中', DONE: '已完成',
  VERIFYING: '验证中', VERIFIED: '已验证',
}[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await tlmRepairApi.page({
      keyword: keyword.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载维修工单失败')
  } finally {
    loading.value = false
  }
}

function onSearch() { page.value = 1; fetch() }
function goTooling(row: TlmRepair) {
  if (row.toolId) router.push(`/tlm/tooling/${row.toolId}`)
}

// ---- 维修工单操作(按状态推进) ----
const fillDialog = ref(false)
const filling = ref(false)
const fillMeasure = ref('')
const fillRow = ref<TlmRepair | null>(null)

function openFill(row: TlmRepair) {
  fillRow.value = row
  fillMeasure.value = row.measure || ''
  fillDialog.value = true
}
async function submitFill() {
  if (!fillRow.value?.toolId) return
  filling.value = true
  try {
    await tlmToolingApi.repairFill(fillRow.value.toolId, fillMeasure.value)
    ElMessage.success('已填写维修措施，工装进入维修中')
    fillDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    filling.value = false
  }
}
async function doRepairDone(row: TlmRepair) {
  if (!row.toolId) return
  try {
    await tlmToolingApi.repairDone(row.toolId)
    ElMessage.success('已标记维修完成，待首件验证')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}
async function doVerify(row: TlmRepair) {
  if (!row.toolId) return
  try {
    await tlmToolingApi.repairComplete(row.toolId)
    ElMessage.success('验证通过，工装恢复在用并触发首件检验')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">维修工单</span></div>
        <h1>工装维修单<span class="no mono">TLM</span></h1>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="工装编号 / 名称" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:140px" @change="onSearch">
            <el-option label="待处理" value="PENDING" />
            <el-option label="维修中" value="REPAIRING" />
            <el-option label="已完成" value="DONE" />
            <el-option label="验证中" value="VERIFYING" />
            <el-option label="已验证" value="VERIFIED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>维修工单清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="维修单号" width="200">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.repairNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="工装" min-width="200">
          <template #default="{ row }">
            <span class="mono">{{ row.toolNo || '—' }}</span>
            <span v-if="row.toolName" style="margin-left:6px;">{{ row.toolName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="faultDesc" label="故障现象" min-width="200" show-overflow-tooltip />
        <el-table-column prop="measure" label="维修措施" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }"><span class="mono">{{ row.createdAt || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goTooling(row)">详情</el-button>
            <el-button v-if="(row.status === 'PENDING' || row.status === 'REPAIRING') && perm.has('tlm.tooling.repair')" link type="primary" size="small" @click="openFill(row)">填写措施</el-button>
            <el-button v-if="row.status === 'REPAIRING' && perm.has('tlm.tooling.repair')" link type="primary" size="small" @click="doRepairDone(row)">完成维修</el-button>
            <el-button v-if="row.status === 'DONE' && perm.has('tlm.tooling.repair')" link type="primary" size="small" @click="doVerify(row)">验证通过</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination :current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next"
          @current-change="(p:number)=>{page=p;fetch()}" />
      </div>
    </el-card>

    <!-- 填写维修措施弹窗 -->
    <el-dialog v-model="fillDialog" title="填写维修措施" width="520px" :modal="false">
      <div v-if="fillRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        工装：<span class="mono c-cobalt">{{ fillRow.toolNo }}</span> {{ fillRow.toolName }}
      </div>
      <div style="display:grid;gap:8px;">
        <div><label class="l">故障现象</label><div class="v-mute">{{ fillRow?.faultDesc || '—' }}</div></div>
        <div><label class="l">维修措施 *</label><el-input v-model="fillMeasure" type="textarea" :rows="4" placeholder="如：更换磨损导柱、校准定位精度至 ±0.02mm" /></div>
      </div>
      <template #footer>
        <el-button @click="fillDialog = false">取消</el-button>
        <el-button type="primary" :disabled="filling" @click="submitFill">{{ filling ? '提交中' : '确认填写' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-wrap :deep(.pill) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}
.page-wrap :deep(.pill .d) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.page-wrap :deep(.p-wait) { background: $amber-dim; color: $amber; }
.page-wrap :deep(.p-wait .d) { background: $amber; }
.page-wrap :deep(.p-run) { background: $cobalt-dim; color: $cobalt; }
.page-wrap :deep(.p-run .d) { background: $cobalt; }
.page-wrap :deep(.p-lock) { background: $signal-red-dim; color: $signal-red; }
.page-wrap :deep(.p-lock .d) { background: $signal-red; }
.page-wrap :deep(.p-done) { background: $green-dim; color: $green; }
.page-wrap :deep(.p-done .d) { background: $green; }
.page-wrap :deep(.p-mute) { background: $ink-faint-dim; color: $ink-faint; }
.page-wrap :deep(.p-mute .d) { background: $ink-faint; }
</style>
