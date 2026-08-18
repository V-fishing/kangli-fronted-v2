<template>
  <div class="audit-execute">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>审核执行 <span class="mono plan-no">{{ plan?.planNo }}</span></h1>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <span class="pill" :class="planStatusClass(plan?.status)"><span class="d"></span>{{ plan?.status || '' }}</span>
        <el-button size="small" @click="goBack">返回列表</el-button>
      </div>
    </div>

    <el-card shadow="never" class="card-b">
      <template #header>计划信息</template>
      <el-descriptions :column="3" border size="small" v-if="plan">
        <el-descriptions-item label="供应商">{{ supplierName(plan?.supplierId) }}</el-descriptions-item>
        <el-descriptions-item label="审核类型">{{ plan.auditType }}</el-descriptions-item>
        <el-descriptions-item label="组长">{{ plan.auditLead || '—' }}</el-descriptions-item>
        <el-descriptions-item label="审核组">{{ plan.actualAuditors || plan.auditorTeam || '—' }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">{{ plan.riskLevel || '无' }}</el-descriptions-item>
        <el-descriptions-item label="范围" :span="3">{{ plan.scope || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" class="card-b">
      <template #header>生命周期线</template>
      <el-steps :active="activeStep" align-center finish-status="success">
        <el-step v-for="s in steps" :key="s.key" :title="s.label"
          :status="stepStatus(s)" :description="stepDesc(s)" />
      </el-steps>
    </el-card>

    <el-card shadow="never" class="card-b">
      <template #header>
        <span>现场审核检查项</span>
        <el-button size="small" type="primary" style="float:right" v-if="canEdit" @click="saveChecklist">保存检查项</el-button>
      </template>
      <el-table :data="checklist" size="small" border>
        <el-table-column label="序号" width="60" type="index" />
        <el-table-column label="条款" width="120">
          <template #default="{row}"><el-input v-model="row.clause" placeholder="如 7.4" /></template>
        </el-table-column>
        <el-table-column label="检查内容" min-width="200">
          <template #default="{row}"><el-input v-model="row.itemName" placeholder="检查项目" /></template>
        </el-table-column>
        <el-table-column label="结果" width="130">
          <template #default="{row}">
            <el-select v-model="row.result" style="width:100%">
              <el-option label="符合" value="符合" />
              <el-option label="不符合" value="不符合" />
              <el-option label="观察项" value="观察项" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="证据说明" min-width="180">
          <template #default="{row}"><el-input v-model="row.evidence" placeholder="证据/记录" /></template>
        </el-table-column>
        <el-table-column label="操作" width="70">
          <template #default="{row, $index}">
            <el-button link type="danger" size="small" v-if="canEdit" @click="checklist.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button size="small" style="margin-top:10px" v-if="canEdit" @click="checklist.push({ itemName:'', result:'符合' })">+ 添加检查项</el-button>
    </el-card>

    <el-card shadow="never" class="card-b">
      <template #header>现场照片</template>
      <div class="photo-bar">
        <input type="file" accept="image/*" ref="fileInput" style="display:none" @change="onFile" />
        <el-button size="small" v-if="canEdit" @click="(fileInput as HTMLInputElement).click()">+ 上传照片</el-button>
        <span class="hint">照片存于服务端 logs/photos/，带时间水印</span>
      </div>
      <div class="photo-list" v-if="photos.length">
        <div class="photo-item" v-for="p in photos" :key="p.id">
          <img :src="photoSrc(p)" class="thumb" />
          <div class="photo-meta">
            <div class="mono">{{ p.fileName }}</div>
            <el-button link type="danger" size="small" v-if="canEdit" @click="removePhoto(p)">删除</el-button>
          </div>
        </div>
      </div>
      <div v-else class="empty-hint">暂无照片</div>
    </el-card>

      <el-card shadow="never" class="card-b">
        <template #header>
          <span>不符合项</span>
          <el-button size="small" type="primary" style="float:right" v-if="canEdit" @click="openNc">+ 新增不符合项</el-button>
        </template>
        <div class="hint" style="margin-bottom:8px" v-if="!reviewSubmitted">
          不符合项可在「提交复核」前随时补充；若检查项中存在「不符合」判定，将自动计入不符合项。
        </div>
      <el-table :data="ncs" size="small" border v-if="ncs.length">
        <el-table-column prop="ncNo" label="编号" width="150" />
        <el-table-column prop="level" label="等级" width="90" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="responsible" label="责任" width="100" />
        <el-table-column prop="status" label="状态" width="90" />
      </el-table>
      <div v-else class="empty-hint">暂无不符合项</div>
    </el-card>

    <el-card shadow="never" class="card-b">
      <template #header>执行结果复核</template>
      <div v-if="review" class="review-block">
        <div class="appr-row">
          <span class="appr-role">{{ review.roleLabel }}</span>
          <span class="pill" :class="reviewPill(review.status)"><span class="d"></span>{{ reviewLabel(review.status) }}</span>
          <span class="appr-meta" v-if="review.operator">执行人：{{ review.operator }}</span>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; align-items:center" v-if="review.status === 'pending'">
          <el-button size="small" type="success" :disabled="!reviewOpinion.trim()" v-if="canApprove" @click="doReview(true)">通过复核</el-button>
          <el-button size="small" type="danger" :disabled="!reviewOpinion.trim()" v-if="canApprove" @click="doReview(false)">驳回</el-button>
          <el-input v-model="reviewOpinion" size="small" placeholder="复核意见（必填）" style="width:200px" />
          <el-input v-model="reviewConclusion" size="small" placeholder="审核结论（选填，留空则自动判定）" style="width:280px" />
        </div>
        <div class="hint" style="margin-top:8px" v-if="review.status === 'pending'">
          复核意见为必填项；结论留空时按不符合项自动判定：有不符合项→有条件通过，无不符合项→通过。
        </div>
        <el-alert v-else type="success" :closable="false" style="margin-top:12px">
          复核已通过，审核闭环完成，报告已归档。
        </el-alert>
      </div>
      <div v-else>
        <el-button size="small" type="primary" :disabled="!checklist.length" v-if="canEdit" @click="submitReview">提交复核</el-button>
        <span class="hint" v-if="checklist.length">提交后由指定复核人签批，通过即闭环归档。</span>
        <span class="hint hl" v-else>请先「保存检查项」（至少 1 项）完成现场审核，方可提交复核。</span>
      </div>
    </el-card>

    <el-card shadow="never" class="card-b">
      <template #header>流程轨迹</template>
      <el-timeline>
        <el-timeline-item v-for="(w, i) in logs" :key="w.id || i" type="success" :timestamp="w.createdAt" placement="top">
          <b>{{ w.action }}</b>
          <span class="mono" style="color:#8a8780; margin-left:8px">{{ w.operator }}</span>
          <div v-if="w.remark" class="log-remark">{{ w.remark }}</div>
        </el-timeline-item>
      </el-timeline>
      <div v-if="!logs.length" class="empty-hint">暂无轨迹</div>
    </el-card>

    <el-dialog v-model="ncVisible" title="新增不符合项" width="520px" append-to-body>
      <el-form :model="ncForm" label-width="80px">
        <el-form-item label="等级">
          <el-select v-model="ncForm.level" style="width:100%">
            <el-option label="严重" value="严重" />
            <el-option label="一般" value="一般" />
            <el-option label="观察项" value="观察项" />
          </el-select>
        </el-form-item>
        <el-form-item label="条款"><el-input v-model="ncForm.clause" placeholder="对应条款" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="ncForm.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="责任"><el-input v-model="ncForm.responsible" /></el-form-item>
        <el-form-item label="期限"><el-date-picker v-model="ncForm.deadline" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="ncVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveNc">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { usePermissionStore } from '@/stores/permission'
import { auditExecuteApi } from '@/api/modules/sqm/auditExecute'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { processStepsOf } from '@/views/sqm/auditTypeMeta'
import type { SqmAuditPlan, SqmAuditChecklistItem, SqmAuditPhoto, SqmAuditNc, SqmAuditWorkflowLog, SqmAuditApproval, SqmSupplier } from '@/api/types/sqm'

const route = useRoute()
const router = useRouter()
const perm = usePermissionStore()
const canEdit = computed(() => perm.has('sqm.audit.create'))
const canApprove = computed(() => perm.has('sqm.audit.approve'))
const planId = route.params.planId as string

const plan = ref<SqmAuditPlan | null>(null)
const recordId = ref<string | null>(null)
const review = ref<SqmAuditApproval | null>(null)
const checklist = ref<Partial<SqmAuditChecklistItem>[]>([])
const photos = ref<SqmAuditPhoto[]>([])
const ncs = ref<SqmAuditNc[]>([])
const logs = ref<SqmAuditWorkflowLog[]>([])
const reviewOpinion = ref('')
const reviewConclusion = ref('')
// 供应商名称映射(supplierId → name)
const suppliers = ref<SqmSupplier[]>([])
const supplierNameMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const s of suppliers.value) if (s.id) m[s.id] = s.name
  return m
})
function supplierName(id?: string): string {
  return (id && supplierNameMap.value[id]) || id || '—'
}
async function loadSuppliers() { try { suppliers.value = await sqmSupplierApi.list() } catch { suppliers.value = [] } }

