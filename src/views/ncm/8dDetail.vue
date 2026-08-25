<template>
  <div class="d8-detail">
    <div class="head-b">
      <div><AppBreadcrumb /><h1>8D 详情 <span class="mono no">{{ vo?.report?.d8No }}</span></h1></div>
    </div>
    <div v-if="vo" class="detail-body">
      <!-- 报告头 -->
      <div class="field-grid">
        <div class="field"><div class="l">来源/严重度</div><div class="v">
          <el-link v-if="srcTarget" type="primary" :underline="false" @click="jumpSource">{{ vo.report.source }}</el-link>
          <template v-else>{{ vo.report.source }}</template>
          · <span class="pill" :class="vo.report.severity==='高'?'p-lock':''"><span class="d"></span>{{ vo.report.severity }}</span>
        </div></div>
        <div class="field"><div class="l">类型</div><div class="v"><span class="tag-b">{{ vo.report.flowType || '8D' }}</span></div></div>
        <div class="field"><div class="l">状态</div><div class="v"><span class="pill" :class="vo.report.status==='已闭环'?'p-done':'p-run'"><span class="d"></span>{{ vo.report.status }}</span></div></div>
        <div class="field"><div class="l">团队</div><div class="v">{{ vo.report.team || '-' }}</div></div>
      </div>

      <!-- ══ 步骤条 ══ -->
      <div class="card-b" style="margin-bottom:18px">
        <div class="card-head"><h2>D1-D8 阶段流程</h2><span class="sub">{{ currentStageIndex }}/8</span></div>
        <div class="steps-bar">
          <div v-for="st in STAGES" :key="st" class="step-dot" :class="stepCls(st)" @click="activeStep = st">
            <div class="dot">{{ st.substring(1) }}</div>
            <div class="label">{{ stageNames[st] }}</div>
            <div class="status-tag" v-if="stageMap[st]?.approvalStatus">{{ stageMap[st]?.approvalStatus }}</div>
            <span v-else-if="needApprove(st)" class="need-badge">需签</span>
          </div>
        </div>

        <!-- ══ 当前阶段卡片 ══ -->
        <div class="stage-card" v-if="vo.report.status !== '已闭环' && activeStep === curStage">
          <!-- 未推进 / 被驳回需重提:填内容 -->
          <div v-if="canEdit" class="stage-form">
            <div class="stage-title">推进 {{ curStage }} · {{ stageNames[curStage] }}
              <span v-if="needApprove(curStage)" class="need-tag">需审核人签名</span>
            </div>
            <!-- D1 团队组建:负责人多选团队成员,提交后由质量部门审核 -->
            <div v-if="curStage === 'D1'" class="d1-team-block">
              <div class="tool-h">团队成员(多选,提交后由质量部门审核团队构成)</div>
              <el-select v-model="advance.teamMemberIds" multiple filterable placeholder="选择团队成员" style="width:100%">
                <el-option v-for="u in users" :key="u.id" :label="u.realName || u.username || u.id" :value="u.id" />
              </el-select>
            </div>
            <input v-else-if="curStage !== 'D4'" v-model="advance.content" class="field-input" :placeholder="stageNames[curStage]" style="width:100%;margin-bottom:12px" />
            <div v-else class="d4-tools">
              <div class="tool-block">
                <div class="tool-h">鱼骨图（5M1E 根因分析）</div>
                <FishboneTable :d8-id="id" :org-id="vo.report.orgId" :problem="vo.report.issue" />
              </div>
              <div class="tool-block">
                <div class="tool-h">5Why 根因追问</div>
                <FiveWhyEditor :items="fiveWhyItems" mode="edit" @update="onWhyUpdate" />
              </div>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
              <input v-model="advance.owner" class="field-input" :placeholder="ownerPlaceholder" style="width:140px" />
              <button class="btn-fill" v-if="canAdvance" @click="doAdvance">确认推进 →</button>
            </div>
            <div v-if="needApprove(curStage) && signerOf(curStage)" class="sign-hint">本阶段需由【{{ signerOf(curStage) }}】签批后方可进入下一阶段</div>
          </div>
          <!-- 待审批:审核人签名 -->
          <div v-else-if="needApprove(curStage) && stageMap[curStage]?.approvalStatus === '待审批'" class="stage-form">
            <div class="stage-title">签批 {{ curStage }} · {{ stageNames[curStage] }}
              <span class="need-tag">当前签批人: {{ authStore.user?.username || '未登录' }}</span>
            </div>
            <div class="stage-content" v-if="curStage !== 'D4'">{{ stageMap[curStage]?.content }}</div>
            <div v-else class="d4-view">
              <FishboneTable :d8-id="id" :org-id="vo.report.orgId" :problem="vo.report.issue" readonly />
              <FiveWhyEditor :items="d4FiveWhyView" :problem="vo.report.issue" mode="view" />
            </div>
            <div v-if="stageMap[curStage]?.teamMembers" class="stage-meta">团队成员: {{ stageMap[curStage].teamMembers }}</div>
            <div style="display:flex;gap:10px;align-items:center;margin-top:12px">
              <el-select v-model="approveForm.approved" style="width:100px"><el-option label="通过" :value="true" /><el-option label="驳回" :value="false" /></el-select>
              <input v-model="approveForm.comment" class="field-input" placeholder="审批意见" style="width:160px" />
              <input v-model="approveForm.password" class="field-input" type="password" :placeholder="signerPlaceholder" style="width:140px" />
              <button class="btn-fill" v-if="canApprove" @click="doApprove">提交签批</button>
            </div>
            <div class="sign-hint">电子签名：请输入当前登录用户【{{ authStore.user?.username }}】的登录密码以完成签批</div>
            <div v-if="signerOf(curStage)" class="sign-hint">本阶段仅限【{{ signerOf(curStage) }}】签批</div>
          </div>
          <!-- 已审批通过或普通阶段已完成 -->
          <div v-else-if="stageMap[curStage]" class="stage-form">
            <div class="stage-title">{{ curStage }} · {{ stageNames[curStage] }} ✓</div>
            <div class="stage-content" v-if="curStage !== 'D4'">{{ stageMap[curStage]?.content }}</div>
            <div v-else class="d4-view">
              <FishboneTable :d8-id="id" :org-id="vo.report.orgId" :problem="vo.report.issue" readonly />
              <FiveWhyEditor :items="d4FiveWhyView" :problem="vo.report.issue" mode="view" />
            </div>
            <div v-if="stageMap[curStage]?.teamMembers" class="stage-meta">团队成员: {{ stageMap[curStage].teamMembers }}</div>
            <div v-if="stageMap[curStage]?.approvalStatus" class="stage-meta">审批: {{ stageMap[curStage]?.approvalStatus }} · {{ stageMap[curStage]?.approvedBy || '-' }}</div>
          </div>
        </div>

        <!-- 阶段详情查看:点击步骤条查看任意阶段(闭环后 / 进行中查看历史阶段),只读 -->
        <div class="stage-viewer" v-if="activeStep !== curStage || vo.report.status === '已闭环'">
          <div class="stage-title">{{ activeStep }} · {{ stageNames[activeStep] }}
            <span v-if="stageMap[activeStep]?.approvalStatus" class="need-tag">{{ stageMap[activeStep].approvalStatus }}</span>
            <span v-else-if="!stageMap[activeStep]" class="need-tag">未开始</span>
          </div>
          <template v-if="activeStep !== 'D4'">
            <div class="stage-content" v-if="stageMap[activeStep]?.content">{{ stageMap[activeStep].content }}</div>
            <div class="stage-empty" v-else>该阶段暂无文本记录</div>
            <div v-if="stageMap[activeStep]?.teamMembers" class="stage-meta">团队成员: {{ stageMap[activeStep].teamMembers }}</div>
          </template>
          <div v-else class="d4-view">
            <FishboneTable :d8-id="id" :org-id="vo.report.orgId" :problem="vo.report.issue" readonly />
            <FiveWhyEditor :items="activeStepFiveWhy" :problem="vo.report.issue" mode="view" />
          </div>
          <div v-if="stageMap[activeStep]?.owner" class="stage-meta">责任人: {{ stageMap[activeStep].owner }}</div>
          <div v-if="stageMap[activeStep]?.approvedBy" class="stage-meta">签批人: {{ stageMap[activeStep].approvedBy }}</div>
        </div>

        <!-- 已闭环:重开 -->
        <div v-if="vo.report.status === '已闭环' && route.query.from !== 'archive'" style="padding:18px 24px">
          <span class="c-green">8D 已闭环。</span>
          <el-button type="warning" size="small" style="margin-left:16px" v-if="canReopen" @click="doReopen">效果验证复发 — 重开</el-button>
        </div>
      </div>

      <!-- 右栏:基本信息 -->
      <div class="card-b">
        <div class="card-head"><h2>基本信息</h2></div>
        <div style="padding:14px 22px;font-size:13px">
          <div class="info-row"><span class="l">问题描述</span><span>{{ vo.report.issue || '-' }}</span></div>
          <div class="info-row"><span class="l">关闭日期</span><span class="mono">{{ vo.report.closeDate || '-' }}</span></div>
          <div class="info-row"><span class="l">创建时间</span><span class="mono">{{ vo.report.createdAt?.slice(0,10) || '-' }}</span></div>
        </div>
      </div>

      <!-- 操作轨迹:全流程留痕时间线 -->
      <div class="card-b">
        <div class="card-head"><h2>操作轨迹</h2><span class="sub">全过程可追溯</span></div>
        <div v-if="trailLoading" class="trail-empty">加载中…</div>
        <div v-else-if="!trail.length" class="trail-empty">暂无操作记录(启用留痕后开始记录)</div>
        <el-timeline v-else class="trail-timeline">
          <el-timeline-item
            v-for="item in trail"
            :key="item.id"
            :timestamp="fmtTime(item.createdAt)"
            placement="top"
            :color="actionColor(item.action)"
            :hollow="item.status !== 'SUCCESS'"
          >
            <div class="trail-row">
              <span class="trail-action" :style="{ color: actionColor(item.action) }">{{ actionText(item.action) }}</span>
              <span class="trail-operator">{{ item.operatorName }}</span>
            </div>
            <div class="trail-detail" v-if="item.detail">{{ item.detail }}</div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { getSourceTarget } from '@/utils/sourceTrace'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import type { AssignCandidate } from '@/api/modules/ncm/defect-records'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import FishboneTable from '@/components/workflow/FishboneTable.vue'
