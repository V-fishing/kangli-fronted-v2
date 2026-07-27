<template>
  <div class="task-create">
    <div class="head-b">
      <div>
        <div class="crumb">FIRST ARTICLE INSPECTION / 首件检验</div>
        <h1>新建检验任务</h1>
      </div>
    </div>

    <div class="card-b">
      <el-form :model="form" label-width="100px" style="max-width: 600px; padding: 24px" @submit.prevent="submitCreate">
        <el-input v-model="form.orgId" type="hidden" />

        <el-form-item label="触发类型">
          <el-select v-model="form.triggerType" clearable placeholder="选择触发事件类型" style="width: 100%" v-loading="triggerLoading">
            <el-option v-for="t in triggers" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品" required>
          <el-input v-model="form.productName" placeholder="如 外壳A型" />
        </el-form-item>
        <el-form-item label="工序">
          <el-select v-model="form.procName" clearable filterable allow-create placeholder="选择或输入工序" style="width: 100%" v-loading="procLoading">
            <el-option v-for="p in procOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="产线">
          <el-select v-model="form.lineName" clearable placeholder="选择产线" style="width: 100%" v-loading="lineLoading">
            <el-option v-for="l in lineOptions" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单号">
          <el-input v-model="form.woNo" placeholder="如 WO-240726-001" />
        </el-form-item>
        <el-form-item label="检验标准">
          <el-select v-model="form.stdId" clearable placeholder="可选,自动匹配标准" style="width: 100%" v-loading="stdLoading" filterable>
            <el-option v-for="s in stds" :key="s.id" :label="`${s.code} · ${s.material || '-'} · ${s.procName || '-'} v${s.stdVersion}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="form.supplierId" clearable placeholder="选择供应商" style="width: 100%" v-loading="supLoading" filterable>
            <el-option v-for="s in suppliers" :key="s.id" :label="`${s.name} (${s.supplierCode || s.supplierNo || '-'})`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="form.partNo" placeholder="可选,匹配标准用" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="form.batchNo" />
        </el-form-item>
        <el-form-item label="加急">
          <el-switch v-model="form.isUrgent" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="submitting">创建任务</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { fiaTriggerApi } from '@/api/modules/fia/triggers'
import { fiaStdApi } from '@/api/modules/fia/stds'
import { spcParamApi } from '@/api/modules/spc/params'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { orgApi } from '@/api/modules/uop/orgs'
import type { FiaTriggerType, FiaInspStd } from '@/api/types/fia'
import type { SqmSupplier } from '@/api/types/sqm'
import type { OrgTreeNode } from '@/api/types/uop'

const router = useRouter()
const auth = useAuthStore()
const submitting = ref(false)

// 下拉选项
const triggers = ref<FiaTriggerType[]>([])
const triggerLoading = ref(false)
const stds = ref<FiaInspStd[]>([])
const stdLoading = ref(false)
const procOptions = ref<string[]>([])
const procLoading = ref(false)
const lineOptions = ref<string[]>([])
const lineLoading = ref(false)
const suppliers = ref<SqmSupplier[]>([])
const supLoading = ref(false)

const form = reactive({
  orgId: auth.user?.orgId || '',
  woNo: '',
  productName: '',
  procName: '',
  lineName: '',
  triggerType: '',
  stdId: '',
  partNo: '',
  supplierId: '',
  lotId: '',
  batchNo: '',
  isUrgent: false,
  remark: '',
})

async function submitCreate() {
  if (!form.orgId) { ElMessage.warning('请选择所属公司'); return }
  if (!form.woNo) { ElMessage.warning('请填写工单号'); return }
  if (!form.lineName) { ElMessage.warning('请填写产线'); return }
  if (!form.productName) { ElMessage.warning('请填写产品名称'); return }
  if (!form.procName) { ElMessage.warning('请填写工序'); return }
  if (!form.triggerType) { ElMessage.warning('请选择触发类型'); return }
  submitting.value = true
  try {
    const task = await fiaTaskApi.create(form)
    ElMessage.success('已创建: ' + task.code)
    router.push(`/fia/tasks/${task.id}`)
  } catch { /* */ }
  finally { submitting.value = false }
}

// 加载工序选项:从 FIA 标准 + SPC 参数提取 procName 去重
async function loadProcOptions() {
  procLoading.value = true
  try {
    const [stds, params] = await Promise.all([fiaStdApi.list().catch(() => []), spcParamApi.list().catch(() => [])])
    const names = new Set<string>()
    stds.forEach(s => { if (s.procName) names.add(s.procName) })
    params.forEach(p => { if (p.procName) names.add(p.procName) })
    procOptions.value = [...names].sort()
  } finally { procLoading.value = false }
}

// 加载产线选项:从组织树筛选 orgType='产线'
async function loadLineOptions() {
  lineLoading.value = true
  try {
    const tree = await orgApi.tree()
    const names = new Set<string>()
    function walk(nodes: OrgTreeNode[]) {
      for (const n of nodes) {
        if (n.orgType === '产线' || n.orgType === '工位') names.add(n.orgName)
        if (n.children) walk(n.children)
      }
    }
    walk(tree)
    lineOptions.value = [...names].sort()
  } finally { lineLoading.value = false }
}

async function loadTriggers() { triggerLoading.value = true; try { triggers.value = await fiaTriggerApi.list() } finally { triggerLoading.value = false } }
async function loadStds() { stdLoading.value = true; try { stds.value = await fiaStdApi.list() } finally { stdLoading.value = false } }
async function loadSuppliers() { supLoading.value = true; try { suppliers.value = await sqmSupplierApi.list() } finally { supLoading.value = false } }

onMounted(() => {
  loadTriggers()
  loadStds()
  loadProcOptions()
  loadLineOptions()
  loadSuppliers()
  if (!form.orgId && auth.user?.orgId) form.orgId = auth.user.orgId
})
</script>
