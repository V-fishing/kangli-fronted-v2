<template>
  <div class="finish-detail">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>{{ isEdit ? '完工检验详情' : '新建完工检验' }}</h1>
      </div>
      <div class="head-actions">
        <el-button @click="router.back()">返回</el-button>
      </div>
    </div>

    <!-- 步骤条 -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '18px 24px' }">
      <el-steps :active="activeStep" align-center finish-status="success">
        <el-step title="基本信息" />
        <el-step title="检验与判定" />
        <el-step title="数量信息与审核签核" />
      </el-steps>
    </el-card>

    <!-- 阶段一: 基本信息 -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '20px 24px' }">
      <div class="card-head"><span class="card-title">基本信息</span></div>
      <el-form :model="base" label-width="120px" style="max-width:720px;margin-top:14px">
        <el-form-item label="生产订单号" required>
          <el-select v-model="base.productionOrderNo" filterable clearable remote :remote-method="remoteOrder"
            :loading="orderLoading" placeholder="选择 MES 生产订单号" style="width:100%" :disabled="isEdit" @change="onOrderPick">
            <el-option v-for="o in orderOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料编码" required>
          <el-input v-model="base.materialCode" placeholder="生产订单号选中后自动带出,或手动填写" :disabled="isEdit && !!base.materialCode" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="base.productName" placeholder="按物料带出或手填" />
        </el-form-item>
        <el-form-item label="型号规格">
          <el-input v-model="base.modelSpec" disabled placeholder="按物料自动带出" />
        </el-form-item>
        <el-form-item label="批次/序列号">
          <el-input v-model="base.prodBatchOrSn" placeholder="批次号或序列号" />
        </el-form-item>
        <el-form-item label="生产日期">
          <el-date-picker v-model="base.productionDate" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="insp.expiryDate" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="品类">
          <el-radio-group v-model="base.category">
            <el-radio value="成品">成品</el-radio>
            <el-radio value="半成品">半成品</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="紧急/委外">
          <el-checkbox v-model="base.isUrgent">紧急</el-checkbox>
          <el-checkbox v-model="base.isEntrusted">委外</el-checkbox>
        </el-form-item>
        <el-form-item label="工厂/组织">
          <el-input :model-value="plantText" disabled placeholder="按当前用户组织自动带入" />
        </el-form-item>
      </el-form>

      <!-- 首件软提示(基本信息保存后出现) -->
      <div v-if="isEdit && recordId" class="first-banner">
        <span>首件绑定(软提示,可跳过):通过生产订单号 <b class="mono">{{ base.productionOrderNo }}</b> 对齐首件</span>
        <el-button link type="primary" size="small" @click="goFirstArticle">去首件</el-button>
        <el-button link type="primary" size="small" @click="loadFirstArticles">绑定首件</el-button>
      </div>
      <el-table v-if="firstArticles.length" :data="firstArticles" size="small" class="first-table">
        <el-table-column prop="code" label="首件单号" width="180" />
        <el-table-column prop="productName" label="产品" min-width="120" />
        <el-table-column prop="partNo" label="料号" width="120" />
        <el-table-column prop="overallJudge" label="判定" width="90" />
        <el-table-column prop="status" label="状态" width="90" />
      </el-table>
    </el-card>

    <!-- 阶段二: 检验与判定 -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '20px 24px' }">
      <div class="card-head"><span class="card-title">检验与判定</span></div>
      <el-form :model="insp" label-width="120px" style="max-width:720px;margin-top:14px">
        <el-form-item label="检验员">
          <el-input v-model="insp.inspectorName" placeholder="检验员姓名" />
        </el-form-item>
        <el-form-item label="判定结论">
          <el-select v-model="insp.inspectionResult" clearable placeholder="选择判定结论" style="width:100%">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
            <el-option label="警告" value="警告" />
          </el-select>
          <span v-if="insp.inspectionResult" class="pill" :class="judgeClass(insp.inspectionResult)" style="margin-left:10px">{{ insp.inspectionResult }}</span>
        </el-form-item>
        <el-form-item label="检验申请号">
          <el-input v-model="insp.inspectionRequestNo" placeholder="MES 检验申请号" />
        </el-form-item>
        <el-form-item label="性能测试方法">
          <el-input v-model="insp.perfTestMethod" placeholder="性能测试方法" />
        </el-form-item>
        <el-form-item label="性能样本批号">
          <el-input v-model="insp.perfSampleBatchNo" placeholder="性能样本批号" />
        </el-form-item>
        <el-form-item label="药品注册号">
          <el-input v-model="insp.drugRegNo" placeholder="药品注册号(非药品可不填)" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 阶段三: 数量信息与审核签核 -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '20px 24px' }">
      <div class="card-head"><span class="card-title">数量信息与审核签核</span></div>
      <el-form :model="signoff" label-width="120px" style="max-width:760px;margin-top:14px">
        <el-divider content-position="left">数量信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="送检数"><el-input-number v-model="signoff.submittedQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="检验数"><el-input-number v-model="signoff.inspectedQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="合格数"><el-input-number v-model="signoff.qualifiedQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="不合格数"><el-input-number v-model="signoff.unqualifiedQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="单位"><el-input :model-value="unitText" disabled placeholder="按物料自动带出" /></el-form-item>
        <el-divider content-position="left">审核签核(表单直填)</el-divider>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="质控审核">
            <el-select v-model="signoff.qcReview" clearable placeholder="结论" style="width:100%">
              <el-option label="通过" value="通过" />
              <el-option label="不通过" value="不通过" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="经理审批">
            <el-select v-model="signoff.mgrApproval" clearable placeholder="结论" style="width:100%">
              <el-option label="批准" value="批准" />
              <el-option label="驳回" value="驳回" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="审核人"><el-input v-model="signoff.qcReviewer" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="审核时间"><el-date-picker v-model="signoff.qcReviewTime" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="经理代表"><el-input v-model="signoff.mgrRepresentative" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="批准时间"><el-date-picker v-model="signoff.mgrApprovalTime" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="签核人"><el-input v-model="signoff.signatureUser" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="签核时间"><el-date-picker v-model="signoff.signatureTime" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="签核结论"><el-input v-model="signoff.signatureReason" type="textarea" :rows="2" /></el-form-item>
      </el-form>
    </el-card>

    <!-- 底部操作栏 -->
    <div class="foot-bar">
      <el-button v-if="activeStep > 0" @click="activeStep--">上一步</el-button>
      <el-button v-if="activeStep < 2" type="primary" :loading="saving" @click="nextStep">保存并下一步</el-button>
      <el-button v-if="activeStep === 2" type="primary" :loading="saving" @click="submitAll">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { finishInspectionApi } from '@/api/modules/fia/finishInspection'
