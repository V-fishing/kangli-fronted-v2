<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { TlmTooling } from '@/api/types/tlm'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const perm = usePermissionStore()

const list = ref<TlmTooling[]>([])
const loading = ref(false)
const keyword = ref('')
const catTab = ref<'ALL' | 'TOOL' | 'GAUGE'>('ALL')
const filterStatus = ref('')
const page = ref(1), size = ref(20), total = ref(0)
// 工装「待首件」强提醒: toolId -> 是否存在待处理工装首件任务
const pendingMap = ref<Record<string, boolean>>({})

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
const catText = (c: string) => (c === 'GAUGE' ? '测量设备' : '工装夹具')

async function fetch() {
  loading.value = true
  try {
    const res = await tlmToolingApi.page({
      keyword: keyword.value || undefined,
      category: catTab.value === 'ALL' ? undefined : catTab.value,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
    // 逐行查「待首件」状态(轻量并发,失败时静默忽略)
    const entries = await Promise.all((list.value || []).map(async (t) => {
      if (!t.id) return null
      const r = await tlmToolingApi.pendingFirst(t.id).catch(() => null)
      return [t.id, !!(r && r.pending)] as [string, boolean]
    }))
    pendingMap.value = Object.fromEntries(entries.filter(Boolean) as [string, boolean][])
  } finally {
    loading.value = false
  }
}

// 工装首件「待首件」强提醒判定: 存在待处理 TOOLING 任务,或工装缺产品编码/工序(自动触发未建)
function isPendingFirst(row: TlmTooling): boolean {
  if (pendingMap.value[row.id || '']) return true
  return !row.productCode || !row.procName
}

function onSearch() { page.value = 1; fetch() }
function onTab(c: string) { catTab.value = c as 'ALL' | 'TOOL' | 'GAUGE'; page.value = 1; fetch() }

// ---------------- 新建/编辑 ----------------
const dialogVisible = ref(false)
const saving = ref(false)
const form = reactive<Partial<TlmTooling>>({})
let editingId: string | null = null

function openCreate() {
  editingId = null
  Object.assign(form, { toolCategory: 'TOOL', status: 'IN_USE', bindCount: 0, locked: false, designLife: null })
  dialogVisible.value = true
}
function openEdit(row: TlmTooling) {
  editingId = row.id || null
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}
async function submit() {
  if (!form.toolNo || !form.toolName) { ElMessage.warning('请填写编号与名称'); return }
  saving.value = true
  try {
    if (editingId) { await tlmToolingApi.update(form); ElMessage.success('已保存') }
    else { await tlmToolingApi.create(form); ElMessage.success('已创建') }
    dialogVisible.value = false
    fetch()
  } finally { saving.value = false }
}

// ---------------- 操作 ----------------
function goDetail(id?: string) { if (id) router.push(`/tlm/tooling/${id}`) }
// 派工(绑定工单): 受工装首件质量门禁约束(后端 bind() 拦截未完成首件检验的工装)
const bindDialog = ref(false)
const binding = ref(false)
const bindRow = ref<TlmTooling | null>(null)
const bindWoNo = ref('')
function openBind(row: TlmTooling) {
  bindRow.value = row
  bindWoNo.value = ''
  bindDialog.value = true
}
async function doBind() {
  if (!bindRow.value) return
  if (!bindWoNo.value || !bindWoNo.value.trim()) { ElMessage.warning('请填写工单号'); return }
  binding.value = true
  try {
    await tlmToolingApi.bind(bindRow.value.id!, bindWoNo.value.trim())
    ElMessage.success('已派工')
    bindDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.message || '派工失败')
  } finally { binding.value = false }
}
// 创建首件: 跳转到 FIA 新建检验任务并以工装首件模式预填该工装
function createFirst(row: TlmTooling) {
  if (!row.productCode || !row.procName) {
    ElMessage.warning('该工装缺少产品编码或工序，无法匹配检验标准，请先完善工装档案')
    return
  }
  router.push({ path: '/fia/tasks/create', query: { toolId: row.id, toolNo: row.toolNo, toolName: row.toolName } })
}
async function doRepair(row: TlmTooling) {
  const { value } = await ElMessageBox.prompt('送修说明', '工装送修', { inputType: 'textarea' })
  await tlmToolingApi.repair(row.id, { faultDesc: value || '' })
  ElMessage.success('已送修')
  fetch()
}
// 报废:弹窗填报废方式 + 原因(审批人由「系统管理 › 审核配置」决定,不手选)
const scrapDialog = ref(false)
const scrapSubmitting = ref(false)
const scrapRow = ref<TlmTooling | null>(null)
const scrapMethod = ref<'DESTROY' | 'RETURN'>('DESTROY')
const scrapReason = ref('')
function openScrap(row: TlmTooling) {
  scrapRow.value = row
  scrapMethod.value = 'DESTROY'
  scrapReason.value = ''
  scrapDialog.value = true
}
async function submitScrap() {
  if (!scrapRow.value) return
  if (!scrapReason.value || !scrapReason.value.trim()) {
    ElMessage.warning('请填写报废原因')
    return
  }
  scrapSubmitting.value = true
  try {
    await tlmToolingApi.scrap(scrapRow.value.id!, {
      scrapMethod: scrapMethod.value,
      reason: scrapReason.value.trim(),
    })
    ElMessage.success('已发起报废，待审批人处理')
    scrapDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '发起报废失败')
  } finally {
    scrapSubmitting.value = false
  }
}
async function doLock(row: TlmTooling) {
  await tlmToolingApi.lock(row.id, !row.locked)
  ElMessage.success(row.locked ? '已解锁' : '已锁定')
  fetch()
}
async function doDelete(row: TlmTooling) {
  await ElMessageBox.confirm('确认删除该工装？', '删除', { type: 'warning' })
  await tlmToolingApi.delete(row.id)
  ElMessage.success('已删除')
  fetch()
}

