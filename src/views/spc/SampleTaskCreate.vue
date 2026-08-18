<template>
  <div class="sample-task-create">
    <div class="head-b">
      <AppBreadcrumb />
      <h1>新建抽样任务</h1>
      <p class="sub">创建量产抽样任务：选择产品料号（自动带出产品信息）→ 选择工序 → 勾选 SPC 参数（同一工单号下可挂多个参数）。任务创建后进入 SPC 参数页「产品抽样 SPC」视图，按产品分组、每个参数一行可跳转采集子组。</p>
    </div>

    <el-card shadow="never" class="card-b">
      <el-form :model="form" label-width="100px" style="max-width: 680px; padding: 24px" @submit.prevent="submitCreate">
        <el-input v-model="form.orgId" type="hidden" />

        <el-form-item label="产品料号" required>
          <el-select v-model="form.partNo" filterable remote clearable :remote-method="remoteSearchProduct"
            :loading="productLoading" placeholder="输入物料编码模糊搜索" style="width: 100%"
            @change="onProductPick">
            <el-option v-for="p in productOptions" :key="p.partNo" :label="`${p.partNo} · ${p.productName}`" :value="p.partNo" />
          </el-select>
          <div class="hint" v-if="form.productName">已带出: {{ form.productName }}
            <span class="tag-b" v-if="form.category">{{ categoryLabel }}</span>
            <span class="tag-b" v-if="form.supplierName">供应商: {{ form.supplierName }}</span>
          </div>
        </el-form-item>

        <el-form-item label="产品名称">
          <el-input v-model="form.productName" placeholder="自动带出, 可修改" />
        </el-form-item>

        <el-form-item label="品类">
          <el-radio-group v-model="form.category" @change="onCategoryChange">
            <el-radio value="material">物料</el-radio>
            <el-radio value="semi">半成品</el-radio>
            <el-radio value="product">成品</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="工序" required>
          <el-select v-model="form.procName" clearable filterable allow-create placeholder="选择工序(来自 SPC 工序字典)" style="width: 100%" v-loading="procLoading" @change="onProcChange">
            <el-option v-for="p in procOptions" :key="p.id" :label="p.processName" :value="p.processName || p.processCode || ''" />
          </el-select>
          <div class="hint" v-if="form.partNo && !form.procName">请先选择工序, 自动匹配 FIA 检验标准并带出可采集参数</div>
        </el-form-item>

        <!-- SPC 参数:选工序后列出该程序下可制图参数,由用户自由勾选(同一工单号下可挂多个参数) -->
        <el-form-item label="SPC 参数" required>
          <div class="spc-box" v-loading="spcLoading">
            <div v-if="spcParams.length === 0" class="hint">输入产品料号 + 工序后, 自动匹配 FIA 检验标准并列出可采集参数(可全选/不选)</div>
            <template v-else>
              <div class="spc-toolbar">
                <el-checkbox :model-value="allChecked" @change="toggleAll" :indeterminate="indeterminate">全选</el-checkbox>
                <span class="hint">已选 {{ selParamIds.length }} / {{ spcParams.length }}</span>
                <span class="hint std" v-if="matchedStdCode">匹配标准: {{ matchedStdCode }}</span>
              </div>
              <el-checkbox-group v-model="selParamIds">
                <el-checkbox v-for="p in spcParams" :key="p.id || p.fiaStdItemId" :value="p.id || p.fiaStdItemId" border class="spc-item">
                  <span class="spc-proc" v-if="procNameOf(p)">{{ procNameOf(p) }}</span><span class="spc-dot" v-if="procNameOf(p)">·</span>
                  <span class="spc-name">{{ p.paramName }}</span>
                  <span class="spc-meta" v-if="p.unit"> / {{ p.unit }}</span>
                  <span class="spc-badge" :class="p.chartable ? 'ok' : 'no'">{{ p.chartable ? '可制图' : '不可制图' }}</span>
                </el-checkbox>
              </el-checkbox-group>
            </template>
          </div>
        </el-form-item>

        <el-form-item label="供应商">
          <el-select v-model="form.supplierId" clearable filterable remote :remote-method="searchSuppliers"
            :loading="supLoading" placeholder="输入名称/编码搜索供应商" style="width: 100%" :disabled="isFactorySelf"
            @visible-change="onSupVisible" @change="onSupplierChange">
            <el-option v-for="s in suppliers" :key="s.id" :label="`${s.name} (${s.supplierCode || s.supplierNo || '-'})`" :value="s.id" />
          </el-select>
          <div class="hint" v-if="isFactorySelf">半成品/成品为工厂自产, 供应商不可编辑</div>
        </el-form-item>

        <el-form-item label="工单号">
          <el-input :model-value="form.woNo" disabled style="width: 280px" />
          <span class="hint">系统自动生成，本批参数共享同一工单号</span>
        </el-form-item>

        <el-form-item label="加急">
          <el-switch v-model="form.isUrgent" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="submitting" v-if="canCreateSampleTask">创建任务</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 创建成功:列出本次创建的多参数任务 -->
    <el-card v-if="createdTasks.length" shadow="never" class="card-b rise">
      <div class="block-title">已创建抽样任务（{{ createdTasks.length }} 个参数）</div>
      <div class="created-list">
        <div v-for="t in createdTasks" :key="t.id" class="created-row">
          <span class="mono wo">{{ t.woNo }}</span>
          <span class="mono param">{{ paramNameOf(t.paramId) }}</span>
          <span class="pill p-run"><span class="d"></span>{{ t.status }}</span>
        </div>
      </div>
      <div class="std-actions">
        <el-button type="primary" size="small" @click="goParams">去 SPC 参数页查看任务</el-button>
        <el-button size="small" @click="resetForm">再建一个</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { spcSampleTaskApi } from '@/api/modules/spc/sampleTasks'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcProcessApi } from '@/api/modules/spc/process'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
