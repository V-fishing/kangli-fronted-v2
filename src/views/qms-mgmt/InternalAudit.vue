<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { QmsInternalAudit, QmsAuditNc, QmsMgmtStats } from '@/api/types/qmsMgmt'
import { qmsAuditApi } from '@/api/modules/qmsMgmt'
import { usePermissionStore } from '@/stores/permission'
import { downloadBlob } from '@/api/modules/common/files'
import StatCards from '@/components/common/StatCards.vue'

const perm = usePermissionStore()

const list = ref<QmsInternalAudit[]>([])
const loading = ref(false)
const keyword = ref('')
const filterStatus = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)
const stats = ref<QmsMgmtStats>({})

const statusPill = (s: string) => {
  switch (s) {
    case 'PLANNED': return 'p-wait'
    case 'ONGOING': return 'p-run'
    case 'DONE': return 'p-sign'
    case 'CLOSED': return 'p-done'
    default: return 'p-mute'
  }
}
const statusText = (s: string) => ({
  PLANNED: '计划中', ONGOING: '进行中', DONE: '已完成', CLOSED: '已关闭',
}[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await qmsAuditApi.page({
      keyword: keyword.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}
async function loadStats() {
  try { stats.value = await qmsAuditApi.stats() } catch (e) { /* ignore */ }
}
function onSearch() { page.value = 1; fetch() }

async function onExport() {
  try {
    await downloadBlob('/api/v1/qms-mgmt/audits/export',
      '内审计划.csv',
      { keyword: keyword.value || undefined, status: filterStatus.value || undefined })
    ElMessage.success('导出成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

const formDialog = ref(false)
const editingId = ref('')
const submitting = ref(false)
const form = reactive<QmsInternalAudit>({
  auditNo: '', auditName: '', auditScope: '', planDate: '', auditor: '', status: 'PLANNED', remark: '',
})
function openCreate() {
  editingId.value = ''
  Object.assign(form, { auditNo: '', auditName: '', auditScope: '', planDate: '', auditor: '', status: 'PLANNED', remark: '' })
  formDialog.value = true
}
function openEdit(row: QmsInternalAudit) {
  editingId.value = row.id as string
  Object.assign(form, {
    auditNo: row.auditNo, auditName: row.auditName, auditScope: row.auditScope,
    planDate: row.planDate, auditor: row.auditor, status: row.status, remark: row.remark,
  })
  formDialog.value = true
}
async function submitForm() {
  if (!form.auditName || !form.auditName.trim()) { ElMessage.warning('请填写内审主题'); return }
  submitting.value = true
  try {
    if (editingId.value) {
      await qmsAuditApi.update({ id: editingId.value, ...form })
      ElMessage.success('已保存')
    } else {
      await qmsAuditApi.create({ ...form })
      ElMessage.success('内审已创建')
    }
    formDialog.value = false
    fetch(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}
async function advance(row: QmsInternalAudit, status: string) {
  try {
    await qmsAuditApi.advance(row.id as string, status)
    ElMessage.success('状态已更新')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}
async function doDelete(row: QmsInternalAudit) {
  try {
    await ElMessageBox.confirm(`确认删除内审 ${row.auditNo}？关联不符合项将一并删除。`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await qmsAuditApi.delete(row.id as string)
    ElMessage.success('已删除')
    fetch(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

// ===== 不符合项维护 =====
const ncDialog = ref(false)
const ncAudit = ref<QmsInternalAudit | null>(null)
const ncList = ref<QmsAuditNc[]>([])
const ncLoading = ref(false)
const ncStatusFilter = ref('')
const ncPageNo = ref(1), ncSize = usePageSize(), ncTotal = ref(0)
async function openNc(row: QmsInternalAudit) {
  ncAudit.value = row
  ncStatusFilter.value = ''
  ncPageNo.value = 1
  await loadNc()
  ncDialog.value = true
}
async function loadNc() {
  if (!ncAudit.value?.id) return
  ncLoading.value = true
  try {
    const res = await qmsAuditApi.ncPage({
      auditId: ncAudit.value.id, status: ncStatusFilter.value || undefined,
      page: ncPageNo.value, size: ncSize.value,
    })
    ncList.value = res.records
    ncTotal.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载不符合项失败')
  } finally {
    ncLoading.value = false
  }
}
const ncFormDialog = ref(false)
const editingNcId = ref('')
const submittingNc = ref(false)
const ncForm = reactive<QmsAuditNc>({
  auditId: '', ncNo: '', ncDesc: '', clause: '', severity: 'MINOR', status: 'OPEN',
  owner: '', dueDate: '', corrective: '', verifyResult: '',
})
function openNcCreate() {
  if (!ncAudit.value?.id) return
  editingNcId.value = ''
  Object.assign(ncForm, {
    auditId: ncAudit.value.id, ncNo: '', ncDesc: '', clause: '', severity: 'MINOR', status: 'OPEN',
    owner: '', dueDate: '', corrective: '', verifyResult: '',
  })
  ncFormDialog.value = true
}
function openNcEdit(row: QmsAuditNc) {
  editingNcId.value = row.id as string
  Object.assign(ncForm, {
    auditId: row.auditId, ncNo: row.ncNo, ncDesc: row.ncDesc, clause: row.clause,
    severity: row.severity, status: row.status, owner: row.owner, dueDate: row.dueDate,
    corrective: row.corrective, verifyResult: row.verifyResult,
  })
  ncFormDialog.value = true
}
async function submitNc() {
  if (!ncForm.ncDesc || !ncForm.ncDesc.trim()) { ElMessage.warning('请填写不符合描述'); return }
  submittingNc.value = true
  try {
    if (editingNcId.value) {
      await qmsAuditApi.ncSave({ id: editingNcId.value, ...ncForm })
      ElMessage.success('已保存')
    } else {
      await qmsAuditApi.ncSave({ ...ncForm })
      ElMessage.success('不符合项已新增')
    }
    ncFormDialog.value = false
    loadNc(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submittingNc.value = false
  }
}
async function deleteNc(row: QmsAuditNc) {
  try {
    await ElMessageBox.confirm(`确认删除不符合项 ${row.ncNo}？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await qmsAuditApi.ncDelete(row.id as string)
    ElMessage.success('已删除')
    loadNc(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}
const ncStatusPill = (s: string) => ({ OPEN: 'p-wait', IN_PROGRESS: 'p-run', CLOSED: 'p-done' }[s] || 'p-mute')
const ncStatusText = (s: string) => ({ OPEN: '待整改', IN_PROGRESS: '整改中', CLOSED: '已关闭' }[s] || s)
const ncSeverityPill = (s: string) => ({ MAJOR: 'p-wait', MINOR: 'p-run', OBSERVATION: 'p-mute' }[s] || 'p-mute')

onMounted(() => { fetch(); loadStats() })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">体系管理</span><span class="crumb-sep">/</span><span class="crumb-link">内审数据管理</span></div>
        <h1>内审数据<span class="no mono">QMS</span></h1>
      </div>
      <el-button v-if="perm.has('qms-mgmt.audit.create')" type="primary" @click="openCreate">新建内审</el-button>
      <el-button v-if="perm.has('qms-mgmt.audit.list')" @click="onExport">导出 CSV</el-button>
    </div>

    <StatCards :cards="[
      { num: stats.auditTotal || 0, label: '内审总数', tone: 'cobalt' },
      { num: stats.ongoing || 0, label: '进行中', tone: 'run' },
      { num: stats.closed || 0, label: '已关闭', tone: 'done' },
      { num: stats.ncOpen || 0, label: '待整改NC', tone: 'wait' },
      { num: (stats.ncCloseRate || 0) + '%', label: 'NC关闭率', tone: 'done' },
    ]" />

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="内审编号 / 主题 / 审核员" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="计划中" value="PLANNED" />
            <el-option label="进行中" value="ONGOING" />
            <el-option label="已完成" value="DONE" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>内审清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="内审编号" width="190">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.auditNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="主题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditName || '—' }}</template>
        </el-table-column>
        <el-table-column label="范围" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditScope || '—' }}</template>
        </el-table-column>
        <el-table-column label="计划日期" width="130">
          <template #default="{ row }"><span class="mono">{{ (row.planDate || '').slice(0, 10) || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="审核员" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditor || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openNc(row)" v-if="perm.has('qms-mgmt.audit.nc')">不符合项</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)" v-if="perm.has('qms-mgmt.audit.edit')">编辑</el-button>
            <el-button link type="primary" size="small" @click="advance(row, 'ONGOING')" v-if="perm.has('qms-mgmt.audit.edit') && row.status === 'PLANNED'">启动</el-button>
            <el-button link type="primary" size="small" @click="advance(row, 'DONE')" v-if="perm.has('qms-mgmt.audit.edit') && row.status === 'ONGOING'">完成</el-button>
            <el-button link type="primary" size="small" @click="advance(row, 'CLOSED')" v-if="perm.has('qms-mgmt.audit.edit') && row.status === 'DONE'">关闭</el-button>
            <el-button link type="danger" size="small" @click="doDelete(row)" v-if="perm.has('qms-mgmt.audit.delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 创建 / 编辑内审 -->
    <el-dialog v-model="formDialog" :title="editingId ? '编辑内审' : '新建内审'" width="560px" append-to-body>
      <el-form label-width="92px">
        <el-form-item label="内审主题 *"><el-input v-model="form.auditName" placeholder="内审主题 / 名称" /></el-form-item>
        <el-form-item label="审核范围"><el-input v-model="form.auditScope" type="textarea" :rows="2" placeholder="审核范围" /></el-form-item>
        <el-form-item label="计划日期"><el-date-picker v-model="form.planDate" type="date" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="计划审核时间" style="width:100%" /></el-form-item>
        <el-form-item label="审核员"><el-input v-model="form.auditor" placeholder="审核员" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="计划中" value="PLANNED" />
            <el-option label="进行中" value="ONGOING" />
            <el-option label="已完成" value="DONE" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog = false">取消</el-button>
        <el-button type="primary" :disabled="submitting" @click="submitForm">{{ submitting ? '提交中' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 不符合项维护 -->
    <el-dialog v-model="ncDialog" :title="'不符合项 · ' + (ncAudit?.auditNo || '')" width="900px" append-to-body>
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;" v-if="perm.has('qms-mgmt.audit.nc')">
        <el-button type="primary" @click="openNcCreate">新增不符合项</el-button>
      </div>
      <el-table :data="ncList" v-loading="ncLoading" style="width:100%">
        <el-table-column label="编号" width="150"><template #default="{ row }"><span class="mono c-cobalt">{{ row.ncNo || '—' }}</span></template></el-table-column>
        <el-table-column label="不符合描述" min-width="200" show-overflow-tooltip><template #default="{ row }">{{ row.ncDesc || '—' }}</template></el-table-column>
        <el-table-column label="条款" width="120"><template #default="{ row }">{{ row.clause || '—' }}</template></el-table-column>
        <el-table-column label="严重度" width="110"><template #default="{ row }"><span class="pill" :class="ncSeverityPill(row.severity)"><span class="d"></span>{{ row.severity }}</span></template></el-table-column>
        <el-table-column label="责任" min-width="110" show-overflow-tooltip><template #default="{ row }">{{ row.owner || '—' }}</template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><span class="pill" :class="ncStatusPill(row.status)"><span class="d"></span>{{ ncStatusText(row.status) }}</span></template></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openNcEdit(row)" v-if="perm.has('qms-mgmt.audit.nc')">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteNc(row)" v-if="perm.has('qms-mgmt.audit.nc')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="padding:14px 0;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="ncPageNo" v-model:page-size="ncSize" :total="ncTotal" small
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadNc" @size-change="loadNc" />
      </div>
    </el-dialog>

    <el-dialog v-model="ncFormDialog" :title="editingNcId ? '编辑不符合项' : '新增不符合项'" width="600px" append-to-body>
      <el-form label-width="92px">
        <el-form-item label="编号"><span class="mono c-cobalt">{{ ncForm.ncNo || '系统生成' }}</span></el-form-item>
        <el-form-item label="不符合描述 *"><el-input v-model="ncForm.ncDesc" type="textarea" :rows="3" placeholder="不符合描述" /></el-form-item>
        <el-form-item label="条款"><el-input v-model="ncForm.clause" placeholder="对应条款 / 标准" /></el-form-item>
        <el-form-item label="严重度">
          <el-select v-model="ncForm.severity" style="width:100%">
            <el-option label="严重" value="MAJOR" />
            <el-option label="一般" value="MINOR" />
            <el-option label="观察项" value="OBSERVATION" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任部门/人"><el-input v-model="ncForm.owner" placeholder="责任部门 / 人" /></el-form-item>
        <el-form-item label="整改期限"><el-date-picker v-model="ncForm.dueDate" type="date" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="整改期限" style="width:100%" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="ncForm.status" style="width:100%">
            <el-option label="待整改" value="OPEN" />
            <el-option label="整改中" value="IN_PROGRESS" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="纠正措施"><el-input v-model="ncForm.corrective" type="textarea" :rows="3" placeholder="纠正 / 纠正措施" /></el-form-item>
        <el-form-item label="验证结果"><el-input v-model="ncForm.verifyResult" placeholder="验证结果" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ncFormDialog = false">取消</el-button>
        <el-button type="primary" :disabled="submittingNc" @click="submitNc">{{ submittingNc ? '提交中' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

