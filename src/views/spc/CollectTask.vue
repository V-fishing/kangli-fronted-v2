<template>
  <div class="collect-task">
    <div class="head-b"><AppBreadcrumb /><h1>采集任务管理</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="采集模式">
          <el-select v-model="filterMode" clearable placeholder="全部" style="width:160px" @change="page = 1; fetchData()">
            <el-option v-for="m in modeOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:140px" @change="page = 1; fetchData()">
            <el-option label="待采集" value="待采集" />
            <el-option label="缺失" value="缺失" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数名"><el-input v-model="filterParamName" clearable placeholder="搜索" style="width:180px" /></el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1; fetchData()">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div class="toolbar">
        <el-button type="primary" @click="openCreate">+ 新建任务</el-button>
        <el-button @click="onScanMissing" :loading="scanning">立即扫描到期缺失</el-button>
      </div>
      <el-table :data="filtered" v-loading="loading" size="small">
        <el-table-column label="参数名" min-width="160"><template #default="{row}">{{ paramNameMap[row.paramId] || row.paramId || '—' }}</template></el-table-column>
        <el-table-column label="采集模式" width="120">
          <template #default="{row}">
            <el-tag v-if="modeMeta[row.collectMode]" :style="tagStyle(row.collectMode)">{{ modeMeta[row.collectMode].label }}</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="collectFreq" label="采集频率" width="110" />
        <el-table-column prop="collector" label="采集人" width="110">
          <template #default="{row}">{{ row.collector || '班组长' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === '缺失' ? 'danger' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下次到期" min-width="150"><template #default="{row}"><span class="mono">{{ row.nextDueAt || '—' }}</span></template></el-table-column>
        <el-table-column label="计划停机" width="90">
          <template #default="{row}">
            <el-tag v-if="row.isPlannedDowntime" type="warning" size="small">停机</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{row}">
            <span style="white-space:nowrap">
              <el-button link type="warning" size="small" @click="openDowntime(row)">标记停机</el-button>
              <el-button link type="danger" size="small" :disabled="row.isPlannedDowntime" @click="onMarkMissing(row)">标记缺失</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" :current-page="page" :page-size="size"
          @current-change="(p: number) => { page = p; fetchData() }"
          @size-change="(s: number) => { size = s; page = 1; fetchData() }" />
      </div>
    </el-card>

    <!-- 新建/编辑 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑采集任务' : '新建采集任务'" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="参数" required>
          <el-select v-model="form.paramId" filterable placeholder="选择 SPC 参数" style="width:100%">
            <el-option v-for="p in paramOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="采集频率"><el-input v-model="form.collectFreq" placeholder="如 每日 / 每班次" /></el-form-item>
        <el-form-item label="采集人">
          <el-select v-model="form.collector" placeholder="留空则通知班组长" clearable filterable style="width:100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="u.realName || u.username" :value="u.realName || u.username" />
          </el-select>
        </el-form-item>
        <el-form-item label="采集模式" required>
          <el-select v-model="form.collectMode" style="width:100%">
            <el-option v-for="m in modeOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划停机"><el-switch v-model="form.isPlannedDowntime" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>

    <!-- 标记计划停机 -->
    <el-dialog v-model="downtimeVisible" title="标记计划停机" width="440px">
      <el-form label-width="100px">
        <el-form-item label="计划停机"><el-switch v-model="downtimeForm.isPlannedDowntime" /></el-form-item>
        <el-form-item label="原因"><el-input v-model="downtimeForm.reason" type="textarea" :rows="3" placeholder="选填,便于追溯" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="downtimeVisible=false">取消</el-button><el-button type="primary" @click="submitDowntime">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck -- el-select v-model 与 Element Plus EpPropMergeType 严格类型不兼容,运行时正常
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { spcCollectTaskApi } from '@/api/modules/spc/collect-tasks'
import { usersApi } from '@/api/modules/uop/users'
import { spcParamApi } from '@/api/modules/spc/params'
import type { SpcCollectTask, SpcCollectMode } from '@/api/types/spc'
import type { UserSelectVo } from '@/api/types/uop'

const modeOptions = [
  { label: '手动录入', value: 'MANUAL' },
  { label: '设备直连 OPC/PLC', value: 'OPC' },
  { label: '文件导入', value: 'FILE' },
  { label: 'MES/外部接口对接', value: 'MES' },
  { label: '定时自动采集', value: 'AUTO' },
]
const modeMeta: Record<string, { label: string; color: string }> = {
  MANUAL: { label: '手动录入', color: '#909399' },
  OPC: { label: '设备直连', color: '#409EFF' },
  FILE: { label: '文件导入', color: '#67C23A' },
  MES: { label: 'MES对接', color: '#E6A23C' },
  AUTO: { label: '定时自动', color: '#9254DE' },
}
function tagStyle(mode: string) {
  const c = modeMeta[mode]?.color || '#909399'
  return { backgroundColor: c, borderColor: c, color: '#fff' }
}

