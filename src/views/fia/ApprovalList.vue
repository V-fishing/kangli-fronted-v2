<template>
  <div class="approval-list">
    <div class="head-b"><div class="crumb">FIA / 首件检验</div><h1>审批单</h1></div>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="code" label="审批编号" width="170" />
        <el-table-column prop="applicantId" label="申请人" width="120">
          <template #default="{row}">{{ userMap[(row as FiaApproval).applicantId || ''] || (row as FiaApproval).applicantId }}</template>
        </el-table-column>
        <el-table-column prop="approvalType" label="审批类型" width="120">
          <template #default="{row}"><span class="tag-b">{{ (row as FiaApproval).approvalType || '处置审批' }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <span class="pill" :class="approvalStatusClass((row as FiaApproval).status)"><span class="d"></span>{{ (row as FiaApproval).status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="approveOpinion" label="审批意见" min-width="140" />
        <el-table-column prop="approverId" label="审批人" width="120">
          <template #default="{row}">{{ userMap[(row as FiaApproval).approverId || ''] || (row as FiaApproval).approverId }}</template>
        </el-table-column>
        <el-table-column prop="approveAt" label="审批时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button v-if="(row as FiaApproval).status === '待审批'" link type="primary" size="small" @click="openApprove(row as FiaApproval)">审批</el-button>
            <el-button v-else link type="info" size="small" @click="viewApproval(row as FiaApproval)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="审批" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="决议" required>
          <el-select v-model="form.approved" style="width:100%"><el-option label="通过" :value="true" /><el-option label="驳回" :value="false" /></el-select>
        </el-form-item>
        <el-form-item label="审批意见" required>
          <el-input v-model="form.opinion" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submitApprove">提交</el-button></template>
    </el-dialog>
    <!-- 关联任务详情弹窗 -->
    <el-dialog v-model="detailVisible" title="关联任务" width="480px">
      <template v-if="taskDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="校验单号">{{ taskDetail.code }}</el-descriptions-item>
          <el-descriptions-item label="工单号">{{ taskDetail.woNo }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ taskDetail.productName }}</el-descriptions-item>
          <el-descriptions-item label="工序">{{ taskDetail.procName }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag size="small">{{ taskDetail.status }}</el-tag></el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;text-align:right">
          <el-button type="primary" size="small" @click="goToTask">跳转到任务详情</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { fiaApprovalApi } from '@/api/modules/fia/approvals'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { useAuthStore } from '@/stores/auth'
import { request } from '@/api/client'
import type { FiaApproval } from '@/api/types/fia'
import type { SysUser } from '@/api/types/uop'

const auth = useAuthStore()
const router = useRouter()
const list = ref<FiaApproval[]>([])
const users = ref<SysUser[]>([])
const loading = ref(false)
const dialogVisible = ref(false), approveId = ref(''), detailVisible = ref(false)
const form = reactive({ approved: true, opinion: '' })

const userMap = computed(() => {
  const m: Record<string, string> = {}
  users.value.forEach(u => { m[u.id] = u.username })
  return m
})

async function fetch() { loading.value = true; try { list.value = await fiaApprovalApi.list() } finally { loading.value = false } }
async function loadUsers() { try { users.value = await request.get<SysUser[]>('/v1/uop/users') } catch { /* */ } }
function viewApproval(r: FiaApproval) {
  if (!r.taskId) { ElMessage.info('该审批单未关联任务'); return }
  loadTaskDetail(r.taskId)
}

const taskDetail = ref<{ id?: string; code?: string; woNo?: string; productName?: string; procName?: string; status?: string } | null>(null)
async function loadTaskDetail(taskId: string) {
  try {
    const vo = await fiaTaskApi.get(taskId)
    taskDetail.value = vo.task
    detailVisible.value = true
  } catch { ElMessage.error('加载任务详情失败') }
}
function goToTask() {
  if (taskDetail.value?.id) {
    detailVisible.value = false
    router.push(`/fia/tasks/${taskDetail.value.id}`)
  }
}
async function submitApprove() { await fiaApprovalApi.approve(approveId.value, { ...form }); ElMessage.success('审批完成'); dialogVisible.value = false; fetch() }
function approvalStatusClass(s: string) { return { '待审批': 'p-wait', '已通过': 'p-done', '已驳回': 'p-lock' }[s] || '' }
onMounted(() => { fetch(); loadUsers() })
</script>

<style lang="scss" scoped>
.approval-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.p-lock { background: $signal-red-dim; color: $signal-red; } .p-lock .d { background: $signal-red; }
.tag-b { display: inline-block; padding: 3px 9px; font-size: 11px; border-radius: 4px; background: $paper; color: $ink-soft; border: 1px solid $hairline; }
</style>