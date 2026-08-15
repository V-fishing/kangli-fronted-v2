<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive, nextTick } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CsWorkOrder, CsWorkOrderDashboard } from '@/api/types/cs'
import { csWorkOrderApi } from '@/api/modules/cs/workOrder'
import type { UserSelectVo } from '@/api/types/uop'
import { usePermissionStore } from '@/stores/permission'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

const perm = usePermissionStore()

const list = ref<CsWorkOrder[]>([])
const loading = ref(false)
const keyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)

const dashboard = ref<CsWorkOrderDashboard>({})

const typeText = (t: string) => ({ INSTALL: '安装', REPAIR: '维修' }[t] || t)
const priorityText = (p: string) => ({ URGENT: '紧急', NORMAL: '普通', LOW: '低' }[p] || p)
const statusPill = (s: string) => {
  switch (s) {
    case 'PENDING': return 'p-wait'
    case 'ASSIGNED': return 'p-run'
    case 'DONE': return 'p-sign'
    case 'CLOSED': return 'p-done'
    default: return 'p-mute'
  }
}
const statusText = (s: string) => ({
  PENDING: '待派单', ASSIGNED: '处理中', DONE: '已完成', CLOSED: '已闭环',
}[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await csWorkOrderApi.page({
      keyword: keyword.value || undefined,
      woType: filterType.value || undefined,
      status: filterStatus.value || undefined,
      priority: filterPriority.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载工单失败')
  } finally {
    loading.value = false
  }
}
async function loadDashboard() {
  try {
    dashboard.value = await csWorkOrderApi.dashboard()
    await nextTick()
    renderTrend()
  } catch (e) { /* 忽略 */ }
}

// ===== 工单趋势分析(需求 2.4.1.3: 服务记录统计与趋势分析) =====
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])
const trendRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
function renderTrend() {
  if (!trendRef.value) return
  if (!trendChart) trendChart = echarts.init(trendRef.value)
  const monthly = dashboard.value.monthly || []
  trendChart.setOption({
    title: { text: '工单月度趋势（新建 / 已闭环）', left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#141414' } },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: monthly.map(m => m.month), axisLabel: { fontFamily: 'IBM Plex Mono', fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '新建', type: 'bar', data: monthly.map(m => m.created), itemStyle: { color: '#0047ab' }, barWidth: '30%' },
      { name: '已闭环', type: 'line', smooth: true, data: monthly.map(m => m.closed), itemStyle: { color: '#e4e2dd' }, lineStyle: { color: '#0047ab' } },
    ],
  })
}
function onResize() { trendChart?.resize() }
window.addEventListener('resize', onResize)
function onSearch() { page.value = 1; fetch() }

