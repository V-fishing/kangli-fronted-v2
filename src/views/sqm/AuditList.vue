<template>
  <div class="audit-list">
    <div class="head-b">
      <div>
        <div class="crumb">SQM / 供应商质量</div>
        <h1>供应商审核</h1>
      </div>
      <el-button size="small" @click="goConfig">审核人员配置</el-button>
    </div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态"><el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px"><el-option v-for="s in ['计划中','待执行','进行中','已完成']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="类型"><el-select v-model="filterType" clearable placeholder="全部" style="width:140px"><el-option v-for="t in auditTypeKeys" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
        <el-form-item v-if="filterSupplierId"><el-tag closable type="warning" @close="clearSupplierFilter">供应商: {{ filterSupplierName || filterSupplierId }}</el-tag></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe>
        <el-table-column prop="planNo" label="计划编号" width="150" />
        <el-table-column label="供应商" min-width="160"><template #default="{row}">{{ supplierName((row as SqmAuditPlan).supplierId) }}</template></el-table-column>
        <el-table-column prop="auditType" label="审核类型" width="120" />
        <el-table-column prop="auditorTeam" label="审核组" min-width="130"><template #default="{row}"><span>{{ (row as SqmAuditPlan).actualAuditors || (row as SqmAuditPlan).auditorTeam || '—' }}</span><el-tag v-if="(row as SqmAuditPlan).actualAuditors" size="small" type="success" effect="plain" style="margin-left:6px">已参与</el-tag></template></el-table-column>
        <el-table-column prop="riskLevel" label="风险" width="60"><template #default="{row}"><span class="pill" :class="riskClass((row as SqmAuditPlan).riskLevel)">{{ (row as SqmAuditPlan).riskLevel || '无' }}</span></template></el-table-column>
        <el-table-column prop="planDate" label="计划日期" width="110" />
        <el-table-column label="状态" width="90"><template #default="{row}"><span class="pill" :class="planStatusClass((row as SqmAuditPlan).status)"><span class="d"></span>{{ (row as SqmAuditPlan).status }}</span></template></el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="openDetail(row as SqmAuditPlan)">详情</el-button>
            <el-button v-if="(row as SqmAuditPlan).status==='待执行'" link type="success" size="small" @click="start(row as SqmAuditPlan)">开始执行</el-button>
            <el-button v-if="recordIdOf(row as SqmAuditPlan)" link type="primary" size="small" @click="downloadReport(row as SqmAuditPlan)">下载报告</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="审核详情" width="760px">
      <template v-if="detailRow">
        <el-descriptions :column="2" border size="small" class="mb">
          <el-descriptions-item label="计划编号">{{ detailRow.planNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="small" :type="planStatusType(detailRow.status)">{{ detailRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="供应商">{{ supplierName(detailRow.supplierId) }}</el-descriptions-item>
          <el-descriptions-item label="审核类型">{{ detailRow.auditType }}</el-descriptions-item>
          <el-descriptions-item label="组长">{{ detailRow.auditLead }}</el-descriptions-item>
          <el-descriptions-item label="审核组">{{ detailRow.actualAuditors || detailRow.auditorTeam || '—' }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">{{ detailRow.riskLevel || '无' }}</el-descriptions-item>
          <el-descriptions-item label="计划日期">{{ detailRow.planDate }}</el-descriptions-item>
          <el-descriptions-item label="范围" :span="2">{{ detailRow.scope }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detailRow.changeId" class="section-title">
          来源变更单
          <el-tag size="small" type="info" effect="plain" style="margin-left:6px">双向追溯</el-tag>
        </div>
        <el-descriptions v-if="detailRow.changeId" :column="2" border size="small" class="mb">
          <el-descriptions-item label="变更单号">{{ sourceChange?.changeNo || detailRow.changeId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="sourceChange" size="small" :type="changeStatusType(sourceChange.status)">{{ sourceChange.status }}</el-tag>
            <span v-else>加载中…</span>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ sourceChange?.title || '—' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detailRow.changeId" class="mb" style="margin-top:4px">
          <el-button size="small" type="primary" link @click="goChange(detailRow.changeId!)">查看变更单详情 ›</el-button>
        </div>

        <div class="section-title">类型特有信息（{{ detailRow.auditType }}）</div>
        <el-descriptions v-if="auditMeta(detailRow.auditType)?.fields?.length" :column="2" border size="small" class="mb">
          <el-descriptions-item v-for="f in auditMeta(detailRow.auditType)!.fields" :key="f.key" :label="f.label">{{ extVal(detailRow.extJson, f.key) }}</el-descriptions-item>
        </el-descriptions>
        <div v-else class="empty-hint">该审核类型暂无特有字段配置</div>

        <div class="section-title">生命周期线（点击节点跳转记录详情）</div>
        <el-timeline>
          <el-timeline-item
            v-for="node in timeline"
            :key="node.key"
            :type="node.active ? 'success' : 'info'"
            :hollow="!node.active"
          >
            <span :class="['tl-label', { 'tl-click': node.clickable }]" @click="node.clickable && goRecord(detailRow)">
              {{ node.label }}
              <el-tag v-if="node.active" size="small" type="success">已完成</el-tag>
              <el-tag v-else size="small" type="info">未开始</el-tag>
              <span v-if="node.clickable" class="tl-arrow">跳转 ›</span>
            </span>
          </el-timeline-item>
        </el-timeline>

        <!-- 联动审核:变更已审批,审核会签视为已完成,无需独立会签 -->
        <template v-if="detailRow.changeId">
          <div class="section-title">会签状态（变更审批联动）</div>
          <el-alert type="success" :closable="false" style="margin-bottom:12px">
            <template #title>
              该审核由变更单联动生成，变更已通过 <b>采购→研发→质量</b> 三方审批，<b>审核可直接开始执行</b>，无需独立会签。
            </template>
          </el-alert>
        </template>
        <!-- 独立审核:需审核组全部会签通过后方可开始 -->
        <template v-else>
        <div class="section-title">会签链（审核组：{{ detailRow.actualAuditors || detailRow.auditorTeam }}）</div>
        <div class="appr-hint" v-if="detailRow">
          需 <b>{{ approvals.length }}</b> 人（{{ detailRow.actualAuditors || detailRow.auditorTeam }}）全部签字通过，方可开始执行
          <el-tag v-if="allApproved" size="small" type="success" effect="plain">已全部会签，可进入下一流程</el-tag>
          <el-tag v-else size="small" type="warning" effect="plain">待会签 {{ approvals.filter(a=>a.status==='done').length }}/{{ approvals.length }}</el-tag>
        </div>
        <el-timeline v-loading="loadingApprovals">
          <el-timeline-item
            v-for="a in approvals"
            :key="a.id"
            :type="a.status==='done' ? 'success' : a.status==='rejected' ? 'danger' : 'info'"
            :hollow="a.status==='pending'"
          >
            <div class="appr-row">
              <span class="appr-role">
                {{ a.roleLabel }}
                <el-tag v-if="a.hasVeto" size="small" type="danger" effect="plain">一票否决</el-tag>
              </span>
              <span class="appr-status">{{ a.status==='done' ? '已通过' : a.status==='rejected' ? '已驳回' : '待会签' }}</span>
              <span class="appr-actions" v-if="canSign(a)">
                <el-button type="success" link size="small" @click="signAudit(a, true)">通过</el-button>
                <el-button type="danger" link size="small" @click="signAudit(a, false)">驳回</el-button>
              </span>
            </div>
            <div class="appr-meta">执行人：{{ a.operator || '—' }}<span v-if="a.opinion">｜意见：{{ a.opinion }}</span></div>
          </el-timeline-item>
        </el-timeline>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmChangeApi } from '@/api/modules/sqm/changes'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import type { SqmAuditPlan, SqmAuditApproval, SqmAuditRecord, SqmSupplier, SqmChangeOrder } from '@/api/types/sqm'
import { AUDIT_TYPE_META, auditMeta, parseExt, processStepsOf } from '@/views/sqm/auditTypeMeta'

const route = useRoute()
const router = useRouter()
// 审核类型选项(来自元数据配置,单一数据源)
const auditTypeKeys = Object.keys(AUDIT_TYPE_META)
const list = ref<SqmAuditPlan[]>([])
const loading = ref(false)
const filterStatus = ref(''), filterType = ref('')
// 从供应商详情跳转而来时按供应商过滤
const filterSupplierId = ref((route.query.supplierId as string) || '')
const filterSupplierName = ref((route.query.supplierName as string) || '')

const detailVisible = ref(false)
const detailRow = ref<SqmAuditPlan | null>(null)
const approvals = ref<SqmAuditApproval[]>([])
// 来源变更单概要(双向追溯: 物料变更审核 → 变更单)
const sourceChange = ref<SqmChangeOrder | null>(null)
const loadingApprovals = ref(false)
// 供应商名称映射,用于列表/详情展示供应商名(supplierId → name)
const suppliers = ref<SqmSupplier[]>([])
const supplierNameMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const s of suppliers.value) if (s.id) m[s.id] = s.name
  return m
})
function supplierName(id?: string): string {
  return (id && supplierNameMap.value[id]) || id || '—'
}
// 记录按 planId 映射,用于在不依赖 plan.recordId 的情况下定位记录详情(种子数据该字段常为空)
const records = ref<SqmAuditRecord[]>([])
const recordByPlan = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const r of records.value) if (r.planId && r.id) m[r.planId] = r.id
  return m
})
function recordIdOf(r?: SqmAuditPlan): string | undefined {
  if (!r) return undefined
  return recordByPlan.value[r.id] || r.recordId
}

function clearSupplierFilter() { filterSupplierId.value = ''; filterSupplierName.value = ''; router.replace({ query: {} }); fetch() }
async function fetch() { loading.value = true; try { const [all, recs] = await Promise.all([sqmAuditApi.listPlans(), sqmAuditApi.listRecords()]); records.value = recs; list.value = all.filter(r => (!filterStatus.value || r.status === filterStatus.value) && (!filterType.value || r.auditType === filterType.value) && (!filterSupplierId.value || r.supplierId === filterSupplierId.value)) } finally { loading.value = false } }
async function confirm(r: SqmAuditPlan) { try { await sqmAuditApi.confirmPlan(r.id); ElMessage.success('已确认'); fetch() } catch (e: any) { ElMessage.error(e?.response?.data?.msg || e?.message || '操作失败') } }
async function start(r: SqmAuditPlan) { try { await sqmAuditApi.startPlan(r.id); ElMessage.success('已开始'); fetch() } catch (e: any) { ElMessage.error(e?.response?.data?.msg || e?.message || '操作失败') } }

function planStatusType(s: string): '' | 'info' | 'warning' | 'success' | 'primary' {
  if (s === '已完成') return 'success'
  if (s === '进行中') return 'warning'
  if (s === '待执行') return 'primary'
  return 'info'
}

async function openDetail(r: SqmAuditPlan) {
  detailRow.value = r
  detailVisible.value = true
  loadingApprovals.value = true
  sourceChange.value = null
  try {
    approvals.value = await sqmAuditApi.listApprovals(r.id)
    // 双向追溯: 若该审核由变更单联动生成, 拉取来源变更单概要
    if (r.changeId) {
      try {
        console.log('[AuditList] 查询关联变更, changeId=', r.changeId)
        const result = await sqmChangeApi.get(r.changeId)
        sourceChange.value = result.order
        console.log('[AuditList] 关联变更结果 =', sourceChange.value?.changeNo || 'null')
      } catch (e: any) {
        console.warn('[AuditList] 查询关联变更失败', e?.message || e)
        sourceChange.value = null
      }
    }
  } finally { loadingApprovals.value = false }
}

const timeline = computed(() => {
  const r = detailRow.value
  if (!r) return []
  const hasRecord = !!recordIdOf(r)
  const steps = processStepsOf(r.auditType)   // 按审核类型差异化的流程步骤（{key,label}[]）
  const n = steps.length
  const lastThree = Math.max(0, n - 3)
  return steps.map((s, i) => {
    let active = false, clickable = false
    if (i === 0) { active = true }                                   // 计划创建: 恒激活
    else if (i >= lastThree) { active = hasRecord; clickable = hasRecord } // 实施/不符合项/归档: 关联记录
    else { active = r.status !== '计划中' }                          // 中间步骤: 计划确认后激活
    return { key: s.key, label: s.label, active, clickable }
  })
})

function extVal(json?: string, key?: string): string {
  if (!key) return '—'
  const v = parseExt(json)[key]
  if (v === undefined || v === null || v === '') return '—'
  return typeof v === 'object' ? JSON.stringify(v) : String(v)
}

// 审核组会签是否全部通过(全部通过方可进入下一流程)
const allApproved = computed(() => approvals.value.length > 0 && approvals.value.every(a => a.status === 'done'))
// 仅「待会签」(pending)节点可签字;已通过/已驳回的不可重复操作
function canSign(a: any) {
  return a.status === 'pending'
}
async function signAudit(a: any, approved: boolean) {
  if (!detailRow.value) return
  try {
    await sqmAuditApi.approve(detailRow.value.id, {
      approvalRole: a.approvalRole,
      approved,
      opinion: '',
    })
    ElMessage.success(approved ? '已通过' : '已驳回')
    approvals.value = await sqmAuditApi.listApprovals(detailRow.value.id)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '操作失败')
  }
}

