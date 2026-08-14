<template>
  <div class="task-create">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>新建检验任务</h1>
      </div>
    </div>

    <div class="card-b">
      <el-form :model="form" label-width="100px" style="max-width: 680px; padding: 24px" @submit.prevent="submitCreate">
        <el-input v-model="form.orgId" type="hidden" />

        <el-form-item label="触发类型" required>
          <el-select v-model="form.triggerType" clearable placeholder="选择触发事件类型" style="width: 100%" v-loading="triggerLoading">
            <el-option v-for="t in triggers" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>

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
            <el-radio value="material">物料首件</el-radio>
            <el-radio value="semi">半成品首件</el-radio>
            <el-radio value="product">成品首件</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="工序">
          <el-select v-model="form.procName" clearable filterable allow-create placeholder="选择工序(来自 SPC 工序字典)" style="width: 100%" v-loading="procLoading" @change="onProcChange">
            <el-option v-for="p in procOptions" :key="p.id" :label="p.processName" :value="p.processName || p.processCode || ''" />
          </el-select>
          <div class="hint" v-if="form.partNo && !form.procName">请先选择工序,再自动匹配检验标准</div>
        </el-form-item>

        <el-form-item label="检验标准">
          <el-select v-model="form.stdId" clearable filterable remote :remote-method="searchStds"
            :loading="stdLoading" placeholder="输入编码/物料/工序搜索标准" style="width: 100%"
            @visible-change="onStdVisible" @change="onStdChange">
            <el-option v-for="s in stds" :key="s.id" :label="`${s.code} · ${s.material || '-'} · ${s.procName || '-'} v${s.stdVersion}`" :value="s.id" />
          </el-select>
          <div class="hint" v-if="autoStd">已自动匹配标准: {{ autoStd }}</div>
        </el-form-item>

        <el-form-item label="供应商">
          <el-select v-model="form.supplierId" clearable filterable remote :remote-method="searchSuppliers"
            :loading="supLoading" placeholder="输入名称/编码搜索供应商" style="width: 100%" :disabled="isFactorySelf"
            @visible-change="onSupVisible">
            <el-option v-for="s in suppliers" :key="s.id" :label="`${s.name} (${s.supplierCode || s.supplierNo || '-'})`" :value="s.id" />
          </el-select>
          <div class="hint" v-if="isFactorySelf">成品/半成品首件为工厂自产, 供应商不可编辑</div>
        </el-form-item>

        <el-form-item label="批次号" required>
          <el-input v-model="form.batchNo" placeholder="人工填写批次号" />
        </el-form-item>

        <!-- SPC 采集参数:匹配标准后列出, 由用户自由选择勾选 -->
        <el-form-item label="SPC 参数">
          <div class="spc-box" v-loading="spcLoading">
            <div v-if="spcParams.length === 0" class="hint">选择产品/工序并匹配标准后, 此处列出可采集的 SPC 参数(可全选/不选)</div>
            <template v-else>
              <div class="spc-toolbar">
                <el-checkbox :model-value="allChecked" @change="toggleAll" :indeterminate="indeterminate">全选</el-checkbox>
                <span class="hint">已选 {{ selStdItemIds.length }} / {{ spcParams.length }}</span>
              </div>
              <el-checkbox-group v-model="selStdItemIds">
                <el-checkbox v-for="p in spcParams" :key="p.fiaStdItemId || p.id" :value="p.fiaStdItemId" :disabled="!p.fiaStdItemId" border class="spc-item">
                  <span class="spc-name">
                    <span class="spc-proc">{{ procNameOf(p) }}</span><span class="spc-dot">·</span>{{ p.paramName }}
                  </span>
                  <span class="spc-meta" v-if="p.unit"> / {{ p.unit }}</span>
                  <span class="spc-badge" :class="p.chartable ? 'ok' : 'no'">{{ p.chartable ? '可制图' : '不可制图' }}</span>
                  <span class="spc-meta" v-if="!p.fiaStdItemId"> · 未关联标准项</span>
                </el-checkbox>
              </el-checkbox-group>
            </template>
          </div>
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
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { fiaTriggerApi } from '@/api/modules/fia/triggers'
import { fiaStdApi } from '@/api/modules/fia/stds'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcProcessApi } from '@/api/modules/spc/process'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { orgApi } from '@/api/modules/uop/orgs'
import type { FiaTriggerType, FiaInspStd, ProductSearchResult } from '@/api/types/fia'
import type { SqmSupplier } from '@/api/types/sqm'
import type { OrgTreeNode } from '@/api/types/uop'
import type { SpcParam, SpcProcess } from '@/api/types/spc'

const router = useRouter()
const auth = useAuthStore()
const submitting = ref(false)