import FiveWhyEditor from '@/components/workflow/FiveWhyEditor.vue'
import type { EightDVo, Qms8dStageDetail, D8Stage, EightDApprovalConfig, Qms8dWhyItem } from '@/api/types/ncm'
import type { AuditLogItem } from '@/api/modules/ncm/8d-reports'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const perm = usePermissionStore()
const canAdvance = computed(() => perm.has('ncm.8d.advance'))
const canApprove = computed(() => perm.has('ncm.8d.approve'))
const canReopen = computed(() => perm.has('ncm.8d.reopen'))
const id = route.params.id as string
const vo = ref<EightDVo | null>(null)
const activeStep = ref<D8Stage>('D1')

const STAGES: D8Stage[] = ['D1','D2','D3','D4','D5','D6','D7','D8']

// 来源单号 → 追溯跳转目标(触发本 8D 的源头事件)
const srcTarget = computed(() => getSourceTarget(vo.value?.report?.source, vo.value?.report?.sourceRefId))
function jumpSource() {
  if (!srcTarget.value) return
  router.push({ path: srcTarget.value.path, query: srcTarget.value.query })
}
const stageNames: Record<D8Stage,string> = { D1:'团队组建',D2:'问题描述',D3:'临时措施',D4:'根因分析',D5:'永久纠正措施',D6:'实施与验证',D7:'预防再发',D8:'闭环归档' }

