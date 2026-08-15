<template>
  <div class="record-list">
    <div class="head-b"><AppBreadcrumb /><h1>不良记录</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="不良类型"><el-select v-model="filter.defectDictCode" clearable filterable placeholder="全部" style="width:180px" v-loading="dictLoading"><el-option v-for="d in dicts" :key="d.code" :label="`${d.code} · ${d.name}`" :value="d.code" /></el-select></el-form-item>
        <el-form-item label="阶段"><el-select v-model="filter.stage" clearable placeholder="全部" style="width:140px"><el-option v-for="s in stages" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="来源"><el-select v-model="filter.source" clearable placeholder="全部" style="width:120px"><el-option v-for="s in sources" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="工单号"><el-input v-model="filter.woNo" clearable placeholder="搜索" style="width:160px" /></el-form-item>
        <el-form-item label="严重度"><el-select v-model="filter.severity" clearable placeholder="全部" style="width:100px"><el-option v-for="s in ['严重','一般','轻微']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 录入不良</el-button></div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="defectNo" label="记录编号" width="170">
          <template #default="{row}">
            <router-link :to="`/ncm/defect-records/${(row as NcmDefectRecord).id}`" class="mono link">{{ (row as NcmDefectRecord).defectNo }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="woNo" label="工单号" width="140" />
        <el-table-column prop="processCode" label="工序" width="90" />
        <el-table-column prop="defectDictCode" label="缺陷编码" width="100" />
        <el-table-column prop="stage" label="阶段" width="100" />
        <el-table-column prop="severity" label="严重度" width="80" />
        <el-table-column label="不良数/批总" width="90"><template #default="{row}"><span class="mono">{{ (row as NcmDefectRecord).defectCount }}/{{ (row as NcmDefectRecord).batchTotal }}</span></template></el-table-column>
        <el-table-column prop="disposition" label="处置" width="90" />
        <el-table-column label="来源" width="90">
          <template #default="{row}">
            <el-tag v-if="(row as NcmDefectRecord).source === 'MES导入'" type="success" size="small" effect="dark">MES导入</el-tag>
            <el-tag v-else type="info" size="small">{{ (row as NcmDefectRecord).source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="160"><template #default="{row}">{{ fmtMinute((row as NcmDefectRecord).occurredAt) }}</template></el-table-column>
        <el-table-column label="处置方案" width="110">
          <template #default="{row}">
            <el-tag :type="comboTagType(dispositionCombo(row as NcmDefectRecord))" size="small">{{ dispositionCombo(row as NcmDefectRecord) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="措施状态" width="240">
          <template #default="{row}">
            <div class="measure-tags">
              <el-tooltip v-if="(row as NcmDefectRecord).d8No" :content="'8D: ' + (row as NcmDefectRecord).d8No + ' · ' + ((row as NcmDefectRecord).d8Status || '—')" placement="top">
                <el-tag :type="measureTagType((row as NcmDefectRecord).d8Status)" size="small" style="cursor:pointer" @click="$router.push('/ncm/8d-reports/' + ((row as NcmDefectRecord).d8Id || (row as NcmDefectRecord).d8No))">8D</el-tag>
              </el-tooltip>
              <el-tooltip v-if="(row as NcmDefectRecord).capaNo" :content="'CAPA: ' + (row as NcmDefectRecord).capaNo + ' · ' + ((row as NcmDefectRecord).capaStatus || '—')" placement="top">
                <el-tag :type="measureTagType((row as NcmDefectRecord).capaStatus)" size="small" style="cursor:pointer" @click="$router.push('/ncm/capas/' + ((row as NcmDefectRecord).capaId || (row as NcmDefectRecord).capaNo))">CAPA</el-tag>
              </el-tooltip>
              <el-tooltip v-if="(row as NcmDefectRecord).caNo" :content="'CA: ' + (row as NcmDefectRecord).caNo + ' · ' + ((row as NcmDefectRecord).caStatus || '—')" placement="top">
                <el-tag :type="measureTagType((row as NcmDefectRecord).caStatus)" size="small" style="cursor:pointer" @click="$router.push('/ncm/corrective-actions/' + ((row as NcmDefectRecord).caId || (row as NcmDefectRecord).caNo))">CA</el-tag>
              </el-tooltip>
              <span v-if="!(row as NcmDefectRecord).d8No && !(row as NcmDefectRecord).capaNo && !(row as NcmDefectRecord).caNo" class="no-measure">未发起</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="$router.push(`/ncm/defect-records/${(row as NcmDefectRecord).id}`)">详情</el-button>
            <el-tooltip v-if="(row as NcmDefectRecord).d8No" :content="'已发起8D: ' + (row as NcmDefectRecord).d8No" placement="top">
              <el-button link type="primary" size="small" disabled>发起8D</el-button>
            </el-tooltip>
            <el-button v-else link type="primary" size="small" @click="openAssign('8D', (row as NcmDefectRecord).id, (row as NcmDefectRecord).defectNo)">发起8D</el-button>
            <el-tooltip v-if="(row as NcmDefectRecord).capaNo" :content="'已发起CAPA: ' + (row as NcmDefectRecord).capaNo" placement="top">
              <el-button link type="warning" size="small" disabled>发起CAPA</el-button>
            </el-tooltip>
            <el-button v-else link type="warning" size="small" @click="openAssign('CAPA', (row as NcmDefectRecord).id, (row as NcmDefectRecord).defectNo)">发起CAPA</el-button>
            <el-tooltip v-if="(row as NcmDefectRecord).caNo" :content="'已发起CA: ' + (row as NcmDefectRecord).caNo" placement="top">
              <el-button link type="success" size="small" disabled>发起CA</el-button>
            </el-tooltip>
            <el-button v-else link type="success" size="small" @click="openAssign('CA', (row as NcmDefectRecord).id, (row as NcmDefectRecord).defectNo)">发起CA</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch"
          @size-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="录入不良记录" width="520px" append-to-body>
      <el-form :model="form" label-width="80px">
        <!-- ══ 必填 ══ -->
        <el-form-item label="缺陷编码" required>
          <el-select v-model="form.defectDictCode" filterable placeholder="选择不良字典" style="width:100%" v-loading="dictLoading">
            <el-option v-for="d in dicts" :key="d.code" :label="`${d.code} · ${d.name}`" :value="d.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重度" required>
          <el-select v-model="form.severity" style="width:100%"><el-option v-for="s in ['严重','一般','轻微']" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-form-item label="阶段" required>
          <el-select v-model="form.stage" style="width:100%"><el-option v-for="s in stages" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="不良数量" required><el-input-number v-model="form.defectCount" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="批次总数"><el-input-number v-model="form.batchTotal" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <!-- ══ 常用 ══ -->
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="来源"><el-select v-model="form.source" clearable style="width:100%"><el-option v-for="s in sources" :key="s" :label="s" :value="s" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处置"><el-select v-model="form.disposition" clearable style="width:100%" placeholder="可选"><el-option v-for="d in dispos" :key="d" :label="d" :value="d" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="工单号"><el-input v-model="form.woNo" placeholder="如 WO-240726-001" /></el-form-item>
        <el-form-item label="工序编码"><el-input v-model="form.processCode" placeholder="如 注塑" /></el-form-item>
        <!-- ══ 更多信息(可折叠) ══ -->
        <el-divider><el-button link size="small" type="primary" @click="moreVisible=!moreVisible">{{ moreVisible?'收起':'更多信息' }}</el-button></el-divider>
        <template v-if="moreVisible">
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="设备编号"><el-input v-model="form.deviceCode" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="设备载荷"><el-input v-model="form.devicePayload" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="批次号"><el-input v-model="form.batchNo" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="产品型号"><el-input v-model="form.productModel" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="发生时间"><el-date-picker v-model="form.occurredAt" type="datetime" placeholder="默认当前时间" style="width:100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
        </template>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="assignVisible" :title="`发起${assignType} · ${assignType === '8D' ? '指定负责人' : '指派处理人'}`" width="560px" append-to-body>
      <el-alert v-if="assignDefectNo" :title="assignType === '8D'
        ? `不良记录 ${assignDefectNo}:请指定负责人(单选),负责人将在 D1 阶段自行组建团队,由质量部门审核后进入 D2。`
        : `不良记录 ${assignDefectNo}:请指派处理人并选择通知方式,确认后将创建${assignType}报告并通知被指派人。`"
        type="info" :closable="false" show-icon style="margin-bottom:14px" />
      <el-form :model="assignForm" label-width="90px">
        <template v-if="assignType === '8D'">
          <el-form-item label="指定负责人" required>
            <el-select v-model="assignForm.ownerUserId" filterable clearable placeholder="单选系统用户作为 8D 负责人" style="width:100%">
              <el-option v-for="u in users" :key="u.id" :label="u.realName || u.username || u.id" :value="u.id" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="处理人">
            <el-select v-model="assignForm.assigneeUserIds" multiple filterable clearable placeholder="可多选系统用户" style="width:100%">
              <el-option v-for="u in users" :key="u.id" :label="u.realName || u.username || u.id" :value="u.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理团队">
            <el-select v-model="assignForm.assignRoleCodes" multiple filterable clearable placeholder="可多选角色" style="width:100%">
              <el-option v-for="r in roles" :key="r.roleCode" :label="r.roleName || r.roleCode" :value="r.roleCode" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="assignForm.notifyChannels">
            <el-checkbox v-for="c in channels" :key="c.code" :value="c.code" :disabled="!c.enabled">
              {{ c.name }}{{ c.enabled ? '' : '(未配置)' }}
            </el-checkbox>
          </el-checkbox-group>
          <div v-if="channels.some(c => !c.enabled)" class="ch-hint">未配置凭据的点对点渠道不可选,可到「系统管理→通知配置」中完成配置</div>
        </el-form-item>
        <el-form-item label="指派备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="2" placeholder="如:请48小时内完成原因分析并回复处置方案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible=false">取消</el-button>
        <el-button type="primary" :loading="assignSubmitting" @click="confirmAssign">确认发起并通知</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { useAuthStore } from '@/stores/auth'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import { ncmDefectDictApi } from '@/api/modules/ncm/defect-dicts'
import type { NcmDefectRecord, NcmDefectDict } from '@/api/types/ncm'
import type { AssignCandidate, NotifyChannelCandidate } from '@/api/modules/ncm/defect-records'

const auth = useAuthStore()
const list = ref<NcmDefectRecord[]>([])
const loading = ref(false), dictLoading = ref(false)
const dicts = ref<NcmDefectDict[]>([])
const sources = ['手动', '首件检验', 'SQM', 'SPC', 'MES导入']
const dispos = ['退货', '返修', '报废', '让步接收', '挑选', '合格入库']
const stages = ['来料不良', '半成品不良', '成品不良', '首件不良']

const dialogVisible = ref(false), moreVisible = ref(false)
const filter = reactive({ defectDictCode: '', woNo: '', severity: '', stage: '', source: '' })
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
// orgId / operatorId / defectNo 由后端自动处理,前端不传
const form = reactive({
  defectDictCode: '', woNo: '', processCode: '', severity: '一般', stage: '来料不良', defectCount: 1, batchTotal: 1,
  deviceCode: '', devicePayload: '', batchNo: '', productModel: '', occurredAt: '', source: '手动', disposition: '', remark: '',
})

// ══ 指派处理人(发起8D/CAPA/CA) ══
const assignVisible = ref(false), assignSubmitting = ref(false)
const assignType = ref('8D')
const assignDefectId = ref('')
const assignDefectNo = ref('')
const users = ref<AssignCandidate[]>([])
const roles = ref<AssignCandidate[]>([])
const channels = ref<NotifyChannelCandidate[]>([])
const assignForm = reactive({
  ownerUserId: '',
  assigneeUserIds: [] as string[],
  assignRoleCodes: [] as string[],
  notifyChannels: ['站内弹窗'] as string[],
  remark: '',
})

async function loadAssignCandidates() {
  try {
    const res = await ncmDefectRecordApi.assignCandidates()
    users.value = res.users || []
    roles.value = res.roles || []
    channels.value = res.channels && res.channels.length ? res.channels : [{ code: '站内弹窗', name: '站内弹窗', enabled: true, checked: true }]
    if (!channels.value.some(c => c.code === '站内弹窗')) channels.value.unshift({ code: '站内弹窗', name: '站内弹窗', enabled: true, checked: true })
    // 默认勾选服务端标记 checked 的渠道(站内弹窗+已启用事件渠道),未配置的 direct 渠道不勾选
    const checked = channels.value.filter(c => c.checked).map(c => c.code)
    assignForm.notifyChannels = checked.length ? checked : ['站内弹窗']
  } catch {
    users.value = []
    roles.value = []
    channels.value = [{ code: '站内弹窗', name: '站内弹窗', enabled: true, checked: true }]
    assignForm.notifyChannels = ['站内弹窗']
  }
}

function openAssign(type: string, id: string, no: string) {
  assignType.value = type
  assignDefectId.value = id
  assignDefectNo.value = no
  assignForm.ownerUserId = ''
  assignForm.assigneeUserIds = []
  assignForm.assignRoleCodes = []
  assignForm.notifyChannels = []
  assignForm.remark = ''
  loadAssignCandidates()
  assignVisible.value = true
}

async function confirmAssign() {
  if (assignType.value === '8D') {
    if (!assignForm.ownerUserId) {
      ElMessage.warning('请指定负责人')
      return
    }
  } else if (!assignForm.assigneeUserIds.length && !assignForm.assignRoleCodes.length) {
    ElMessage.warning('请至少指派一位处理人或一个处理团队')
    return
  }
  assignSubmitting.value = true
  try {
    // 8D:仅指定负责人;CAPA/CA:保留处理人+处理团队
    const body = assignType.value === '8D'
      ? {
          ownerUserId: assignForm.ownerUserId,
          notifyChannels: assignForm.notifyChannels,
          remark: assignForm.remark,
        }
      : {
          assigneeUserIds: assignForm.assigneeUserIds,
          assignRoleCodes: assignForm.assignRoleCodes,
          notifyChannels: assignForm.notifyChannels,
          remark: assignForm.remark,
        }
    if (assignType.value === '8D') await ncmDefectRecordApi.launch8d(assignDefectId.value, body)
    else if (assignType.value === 'CAPA') await ncmDefectRecordApi.launchCapa(assignDefectId.value, body)
    else await ncmDefectRecordApi.launchCa(assignDefectId.value, body)
    ElMessage.success(`已发起${assignType.value}${assignType.value === '8D' ? '并通知负责人' : '并通知处理人'}`)
    assignVisible.value = false
    fetch()
  } finally {
    assignSubmitting.value = false
  }
}

async function fetch() {
  loading.value = true
  try {
    const res = await ncmDefectRecordApi.listPage({
      keyword: '',
      defectDictCode: filter.defectDictCode,
      woNo: filter.woNo,
      severity: filter.severity,
      stage: filter.stage,
      source: filter.source,
      page: page.value,
      size: pageSize.value,
    })
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}
async function loadDicts() { dictLoading.value = true; try { dicts.value = await ncmDefectDictApi.list() } finally { dictLoading.value = false } }

function openCreate() {
  Object.assign(form, { defectDictCode: '', woNo: '', processCode: '', severity: '一般', stage: '来料不良', defectCount: 1, batchTotal: 1, deviceCode: '', devicePayload: '', batchNo: '', productModel: '', occurredAt: '', source: '手动', disposition: '', remark: '' })
  dialogVisible.value = true
}

async function handleSubmit() { await ncmDefectRecordApi.create(form as any); ElMessage.success('已录入'); dialogVisible.value = false; fetch() }
function fmtMinute(v: any) { if (!v) return ''; const m = String(v).match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/); return m ? m[0].replace('T', ' ') : String(v) }

/** 派生处置方案:按已发起的措施组合出"处置方案"文本 */
function dispositionCombo(row: NcmDefectRecord): string {
  const parts: string[] = []
  if (row.d8No) parts.push('8D')
  if (row.capaNo) parts.push('CAPA')
  if (row.caNo) parts.push('CA')
  return parts.length ? parts.join('+') : '未发起'
}

/** 处置方案 tag 颜色:组合流程→success,单流程→warning,未发起→info */
function comboTagType(combo: string): '' | 'success' | 'warning' | 'info' {
  if (combo === '未发起') return 'info'
  if (combo.includes('+')) return 'success'
  return 'warning'
}

/** 根据报告状态返回 el-tag type: 进行中/待启动→warning, 已闭环/已完成/已验证→success, 已关闭→info, 其他→ */
function measureTagType(status?: string): '' | 'success' | 'warning' | 'info' {
  if (!status) return ''
  if (status === '已闭环' || status === '已完成' || status === '已验证') return 'success'
  if (status === '已关闭') return 'info'
  // 进行中/待启动/分析中/待审批/实施中
  return 'warning'
}
onMounted(() => { fetch(); loadDicts() })
</script>

<style lang="scss" scoped>
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.mono { font-family: $font-mono; }
.link { color: $cobalt; text-decoration: none; font-weight: 600; }
.link:hover { text-decoration: underline; }
.measure-tags { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.no-measure { color: #909399; font-size: 12px; }
.ch-hint { margin-top: 4px; color: #909399; font-size: 12px; line-height: 1.5; }
</style>
