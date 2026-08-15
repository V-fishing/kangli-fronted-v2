<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CsFeedback } from '@/api/types/cs'
import { csFeedbackApi } from '@/api/modules/cs/feedback'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()

const list = ref<CsFeedback[]>([])
const loading = ref(false)
const keyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)

const typeText = (t: string) => ({ COMPLAINT: '投诉', SUGGESTION: '建议', PRAISE: '表扬', INQUIRY: '咨询' }[t] || t)
const statusPill = (s: string) => {
  switch (s) {
    case 'OPEN': return 'p-wait'
    case 'HANDLING': return 'p-run'
    case 'DONE': return 'p-done'
    default: return 'p-mute'
  }
}
const statusText = (s: string) => ({ OPEN: '待处理', HANDLING: '处理中', DONE: '已处理' }[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await csFeedbackApi.page({
      keyword: keyword.value || undefined,
      fbType: filterType.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载反馈失败')
  } finally {
    loading.value = false
  }
}
function onSearch() { page.value = 1; fetch() }

// ===== 登记 / 编辑 =====
const formDialog = ref(false)
const editingId = ref('')
const submitting = ref(false)
const form = reactive<CsFeedback>({
  customerName: '', customerContact: '', fbType: 'COMPLAINT', content: '', relatedWoNo: '', satisfaction: undefined,
})
function openCreate() {
  editingId.value = ''
  Object.assign(form, { customerName: '', customerContact: '', fbType: 'COMPLAINT', content: '', relatedWoNo: '', satisfaction: undefined })
  formDialog.value = true
}
function openEdit(row: CsFeedback) {
  editingId.value = row.id as string
  Object.assign(form, {
    customerName: row.customerName, customerContact: row.customerContact, fbType: row.fbType,
    content: row.content, relatedWoNo: row.relatedWoNo, satisfaction: row.satisfaction,
  })
  formDialog.value = true
}
async function submitForm() {
  if (!form.customerName || !form.customerName.trim()) { ElMessage.warning('请填写客户名称'); return }
  if (!form.content || !form.content.trim()) { ElMessage.warning('请填写反馈内容'); return }
  submitting.value = true
  try {
    if (editingId.value) {
      await csFeedbackApi.update({ id: editingId.value, ...form })
      ElMessage.success('已保存')
    } else {
      await csFeedbackApi.create({ ...form })
      ElMessage.success('反馈已登记')
    }
    formDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// ===== 处理 =====
const handleDialog = ref(false)
const handleRow = ref<CsFeedback | null>(null)
const handleDetail = ref('')
const handleOwner = ref('')
const handleLoading = ref(false)
function openHandle(row: CsFeedback) {
  handleRow.value = row
  handleDetail.value = row.handleDetail || ''
  handleOwner.value = row.ownerName || ''
  handleDialog.value = true
}
async function submitHandle() {
  if (!handleRow.value?.id) return
  handleLoading.value = true
  try {
    await csFeedbackApi.handle(handleRow.value.id, handleDetail.value, handleOwner.value)
    ElMessage.success('已标记处理完成')
    handleDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    handleLoading.value = false
  }
}

async function doHandling(row: CsFeedback) {
  try {
    await ElMessageBox.confirm(`将反馈「${row.customerName}」标记为处理中？`, '标记处理中', { type: 'info' })
  } catch { return }
  try {
    await csFeedbackApi.markHandling(row.id as string, row.ownerName || '')
    ElMessage.success('已标记为处理中')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}

async function doDelete(row: CsFeedback) {
  try {
    await ElMessageBox.confirm(`确认删除客户「${row.customerName}」的反馈？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await csFeedbackApi.delete(row.id as string)
    ElMessage.success('已删除')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">售后管理</span><span class="crumb-sep">/</span><span class="crumb-link">客户反馈</span></div>
        <h1>客户反馈<span class="no mono">CS</span></h1>
      </div>
      <el-button v-if="perm.has('cs.feedback.create')" type="primary" @click="openCreate">登记反馈</el-button>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="客户 / 内容 / 工单号" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterType" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="投诉" value="COMPLAINT" />
            <el-option label="建议" value="SUGGESTION" />
            <el-option label="表扬" value="PRAISE" />
            <el-option label="咨询" value="INQUIRY" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="待处理" value="OPEN" />
            <el-option label="处理中" value="HANDLING" />
            <el-option label="已处理" value="DONE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>客户反馈清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="客户" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.customerName || '—' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }"><span class="mono">{{ typeText(row.fbType) }}</span></template>
        </el-table-column>
        <el-table-column label="反馈内容" prop="content" min-width="220" show-overflow-tooltip />
        <el-table-column label="关联工单" width="170">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.relatedWoNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="评分" width="80">
          <template #default="{ row }">
            <span v-if="row.satisfaction != null" class="mono" :class="row.satisfaction >= 4 ? 'c-green' : 'hl-red'">{{ row.satisfaction }}★</span>
            <span v-else class="mute">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }"><span class="mono">{{ row.createdAt || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)" v-if="perm.has('cs.feedback.edit') && row.status !== 'DONE'">编辑</el-button>
            <el-button link type="primary" size="small" @click="doHandling(row)" v-if="perm.has('cs.feedback.handle') && row.status === 'OPEN'">处理中</el-button>
            <el-button link type="primary" size="small" @click="openHandle(row)" v-if="perm.has('cs.feedback.handle') && row.status !== 'DONE'">处理</el-button>
            <el-button link type="danger" size="small" @click="doDelete(row)" v-if="perm.has('cs.feedback.delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 登记 / 编辑弹窗 -->
    <el-dialog v-model="formDialog" :title="editingId ? '编辑反馈' : '登记反馈'" width="560px" append-to-body>
      <el-form label-width="92px">
        <el-form-item label="客户名称 *"><el-input v-model="form.customerName" placeholder="客户名称" /></el-form-item>
        <el-form-item label="联系方式"><el-input v-model="form.customerContact" placeholder="联系电话/邮箱" /></el-form-item>
        <el-form-item label="反馈类型">
          <el-radio-group v-model="form.fbType">
            <el-radio-button value="COMPLAINT">投诉</el-radio-button>
            <el-radio-button value="SUGGESTION">建议</el-radio-button>
            <el-radio-button value="PRAISE">表扬</el-radio-button>
            <el-radio-button value="INQUIRY">咨询</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="反馈内容 *"><el-input v-model="form.content" type="textarea" :rows="3" placeholder="反馈内容" /></el-form-item>
        <el-form-item label="关联工单"><el-input v-model="form.relatedWoNo" placeholder="关联售后工单号（可选）" /></el-form-item>
        <el-form-item label="满意度"><el-rate v-model="form.satisfaction" :max="5" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog = false">取消</el-button>
        <el-button type="primary" :disabled="submitting" @click="submitForm">{{ submitting ? '提交中' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleDialog" title="处理反馈" width="520px" append-to-body>
      <div v-if="handleRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        客户：<span class="mono c-cobalt">{{ handleRow.customerName }}</span> · {{ typeText(handleRow.fbType) }}
      </div>
      <el-form label-width="80px">
        <el-form-item label="处理人"><el-input v-model="handleOwner" placeholder="处理人" /></el-form-item>
        <el-form-item label="处理结果 *"><el-input v-model="handleDetail" type="textarea" :rows="4" placeholder="处理过程 / 结果" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialog = false">取消</el-button>
        <el-button type="primary" :disabled="handleLoading" @click="submitHandle">{{ handleLoading ? '提交中' : '确认处理' }}</el-button>
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
.page-wrap :deep(.pill .d) { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.page-wrap :deep(.p-wait) { background: $amber-dim; color: $amber; }
.page-wrap :deep(.p-wait .d) { background: $amber; }
.page-wrap :deep(.p-run) { background: $cobalt-dim; color: $cobalt; }
.page-wrap :deep(.p-run .d) { background: $cobalt; }
.page-wrap :deep(.p-done) { background: $green-dim; color: $green; }
.page-wrap :deep(.p-done .d) { background: $green; }
.page-wrap :deep(.p-mute) { background: $ink-faint-dim; color: $ink-faint; }
.page-wrap :deep(.p-mute .d) { background: $ink-faint; }
</style>
