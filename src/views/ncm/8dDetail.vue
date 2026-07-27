<template>
  <div class="d8-detail">
    <div class="head-b">
      <div><div class="crumb">NCM / 不良管理 / 8D 报告</div><h1>8D 详情 <span class="mono no">{{ vo?.report?.d8No }}</span></h1></div>
    </div>
    <div v-if="vo" class="detail-body">
      <!-- 报告头 -->
      <div class="field-grid">
        <div class="field"><div class="l">来源/严重度</div><div class="v">{{ vo.report.source }} · <span class="pill" :class="vo.report.severity==='高'?'p-lock':''"><span class="d"></span>{{ vo.report.severity }}</span></div></div>
        <div class="field"><div class="l">类型</div><div class="v"><span class="tag-b">{{ vo.report.flowType }}</span></div></div>
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
        <div class="stage-card" v-if="vo.report.status !== '已闭环'">
          <!-- 未推进 / 被驳回需重提:填内容 -->
          <div v-if="!stageMap[curStage] || (needApprove(curStage) && stageMap[curStage]?.approvalStatus === '已驳回')" class="stage-form">
            <div class="stage-title">推进 {{ curStage }} · {{ stageNames[curStage] }}
              <span v-if="needApprove(curStage)" class="need-tag">需审核人签名</span>
            </div>
            <input v-model="advance.content" class="field-input" :placeholder="stageNames[curStage]" style="width:100%;margin-bottom:12px" />
            <div style="display:flex;gap:10px;align-items:center">
              <input v-model="advance.owner" class="field-input" :placeholder="ownerPlaceholder" style="width:140px" />
              <button class="btn-fill" @click="doAdvance">确认推进 →</button>
            </div>
            <div v-if="needApprove(curStage) && signerOf(curStage)" class="sign-hint">本阶段需由【{{ signerOf(curStage) }}】签批后方可进入下一阶段</div>
          </div>
          <!-- 待审批:审核人签名 -->
          <div v-else-if="needApprove(curStage) && stageMap[curStage]?.approvalStatus === '待审批'" class="stage-form">
            <div class="stage-title">签批 {{ curStage }} · {{ stageNames[curStage] }}
              <span class="need-tag">当前签批人: {{ authStore.user?.username || '未登录' }}</span>
            </div>
            <div class="stage-content">{{ stageMap[curStage]?.content }}</div>
            <div style="display:flex;gap:10px;align-items:center;margin-top:12px">
              <el-select v-model="approveForm.approved" style="width:100px"><el-option label="通过" :value="true" /><el-option label="驳回" :value="false" /></el-select>
              <input v-model="approveForm.comment" class="field-input" placeholder="审批意见" style="width:160px" />
              <input v-model="approveForm.password" class="field-input" type="password" :placeholder="signerPlaceholder" style="width:140px" />
              <button class="btn-fill" @click="doApprove">提交签批</button>
            </div>
            <div class="sign-hint">电子签名：请输入当前登录用户【{{ authStore.user?.username }}】的登录密码以完成签批</div>
            <div v-if="signerOf(curStage)" class="sign-hint">本阶段仅限【{{ signerOf(curStage) }}】签批</div>
          </div>
          <!-- 已审批通过或普通阶段已完成 -->
          <div v-else-if="stageMap[curStage]" class="stage-form">
            <div class="stage-title">{{ curStage }} · {{ stageNames[curStage] }} ✓</div>
            <div class="stage-content">{{ stageMap[curStage]?.content }}</div>
            <div v-if="stageMap[curStage]?.approvalStatus" class="stage-meta">审批: {{ stageMap[curStage]?.approvalStatus }} · {{ stageMap[curStage]?.approvedBy || '-' }}</div>
          </div>
        </div>

        <!-- 已闭环:重开 -->
        <div v-if="vo.report.status === '已闭环'" style="padding:18px 24px">
          <span class="c-green">8D 已闭环。</span>
          <el-button type="warning" size="small" style="margin-left:16px" @click="doReopen">效果验证复发 — 重开</el-button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import { useAuthStore } from '@/stores/auth'
import type { EightDVo, Qms8dStageDetail, D8Stage, EightDApprovalConfig } from '@/api/types/ncm'