// 支持从归档详情等外部入口带 ?stage=DX 直接进入对应阶段(便于查看鱼骨图/5Why 根因分析)
const initStage = route.query.stage as string | undefined
if (initStage && (STAGES as ReadonlyArray<string>).includes(initStage)) {
  activeStep.value = initStage as D8Stage
}

// 8D 阶段审核配置(决定哪些阶段需审核人签名、由谁签批)
const approvalConfig = ref<Record<string, { needApproval: boolean; signer?: string | null }>>({})
async function loadConfig() {
  try {
    const list = await ncm8dApi.getApprovalConfig()
    const m: Record<string, { needApproval: boolean; signer?: string | null }> = {}
    ;(list || []).forEach((c: EightDApprovalConfig) => { m[c.stageCode] = { needApproval: !!c.needApproval, signer: c.signer || null } })
    approvalConfig.value = m
  } catch (e) { /* 配置加载失败不阻塞主流程 */ }
}
function needApprove(st: string) { return !!approvalConfig.value[st]?.needApproval }
function signerOf(st: string) {
  const raw = approvalConfig.value[st]?.signer || ''
  if (!raw) return ''
  // signer 为逗号分隔的多人 userId(OR 语义:任一可签);解析为真实姓名展示,兼容历史单 username
  const names = raw.split(',').map(s => s.trim()).filter(Boolean).map(t => userNameMap.value[t] || t)
  return names.join('、')
}
const signerPlaceholder = computed(() => '请输入登录密码')
const defaultOwner = computed(() => vo.value?.report?.team || authStore.user?.username || '')
const ownerPlaceholder = computed(() => `责任人(默认: ${defaultOwner.value || '当前用户'})`)

