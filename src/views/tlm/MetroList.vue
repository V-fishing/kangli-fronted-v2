<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { TlmTooling } from '@/api/types/tlm'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'
import { metroApi } from '@/api/modules/tlm/metro'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const perm = usePermissionStore()

const list = ref<TlmTooling[]>([])
const loading = ref(false)
const keyword = ref('')
const calibTab = ref<'ALL' | 'QUALIFIED' | 'LIMITED' | 'OVERDUE'>('ALL')
const page = ref(1), size = ref(20), total = ref(0)
const dashboard = ref<{ total: number; qualified: number; limited: number; overdue: number }>({ total: 0, qualified: 0, limited: 0, overdue: 0 })

async function loadDashboard() {
  try { dashboard.value = await metroApi.dashboard() } catch { /* 看板非阻断 */ }
}

// 校准状态派生: 由 calibDueDate 计算(到期前 30 天为限用预警, 已过期为超期)
function calibState(row: TlmTooling): 'QUALIFIED' | 'LIMITED' | 'OVERDUE' | 'NONE' {
  if (!row.calibDueDate) return 'NONE'
  const due = new Date(row.calibDueDate).getTime()
  const now = Date.now()
  if (due < now) return 'OVERDUE'
  if (due - now <= 30 * 24 * 3600 * 1000) return 'LIMITED'
  return 'QUALIFIED'
}
const calibPill = (s: string) => ({ QUALIFIED: 'p-done', LIMITED: 'p-wait', OVERDUE: 'p-lock', NONE: 'p-mute' }[s] || 'p-mute')
const calibText = (s: string) => ({ QUALIFIED: '合格', LIMITED: '限用预警', OVERDUE: '超期', NONE: '未校准' }[s] || s)

const statusPill = (s: string) => {
  switch (s) {
    case 'IN_USE': return 'p-done'
    case 'DISABLED': return 'p-mute'
    case 'REPAIRING': return 'p-run'
    case 'SCRAPPED': return 'p-lock'
    default: return 'p-wait'
  }
}
const statusText = (s: string) => ({ IN_USE: '在用', DISABLED: '停用', REPAIRING: '维修中', SCRAPPED: '报废' }[s] || s)

