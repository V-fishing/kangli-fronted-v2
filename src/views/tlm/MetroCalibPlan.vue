<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { TlmCalibPlan } from '@/api/types/tlm'
import { metroApi } from '@/api/modules/tlm/metro'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()

const list = ref<TlmCalibPlan[]>([])
const loading = ref(false)
const keyword = ref('')
const statusTab = ref<'ALL' | 'PENDING' | 'DONE' | 'OVERDUE'>('ALL')
const page = ref(1), size = ref(20), total = ref(0)

const statusPill = (s: string) => {
  switch (s) {
    case 'DONE': return 'p-done'
    case 'OVERDUE': return 'p-lock'
    case 'PENDING': return 'p-wait'
    default: return 'p-mute'
  }
}
const statusText = (s: string) => ({ PENDING: '待校准', DONE: '已完成', OVERDUE: '已超期' }[s] || s)

// ---------------- 手动新建计划单 ----------------
const createDialog = ref(false)
const createSaving = ref(false)
const gaugeOptions = ref<{ id: string; label: string }[]>([])
const createForm = ref({ toolId: '', planCycle: 12, planDueDate: '' })

async function openCreate() {
  createForm.value = { toolId: '', planCycle: 12, planDueDate: '' }
  createDialog.value = true
  try {
    const res = await metroApi.gaugeList({ page: 1, size: 200 })
    gaugeOptions.value = (res.records || []).map((g: any) => ({ id: g.id, label: g.toolNo + ' ' + g.toolName }))
  } catch { gaugeOptions.value = [] }
}
async function submitCreate() {
  if (!createForm.value.toolId) { ElMessage.warning('请选择计量器具'); return }
  if (!createForm.value.planDueDate) { ElMessage.warning('请选择计划到期日'); return }
  createSaving.value = true
  try {
    await metroApi.createManual(createForm.value.toolId, createForm.value.planCycle, createForm.value.planDueDate)
    ElMessage.success('已新建校准计划单')
    createDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '新建失败')
  } finally {
    createSaving.value = false
  }
}

