<template>
  <div class="defect-detail" v-loading="loading">
    <!-- 头部面包屑+标题 -->
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>{{ record?.defectNo || '不良记录详情' }}</h1>
      </div>
      <div class="head-actions">
        <el-button @click="$router.back()">返回</el-button>
        <el-tooltip v-if="record?.caNo" :content="'已发起CA: ' + record.caNo" placement="top">
          <el-button type="success" disabled>发起CA</el-button>
        </el-tooltip>
        <el-button v-else type="success" @click="openAssign('CA', record.id, record.defectNo)">发起CA</el-button>
        <el-tooltip v-if="record?.capaNo" :content="'已发起CAPA: ' + record.capaNo" placement="top">
          <el-button type="warning" disabled>发起CAPA</el-button>
        </el-tooltip>
        <el-button v-else type="warning" @click="openAssign('CAPA', record.id, record.defectNo)">发起CAPA</el-button>
        <el-tooltip v-if="record?.d8No" :content="'已发起8D: ' + record.d8No" placement="top">
          <el-button type="primary" disabled>发起8D</el-button>
        </el-tooltip>
        <el-button v-else type="primary" @click="openAssign('8D', record.id, record.defectNo)">发起8D</el-button>
      </div>
    </div>

    <!-- 不良记录基本信息 -->
    <el-card shadow="never" class="card-b" style="margin-bottom:16px" v-if="record">
      <template #header><span class="card-title">不良信息</span></template>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="记录编号">
          <span class="mono">{{ record.defectNo }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="工单号">
          <span class="mono">{{ record.woNo || '—' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="工序">{{ record.processCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="缺陷编码">
          <span class="mono">{{ record.defectDictCode || '—' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="严重度">
          <span class="pill" :class="sevClass(record.severity)">
            <span class="d"></span>{{ record.severity || '—' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="处置">
          <span v-if="record.disposition" class="pill" :class="dispClass(record.disposition)">
            <span class="d"></span>{{ record.disposition }}
          </span>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="不良数 / 批总数">
          <span class="mono">{{ record.defectCount }} / {{ record.batchTotal || '—' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="不良率" v-if="record.defectRate !== undefined">
          <span class="mono">{{ (record.defectRate * 100).toFixed(2) }}%</span>
        </el-descriptions-item>
        <el-descriptions-item label="来源">{{ record.source || '—' }}</el-descriptions-item>
        <el-descriptions-item label="设备编号">{{ record.deviceCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="设备载荷">{{ record.devicePayload || '—' }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ record.batchNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="产品型号">{{ record.productModel || '—' }}</el-descriptions-item>
        <el-descriptions-item label="操作员">{{ record.operatorId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="发生时间" :span="record.deviceCode || record.batchNo ? 1 : 3">
          {{ fmtMinute(record.occurredAt) || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3" v-if="record.remark">
          <div style="white-space:pre-wrap">{{ record.remark }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 关联纠正措施 -->
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span class="card-title">关联纠正措施（{{ relatedCas.length }}）</span>
          <el-button type="success" size="small" @click="openAssign('CA', record.id, record.defectNo)" v-if="record && !record.caNo">发起CA</el-button>
        </div>
      </template>
      <el-table :data="relatedCas" v-loading="caLoading" size="small" border stripe style="width:100%" v-if="relatedCas.length">
        <el-table-column prop="caNo" label="措施编号" width="130" show-overflow-tooltip>
          <template #default="{row}">
            <router-link :to="`/ncm/corrective-actions/${(row as NcmCorrectiveAction).id}`" class="mono link">
              {{ (row as NcmCorrectiveAction).caNo }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="issue" label="问题描述" min-width="100" show-overflow-tooltip />
        <el-table-column prop="owner" label="责任人" width="80" />
        <el-table-column prop="dueDate" label="期限" width="95" />
        <el-table-column label="进度" width="110">
          <template #default="{row}">
            <el-progress :percentage="(row as NcmCorrectiveAction).progress ?? 0" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="{row}">
            <span class="pill" :class="caStatusClass((row as NcmCorrectiveAction).status)">
              <span class="d"></span>{{ (row as NcmCorrectiveAction).status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="$router.push(`/ncm/corrective-actions/${(row as NcmCorrectiveAction).id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!caLoading && !relatedCas.length" description="暂无关联纠正措施">
        <el-button type="success" @click="openAssign('CA', record.id, record.defectNo)" v-if="record && !record.caNo">发起纠正措施</el-button>
      </el-empty>
    </el-card>

    <el-empty v-if="!loading && !record" description="未找到该不良记录" />

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
              {{ c.name }}{{ c.enabled ? '' : '(未启用)' }}
            </el-checkbox>
          </el-checkbox-group>
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import { ncmCorrectiveActionApi } from '@/api/modules/ncm/corrective-actions'
import type { NcmDefectRecord, NcmCorrectiveAction } from '@/api/types/ncm'
import type { AssignCandidate, NotifyChannelCandidate } from '@/api/modules/ncm/defect-records'

const route = useRoute()
const loading = ref(false)
const caLoading = ref(false)
const record = ref<NcmDefectRecord | null>(null)
const relatedCas = ref<NcmCorrectiveAction[]>([])

function sevClass(s?: string) {
  return { '严重': 'p-danger', '一般': 'p-warn', '轻微': 'p-info' }[s || ''] || ''
}

function dispClass(s?: string) {
  if (s === '已纠正' || s === '合格入库') return 'p-done'
  return ''
}

function caStatusClass(s: string) {
  return { '待启动': 'p-wait', '进行中': 'p-progress', '已完成': 'p-done', '已关闭': 'p-done' }[s] || 'p-wait'
}

function fmtMinute(v: any) {
  if (!v) return ''
  const m = String(v).match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/)
  return m ? m[0].replace('T', ' ') : String(v)
}

async function load() {
  loading.value = true
  try {
    record.value = await ncmDefectRecordApi.get(route.params.id as string)
    if (record.value?.defectNo) {
      caLoading.value = true
      try {
        relatedCas.value = await ncmCorrectiveActionApi.listByDefectNo(record.value.defectNo)
      } catch { relatedCas.value = [] }
      finally { caLoading.value = false }
    }
  } catch {
    ElMessage.error('加载不良记录失败')
  } finally {
    loading.value = false
  }
}

// ══ 指派弹窗(发起8D/CAPA/CA 必须走此流程,不能绕过) ══
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
    channels.value = res.channels && res.channels.length ? res.channels : [{ code: '站内弹窗', name: '站内弹窗', enabled: true }]
    if (!channels.value.some(c => c.code === '站内弹窗')) channels.value.unshift({ code: '站内弹窗', name: '站内弹窗', enabled: true })
    assignForm.notifyChannels = ['站内弹窗']
  } catch {
    users.value = []
    roles.value = []
    channels.value = [{ code: '站内弹窗', name: '站内弹窗', enabled: true }]
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
  assignForm.notifyChannels = ['站内弹窗']
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
    const body = assignType.value === '8D'
      ? { ownerUserId: assignForm.ownerUserId, notifyChannels: assignForm.notifyChannels, remark: assignForm.remark }
      : { assigneeUserIds: assignForm.assigneeUserIds, assignRoleCodes: assignForm.assignRoleCodes, notifyChannels: assignForm.notifyChannels, remark: assignForm.remark }
    if (assignType.value === '8D') await ncmDefectRecordApi.launch8d(assignDefectId.value, body)
    else if (assignType.value === 'CAPA') await ncmDefectRecordApi.launchCapa(assignDefectId.value, body)
    else await ncmDefectRecordApi.launchCa(assignDefectId.value, body)
    ElMessage.success(`已发起${assignType.value}${assignType.value === '8D' ? '并通知负责人' : '并通知处理人'}`)
    assignVisible.value = false
    await load()
    if (record.value?.defectNo) {
      relatedCas.value = await ncmCorrectiveActionApi.listByDefectNo(record.value.defectNo)
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '发起失败')
  } finally {
    assignSubmitting.value = false
  }
}

onMounted(() => load())
</script>

<style lang="scss" scoped>
.defect-detail { width: 100%; max-width: 1000px; }
.head-b { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b .crumb a { color: $cobalt; text-decoration: none; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.head-actions { display: flex; gap: 10px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.card-title { font-size: 15px; font-weight: 700; color: $ink; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-danger { background: #fce4ec; color: #c62828; } .p-danger .d { background: #c62828; }
.p-warn { background: $amber-dim; color: $amber; } .p-warn .d { background: $amber; }
.p-info { background: #e3f2fd; color: #1565c0; } .p-info .d { background: #1565c0; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-progress { background: #dbeafe; color: #2563eb; } .p-progress .d { background: #2563eb; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.mono { font-family: $font-mono; }
.link { color: $cobalt; text-decoration: none; font-weight: 600; }
.link:hover { text-decoration: underline; }
</style>
