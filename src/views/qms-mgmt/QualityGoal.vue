<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { QmsQualityGoal, QmsMgmtStats } from '@/api/types/qmsMgmt'
import { qmsGoalApi } from '@/api/modules/qmsMgmt'
import { usePermissionStore } from '@/stores/permission'
import StatCards from '@/components/common/StatCards.vue'

const perm = usePermissionStore()

const list = ref<QmsQualityGoal[]>([])
const loading = ref(false)
const keyword = ref('')
const filterType = ref('')
const filterPeriod = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)
const stats = ref<QmsMgmtStats>({})

const typeText = (t: string) => ({
  QUALITY: '质量', DELIVERY: '交付', SATISFACTION: '满意度', COST: '成本', OTHER: '其他',
}[t] || t)

function rateOf(r: QmsQualityGoal) {
  const t = Number(r.targetValue || 0), a = Number(r.actualValue || 0)
  if (t === 0) return 100
  return Math.round((a / t) * 1000) / 10
}

function statusPill(r: QmsQualityGoal) {
  const r2 = rateOf(r)
  return r2 >= 100 ? 'p-done' : r2 >= 80 ? 'p-run' : 'p-wait'
}
function statusText(r: QmsQualityGoal) {
  const r2 = rateOf(r)
  return r2 >= 100 ? '达标' : r2 >= 80 ? '接近' : '未达标'
}

async function fetch() {
  loading.value = true
  try {
    const res = await qmsGoalApi.page({
      keyword: keyword.value || undefined,
      goalType: filterType.value || undefined,
      period: filterPeriod.value || undefined,
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
  try { stats.value = await qmsGoalApi.stats() } catch (e) { /* ignore */ }
}
function onSearch() { page.value = 1; fetch() }

const formDialog = ref(false)
const editingId = ref('')
const submitting = ref(false)
const form = reactive<QmsQualityGoal>({
  goalName: '', goalType: 'QUALITY', period: '', targetValue: 0, actualValue: 0,
  unit: '%', owner: '', deadline: '', remark: '',
})
function openCreate() {
  editingId.value = ''
  Object.assign(form, {
    goalName: '', goalType: 'QUALITY', period: '', targetValue: 0, actualValue: 0,
    unit: '%', owner: '', deadline: '', remark: '',
  })
  formDialog.value = true
}
function openEdit(row: QmsQualityGoal) {
  editingId.value = row.id as string
  Object.assign(form, {
    goalName: row.goalName, goalType: row.goalType, period: row.period,
    targetValue: row.targetValue, actualValue: row.actualValue, unit: row.unit,
    owner: row.owner, deadline: row.deadline, remark: row.remark,
  })
  formDialog.value = true
}
async function submitForm() {
  if (!form.goalName || !form.goalName.trim()) { ElMessage.warning('请填写目标名称'); return }
  if (form.targetValue == null) form.targetValue = 0
  if (form.actualValue == null) form.actualValue = 0
  submitting.value = true
  try {
    if (editingId.value) {
      await qmsGoalApi.update({ id: editingId.value, ...form })
      ElMessage.success('已保存')
    } else {
      await qmsGoalApi.create({ ...form })
      ElMessage.success('目标已创建')
    }
    formDialog.value = false
    fetch(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function doDelete(row: QmsQualityGoal) {
  try {
    await ElMessageBox.confirm(`确认删除目标 ${row.goalName}？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await qmsGoalApi.delete(row.id as string)
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
        <div class="crumb"><span class="crumb-node">体系管理</span><span class="crumb-sep">/</span><span class="crumb-link">质量目标管理</span></div>
        <h1>质量目标<span class="no mono">QMS</span></h1>
      </div>
      <el-button v-if="perm.has('qms-mgmt.goal.create')" type="primary" @click="openCreate">新建目标</el-button>
    </div>

    <StatCards :cards="[
      { num: stats.total || 0, label: '目标总数', tone: 'cobalt' },
      { num: (stats.overallRate || 0) + '%', label: '整体达成率', tone: 'done' },
      { num: stats.notReached || 0, label: '未达标数', tone: 'red', warn: true },
    ]" />

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="目标名称 / 责任人" clearable style="width:220px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterType" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="质量" value="QUALITY" />
            <el-option label="交付" value="DELIVERY" />
            <el-option label="满意度" value="SATISFACTION" />
            <el-option label="成本" value="COST" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期">
          <el-input v-model="filterPeriod" placeholder="如 2026Q1 / 2026年度" clearable style="width:160px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>目标清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="目标名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.goalName || '—' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }"><span class="mono">{{ typeText(row.goalType) }}</span></template>
        </el-table-column>
        <el-table-column label="周期" width="130">
          <template #default="{ row }"><span class="mono">{{ row.period || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="目标值" width="110">
          <template #default="{ row }"><span class="mono">{{ row.targetValue }}{{ row.unit }}</span></template>
        </el-table-column>
        <el-table-column label="实际值" width="110">
          <template #default="{ row }"><span class="mono">{{ row.actualValue }}{{ row.unit }}</span></template>
        </el-table-column>
        <el-table-column label="达成率" width="110">
          <template #default="{ row }">
            <span class="mono" :class="rateOf(row) >= 100 ? 'c-green' : 'hl-red'">{{ rateOf(row) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="责任人" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.owner || '—' }}</template>
        </el-table-column>
        <el-table-column label="截止" width="130">
          <template #default="{ row }"><span class="mono">{{ (row.deadline || '').slice(0, 10) || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="pill" :class="statusPill(row)"><span class="d"></span>{{ statusText(row) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)" v-if="perm.has('qms-mgmt.goal.edit')">编辑</el-button>
            <el-button link type="danger" size="small" @click="doDelete(row)" v-if="perm.has('qms-mgmt.goal.delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="formDialog" :title="editingId ? '编辑目标' : '新建目标'" width="560px" append-to-body>
      <el-form label-width="92px">
        <el-form-item label="目标名称 *"><el-input v-model="form.goalName" placeholder="如 出厂合格率" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.goalType" style="width:100%">
            <el-option label="质量" value="QUALITY" />
            <el-option label="交付" value="DELIVERY" />
            <el-option label="满意度" value="SATISFACTION" />
            <el-option label="成本" value="COST" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="统计周期"><el-input v-model="form.period" placeholder="如 2026Q1 / 2026年度" /></el-form-item>
        <el-form-item label="目标值 *"><el-input-number v-model="form.targetValue" :precision="2" :step="1" style="width:100%" /></el-form-item>
        <el-form-item label="实际值"><el-input-number v-model="form.actualValue" :precision="2" :step="1" style="width:100%" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" placeholder="% / 天 / 分 / 件" style="width:120px" /></el-form-item>
        <el-form-item label="责任人"><el-input v-model="form.owner" placeholder="责任人" /></el-form-item>
        <el-form-item label="截止时间"><el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="目标截止" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog = false">取消</el-button>
        <el-button type="primary" :disabled="submitting" @click="submitForm">{{ submitting ? '提交中' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

