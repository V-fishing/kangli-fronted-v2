<template>
  <div class="fmea-list">
    <div class="head-b">
      <AppBreadcrumb />
      <div class="title-row">
        <h1>FMEA 风险管控</h1>
        <el-button v-permission="'sqm.fmea.scan-overdue'" :loading="scanning" @click="scanOverdue">超期扫描</el-button>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部状态" style="width:140px" @change="page = 1; fetch()">
            <el-option v-for="s in fmeaStatuses" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="page = 1; fetch()">查询</el-button>
          <el-button v-permission="'sqm.fmea.edit'" type="success" style="margin-left:8px" @click="openCreate">+ 新建风险项</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe>
        <el-table-column prop="fmeaType" label="类型" width="92">
          <template #default="{ row }"><el-tag size="small" type="info" effect="plain">{{ row.fmeaType || '—' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="process" label="工序/功能" min-width="130" show-overflow-tooltip />
        <el-table-column prop="failureMode" label="潜在失效模式" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.failureMode || '—' }}</template>
        </el-table-column>
        <el-table-column label="S/O/D" width="96" align="center">
          <template #default="{ row }">
            <span class="sod">{{ row.severityS ?? '-' }}/{{ row.occurrenceO ?? '-' }}/{{ row.detectionD ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="RPN" width="80" align="center" sortable :sort-method="(a: QmsFmeaRisk, b: QmsFmeaRisk) => (a.rpn || 0) - (b.rpn || 0)">
          <template #default="{ row }">
            <span class="pill" :class="riskClass(row.riskLevel)">{{ row.rpn ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="80">
          <template #default="{ row }">
            <span class="pill" :class="riskClass(row.riskLevel)">
              <span class="d"></span>{{ row.riskLevel || '—' }}
              <el-icon v-if="row.highRiskFlag" color="#dc2626" style="margin-left:2px"><WarningFilled /></el-icon>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="责任人" width="100"><template #default="{ row }">{{ row.owner || '—' }}</template></el-table-column>
        <el-table-column prop="targetDate" label="目标日期" width="110"><template #default="{ row }">{{ row.targetDate || '—' }}</template></el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><span class="pill" :class="fmeaStatusClass(row.status)"><span class="d"></span>{{ row.status }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row as QmsFmeaRisk)">详情</el-button>
            <el-button link type="warning" size="small" @click="openAssign(row as QmsFmeaRisk)">改派</el-button>
            <el-button v-permission="'sqm.fmea.edit'" v-if="row.status !== '已闭环'" link type="primary" size="small" @click="openEdit(row as QmsFmeaRisk)">编辑</el-button>
            <el-button v-permission="'sqm.fmea.close'" v-if="row.status !== '已闭环'" link type="success" size="small" @click="openClose(row as QmsFmeaRisk)">闭环</el-button>
            <el-button v-permission="'sqm.fmea.reopen'" v-if="row.status === '已闭环'" link type="warning" size="small" @click="reopen(row as QmsFmeaRisk)">重开</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" :current-page="page" :page-size="size"
          @current-change="(p: number) => { page = p; fetch() }"
          @size-change="(s: number) => { size = s; page = 1; fetch() }" />
      </div>
    </el-card>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="editVisible" :title="editId ? '编辑风险项' : '新建风险项'" width="720px" @open="onEditOpen" append-to-body>
      <el-form :model="editForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="FMEA 类型" required>
              <el-select v-model="editForm.fmeaType" style="width:100%" placeholder="选择类型" @change="predictRpn">
                <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序/功能" required>
              <el-input v-model="editForm.process" placeholder="如 注塑成型" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="潜在失效模式" required>
          <el-input v-model="editForm.failureMode" placeholder="如 尺寸超差" />
        </el-form-item>
        <el-form-item label="产品/项目" required>
          <el-input v-model="editForm.product" placeholder="如 XX型号注塑件" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="失效影响"><el-input v-model="editForm.failureEffect" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失效原因"><el-input v-model="editForm.failureCause" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="现有预防控制"><el-input v-model="editForm.currentPreventCtrl" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="现有探测控制"><el-input v-model="editForm.currentDetectCtrl" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>

        <el-divider content-position="left">RPN 评估（严重度 × 频度 × 探测度）</el-divider>
        <el-row :gutter="16" align="middle">
          <el-col :span="7">
            <el-form-item label="严重度 S" required>
              <el-input-number v-model="editForm.severityS" :min="1" :max="10" @change="predictRpn" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="频度 O" required>
              <el-input-number v-model="editForm.occurrenceO" :min="1" :max="10" @change="predictRpn" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="探测度 D" required>
              <el-input-number v-model="editForm.detectionD" :min="1" :max="10" @change="predictRpn" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <div class="rpn-box" :class="riskClass(predicted.riskLevel)">
              <div class="rpn-num">{{ predicted.rpn ?? '—' }}</div>
              <div class="rpn-lab">RPN·{{ predicted.riskLevel || '—' }}</div>
            </div>
          </el-col>
        </el-row>

        <el-divider content-position="left">措施与责任</el-divider>
        <el-form-item label="建议措施"><el-input v-model="editForm.suggestMeasure" type="textarea" :rows="2" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="责任部门">
              <el-select v-model="editForm.ownerDeptCode" filterable clearable placeholder="选择部门" style="width:100%"
                @change="(code: string) => { const o = orgs.find(x => x.orgCode === code); editForm.ownerDept = o?.orgName || '' }">
                <el-option v-for="o in orgs" :key="o.orgCode" :label="o.orgName" :value="o.orgCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="责任人">
              <el-select v-model="editForm.ownerUserId" filterable clearable placeholder="选择责任人" style="width:100%"
                @change="(id: string) => { const u = users.find(x => x.id === id); editForm.owner = u?.realName || '' }">
                <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="目标日期"><el-date-picker v-model="editForm.targetDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 闭环弹窗 -->
    <el-dialog v-model="closeVisible" title="闭环风险项" width="540px" append-to-body>
      <el-alert v-if="closeRow && closeRow.highRiskFlag" type="warning" :closable="false" style="margin-bottom:14px">
        高风险项：闭环前须勾选“已验证三个月无复发”，并提交闭环证据。
      </el-alert>
      <el-form :model="closeForm" label-width="100px">
        <el-form-item label="闭环证据" required>
          <el-input v-model="closeForm.evidence" type="textarea" :rows="3" placeholder="填写验证结果、措施完成证明等" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="closeForm.note" type="textarea" :rows="2" /></el-form-item>
        <el-form-item v-if="closeRow && closeRow.highRiskFlag" label="无复发验证" required>
          <el-checkbox v-model="closeForm.recurrenceVerified">已验证三个月无复发</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeVisible = false">取消</el-button>
        <el-button type="success" :loading="closing" @click="submitClose">确认闭环</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="风险项详情" width="720px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="风险编号">{{ detail.riskNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detail.fmeaType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="工序/功能">{{ detail.process || '—' }}</el-descriptions-item>
        <el-descriptions-item label="潜在失效模式">{{ detail.failureMode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="失效影响" :span="2">{{ detail.failureEffect || '—' }}</el-descriptions-item>
        <el-descriptions-item label="失效原因" :span="2">{{ detail.failureCause || '—' }}</el-descriptions-item>
        <el-descriptions-item label="现有预防控制" :span="2">{{ detail.currentPreventCtrl || '—' }}</el-descriptions-item>
        <el-descriptions-item label="现有探测控制" :span="2">{{ detail.currentDetectCtrl || '—' }}</el-descriptions-item>
        <el-descriptions-item label="严重度 S">{{ detail.severityS ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="频度 O">{{ detail.occurrenceO ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="探测度 D">{{ detail.detectionD ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="RPN"><span class="pill" :class="riskClass(detail.riskLevel)">{{ detail.rpn ?? '—' }}</span></el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <span class="pill" :class="riskClass(detail.riskLevel)"><span class="d"></span>{{ detail.riskLevel || '—' }}</span>
          <el-tag v-if="detail.highRiskFlag" type="danger" size="small" style="margin-left:6px">高风险</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="建议措施" :span="2">{{ detail.suggestMeasure || '—' }}</el-descriptions-item>
        <el-descriptions-item label="责任部门">{{ detail.ownerDept || '—' }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ detail.owner || '—' }}</el-descriptions-item>
        <el-descriptions-item label="目标日期">{{ detail.targetDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="闭环日期">{{ detail.closeDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="闭环证据" :span="2">{{ detail.evidence || '—' }}</el-descriptions-item>
        <el-descriptions-item label="闭环备注" :span="2">{{ detail.note || '—' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">闭环轨迹</el-divider>
      <el-timeline v-if="tracks.length">
        <el-timeline-item
          v-for="t in tracks"
          :key="t.id"
          :timestamp="t.createdAt ? String(t.createdAt).replace('T', ' ').slice(0, 19) : '—'"
          placement="top"
        >
          <div class="track-item">
            <span class="pill" :class="fmeaStatusClass(t.fromStatus || '')">{{ t.fromStatus || '—' }}</span>
            <el-icon><Right /></el-icon>
            <span class="pill" :class="fmeaStatusClass(t.toStatus || '')">{{ t.toStatus || '—' }}</span>
            <span class="track-op">操作人：{{ t.operator || '—' }}</span>
          </div>
          <div v-if="t.note" class="track-note">{{ t.note }}</div>
          <div v-if="t.evidence" class="track-note">证据：{{ t.evidence }}</div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无轨迹" :image-size="60" />

      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>

    <AssignDialog
      v-model="assignVisible"
      :title="`改派责任人 · ${assignBizNo}`"
      :biz-no="assignBizNo"
      :is-reassign="true"
      biz-type="FMEA"
      :user-only="true"
      @submit="onAssignSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { WarningFilled, Right } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { sqmFmeaApi } from '@/api/modules/sqm/fmea'
import { orgApi } from '@/api/modules/uop/orgs'
import { usersApi } from '@/api/modules/uop/users'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import AssignDialog from '@/components/common/AssignDialog.vue'
import type { QmsFmeaRisk, QmsFmeaRiskTrack } from '@/api/types/sqm'
import type { SysOrg, UserSelectVo } from '@/api/types/uop'

const auth = useAuthStore()
const list = ref<QmsFmeaRisk[]>([])
const loading = ref(false)
const scanning = ref(false)
const filterStatus = ref('')
const page = ref(1), size = ref(20), total = ref(0)

const fmeaStatuses = ['创建', '待闭环', '进行中', '已闭环']
const typeOptions = ref<string[]>([])
const orgs = ref<SysOrg[]>([])
const users = ref<UserSelectVo[]>([])

async function loadOptions() {
  try { orgs.value = await orgApi.list() } catch { orgs.value = [] }
  try { users.value = await usersApi.select() } catch { users.value = [] }
}

async function fetch() {
  loading.value = true
  try {
    const res = await sqmFmeaApi.listPage({ status: filterStatus.value || undefined, page: page.value, size: size.value })
    list.value = res.records
    total.value = res.total
  } finally { loading.value = false }
}

async function scanOverdue() {
  scanning.value = true
  try {
    const n = await sqmFmeaApi.scanOverdue()
    ElMessage.success(`超期扫描完成，命中 ${n ?? 0} 条`)
    fetch()
  } finally { scanning.value = false }
}

// ── 新建/编辑 ──
const editVisible = ref(false)
const editId = ref('')
const saving = ref(false)
const editForm = reactive<Partial<QmsFmeaRisk>>({
  fmeaType: '', process: '', failureMode: '', product: '', failureEffect: '', failureCause: '',
  currentPreventCtrl: '', currentDetectCtrl: '', severityS: 1, occurrenceO: 1, detectionD: 1,
  suggestMeasure: '', ownerDept: '', owner: '', targetDate: '', orgId: auth.user?.orgId || '',
})
const predicted = reactive<{ rpn?: number; riskLevel?: string }>({ rpn: undefined, riskLevel: '' })
let predictTimer: ReturnType<typeof setTimeout> | undefined

function predictRpn() {
  if (predictTimer) clearTimeout(predictTimer)
  predictTimer = setTimeout(async () => {
    if (!editForm.severityS || !editForm.occurrenceO || !editForm.detectionD) return
    try {
      const r = await sqmFmeaApi.predict(editForm.severityS, editForm.occurrenceO, editForm.detectionD)
      predicted.rpn = r.rpn
      predicted.riskLevel = r.riskLevel
    } catch { /* 预测失败不阻断 */ }
  }, 300)
}

function resetForm() {
  Object.assign(editForm, {
    fmeaType: typeOptions.value[0] || '', process: '', failureMode: '', product: '', failureEffect: '', failureCause: '',
    currentPreventCtrl: '', currentDetectCtrl: '', severityS: 5, occurrenceO: 3, detectionD: 3,
    suggestMeasure: '', ownerDept: '', ownerDeptCode: '', owner: '', ownerUserId: '', targetDate: '', orgId: auth.user?.orgId || '',
  })
  predicted.rpn = undefined; predicted.riskLevel = ''
}

function onEditOpen() {
  if (!typeOptions.value.length) {
    sqmFmeaApi.types().then(ts => { typeOptions.value = ts; if (!editForm.fmeaType && ts.length) editForm.fmeaType = ts[0] }).catch(() => {})
  }
  if (!orgs.value.length || !users.value.length) {
    loadOptions()
  }
  predictRpn()
}

function openCreate() {
  editId.value = ''
  resetForm()
  editVisible.value = true
}

function openEdit(r: QmsFmeaRisk) {
  editId.value = r.id
  Object.assign(editForm, {
    fmeaType: r.fmeaType || typeOptions.value[0] || '', process: r.process || '', failureMode: r.failureMode || '', product: r.product || '',
    failureEffect: r.failureEffect || '', failureCause: r.failureCause || '', currentPreventCtrl: r.currentPreventCtrl || '',
    currentDetectCtrl: r.currentDetectCtrl || '', severityS: r.severityS || 1, occurrenceO: r.occurrenceO || 1,
    detectionD: r.detectionD || 1, suggestMeasure: r.suggestMeasure || '',
    ownerDept: r.ownerDept || '', ownerDeptCode: r.ownerDeptCode || '', owner: r.owner || '', ownerUserId: r.ownerUserId || '',
    targetDate: r.targetDate || '', orgId: auth.user?.orgId || '',
  })
  predicted.rpn = r.rpn; predicted.riskLevel = r.riskLevel
  editVisible.value = true
}

async function submitEdit() {
  if (!editForm.fmeaType) { ElMessage.warning('请选择 FMEA 类型'); return }
  if (!editForm.process) { ElMessage.warning('请填写工序/功能'); return }
  if (!editForm.failureMode) { ElMessage.warning('请填写潜在失效模式'); return }
  if (!editForm.product) { ElMessage.warning('请填写产品/项目'); return }
  if (!editForm.severityS || !editForm.occurrenceO || !editForm.detectionD) { ElMessage.warning('请填写 S/O/D'); return }
  saving.value = true
  try {
    const payload: Partial<QmsFmeaRisk> = {
      fmeaType: editForm.fmeaType, process: editForm.process, failureMode: editForm.failureMode, product: editForm.product,
      failureEffect: editForm.failureEffect, failureCause: editForm.failureCause,
      currentPreventCtrl: editForm.currentPreventCtrl, currentDetectCtrl: editForm.currentDetectCtrl,
      severityS: editForm.severityS, occurrenceO: editForm.occurrenceO, detectionD: editForm.detectionD,
      suggestMeasure: editForm.suggestMeasure,
      ownerDept: editForm.ownerDept, ownerDeptCode: editForm.ownerDeptCode,
      owner: editForm.owner, ownerUserId: editForm.ownerUserId,
      targetDate: editForm.targetDate, orgId: auth.user?.orgId || '',
    }
    if (editId.value) {
      await sqmFmeaApi.update(editId.value, payload)
      ElMessage.success('已更新')
    } else {
      await sqmFmeaApi.create(payload)
      ElMessage.success('已创建')
    }
    editVisible.value = false
    fetch()
  } finally { saving.value = false }
}

// ── 闭环 ──
const closeVisible = ref(false)
const closing = ref(false)
const closeRow = ref<QmsFmeaRisk | null>(null)
const closeForm = reactive<{ evidence: string; note: string; recurrenceVerified: boolean }>({ evidence: '', note: '', recurrenceVerified: false })

function openClose(r: QmsFmeaRisk) {
  closeRow.value = r
  closeForm.evidence = ''; closeForm.note = ''; closeForm.recurrenceVerified = false
  closeVisible.value = true
}

async function submitClose() {
  if (!closeRow.value) return
  if (!closeForm.evidence) { ElMessage.warning('请填写闭环证据'); return }
  if (closeRow.value.highRiskFlag && !closeForm.recurrenceVerified) { ElMessage.warning('高风险项须勾选“已验证三个月无复发”'); return }
  closing.value = true
  try {
    await sqmFmeaApi.close(closeRow.value.id, {
      evidence: closeForm.evidence, note: closeForm.note,
      recurrenceVerified: closeRow.value.highRiskFlag ? closeForm.recurrenceVerified : undefined,
    })
    ElMessage.success('已闭环')
    closeVisible.value = false
    fetch()
  } finally { closing.value = false }
}

// ── 重开 ──
async function reopen(r: QmsFmeaRisk) {
  const { value } = await ElMessageBox.prompt('请输入重开原因', '重新打开风险项', {
    confirmButtonText: '确定', cancelButtonText: '取消', inputType: 'textarea',
  }).catch(() => ({ value: '' }))
  if (!value) return
  await sqmFmeaApi.reopen(r.id, value)
  ElMessage.success('已重新打开')
  fetch()
}

// ── 详情 ──
const detailVisible = ref(false)
const detail = ref<QmsFmeaRisk | null>(null)
const tracks = ref<QmsFmeaRiskTrack[]>([])

async function openDetail(r: QmsFmeaRisk) {
  detail.value = r; tracks.value = []
  detailVisible.value = true
  try { tracks.value = await sqmFmeaApi.tracks(r.id) } catch { tracks.value = [] }
}

// ── 列表级改派责任人(仅单人) ──
const assignVisible = ref(false)
const assignBizNo = ref('')
const assigningId = ref('')
function openAssign(r: QmsFmeaRisk) {
  assigningId.value = r.id
  assignBizNo.value = r.riskNo || r.id
  assignVisible.value = true
}
async function onAssignSubmit(body: DefectLaunchRequest) {
  try {
    await sqmFmeaApi.reassign(assigningId.value, body)
    ElMessage.success('已改派并通知责任人')
    assignVisible.value = false
    fetch()
  } finally { /* 弹窗内部保留 submitting 态 */ }
}

// ── 色标 ──
function riskClass(l?: string) { return ({ '高': 'p-lock', '中': 'p-wait', '低': 'p-done' } as Record<string, string>)[l || ''] || '' }
function fmeaStatusClass(s: string) {
  return ({ '创建': 'p-wait', '待闭环': 'p-wait', '进行中': 'p-run', '已闭环': 'p-done' } as Record<string, string>)[s] || ''
}

onMounted(() => { loadOptions(); fetch() })
</script>

<style lang="scss" scoped>
.fmea-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.title-row { display: flex; align-items: center; justify-content: space-between; }
.title-row h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.sod { font-family: $font-mono; font-size: 12px; color: $ink; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-lock { background: $signal-red-dim; color: $signal-red; } .p-lock .d { background: $signal-red; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.rpn-box { text-align: center; border-radius: 10px; padding: 6px 0; }
.rpn-box .rpn-num { font-family: $font-display; font-size: 22px; font-weight: 800; }
.rpn-box .rpn-lab { font-size: 11px; }
.track-item { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.track-op { font-size: 12px; color: $ink-faint; }
.track-note { font-size: 12px; color: $ink-soft; margin-top: 4px; }
</style>
