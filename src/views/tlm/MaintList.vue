<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { TlmMaintPlan, TlmMaintRecord } from '@/api/types/tlm'
import { tlmMaintApi } from '@/api/modules/tlm/maint'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()
const plans = ref<TlmMaintPlan[]>([])
const records = ref<TlmMaintRecord[]>([])
const tools = ref<{ id: string; toolName: string; toolNo: string }[]>([])
const loading = ref(false)

// 筛选
const planToolId = ref('')
const recToolId = ref('')

// 保养计划弹窗
const planDialog = ref(false)
const savingPlan = ref(false)
const planForm = reactive<Partial<TlmMaintPlan>>({})
let editingPlanId: string | null = null

// 保养记录弹窗
const recDialog = ref(false)
const savingRec = ref(false)
const recForm = reactive<Partial<TlmMaintRecord>>({})

async function loadTools() {
  const res = await tlmToolingApi.page({ size: 200 })
  tools.value = res.records.map((t: any) => ({ id: t.id, toolName: t.toolName, toolNo: t.toolNo }))
}
async function fetch() {
  loading.value = true
  try {
    const p = await tlmMaintApi.planPage({ toolId: planToolId.value || undefined, page: 1, size: 200 })
    plans.value = p.records
    records.value = await tlmMaintApi.records(recToolId.value || undefined)
  } finally { loading.value = false }
}
function toolName(id?: string) { const t = tools.value.find((x) => x.id === id); return t ? `${t.toolNo} ${t.toolName}` : '—' }

function openCreatePlan() {
  editingPlanId = null
  Object.assign(planForm, { cycleType: 'MONTH' })
  planDialog.value = true
}
function openEditPlan(row: TlmMaintPlan) { editingPlanId = row.id || null; Object.assign(planForm, JSON.parse(JSON.stringify(row))); planDialog.value = true }
async function submitPlan() {
  if (!planForm.toolId || !planForm.nextDate) { ElMessage.warning('请选择工装与下次保养日期'); return }
  savingPlan.value = true
  try {
    if (editingPlanId) { await tlmMaintApi.updatePlan(planForm); ElMessage.success('已保存') }
    else { await tlmMaintApi.createPlan(planForm); ElMessage.success('已创建') }
    planDialog.value = false; fetch()
  } finally { savingPlan.value = false }
}
async function doDeletePlan(id?: string) {
  if (!id) return; await tlmMaintApi.deletePlan(id); ElMessage.success('已删除'); fetch()
}

function openCreateRec() {
  Object.assign(recForm, {})
  recDialog.value = true
}
async function submitRec() {
  if (!recForm.toolId || !recForm.maintDate) { ElMessage.warning('请选择工装与保养日期'); return }
  savingRec.value = true
  try {
    await tlmMaintApi.createRecord(recForm); ElMessage.success('已登记保养记录')
    recDialog.value = false; fetch()
  } finally { savingRec.value = false }
}