const fileInput = ref<HTMLInputElement | null>(null)
const ncVisible = ref(false)
const ncForm = ref<Partial<SqmAuditNc>>({ level: '一般' })

const reviewSubmitted = computed(() => !!review.value && review.value.status !== 'pending')
const steps = computed(() => processStepsOf(plan.value?.auditType || ''))
const activeStep = computed(() => {
  // 真实数据驱动:有检查项→现场审核完成;有不符合项→不符合项激活;复核通过→归档
  if (review.value && review.value.status === 'done') return steps.value.length
  if (ncs.value.length) return Math.max(3, steps.value.length - 2)
  if (checklist.value.length) return 3
  return 1
})

function planStatusClass(s?: string) {
  return { '计划中': 'p-wait', '待执行': 'p-run', '进行中': 'p-run', '已完成': 'p-done' }[s || ''] || 'p-none'
}
function reviewPill(s?: string) {
  if (s === 'done') return 'p-done'
  if (s === 'rejected') return 'p-lock'
  return 'p-wait'
}
function reviewLabel(s?: string) {
  if (s === 'done') return '已通过'
  if (s === 'rejected') return '已驳回'
  return '待复核'
}
function stepStatus(s: any) {
  const idx = steps.value.indexOf(s) + 1
  if (review.value?.status === 'done') return 'finish'
  if (idx < activeStep.value) return 'finish'
  if (idx === activeStep.value) return 'process'
  return 'wait'
}
function stepDesc(s: any) {
  const idx = steps.value.indexOf(s) + 1
  if (idx === 3 && checklist.value.length) return `已录入 ${checklist.value.length} 项`
  if (idx === 4 && ncs.value.length) return `不符合项 ${ncs.value.length} 项`
  return ''
}