// ===== 创建 / 编辑 =====
const formDialog = ref(false)
const editingId = ref('')
const submitting = ref(false)
const form = reactive<CsWorkOrder>({
  orderNo: '', customerName: '', customerContact: '', woType: 'REPAIR', priority: 'NORMAL',
  productName: '', faultDesc: '', expectTime: '', address: '',
})
function openCreate() {
  editingId.value = ''
  Object.assign(form, {
    orderNo: '', customerName: '', customerContact: '', woType: 'REPAIR', priority: 'NORMAL',
    productName: '', faultDesc: '', expectTime: '', address: '',
  })
  formDialog.value = true
}
function openEdit(row: CsWorkOrder) {
  editingId.value = row.id as string
  Object.assign(form, {
    orderNo: row.orderNo, customerName: row.customerName, customerContact: row.customerContact,
    woType: row.woType, priority: row.priority, productName: row.productName,
    faultDesc: row.faultDesc, expectTime: row.expectTime, address: row.address,
  })
  formDialog.value = true
}
async function submitForm() {
  if (!form.customerName || !form.customerName.trim()) { ElMessage.warning('请填写客户名称'); return }
  submitting.value = true
  try {
    if (editingId.value) {
      await csWorkOrderApi.update({ id: editingId.value, ...form })
      ElMessage.success('已保存')
    } else {
      await csWorkOrderApi.create({ ...form })
      ElMessage.success('工单已创建')
    }
    formDialog.value = false
    fetch(); loadDashboard()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// ===== 派单 =====
const assignDialog = ref(false)
const assignRow = ref<CsWorkOrder | null>(null)
const users = ref<UserSelectVo[]>([])
const assignUserId = ref('')
const assignLoading = ref(false)
function openAssign(row: CsWorkOrder) {
  assignRow.value = row
  assignUserId.value = row.ownerId || ''
  assignDialog.value = true
  csWorkOrderApi.assignableUsers().then(r => { users.value = r }).catch(() => { users.value = [] })
}
async function submitAssign() {
  if (!assignRow.value?.id || !assignUserId.value) { ElMessage.warning('请选择负责人'); return }
  const u = users.value.find(x => x.id === assignUserId.value)
  assignLoading.value = true
  try {
    await csWorkOrderApi.assign(assignRow.value.id, assignUserId.value, u?.realName || '')
    ElMessage.success('已派单')
    assignDialog.value = false
    fetch(); loadDashboard()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '派单失败')
  } finally {
    assignLoading.value = false
  }
}

// ===== 完成 =====
const doneDialog = ref(false)
const doneRow = ref<CsWorkOrder | null>(null)
const handleDetail = ref('')
const doneLoading = ref(false)
function openDone(row: CsWorkOrder) {
  doneRow.value = row
  handleDetail.value = row.handleDetail || ''
  doneDialog.value = true
}
async function submitDone() {
  if (!doneRow.value?.id) return
  doneLoading.value = true
  try {
    await csWorkOrderApi.complete(doneRow.value.id, handleDetail.value)
    ElMessage.success('已标记完成')
    doneDialog.value = false
    fetch(); loadDashboard()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    doneLoading.value = false
  }
}

// ===== 评价闭环 =====
const closeDialog = ref(false)
const closeRow = ref<CsWorkOrder | null>(null)
const satisfaction = ref(5)
const satisfactionComment = ref('')
const closeLoading = ref(false)
function openClose(row: CsWorkOrder) {
  closeRow.value = row
  satisfaction.value = row.satisfaction || 5
  satisfactionComment.value = row.satisfactionComment || ''
  closeDialog.value = true
}
async function submitClose() {
  if (!closeRow.value?.id) return
  closeLoading.value = true
  try {
    await csWorkOrderApi.close(closeRow.value.id, satisfaction.value, satisfactionComment.value)
    ElMessage.success('已评价闭环')
    closeDialog.value = false
    fetch(); loadDashboard()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    closeLoading.value = false
  }
}

// ===== 删除 =====
async function doDelete(row: CsWorkOrder) {
  try {
    await ElMessageBox.confirm(`确认删除工单 ${row.orderNo}？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await csWorkOrderApi.delete(row.id as string)
    ElMessage.success('已删除')
    fetch(); loadDashboard()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

onMounted(() => { fetch(); loadDashboard() })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">售后管理</span><span class="crumb-sep">/</span><span class="crumb-link">工单管理</span></div>
        <h1>售后工单<span class="no mono">CS</span></h1>
      </div>
      <el-button v-if="perm.has('cs.workorder.create')" type="primary" @click="openCreate">新建工单</el-button>
    </div>

    <!-- 统计看板 -->
    <div class="stat-row">
      <div class="stat-card"><div class="stat-num mono c-cobalt">{{ dashboard.total || 0 }}</div><div class="stat-lbl">工单总数</div></div>
      <div class="stat-card"><div class="stat-num mono p-wait-t">{{ dashboard.pending || 0 }}</div><div class="stat-lbl">待派单</div></div>
      <div class="stat-card"><div class="stat-num mono p-run-t">{{ dashboard.assigned || 0 }}</div><div class="stat-lbl">处理中</div></div>
      <div class="stat-card"><div class="stat-num mono p-sign-t">{{ dashboard.done || 0 }}</div><div class="stat-lbl">已完成</div></div>
      <div class="stat-card"><div class="stat-num mono p-done-t">{{ dashboard.closed || 0 }}</div><div class="stat-lbl">已闭环</div></div>
      <div class="stat-card warn"><div class="stat-num mono hl-red">{{ dashboard.urgentPending || 0 }}</div><div class="stat-lbl">紧急待派单</div></div>
    </div>

    <el-card class="card-b" :body-style="{ padding: '16px 22px' }" style="margin-bottom:16px;">
      <div ref="trendRef" class="chart"></div>
    </el-card>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="工单号 / 客户 / 产品" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterType" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="安装" value="INSTALL" />
            <el-option label="维修" value="REPAIR" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="待派单" value="PENDING" />
            <el-option label="处理中" value="ASSIGNED" />
            <el-option label="已完成" value="DONE" />
            <el-option label="已闭环" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filterPriority" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="紧急" value="URGENT" />
            <el-option label="普通" value="NORMAL" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>工单清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="工单号" width="190">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.orderNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="客户" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.customerName || '—' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }"><span class="mono">{{ typeText(row.woType) }}</span></template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <span class="mono" :class="row.priority === 'URGENT' ? 'hl-red' : 'mute'">{{ priorityText(row.priority) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品/设备" prop="productName" min-width="160" show-overflow-tooltip />
        <el-table-column label="负责人" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.ownerName || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="满意度" width="90">
          <template #default="{ row }">
            <span v-if="row.satisfaction != null" class="mono" :class="row.satisfaction >= 4 ? 'c-green' : 'hl-red'">{{ row.satisfaction }}★</span>
            <span v-else class="mute">—</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }"><span class="mono">{{ row.createdAt || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)" v-if="perm.has('cs.workorder.edit') && row.status === 'PENDING'">编辑</el-button>
            <el-button link type="primary" size="small" @click="openAssign(row)" v-if="perm.has('cs.workorder.assign') && row.status === 'PENDING'">派单</el-button>
            <el-button link type="primary" size="small" @click="openDone(row)" v-if="perm.has('cs.workorder.assign') && row.status === 'ASSIGNED'">完成</el-button>
            <el-button link type="primary" size="small" @click="openClose(row)" v-if="perm.has('cs.workorder.close') && row.status === 'DONE'">评价</el-button>
            <el-button link type="danger" size="small" @click="doDelete(row)" v-if="perm.has('cs.workorder.delete') && row.status === 'PENDING'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 创建 / 编辑弹窗 -->
    <el-dialog v-model="formDialog" :title="editingId ? '编辑工单' : '新建工单'" width="560px" append-to-body>
      <el-form label-width="92px">
        <el-form-item label="工单号" v-if="editingId"><span class="mono c-cobalt">{{ form.orderNo }}</span></el-form-item>
        <el-form-item label="客户名称 *"><el-input v-model="form.customerName" placeholder="客户名称" /></el-form-item>
        <el-form-item label="联系方式"><el-input v-model="form.customerContact" placeholder="联系电话/邮箱" /></el-form-item>
        <el-form-item label="工单类型">
          <el-radio-group v-model="form.woType">
            <el-radio-button value="REPAIR">维修</el-radio-button>
            <el-radio-button value="INSTALL">安装</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio-button value="URGENT">紧急</el-radio-button>
            <el-radio-button value="NORMAL">普通</el-radio-button>
            <el-radio-button value="LOW">低</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="产品/设备"><el-input v-model="form.productName" placeholder="涉及产品/设备名称" /></el-form-item>
        <el-form-item label="故障描述"><el-input v-model="form.faultDesc" type="textarea" :rows="3" placeholder="故障现象 / 服务需求" /></el-form-item>
        <el-form-item label="期望时间"><el-date-picker v-model="form.expectTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="期望上门/完成时间" style="width:100%" /></el-form-item>
        <el-form-item label="服务地址"><el-input v-model="form.address" placeholder="服务地址" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog = false">取消</el-button>
        <el-button type="primary" :disabled="submitting" @click="submitForm">{{ submitting ? '提交中' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 派单弹窗 -->
    <el-dialog v-model="assignDialog" title="工单派单" width="480px" append-to-body>
      <div v-if="assignRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        工单：<span class="mono c-cobalt">{{ assignRow.orderNo }}</span> {{ assignRow.customerName }}
      </div>
      <el-form label-width="80px">
        <el-form-item label="负责人 *">
          <el-select v-model="assignUserId" filterable placeholder="选择负责人" style="width:100%">
            <el-option v-for="u in users" :key="u.id" :label="u.realName || u.username" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialog = false">取消</el-button>
        <el-button type="primary" :disabled="assignLoading" @click="submitAssign">{{ assignLoading ? '提交中' : '确认派单' }}</el-button>
      </template>
    </el-dialog>

    <!-- 完成弹窗 -->
    <el-dialog v-model="doneDialog" title="标记完成" width="520px" append-to-body>
      <div v-if="doneRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        工单：<span class="mono c-cobalt">{{ doneRow.orderNo }}</span> 负责人：{{ doneRow.ownerName || '—' }}
      </div>
      <el-form label-width="80px">
        <el-form-item label="处理过程 *"><el-input v-model="handleDetail" type="textarea" :rows="4" placeholder="处理措施 / 完成情况" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="doneDialog = false">取消</el-button>
        <el-button type="primary" :disabled="doneLoading" @click="submitDone">{{ doneLoading ? '提交中' : '确认完成' }}</el-button>
      </template>
    </el-dialog>

    <!-- 评价闭环弹窗 -->
    <el-dialog v-model="closeDialog" title="评价闭环" width="480px" append-to-body>
      <div v-if="closeRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        工单：<span class="mono c-cobalt">{{ closeRow.orderNo }}</span> {{ closeRow.customerName }}
      </div>
      <el-form label-width="80px">
        <el-form-item label="满意度 *">
          <el-rate v-model="satisfaction" :max="5" />
        </el-form-item>
        <el-form-item label="评价"><el-input v-model="satisfactionComment" type="textarea" :rows="3" placeholder="客户评价 / 备注" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog = false">取消</el-button>
        <el-button type="primary" :disabled="closeLoading" @click="submitClose">{{ closeLoading ? '提交中' : '确认闭环' }}</el-button>
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
.page-wrap :deep(.pill .d) { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.page-wrap :deep(.p-wait) { background: $amber-dim; color: $amber; }
.page-wrap :deep(.p-wait .d) { background: $amber; }
.page-wrap :deep(.p-run) { background: $cobalt-dim; color: $cobalt; }
.page-wrap :deep(.p-run .d) { background: $cobalt; }
.page-wrap :deep(.p-sign) { background: $green-dim; color: $green; }
.page-wrap :deep(.p-sign .d) { background: $green; }
.page-wrap :deep(.p-done) { background: $ink-faint-dim; color: $ink-faint; }
.page-wrap :deep(.p-done .d) { background: $ink-faint; }
.page-wrap :deep(.p-mute) { background: $ink-faint-dim; color: $ink-faint; }
.page-wrap :deep(.p-mute .d) { background: $ink-faint; }

.stat-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 16px; }
.chart { width: 100%; height: 320px; }
.stat-card {
  background: #fff; border: 1px solid $hairline; border-radius: 8px; padding: 14px 16px;
}
.stat-card.warn { border-color: $signal-red-dim; }
.stat-num { font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-lbl { font-size: 12px; color: $ink-faint; margin-top: 4px; }
</style>
