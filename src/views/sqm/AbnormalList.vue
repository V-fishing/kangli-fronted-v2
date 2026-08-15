<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SqmIncomingAbnormal, CloseAbnormalRequest } from '@/api/types/sqm'
import { sqmAbnormalApi } from '@/api/modules/sqm/abnormals'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import { ncmCapaApi } from '@/api/modules/ncm/capas'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'
import AssignDialog from '@/components/common/AssignDialog.vue'

const route = useRoute()
const router = useRouter()

const list = ref<SqmIncomingAbnormal[]>([])
const loading = ref(false)
const filterLevel = ref('')
const filterStatus = ref('')
// 从供应商详情跳转而来时按供应商过滤
const filterSupplierId = ref((route.query.supplierId as string) || '')
const filterSupplierName = ref((route.query.supplierName as string) || '')
const page = ref(1), size = ref(20), total = ref(0)

function clearSupplierFilter() {
  filterSupplierId.value = ''
  filterSupplierName.value = ''
  router.replace({ query: {} })
}

async function fetch() {
  loading.value = true
  try {
    const res = await sqmAbnormalApi.listPage({
      keyword: '',
      level: filterLevel.value || undefined,
      status: filterStatus.value || undefined,
      supplierId: filterSupplierId.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
    // 从 8D 等上游追溯跳转而来: 按异常单号自动定位并打开详情
    const qNo = route.query.abnormalNo as string | undefined
    if (qNo) {
      const hit = res.records.find((r: any) => r.abnormalNo === qNo)
      if (hit) openDetail(hit)
    }
  } finally {
    loading.value = false
  }
}

const levelTag = (l?: string) => (l === '严重' ? 'danger' : l === '一般' ? 'warning' : 'info')
const statusTag = (s?: string) =>
  s === '已关闭' ? 'success' : s === '整改中' ? 'warning' : 'info'

// ---------------- 关闭 ----------------
const closeVisible = ref(false)
const closing = ref(false)
const closeForm = ref<CloseAbnormalRequest>({ disposal: '', disposalRemark: '' })
let closingRow: SqmIncomingAbnormal | null = null

function openClose(row: SqmIncomingAbnormal) {
  closingRow = row
  closeForm.value = { disposal: '', disposalRemark: '' }
  closeVisible.value = true
}

async function submitClose() {
  if (!closingRow) return
  if (!closeForm.value.disposal) {
    ElMessage.warning('请选择处置方式')
    return
  }
  closing.value = true
  try {
    await sqmAbnormalApi.close(closingRow.id, closeForm.value)
    ElMessage.success('已关闭')
    closeVisible.value = false
    fetch()
  } finally {
    closing.value = false
  }
}

// ---------------- 详情 / 发起整改 ----------------
const detailVisible = ref(false)
const detailRow = ref<SqmIncomingAbnormal | null>(null)
const launching = ref(false)

function openDetail(row: SqmIncomingAbnormal) {
  detailRow.value = row
  detailVisible.value = true
}

function goRectify(row: SqmIncomingAbnormal) {
  if (row.rectifyType === '8D' && row.d8Id) {
    router.push(`/ncm/8d-reports/${row.d8Id}`)
  } else if (row.rectifyType === 'CAPA' && row.capaId) {
    router.push(`/ncm/capas/${row.capaId}`)
  }
}

// 发起 8D / CAPA 前先弹出"指定负责人"指派框(复用不良管理模块发起流程)
const assignVisible = ref(false)
const assignUsers = ref([])
const assignChannels = ref([])
const assignLoading = ref(false)
const assigning = ref(false)
const assignForm = reactive({
  ownerUserId: '',
  notifyChannels: [] as string[],
  remark: '',
})
let pendingLaunch = null // { type:'8D'|'CAPA', row }

async function loadAssignTargets() {
  assignLoading.value = true
  try {
    const r = await ncmDefectRecordApi.assignCandidates()
    assignUsers.value = r.users || []
    assignChannels.value = r.channels && r.channels.length ? r.channels : [{ code: '站内弹窗', name: '站内弹窗', enabled: true }]
    if (!assignChannels.value.some(c => c.code === '站内弹窗')) assignChannels.value.unshift({ code: '站内弹窗', name: '站内弹窗', enabled: true })
    // 通知方式只读:提交固定使用系统配置的默认渠道
    assignForm.notifyChannels = assignChannels.value.map(c => c.code)
  } catch {
    assignUsers.value = []
    assignChannels.value = [{ code: '站内弹窗', name: '站内弹窗', enabled: true }]
    assignForm.notifyChannels = ['站内弹窗']
  } finally {
    assignLoading.value = false
  }
}

async function openAssign(type) {
  const row = detailRow.value
  if (!row) return
  pendingLaunch = { type, row }
  assignForm.ownerUserId = ''
  assignForm.notifyChannels = []
  assignForm.remark = ''
  assignVisible.value = true
  await loadAssignTargets()
}

async function confirmAssign() {
  if (!pendingLaunch) return
  if (!assignForm.ownerUserId) {
    ElMessage.warning('请指定负责人')
    return
  }
  assigning.value = true
  try {
    const { type, row } = pendingLaunch
    const launch = {
      ownerUserId: assignForm.ownerUserId,
      notifyChannels: assignForm.notifyChannels,
      remark: assignForm.remark,
    }
    if (type === '8D') {
      await ncm8dApi.launchFromAbnormal({
        report: {
          sourceRefId: row.id,
          issue: `来料异常:${row.abnormalNo}`,
          severity: row.level === '严重' ? '高' : '中',
        },
        launch,
      })
      ElMessage.success('8D 已发起并指派负责人')
    } else {
      await ncmCapaApi.launchFromAbnormal({
        capa: {
          abnormalId: row.id,
          issue: `来料异常:${row.abnormalNo}`,
          triggerType: '来料异常',
          capaType: '纠正措施',
        },
        launch,
      })
      ElMessage.success('CAPA 已发起并指派负责人')
    }
    assignVisible.value = false
    detailVisible.value = false
    fetch()
  } finally {
    assigning.value = false
  }
}

// ── 列表级指派/改派处理人 ──
const raVisible = ref(false)
const raBizNo = ref('')
const raId = ref('')
function openReassign(row: SqmIncomingAbnormal) {
  raId.value = row.id
  raBizNo.value = row.abnormalNo
  raVisible.value = true
}
async function onRaSubmit(body: DefectLaunchRequest) {
  try {
    await sqmAbnormalApi.reassign(raId.value, body)
    ElMessage.success('已指派并通知处理人')
    raVisible.value = false
    fetch()
  } finally { /* 弹窗内部保留 submitting 态 */ }
}

onMounted(() => fetch())
</script>

<template>
  <div class="page">
    <h2>来料异常</h2>
    <div class="filters">
      <el-select v-model="filterLevel" placeholder="严重度" clearable style="width: 140px">
        <el-option label="严重" value="严重" />
        <el-option label="一般" value="一般" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 140px">
        <el-option label="待整改" value="待整改" />
        <el-option label="整改中" value="整改中" />
        <el-option label="已关闭" value="已关闭" />
      </el-select>
      <el-button type="primary" @click="page = 1; fetch()">查询</el-button>
      <el-tag v-if="filterSupplierId" closable type="warning" @close="clearSupplierFilter">
        供应商: {{ filterSupplierName || filterSupplierId }}
      </el-tag>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="abnormalNo" label="异常单号" width="140" />
      <el-table-column prop="supplierName" label="供应商" min-width="140" />
      <el-table-column prop="partName" label="物料" min-width="120" />
      <el-table-column label="批次" width="120">
        <template #default="{ row }">{{ row.batchNo || row.lotId }}</template>
      </el-table-column>
      <el-table-column prop="incomingQty" label="来料数" width="90" />
      <el-table-column prop="qty" label="不良数" width="90" />
      <el-table-column prop="level" label="严重度" width="100">
        <template #default="{ row }">
          <el-tag :type="levelTag(row.level)" size="small">{{ row.level || '—' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="occurDate" label="发生日期" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
        <el-table-column prop="rectifyType" label="整改类型" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.rectifyType" :type="row.rectifyType === '8D' ? 'primary' : 'success'" size="small">{{ row.rectifyType }}</el-tag>
            <span v-else>未触发</span>
          </template>
        </el-table-column>
        <el-table-column label="处理人" width="100">
          <template #default="{ row }">{{ row.handlerName || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <span style="white-space: nowrap">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link type="warning" @click="openReassign(row)">指派</el-button>
              <el-button link type="danger" @click="openClose(row)">关闭</el-button>
            </span>
          </template>
        </el-table-column>
    </el-table>

    <div class="pager" v-if="total > 0">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
        :page-sizes="[10, 20, 50, 100]" :current-page="page" :page-size="size"
        @current-change="(p: number) => { page = p; fetch() }"
        @size-change="(s: number) => { size = s; page = 1; fetch() }" />
    </div>

    <!-- 关闭 -->
    <el-dialog v-model="closeVisible" title="关闭来料异常" width="420px" append-to-body>
      <el-form :model="closeForm" label-width="80px">
        <el-form-item label="处置方式" required>
          <el-select v-model="closeForm.disposal" placeholder="请选择">
            <el-option label="退货" value="退货" />
            <el-option label="挑选使用" value="挑选使用" />
            <el-option label="特采" value="特采" />
            <el-option label="报废" value="报废" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="closeForm.disposalRemark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeVisible = false">取消</el-button>
        <el-button type="primary" :loading="closing" @click="submitClose">确定关闭</el-button>
      </template>
    </el-dialog>

    <!-- 详情 / 发起整改 -->
    <el-dialog v-model="detailVisible" title="来料异常详情" width="560px" append-to-body>
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="异常单号">{{ detailRow.abnormalNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="物料">{{ detailRow.partName }}</el-descriptions-item>
        <el-descriptions-item label="批次">{{ detailRow.batchNo || detailRow.lotId }}</el-descriptions-item>
        <el-descriptions-item label="来料数">{{ detailRow.incomingQty }}</el-descriptions-item>
        <el-descriptions-item label="不良数">{{ detailRow.qty }}</el-descriptions-item>
        <el-descriptions-item label="严重度">
          <el-tag :type="levelTag(detailRow.level)" size="small">{{ detailRow.level || '—' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(detailRow.status)" size="small">{{ detailRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="整改类型">
          <el-tag v-if="detailRow.rectifyType" :type="detailRow.rectifyType === '8D' ? 'primary' : 'success'" size="small">{{ detailRow.rectifyType }}</el-tag>
          <span v-else>未触发</span>
        </el-descriptions-item>
        <el-descriptions-item label="发生日期">{{ detailRow.occurDate }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailRow.description || '—' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>整改处置</el-divider>

      <div v-if="detailRow.rectifyType && (detailRow.d8Id || detailRow.capaId)" style="margin-bottom: 12px">
        <el-button type="primary" @click="goRectify(detailRow!)">
          查看 {{ detailRow.rectifyType }} 流程 →
        </el-button>
      </div>
      <div v-else style="margin-bottom: 12px; color: #909399; font-size: 13px">
        尚未关联整改单，可点击下方按钮发起：
      </div>

      <div style="display: flex; gap: 12px">
        <el-button
          type="warning"
          :loading="launching"
          :disabled="!!detailRow?.d8Id"
          @click="openAssign('8D')"
        >
          发起 8D{{ detailRow?.d8Id ? '（已发起）' : '' }}
        </el-button>
        <el-button
          type="success"
          :loading="launching"
          :disabled="!!detailRow?.capaId"
          @click="openAssign('CAPA')"
        >
          发起 CAPA{{ detailRow?.capaId ? '（已发起）' : '' }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 发起前指定负责人(复用不良管理指派流程,样式与不良管理保持一致) -->
    <el-dialog v-model="assignVisible" :title="`发起${pendingLaunch?.type === '8D' ? '8D · 指定负责人' : 'CAPA · 指定负责人'}`" width="560px" append-to-body>
      <el-alert v-if="pendingLaunch" :title="pendingLaunch.type === '8D'
        ? `来料异常 ${detailRow?.abnormalNo}:请指定负责人(单选),负责人将在 D1 阶段自行组建团队,由质量部门审核后进入 D2。`
        : `来料异常 ${detailRow?.abnormalNo}:请指定负责人(单选),确认后将创建${pendingLaunch.type}报告并通知负责人。`"
        type="info" :closable="false" show-icon style="margin-bottom:14px" />
      <el-form :model="assignForm" label-width="90px">
        <el-form-item label="指定负责人" required>
          <el-select
            v-model="assignForm.ownerUserId"
            placeholder="单选系统用户作为负责人"
            filterable
            clearable
            :loading="assignLoading"
            style="width: 100%"
          >
            <el-option v-for="u in assignUsers" :key="u.id" :label="u.realName || u.username || u.id" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知方式">
          <div v-if="assignChannels.length" style="display:flex;flex-wrap:wrap;gap:6px">
            <el-tag v-for="c in assignChannels" :key="c.code" type="info" effect="plain">{{ c.name }}</el-tag>
          </div>
          <el-tag v-else type="info" effect="plain">站内弹窗</el-tag>
        </el-form-item>
        <el-form-item label="指派备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="2" placeholder="如:请48小时内完成原因分析并回复处置方案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="confirmAssign">确认发起并通知</el-button>
      </template>
    </el-dialog>

    <AssignDialog
      v-model="raVisible"
      :title="`指派处理人 · ${raBizNo}`"
      :biz-no="raBizNo"
      :is-reassign="true"
      biz-type="SQM异常"
      @submit="onRaSubmit"
    />
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>
