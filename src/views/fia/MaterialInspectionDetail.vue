<template>
  <div class="material-detail">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>{{ isEdit ? '物料检验详情' : '新建物料检验' }}</h1>
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
        <el-form-item label="物料编码" required>
          <el-select v-model="base.materialCode" filterable clearable remote :remote-method="remoteMaterial"
            :loading="materialLoading" placeholder="选择 MES 物料编码" style="width:100%" :disabled="isEdit" @change="onMaterialPick">
            <el-option v-for="o in materialOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="base.materialName" placeholder="按物料自动带出,或手动填写" />
        </el-form-item>
        <el-form-item label="型号规格">
          <el-input v-model="base.specModel" placeholder="按物料自动带出" />
        </el-form-item>
        <el-form-item label="物料批次号">
          <el-input v-model="base.materialBatchNo" placeholder="来料批次号" />
        </el-form-item>
        <el-form-item label="来料条码">
          <el-input v-model="base.materialBarcode" placeholder="来料条码" />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="base.supplierName" placeholder="按物料自动带出,或手动填写" />
        </el-form-item>
        <el-form-item label="供应商编码">
          <el-input v-model="base.supplierCode" placeholder="按物料自动带出,或手动填写" />
        </el-form-item>
        <el-form-item label="物料类别">
          <el-select v-model="base.materialCategory" clearable placeholder="选择类别" style="width:100%">
            <el-option label="原材料" value="material" />
            <el-option label="半成品" value="semi" />
            <el-option label="成品" value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验类别">
          <el-select v-model="base.inspectionCategory" clearable placeholder="选择检验类别" style="width:100%">
            <el-option label="来料检验" value="来料检验" />
            <el-option label="委外检验" value="委外检验" />
            <el-option label="例行检验" value="例行检验" />
          </el-select>
        </el-form-item>
        <el-form-item label="标记">
          <el-checkbox v-model="base.isUrgent">加急</el-checkbox>
          <el-checkbox v-model="base.isCustomerSupplied">客户供料</el-checkbox>
        </el-form-item>
        <el-divider content-position="left">来料收货溯源</el-divider>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="采购订单号"><el-input v-model="base.purchaseOrder" placeholder="采购订单号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="入库单号"><el-input v-model="base.inboundNo" placeholder="入库单号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="到货日期"><el-date-picker v-model="base.arrivalDate" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收货单号"><el-input v-model="base.receivingNo" placeholder="收货单号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PO 行号"><el-input v-model="base.poLineNo" placeholder="PO 行号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收货行号"><el-input v-model="base.receivingLineNo" placeholder="收货行号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保质期天数"><el-input-number v-model="base.shelfLifeDays" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="工厂/组织">
          <el-input :model-value="plantText" disabled placeholder="按当前用户组织自动带入" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="base.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 阶段二: 检验与判定 -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '20px 24px' }">
      <div class="card-head"><span class="card-title">检验与判定</span></div>
      <el-form :model="insp" label-width="120px" style="max-width:720px;margin-top:14px">
        <el-form-item label="检验员">
          <el-input v-model="insp.inspector" placeholder="检验员姓名" />
        </el-form-item>
        <el-form-item label="判定结论">
          <el-select v-model="insp.inspectionResult" clearable placeholder="选择判定结论" style="width:100%">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
            <el-option label="让步接收" value="让步接收" />
          </el-select>
          <span v-if="insp.inspectionResult" class="pill" :class="judgeClass(insp.inspectionResult)" style="margin-left:10px">{{ insp.inspectionResult }}</span>
        </el-form-item>
        <el-form-item label="检验申请号">
          <el-input v-model="insp.inspectionRequestNo" placeholder="MES 检验申请号" />
        </el-form-item>
        <el-form-item label="MES检验单号">
          <el-input v-model="insp.mesInspectionNo" placeholder="MES 检验单号" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="检验日期"><el-date-picker v-model="insp.inspectionDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="判定日期"><el-date-picker v-model="insp.judgementDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="检验完成日期"><el-date-picker v-model="insp.inspectionEndDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="缺陷描述">
          <el-input v-model="insp.defectDesc" type="textarea" :rows="2" placeholder="不合格时填写缺陷描述" />
        </el-form-item>
        <el-form-item label="处理方式">
          <el-select v-model="insp.handlingMethod" clearable placeholder="选择处理方式" style="width:100%">
            <el-option label="合格放行" value="合格放行" />
            <el-option label="退货" value="退货" />
            <el-option label="让步接收" value="让步接收" />
            <el-option label="挑选" value="挑选" />
            <el-option label="返工" value="返工" />
          </el-select>
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
          <el-col :span="12"><el-form-item label="合格数"><el-input-number v-model="signoff.qualifiedQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="不合格数"><el-input-number v-model="signoff.unqualifiedQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="损耗数"><el-input-number v-model="signoff.lossQty" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="单位"><el-input :model-value="unitText" placeholder="按物料自动带出" /></el-form-item>
        <el-divider content-position="left">审核签核(表单直填)</el-divider>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="评审人"><el-input v-model="signoff.reviewer" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="评审日期"><el-date-picker v-model="signoff.reviewDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="评审结论">
            <el-select v-model="signoff.unqualifiedReview" clearable placeholder="结论" style="width:100%">
              <el-option label="不评审" value="不评审" />
              <el-option label="已评审" value="已评审" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="不合格最终状态"><el-input v-model="signoff.unqualifiedFinalStatus" placeholder="退货/让步接收等" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="不合格评审号"><el-input v-model="signoff.unqualifiedReviewNo" placeholder="不合格评审单号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="判定人"><el-input v-model="signoff.judge" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="提交人"><el-input v-model="signoff.submitter" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="提交日期"><el-date-picker v-model="signoff.submitDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="签核人"><el-input v-model="signoff.signatureUser" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="签核时间"><el-date-picker v-model="signoff.signatureTime" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="复检备注"><el-input v-model="signoff.reinspectRemark" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="签核结论"><el-input v-model="signoff.signatureReason" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="signoff.remark" type="textarea" :rows="2" /></el-form-item>
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
import { materialInspectionApi } from '@/api/modules/fia/materialInspection'
import { useAuthStore } from '@/stores/auth'
import type { MaterialInspectionVO, MaterialInspectionCreateRequest, MaterialInspectionUpdateRequest } from '@/api/types/fia'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const recordId = computed(() => (route.params.id as string) || '')
const isEdit = computed(() => !!recordId.value)
const activeStep = ref(0)
const saving = ref(false)

