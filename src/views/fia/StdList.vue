<template>
  <div class="std-list">
    <div class="head-b"><AppBreadcrumb /><h1>检验标准库</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:12px">
        <el-button type="primary" @click="openCreate()">+ 新建标准</el-button>
        <el-input v-model="keyword" clearable placeholder="搜索编码/物料/工序" style="width:260px" @keyup.enter="onSearch" @clear="onSearch">
          <template #append><el-button @click="onSearch">查询</el-button></template>
        </el-input>
      </div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%" :fit="true">
        <el-table-column prop="code" label="标准编码" width="180" />
        <el-table-column prop="material" label="物料" min-width="200" />
        <el-table-column prop="procName" label="工序" min-width="120" />
        <el-table-column prop="partNo" label="物料编码" width="140" />
        <el-table-column prop="aql" label="AQL" width="70" />
        <el-table-column prop="stdVersion" label="版本" width="60" />
        <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="(row as FiaInspStd).status==='生效'?'success':(row as FiaInspStd).status==='草稿'?'warning':'info'" size="small">{{ (row as FiaInspStd).status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <el-button link type="warning" size="small" @click="openEdit(row as FiaInspStd)">编辑</el-button>
            <template v-if="(row as FiaInspStd).status !== '草稿'">
              <el-button v-if="(row as FiaInspStd).status === '生效'" link type="info" size="small" @click="handleChangeStatus((row as FiaInspStd).id, '停用')">停用</el-button>
              <el-button v-else link type="success" size="small" @click="handleChangeStatus((row as FiaInspStd).id, '生效')">启用</el-button>
            </template>
            <el-button v-if="(row as FiaInspStd).status === '草稿'" link type="danger" size="small" @click="handleDelete((row as FiaInspStd).id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" :current-page="page" :page-size="size"
          @current-change="(pg: number) => { page = pg; fetch() }"
          @size-change="(sz: number) => { size = sz; page = 1; fetch() }" />
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑标准':'新建标准'" width="560px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="编码" required><el-input v-model="form.code" placeholder="如 STD-XXX" /></el-form-item>
        <el-form-item label="物料"><el-input v-model="form.material" placeholder="物料名称" /></el-form-item>
        <el-form-item label="物料编码"><el-input v-model="form.partNo" placeholder="物料编码" /></el-form-item>
        <el-form-item label="工序">
          <el-select v-model="form.procName" clearable filterable placeholder="选择工序(来自 SPC 工序字典)" style="width:100%" v-loading="procLoading"
            @change="(v: string) => { form.spcProcessId = (procOptions.find(o => (o.processName || o.processCode) === v)?.id || '') }">
            <el-option v-for="p in procOptions" :key="p.id" :label="p.processName || p.processCode" :value="p.processName || p.processCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="AQL">
          <el-select v-model="form.aql" clearable placeholder="选择 AQL" style="width:100%">
            <el-option v-for="a in ['0.65','1.0','1.5','2.5','4.0','6.5']" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验水平">
          <el-select v-model="form.inspectLevel" clearable placeholder="选择检验水平" style="width:100%">
            <el-option v-for="l in ['I','II','III','S-1','S-2','S-3','S-4']" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="抽样方案">
          <el-select v-model="form.samplePlan" clearable placeholder="选择抽样方案" style="width:100%">
            <el-option v-for="s in ['单次','二次','多次']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="CTQ 文本"><el-input v-model="form.ctqText" placeholder="关键质量特性描述" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status" style="width:100%"><el-option v-for="s in ['草稿','生效','停用']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { useAuthStore } from '@/stores/auth'
import { fiaStdApi } from '@/api/modules/fia/stds'
import { spcProcessApi } from '@/api/modules/spc/process'
import type { FiaInspStd } from '@/api/types/fia'
import type { SpcProcess } from '@/api/types/spc'

const auth = useAuthStore()
const list = ref<FiaInspStd[]>([])
const loading = ref(false), procLoading = ref(false)
// 工序下拉数据源改为权威的 spc_process 工序字典(与工序管理页同源),不再用标准库/参数文本去重
const procOptions = ref<SpcProcess[]>([])
const keyword = ref('')
const page = ref(1), size = ref(20), total = ref(0)
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive({ code: '', material: '', partNo: '', procName: '', spcProcessId: '', aql: '', inspectLevel: '', samplePlan: '', ctqText: '', status: '草稿' })

async function fetch() { loading.value = true; try { const r = await fiaStdApi.listPage({ keyword: keyword.value || undefined, page: page.value, size: size.value }); list.value = r.records; total.value = r.total } finally { loading.value = false } }
function onSearch() { page.value = 1; fetch() }
async function loadProcOptions() { procLoading.value = true; try { const rows = await spcProcessApi.list().catch(()=>[]); procOptions.value = (rows || []).filter(r => r && (r.processName || r.processCode)) } finally { procLoading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { code: '', material: '', partNo: '', procName: '', spcProcessId: '', aql: '', inspectLevel: '', samplePlan: '', ctqText: '', status: '草稿' }); dialogVisible.value = true }
function openEdit(r: FiaInspStd) { isEdit.value = true; editId.value = r.id; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await fiaStdApi.update(editId.value, form as any); ElMessage.success('已更新') }
  else { await fiaStdApi.create({ ...form, orgId: auth.user?.orgId } as any); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
async function handleChangeStatus(id: string, status: '生效' | '停用') {
  await ElMessageBox.confirm(`确认${status === '生效' ? '启用' : '停用'}该标准?`, '提示', { type: 'warning' })
  await fiaStdApi.changeStatus(id, status)
  ElMessage.success(status === '生效' ? '已启用' : '已停用')
  fetch()
}
async function handleDelete(id: string) {
  await ElMessageBox.confirm('确认删除? 仅草稿且未被 SPC 参数绑定的标准可删除', '提示', { type: 'warning' })
  await fiaStdApi.delete(id)
  ElMessage.success('已删除')
  fetch()
}
onMounted(() => { fetch(); loadProcOptions() })
</script>

<style lang="scss" scoped>
.std-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>