const perm = usePermissionStore()
// 抽样任务创建权限(后端 spc.sample-task.create 守卫)
const canCreateSampleTask = computed(() => perm.has('spc.sample-task.create'))
import type { SpcParam, SpcSampleTask, SpcProcess } from '@/api/types/spc'
import type { SqmSupplier } from '@/api/types/sqm'

// 本地产品搜索结果结构(避免依赖 fia 类型缺失导出)
interface ProductSearchResult {
  partNo?: string
  productName?: string
  category?: string
  matchedSupplierId?: string
  matchedSupplierName?: string
}

const router = useRouter()
const auth = useAuthStore()
const submitting = ref(false)

// 下拉选项
const procOptions = ref<SpcProcess[]>([])
const procLoading = ref(false)
const suppliers = ref<SqmSupplier[]>([])
const supLoading = ref(false)
const productOptions = ref<ProductSearchResult[]>([])
const productLoading = ref(false)

// SPC 参数勾选
const spcParams = ref<SpcParam[]>([])
const spcLoading = ref(false)
const selParamIds = ref<string[]>([])
const matchedStdCode = ref('')
const allChecked = computed(() => spcParams.value.length > 0 && selParamIds.value.length === spcParams.value.length)
const indeterminate = computed(() => selParamIds.value.length > 0 && selParamIds.value.length < spcParams.value.length)
function toggleAll(val: string | number | boolean) {
  selParamIds.value = val ? spcParams.value.map(p => p.id) : []
}
// 参数显示工序前缀(与首件新建任务一致)
function procNameOf(p: SpcParam) { return p.processName || p.procName || '' }

const form = reactive({
  orgId: auth.user?.orgId || '',
  productName: '',
  procName: '',
  partNo: '',
  category: '',
  supplierId: '',
  supplierName: '',
  woNo: '',
  isUrgent: false,
  remark: '',
})
const categoryLabel = computed(() => ({ material: '物料', semi: '半成品', product: '成品' }[form.category] || '-'))
const isFactorySelf = computed(() => form.category === 'semi' || form.category === 'product')

// admin 等虚拟 orgId(非 UUID, 如 "ROOT")传给按 org_id 过滤的接口会 500, 回退到真实组织根
const realOrgId = ref('')
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
async function loadRealOrg() {
  try {
    const { orgApi } = await import('@/api/modules/uop/orgs')
    const tree = await orgApi.tree()
    const first = tree && tree[0]
    const id = first?.org?.id || first?.id
    if (id) realOrgId.value = id
  } catch { /* */ }
}
async function ensureRealOrg() {
  if (realOrgId.value) return
  await loadRealOrg()
}
async function effectiveOrgId() {
  const o = form.orgId || auth.user?.orgId || ''
  if (o && UUID_RE.test(o)) return o
  await ensureRealOrg()
  return realOrgId.value || o
}

function genWoNo(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `WO-${ymd}-${seq}`
}

const createdTasks = ref<SpcSampleTask[]>([])
const paramNameMap = ref<Map<string, string>>(new Map())
function paramNameOf(id?: string) {
  return (id && paramNameMap.value.get(id)) || id || '—'
}