import { useAuthStore } from '@/stores/auth'
import type { FinishInspectionVO, FinishInspectionCreateRequest, FinishInspectionUpdateRequest, EligibleFirstArticleVO } from '@/api/types/fia'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const recordId = computed(() => (route.params.id as string) || '')
const isEdit = computed(() => !!recordId.value)
const activeStep = ref(0)
const saving = ref(false)

const base = reactive<FinishInspectionCreateRequest>({
  productionOrderNo: '', materialCode: '', productName: '', modelSpec: '', prodBatchOrSn: '',
  productionDate: '', category: '成品', isUrgent: false, isEntrusted: false, plantCode: '', plantName: '', unit: '',
})
const insp = reactive<FinishInspectionUpdateRequest>({
  inspectorName: '', inspectionResult: '', inspectionRequestNo: '', expiryDate: '',
  drugRegNo: '', perfTestMethod: '', perfSampleBatchNo: '',
})
const signoff = reactive<FinishInspectionUpdateRequest>({
  submittedQty: undefined, inspectedQty: undefined, qualifiedQty: undefined, unqualifiedQty: undefined,
  unit: '', qcReview: '', qcReviewer: '', qcReviewTime: '',
  mgrApproval: '', mgrRepresentative: '', mgrApprovalTime: '',
  signatureUser: '', signatureTime: '', signatureReason: '',
})
const firstArticles = ref<EligibleFirstArticleVO[]>([])
const orderOptions = ref<string[]>([])
const orderLoading = ref(false)

const plantText = computed(() => {
  const org = auth.user?.orgId || ''
  const plant = base.plantName || base.plantCode || ''
  return [plant, org].filter(Boolean).join(' / ') || '按当前用户组织自动带入'
})
const unitText = computed(() => signoff.unit || base.unit || '按物料自动带出')

async function remoteOrder(kw: string) {
  const k = (kw || '').trim()
  if (!k) { orderOptions.value = []; return }
  orderLoading.value = true
  try { orderOptions.value = await finishInspectionApi.mesProductionOrders(k).catch(() => []) }
  finally { orderLoading.value = false }
}
function onOrderPick(_wo: string) {
  // 选中生产订单号后,物料/型号规格/单位由后端按物料带出;此处仅提示用户补充物料编码
}

function judgeClass(j?: string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '警告': 'p-wait' }
  return m[j || ''] || 'p-mute'
}

// 保存基本信息(新建 POST / 编辑跳过)
async function saveBase(): Promise<boolean> {
  if (!base.productionOrderNo) { ElMessage.warning('请选择生产订单号'); return false }
  if (!base.materialCode) { ElMessage.warning('请填写物料编码'); return false }
  saving.value = true
  try {
    if (!isEdit.value) {
      const id = await finishInspectionApi.create({ ...base })
      router.replace(`/fia/finish-inspection/${id}`)
      recordIdRef.value = id
    }
    return true
  } catch { return false }
  finally { saving.value = false }
}
// 路由替换后 recordId 仍是 computed,用本地兜底
const recordIdRef = ref('')