// 下拉选项
const triggers = ref<FiaTriggerType[]>([])
const triggerLoading = ref(false)
const stds = ref<FiaInspStd[]>([])
const stdLoading = ref(false)
const procOptions = ref<SpcProcess[]>([])
const procLoading = ref(false)
const suppliers = ref<SqmSupplier[]>([])
const supLoading = ref(false)
const productOptions = ref<ProductSearchResult[]>([])
const productLoading = ref(false)

// SPC 参数勾选:仅接受已关联 FIA 标准项(fiaStdItemId)的参数,确保提交后精确生成对应检验项
const spcParams = ref<SpcParam[]>([])
const spcLoading = ref(false)
const selStdItemIds = ref<string[]>([])
// 仅已关联标准项的参数可参与全选/勾选
const linkedParams = computed(() => spcParams.value.filter(p => p.fiaStdItemId))
const allChecked = computed(() => linkedParams.value.length > 0 && selStdItemIds.value.length === linkedParams.value.length)
const indeterminate = computed(() => selStdItemIds.value.length > 0 && selStdItemIds.value.length < linkedParams.value.length)
function toggleAll(val: string | number | boolean) {
  selStdItemIds.value = val ? linkedParams.value.map(p => p.fiaStdItemId!) : []
}
// 工序展示:优先用工序名(避免直接暴露工序代码),兜底工序代码
function procNameOf(p: SpcParam) { return p.processName || p.procName || '—' }

const form = reactive({
  orgId: auth.user?.orgId || '',
  productName: '',
  procName: '',
  triggerType: '',
  stdId: '',
  partNo: '',
  category: '',
  supplierId: '',
  supplierName: '',
  lotId: '',
  batchNo: '',
  isUrgent: false,
  remark: '',
})
const autoStd = ref('')
const categoryLabel = computed(() => ({ material: '物料', semi: '半成品', product: '成品' }[form.category] || '-'))
// 成品/半成品视为工厂自产, 供应商锁定不可编辑
const isFactorySelf = computed(() => form.category === 'semi' || form.category === 'product')