const base = reactive<MaterialInspectionCreateRequest>({
  materialCode: '', materialName: '', specModel: '', materialBatchNo: '', materialBarcode: '',
  supplierName: '', supplierCode: '', materialCategory: '', inspectionCategory: '',
  unit: '', isCustomerSupplied: false, isUrgent: false, plantCode: '', plantName: '', remark: '',
  purchaseOrder: '', inboundNo: '', arrivalDate: '', receivingNo: '', poLineNo: '', receivingLineNo: '', shelfLifeDays: undefined,
})
const insp = reactive<MaterialInspectionUpdateRequest>({
  inspector: '', inspectionResult: '', inspectionRequestNo: '', mesInspectionNo: '',
  inspectionDate: '', judgementDate: '', inspectionEndDate: '', defectDesc: '', handlingMethod: '',
  purchaseOrder: '', inboundNo: '', arrivalDate: '', receivingNo: '', poLineNo: '', receivingLineNo: '', shelfLifeDays: undefined,
})
const signoff = reactive<MaterialInspectionUpdateRequest>({
  submittedQty: undefined, qualifiedQty: undefined, unqualifiedQty: undefined, lossQty: undefined,
  unit: '', reviewer: '', reviewDate: '', unqualifiedReview: '', unqualifiedFinalStatus: '', unqualifiedReviewNo: '',
  judge: '', submitter: '', submitDate: '', reinspectRemark: '',
  signatureUser: '', signatureTime: '', signatureReason: '', remark: '',
})
const materialOptions = ref<string[]>([])
const materialLoading = ref(false)

const plantText = computed(() => {
  const org = auth.user?.orgId || ''
  const plant = base.plantName || base.plantCode || ''
  return [plant, org].filter(Boolean).join(' / ') || '按当前用户组织自动带入'
})
const unitText = computed(() => signoff.unit || base.unit || '按物料自动带出')

async function remoteMaterial(kw: string) {
  const k = (kw || '').trim()
  if (!k) { materialOptions.value = []; return }
  materialLoading.value = true
  try { materialOptions.value = await materialInspectionApi.materialCodes(k).catch(() => []) }
  finally { materialLoading.value = false }
}
function onMaterialPick(_code: string) {
  // 物料名称/型号规格/单位/供应商由后端按物料带出;此处仅提示用户补充批次等信息
}

function judgeClass(j?: string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '让步接收': 'p-wait' }
  return m[j || ''] || 'p-mute'
}