async function submitCreate() {
  form.orgId = await effectiveOrgId()
  if (!form.orgId) { ElMessage.warning('请选择所属公司'); return }
  if (!form.partNo) { ElMessage.warning('请选择产品料号'); return }
  if (!form.productName) { ElMessage.warning('请填写产品名称'); return }
  if (!form.category) { ElMessage.warning('请选择品类(物料/半成品/成品)'); return }
  if (!form.procName) { ElMessage.warning('请填写工序'); return }
  if (selParamIds.value.length === 0) { ElMessage.warning('请至少勾选一个 SPC 参数'); return }
  if (form.category === 'material' && !form.supplierId) { ElMessage.warning('物料类必须选择供应商'); return }
  submitting.value = true
  try {
    // selParamIds 中的值 = 真实 spc_param.id 或 候选项 fiaStdItemId;按对象是否有真实 id 拆分
    const paramIds: string[] = []
    const fiaStdItemIds: string[] = []
    for (const key of selParamIds.value) {
      const hit = spcParams.value.find(p => (p.id || p.fiaStdItemId) === key)
      if (hit && hit.id && hit.id.trim()) paramIds.push(hit.id)
      else if (hit && hit.fiaStdItemId) fiaStdItemIds.push(hit.fiaStdItemId)
    }
    const body = {
      orgId: form.orgId,
      woNo: form.woNo,
      partNo: form.partNo.trim(),
      procName: form.procName.trim(),
      productName: form.productName.trim(),
      targetCount: 0, // 0 = 不限,可一直录
      paramIds: paramIds.length ? paramIds : undefined,
      fiaStdItemIds: fiaStdItemIds.length ? fiaStdItemIds : undefined,
      category: form.category || undefined,
      supplierId: form.supplierId || undefined,
      supplierName: form.supplierName || undefined,
      isUrgent: form.isUrgent,
      remark: form.remark || undefined,
    }
    const tasks = await spcSampleTaskApi.create(body)
    createdTasks.value = tasks || []
    for (const t of createdTasks.value) {
      if (t.paramId) paramNameMap.value.set(t.paramId, paramNameOf(t.paramId))
    }
    // 回填参数名(用 spcParams 已知名)
    for (const p of spcParams.value) {
      if (selParamIds.value.includes(p.id)) paramNameMap.value.set(p.id, p.paramName || p.id)
    }
    ElMessage.success(`已创建 ${createdTasks.value.length} 个抽样任务（工单 ${form.woNo}）`)
    // 创建成功后直接进入抽样任务参数界面(按产品分组的 sample 视图)
    router.push({ path: '/spc/params', query: { view: 'sample' } })
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

// 工序选项: 来源 SPC 参数管理模块的「工序字典」(ops.spc_process)
async function loadProcOptions() {
  procLoading.value = true
  try {
    const list = await spcProcessApi.list().catch(() => [])
    procOptions.value = (list || []).filter(p => p.isActive !== false)
  } finally { procLoading.value = false }
}

// 产品料号模糊搜索(远程)
async function remoteSearchProduct(kw: string) {
  const k = (kw || '').trim()
  if (!k) { productOptions.value = []; return }
  productLoading.value = true
  try {
    const orgId = await effectiveOrgId()
    productOptions.value = await fiaTaskApi.searchProduct({ orgId, keyword: k }).catch(() => [])
  } finally { productLoading.value = false }
}

// 选中产品料号: 自动带出 产品名/品类/供应商
async function onProductPick(partNo: string) {
  const hit = (productOptions.value || []).find(p => p.partNo === partNo)
  spcParams.value = []
  selParamIds.value = []
  matchedStdCode.value = ''
  if (!hit) return
  form.productName = hit.productName || ''
  if (hit.category) form.category = hit.category
  if (hit.matchedSupplierId && !form.supplierId) {
    form.supplierId = hit.matchedSupplierId
    form.supplierName = hit.matchedSupplierName || ''
    ensureOption(suppliers.value, { id: hit.matchedSupplierId, name: hit.matchedSupplierName || '', supplierCode: '', supplierNo: '' }, hit.matchedSupplierId)
  }
  // 已选工序则直接按 料号+工序 匹配标准带出参数
  if (form.procName) await loadSpcParams()
}

// 工序变化: 重新按 料号+工序 匹配标准带出参数
async function onProcChange() {
  spcParams.value = []
  selParamIds.value = []
  matchedStdCode.value = ''
  await loadSpcParams()
}

// 品类切换: 半成品/成品 锁定工厂自产
async function onCategoryChange() {
  if (isFactorySelf.value) {
    form.supplierId = ''
    form.supplierName = ''
  }
  spcParams.value = []
  selParamIds.value = []
  matchedStdCode.value = ''
  await loadSpcParams()
}

// 加载 SPC 参数列表: 输入 产品料号 + 工序 → 匹配 FIA 检验标准 → 带出该标准下的检验项作为可采集参数
async function loadSpcParams() {
  const partNo = (form.partNo || '').trim()
  const procName = (form.procName || '').trim()
  spcParams.value = []
  selParamIds.value = []
  matchedStdCode.value = ''
  // 必须同时具备 产品料号 + 工序, 才能去 FIA 标准库匹配
  if (!partNo || !procName) return
  spcLoading.value = true
  try {
    const orgId = await effectiveOrgId()
    // 1) 按 料号+工序 匹配 FIA 检验标准
    const std = await fiaTaskApi.matchStd({ orgId, partNo, supplierId: form.supplierId || undefined, procName }).catch(() => null)
    if (std && std.id) {
      matchedStdCode.value = `${std.code || ''} · ${std.procName || ''}`.trim()
      // 2) 带出该标准下的检验项参数(FIA 标准库派生)
      spcParams.value = await spcParamApi.listByStd(std.id).catch(() => [])
    }
    // 无匹配标准(如 FIA 标准库仅含「检测」工序, 选其他工序时)则参数列表保持为空, 不回退 spc_param
  } finally { spcLoading.value = false }
}

async function loadSuppliers() {
  supLoading.value = true
  try { const r = await sqmSupplierApi.page({ page: 1, size: 20 }); suppliers.value = r.records || [] }
  finally { supLoading.value = false }
}
function ensureOption(list: SqmSupplier[], item: SqmSupplier, id: string) {
  if (!item) return
  if (!list.some(x => x.id === id)) list.push(item)
}
async function searchSuppliers(kw: string) {
  if (!kw) return
  supLoading.value = true
  try { const r = await sqmSupplierApi.page({ keyword: kw, page: 1, size: 20 }); suppliers.value = r.records || [] }
  finally { supLoading.value = false }
}
function onSupplierChange() {
  const hit = suppliers.value.find(s => s.id === form.supplierId)
  form.supplierName = hit?.name || ''
}
async function onSupVisible(open: boolean) { if (open && suppliers.value.length === 0) await loadSuppliers() }

function goParams() {
  router.push({ path: '/spc/params', query: { view: 'sample' } })
}
function resetForm() {
  createdTasks.value = []
  selParamIds.value = []
  spcParams.value = []
  Object.assign(form, {
    productName: '', procName: '', partNo: '',
    category: '', supplierId: '', supplierName: '', isUrgent: false, remark: '',
    woNo: genWoNo(),
  })
}

onMounted(() => {
  form.woNo = genWoNo()
  loadProcOptions()
  loadSuppliers()
  loadRealOrg()
})
</script>

<style lang="scss" scoped>
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.head-b .sub { font-size: 13px; color: $ink-soft; margin-top: 8px; line-height: 1.6; max-width: 760px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; margin-bottom: 16px; }
.block-title { font-family: $font-display; font-size: 15px; font-weight: 700; margin-bottom: 14px; color: $ink; }
.hint { font-size: 12px; color: $cobalt; margin-top: 4px; }
.hint.std { margin-left: auto; color: $ink-soft; }
.tag-b { display: inline-block; margin-left: 6px; padding: 0 8px; border: 1px solid $hairline; border-radius: 4px; font-size: 12px; color: $ink; background: $paper; }
.spc-box { width: 100%; border: 1px solid $hairline; border-radius: 8px; padding: 12px; background: $paper; }
.spc-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.spc-item { margin-right: 8px; margin-bottom: 8px; align-items: baseline; }
.spc-name { font-weight: 600; }
.spc-proc { color: $cobalt; font-family: $font-mono; font-size: 12px; }
.spc-dot { color: $ink-faint; margin: 0 4px; }
.spc-meta { color: $ink-soft; }
.spc-badge { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 4px; font-size: 12px; line-height: 17px; }
.spc-badge.ok { background: $cobalt-dim; color: $cobalt; }
.spc-badge.no { background: $white; color: $ink-faint; border: 1px solid $hairline; }
.created-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.created-row { display: flex; align-items: center; gap: 14px; padding: 8px 12px; background: $paper; border-radius: 8px; font-size: 13px; }
.created-row .wo { font-family: $font-mono; color: $ink; }
.created-row .param { font-family: $font-mono; color: $ink-soft; }
.std-actions { display: flex; gap: 8px; }
.rise { animation: rise 0.32s ease; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
