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

const dialogVisible = ref(false)
const saving = ref(false)
const form = reactive<Partial<TlmMaintPlan>>({})
let editingId: string | null = null

async function loadTools() {
  const res = await tlmToolingApi.page({ size: 200 })
  tools.value = res.records.map((t: any) => ({ id: t.id, toolName: t.toolName, toolNo: t.toolNo }))
}
async function fetch() {
  loading.value = true
  try {
    const p = await tlmMaintApi.planPage({ page: 1, size: 200 })
    plans.value = p.records
    records.value = await tlmMaintApi.records()
  } finally { loading.value = false }
}
function toolName(id?: string) { const t = tools.value.find((x) => x.id === id); return t ? `${t.toolNo} ${t.toolName}` : '—' }

function openCreate() {
  editingId = null
  Object.assign(form, { cycleType: 'MONTH' })
  dialogVisible.value = true
}
function openEdit(row: TlmMaintPlan) { editingId = row.id || null; Object.assign(form, JSON.parse(JSON.stringify(row))); dialogVisible.value = true }
async function submit() {
  if (!form.toolId || !form.nextDate) { ElMessage.warning('请选择工装与下次保养日期'); return }
  saving.value = true
  try {
    if (editingId) { await tlmMaintApi.updatePlan(form); ElMessage.success('已保存') }
    else { await tlmMaintApi.createPlan(form); ElMessage.success('已创建') }
    dialogVisible.value = false; fetch()
  } finally { saving.value = false }
}
async function doDelete(id?: string) {
  if (!id) return; await tlmMaintApi.deletePlan(id); ElMessage.success('已删除'); fetch()
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
      <div class="head-actions">
        <el-button v-if="perm.has('tlm.maint.plan.create')" type="primary" @click="openCreate">+ 新建计划</el-button>
      </div>
    </div>

    <el-card class="card-b" style="margin-bottom:18px" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>保养计划</h2></div>
      <el-table :data="plans" v-loading="loading">
        <el-table-column label="工装" min-width="180"><template #default="{ row }"><span class="mono">{{ toolName(row.toolId) }}</span></template></el-table-column>
        <el-table-column prop="planNo" label="计划编号" width="160"><template #default="{ row }"><span class="mono c-cobalt">{{ row.planNo }}</span></template></el-table-column>
        <el-table-column prop="cycleType" label="周期类型" width="110" />
        <el-table-column label="下次保养" width="130"><template #default="{ row }"><span class="mono">{{ row.nextDate }}</span></template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="perm.has('tlm.maint.plan.edit')" link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="perm.has('tlm.maint.plan.delete')" link type="danger" size="small" @click="doDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>保养记录</h2></div>
      <el-table :data="records" v-loading="loading">
        <el-table-column label="工装" min-width="180"><template #default="{ row }"><span class="mono">{{ toolName(row.toolId) }}</span></template></el-table-column>
        <el-table-column label="保养日期" width="130"><template #default="{ row }"><span class="mono">{{ row.maintDate }}</span></template></el-table-column>
        <el-table-column prop="result" label="结果" min-width="200" />
        <el-table-column prop="attachment" label="附件" width="160"><template #default="{ row }"><span v-if="row.attachment" class="tag-b">{{ row.attachment }}</span><span v-else>—</span></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑计划' : '新建保养计划'" width="520px" :modal="false">
      <div style="display:grid;gap:16px">
        <div><label class="l">工装 *</label>
          <el-select v-model="form.toolId" filterable clearable placeholder="选择工装" style="width:100%">
            <el-option v-for="t in tools" :key="t.id" :label="`${t.toolNo} ${t.toolName}`" :value="t.id" />
          </el-select>
        </div>
        <div><label class="l">周期类型</label>
          <el-select v-model="form.cycleType" style="width:100%">
            <el-option label="周" value="WEEK" />
            <el-option label="月" value="MONTH" />
            <el-option label="年" value="YEAR" />
          </el-select>
        </div>
        <div><label class="l">下次保养日期 *</label><el-date-picker v-model="form.nextDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="saving" @click="submit">{{ saving ? '保存中' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