async function fetch() {
  loading.value = true
  try {
    const res = await tlmToolingApi.page({
      keyword: keyword.value || undefined,
      category: 'GAUGE',
      page: page.value,
      size: size.value,
    })
    const items = (res.records || []).filter(t => calibTab.value === 'ALL' || calibState(t) === calibTab.value)
    list.value = items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 校准状态看板由后端 /v1/tlm/tooling/metro/dashboard 计算(覆盖全量 GAUGE, 非仅当前页)

function onSearch() { page.value = 1; fetch() }
function onTab(c: string) { calibTab.value = c as any; page.value = 1; fetch() }

function goDetail(id?: string) { if (id) router.push(`/tlm/metro/${id}`) }

// ---------------- 操作 ----------------
async function doRepair(row: TlmTooling) {
  const { value } = await ElMessageBox.prompt('送修说明', '计量送修', { inputType: 'textarea' })
  await tlmToolingApi.repair(row.id, { faultDesc: value || '' })
  ElMessage.success('已送修')
  fetch()
}
async function doScrap(row: TlmTooling) {
  try {
    await ElMessageBox.confirm(`确认对计量器具 ${row.toolNo}（${row.toolName}）发起报废？`, '计量报废', {
      type: 'warning', confirmButtonText: '确认报废', cancelButtonText: '取消',
    })
  } catch { return }
  const { value } = await ElMessageBox.prompt('报废原因', '计量报废', { inputType: 'textarea' }).catch(() => ({ value: '' }))
  try {
    await tlmToolingApi.scrap(row.id, { scrapMethod: '报废', reason: value || '' })
    ElMessage.success('已发起报废，等待审批')
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '报废失败')
  }
}
async function doLock(row: TlmTooling) {
  await tlmToolingApi.lock(row.id, !row.locked)
  ElMessage.success(row.locked ? '已解锁' : '已锁定')
  fetch()
}

function hasRowActions(row: TlmTooling) {
  return perm.has('tlm.tooling.edit') || perm.has('tlm.metro.repair') || perm.has('tlm.metro.scrap') || perm.has('tlm.metro.lock')
}
function onRowCommand(c: { cmd: string, row: TlmTooling }) {
  switch (c.cmd) {
    case 'edit': return openEdit(c.row)
    case 'repair': return doRepair(c.row)
    case 'scrap': return doScrap(c.row)
    case 'lock': return doLock(c.row)
  }
}

// ---------------- 新增 / 编辑计量器具(GAUGE) ----------------
const createDialog = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = reactive<Partial<TlmTooling>>({})
function openCreate() {
  editingId.value = null
  Object.assign(form, { toolCategory: 'GAUGE', status: 'IN_USE', bindCount: 0, locked: false, designLife: null })
  createDialog.value = true
}
function openEdit(row: TlmTooling) {
  editingId.value = row.id || null
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  createDialog.value = true
}
async function submitCreate() {
  if (!form.toolNo || !form.toolName) { ElMessage.warning('请填写编号与名称'); return }
  saving.value = true
  try {
    if (editingId.value) {
      await tlmToolingApi.update({ ...form, id: editingId.value })
      ElMessage.success('已保存计量器具')
    } else {
      await tlmToolingApi.create(form)
      ElMessage.success('已创建计量器具')
    }
    createDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => { loadDashboard(); fetch() })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">计量管理</span></div>
        <h1>计量管理<span class="no mono">METROLOGY</span></h1>
      </div>
      <div class="head-actions">
        <el-button v-if="perm.has('tlm.tooling.create')" type="primary" @click="openCreate">+ 新增计量器具</el-button>
        <el-button @click="router.push('/tlm/metro/plans')">校准计划</el-button>
      </div>
    </div>

    <!-- 校准状态看板 -->
    <div class="dash-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;">
      <div class="el-card card-b" style="padding:16px 18px;">
        <div class="mute" style="font-size:12px;">计量器具总数</div>
        <div class="mono dash-num">{{ dashboard.total }}</div>
      </div>
      <div class="el-card card-b" style="padding:16px 18px;">
        <div class="mute" style="font-size:12px;">合格(在期内)</div>
        <div class="mono dash-num c-green">{{ dashboard.qualified }}</div>
      </div>
      <div class="el-card card-b" style="padding:16px 18px;">
        <div class="mute" style="font-size:12px;">限用预警(临期)</div>
        <div class="mono dash-num" style="color:var(--el-color-warning)">{{ dashboard.limited }}</div>
      </div>
      <div class="el-card card-b" style="padding:16px 18px;">
        <div class="mute" style="font-size:12px;">超期</div>
        <div class="mono dash-num c-red">{{ dashboard.overdue }}</div>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="编号 / 名称" clearable style="width:200px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
      <el-radio-group v-model="calibTab" @change="(c:any)=>onTab(c)">
        <el-radio-button value="ALL">全部</el-radio-button>
        <el-radio-button value="QUALIFIED">合格</el-radio-button>
        <el-radio-button value="LIMITED">限用预警</el-radio-button>
        <el-radio-button value="OVERDUE">超期</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>计量器具清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column prop="toolNo" label="编号" width="150">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.toolNo }}</span></template>
        </el-table-column>
        <el-table-column prop="toolName" label="名称" min-width="170" />
        <el-table-column label="精度等级" width="120">
          <template #default="{ row }"><span class="mono">{{ row.precisionVal || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }"><span class="tag-b">{{ row.riskClass || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="校准状态" width="130">
          <template #default="{ row }">
            <span class="pill" :class="calibPill(calibState(row))"><span class="d"></span>{{ calibText(calibState(row)) }}</span>
            <span v-if="row.locked" class="tag-ctq" style="margin-left:6px;">锁定</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="主状态" width="100">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="上次校准" width="120">
          <template #default="{ row }"><span class="mono">{{ row.calibDate || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="下次校准" width="120">
          <template #default="{ row }"><span class="mono" :class="calibState(row)==='OVERDUE' ? 'c-red' : (calibState(row)==='LIMITED' ? '' : 'c-green')">{{ row.calibDueDate || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="校准周期" width="100">
          <template #default="{ row }"><span class="mono">{{ row.calibCycle != null ? row.calibCycle + '月' : '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px;">
              <el-button link type="primary" size="small" @click="goDetail(row.id)">详情</el-button>
              <el-dropdown v-if="hasRowActions(row)" trigger="click" @command="(c:any)=>onRowCommand(c)">
                <el-button link type="primary" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.edit')" :command="{ cmd: 'edit', row }">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.metro.repair')" :command="{ cmd: 'repair', row }">送修</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.metro.scrap')" :command="{ cmd: 'scrap', row }">报废</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.metro.lock')" :command="{ cmd: 'lock', row }">{{ row.locked ? '解锁' : '锁定' }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination :current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next"
          @current-change="(p:number)=>{page=p;fetch()}" />
      </div>
    </el-card>

    <!-- 新增计量器具弹窗(GAUGE 预置为测量设备) -->
    <el-dialog v-model="createDialog" :title="editingId ? '编辑计量器具' : '新增计量器具'" width="640px" append-to-body>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><label class="l">编号 *</label><el-input v-model="form.toolNo" style="width:100%" placeholder="如：A241101-597" /></div>
        <div><label class="l">名称 *</label><el-input v-model="form.toolName" style="width:100%" /></div>
        <div><label class="l">状态</label>
          <el-select v-model="form.status" style="width:100%">
            <el-option label="在用" value="IN_USE" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </div>
        <div><label class="l">工装类型</label><el-input v-model="form.toolType" style="width:100%" placeholder="如：安全阀类" /></div>
        <div><label class="l">精度</label><el-input v-model="form.precisionVal" style="width:100%" placeholder="如：0.25MPa" /></div>
        <div><label class="l">计量点位</label><el-input v-model="form.measurePoint" style="width:100%" /></div>
        <div><label class="l">软件版本</label><el-input v-model="form.softwareVer" style="width:100%" /></div>
        <div><label class="l">校准日期</label><el-date-picker v-model="form.calibDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div><label class="l">下次校准日期</label><el-date-picker v-model="form.calibDueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div><label class="l">校准周期(月)</label><el-input-number v-model="form.calibCycle" :min="0" controls-position="right" style="width:100%" /></div>
        <div><label class="l">保养周期(月)</label><el-input-number v-model="form.maintCycle" :min="0" controls-position="right" style="width:100%" /></div>
        <div><label class="l">存放地点</label><el-input v-model="form.location" style="width:100%" /></div>
        <div><label class="l">设备管理员</label><el-input v-model="form.adminName" style="width:100%" /></div>
        <div><label class="l">供应商/厂家</label><el-input v-model="form.supplierName" style="width:100%" /></div>
        <div><label class="l">规格</label><el-input v-model="form.spec" style="width:100%" /></div>
        <div style="grid-column:1 / -1"><label class="l">备注</label><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" /></div>
      </div>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" :disabled="saving" @click="submitCreate">{{ saving ? '保存中' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