function photoSrc(p: SqmAuditPhoto) {
  // filePath 存的是 MinIO objectKey(如 audit-photos/{uuid}-name),直接用于下载端点
  const key = p.filePath || p.fileName
  return key ? auditExecuteApi.photoUrl(key) : ''
}

async function loadAll() {
  const init = await auditExecuteApi.loadExecute(planId)
  plan.value = init.plan
  recordId.value = init.recordId
  review.value = init.review
  if (recordId.value) {
    checklist.value = await auditExecuteApi.listChecklist(recordId.value)
    photos.value = await auditExecuteApi.listPhotos(recordId.value)
    ncs.value = await auditExecuteApi.listNcs(recordId.value)
  }
  logs.value = await auditExecuteApi.workflowLog(planId)
  await loadSuppliers()
}

function saveChecklist() {
  if (!recordId.value) return ElMessage.warning('尚未进入执行,请刷新')
  const items = checklist.value.filter(c => c.itemName && c.itemName.trim())
  if (!items.length) return ElMessage.warning('请至少填写一项检查内容')
  auditExecuteApi.saveChecklist(recordId.value, items).then(() => {
    ElMessage.success('检查项已保存')
    loadAll()
  })
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f || !recordId.value) return
  const fd = new FormData()
  fd.append('file', f)
  // 上传到 MinIO,返回 R{data: objectKey}
  const resp = await fetch(`/api/v1/sqm/audits/records/${recordId.value}/photos`, {
    method: 'POST', headers: { Authorization: localStorage.getItem('qms_token') ? `Bearer ${localStorage.getItem('qms_token')}` : '' }, body: fd,
  })
  const json = await resp.json()
  if (json.code !== 0 || !json.data) {
    ElMessage.error('照片上传失败: ' + (json.msg || resp.status))
    return
  }
  const objectKey = json.data as string
  const meta = await auditExecuteApi.addPhoto(recordId.value, { filePath: objectKey, fileName: f.name, shootBy: plan.value?.auditLead })
  photos.value.push(meta)
  ElMessage.success('照片已上传')
  ;(e.target as HTMLInputElement).value = ''
}