async function fetch() {
  loading.value = true
  try {
    const res = await metroApi.planPage({
      keyword: keyword.value || undefined,
      status: statusTab.value === 'ALL' ? undefined : statusTab.value,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onSearch() { page.value = 1; fetch() }
function onTab(c: string) { statusTab.value = c as any; page.value = 1; fetch() }

// ---------------- 校准录入 ----------------
const calibDialog = ref(false)
const saving = ref(false)
const calibRow = ref<TlmCalibPlan | null>(null)
const calibForm = ref({ calibDate: '', calibDueDate: '', calibCycle: 12, upperLimit: '', result: '合格', remark: '', certNo: '' })

function openCalib(row: TlmCalibPlan) {
  calibRow.value = row
  calibForm.value = {
    calibDate: new Date().toISOString().slice(0, 10),
    calibDueDate: row.planDueDate || '',
    calibCycle: row.planCycle || 12,
    upperLimit: '',
    result: '合格',
    remark: '',
    certNo: '',
  }
  calibDialog.value = true
}
async function submitCalib() {
  if (!calibRow.value) return
  if (!calibForm.value.calibDate) { ElMessage.warning('请填写校准日期'); return }
  saving.value = true
  try {
      await metroApi.recordCalib(calibRow.value.id!, {
      calibDate: calibForm.value.calibDate,
      calibDueDate: calibForm.value.calibDueDate || undefined,
      calibCycle: calibForm.value.calibCycle,
      upperLimit: calibForm.value.upperLimit || undefined,
      result: calibForm.value.result,
      remark: calibForm.value.remark || undefined,
      certNo: calibForm.value.certNo || undefined,
    })
    ElMessage.success('已录入校准结果，器具已解锁')
    calibDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '录入失败')
  } finally {
    saving.value = false
  }
}

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">计量管理</span><span class="crumb-sep">/</span><span class="crumb-node">校准计划</span></div>
        <h1>校准计划<span class="no mono">CALIB PLAN</span></h1>
      </div>
      <div class="head-actions">
        <el-button v-if="perm.has('tlm.metro.calib')" type="primary" @click="openCreate">新建计划单</el-button>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="器具编号 / 名称" clearable style="width:200px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
      <el-radio-group v-model="statusTab" @change="(c:any)=>onTab(c)">
        <el-radio-button value="ALL">全部</el-radio-button>
        <el-radio-button value="PENDING">待校准</el-radio-button>
        <el-radio-button value="DONE">已完成</el-radio-button>
        <el-radio-button value="OVERDUE">已超期</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>校准计划单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column prop="toolNo" label="器具编号" width="150">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.toolNo }}</span></template>
        </el-table-column>
        <el-table-column prop="toolName" label="器具名称" min-width="170" />
        <el-table-column label="计划周期" width="100">
          <template #default="{ row }"><span class="mono">{{ row.planCycle != null ? row.planCycle + '月' : '—' }}</span></template>
        </el-table-column>
        <el-table-column label="计划到期" width="130">
          <template #default="{ row }"><span class="mono" :class="row.status==='OVERDUE' ? 'c-red' : 'c-green'">{{ row.planDueDate || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="来源" width="90">
          <template #default="{ row }"><span class="tag-b">{{ row.source === 'AUTO' ? '自动' : '手动' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'DONE' && perm.has('tlm.metro.calib')" link type="primary" size="small" @click="openCalib(row)">校准录入</el-button>
            <span v-else class="mute" style="font-size:12px;">已录入</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 校准结果录入弹窗 -->
    <el-dialog v-model="calibDialog" title="校准结果录入" width="520px" append-to-body>
      <div v-if="calibRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        器具：<span class="mono c-cobalt">{{ calibRow.toolNo }}</span> {{ calibRow.toolName }}
      </div>
      <div style="display:grid;gap:14px;">
        <div><label class="l">校准日期 *</label><el-date-picker v-model="calibForm.calibDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></div>
        <div><label class="l">下次校准日期</label><el-date-picker v-model="calibForm.calibDueDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></div>
        <div><label class="l">校准周期(月)</label><el-input-number v-model="calibForm.calibCycle" :min="1" controls-position="right" style="width:100%" /></div>
        <div><label class="l">允许误差上限</label><el-input v-model="calibForm.upperLimit" style="width:100%" placeholder="如：±0.02mm" /></div>
        <div><label class="l">证书编号</label><el-input v-model="calibForm.certNo" style="width:100%" placeholder="校准证书/报告编号" /></div>
        <div><label class="l">校准结果</label>
          <el-radio-group v-model="calibForm.result">
            <el-radio-button value="合格">合格</el-radio-button>
            <el-radio-button value="限用">限用</el-radio-button>
            <el-radio-button value="不合格">不合格</el-radio-button>
          </el-radio-group>
        </div>
        <div><label class="l">备注</label><el-input v-model="calibForm.remark" type="textarea" :rows="2" placeholder="校准结论/证书编号等" /></div>
      </div>
      <template #footer>
        <el-button @click="calibDialog = false">取消</el-button>
        <el-button type="primary" :disabled="saving" @click="submitCalib">{{ saving ? '提交中' : '确认录入' }}</el-button>
      </template>
    </el-dialog>

    <!-- 手动新建校准计划单 -->
    <el-dialog v-model="createDialog" title="新建校准计划单" width="520px" append-to-body>
      <div style="display:grid;gap:14px;">
        <div><label class="l">计量器具 *</label>
          <el-select v-model="createForm.toolId" filterable placeholder="选择计量器具" style="width:100%">
            <el-option v-for="g in gaugeOptions" :key="g.id" :label="g.label" :value="g.id" />
          </el-select>
        </div>
        <div><label class="l">计划周期(月)</label><el-input-number v-model="createForm.planCycle" :min="1" controls-position="right" style="width:100%" /></div>
        <div><label class="l">计划到期日 *</label><el-date-picker v-model="createForm.planDueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
      </div>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" :disabled="createSaving" @click="submitCreate">{{ createSaving ? '提交中' : '确认新建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
