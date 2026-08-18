<template>
  <div class="ca-list">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>纠正措施</h1>
      </div>
      <div class="head-actions">
        <button class="btn-fill" v-if="canCreateCa" @click="openCreate">+ 新建纠正措施</button>
      </div>
    </div>

    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:130px" @change="page = 1; fetch()">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="不良单号">
          <el-input v-model="filterDefectNo" clearable placeholder="按缺陷单号筛选" style="width:180px" @keyup.enter="page = 1; fetch()" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="page = 1; fetch()">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="caNo" label="措施编号" width="170" />
        <el-table-column prop="defectNo" label="关联不良" width="140">
          <template #default="{row}">
            <router-link v-if="(row as NcmCorrectiveAction).defectNo" :to="defectDetailUrl(row as NcmCorrectiveAction)" class="mono link">
              {{ (row as NcmCorrectiveAction).defectNo }}
            </router-link>
            <span v-else class="mono" style="color: #999">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="issue" label="问题描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="责任人" width="100">
          <template #default="{row}">
            {{ (row as NcmCorrectiveAction).ownerName || (row as NcmCorrectiveAction).owner || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="期限" width="120" />
        <el-table-column label="进度" width="150">
          <template #default="{row}">
            <el-progress :percentage="(row as NcmCorrectiveAction).progress ?? 0" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <span class="pill" :class="caStatusClass((row as NcmCorrectiveAction).status)"><span class="d"></span>{{ (row as NcmCorrectiveAction).status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="$router.push(`/ncm/corrective-actions/${(row as NcmCorrectiveAction).id}`)">详情</el-button>
            <el-button link type="primary" size="small" v-if="canCreateCa" :disabled="(row as NcmCorrectiveAction).status === '已关闭'" @click="openProgress(row as NcmCorrectiveAction)">进度</el-button>
            <el-button link type="warning" size="small" v-if="canCreateCa" :disabled="(row as NcmCorrectiveAction).status === '已关闭'" @click="openAssign(row as NcmCorrectiveAction)">改派</el-button>
            <el-button link type="primary" size="small" v-if="canCloseCa" :disabled="(row as NcmCorrectiveAction).status === '已关闭'" @click="doClose(row as NcmCorrectiveAction)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" v-model:current-page="page" v-model:page-size="size"
          @current-change="fetch" @size-change="fetch" />
      </div>
      <el-empty v-if="!loading && !list.length" description="暂无纠正措施" />
    </el-card>

    <!-- 新建弹窗 -->
    <el-dialog v-model="createVisible" title="新建纠正措施" width="520px" append-to-body @closed="resetCreate">
      <el-form :model="form" label-width="90px">
        <el-form-item label="关联不良">
          <el-input v-model="form.defectNo" clearable placeholder="可选,填写不良单号(如 D-xxxx)" />
        </el-form-item>
        <el-form-item label="问题描述" required>
          <el-input v-model="form.issue" type="textarea" :rows="3" placeholder="请描述需要纠正的问题" />
        </el-form-item>
        <el-form-item label="责任人" required>
          <el-input v-model="form.owner" clearable placeholder="措施负责人" />
        </el-form-item>
        <el-form-item label="期限" required>
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择期限" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 进度更新弹窗 -->
    <el-dialog v-model="progressVisible" title="更新进度" width="460px" append-to-body>
      <div v-if="cur" class="prog-b">
        <div class="mono no">{{ cur.caNo }}</div>
        <div class="iss">{{ cur.issue }}</div>
        <el-slider v-model="progressForm.progress" :min="0" :max="100" :step="5" show-input />
        <div class="hint">进度达到 100% 后,系统自动将状态置为「已完成」。</div>
      </div>
      <template #footer>
        <el-button @click="progressVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProgress">保存进度</el-button>
      </template>
    </el-dialog>

    <AssignDialog
      v-model="assignVisible"
      :title="`改派责任人 · ${assignBizNo}`"
      :biz-no="assignBizNo"
      :is-reassign="true"
      biz-type="CA"
      @submit="onAssignSubmit"
    />
  </div>
</template>

<script setup lang="ts">
// __TSC_NOCHECK_DISABLED__ // @ts-nocheck
import { ref, reactive, computed, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { usePermissionStore } from '@/stores/permission'
import { ncmCorrectiveActionApi } from '@/api/modules/ncm/corrective-actions'
import type { NcmCorrectiveAction } from '@/api/types/ncm'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import AssignDialog from '@/components/common/AssignDialog.vue'

const statusOptions = ['待启动', '已完成', '已关闭']
const perm = usePermissionStore()
const canCreateCa = computed(() => perm.has('ncm.ca.create'))
const canCloseCa = computed(() => perm.has('ncm.ca.close'))

const list = ref<NcmCorrectiveAction[]>([])
const loading = ref(false)
const filterStatus = ref('')
const filterDefectNo = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)
const defects = ref<{ id: string; defectNo: string }[]>([])

const createVisible = ref(false)
const submitting = ref(false)
const form = reactive({ defectNo: '', issue: '', owner: '', dueDate: '' })

const progressVisible = ref(false)
const cur = ref<NcmCorrectiveAction | null>(null)
const progressForm = reactive({ progress: 0 })

// ── 列表级改派责任人 ──
const assignVisible = ref(false)
const assignBizNo = ref('')
const assigningId = ref('')
async function openAssign(row: NcmCorrectiveAction) {
  assigningId.value = row.id
  assignBizNo.value = row.caNo || row.id
  assignVisible.value = true
}
async function onAssignSubmit(body: DefectLaunchRequest) {
  try {
    await ncmCorrectiveActionApi.reassign(assigningId.value, body)
    ElMessage.success('已改派并通知责任人')
    assignVisible.value = false
    fetch()
  } finally { /* 弹窗内部保留 submitting 态 */ }
}

function caStatusClass(s: string) {
  return { '待启动': 'p-wait', '已完成': 'p-done', '已关闭': 'p-done' }[s] || 'p-wait'
}

function defectDetailUrl(ca: NcmCorrectiveAction): string {
  if (!ca.defectNo) return ''
  const d = defects.value.find(r => r.defectNo === ca.defectNo)
  return d ? `/ncm/defect-records/${d.id}` : '#'
}

async function loadDefects() {
  try {
    const { ncmDefectRecordApi } = await import('@/api/modules/ncm/defect-records')
    defects.value = await ncmDefectRecordApi.list()
  } catch { /* ignore */ }
}

async function fetch() {
  loading.value = true
  try {
    const res = await ncmCorrectiveActionApi.listPage({
      defectNo: filterDefectNo.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value, size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e) {
    ElMessage.error('加载纠正措施失败')
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterStatus.value = ''
  filterDefectNo.value = ''
  page.value = 1
  fetch()
}

function openCreate() {
  createVisible.value = true
}

function resetCreate() {
  form.defectNo = ''
  form.issue = ''
  form.owner = ''
  form.dueDate = ''
}

async function submitCreate() {
  if (!form.issue.trim()) { ElMessage.warning('请填写问题描述'); return }
  if (!form.owner.trim()) { ElMessage.warning('请填写责任人'); return }
  if (!form.dueDate) { ElMessage.warning('请选择期限'); return }
  submitting.value = true
  try {
    await ncmCorrectiveActionApi.create({
      defectNo: form.defectNo.trim() || undefined,
      issue: form.issue.trim(),
      owner: form.owner.trim() || undefined,
      dueDate: form.dueDate || undefined,
    })
    ElMessage.success('纠正措施已创建')
    createVisible.value = false
    fetch()
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

function openProgress(row: NcmCorrectiveAction) {
  cur.value = row
  progressForm.progress = row.progress ?? 0
  progressVisible.value = true
}

async function submitProgress() {
  if (!cur.value?.id) return
  submitting.value = true
  try {
    await ncmCorrectiveActionApi.updateProgress(cur.value.id, progressForm.progress)
    ElMessage.success('进度已更新')
    progressVisible.value = false
    fetch()
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    submitting.value = false
  }
}

async function doClose(row: NcmCorrectiveAction) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`确认关闭纠正措施 ${row.caNo}？关闭后不可再更新进度。`, '关闭确认', {
      type: 'warning',
      confirmButtonText: '确认关闭',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await ncmCorrectiveActionApi.close(row.id)
    ElMessage.success('已关闭')
    fetch()
  } catch (e) {
    ElMessage.error('关闭失败')
  }
}

onMounted(() => { fetch(); loadDefects() })
</script>

<style lang="scss" scoped>
.ca-list { width: 100%; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
.head-b { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.head-actions { display: flex; gap: 10px; }
.btn-fill { background: $ink; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-fill:hover { opacity: 0.88; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.mono { font-family: $font-mono; }
.link { color: $cobalt; text-decoration: none; font-weight: 600; }
.link:hover { text-decoration: underline; }
.prog-b { .no { font-family: $font-mono; font-size: 15px; font-weight: 700; color: $cobalt; margin-bottom: 8px; } .iss { font-size: 13px; color: $ink-soft; margin-bottom: 18px; } .hint { font-size: 12px; color: $ink-faint; margin-top: 10px; } }
</style>