function removePhoto(p: SqmAuditPhoto) {
  if (!p.id) return
  auditExecuteApi.removePhoto(p.id).then(() => {
    photos.value = photos.value.filter(x => x.id !== p.id)
    ElMessage.success('已删除')
  })
}

function openNc() { ncVisible.value = true; ncForm.value = { level: '一般' } }
function saveNc() {
  if (!recordId.value) return
  if (!ncForm.value.description) return ElMessage.warning('请填写描述')
  auditExecuteApi.createNc(recordId.value, ncForm.value).then((nc) => {
    ncs.value.push(nc)
    ncVisible.value = false
    ElMessage.success('不符合项已新增')
    loadAll()
  })
}

function submitReview() {
  auditExecuteApi.submitReview(planId).then((r) => {
    review.value = r
    ElMessage.success('已提交复核')
    loadAll()
  })
}

function doReview(approved: boolean) {
  if (!review.value) return
  sqmAuditApi.approve(planId, { approvalRole: 'review', approved, opinion: reviewOpinion.value }).then(() => {
    ElMessage.success(approved ? '复核通过' : '已驳回')
    if (approved) {
      // 复核通过后闭环归档(结论人工兜底,留空则自动判定)
      auditExecuteApi.completeReview(planId, reviewConclusion.value).then(() => loadAll())
    } else {
      loadAll()
    }
  })
}

function goBack() { router.push('/sqm/audits') }

onMounted(loadAll)
</script>

<style scoped lang="scss">
.audit-execute { padding: 4px 0; }
.head-b { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.head-b h1 { font-family: 'Archivo', sans-serif; font-size: 28px; font-weight: 800; margin: 4px 0 0; }
.plan-no { color: #0047ab; }
.card-b { margin-bottom: 16px; }
.mono { font-family: 'IBM Plex Mono', monospace; }
.hint { color: #8a8780; font-size: 12px; margin-left: 10px; }
.hint.hl { color: #c77800; }
.empty-hint { color: #8a8780; font-size: 13px; padding: 12px 0; }
.appr-row { display: flex; align-items: center; gap: 12px; }
.appr-role { font-weight: 600; }
.appr-meta { color: #8a8780; font-size: 12px; }
.photo-bar { display: flex; align-items: center; margin-bottom: 12px; }
.photo-list { display: flex; flex-wrap: wrap; gap: 12px; }
.photo-item { border: 1px solid #e4e2dd; border-radius: 6px; padding: 6px; width: 180px; }
.thumb { width: 100%; height: 110px; object-fit: cover; border-radius: 4px; }
.photo-meta { font-size: 11px; margin-top: 4px; }
.log-remark { color: #8a8780; font-size: 12px; margin-top: 2px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: #fdf6e9; color: #c77800; } .p-wait .d { background: #c77800; }
.p-run { background: #eef3fa; color: #0047ab; } .p-run .d { background: #0047ab; }
.p-lock { background: #fdf0ed; color: #e03616; } .p-lock .d { background: #e03616; }
.p-done { background: #edf7f1; color: #1a7f4b; } .p-done .d { background: #1a7f4b; }
.p-none { background: #f2f3f5; color: #a0a4ab; } .p-none .d { background: #a0a4ab; }
</style>