// admin 等虚拟 orgId(非 UUID, 如 "ROOT")传给按 org_id 过滤的接口会 500, 回退到真实组织根
const realOrgId = ref('')
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
async function loadRealOrg() {
  try {
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

async function submitCreate() {
  form.orgId = await effectiveOrgId()
  if (!form.orgId) { ElMessage.warning('请选择所属公司'); return }
  if (!form.triggerType) { ElMessage.warning('请选择触发类型'); return }
  if (!form.partNo) { ElMessage.warning('请选择产品料号'); return }
  if (!form.productName) { ElMessage.warning('请填写产品名称'); return }
  if (!form.category) { ElMessage.warning('请选择品类(物料/半成品/成品)'); return }
  if (!form.procName) { ElMessage.warning('请填写工序'); return }
  if (!form.batchNo) { ElMessage.warning('请填写批次号'); return }
  if (form.category === 'material' && !form.supplierId) { ElMessage.warning('物料类首件必须选择供应商'); return }
  submitting.value = true
  try {
    // SPC 参数勾选收集 fiaStdItemId(仅已关联标准项的参数可勾选),提交后后端精确生成对应检验项;
    // 未勾选任何项时 stdItemIds 为空,后端回退按标准全量生成检验项。
    const effective = selStdItemIds.value.filter(id => !!id)
    const body = { ...form, woNo: '', lineName: '', stdItemIds: effective }
    const task = await fiaTaskApi.create(body)
    ElMessage.success('已创建: ' + task.code)
    router.push(`/fia/tasks/${task.id}`)
  } catch { /* */ }
  finally { submitting.value = false }
}

// 工序选项: 来源改为 SPC 参数管理模块的「工序字典」(ops.spc_process),显示工序名 processName
async function loadProcOptions() {
  procLoading.value = true
  try {
    const list = await spcProcessApi.list().catch(() => [])
    // 按 sort_no 升序,名称兜底(兼容未维护字典时留空)
    procOptions.value = (list || [])
      .filter(p => p.isActive !== false)
      .sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0))
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

// 选中产品料号: 自动带出 产品名/品类/供应商; 仅当选定了工序才匹配标准(SPC 参数随后联动)
async function onProductPick(partNo: string) {
  const hit = (productOptions.value || []).find(p => p.partNo === partNo)
  spcParams.value = []
  selStdItemIds.value = []
  autoStd.value = ''
  form.stdId = ''
  if (!hit) return
  form.productName = hit.productName || ''
  if (hit.category) form.category = hit.category
  if (hit.matchedSupplierId && !form.supplierId) {
    form.supplierId = hit.matchedSupplierId
    form.supplierName = hit.matchedSupplierName || ''
    ensureOption(suppliers.value, { id: hit.matchedSupplierId, name: hit.matchedSupplierName || '', supplierCode: '', supplierNo: '' }, hit.matchedSupplierId)
  }
  // 工序已定时按「料号+工序」匹配;否则等待用户选工序,不提前带出标准
  if (form.procName) {
    await matchStdAndLoad()
  }
  await loadSpcParams()
}

// 工序变化: 重新按「料号+工序」匹配标准;工序清空则清除已自动匹配的标准
async function onProcChange() {
  spcParams.value = []
  selStdItemIds.value = []
  if (!form.procName) {
    autoStd.value = ''
    form.stdId = ''
    return
  }
  await matchStdAndLoad()
  await loadSpcParams()
}

// 品类切换: 半成品/成品 锁定工厂自产; 并触发 SPC 参数重载
async function onCategoryChange() {
  if (isFactorySelf.value) {
    form.supplierId = ''
    form.supplierName = ''
  }
  await loadSpcParams()
}

// 匹配检验标准(按 料号+工序); 工序为空时不自动带出,需用户先选工序
async function matchStdAndLoad() {
  const partNo = (form.partNo || '').trim()
  const procName = (form.procName || '').trim()
  if (!partNo || !procName) return
  const orgId = await effectiveOrgId()
  const std = await fiaTaskApi.matchStd({ orgId, partNo, supplierId: form.supplierId || undefined, procName }).catch(() => null)
  if (std && std.id) {
    form.stdId = std.id
    autoStd.value = `${std.code} · ${std.procName || ''}`
    ensureOption(stds.value, std, std.id)
  } else {
    // 料号+工序未匹配到标准: 清除自动匹配结果,交由用户手动选择
    autoStd.value = ''
    form.stdId = ''
  }
}

// 加载 SPC 参数列表:优先按已匹配的标准(stdId)联动;无标准时回退产品名/工序名过滤
async function loadSpcParams() {
  const stdId = (form.stdId || '').trim()
  const productName = (form.productName || '').trim()
  const procName = (form.procName || '').trim()
  if (!stdId && !productName && !procName) { spcParams.value = []; return }
  spcLoading.value = true
  try {
    if (stdId) {
      spcParams.value = await spcParamApi.listByStd(stdId).catch(() => [])
    } else {
      spcParams.value = await spcParamApi.list({ productName, procName }).catch(() => [])
    }
  } finally { spcLoading.value = false }
}

async function loadTriggers() { triggerLoading.value = true; try { triggers.value = await fiaTriggerApi.list() } finally { triggerLoading.value = false } }
async function loadStds() {
  stdLoading.value = true
  try { const r = await fiaStdApi.listPage({ page: 1, size: 20 }); stds.value = r.records || [] }
  finally { stdLoading.value = false }
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

async function searchStds(kw: string) {
  if (!kw) return
  stdLoading.value = true
  try { const r = await fiaStdApi.listPage({ keyword: kw, page: 1, size: 20 }); stds.value = r.records || [] }
  finally { stdLoading.value = false }
}
async function searchSuppliers(kw: string) {
  if (!kw) return
  supLoading.value = true
  try { const r = await sqmSupplierApi.page({ keyword: kw, page: 1, size: 20 }); suppliers.value = r.records || [] }
  finally { supLoading.value = false }
}
async function onStdVisible(open: boolean) { if (open && stds.value.length === 0) await loadStds() }
async function onStdChange() { selStdItemIds.value = []; await loadSpcParams() }
async function onSupVisible(open: boolean) { if (open && suppliers.value.length === 0) await loadSuppliers() }

onMounted(() => {
  loadTriggers()
  loadStds()
  loadProcOptions()
  loadSuppliers()
  loadRealOrg()
})
</script>

<style scoped lang="scss">
.hint { font-size: 12px; color: #409eff; margin-top: 4px; }
.tag-b { display: inline-block; margin-left: 6px; padding: 0 8px; border: 1px solid #e4e2dd; border-radius: 4px; font-size: 12px; color: #141414; background: #f8f7f4; }
.spc-box { width: 100%; border: 1px solid #e4e2dd; border-radius: 8px; padding: 12px; background: #f8f7f4; }
.spc-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.spc-item { margin-right: 8px; margin-bottom: 8px; align-items: baseline; }
.spc-name { font-weight: 600; }
.spc-proc { font-family: $font-mono; font-size: 12px; color: $ink-soft; }
.spc-dot { color: $ink-faint; margin: 0 2px; }
.spc-meta { color: #8a8780; }
.spc-badge { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 4px; font-size: 12px; line-height: 17px; }
.spc-badge.ok { background: $green-dim; color: $green; }
.spc-badge.no { background: $paper; color: $ink-faint; border: 1px solid $hairline; }
</style>
