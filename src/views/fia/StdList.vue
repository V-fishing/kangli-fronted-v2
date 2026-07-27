<template>
  <div class="std-list">
    <div class="head-b"><div class="crumb">FIA / 首件检验</div><h1>检验标准库</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建标准</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%" :fit="true">
        <el-table-column prop="code" label="标准编码" width="180" />
        <el-table-column prop="material" label="物料" min-width="200" />
        <el-table-column prop="procName" label="工序" min-width="120" />
        <el-table-column prop="partNo" label="物料编码" width="140" />
        <el-table-column prop="aql" label="AQL" width="70" />
        <el-table-column prop="stdVersion" label="版本" width="60" />
        <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="(row as FiaInspStd).status==='生效'?'success':(row as FiaInspStd).status==='草稿'?'warning':'info'" size="small">{{ (row as FiaInspStd).status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button link type="warning" size="small" @click="openEdit(row as FiaInspStd)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete((row as FiaInspStd).id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑标准':'新建标准'" width="560px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="编码" required><el-input v-model="form.code" placeholder="如 STD-XXX" /></el-form-item>
        <el-form-item label="物料"><el-input v-model="form.material" placeholder="物料名称" /></el-form-item>
        <el-form-item label="物料编码"><el-input v-model="form.partNo" placeholder="物料编码" /></el-form-item>
        <el-form-item label="工序">
          <el-select v-model="form.procName" clearable filterable allow-create placeholder="选择或输入工序" style="width:100%" v-loading="procLoading">
            <el-option v-for="p in procOptions" :key="p" :label="p" :value="p" />
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
import { useAuthStore } from '@/stores/auth'
import { fiaStdApi } from '@/api/modules/fia/stds'
import { spcParamApi } from '@/api/modules/spc/params'
import type { FiaInspStd } from '@/api/types/fia'

const auth = useAuthStore()
const list = ref<FiaInspStd[]>([])
const loading = ref(false), procLoading = ref(false)
const procOptions = ref<string[]>([])
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive({ code: '', material: '', partNo: '', procName: '', aql: '', inspectLevel: '', samplePlan: '', ctqText: '', status: '草稿' })

async function fetch() { loading.value = true; try { list.value = await fiaStdApi.list() } finally { loading.value = false } }
async function loadProcOptions() { procLoading.value = true; try { const [stds, params] = await Promise.all([fiaStdApi.list().catch(()=>[]), spcParamApi.list().catch(()=>[])]); const s = new Set<string>(); stds.forEach(r=>{if(r.procName)s.add(r.procName)}); params.forEach(r=>{if(r.procName)s.add(r.procName)}); procOptions.value = [...s].sort() } finally { procLoading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { code: '', material: '', partNo: '', procName: '', aql: '', inspectLevel: '', samplePlan: '', ctqText: '', status: '草稿' }); dialogVisible.value = true }
function openEdit(r: FiaInspStd) { isEdit.value = true; editId.value = r.id; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await fiaStdApi.update(editId.value, form as any); ElMessage.success('已更新') }
  else { await fiaStdApi.create({ ...form, orgId: auth.user?.orgId } as any); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await fiaStdApi.delete(id); ElMessage.success('已删除'); fetch() }
onMounted(() => { fetch(); loadProcOptions() })
</script>

<style lang="scss" scoped>
.std-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>