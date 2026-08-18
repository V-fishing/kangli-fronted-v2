<template>
  <div class="process-page">
    <div class="head-b">
      <AppBreadcrumb />
      <h1>工序管理</h1>
      <p class="sub">管理装配 / 焊接 / 检测 / 系统等工序，作为 SPC 参数的父级分组（一父多子）。</p>
    </div>

    <el-card shadow="never" class="card-b">
      <div class="toolbar">
        <el-input v-model="kw" size="small" placeholder="搜索工序名称/编码" clearable style="width:220px" />
        <el-button type="primary" size="small" v-if="canEditProcess" @click="openCreate">+ 新建工序</el-button>
      </div>
      <el-table :data="filteredList" v-loading="loading" size="small" row-key="id" default-expand-all>
        <el-table-column prop="processName" label="工序名称" min-width="160" />
        <el-table-column prop="processCode" label="编码" width="120" />
        <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
        <el-table-column label="排序" width="80"><template #default="{row}">{{ row.sortNo ?? '—' }}</template></el-table-column>
        <el-table-column label="参数数" width="90" align="center">
          <template #default="{row}"><el-tag size="small" effect="plain">{{ paramCount[row.id] ?? 0 }}</el-tag></template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{row}"><el-tag size="small" :type="row.isActive !== false ? 'success' : 'info'" effect="light">{{ row.isActive !== false ? '是' : '否' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <span style="white-space:nowrap">
              <el-button link type="warning" size="small" v-if="canEditProcess" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" v-if="canDeleteProcess" @click="handleDelete(row.id)">删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工序' : '新建工序'" width="520px" append-to-body>
      <el-form :model="form" label-width="90px">
        <el-form-item label="工序名称" required><el-input v-model="form.processName" placeholder="如 装配 / 焊接 / 检测 / 系统" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="form.processCode" placeholder="业务编码(可选)" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="工序说明" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortNo" :min="0" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.isActive" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// __TSC_NOCHECK_DISABLED__ // @ts-nocheck
import { ref, reactive, computed, onMounted } from 'vue'
import { usePermissionStore } from '@/stores/permission'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { spcProcessApi } from '@/api/modules/spc/process'
import { spcParamApi } from '@/api/modules/spc/params'
const perm = usePermissionStore()
// 工序增删改按钮权限(后端 spc.process.create/delete 守卫; update 复用 create 码)
const canEditProcess = computed(() => perm.has('spc.process.create'))
const canDeleteProcess = computed(() => perm.has('spc.process.delete'))
import type { SpcProcess } from '@/api/types/spc'

const list = ref<SpcProcess[]>([])
const loading = ref(false)
const saving = ref(false)
const kw = ref('')
const paramCount = ref<Record<string, number>>({})
const filteredList = computed(() =>
  list.value.filter(p =>
    !kw.value || (p.processName || '').includes(kw.value) || (p.processCode || '').includes(kw.value)
  )
)

const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive<Partial<SpcProcess>>({ processName: '', processCode: '', description: '', sortNo: 0, isActive: true })

async function fetchData() {
  loading.value = true
  try { list.value = await spcProcessApi.list() } finally { loading.value = false }
}

async function loadParamCount() {
  try {
    const params = await spcParamApi.list()
    const map: Record<string, number> = {}
    for (const p of params) {
      if (p.processId) map[p.processId] = (map[p.processId] || 0) + 1
    }
    paramCount.value = map
  } catch { /* 不影响工序管理 */ }
}

function openCreate() {
  isEdit.value = false; editId.value = ''
  Object.assign(form, { processName: '', processCode: '', description: '', sortNo: 0, isActive: true })
  dialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true; editId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.processName) { ElMessage.warning('请填写工序名称'); return }
  saving.value = true
  try {
    if (isEdit.value) { await spcProcessApi.update(editId.value, form); ElMessage.success('已更新') }
    else { await spcProcessApi.create(form); ElMessage.success('已创建') }
    dialogVisible.value = false; await fetchData(); await loadParamCount()
  } finally { saving.value = false }
}

async function handleDelete(id: string) {
  const n = paramCount.value[id] || 0
  const tip = n > 0 ? `该工序下还有 ${n} 个参数，删除后这些参数将变为「未分类」。确认删除？` : '确认删除该工序？'
  await ElMessageBox.confirm(tip)
  await spcProcessApi.delete(id)
  ElMessage.success('已删除')
  await fetchData(); await loadParamCount()
}

onMounted(() => { fetchData(); loadParamCount() })
</script>

<style lang="scss" scoped>
.process-page { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.head-b .sub { color: $ink-faint; font-size: 13px; margin-top: 6px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
</style>
