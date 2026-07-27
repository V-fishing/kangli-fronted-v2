<template>
  <div class="param-list">
    <div class="head-b"><div class="crumb">SPC / 过程控制</div><h1>SPC 参数</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="参数名"><el-input v-model="filterParamName" clearable placeholder="搜索" style="width:180px" /></el-form-item>
        <el-form-item label="工序"><el-select v-model="filterProcName" clearable placeholder="全部" style="width:180px"><el-option v-for="p in procOptions" :key="p" :label="p" :value="p" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetchData">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px">
        <el-button type="primary" @click="openCreate()">+ 新建参数</el-button>
      </div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="paramName" label="参数名" />
        <el-table-column prop="procName" label="工序" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="规格下限" width="100"><template #default="{row}"><span class="mono">{{ row.specLower }}</span></template></el-table-column>
        <el-table-column label="规格上限" width="100"><template #default="{row}"><span class="mono">{{ row.specUpper }}</span></template></el-table-column>
        <el-table-column prop="subgroupSize" label="子组大小" width="90" />
        <el-table-column prop="isActive" label="激活" width="80"><template #default="{row}"><el-tag :type="row.isActive?'success':'info'" size="small">{{ row.isActive ? '是' : '否' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <span style="white-space:nowrap">
              <el-button link type="primary" size="small" @click="router.push(`/spc/params/${(row as SpcParam).id}`)">控制图</el-button>
              <el-button link type="warning" size="small" @click="openEdit(row as SpcParam)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete((row as SpcParam).id)">删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑参数' : '新建参数'" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="参数名" required><el-input v-model="form.paramName" /></el-form-item>
        <el-form-item label="工序"><el-input v-model="form.procName" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item>
        <el-form-item label="规格下限"><el-input-number v-model="form.specLower" :step="0.01" /></el-form-item>
        <el-form-item label="规格上限"><el-input-number v-model="form.specUpper" :step="0.01" /></el-form-item>
        <el-form-item label="目标值"><el-input-number v-model="form.targetValue" :step="0.01" /></el-form-item>
        <el-form-item label="子组大小"><el-input-number v-model="form.subgroupSize" :min="2" :max="10" /></el-form-item>
        <el-form-item label="采集频率"><el-input v-model="form.collectFreq" /></el-form-item>
        <el-form-item label="控制图类型">
          <el-select v-model="form.chartType" style="width:100%">
            <el-option v-for="c in chartTypes" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">能力计算配置</el-divider>
        <el-form-item label="σ 算法">
          <el-select v-model="form.sigmaMethod" style="width:100%">
            <el-option label="组内 (within)" value="within" />
            <el-option label="整体 (overall)" value="overall" />
          </el-select>
        </el-form-item>
        <el-form-item label="σ 倍数 k">
          <el-input-number v-model="form.sigmaK" :min="1" :max="5" :step="0.1" />
          <span class="hint">控制限/能力指数 σ 倍数(默认 3)</span>
        </el-form-item>
        <el-form-item label="CPK 周期">
          <el-select v-model="form.cpkPeriod" clearable style="width:100%">
            <el-option label="不自动" value="" />
            <el-option label="批次" value="批次" />
            <el-option label="日" value="日" />
            <el-option label="周" value="周" />
          </el-select>
        </el-form-item>
        <el-form-item label="激活"><el-switch v-model="form.isActive" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck -- el-select v-model 与 Element Plus EpPropMergeType 严格类型不兼容,运行时正常
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import type { SpcParam } from '@/api/types/spc'

const chartTypes = [
  { label: 'Xbar-R (均值-极差)', value: 'Xbar-R' },
  { label: 'Xbar-S (均值-标准差)', value: 'Xbar-S' },
  { label: 'I-MR (单值-移动极差)', value: 'I-MR' },
  { label: 'P 图 (不合格品率)', value: 'P' },
]
const router = useRouter()
const list = ref<SpcParam[]>([])
const loading = ref(false)
const filterParamName = ref('')
const filterProcName = ref<any>('')
const procOptions = computed(() => [...new Set(list.value.map(p => p.procName).filter(Boolean))].sort())
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const form = reactive<Partial<SpcParam>>({ paramName: '', subgroupSize: 5, isActive: true })

async function fetchData() { loading.value = true; try { const all = await spcParamApi.list(); list.value = all.filter(r => (!filterParamName.value || r.paramName?.includes(filterParamName.value)) && (!filterProcName.value || r.procName?.includes(filterProcName.value))) } finally { loading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { paramName: '', procName: '', unit: '', specLower: undefined, specUpper: undefined, targetValue: undefined, subgroupSize: 5, collectFreq: '', chartType: 'Xbar-R', isActive: true, sigmaMethod: 'within', sigmaK: 3, cpkPeriod: '' }); dialogVisible.value = true }
function openEdit(row: SpcParam) { isEdit.value = true; editId.value = row.id; Object.assign(form, row); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await spcParamApi.update(editId.value, form); ElMessage.success('已更新') }
  else { await spcParamApi.create(form); ElMessage.success('已创建') }
  dialogVisible.value = false; fetchData()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await spcParamApi.delete(id); ElMessage.success('已删除'); fetchData() }
onMounted(() => fetchData())
</script>