onMounted(async () => { await loadTools(); await fetch() })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">维保</span></div>
        <h1>工装维保<span class="no mono">MAINT</span></h1>
      </div>
    </div>

    <!-- 保养计划 -->
    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="fetch">
        <el-form-item label="工装">
          <el-select v-model="planToolId" filterable clearable placeholder="全部工装" style="width:220px" @change="fetch">
            <el-option v-for="t in tools" :key="t.id" :label="`${t.toolNo} ${t.toolName}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head">
        <h2>保养计划</h2>
        <el-button v-if="perm.has('tlm.maint.plan.create')" type="primary" size="small" @click="openCreatePlan">+ 新建计划</el-button>
      </div>
      <el-table :data="plans" v-loading="loading">
        <el-table-column label="工装" min-width="180"><template #default="{ row }"><span class="mono">{{ toolName(row.toolId) }}</span></template></el-table-column>
        <el-table-column prop="planNo" label="计划编号" width="160"><template #default="{ row }"><span class="mono c-cobalt">{{ row.planNo }}</span></template></el-table-column>
        <el-table-column prop="cycleType" label="周期类型" width="110" />
        <el-table-column label="下次保养" width="130"><template #default="{ row }"><span class="mono">{{ row.nextDate }}</span></template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="perm.has('tlm.maint.plan.edit')" link type="primary" size="small" @click="openEditPlan(row)">编辑</el-button>
            <el-button v-if="perm.has('tlm.maint.plan.delete')" link type="danger" size="small" @click="doDeletePlan(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 保养记录 -->
    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }" style="margin-top:18px">
      <el-form :inline="true" @submit.prevent="fetch">
        <el-form-item label="工装">
          <el-select v-model="recToolId" filterable clearable placeholder="全部工装" style="width:220px" @change="fetch">
            <el-option v-for="t in tools" :key="t.id" :label="`${t.toolNo} ${t.toolName}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head">
        <h2>保养记录</h2>
        <el-button v-if="perm.has('tlm.maint.record.create')" type="primary" size="small" @click="openCreateRec">+ 登记记录</el-button>
      </div>
      <el-table :data="records" v-loading="loading">
        <el-table-column label="工装" min-width="180"><template #default="{ row }"><span class="mono">{{ toolName(row.toolId) }}</span></template></el-table-column>
        <el-table-column label="保养日期" width="130"><template #default="{ row }"><span class="mono">{{ row.maintDate }}</span></template></el-table-column>
        <el-table-column prop="result" label="结果" min-width="200" />
        <el-table-column prop="attachment" label="附件" width="160"><template #default="{ row }"><span v-if="row.attachment" class="tag-b">{{ row.attachment }}</span><span v-else>—</span></template></el-table-column>
      </el-table>
    </el-card>

    <!-- 保养计划弹窗 -->
    <el-dialog v-model="planDialog" :title="editingPlanId ? '编辑计划' : '新建保养计划'" width="520px" :modal="false">
      <div style="display:grid;gap:16px">
        <div><label class="l">工装 *</label>
          <el-select v-model="planForm.toolId" filterable clearable placeholder="选择工装" style="width:100%">
            <el-option v-for="t in tools" :key="t.id" :label="`${t.toolNo} ${t.toolName}`" :value="t.id" />
          </el-select>
        </div>
        <div><label class="l">周期类型</label>
          <el-select v-model="planForm.cycleType" style="width:100%">
            <el-option label="周" value="WEEK" />
            <el-option label="月" value="MONTH" />
            <el-option label="年" value="YEAR" />
          </el-select>
        </div>
        <div><label class="l">下次保养日期 *</label><el-date-picker v-model="planForm.nextDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
      </div>
      <template #footer>
        <el-button @click="planDialog = false">取消</el-button>
        <el-button type="primary" :disabled="savingPlan" @click="submitPlan">{{ savingPlan ? '保存中' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 保养记录弹窗 -->
    <el-dialog v-model="recDialog" title="登记保养记录" width="520px" :modal="false">
      <div style="display:grid;gap:16px">
        <div><label class="l">工装 *</label>
          <el-select v-model="recForm.toolId" filterable clearable placeholder="选择工装" style="width:100%">
            <el-option v-for="t in tools" :key="t.id" :label="`${t.toolNo} ${t.toolName}`" :value="t.id" />
          </el-select>
        </div>
        <div><label class="l">保养日期 *</label><el-date-picker v-model="recForm.maintDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div><label class="l">保养结果</label><el-input v-model="recForm.result" type="textarea" :rows="3" placeholder="如：清洁、润滑、更换易损件，状态正常" /></div>
      </div>
      <template #footer>
        <el-button @click="recDialog = false">取消</el-button>
        <el-button type="primary" :disabled="savingRec" @click="submitRec">{{ savingRec ? '提交中' : '提交' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