const curStage = computed<D8Stage>(() => (vo.value?.report?.currentStage as D8Stage) || 'D1')
const currentStageIndex = computed(() => STAGES.indexOf(curStage.value) + 1)

const stageMap = computed(() => { const m: Record<string,Qms8dStageDetail> = {}; vo.value?.stages.forEach(s=>{m[s.stageCode]=s}); return m })

// 当前阶段是否可编辑/重新提交:
// - 已闭环 -> 不可编辑(仅显示重开入口)
// - 阶段明细不存在(从未提交) -> 可编辑
// - 待审批 -> 不可编辑(走签批分支)
// - 已驳回 -> 可编辑(重提)
// - 已通过/无需审批但报告仍在进行中(如重开退回 D6) -> 可重新编辑提交
const canEdit = computed(() => {
  if (vo.value?.report?.status === '已闭环') return false
  const d = stageMap.value[curStage.value]
  if (!d) return true
  if (d.approvalStatus === '待审批') return false
  return true
})

function stepCls(st: D8Stage) {
  const idx = STAGES.indexOf(st), curIdx = STAGES.indexOf(curStage.value)
  if (idx < curIdx) return 'done'
  if (idx === curIdx) return 'current'
  if (st === activeStep.value) return 'active'
  return ''
}

const advance = reactive({ content: '', owner: '', teamMemberIds: [] as string[] })
const approveForm = reactive({ approved: true, comment: '', password: '' })

// D1 团队组建:可选的系统用户(负责人自建团队)
const users = ref<AssignCandidate[]>([])
const userNameMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  users.value.forEach((u) => { m[u.id] = u.realName || u.username || u.id })
  return m
})
async function loadUsers() {
  try {
    const res = await ncmDefectRecordApi.assignCandidates()
    users.value = res.users || []
  } catch {
    users.value = []
  }
}

// D4 根因分析:5Why 条目(序列化进 D4 阶段明细 content JSON)
const fiveWhyItems = ref<Qms8dWhyItem[]>([])
const d4FiveWhyView = computed<Qms8dWhyItem[]>(() => {
  const c = stageMap.value['D4']?.content
  if (!c) return []
  try {
    const j = JSON.parse(c)
    return Array.isArray(j.fiveWhy) ? j.fiveWhy : []
  } catch {
    return []
  }
})
function onWhyUpdate(v: Qms8dWhyItem[]) { fiveWhyItems.value = v }