// 保存基本信息(新建 POST / 编辑跳过)
async function saveBase(): Promise<boolean> {
  if (!base.materialCode) { ElMessage.warning('请选择物料编码'); return false }
  saving.value = true
  try {
    if (!isEdit.value) {
      const id = await materialInspectionApi.create({ ...base })
      router.replace(`/fia/material-inspection/${id}`)
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
  await materialInspectionApi.updateInspection(id, {
    inspector: insp.inspector, inspectionResult: insp.inspectionResult,
    inspectionRequestNo: insp.inspectionRequestNo, mesInspectionNo: insp.mesInspectionNo,
    inspectionDate: insp.inspectionDate, judgementDate: insp.judgementDate,
    inspectionEndDate: insp.inspectionEndDate, defectDesc: insp.defectDesc, handlingMethod: insp.handlingMethod,
    purchaseOrder: insp.purchaseOrder, inboundNo: insp.inboundNo, arrivalDate: insp.arrivalDate,
    receivingNo: insp.receivingNo, poLineNo: insp.poLineNo, receivingLineNo: insp.receivingLineNo,
    shelfLifeDays: insp.shelfLifeDays,
  })
}
async function persistSignoff() {
  const id = recordId.value || recordIdRef.value
  if (!id) return
  await materialInspectionApi.updateSignoff(id, {
    submittedQty: signoff.submittedQty, qualifiedQty: signoff.qualifiedQty,
    unqualifiedQty: signoff.unqualifiedQty, lossQty: signoff.lossQty,
    unit: signoff.unit || base.unit, reviewer: signoff.reviewer, reviewDate: signoff.reviewDate,
    unqualifiedReview: signoff.unqualifiedReview, unqualifiedFinalStatus: signoff.unqualifiedFinalStatus,
    unqualifiedReviewNo: signoff.unqualifiedReviewNo,
    judge: signoff.judge, submitter: signoff.submitter, submitDate: signoff.submitDate,
    reinspectRemark: signoff.reinspectRemark, signatureUser: signoff.signatureUser,
    signatureTime: signoff.signatureTime, signatureReason: signoff.signatureReason, remark: signoff.remark,
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
    ElMessage.success('已提交物料检验')
    router.push('/fia/finish-inspection?seg=material')
  } catch { /* */ }
}

// 编辑模式: 加载详情回填
async function loadDetail() {
  const id = recordId.value
  if (!id) return
  try {
    const v: MaterialInspectionVO = await materialInspectionApi.get(id)
    base.materialCode = v.materialCode || ''
    base.materialName = v.materialName || ''
    base.specModel = v.specModel || ''
    base.materialBatchNo = v.materialBatchNo || ''
    base.materialBarcode = v.materialBarcode || ''
    base.supplierName = v.supplierName || ''
    base.supplierCode = v.supplierCode || ''
    base.materialCategory = v.materialCategory || ''
    base.inspectionCategory = v.inspectionCategory || ''
    base.unit = v.unit || ''
    base.isCustomerSupplied = v.isCustomerSupplied === '1'
    base.isUrgent = v.isUrgent === '1'
    base.plantCode = v.plantCode || ''
    base.plantName = v.plantName || ''
    base.remark = v.remark || ''
    base.purchaseOrder = v.purchaseOrder || ''
    base.inboundNo = v.inboundNo || ''
    base.arrivalDate = v.arrivalDate || ''
    base.receivingNo = v.receivingNo || ''
    base.poLineNo = v.poLineNo || ''
    base.receivingLineNo = v.receivingLineNo || ''
    base.shelfLifeDays = v.shelfLifeDays != null ? Number(v.shelfLifeDays) : undefined
    insp.purchaseOrder = v.purchaseOrder || ''
    insp.inboundNo = v.inboundNo || ''
    insp.arrivalDate = v.arrivalDate || ''
    insp.receivingNo = v.receivingNo || ''
    insp.poLineNo = v.poLineNo || ''
    insp.receivingLineNo = v.receivingLineNo || ''
    insp.shelfLifeDays = v.shelfLifeDays != null ? Number(v.shelfLifeDays) : undefined
    insp.inspector = v.inspector || ''
    insp.inspectionResult = v.inspectionResult || ''
    insp.inspectionRequestNo = v.inspectionRequestNo || ''
    insp.mesInspectionNo = v.mesInspectionNo || ''
    insp.inspectionDate = v.inspectionDate || ''
    insp.judgementDate = v.judgementDate || ''
    insp.inspectionEndDate = v.inspectionEndDate || ''
    insp.defectDesc = v.defectDesc || ''
    insp.handlingMethod = v.handlingMethod || ''
    signoff.submittedQty = v.submittedQty != null ? Number(v.submittedQty) : undefined
    signoff.qualifiedQty = v.qualifiedQty != null ? Number(v.qualifiedQty) : undefined
    signoff.unqualifiedQty = v.unqualifiedQty != null ? Number(v.unqualifiedQty) : undefined
    signoff.lossQty = v.lossQty != null ? Number(v.lossQty) : undefined
    signoff.unit = v.unit || ''
    signoff.reviewer = v.reviewer || ''
    signoff.reviewDate = v.reviewDate || ''
    signoff.unqualifiedReview = v.unqualifiedReview || ''
    signoff.unqualifiedFinalStatus = v.unqualifiedFinalStatus || ''
    signoff.unqualifiedReviewNo = v.unqualifiedReviewNo || ''
    signoff.judge = v.judge || ''
    signoff.submitter = v.submitter || ''
    signoff.submitDate = v.submitDate || ''
    signoff.reinspectRemark = v.reinspectRemark || ''
    signoff.signatureUser = v.signatureUser || ''
    signoff.signatureTime = v.signatureTime || ''
    signoff.signatureReason = v.signatureReason || ''
    signoff.remark = v.remark || ''
  } catch { /* */ }
}

onMounted(() => { if (isEdit.value) loadDetail() })
</script>

<style lang="scss" scoped>
.card-head { margin-bottom: 4px; }
.card-title { font-family: $font-display; font-size: 16px; font-weight: 600; color: $ink; }
.foot-bar { display: flex; justify-content: flex-end; gap: 12px; margin: 18px 0; }
</style>