// 行内是否存在「更多」下拉中的任一操作（控制下拉显隐）
function hasRowActions(row: TlmTooling) {
  return perm.has('tlm.tooling.first') || perm.has('tlm.tooling.bind') ||
    perm.has('tlm.tooling.edit') || perm.has('tlm.tooling.repair') ||
    perm.has('tlm.tooling.scrap') || perm.has('tlm.tooling.lock') || perm.has('tlm.tooling.delete')
}
// 更多下拉命令分发
function onRowCommand(c: { cmd: string, row: TlmTooling }) {
  switch (c.cmd) {
    case 'first': return createFirst(c.row)
    case 'bind': return openBind(c.row)
    case 'edit': return openEdit(c.row)
    case 'repair': return doRepair(c.row)
    case 'scrap': return openScrap(c.row)
    case 'lock': return doLock(c.row)
    case 'delete': return doDelete(c.row)
  }
}

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">台账</span></div>
        <h1>工装台账<span class="no mono">TLM</span></h1>
      </div>
      <div class="head-actions">
        <el-button v-if="perm.has('tlm.tooling.create')" type="primary" @click="openCreate">+ 新增工装</el-button>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="编号 / 名称" clearable style="width:200px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:140px" @change="onSearch">
            <el-option label="在用" value="IN_USE" />
            <el-option label="停用" value="DISABLED" />
            <el-option label="维修中" value="REPAIRING" />
            <el-option label="报废" value="SCRAPPED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
      <el-radio-group v-model="catTab" @change="(c:any)=>onTab(c)">
        <el-radio-button value="ALL">全部</el-radio-button>
        <el-radio-button value="TOOL">工装夹具</el-radio-button>
        <el-radio-button value="GAUGE">测量设备</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>资产清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column prop="toolNo" label="编号" width="150">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.toolNo }}</span></template>
        </el-table-column>
        <el-table-column prop="toolName" label="名称" min-width="180" />
        <el-table-column label="类别" width="110">
          <template #default="{ row }"><span class="tag-b">{{ catText(row.toolCategory) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span>
            <span v-if="isPendingFirst(row)" class="pill p-wait" style="margin-left:6px;"><span class="d"></span>待首件</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放地点" min-width="120" />
        <el-table-column label="下次校准" width="120">
          <template #default="{ row }"><span class="mono" :class="row.calibDueDate && new Date(row.calibDueDate) < new Date() ? 'c-red' : 'c-green'">{{ row.calibDueDate || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="寿命" width="110">
          <template #default="{ row }">
            <span class="mono">{{ row.bindCount || 0 }}<span v-if="row.designLife">/{{ row.designLife }}</span></span>
            <span v-if="row.locked" class="tag-ctq" style="margin-left:6px;">锁定</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px;">
              <el-button link type="primary" size="small" @click="goDetail(row.id)">详情</el-button>
              <el-dropdown v-if="hasRowActions(row)" trigger="click" @command="(c:any)=>onRowCommand(c)">
                <el-button link type="primary" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.first')" :command="{ cmd: 'first', row }">创建首件</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.bind')" :command="{ cmd: 'bind', row }">派工</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.edit')" :command="{ cmd: 'edit', row }">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.repair')" :command="{ cmd: 'repair', row }">送修</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.scrap')" :command="{ cmd: 'scrap', row }">报废</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.lock')" :command="{ cmd: 'lock', row }">{{ row.locked ? '解锁' : '锁定' }}</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has('tlm.tooling.delete')" divided :command="{ cmd: 'delete', row }">
                      <span style="color:var(--el-color-danger)">删除</span>
                    </el-dropdown-item>
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

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑工装' : '新增工装'" width="640px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><label class="l">编号 *</label><el-input v-model="form.toolNo" style="width:100%" /></div>
        <div><label class="l">名称 *</label><el-input v-model="form.toolName" style="width:100%" /></div>
        <div><label class="l">类别</label>
          <el-select v-model="form.toolCategory" style="width:100%">
            <el-option label="工装夹具" value="TOOL" />
            <el-option label="测量设备" value="GAUGE" />
          </el-select>
        </div>
        <div><label class="l">状态</label>
          <el-select v-model="form.status" style="width:100%">
            <el-option label="在用" value="IN_USE" />
            <el-option label="停用" value="DISABLED" />
            <el-option label="维修中" value="REPAIRING" />
            <el-option label="报废" value="SCRAPPED" />
          </el-select>
        </div>
        <div><label class="l">产品编码</label><el-input v-model="form.productCode" style="width:100%" placeholder="如：10.01.010400" /></div>
        <div><label class="l">存放地点</label><el-input v-model="form.location" style="width:100%" /></div>
        <div><label class="l">工序名称</label><el-input v-model="form.procName" style="width:100%" placeholder="如：冲压、焊接、检测" /></div>
        <div><label class="l">工装类型</label><el-input v-model="form.toolType" style="width:100%" placeholder="如：研发工装" /></div>
        <div><label class="l">材质</label><el-input v-model="form.material" style="width:100%" placeholder="如：不锈钢" /></div>
        <div><label class="l">数量</label><el-input-number v-model="form.quantity" :min="0" controls-position="right" style="width:100%" /></div>
        <div><label class="l">验证周期</label><el-input v-model="form.verifyCycle" style="width:100%" placeholder="如：一年" /></div>
        <div><label class="l">风险等级</label><el-input v-model="form.riskClass" style="width:100%" placeholder="I/II/III/IV" /></div>
        <div><label class="l">领用人</label><el-input v-model="form.ownerName" style="width:100%" /></div>
        <div><label class="l">设备管理员</label><el-input v-model="form.adminName" style="width:100%" /></div>
        <div><label class="l">供应商/厂家</label><el-input v-model="form.supplierName" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">精度</label><el-input v-model="form.precisionVal" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">计量点位</label><el-input v-model="form.measurePoint" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">软件版本</label><el-input v-model="form.softwareVer" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">校准日期</label><el-date-picker v-model="form.calibDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">下次校准日期</label><el-date-picker v-model="form.calibDueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">校准周期(月)</label><el-input-number v-model="form.calibCycle" :min="0" controls-position="right" style="width:100%" /></div>
        <div v-if="form.toolCategory === 'GAUGE'"><label class="l">保养周期(月)</label><el-input-number v-model="form.maintCycle" :min="0" controls-position="right" style="width:100%" /></div>
        <div><label class="l">寿命上限(次)</label><el-input-number v-model="form.designLife" :min="0" controls-position="right" style="width:100%" /></div>
        <div><label class="l">规格</label><el-input v-model="form.spec" style="width:100%" /></div>
        <div><label class="l">采购日期</label><el-date-picker v-model="form.purchaseDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div><label class="l">入库日期</label><el-date-picker v-model="form.inboundDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div><label class="l">金额</label><el-input-number v-model="form.cost" :min="0" :precision="2" controls-position="right" style="width:100%" /></div>
        <div style="grid-column:1 / -1"><label class="l">备注</label><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" /></div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="saving" @click="submit">{{ saving ? '保存中' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 派工(绑定工单)弹窗 -->
    <el-dialog v-model="bindDialog" title="工装派工" width="480px" append-to-body>
      <div v-if="bindRow" style="margin-bottom:12px;color:var(--el-text-color-regular);font-size:13px;">
        工装：<span class="mono c-cobalt">{{ bindRow.toolNo }}</span> {{ bindRow.toolName }}
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:8px;">
        <div><label class="l">工单号 *</label><el-input v-model="bindWoNo" style="width:100%" placeholder="如：WO-20260814-001" /></div>
      </div>
      <template #footer>
        <el-button @click="bindDialog = false">取消</el-button>
        <el-button type="primary" :disabled="binding" @click="doBind">{{ binding ? '提交中' : '确认派工' }}</el-button>
      </template>
    </el-dialog>

    <!-- 报废弹窗(审批人由审核配置决定,不手选) -->
    <el-dialog v-model="scrapDialog" title="工装报废" width="520px" append-to-body>
      <div v-if="scrapRow" style="margin-bottom:16px;color:var(--el-text-color-regular);font-size:13px;">
        工装：<span class="mono c-cobalt">{{ scrapRow.toolNo }}</span> {{ scrapRow.toolName }}
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:16px;">
        <div>
          <label class="l">报废方式</label>
          <el-radio-group v-model="scrapMethod" style="margin-top:6px;">
            <el-radio-button value="DESTROY">销毁</el-radio-button>
            <el-radio-button value="RETURN">退供应商</el-radio-button>
          </el-radio-group>
        </div>
        <div>
          <label class="l">报废原因 *</label>
          <el-input v-model="scrapReason" type="textarea" :rows="3" placeholder="请说明报废原因（如：到期/不可修复/闲置）" style="margin-top:6px;" />
        </div>
        <div class="mute" style="font-size:12px;">审批人将按「系统管理 › 审核配置 › 工装报废审核」节点自动指派，无需在此选择。</div>
      </div>
      <template #footer>
        <el-button @click="scrapDialog = false">取消</el-button>
        <el-button type="primary" :disabled="scrapSubmitting" @click="submitScrap">{{ scrapSubmitting ? '提交中' : '确认报废' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