// 点击步骤条查看的阶段:5Why 解析(用于只读查看器)
const activeStepFiveWhy = computed<Qms8dWhyItem[]>(() => {
  const c = stageMap.value[activeStep.value]?.content
  if (!c) return []
  try {
    const j = JSON.parse(c)
    return Array.isArray(j.fiveWhy) ? j.fiveWhy : []
  } catch {
    return []
  }
})

async function load() {
  vo.value = await ncm8dApi.get(id)
  activeStep.value = curStage.value
  await loadConfig()
  await loadUsers()
  await loadTrail()
}

// 操作轨迹:拉取该 8D 报告的全流程留痕,时间倒序展示
const trail = ref<AuditLogItem[]>([])
const trailLoading = ref(false)
async function loadTrail() {
  trailLoading.value = true
  try {
    const res = await ncm8dApi.getAuditTrail(id, { size: 100 })
    trail.value = res.records || []
  } catch {
    trail.value = []
  } finally {
    trailLoading.value = false
  }
}

// 动作 → 展示文案 / 节点颜色(工业风中性蓝灰 + 克制的强调色)
function actionText(action: string): string {
  switch (action) {
    case 'CREATE': return '发起'
    case 'ADVANCE': return '推进'
    case 'APPROVE': return '签批'
    case 'REOPEN': return '重开'
    case 'ARCHIVE': return '归档'
    case 'ARCHIVE_INVALIDATE': return '归档作废'
    default: return action || '操作'
  }
}
function actionColor(action: string): string {
  switch (action) {
    case 'CREATE': return '#3182ce'   // 蓝
    case 'ADVANCE': return '#3182ce'  // 蓝
    case 'APPROVE': return '#38a169'   // 绿(通过)
    case 'REOPEN': return '#dd6b20'    // 琥珀
    case 'ARCHIVE': return '#a0aec0'   // 灰
    case 'ARCHIVE_INVALIDATE': return '#e53e3e' // 橙红
    default: return '#718096'
  }
}
function fmtTime(ts: string | null): string {
  if (!ts) return ''
  return ts.replace('T', ' ').slice(0, 19)
}

async function doAdvance() {
  let content = advance.content
  let teamMembers = ''
  // D1 团队组建:负责人多选成员,teamMembers 传 user_id 逗号串(供后端精准通知成员),
  // content 自动汇总团队姓名(用于详情页展示),提交后走待审批/签批
  if (curStage.value === 'D1') {
    if (!advance.teamMemberIds.length) return ElMessage.warning('请选择至少一名团队成员')
    const names = advance.teamMemberIds.map((uid) => userNameMap.value[uid] || uid)
    // 后端按逗号分隔的 user_id 列表解析并逐人推送站内信;content 保留姓名便于查看
    teamMembers = advance.teamMemberIds.join(',')
    content = '团队成员:' + names.join('、')
  } else if (curStage.value === 'D4') {
    // D4 阶段:5Why 序列化进阶段明细 content;鱼骨图走独立表(后端校验≥1 条)
    if (!fiveWhyItems.value.length || fiveWhyItems.value.every((x) => !x.why && !x.answer)) {
      return ElMessage.warning('D4 根因分析需至少录入 1 层 5Why(鱼骨图至少 1 条)')
    }
    content = JSON.stringify({ fiveWhy: fiveWhyItems.value })
  } else {
    if (!advance.content) return ElMessage.warning('请填写内容')
  }
  const owner = advance.owner || defaultOwner.value || authStore.user?.username || ''
  await ncm8dApi.advance(id, { stageCode: curStage.value, content, owner, teamMembers })
  ElMessage.success(curStage.value === 'D1' ? '已提交,待质量部门审核' : '已推进')
  advance.content = ''; advance.owner = ''; advance.teamMemberIds = []; fiveWhyItems.value = []; load()
}

async function doApprove() {
  await ncm8dApi.approve(id, { stageCode: curStage.value, ...approveForm })
  ElMessage.success('审批完成'); load()
}

