<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { QmsAdverseEvent, QmsMgmtStats } from '@/api/types/qmsMgmt'
import { qmsAdverseApi } from '@/api/modules/qmsMgmt'
import { usePermissionStore } from '@/stores/permission'
import StatCards from '@/components/common/StatCards.vue'

const perm = usePermissionStore()

const list = ref<QmsAdverseEvent[]>([])
const loading = ref(false)
const keyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const page = ref(1), size = ref(20), total = ref(0)
const stats = ref<QmsMgmtStats>({})

const statusPill = (s: string) => ({ PENDING: 'p-wait', HANDLING: 'p-run', DONE: 'p-done' }[s] || 'p-mute')
const statusText = (s: string) => ({ PENDING: '待处理', HANDLING: '处理中', DONE: '已办结' }[s] || s)
const severityPill = (s: string) => ({ GENERAL: 'p-mute', SERIOUS: 'p-run', CRITICAL: 'p-wait' }[s] || 'p-mute')
const severityText = (s: string) => ({ GENERAL: '一般', SERIOUS: '严重', CRITICAL: '危急' }[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await qmsAdverseApi.page({
      keyword: keyword.value || undefined,
      eventType: filterType.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}
async function loadStats() {
  try { stats.value = await qmsAdverseApi.stats() } catch (e) { /* ignore */ }
}
function onSearch() { page.value = 1; fetch() }

const formDialog = ref(false)
const editingId = ref('')
const submitting = ref(false)
const form = reactive<QmsAdverseEvent>({
  eventNo: '', eventType: '投诉', occurStage: '使用', severity: 'GENERAL',
  occurAt: '', reportAt: '', rootCause: '', handleDesc: '', handleTimeliness: '及时', owner: '', status: 'PENDING', remark: '',
})
function openCreate() {
  editingId.value = ''
  Object.assign(form, {
    eventNo: '', eventType: '投诉', occurStage: '使用', severity: 'GENERAL',
    occurAt: '', reportAt: '', rootCause: '', handleDesc: '', handleTimeliness: '及时', owner: '', status: 'PENDING', remark: '',
  })
  formDialog.value = true
}
function openEdit(row: QmsAdverseEvent) {
  editingId.value = row.id as string
  Object.assign(form, {
    eventNo: row.eventNo, eventType: row.eventType, occurStage: row.occurStage, severity: row.severity,
    occurAt: row.occurAt, reportAt: row.reportAt, rootCause: row.rootCause, handleDesc: row.handleDesc,
    handleTimeliness: row.handleTimeliness, owner: row.owner, status: row.status, remark: row.remark,
  })
  formDialog.value = true
}
async function submitForm() {
  if (!form.eventType || !form.eventType.trim()) { ElMessage.warning('请填写事件类型'); return }
  submitting.value = true
  try {
    if (editingId.value) {
      await qmsAdverseApi.update({ id: editingId.value, ...form })
      ElMessage.success('已保存')
    } else {
      await qmsAdverseApi.create({ ...form })
      ElMessage.success('事件已登记')
    }
    formDialog.value = false
    fetch(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}
async function handle(row: QmsAdverseEvent, status: string) {
  try {
    await qmsAdverseApi.handle(row.id as string, status, row.handleDesc, row.owner)
    ElMessage.success('状态已更新')
    fetch(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}
async function doDelete(row: QmsAdverseEvent) {
  try {
    await ElMessageBox.confirm(`确认删除事件 ${row.eventNo}？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await qmsAdverseApi.delete(row.id as string)
    ElMessage.success('已删除')
    fetch(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

onMounted(() => { fetch(); loadStats() })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">体系管理</span><span class="crumb-sep">/</span><span class="crumb-link">不良事件管理</span></div>
        <h1>不良事件<span class="no mono">QMS</span></h1>
      </div>
      <el-button v-if="perm.has('qms-mgmt.adverse.create')" type="primary" @click="openCreate">登记事件</el-button>
    </div>

    <StatCards :cards="[
      { num: stats.total || 0, label: '事件总数', tone: 'cobalt' },
      { num: stats.pending || 0, label: '待处理', tone: 'wait', warn: true },
      { num: stats.handling || 0, label: '处理中', tone: 'run' },
      { num: stats.done || 0, label: '已办结', tone: 'done' },
      { num: stats.critical || 0, label: '危急事件', tone: 'red', warn: true },
    ]" />

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="事件编号 / 类型 / 根因" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterType" clearable placeholder="全部" style="width:140px" @change="onSearch">
            <el-option label="投诉" value="投诉" />
            <el-option label="器械故障" value="器械故障" />
            <el-option label="伤害" value="伤害" />
            <el-option label="召回" value="召回" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="待处理" value="PENDING" />
            <el-option label="处理中" value="HANDLING" />
            <el-option label="已办结" value="DONE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>事件清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="事件编号" width="190">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.eventNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ row.eventType || '—' }}</template>
        </el-table-column>
        <el-table-column label="环节" width="100">
          <template #default="{ row }">{{ row.occurStage || '—' }}</template>
        </el-table-column>
        <el-table-column label="负责人" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.owner || '—' }}</template>
        </el-table-column>
        <el-table-column label="严重度" width="110">
          <template #default="{ row }"><span class="pill" :class="severityPill(row.severity)"><span class="d"></span>{{ severityText(row.severity) }}</span></template>
        </el-table-column>
        <el-table-column label="发生时间" width="130">
          <template #default="{ row }"><span class="mono">{{ (row.occurAt || '').slice(0, 10) || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="上报时间" width="130">
          <template #default="{ row }"><span class="mono">{{ (row.reportAt || '').slice(0, 10) || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="时效" width="90">
          <template #default="{ row }">
            <span class="mono" :class="row.handleTimeliness === '逾期' ? 'hl-red' : 'c-green'">{{ row.handleTimeliness || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)" v-if="perm.has('qms-mgmt.adverse.edit')">编辑</el-button>
            <el-button link type="primary" size="small" @click="handle(row, 'HANDLING')" v-if="perm.has('qms-mgmt.adverse.edit') && row.status === 'PENDING'">处理</el-button>
            <el-button link type="primary" size="small" @click="handle(row, 'DONE')" v-if="perm.has('qms-mgmt.adverse.edit') && row.status === 'HANDLING'">办结</el-button>
            <el-button link type="danger" size="small" @click="doDelete(row)" v-if="perm.has('qms-mgmt.adverse.delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination :current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next"
          @current-change="(p:number)=>{page=p;fetch()}" />
      </div>
    </el-card>

    <el-dialog v-model="formDialog" :title="editingId ? '编辑事件' : '登记事件'" width="600px">
      <el-form label-width="92px">
        <el-form-item label="事件类型 *"><el-input v-model="form.eventType" placeholder="如 投诉 / 器械故障" /></el-form-item>
        <el-form-item label="发生环节">
          <el-select v-model="form.occurStage" style="width:100%">
            <el-option label="生产" value="生产" />
            <el-option label="流通" value="流通" />
            <el-option label="使用" value="使用" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重度">
          <el-select v-model="form.severity" style="width:100%">
            <el-option label="一般" value="GENERAL" />
            <el-option label="严重" value="SERIOUS" />
            <el-option label="危急" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="发生时间"><el-date-picker v-model="form.occurAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="发生时间" style="width:100%" /></el-form-item>
        <el-form-item label="上报时间"><el-date-picker v-model="form.reportAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="上报时间" style="width:100%" /></el-form-item>
        <el-form-item label="根源分析"><el-input v-model="form.rootCause" type="textarea" :rows="3" placeholder="根源分析" /></el-form-item>
        <el-form-item label="处理措施"><el-input v-model="form.handleDesc" type="textarea" :rows="3" placeholder="处理措施" /></el-form-item>
        <el-form-item label="处理时效">
          <el-radio-group v-model="form.handleTimeliness">
            <el-radio-button value="及时">及时</el-radio-button>
            <el-radio-button value="逾期">逾期</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理负责人"><el-input v-model="form.owner" placeholder="处理负责人" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog = false">取消</el-button>
        <el-button type="primary" :disabled="submitting" @click="submitForm">{{ submitting ? '提交中' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