function goRecord(r?: SqmAuditPlan) {
  const rid = recordIdOf(r)
  if (!rid) { ElMessage.warning('该审核暂无审核记录'); return }
  router.push(`/sqm/audits/record/${rid}`)
}

function downloadReport(r: SqmAuditPlan) {
  const rid = recordIdOf(r)
  if (!rid) { ElMessage.warning('该审核暂无审核记录'); return }
  sqmAuditApi.downloadReport(rid).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-report-${(r.planNo) || rid}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  })
}

function goConfig() { router.push('/system/audit-config') }
// 双向追溯: 跳转到来源变更单详情
function goChange(id: string) { console.log('[AuditList] goChange, changeId=', id); router.push({ path: '/sqm/changes', query: { changeId: id } }) }
function changeStatusType(s: string): '' | 'info' | 'warning' | 'success' | 'danger' {
  if (s === '已批准' || s === '已关闭') return 'success'
  if (s === '审批中') return 'warning'
  if (s === '已驳回' || s === '已回滚') return 'danger'
  return 'info'
}

function riskClass(l?: string) { return { '高': 'p-lock', '中': 'p-wait', '低': 'p-done' }[l || ''] || 'p-none' }
function planStatusClass(s: string) { return { '计划中': 'p-wait', '待执行': 'p-run', '进行中': 'p-run', '已完成': 'p-done' }[s] || '' }
onMounted(async () => {
  await fetch()
  await loadSuppliers()
  // 双向追溯: 从变更单详情跳转而来时, 自动打开指定审核计划
  const pid = route.query.planId as string
  if (pid) {
    const r = list.value.find(p => p.id === pid)
    if (r) openDetail(r)
    else ElMessage.info('未找到对应的审核计划')
  }
})
async function loadSuppliers() { try { suppliers.value = await sqmSupplierApi.list() } catch { suppliers.value = [] } }
</script>

<style lang="scss" scoped>
.audit-list { width: 100%; }
.head-b { margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-lock { background: $signal-red-dim; color: $signal-red; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.p-none { background: #f2f3f5; color: #a0a4ab; }

.section-title { font-weight: 600; margin: 16px 0 8px; color: $ink; }
.appr-hint { font-size: 13px; color: #606266; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mb { margin-bottom: 8px; }
.tl-label { display: inline-flex; align-items: center; gap: 8px; }
.tl-click { cursor: pointer; color: $cobalt; font-weight: 600; }
.tl-click:hover { text-decoration: underline; }
.tl-arrow { font-size: 12px; }
.appr-row { display: flex; align-items: center; gap: 10px; }
.appr-role { font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.appr-status { color: $ink-faint; font-size: 13px; }
.appr-meta { color: #666; font-size: 13px; margin-top: 2px; }
</style>