const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id as string
const vo = ref<EightDVo | null>(null)
const activeStep = ref<D8Stage>('D1')

const STAGES: D8Stage[] = ['D1','D2','D3','D4','D5','D6','D7','D8']
const stageNames: Record<D8Stage,string> = { D1:'团队组建',D2:'问题描述',D3:'临时措施',D4:'根因分析',D5:'永久纠正措施',D6:'实施与验证',D7:'预防再发',D8:'闭环归档' }

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
function signerOf(st: string) { return approvalConfig.value[st]?.signer || '' }
const signerPlaceholder = computed(() => '请输入登录密码')
const ownerPlaceholder = computed(() => `责任人(默认: ${authStore.user?.username || '当前用户'})`)

const curStage = computed<D8Stage>(() => (vo.value?.report?.currentStage as D8Stage) || 'D1')
const currentStageIndex = computed(() => STAGES.indexOf(curStage.value) + 1)

const stageMap = computed(() => { const m: Record<string,Qms8dStageDetail> = {}; vo.value?.stages.forEach(s=>{m[s.stageCode]=s}); return m })

function stepCls(st: D8Stage) {
  const idx = STAGES.indexOf(st), curIdx = STAGES.indexOf(curStage.value)
  if (idx < curIdx) return 'done'
  if (idx === curIdx) return 'current'
  return ''
}

const advance = reactive({ content: '', owner: '' })
const approveForm = reactive({ approved: true, comment: '', password: '' })

async function load() {
  vo.value = await ncm8dApi.get(id)
  activeStep.value = curStage.value
  await loadConfig()
}

async function doAdvance() {
  if (!advance.content) return ElMessage.warning('请填写内容')
  const owner = advance.owner || authStore.user?.username || ''
  await ncm8dApi.advance(id, { stageCode: curStage.value, content: advance.content, owner })
  ElMessage.success('已推进'); advance.content = ''; advance.owner = ''; load()
}

async function doApprove() {
  await ncm8dApi.approve(id, { stageCode: curStage.value, ...approveForm })
  ElMessage.success('审批完成'); load()
}

async function doReopen() {
  const reason = prompt('重开原因:')
  if (!reason) return
  await ncm8dApi.reopen(id, reason); ElMessage.success('已重开'); load()
}

onMounted(() => load())
</script>

<style lang="scss" scoped>
.head-b h1 { font-size: 26px; }
/* ══ 步骤条 ══ */
.steps-bar { display: flex; gap: 0; padding: 20px 22px 12px; overflow-x: auto; }
.step-dot { flex: 1; text-align: center; cursor: pointer; padding: 0 4px; min-width: 80px; transition: all .15s; opacity: .45; }
.step-dot.done, .step-dot.current { opacity: 1; }
.step-dot .dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid $hairline; background: $white; display: inline-flex; align-items: center; justify-content: center; font-family: $font-mono; font-size: 10px; font-weight: 600; color: $ink-soft; margin-bottom: 6px; }
.step-dot.done .dot { border-color: $green; background: $green; color: #fff; }
.step-dot.current .dot { border-color: $cobalt; background: $cobalt; color: #fff; }
.step-dot .label { font-size: 11px; font-weight: 500; color: $ink-soft; white-space: nowrap; }
.step-dot.done .label { color: $green; }
.step-dot.current .label { color: $cobalt; }
.step-dot .status-tag { font-size: 10px; color: $ink-faint; margin-top: 2px; }
.step-dot .need-badge { font-size: 10px; color: #b45309; background: #fef3c7; border-radius: 6px; padding: 0 5px; margin-top: 2px; display: inline-block; }
/* ══ 阶段卡片 ══ */
.stage-card { padding: 0 22px 18px; }
.stage-form { padding: 18px; background: $paper; border-radius: 8px; }
.stage-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.stage-content { font-size: 13px; color: $ink-soft; }
.stage-meta { font-size: 11px; color: $ink-faint; margin-top: 6px; }
.need-tag { font-size: 11px; font-weight: 500; color: #b45309; background: #fef3c7; border-radius: 6px; padding: 1px 7px; margin-left: 8px; }
.sign-hint { font-size: 11px; color: #b45309; margin-top: 10px; }
</style>
