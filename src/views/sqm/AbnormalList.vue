<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SqmIncomingAbnormal, CloseAbnormalRequest } from '@/api/types/sqm'
import { sqmAbnormalApi } from '@/api/modules/sqm/abnormals'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import { ncmCapaApi } from '@/api/modules/ncm/capas'

const route = useRoute()
const router = useRouter()

const list = ref<SqmIncomingAbnormal[]>([])
const loading = ref(false)
const filterLevel = ref('')
const filterStatus = ref('')
// 从供应商详情跳转而来时按供应商过滤
const filterSupplierId = ref((route.query.supplierId as string) || '')
const filterSupplierName = ref((route.query.supplierName as string) || '')

function clearSupplierFilter() {
  filterSupplierId.value = ''
  filterSupplierName.value = ''
  router.replace({ query: {} })
}

async function fetch() {
  loading.value = true
  try {
    const rows = await sqmAbnormalApi.list()
    list.value = rows
  } finally {
    loading.value = false
  }
}

const levelTag = (l?: string) => (l === '严重' ? 'danger' : l === '一般' ? 'warning' : 'info')
const statusTag = (s?: string) =>
  s === '已关闭' ? 'success' : s === '整改中' ? 'warning' : 'info'

function filtered(): SqmIncomingAbnormal[] {
  return list.value.filter(
    (r) =>
      (!filterLevel.value || r.level === filterLevel.value) &&
      (!filterStatus.value || r.status === filterStatus.value) &&
      (!filterSupplierId.value || r.supplierId === filterSupplierId.value)
  )
}

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

async function launch8d() {
  const row = detailRow.value
  if (!row) return
  try {
    await ElMessageBox.confirm(`确定对来料异常 ${row.abnormalNo} 发起 8D 整改吗？`, '发起 8D', {
      type: 'warning',
    })
  } catch {
    return
  }
  launching.value = true
  try {
    await ncm8dApi.launchFromAbnormal({
      sourceRefId: row.id,
      issue: `来料异常:${row.abnormalNo}`,
      severity: row.level === '严重' ? '高' : '中',
    })
    ElMessage.success('8D 已发起')
    detailVisible.value = false
    fetch()
  } finally {
    launching.value = false
  }
}

async function launchCapa() {
  const row = detailRow.value
  if (!row) return
  try {
    await ElMessageBox.confirm(`确定对来料异常 ${row.abnormalNo} 发起 CAPA 整改吗？`, '发起 CAPA', {
      type: 'warning',
    })
  } catch {
    return
  }
  launching.value = true
  try {
    await ncmCapaApi.launchFromAbnormal({
      abnormalId: row.id,
      issue: `来料异常:${row.abnormalNo}`,
      triggerType: '来料异常',
      capaType: '纠正措施',
    })
    ElMessage.success('CAPA 已发起')
    detailVisible.value = false
    fetch()
  } finally {
    launching.value = false
  }
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
      <el-button type="primary" @click="fetch">查询</el-button>
      <el-tag v-if="filterSupplierId" closable type="warning" @close="clearSupplierFilter">
        供应商: {{ filterSupplierName || filterSupplierId }}
      </el-tag>
    </div>

    <el-table :data="filtered()" v-loading="loading" border>
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
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <span style="white-space: nowrap">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="danger" @click="openClose(row)">关闭</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 关闭 -->
    <el-dialog v-model="closeVisible" title="关闭来料异常" width="420px">
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
    <el-dialog v-model="detailVisible" title="来料异常详情" width="560px">
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
          @click="launch8d"
        >
          发起 8D{{ detailRow?.d8Id ? '（已发起）' : '' }}
        </el-button>
        <el-button
          type="success"
          :loading="launching"
          :disabled="!!detailRow?.capaId"
          @click="launchCapa"
        >
          发起 CAPA{{ detailRow?.capaId ? '（已发起）' : '' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
</style>
