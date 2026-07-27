<template>
  <div class="change-list">
    <div class="head-b"><div class="crumb">SQM / 供应商质量</div><h1>物料变更</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态"><el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px"><el-option v-for="s in ['待申请','审批中','已批准','已驳回','已关闭','已回滚']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
        <el-form-item v-if="filterSupplierId"><el-tag closable type="warning" @close="clearSupplierFilter">供应商: {{ filterSupplierName || filterSupplierId }}</el-tag></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建变更</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe>
        <el-table-column prop="changeNo" label="变更编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
        <el-table-column label="供应商" min-width="130" show-overflow-tooltip>
          <template #default="{row}"><el-link v-if="row.supplierId" type="primary" underline="never" @click="openDetail(row)">{{ row.supplierName || '—' }}</el-link><span v-else>—</span></template>
        </el-table-column>
        <el-table-column prop="partNo" label="料号" width="110"><template #default="{row}">{{ row.partNo || '—' }}</template></el-table-column>
        <el-table-column prop="changeType" label="变更类型" width="90"><template #default="{row}">{{ row.changeType || '—' }}</template></el-table-column>
        <el-table-column label="评估资料" width="200">
          <template #default="{row}">
            <el-tooltip v-if="row.reason" :content="row.reason" placement="top"><el-tag size="small" type="info" style="margin-right:4px">说明</el-tag></el-tooltip>
            <el-tag v-if="row.verifyReport" size="small" type="success" style="margin-right:4px;cursor:pointer" @click="downloadFile(row.verifyReport, `验证报告-${row.changeNo}`)">验证报告 ↓</el-tag>
            <el-tag v-if="row.riskFile" size="small" type="warning" style="cursor:pointer" @click="downloadFile(row.riskFile, `风险评估-${row.changeNo}`)">风险评估 ↓</el-tag>
            <span v-if="!row.reason && !row.verifyReport && !row.riskFile" class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="风险" width="60"><template #default="{row}"><span class="pill" :class="riskClass(row.riskPreMark)">{{ row.riskPreMark || '—' }}</span></template></el-table-column>
        <el-table-column prop="urgency" label="紧急度" width="70" />
        <el-table-column label="状态" width="90"><template #default="{row}"><span class="pill" :class="changeStatusClass(row.status)"><span class="d"></span>{{ row.status }}</span></template></el-table-column>
        <el-table-column prop="applicant" label="申请人" width="100"><template #default="{row}">{{ row.applicant || '—' }}</template></el-table-column>
        <el-table-column prop="applyDate" label="申请日期" width="100" />
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status==='待申请'" link type="primary" size="small" @click="submit(row)">提交</el-button>
            <el-button v-if="row.status==='审批中'" link type="success" size="small" @click="openApprove(row)">审批</el-button>
            <el-button v-if="row.status==='已批准'" link type="warning" size="small" @click="closeChange(row)">关闭</el-button>
            <el-button v-if="row.status==='已批准'" link type="danger" size="small" @click="rollback(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 审批弹窗(采购→研发→质量 依次签字) -->
    <el-dialog v-model="approveVisible" title="依次签字审批" width="520px">
      <el-steps :active="approveStep" align-center style="margin-bottom:18px">
        <el-step v-for="a in approvals" :key="a.id" :title="a.roleLabel || a.approvalRole"
          :status="a.status==='done' ? 'success' : a.status==='rejected' ? 'error' : (currentNode && a.id===currentNode.id ? 'process' : 'wait')"
          :description="a.status==='done' ? `已通过 ${a.operator || ''}` : a.status==='rejected' ? `已驳回 ${a.operator || ''}` : '待审批'" />
      </el-steps>
      <el-alert v-if="currentNode" :title="`当前节点:【${currentNode.roleLabel}】审批(顺序:采购→研发→质量,任一驳回即终止)`" type="info" :closable="false" style="margin-bottom:14px" />
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="决议" required>
          <el-select v-model="approveForm.approved" style="width:100%"><el-option label="通过" :value="true" /><el-option label="驳回" :value="false" /></el-select>
        </el-form-item>
        <el-form-item label="意见"><el-input v-model="approveForm.opinion" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="approveVisible=false">取消</el-button><el-button type="primary" :disabled="!currentNode" @click="submitApprove">签字提交</el-button></template>
    </el-dialog>

    <!-- 新建弹窗 -->
    <el-dialog v-model="createVisible" title="新建变更单" width="560px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="标题" required><el-input v-model="createForm.title" /></el-form-item>
        <el-form-item label="供应商" required><el-select v-model="createForm.supplierId" filterable clearable placeholder="选择供应商" style="width:100%"><el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" /></el-select></el-form-item>
        <el-form-item label="料号"><el-input v-model="createForm.partNo" placeholder="如 KL-PART-001" /></el-form-item>
        <el-form-item label="变更类型"><el-select v-model="createForm.changeType" style="width:100%"><el-option v-for="t in ['材料','工艺','设计','供应商','其他']" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="风险"><el-select v-model="createForm.riskPreMark" style="width:100%"><el-option v-for="r in ['高','中','低']" :key="r" :label="r" :value="r" /></el-select></el-form-item>
        <el-form-item label="紧急度"><el-select v-model="createForm.urgency" style="width:100%"><el-option v-for="u in ['高','中','低']" :key="u" :label="u" :value="u" /></el-select></el-form-item>
        <el-divider content-position="left">评估资料</el-divider>
        <el-form-item label="变更说明" required><el-input v-model="createForm.reason" type="textarea" :rows="3" placeholder="变更内容、原因与影响范围" /></el-form-item>
        <el-form-item label="验证报告">
          <input ref="verifyInput" type="file" style="display:none" @change="onPick('verifyReport', $event)" />
          <el-button size="small" @click="verifyInput?.click()">选择文件上传</el-button>
          <el-tag v-if="createForm.verifyReport" size="small" type="success" closable style="margin-left:8px" @close="createForm.verifyReport=''">{{ uploadNames.verifyReport || createForm.verifyReport }}</el-tag>
        </el-form-item>
        <el-form-item label="风险评估">
          <input ref="riskInput" type="file" style="display:none" @change="onPick('riskFile', $event)" />
          <el-button size="small" @click="riskInput?.click()">选择文件上传</el-button>
          <el-tag v-if="createForm.riskFile" size="small" type="warning" closable style="margin-left:8px" @close="createForm.riskFile=''">{{ uploadNames.riskFile || createForm.riskFile }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" :loading="uploading" @click="submitCreate">确定</el-button></template>
    </el-dialog>

    <!-- 详情弹窗(含供应商反查 + 会签进度) -->
    <el-dialog v-model="detailVisible" title="变更单详情" width="640px">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="变更编号">{{ detail.order.changeNo }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ detail.order.title }}</el-descriptions-item>
        <el-descriptions-item label="料号">{{ detail.order.partNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="变更类型">{{ detail.order.changeType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="风险">{{ detail.order.riskPreMark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="紧急度">{{ detail.order.urgency || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.order.status }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.order.applicant || '—' }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ detail.order.applyDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detail.order.source || '—' }}</el-descriptions-item>
        <el-descriptions-item label="变更说明" :span="2">{{ detail.order.reason || '—' }}</el-descriptions-item>
        <el-descriptions-item label="评估附件" :span="2">
          <el-tag v-if="detail.order.verifyReport" size="small" type="success" style="margin-right:6px;cursor:pointer" @click="downloadFile(detail.order.verifyReport!, `验证报告-${detail.order.changeNo}`)">验证报告 ↓</el-tag>
          <el-tag v-if="detail.order.riskFile" size="small" type="warning" style="cursor:pointer" @click="downloadFile(detail.order.riskFile!, `风险评估-${detail.order.changeNo}`)">风险评估 ↓</el-tag>
          <span v-if="!detail.order.verifyReport && !detail.order.riskFile" class="muted">无</span>
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="detailSupplier">
        <el-divider content-position="left">供应商信息</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="名称">{{ detailSupplier.name }}</el-descriptions-item>
          <el-descriptions-item label="编码">{{ detailSupplier.supplierCode || detailSupplier.supplierNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="等级">{{ detailSupplier.level || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detailSupplier.status || '—' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailSupplier.contactPerson || '—' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ detailSupplier.contactPhone || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <template v-if="detail && detail.approvals.length">
        <el-divider content-position="left">签字进度(采购→研发→质量)</el-divider>
        <el-table :data="sortedApprovals" size="small" border>
          <el-table-column label="顺序" width="60"><template #default="{row}">{{ row.seqOrder || '—' }}</template></el-table-column>
          <el-table-column prop="roleLabel" label="角色" width="80" />
          <el-table-column label="状态" width="90"><template #default="{row}"><el-tag size="small" :type="row.status==='done'?'success':row.status==='rejected'?'danger':'info'">{{ row.status==='done'?'已通过':row.status==='rejected'?'已驳回':'待审批' }}</el-tag></template></el-table-column>
          <el-table-column prop="operator" label="签字人" width="110"><template #default="{row}">{{ row.operator || '—' }}</template></el-table-column>
          <el-table-column prop="operateDate" label="时间" width="160"><template #default="{row}">{{ row.operateDate ? String(row.operateDate).replace('T',' ').slice(0,16) : '—' }}</template></el-table-column>
          <el-table-column prop="opinion" label="意见" show-overflow-tooltip><template #default="{row}">{{ row.opinion || '—' }}</template></el-table-column>
        </el-table>
      </template>

      <template v-if="relatedAudits.length">
        <el-divider content-position="left">关联审核计划(双向追溯)</el-divider>
        <el-table :data="relatedAudits" size="small" border>
          <el-table-column prop="planNo" label="计划编号" width="160" />
          <el-table-column prop="auditType" label="审核类型" width="120" />
          <el-table-column label="审核组" min-width="120"><template #default="{row}">{{ row.actualAuditors || row.auditorTeam || '—' }}</template></el-table-column>
          <el-table-column label="状态" width="90"><template #default="{row}"><el-tag size="small" :type="planStatusType(row.status)">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="120"><template #default="{row}"><el-button link type="primary" size="small" @click="goAudit(row.id)">查看审核 ›</el-button></template></el-table-column>
        </el-table>
      </template>

      <template #footer><el-button @click="detailVisible=false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { sqmChangeApi } from '@/api/modules/sqm/changes'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { fileApi } from '@/api/modules/common/files'
import type { SqmChangeOrderListVo, SqmChangeOrderVo, SqmChangeApproval, SqmSupplier, SqmAuditPlan } from '@/api/types/sqm'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const list = ref<SqmChangeOrderListVo[]>([])
const loading = ref(false)
const filterStatus = ref('')
// 从供应商详情跳转而来时按供应商过滤
const filterSupplierId = ref((route.query.supplierId as string) || '')
const filterSupplierName = ref((route.query.supplierName as string) || '')

function clearSupplierFilter() { filterSupplierId.value = ''; filterSupplierName.value = ''; router.replace({ query: {} }); fetch() }

async function fetch() {
  loading.value = true
  try {
    const all = await sqmChangeApi.list()
    list.value = all.filter(r => (!filterStatus.value || r.status === filterStatus.value) && (!filterSupplierId.value || r.supplierId === filterSupplierId.value))
  } finally { loading.value = false }
}

// ── 新建(评估资料:变更说明文本 + 验证报告/风险评估附件) ──
const createVisible = ref(false)
const uploading = ref(false)
const suppliers = ref<SqmSupplier[]>([])
const verifyInput = ref<HTMLInputElement>()
const riskInput = ref<HTMLInputElement>()
const uploadNames = reactive<{ verifyReport: string; riskFile: string }>({ verifyReport: '', riskFile: '' })
const createForm = reactive({
  title: '', supplierId: '', partNo: '', changeType: '材料',
  reason: '', verifyReport: '', riskFile: '',
  riskPreMark: '中', urgency: '中', orgId: auth.user?.orgId || '',
})

async function openCreate() {
  Object.assign(createForm, { title: '', supplierId: filterSupplierId.value || '', partNo: '', changeType: '材料', reason: '', verifyReport: '', riskFile: '', riskPreMark: '中', urgency: '中', orgId: auth.user?.orgId || '' })
  uploadNames.verifyReport = ''; uploadNames.riskFile = ''
  createVisible.value = true
  if (!suppliers.value.length) { try { suppliers.value = await sqmSupplierApi.list() } catch { /* 忽略 */ } }
}

async function onPick(field: 'verifyReport' | 'riskFile', e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    const res = await fileApi.upload(file)
    createForm[field] = res.path
    uploadNames[field] = res.fileName
    ElMessage.success('上传成功')
  } finally { uploading.value = false }
}

async function submitCreate() {
  if (!createForm.title) { ElMessage.warning('请填写标题'); return }
  if (!createForm.supplierId) { ElMessage.warning('请选择供应商'); return }
  if (!createForm.reason) { ElMessage.warning('请填写变更说明(评估资料)'); return }
  await sqmChangeApi.create({ ...createForm })
  ElMessage.success('已创建')
  createVisible.value = false
  fetch()
}

async function submit(r: SqmChangeOrderListVo) { await sqmChangeApi.submit(r.id); ElMessage.success('已提交,已通知采购/研发/质量三方'); fetch() }

// ── 审批(强制串行:采购→研发→质量) ──
const approveVisible = ref(false)
const approveId = ref('')
const approvals = ref<SqmChangeApproval[]>([])
const approveForm = reactive({ approvalRole: '', approved: true, opinion: '' })

const currentNode = computed(() => approvals.value.find(a => a.status === 'pending') || null)
const approveStep = computed(() => approvals.value.filter(a => a.status !== 'pending').length)

async function openApprove(r: SqmChangeOrderListVo) {
  approveId.value = r.id
  approveForm.approved = true; approveForm.opinion = ''
  const vo = await sqmChangeApi.get(r.id)
  approvals.value = [...vo.approvals].sort((a, b) => (a.seqOrder || 99) - (b.seqOrder || 99))
  approveVisible.value = true
}

async function submitApprove() {
  const node = currentNode.value
  if (!node) return
  await sqmChangeApi.approve(approveId.value, { approvalRole: node.approvalRole, approved: approveForm.approved, opinion: approveForm.opinion })
  ElMessage.success(approveForm.approved ? `【${node.roleLabel}】签字通过` : `【${node.roleLabel}】已驳回`)
  approveVisible.value = false
  fetch()
}

async function closeChange(r: SqmChangeOrderListVo) { await sqmChangeApi.close(r.id); ElMessage.success('已关闭'); fetch() }
async function rollback(r: SqmChangeOrderListVo) {
  const { value } = await ElMessageBox.prompt('请输入回滚原因', '回滚变更', { confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => ({ value: '' }))
  if (!value) return
  await sqmChangeApi.rollback(r.id, value)
  ElMessage.success('已回滚')
  fetch()
}

// ── 详情(含供应商反查) ──
const detailVisible = ref(false)
const detail = ref<SqmChangeOrderVo | null>(null)
const detailSupplier = ref<SqmSupplier | null>(null)
// 关联审核计划(双向追溯: 变更单 → 审核计划)
const relatedAudits = ref<SqmAuditPlan[]>([])
const sortedApprovals = computed(() => detail.value ? [...detail.value.approvals].sort((a, b) => (a.seqOrder || 99) - (b.seqOrder || 99)) : [])

async function openDetail(r: SqmChangeOrderListVo) {
  detail.value = null; detailSupplier.value = null; relatedAudits.value = []
  detailVisible.value = true
  detail.value = await sqmChangeApi.get(r.id)
  const sid = detail.value.order.supplierId
  if (sid) { try { detailSupplier.value = await sqmSupplierApi.get(sid) } catch { detailSupplier.value = null } }
  // 双向追溯: 反查该变更单联动生成的审核计划
  try {
    console.log('[ChangeList] 查询关联审核, changeId=', r.id)
    relatedAudits.value = await sqmAuditApi.listByChangeId(r.id)
    console.log('[ChangeList] 关联审核结果 =', relatedAudits.value.length, '条', relatedAudits.value)
  } catch (e: any) {
    console.warn('[ChangeList] 查询关联审核失败', e?.message || e)
    relatedAudits.value = []
  }
}

// 双向追溯: 跳转到关联审核计划详情
function goAudit(id: string) { router.push({ path: '/sqm/audits', query: { planId: id } }) }
function planStatusType(s: string): '' | 'info' | 'success' | 'warning' | 'primary' {
  if (s === '已完成') return 'success'
  if (s === '进行中') return 'warning'
  if (s === '待执行') return 'primary'
  return 'info'
}

async function downloadFile(path: string, name: string) {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : ''
  await fileApi.download(path, name + ext)
}

function riskClass(l?: string) { return ({ '高': 'p-lock', '中': 'p-wait', '低': 'p-done' } as Record<string, string>)[l || ''] || '' }
function changeStatusClass(s: string) { return ({ '待申请': 'p-wait', '审批中': 'p-run', '已批准': 'p-done', '已驳回': 'p-lock', '已关闭': 'p-done', '已回滚': 'p-lock' } as Record<string, string>)[s] || '' }
onMounted(async () => {
  await fetch()
  // 双向追溯: 从审核详情跳转而来时, 自动打开指定变更单详情
  const cid = route.query.changeId as string
  if (cid) {
    console.log('[ChangeList] 从审核跳转, changeId=', cid, 'list长度=', list.value.length)
    // 兼容 UUID 有无连字符两种格式, 避免历史数据格式不一致导致匹配失败
    const normCid = cid.replace(/-/g, '')
    const r = list.value.find(x => x.id.replace(/-/g, '') === normCid)
    if (r) {
      console.log('[ChangeList] 找到变更单 id=', r.id, '自动打开详情')
      openDetail(r)
    } else {
      console.warn('[ChangeList] 未找到变更单, cid=', cid, 'normCid=', normCid, '前3个id:', list.value.slice(0, 3).map(x => x.id))
      ElMessage.info('未找到对应的变更单')
    }
  }
})
</script>

<style lang="scss" scoped>
.change-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.muted { color: $ink-faint; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-lock { background: $signal-red-dim; color: $signal-red; } .p-lock .d { background: $signal-red; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
</style>
