<template>
  <div class="d8-list">
    <div class="head-b">
      <AppBreadcrumb />
      <h1>8D 报告</h1>
      <el-button size="small" @click="router.push('/system/audit-config')">审核配置</el-button>
    </div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="来源"><el-select v-model="filter.source" clearable placeholder="全部" style="width:100px" @change="page = 1; fetch()"><el-option label="不良记录" value="不良记录" /><el-option label="SQM异常" value="SQM异常" /><el-option label="人工" value="人工" /><el-option label="NCM" value="NCM" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="filter.status" clearable placeholder="全部" style="width:110px" @change="page = 1; fetch()"><el-option value="进行中" /><el-option value="已闭环" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1; fetch()">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="dialogVisible=true">+ 创建 8D</el-button></div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="d8No" label="8D编号" width="170" />
        <el-table-column prop="source" label="来源" width="90" />
        <el-table-column prop="ownerUserName" label="责任人" width="100">
          <template #default="{row}">{{ (row as Qms8dReport).ownerUserName || (row as Qms8dReport).owner || '—' }}</template>
        </el-table-column>
        <el-table-column label="严重度/类型" min-width="160">
          <template #default="{row}">
            <span class="pill" :class="severityClass((row as Qms8dReport).severity)"><span class="d"></span>{{ (row as Qms8dReport).severity || '未分级' }}<template v-if="(row as Qms8dReport).flowType"> · {{ (row as Qms8dReport).flowType }}</template></span>
          </template>
        </el-table-column>
        <el-table-column prop="currentStage" label="当前阶段" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{row}"><span class="pill" :class="(row as Qms8dReport).status==='已闭环'?'p-done':'p-run'"><span class="d"></span>{{ (row as Qms8dReport).status }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="router.push(`/ncm/8d-reports/${(row as Qms8dReport).id}`)">详情</el-button>
            <el-button link type="warning" size="small" @click="openAssign(row as Qms8dReport)">改派</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" v-model:current-page="page" v-model:page-size="size"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" title="创建 8D" width="420px" append-to-body>
      <el-form :model="form" label-width="80px">
        <el-input v-model="form.orgId" type="hidden" />
        <el-form-item label="类型"><el-select v-model="form.flowType" style="width:100%"><el-option value="8D" /><el-option value="简易" /></el-select></el-form-item>
        <el-form-item label="严重度"><el-select v-model="form.severity" style="width:100%"><el-option v-for="s in ['高','中','低']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.source" style="width:100%">
            <el-option value="人工" label="人工(无来源)" />
            <el-option value="NCM" />
            <el-option value="SQM" />
            <el-option value="SPC" />
            <el-option value="不良记录" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.source && form.source !== '人工'" label="来源单号" required>
          <el-input v-model="form.sourceRefId" placeholder="关联事件单号(异常单号/缺陷编号/SPC告警编号等)" />
        </el-form-item>
        <el-form-item label="问题描述"><el-input v-model="form.issue" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="团队"><el-input v-model="form.team" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleCreate">确定</el-button></template>
    </el-dialog>

    <AssignDialog
      v-model="assignVisible"
      :title="`改派责任人 · ${assignBizNo}`"
      :biz-no="assignBizNo"
      :is-reassign="true"
      biz-type="8D"
      @submit="onAssignSubmit"
    />
  </div>
</template>

<style lang="scss" scoped>
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import type { Qms8dReport } from '@/api/types/ncm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import AssignDialog from '@/components/common/AssignDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const list = ref<Qms8dReport[]>([])
const loading = ref(false), dialogVisible = ref(false)
const filter = reactive({ source: '', status: '' })
const page = ref(1), size = usePageSize(), total = ref(0)
const form = reactive({ orgId: auth.user?.orgId || '', flowType: '8D', severity: '高', source: '人工', sourceRefId: '', issue: '', team: '' })

// ── 列表级改派责任人 ──
const assignVisible = ref(false)
const assignBizNo = ref('')
const assigningId = ref('')
async function openAssign(row: Qms8dReport) {
  assigningId.value = row.id
  assignBizNo.value = row.d8No
  assignVisible.value = true
}
async function onAssignSubmit(body: DefectLaunchRequest) {
  try {
    await ncm8dApi.reassign(assigningId.value, body)
    ElMessage.success('已改派并通知责任人')
    assignVisible.value = false
    fetch()
  } finally { /* submitting 态由弹窗内部保留至关闭 */ }
}

// 严重度三档配色:数据存在两套命名(创建弹窗用 高/中/低,外部来源用 严重/一般/轻微)
// 高危红(p-lock)、中危蓝(p-run)、低危绿(p-done)
function severityClass(sev?: string) {
  if (sev === '严重' || sev === '高') return 'p-lock'
  if (sev === '一般' || sev === '中') return 'p-run'
  if (sev === '轻微' || sev === '低') return 'p-done'
  return ''
}

async function fetch() {
  loading.value = true
  try {
const res = await ncm8dApi.listPage({
  page: page.value,
  size: size.value,
  status: filter.status || undefined,
  source: filter.source || undefined,
})
list.value = res.records
total.value = res.total
  } finally { loading.value = false }
}
async function handleCreate() {
  if (form.source && form.source !== '人工' && !form.sourceRefId) {
    ElMessage.warning('请填写来源单号后再创建')
    return
  }
  await ncm8dApi.create(form)
  ElMessage.success('已创建')
  dialogVisible.value = false
  fetch()
}
onMounted(() => fetch())
</script>
