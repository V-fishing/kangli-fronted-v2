<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TlmRepair } from '@/api/types/tlm'
import type { NcmDefectDict } from '@/api/types/ncm'
import { tlmRepairApi } from '@/api/modules/tlm/repair'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import { ncmDefectDictApi } from '@/api/modules/ncm/defect-dicts'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const perm = usePermissionStore()

const list = ref<TlmRepair[]>([])
const loading = ref(false)
const keyword = ref('')
const filterStatus = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)

const statusPill = (s: string) => {
  switch (s) {
    case 'PENDING': return 'p-wait'
    case 'REPAIRING': return 'p-run'
    case 'DONE': return 'p-done'
    case 'VERIFYING': return 'p-wait'
    case 'VERIFIED': return 'p-done'
    default: return 'p-wait'
  }
}
const statusText = (s: string) => ({
  PENDING: '待处理', REPAIRING: '维修中', DONE: '已完成',
  VERIFYING: '验证中', VERIFIED: '已验证',
}[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await tlmRepairApi.page({
      keyword: keyword.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载维修工单失败')
  } finally {
    loading.value = false
  }
}

function onSearch() { page.value = 1; fetch() }
function goTooling(row: TlmRepair) {
  if (row.toolId) router.push(`/tlm/tooling/${row.toolId}`)
}

// ---- 维修工单操作(按状态推进) ----
const fillDialog = ref(false)
const filling = ref(false)
const fillMeasure = ref('')
const fillRow = ref<TlmRepair | null>(null)

function openFill(row: TlmRepair) {
  fillRow.value = row
  fillMeasure.value = row.measure || ''
  fillDialog.value = true
}
async function submitFill() {
  if (!fillRow.value?.toolId) return
  filling.value = true
  try {
    await tlmToolingApi.repairFill(fillRow.value.toolId, fillMeasure.value)
    ElMessage.success('已填写维修措施，工装进入维修中')
    fillDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    filling.value = false
  }
}
async function doRepairDone(row: TlmRepair) {
  if (!row.toolId) return
  try {
    await tlmToolingApi.repairDone(row.toolId)
    ElMessage.success('已标记维修完成，待首件验证')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}
async function doVerify(row: TlmRepair) {
  if (!row.toolId) return
  try {
    await tlmToolingApi.repairComplete(row.toolId)
    ElMessage.success('验证通过，工装恢复在用并触发首件检验')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}

// ---- 发起不良(工装维修 → NCM 不良列表) ----
const dicts = ref<NcmDefectDict[]>([])
const defectDialog = ref(false)
const defectSubmitting = ref(false)
const defectRow = ref<TlmRepair | null>(null)
const defectForm = reactive({
  defectDictCode: '',
  severity: '一般',
  defectCount: 1,
  batchTotal: 1,
  remark: '',
})
function openDefect(row: TlmRepair) {
  defectRow.value = row
  Object.assign(defectForm, { defectDictCode: '', severity: '一般', defectCount: 1, batchTotal: 1, remark: '' })
  defectDialog.value = true
}
async function submitDefect() {
  if (!defectRow.value?.toolId) return
  if (!defectForm.defectDictCode) { ElMessage.warning('请选择缺陷编码'); return }
  defectSubmitting.value = true
  try {
    await ncmDefectRecordApi.create({
      source: '工装',
      toolId: defectRow.value.toolId,
      toolNo: defectRow.value.toolNo,
      defectDictCode: defectForm.defectDictCode,
      severity: defectForm.severity,
      defectCount: defectForm.defectCount,
      batchTotal: defectForm.batchTotal,
      remark: defectForm.remark || `工装修维修发起:${defectRow.value.toolNo} ${defectRow.value.faultDesc || ''}`,
      stage: '半成品不良',
    } as any)
    ElMessage.success('已发起不良记录，已进入不良管理列表')
    defectDialog.value = false
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '发起失败')
  } finally {
    defectSubmitting.value = false
  }
}

onMounted(() => { fetch(); ncmDefectDictApi.list().then(d => dicts.value = d).catch(() => {}) })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">维修工单</span></div>
        <h1>工装维修单<span class="no mono">TLM</span></h1>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="工装编号 / 名称" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:140px" @change="onSearch">
            <el-option label="待处理" value="PENDING" />
            <el-option label="维修中" value="REPAIRING" />
            <el-option label="已完成" value="DONE" />
            <el-option label="验证中" value="VERIFYING" />
            <el-option label="已验证" value="VERIFIED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>维修工单清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="维修单号" width="200">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.repairNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="工装" min-width="200">
          <template #default="{ row }">
            <span class="mono">{{ row.toolNo || '—' }}</span>
            <span v-if="row.toolName" style="margin-left:6px;">{{ row.toolName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="faultDesc" label="故障现象" min-width="200" show-overflow-tooltip />
        <el-table-column prop="measure" label="维修措施" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }"><span class="mono">{{ row.createdAt || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goTooling(row)">详情</el-button>
            <el-button v-if="(row.status === 'PENDING' || row.status === 'REPAIRING') && perm.has('tlm.tooling.repair')" link type="primary" size="small" @click="openFill(row)">填写措施</el-button>
            <el-button v-if="row.status === 'REPAIRING' && perm.has('tlm.tooling.repair')" link type="primary" size="small" @click="doRepairDone(row)">完成维修</el-button>
            <el-button v-if="row.status === 'DONE' && perm.has('tlm.tooling.repair')" link type="primary" size="small" @click="doVerify(row)">验证通过</el-button>
            <el-button link type="warning" size="small" @click="openDefect(row)">发起不良</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 填写维修措施弹窗 -->
    <el-dialog v-model="fillDialog" title="填写维修措施" width="520px" :modal="false" append-to-body>
      <div v-if="fillRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        工装：<span class="mono c-cobalt">{{ fillRow.toolNo }}</span> {{ fillRow.toolName }}
      </div>
      <div style="display:grid;gap:8px;">
        <div><label class="l">故障现象</label><div class="v-mute">{{ fillRow?.faultDesc || '—' }}</div></div>
        <div><label class="l">维修措施 *</label><el-input v-model="fillMeasure" type="textarea" :rows="4" placeholder="如：更换磨损导柱、校准定位精度至 ±0.02mm" /></div>
      </div>
      <template #footer>
        <el-button @click="fillDialog = false">取消</el-button>
        <el-button type="primary" :disabled="filling" @click="submitFill">{{ filling ? '提交中' : '确认填写' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="defectDialog" title="发起不良记录（工装来源）" width="520px" append-to-body>
      <div v-if="defectRow" style="margin-bottom:12px;font-size:13px;color:var(--el-text-color-regular);">
        工装：<span class="mono c-cobalt">{{ defectRow.toolNo }}</span> {{ defectRow.toolName }}
      </div>
      <el-form :model="defectForm" label-width="80px">
        <el-form-item label="缺陷编码" required>
          <el-select v-model="defectForm.defectDictCode" filterable placeholder="选择不良字典" style="width:100%" v-loading="dicts.length===0">
            <el-option v-for="d in dicts" :key="d.code" :label="`${d.code} · ${d.name}`" :value="d.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重度" required>
          <el-select v-model="defectForm.severity" style="width:100%"><el-option v-for="s in ['严重','一般','轻微']" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="不良数量" required><el-input-number v-model="defectForm.defectCount" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="批次总数"><el-input-number v-model="defectForm.batchTotal" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="defectForm.remark" type="textarea" :rows="2" placeholder="如：工装磨损导致尺寸超差" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="defectDialog=false">取消</el-button>
        <el-button type="primary" :loading="defectSubmitting" @click="submitDefect">确认发起不良</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-wrap :deep(.pill) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}
.page-wrap :deep(.pill .d) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.page-wrap :deep(.p-wait) { background: $amber-dim; color: $amber; }
.page-wrap :deep(.p-wait .d) { background: $amber; }
.page-wrap :deep(.p-run) { background: $cobalt-dim; color: $cobalt; }
.page-wrap :deep(.p-run .d) { background: $cobalt; }
.page-wrap :deep(.p-lock) { background: $signal-red-dim; color: $signal-red; }
.page-wrap :deep(.p-lock .d) { background: $signal-red; }
.page-wrap :deep(.p-done) { background: $green-dim; color: $green; }
.page-wrap :deep(.p-done .d) { background: $green; }
.page-wrap :deep(.p-mute) { background: $ink-faint-dim; color: $ink-faint; }
.page-wrap :deep(.p-mute .d) { background: $ink-faint; }
</style>