async function doReopen() {
  try {
    const { value } = await ElMessageBox.prompt('请输入重开原因（效果验证复发）', '重开 8D', {
      confirmButtonText: '确定重开',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '复发情况说明…',
      inputValidator: (v) => (v && v.trim() ? true : '重开原因不能为空'),
    })
    const reason = value.trim()
    await ncm8dApi.reopen(id, reason)
    ElMessage.success('已重开')
    load()
  } catch {
    /* 取消则忽略 */
  }
}

onMounted(() => load())
</script>

<style lang="scss" scoped>
.head-b h1 { font-size: 26px; }
/* ══ 步骤条 ══ */
.steps-bar { display: flex; gap: 0; padding: 20px 22px 12px; overflow-x: auto; }
.step-dot { flex: 1; text-align: center; cursor: pointer; padding: 0 4px; min-width: 80px; transition: all .15s; opacity: .45; }
.step-dot.done, .step-dot.current, .step-dot.active { opacity: 1; }
.step-dot .dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid $hairline; background: $white; display: inline-flex; align-items: center; justify-content: center; font-family: $font-mono; font-size: 10px; font-weight: 600; color: $ink-soft; margin-bottom: 6px; }
.step-dot.done .dot { border-color: $green; background: $green; color: #fff; }
.step-dot.current .dot { border-color: $cobalt; background: $cobalt; color: #fff; }
.step-dot.active .dot { border-color: $cobalt; background: $white; color: $cobalt; box-shadow: 0 0 0 3px rgba($cobalt, .15); }
.step-dot .label { font-size: 11px; font-weight: 500; color: $ink-soft; white-space: nowrap; }
.step-dot.done .label { color: $green; }
.step-dot.current .label { color: $cobalt; }
.step-dot.active .label { color: $cobalt; }
.step-dot .status-tag { font-size: 10px; color: $ink-faint; margin-top: 2px; }
.step-dot .need-badge { font-size: 10px; color: #b45309; background: #fef3c7; border-radius: 6px; padding: 0 5px; margin-top: 2px; display: inline-block; }
/* ══ 阶段卡片 ══ */
.stage-card { padding: 0 22px 18px; }
.stage-form { padding: 18px; background: $paper; border-radius: 8px; }
.stage-viewer { padding: 18px; background: $paper; border-radius: 8px; border: 1px dashed #cdd9e6; }
.stage-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.stage-content { font-size: 13px; color: $ink-soft; white-space: pre-wrap; line-height: 1.7; }
.stage-empty { font-size: 13px; color: $ink-faint; font-style: italic; }
.stage-meta { font-size: 11px; color: $ink-faint; margin-top: 6px; }
.need-tag { font-size: 11px; font-weight: 500; color: #b45309; background: #fef3c7; border-radius: 6px; padding: 1px 7px; margin-left: 8px; }
.sign-hint { font-size: 11px; color: #b45309; margin-top: 10px; }
/* ══ D1 团队组建区 ══ */
.d1-team-block { border: 1px solid #e6eef8; border-radius: 8px; padding: 12px; background: #fff; margin-bottom: 12px; }
/* ══ D4 根因分析工具区 ══ */
.d4-tools { display: flex; flex-direction: column; gap: 16px; margin-bottom: 12px; }
.tool-block { border: 1px solid #e6eef8; border-radius: 8px; padding: 12px; background: #fff; }
.tool-h { font-size: 13px; font-weight: 600; color: #2b3a4a; margin-bottom: 10px; }
.d4-view { display: flex; flex-direction: column; gap: 16px; margin-bottom: 10px; }
/* ══ 操作轨迹时间线 ══ */
.trail-timeline { padding: 18px 22px 8px; }
.trail-empty { padding: 22px; font-size: 13px; color: $ink-faint; font-style: italic; }
.trail-row { display: flex; align-items: baseline; gap: 8px; }
.trail-action { font-size: 13px; font-weight: 600; }
.trail-operator { font-size: 12px; color: $ink-soft; }
.trail-detail { font-size: 12px; color: $ink-soft; margin-top: 2px; line-height: 1.5; }
</style>