async function persistInspection() {
  const id = recordId.value || recordIdRef.value
  if (!id) return
  await finishInspectionApi.updateInspection(id, {
    inspectorName: insp.inspectorName, inspectionResult: insp.inspectionResult,
    inspectionRequestNo: insp.inspectionRequestNo, expiryDate: insp.expiryDate,
    drugRegNo: insp.drugRegNo, perfTestMethod: insp.perfTestMethod, perfSampleBatchNo: insp.perfSampleBatchNo,
  })
}
async function persistSignoff() {
  const id = recordId.value || recordIdRef.value
  if (!id) return
  await finishInspectionApi.updateSignoff(id, {
    submittedQty: signoff.submittedQty, inspectedQty: signoff.inspectedQty,
    qualifiedQty: signoff.qualifiedQty, unqualifiedQty: signoff.unqualifiedQty,
    unit: signoff.unit || base.unit, qcReview: signoff.qcReview,
    qcReviewer: signoff.qcReviewer, qcReviewTime: signoff.qcReviewTime,
    mgrApproval: signoff.mgrApproval, mgrRepresentative: signoff.mgrRepresentative, mgrApprovalTime: signoff.mgrApprovalTime,
    signatureUser: signoff.signatureUser, signatureTime: signoff.signatureTime,
    signatureReason: signoff.signatureReason,
  })
}

async function nextStep() {
  if (activeStep.value === 0) {
    const ok = await saveBase()
    if (!ok) return
    await persistInspection()
  } else if (activeStep.value === 1) {
    const ok = await saveBase()
    if (!ok) return
    await persistInspection()
  }
  activeStep.value++
}
async function submitAll() {
  const ok = await saveBase()
  if (!ok) return
  try {
    await persistInspection()
    await persistSignoff()
    ElMessage.success('已提交完工检验')
    router.push(`/fia/finish-inspection?seg=${encodeURIComponent(base.category || '成品')}`)
  } catch { /* */ }
}

function goFirstArticle() { router.push('/fia/tasks') }
async function loadFirstArticles() {
  const id = recordId.value || recordIdRef.value
  if (!id) return
  try { firstArticles.value = await finishInspectionApi.firstArticles(id).catch(() => []) }
  catch { /* */ }
}

// 编辑模式: 加载详情回填
async function loadDetail() {
  const id = recordId.value
  if (!id) return
  try {
    const v: FinishInspectionVO = await finishInspectionApi.get(id)
    base.productionOrderNo = v.productionOrderNo || ''
    base.materialCode = v.materialCode || ''
    base.productName = v.productName || ''
    base.modelSpec = v.modelSpec || ''
    base.prodBatchOrSn = v.prodBatchOrSn || ''
    base.productionDate = v.productionDate || ''
    base.category = v.category || '成品'
    base.isUrgent = v.isUrgent === '1'
    base.isEntrusted = v.isEntrusted === '1'
    base.plantCode = v.plantCode || ''
    base.plantName = v.plantName || ''
    base.unit = v.unit || ''
    insp.inspectorName = v.inspectorName || ''
    insp.inspectionResult = v.inspectionResult || ''
    insp.inspectionRequestNo = v.inspectionRequestNo || ''
    insp.expiryDate = v.expiryDate || ''
    insp.drugRegNo = v.drugRegNo || ''
    insp.perfTestMethod = v.perfTestMethod || ''
    insp.perfSampleBatchNo = v.perfSampleBatchNo || ''
    signoff.qcReview = v.qcReview || ''
    signoff.mgrApproval = v.mgrApproval || ''
    signoff.submittedQty = v.submittedQty != null ? Number(v.submittedQty) : undefined
    signoff.inspectedQty = v.inspectedQty != null ? Number(v.inspectedQty) : undefined
    signoff.qualifiedQty = v.qualifiedQty != null ? Number(v.qualifiedQty) : undefined
    signoff.unqualifiedQty = v.unqualifiedQty != null ? Number(v.unqualifiedQty) : undefined
    signoff.unit = v.unit || ''
    signoff.qcReviewer = v.qcReviewer || ''
    signoff.qcReviewTime = v.qcReviewTime || ''
    signoff.mgrRepresentative = v.mgrRepresentative || ''
    signoff.mgrApprovalTime = v.mgrApprovalTime || ''
    signoff.signatureUser = v.signatureUser || ''
    signoff.signatureTime = v.signatureTime || ''
    signoff.signatureReason = v.signatureReason || ''
  } catch { /* */ }
}

onMounted(() => {
  if (isEdit.value) loadDetail()
  else {
    // 从列表「成品/半成品」档新建时,预置品类
    const c = route.query.category
    if (c === '成品' || c === '半成品') base.category = c as string
  }
})
</script>

<style lang="scss" scoped>
.card-head { margin-bottom: 4px; }
.card-title { font-family: $font-display; font-size: 16px; font-weight: 600; color: $ink; }
.first-banner { display: flex; align-items: center; gap: 12px; background: $paper; border: 1px solid $hairline; border-radius: 8px; padding: 10px 14px; margin-top: 16px; font-size: 13px; color: $ink-soft; }
.first-banner .mono { font-family: $font-mono; color: $cobalt; }
.first-table { margin-top: 12px; }
.foot-bar { display: flex; justify-content: flex-end; gap: 12px; margin: 18px 0; }
</style>
