<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <span class="tt">工单锁定</span>
      </template>

      <el-form :inline="true" @submit.prevent="handleQuery">
        <el-form-item label="工单号">
          <el-input
            v-model="filter.woNo"
            placeholder="支持模糊查询"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="锁定" value="锁定" />
            <el-option label="正常" value="正常" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="woNo" label="工单号" width="180" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.lockStatus === '锁定' ? 'danger' : 'success'" effect="dark">
              {{ row.lockStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lockReason" label="锁定原因" width="120" />
        <el-table-column label="锁定时间" width="160">
          <template #default="{ row }">{{ fmt(row.lockedAt) }}</template>
        </el-table-column>
        <el-table-column label="解锁方式" width="110">
          <template #default="{ row }">
            <span v-if="row.unlockType">{{ row.unlockType }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="解锁时间" width="160">
          <template #default="{ row }">{{ fmt(row.unlockedAt) }}</template>
        </el-table-column>
        <el-table-column prop="taskCode" label="触发单号" width="160" />
        <el-table-column prop="traceTag" label="追溯标签" min-width="140" />
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button type="info" link @click="openDetail(row)">详情</el-button>
            <template v-if="row.lockStatus === '锁定'">
              <el-button type="warning" link @click="openEmergency(row)">紧急放行</el-button>
              <el-button type="danger" link @click="openRelease(row)">审批释放</el-button>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="releaseType === 'emergency' ? '紧急放行工单锁定' : '审批释放工单锁定'"
      width="460px"
    >
      <el-form label-width="90px">
        <el-form-item label="工单号">
          <span>{{ current?.woNo }}</span>
        </el-form-item>
        <el-form-item label="放行原因">
          <el-input
            v-model="releaseReason"
            type="textarea"
            :rows="3"
            :placeholder="releaseType === 'emergency' ? '请填写紧急放行原因(需注明产线急单背景)' : '请填写放行 / 审批意见'"
          />
        </el-form-item>
        <el-form-item label="追溯标签">
          <el-input v-model="traceTag" placeholder="如 LOT-xxx / 批次号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          :type="releaseType === 'emergency' ? 'warning' : 'primary'"
          :loading="submitting"
          @click="confirmRelease"
        >
          {{ releaseType === 'emergency' ? '确认紧急放行' : '确认释放' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="工单锁定详情" width="680px">
      <template v-if="detailRow">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="工单号">{{ detailRow.woNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailRow.lockStatus === '锁定' ? 'danger' : 'success'" effect="dark">
              {{ detailRow.lockStatus }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="锁定原因">{{ detailRow.lockReason || '—' }}</el-descriptions-item>
          <el-descriptions-item label="解锁方式">{{ detailRow.unlockType || '—' }}</el-descriptions-item>
          <el-descriptions-item label="锁定时间">{{ fmt(detailRow.lockedAt) }}</el-descriptions-item>
          <el-descriptions-item label="解锁时间">{{ fmt(detailRow.unlockedAt) }}</el-descriptions-item>
          <el-descriptions-item label="触发单号">{{ detailRow.taskCode || '—' }}</el-descriptions-item>
          <el-descriptions-item label="追溯标签">{{ detailRow.traceTag || '—' }}</el-descriptions-item>
          <el-descriptions-item label="放行原因" :span="2">{{ detailRow.releaseReason || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="sub-tt">关联首件检验任务</div>
        <el-table v-if="relatedTasks.length" :data="relatedTasks" border size="small">
          <el-table-column label="任务单号" width="170">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="goToTask(row)">{{ row.code }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" />
          <el-table-column prop="productName" label="产品" min-width="120" />
          <el-table-column prop="lineName" label="产线" width="110" />
          <el-table-column prop="triggerType" label="触发类型" width="110" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="goToTask(row)">追溯跳转</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="该锁定工单暂无对应首件检验任务" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fiaWoLockApi } from '@/api/modules/fia/woLock'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import type { FiaWoLock } from '@/api/types/fia'
import type { FiaTask } from '@/api/types/fia'

const route = useRoute()
const router = useRouter()
const list = ref<FiaWoLock[]>([])
const loading = ref(false)
const filter = reactive({ woNo: '', status: '' })

const dialogVisible = ref(false)
const current = ref<FiaWoLock | null>(null)
const releaseReason = ref('')
const traceTag = ref('')
const submitting = ref(false)
const releaseType = ref<'approve' | 'emergency'>('approve')

const detailVisible = ref(false)
const detailRow = ref<FiaWoLock | null>(null)
const relatedTasks = ref<FiaTask[]>([])

function fmt(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function fetchData() {
  loading.value = true
  try {
    const res = await fiaWoLockApi.list({
      status: filter.status || undefined,
      woNo: filter.woNo.trim() || undefined,
    })
    list.value = res ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  fetchData()
}

function resetFilter() {
  filter.woNo = ''
  filter.status = ''
  fetchData()
}

function openRelease(row: FiaWoLock) {
  releaseType.value = 'approve'
  current.value = row
  releaseReason.value = ''
  traceTag.value = ''
  dialogVisible.value = true
}

function openEmergency(row: FiaWoLock) {
  releaseType.value = 'emergency'
  current.value = row
  releaseReason.value = ''
  traceTag.value = ''
  dialogVisible.value = true
}

async function confirmRelease() {
  if (!current.value) return
  submitting.value = true
  try {
    const payload = {
      woNo: current.value.woNo,
      releaseReason: releaseReason.value || undefined,
      traceTag: traceTag.value || undefined,
    }
    if (releaseType.value === 'emergency') {
      await fiaWoLockApi.emergencyRelease(payload)
    } else {
      await fiaWoLockApi.release(payload)
    }
    ElMessage.success(releaseType.value === 'emergency' ? '已紧急放行' : '已审批释放')
    dialogVisible.value = false
    fetchData()
  } catch {
    /* 错误提示由拦截器统一处理 */
  } finally {
    submitting.value = false
  }
}

async function openDetail(row: FiaWoLock) {
  detailRow.value = row
  relatedTasks.value = []
  detailVisible.value = true
  try {
    const res = await fiaTaskApi.list({ woNo: row.woNo })
    relatedTasks.value = res ?? []
  } catch {
    relatedTasks.value = []
  }
}

function goToTask(t: FiaTask) {
  detailVisible.value = false
  router.push(`/fia/tasks/${t.id}`)
}

onMounted(() => {
  const q = route.query.woNo
  if (typeof q === 'string' && q) {
    filter.woNo = q
  }
  fetchData()
})
</script>

<style scoped>
.page {
  padding: 16px;
}
.tt {
  font-weight: 600;
  font-size: 16px;
}
.sub-tt {
  margin: 14px 0 8px;
  font-weight: 600;
  font-size: 14px;
  color: #606266;
}
</style>
