<template>
  <div class="change-detail">
    <div class="toolbar">
      <el-button @click="goBack">返回</el-button>
      <div class="toolbar-actions">
        <el-button v-if="detail?.order.status === '已批准' && canCreateFia && !relatedFia" type="primary" @click="goCreateFia">创建首件任务</el-button>
        <el-button v-if="detail?.order.status === '已批准' && canClose" link type="warning" @click="closeChange">关闭</el-button>
        <el-button v-if="detail?.order.status === '已批准' && canRollback" link type="danger" @click="rollback">回滚</el-button>
      </div>
    </div>

    <!-- 头部概览 -->
    <el-card shadow="never" class="card-b head-card">
      <div class="head-row">
        <div class="head-main">
          <div class="change-no mono">{{ detail?.order.changeNo }}</div>
          <div class="change-title">{{ detail?.order.title }}</div>
          <div class="change-sub">
            <span class="mono">{{ detail?.order.partNo || '—' }}</span>
            <el-divider direction="vertical" />
            <span>{{ detail?.order.changeType || '—' }}</span>
            <el-divider direction="vertical" />
            <span>申请人 {{ detail?.order.applicant || '—' }}</span>
          </div>
        </div>
        <div class="head-status">
          <span class="pill" :class="changeStatusClass(detail?.order.status || '')"><span class="d"></span>{{ detail?.order.status }}</span>
          <div class="risk-tag" :class="riskClass(detail?.order.riskPreMark)">风险 {{ detail?.order.riskPreMark || '—' }}</div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16">
      <!-- 左列:基本信息 + 供应商 -->
      <el-col :span="14">
        <el-card shadow="never" class="card-b">
          <template #header>变更信息</template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="变更编号" class="mono-cell">{{ detail?.order.changeNo }}</el-descriptions-item>
            <el-descriptions-item label="料号" class="mono-cell">{{ detail?.order.partNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="变更类型">{{ detail?.order.changeType || '—' }}</el-descriptions-item>
            <el-descriptions-item label="紧急度">{{ detail?.order.urgency || '—' }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ detail?.order.applicant || '—' }}</el-descriptions-item>
            <el-descriptions-item label="申请日期">{{ detail?.order.applyDate || '—' }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ detail?.order.source || '—' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <span class="pill" :class="changeStatusClass(detail?.order.status || '')">{{ detail?.order.status }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="料号对照" :span="2">
              <span v-if="detail?.order.oldPartNo || detail?.order.newPartNo">{{ detail?.order.oldPartNo || '—' }} → {{ detail?.order.newPartNo || '—' }}</span>
              <span v-else class="muted">—</span>
            </el-descriptions-item>
            <el-descriptions-item label="计划生效日">{{ detail?.order.effDate || '—' }}</el-descriptions-item>
            <el-descriptions-item label="切换日期">{{ detail?.order.switchDate || '—' }}</el-descriptions-item>
            <el-descriptions-item label="影响范围" :span="2">{{ detail?.order.impactDesc || '—' }}</el-descriptions-item>
            <el-descriptions-item label="变更说明" :span="2">{{ detail?.order.reason || '—' }}</el-descriptions-item>
            <el-descriptions-item label="加严检验" :span="2">
              <el-tag v-if="detail?.order.strictFlag" size="small" type="warning">需要</el-tag>
              <el-tag v-else size="small" type="info">不需要</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="评估附件" :span="2">
              <el-tag v-if="detail?.order.verifyReport" size="small" type="success" style="margin-right:6px;cursor:pointer" @click="downloadFile(detail!.order.verifyReport!, `验证报告-${detail!.order.changeNo}`)">验证报告 ↓</el-tag>
              <el-tag v-if="detail?.order.riskFile" size="small" type="warning" style="cursor:pointer" @click="downloadFile(detail!.order.riskFile!, `风险评估-${detail!.order.changeNo}`)">风险评估 ↓</el-tag>
              <span v-if="!detail?.order.verifyReport && !detail?.order.riskFile" class="muted">无</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="card-b">
          <template #header>
            供应商信息
            <el-button v-if="detail?.order.supplierId" link type="primary" size="small" style="float:right" @click="goSupplier(detail.order.supplierId!)">查看档案 ›</el-button>
          </template>
          <el-descriptions v-if="detailSupplier" :column="2" border size="small">
            <el-descriptions-item label="名称">{{ detailSupplier.name }}</el-descriptions-item>
            <el-descriptions-item label="编码">{{ detailSupplier.supplierCode || detailSupplier.supplierNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="等级">
              <el-tag v-if="detailSupplier.level" size="small">{{ detailSupplier.level }}</el-tag>
              <span v-else class="muted">—</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">{{ detailSupplier.status || '—' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detailSupplier.contactPerson || '—' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ detailSupplier.contactPhone || '—' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="无供应商信息" :image-size="48" />
        </el-card>
      </el-col>

      <!-- 右列:绑定闭环追踪(核心) -->
      <el-col :span="10">
        <el-card shadow="never" class="card-b trace-card">
          <template #header>
            绑定闭环追踪
            <span class="head-tip">变更 → 首件 → SPC</span>
          </template>

          <!-- 三节点横向流程 -->
          <div class="trace-flow">
            <div class="trace-node" :class="nodeState('change')">
              <div class="tn-ico">ECN</div>
              <div class="tn-title">物料变更</div>
              <span class="pill" :class="changeStatusClass(detail?.order.status || '')">{{ detail?.order.status }}</span>
            </div>
            <div class="trace-arrow">›</div>
            <div class="trace-node clickable" :class="nodeState('fia')" @click="relatedFia && goFia(relatedFia.id)">
              <div class="tn-ico">FIA</div>
              <div class="tn-title">首件验证</div>
              <template v-if="relatedFia">
                <span class="pill" :class="fiaStatusClass(relatedFia.status)">{{ relatedFia.status }}</span>
                <div v-if="relatedFia.overallJudge" class="tn-judge" :class="fiaJudgeClass(relatedFia.overallJudge)">{{ relatedFia.overallJudge }}</div>
                <div class="tn-code mono">{{ relatedFia.code }}</div>
              </template>
              <span v-else class="tn-empty">未创建</span>
            </div>
            <div class="trace-arrow">›</div>
            <div class="trace-node clickable" :class="nodeState('spc')" @click="spcParams.length && goSpc(spcParams[0].id)">
              <div class="tn-ico">SPC</div>
              <div class="tn-title">过程能力</div>
              <template v-if="spcParams.length">
                <span class="pill p-done">{{ spcParams.length }} 项参数</span>
                <div class="tn-code mono">点击查看控制图</div>
              </template>
              <span v-else class="tn-empty">{{ relatedFia ? '待采集' : '—' }}</span>
            </div>
          </div>

          <!-- 节点明细 / 操作 -->
          <div class="trace-detail">
            <div v-if="relatedFia" class="td-row">
              <span class="td-label">首件任务</span>
              <span class="td-val mono">{{ relatedFia.code }} · {{ relatedFia.productName || '—' }} / {{ relatedFia.procName || '—' }}</span>
              <el-button link type="primary" size="small" @click="goFia(relatedFia.id)">查看首件 ›</el-button>
            </div>
            <div v-if="spcParams.length" class="td-row">
              <span class="td-label">SPC 参数</span>
              <span class="td-val">{{ spcParams.map(p => p.paramName).join('、') }}</span>
              <el-button link type="primary" size="small" @click="goSpc(spcParams[0].id)">查看控制图 ›</el-button>
            </div>
            <div v-if="!relatedFia && detail?.order.status === '已批准' && canCreateFia" class="td-row">
              <span class="td-label">首件验证</span>
              <span class="td-val muted">尚未创建关联首件任务</span>
              <el-button type="primary" size="small" @click="goCreateFia">创建首件任务</el-button>
            </div>
          </div>
        </el-card>

        <!-- 加严检验 -->
        <el-card shadow="never" class="card-b" v-if="detail?.strictInspects && detail.strictInspects.length">
          <template #header>加严检验（变更后验证）</template>
          <el-table :data="detail.strictInspects" size="small" border>
            <el-table-column label="批次" width="70"><template #default="{row}">{{ row.seq || '—' }}/{{ row.totalSeq || '—' }}</template></el-table-column>
            <el-table-column prop="strictNo" label="加严单号" min-width="130" />
            <el-table-column prop="aqlLevel" label="AQL" width="64" />
            <el-table-column label="结果" width="86"><template #default="{row}">
              <el-tag v-if="row.result==='合格'" size="small" type="success">合格</el-tag>
              <el-tag v-else-if="row.result==='不合格'" size="small" type="danger">不合格</el-tag>
              <el-tag v-else size="small" type="info">待检</el-tag>
            </template></el-table-column>
            <el-table-column label="日期" width="100"><template #default="{row}">{{ row.inspectDate || '—' }}</template></el-table-column>
          </el-table>
        </el-card>

        <!-- 关联审核计划 -->
        <el-card shadow="never" class="card-b" v-if="relatedAudits.length">
          <template #header>关联审核计划（双向追溯）</template>
          <el-table :data="relatedAudits" size="small" border>
            <el-table-column prop="planNo" label="计划编号" min-width="150" />
            <el-table-column prop="auditType" label="类型" width="110" />
            <el-table-column label="状态" width="84"><template #default="{row}"><el-tag size="small" :type="planStatusType(row.status)">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="100"><template #default="{row}"><el-button link type="primary" size="small" @click="goAudit(row.id, row.recordId)">查看 ›</el-button></template></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 三方会签链 -->
    <el-card shadow="never" class="card-b" v-if="detail?.approvals.length">
      <template #header>签字进度（采购 → 研发 → 质量，串行）</template>
      <el-timeline>
        <el-timeline-item
          v-for="a in sortedApprovals"
          :key="a.id"
          :type="a.status==='done' ? 'success' : a.status==='rejected' ? 'danger' : 'primary'"
          :hollow="a.status === 'pending'"
          :timestamp="a.operateDate ? String(a.operateDate).replace('T',' ').slice(0,16) : '待审批'"
        >
          <div class="approval-node">
            <div class="approval-head">
              <span class="role-label">{{ a.roleLabel || a.approvalRole }}</span>
              <el-tag size="small" :type="a.status==='done'?'success':a.status==='rejected'?'danger':'info'">{{ a.status==='done'?'已通过':a.status==='rejected'?'已驳回':'待审批' }}</el-tag>
            </div>
            <div class="approval-meta">
              <span>签字人：{{ a.operator || '—' }}</span>
              <span v-if="a.opinion">意见：{{ a.opinion }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 流程轨迹 -->
    <el-card shadow="never" class="card-b">
      <template #header>变更全生命周期</template>
      <el-timeline>
        <el-timeline-item
          v-for="node in changeTimeline"
          :key="node.key"
          :type="node.done ? 'success' : node.aborted ? 'danger' : 'info'"
          :hollow="!node.active"
        >
          <span :class="['tl-label']">
            {{ node.label }}
            <el-tag v-if="node.done" size="small" type="success">已完成</el-tag>
            <el-tag v-else-if="node.aborted" size="small" type="danger">已终止</el-tag>
            <el-tag v-else size="small" type="info">未开始</el-tag>
          </span>
          <div v-if="node.hint" class="tl-hint">{{ node.hint }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import { sqmChangeApi } from '@/api/modules/sqm/changes'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { spcParamApi } from '@/api/modules/spc/params'
import { fileApi } from '@/api/modules/common/files'
import type { SqmChangeOrderVo, SqmChangeApproval, SqmSupplier, SqmAuditPlan, SqmChangeStrictInspect } from '@/api/types/sqm'
import type { FiaTask } from '@/api/types/fia'
import type { SpcParam } from '@/api/types/spc'

const route = useRoute()
const router = useRouter()
const perm = usePermissionStore()
const canCreateFia = computed(() => perm.has('sqm.change.createFia'))
const canClose = computed(() => perm.has('sqm.change.close'))
const canRollback = computed(() => perm.has('sqm.change.rollback'))

const detail = ref<SqmChangeOrderVo | null>(null)
const detailSupplier = ref<SqmSupplier | null>(null)
const relatedAudits = ref<SqmAuditPlan[]>([])
const relatedFia = ref<FiaTask | null>(null)
const spcParams = ref<SpcParam[]>([])
const sortedApprovals = computed(() => detail.value ? [...detail.value.approvals].sort((a, b) => (a.seqOrder || 99) - (b.seqOrder || 99)) : [])

async function load() {
  const id = route.params.id as string
  if (!id) return
  detail.value = await sqmChangeApi.get(id)
  const sid = detail.value.order.supplierId
  if (sid) { try { detailSupplier.value = await sqmSupplierApi.get(sid) } catch { detailSupplier.value = null } }
  try { relatedAudits.value = await sqmAuditApi.listByChangeId(id) } catch { relatedAudits.value = [] }
  try {
    relatedFia.value = await fiaTaskApi.byChange(id)
    if (relatedFia.value) {
      try { spcParams.value = await spcParamApi.fromFiaTask(relatedFia.value.id) } catch { spcParams.value = [] }
    }
  } catch { relatedFia.value = null }
}

// 三节点状态(用于横向流程高亮)
function nodeState(node: 'change' | 'fia' | 'spc'): string {
  if (node === 'change') return 'is-active'
  if (node === 'fia') return relatedFia.value ? 'is-active' : 'is-idle'
  if (node === 'spc') return spcParams.value.length ? 'is-active' : 'is-idle'
  return ''
}

function goBack() { router.back() }
function goCreateFia() { router.push({ path: '/fia/tasks/create', query: { changeId: route.params.id } }) }
function goFia(id: string) { router.push(`/fia/tasks/${id}`) }
function goSpc(id: string) { router.push(`/spc/params/${id}`) }
function goSupplier(id: string) { router.push({ path: '/sqm/suppliers', query: { supplierId: id } }) }
function goAudit(planId: string, recordId?: string) {
  if (recordId) router.push(`/sqm/audits/record/${recordId}`)
  else router.push(`/sqm/audits/execute/${planId}`)
}

async function closeChange() {
  const id = route.params.id as string
  await sqmChangeApi.close(id); ElMessage.success('已关闭'); load()
}
async function rollback() {
  const id = route.params.id as string
  const { value } = await ElMessageBox.prompt('请输入回滚原因', '回滚变更', { confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => ({ value: '' }))
  if (!value) return
  await sqmChangeApi.rollback(id, value); ElMessage.success('已回滚'); load()
}

async function downloadFile(path: string, name: string) {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : ''
  await fileApi.download(path, name + ext)
}

function fiaStatusClass(s: string): string {
  return ({ '待检': 'p-wait', '进行中': 'p-run', '待复核': 'p-sign', '待批准': 'p-sign', '已完成': 'p-done', '已作废': 'p-mute' } as Record<string, string>)[s] || 'p-mute'
}
function fiaJudgeClass(j: string): string {
  return ({ '合格': 'p-done', '警告': 'p-run', '不合格': 'p-lock' } as Record<string, string>)[j] || 'p-mute'
}
function planStatusType(s: string): 'info' | 'success' | 'warning' | 'primary' {
  if (s === '已完成') return 'success'
  if (s === '进行中') return 'warning'
  if (s === '待执行') return 'primary'
  return 'info'
}
function riskClass(l?: string) { return ({ '高': 'p-lock', '中': 'p-wait', '低': 'p-done' } as Record<string, string>)[l || ''] || '' }
function changeStatusClass(s: string) { return ({ '待申请': 'p-wait', '审批中': 'p-run', '已批准': 'p-done', '已驳回': 'p-lock', '已关闭': 'p-done', '已回滚': 'p-lock' } as Record<string, string>)[s] || '' }

const CHANGE_FLOW = [
  { key: 'apply', label: '申请', hint: '变更提出' },
  { key: 'approve', label: '审批中', hint: '采购→研发→质量' },
  { key: 'approved', label: '已批准', hint: '待首件/SPC 验证' },
  { key: 'close', label: '关闭/归档', hint: '首件合格 + SPC 连续稳定后归档' },
]
const changeTimeline = computed(() => {
  const s = detail.value?.order?.status
  const aborted = s === '已驳回' || s === '已回滚'
  let activeIndex = 0
  if (s === '待申请') activeIndex = 0
  else if (s === '审批中') activeIndex = 1
  else if (s === '已批准') activeIndex = 2
  else if (s === '已关闭' || s === '已回滚') activeIndex = 3
  else if (aborted) activeIndex = 1
  return CHANGE_FLOW.map((n, i) => ({
    ...n,
    active: i <= activeIndex,
    done: i < activeIndex || ((s === '已关闭' || s === '已回滚') && i <= activeIndex),
    aborted: aborted && i === 1,
    type: aborted && i === 1 ? 'danger' : (i <= activeIndex ? 'success' : 'info'),
  }))
})

onMounted(load)
</script>

<style lang="scss" scoped>
.change-detail { width: 100%; padding: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; margin-bottom: 16px; }
.muted { color: $ink-faint; }

/* 头部概览 */
.head-card { padding: 4px 8px; }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.head-main { min-width: 0; }
.change-no { font-family: $font-mono; font-size: 12px; color: $ink-faint; letter-spacing: 1px; }
.change-title { font-family: $font-display; font-size: 22px; font-weight: 800; margin: 4px 0 6px; }
.change-sub { font-size: 13px; color: $ink; display: flex; align-items: center; gap: 4px; }
.head-status { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.risk-tag { font-size: 12px; padding: 2px 10px; border-radius: 20px; background: #eee; color: $ink-faint; }
.risk-tag.p-lock { background: $signal-red-dim; color: $signal-red; }
.risk-tag.p-wait { background: $amber-dim; color: $amber; }
.risk-tag.p-done { background: $green-dim; color: $green; }

/* pill（复用原型 token，禁止硬编码色值） */
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-lock { background: $signal-red-dim; color: $signal-red; } .p-lock .d { background: $signal-red; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.p-mute { background: #eee; color: $ink-faint; } .p-mute .d { background: $ink-faint; }

.mono-cell :deep(.el-descriptions__content) { font-family: $font-mono; }
.head-tip { font-size: 12px; color: $ink-faint; font-family: $font-mono; margin-left: 8px; }

/* 绑定闭环追踪 */
.trace-flow { display: flex; align-items: stretch; gap: 4px; }
.trace-node {
  flex: 1; border: 1px solid $hairline; border-radius: 10px; padding: 14px 10px;
  display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
  background: $white; transition: all .2s;
}
.trace-node.is-active { border-color: $cobalt; background: $cobalt-dim; }
.trace-node.is-idle { opacity: .72; }
.trace-node.clickable { cursor: pointer; }
.trace-node.clickable:hover { box-shadow: 0 2px 10px rgba(0,0,0,.06); }
.tn-ico { font-family: $font-mono; font-size: 12px; font-weight: 700; color: $ink; background: #f2f0ec; border-radius: 6px; padding: 2px 8px; }
.is-active .tn-ico { color: $cobalt; background: #fff; }
.tn-title { font-weight: 600; font-size: 13px; }
.tn-judge { font-size: 12px; font-weight: 600; }
.tn-judge.p-done { color: $green; }
.tn-judge.p-run { color: $amber; }
.tn-judge.p-lock { color: $signal-red; }
.tn-code { font-size: 11px; color: $ink-faint; }
.tn-empty { font-size: 12px; color: $ink-faint; }
.trace-arrow { display: flex; align-items: center; font-size: 20px; color: $ink-faint; }

.trace-detail { margin-top: 14px; border-top: 1px dashed $hairline; padding-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.td-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.td-label { color: $ink-faint; width: 72px; flex-shrink: 0; }
.td-val { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: $font-mono; }

/* 会签链 */
.approval-node { display: flex; flex-direction: column; gap: 6px; }
.approval-head { display: flex; align-items: center; gap: 8px; }
.role-label { font-weight: 600; }
.approval-meta { display: flex; gap: 16px; color: #666; font-size: 13px; flex-wrap: wrap; }

/* 流程轨迹 */
.tl-label { display: inline-flex; align-items: center; gap: 8px; }
.tl-hint { color: $ink-faint; font-size: 12px; margin-top: 2px; }
</style>
