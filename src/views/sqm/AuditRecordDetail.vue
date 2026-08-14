<template>
  <div class="audit-record-detail">
    <div class="toolbar">
      <el-button @click="goBack">返回</el-button>
      <div class="toolbar-actions">
        <el-button type="primary" @click="downloadReport">下载报告</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="card" shadow="never">
          <template #header>审核计划</template>
          <el-descriptions :column="2" border size="small" v-if="plan">
            <el-descriptions-item label="计划编号">{{ plan.planNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag size="small" :type="statusType(plan.status)">{{ plan.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="供应商">{{ supplierName(plan?.supplierId) }}</el-descriptions-item>
            <el-descriptions-item label="审核类型">{{ plan.auditType }}</el-descriptions-item>
            <el-descriptions-item label="组长">{{ plan.auditLead }}</el-descriptions-item>
            <el-descriptions-item label="审核组">{{ plan.actualAuditors || plan.auditorTeam || '—' }}</el-descriptions-item>
            <el-descriptions-item label="风险等级">{{ plan.riskLevel || '无' }}</el-descriptions-item>
            <el-descriptions-item label="计划日期">{{ plan.planDate }}</el-descriptions-item>
            <el-descriptions-item label="实际日期">{{ plan.actualDate }}</el-descriptions-item>
            <el-descriptions-item label="范围" :span="2">{{ plan.scope }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="card" shadow="never">
          <template #header>审核记录</template>
          <el-descriptions :column="2" border size="small" v-if="record">
            <el-descriptions-item label="记录编号">{{ record.recordNo }}</el-descriptions-item>
            <el-descriptions-item label="结论">
              <el-tag size="small" :type="resultType(record.result)">{{ record.result }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核日期">{{ record.auditDate }}</el-descriptions-item>
            <el-descriptions-item label="评分">{{ record.score }}</el-descriptions-item>
            <el-descriptions-item label="不符合项数">{{ record.ncCount }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ record.status }}</el-descriptions-item>
            <el-descriptions-item label="结论说明" :span="2">{{ record.conclusion }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card" shadow="never" v-if="plan && auditMeta(plan.auditType)?.fields?.length">
      <template #header>计划特有信息（{{ plan.auditType }}）</template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item v-for="f in auditMeta(plan.auditType)!.fields" :key="f.key" :label="f.label">{{ extVal(plan.extJson, f.key) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="card" shadow="never" v-if="record && auditMeta(record.auditType)?.recordFields?.length">
      <template #header>记录特有信息（{{ record.auditType }}）</template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item v-for="f in auditMeta(record.auditType)!.recordFields" :key="f.key" :label="f.label">{{ extVal(record.extJson, f.key) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="card" shadow="never" v-if="plan || record">
      <template #header>生命周期（按审核类型差异化）</template>
      <div class="life-title">审核流程 · {{ (plan || record)?.auditType }}</div>
      <el-timeline>
        <el-timeline-item v-for="s in lifecycle" :key="s.key" :type="s.active ? 'primary' : 'info'" :hollow="!s.active">
          <span :class="{ 'step-active': s.active }">{{ s.label }}</span>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header>谁审核过（会签链 · 审核组：{{ plan?.actualAuditors || plan?.auditorTeam }}）</template>
      <div class="appr-hint" v-if="plan">
        需 <b>{{ approvals.length }}</b> 人（{{ plan.actualAuditors || plan.auditorTeam }}）全部签字通过，方可开始执行
        <el-tag v-if="allApproved" size="small" type="success" effect="plain">已全部会签，可进入下一流程</el-tag>
        <el-tag v-else size="small" type="warning" effect="plain">待会签 {{ approvals.filter(a=>a.status==='done').length }}/{{ approvals.length }}</el-tag>
      </div>
      <el-timeline v-loading="loadingApprovals">
        <el-timeline-item
          v-for="a in approvals"
          :key="a.id"
          :type="approvalColor(a.status)"
          :hollow="a.status === 'pending'"
          :timestamp="a.operateDate || '待会签'"
        >
          <div class="approval-node">
            <div class="approval-head">
              <span class="role-label">
                {{ a.roleLabel }}
                <el-tag v-if="a.hasVeto" size="small" type="danger" effect="plain">一票否决</el-tag>
              </span>
              <el-tag size="small" :type="approvalColor(a.status)">
                {{ approvalText(a.status) }}
              </el-tag>
            </div>
            <div class="approval-meta">
              <span>执行人：{{ a.operator || '—' }}</span>
              <span v-if="a.approverId">指定审批人：{{ userName(a.approverId) }}</span>
              <span v-else>指定审批人：不限定</span>
              <span v-if="a.opinion">意见：{{ a.opinion }}</span>
            </div>
            <el-button
              v-if="a.status === 'pending'"
              link type="primary" size="small"
              @click="openApprove(a)"
            >会签</el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-card class="card" shadow="never" v-if="logs.length">
      <template #header>流程轨迹</template>
      <el-timeline>
        <el-timeline-item v-for="(w, i) in logs" :key="w.id || i" type="success" :timestamp="w.createdAt" placement="top">
          <b>{{ w.action }}</b>
          <span class="mono" style="color:#8a8780; margin-left:8px">{{ w.operator }}</span>
          <div v-if="w.remark" class="log-remark">{{ w.remark }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header>不符合项（{{ ncs.length }}）</template>
      <el-table :data="ncs" border size="small" empty-text="无不符合项">
        <el-table-column prop="ncNo" label="编号" width="130" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="ncLevelType(row.level)">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="clause" label="条款" width="140" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="responsible" label="责任人" width="110" />
        <el-table-column prop="deadline" label="期限" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="ncStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyBy" label="验证人" width="100" />
      </el-table>
    </el-card>

    <el-dialog v-model="approveVisible" title="审核会签" width="420px">
      <el-form label-width="72px">
        <el-form-item label="会签角色">
          <el-tag>{{ approveTarget?.roleLabel }}</el-tag>
          <el-tag v-if="approveTarget?.hasVeto" size="small" type="danger" effect="plain" style="margin-left:8px">一票否决</el-tag>
        </el-form-item>
        <el-form-item label="决议">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意见">
          <el-input v-model="approveForm.opinion" type="textarea" :rows="3" placeholder="会签意见（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitApprove">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { auditExecuteApi } from '@/api/modules/sqm/auditExecute'
import type { SqmAuditPlan, SqmAuditRecord, SqmAuditNc, SqmAuditApproval, SqmAuditWorkflowLog, SqmSupplier, SqmAuditChecklistItem } from '@/api/types/sqm'
import { auditMeta, parseExt, processStepsOf } from '@/views/sqm/auditTypeMeta'

const route = useRoute()
const router = useRouter()

const plan = ref<SqmAuditPlan | null>(null)
const record = ref<SqmAuditRecord | null>(null)
const checklist = ref<Partial<SqmAuditChecklistItem>[]>([])
const ncs = ref<SqmAuditNc[]>([])
const approvals = ref<SqmAuditApproval[]>([])
const logs = ref<SqmAuditWorkflowLog[]>([])
const loadingApprovals = ref(false)
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
const submitting = ref(false)

const approveVisible = ref(false)
const approveTarget = ref<SqmAuditApproval | null>(null)
const approveForm = ref({ approved: true, opinion: '' })

function statusType(s?: string): '' | 'info' | 'warning' | 'success' | 'primary' {
  if (s === '已完成') return 'success'
  if (s === '进行中') return 'warning'
  if (s === '待执行') return 'primary'
  return 'info'
}
function resultType(s?: string): '' | 'success' | 'danger' | 'warning' {
  if (s === '通过') return 'success'
  if (s === '不通过') return 'danger'
  return 'warning'
}
function approvalColor(s?: string): 'primary' | 'success' | 'danger' | 'info' {
  if (s === 'done') return 'success'
  if (s === 'rejected') return 'danger'
  return 'info'
}
function approvalText(s?: string): string {
  if (s === 'done') return '已通过'
  if (s === 'rejected') return '已驳回'
  return '待会签'
}
function ncLevelType(s?: string): 'danger' | 'warning' | 'info' { return { '严重': 'danger', '一般': 'warning', '观察项': 'info' }[s || ''] as any || 'info' }
function ncStatusType(s?: string): 'info' | 'warning' | 'success' { return { '待整改': 'warning', '待验证': 'warning', '已闭环': 'success' }[s || ''] as any || 'info' }
function extVal(json?: string, key?: string): string {
  if (!key) return '—'
  const v = parseExt(json)[key]
  if (v === undefined || v === null || v === '') return '—'
  return typeof v === 'object' ? JSON.stringify(v) : String(v)
}

// 审核组会签是否全部通过
const allApproved = computed(() => approvals.value.length > 0 && approvals.value.every(a => a.status === 'done'))

// 单条生命周期时间线:按真实数据驱动激活(计划/记录/检查项/不符合项/复核进度),而非分两列重复展示
const reviewDone = computed(() => {
  const r = approvals.value.find(a => a.approvalRole === 'review')
  return !!r && r.status === 'done'
})
const lifecycle = computed(() => {
  const steps = processStepsOf((plan.value || record.value)?.auditType || '')
  const hasRecord = !!record.value
  const planned = !!plan.value && plan.value.status !== '计划中' && plan.value.status !== '待执行'
  const onSite = checklist.value.length > 0
  const hasNc = ncs.value.length > 0
  const archived = reviewDone.value || record.value?.status === '已完成'
  return steps.map((s, i) => {
    let active = false
    if (i === 0) active = true
    else if (i === 1) active = planned
    else if (i === 2) active = hasRecord && onSite
    else if (i === 3) active = hasNc || archived
    else if (i === steps.length - 1) active = archived
    else active = planned
    return { key: s.key, label: s.label, active }
  })
})

async function load() {
  const recordId = route.params.recordId as string
  if (!recordId) return
  record.value = await sqmAuditApi.getRecord(recordId)
  checklist.value = await auditExecuteApi.listChecklist(recordId)
  const planId = record.value.planId
  if (planId) {
    plan.value = await sqmAuditApi.getPlan(planId)
    await loadApprovals(planId)
    logs.value = await auditExecuteApi.workflowLog(planId)
  }
  const all = await sqmAuditApi.listNcs()
  ncs.value = all.filter(n => n.recordId === recordId)
  await loadSuppliers()
}
async function loadSuppliers() { try { suppliers.value = await sqmSupplierApi.list() } catch { suppliers.value = [] } }

async function loadApprovals(planId: string) {
  loadingApprovals.value = true
  try {
    approvals.value = await sqmAuditApi.listApprovals(planId)
  } finally {
    loadingApprovals.value = false
  }
}

function openApprove(a: SqmAuditApproval) {
  approveTarget.value = a
  approveForm.value = { approved: true, opinion: '' }
  approveVisible.value = true
}

async function submitApprove() {
  if (!approveTarget.value || !plan.value?.id) return
  submitting.value = true
  try {
    await sqmAuditApi.approve(plan.value.id, {
      approvalRole: approveTarget.value.approvalRole,
      approved: approveForm.value.approved,
      opinion: approveForm.value.opinion,
    })
    ElMessage.success('会签已提交')
    approveVisible.value = false
    await loadApprovals(plan.value.id)
  } finally {
    submitting.value = false
  }
}

function downloadReport() {
  if (!record.value?.id) return
  sqmAuditApi.downloadReport(record.value.id).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-report-${(record.value?.recordNo) || record.value?.id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  })
}

function goBack() {
  router.back()
}

onMounted(load)
</script>

<style scoped>
.audit-record-detail { padding: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card { margin-bottom: 16px; }
.approval-node { display: flex; flex-direction: column; gap: 6px; }
.approval-head { display: flex; align-items: center; gap: 8px; }
.role-label { font-weight: 600; }
.approval-meta { display: flex; gap: 16px; color: #666; font-size: 13px; flex-wrap: wrap; }
.appr-hint { font-size: 13px; color: #606266; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.life-title { font-weight: 600; margin-bottom: 8px; color: #333; }
.step-active { font-weight: 600; color: #409eff; }
</style>