const list = ref<SpcCollectTask[]>([])
const loading = ref(false)
const scanning = ref(false)
const filterMode = ref<SpcCollectMode | ''>('')
const filterStatus = ref('')
const filterParamName = ref('')
const page = ref(1), size = ref(20), total = ref(0)

const paramOptions = ref<{ label: string; value: string }[]>([])
const paramNameMap = ref<Record<string, string>>({})

const userOptions = ref<UserSelectVo[]>([])

const filtered = computed(() =>
  list.value.filter(r =>
    (!filterParamName.value || (paramNameMap.value[r.paramId] || '').includes(filterParamName.value))
  )
)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const form = reactive<Partial<SpcCollectTask>>({ collectMode: 'MANUAL', isPlannedDowntime: false, collector: undefined })

const downtimeVisible = ref(false)
const downtimeRow = ref<SpcCollectTask | null>(null)
const downtimeForm = reactive<{ isPlannedDowntime: boolean; reason: string }>({ isPlannedDowntime: false, reason: '' })

async function loadParams() {
  try {
    const records: any[] = await spcParamApi.list()
    paramOptions.value = records.map((p: any) => ({ label: `${p.paramName} · ${p.procName || ''}`, value: p.id }))
    paramNameMap.value = Object.fromEntries(records.map((p: any) => [p.id, p.paramName]))
  } catch (e) { /* 参数列表不可用时不影响任务管理 */ }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await spcCollectTaskApi.listPage({
      status: filterStatus.value || undefined,
      collectMode: filterMode.value || undefined,
      page: page.value, size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false; editId.value = ''
  Object.assign(form, { paramId: undefined, collectFreq: '', collectMode: 'MANUAL', isPlannedDowntime: false, collector: undefined })
  dialogVisible.value = true
}
function openEdit(row: SpcCollectTask) {
  isEdit.value = true; editId.value = row.id
  Object.assign(form, { paramId: row.paramId, collectFreq: row.collectFreq, collectMode: row.collectMode || 'MANUAL', isPlannedDowntime: !!row.isPlannedDowntime, collector: row.collector })
  dialogVisible.value = true
}
async function handleSubmit() {
  if (!form.paramId) { ElMessage.warning('请选择参数'); return }
  if (isEdit.value) { await spcCollectTaskApi.update(editId.value, form); ElMessage.success('已更新') }
  else { await spcCollectTaskApi.create(form); ElMessage.success('已创建') }
  dialogVisible.value = false; fetchData()
}

function openDowntime(row: SpcCollectTask) {
  downtimeRow.value = row
  downtimeForm.isPlannedDowntime = !!row.isPlannedDowntime
  downtimeForm.reason = ''
  downtimeVisible.value = true
}
async function submitDowntime() {
  if (!downtimeRow.value) return
  await spcCollectTaskApi.markDowntime(downtimeRow.value.id, { isPlannedDowntime: downtimeForm.isPlannedDowntime, reason: downtimeForm.reason })
  ElMessage.success('已更新停机状态'); downtimeVisible.value = false; fetchData()
}

async function onMarkMissing(row: SpcCollectTask) {
  if (row.isPlannedDowntime) { ElMessage.warning('该任务已标记计划停机,停产期间不触发缺失告警'); return }
  try {
    const { value } = await ElMessageBox.prompt('缺失原因(选填)', '标记采集缺失', { confirmButtonText: '标记', cancelButtonText: '取消', inputRequired: false })
    await spcCollectTaskApi.markMissing(row.id, value || undefined)
    ElMessage.success('已标记缺失并告警班组长'); fetchData()
  } catch (e) { /* 取消 */ }
}

async function onDelete(row: SpcCollectTask) {
  await ElMessageBox.confirm(`确认删除采集任务「${paramNameMap.value[row.paramId] || row.paramId}」?`, '删除确认')
  await spcCollectTaskApi.remove(row.id); ElMessage.success('已删除'); fetchData()
}

async function onScanMissing() {
  scanning.value = true
  try { const n = await spcCollectTaskApi.scanMissing(); ElMessage.success(`扫描完成,标记缺失 ${n} 条`); fetchData() }
  finally { scanning.value = false }
}

onMounted(() => { fetchData(); loadParams(); loadUsers() })

async function loadUsers() {
  try {
    userOptions.value = await usersApi.select()
  } catch {
    userOptions.value = []
  }
}
</script>

<style scoped>
.collect-task { padding: 0 16px 16px; }
.head-b { display: flex; align-items: baseline; gap: 12px; margin: 8px 0 16px; }
.crumb { color: #909399; font-size: 13px; }
.head-b h1 { font-size: 20px; font-weight: 600; margin: 0; color: #303133; }
.card-b { margin-bottom: 14px; border-radius: 10px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.muted { color: #c0c4cc; }
.filter-bar :deep(.el-form-item) { margin-bottom: 0; }
</style>
