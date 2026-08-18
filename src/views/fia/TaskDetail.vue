<template>
  <div class="task-detail">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>任务详情 <span class="mono no">{{ vo?.task?.code }}</span></h1>
      </div>
      <div class="head-actions">
        <button v-if="canSign('inspector')" class="btn-fill" @click="showSignDialog('inspector')">检验员签名</button>
        <button v-if="canSign('reviewer')" class="btn-fill" @click="showSignDialog('reviewer')">复核员签名</button>
        <button v-if="canSign('approver')" class="btn-fill" @click="showSignDialog('approver')">批准员签名</button>
        <button v-if="isCompleted" class="btn-fill btn-cobalt" @click="goSpcCollect">
          <span class="first-badge">FIRST</span> 首件 CPK 验证采集
        </button>
      </div>
    </div>

    <div v-if="vo" class="detail-body">
      <!-- 任务头卡片 -->
      <div class="field-grid">
        <div class="field"><div class="l">工单号</div><div class="v mono">{{ vo.task.woNo }}</div></div>
        <div class="field"><div class="l">产品</div><div class="v">{{ vo.task.productName }}</div></div>
        <div class="field"><div class="l">工序 / 产线</div><div class="v">{{ vo.task.procName }} / {{ vo.task.lineName }}</div></div>
        <div class="field"><div class="l">触发类型</div><div class="v"><span class="tag-b">{{ vo.task.triggerType }}</span></div></div>
        <div class="field"><div class="l">AQL / 标准</div><div class="v mono">{{ vo.task.aql || '-' }} · v{{ vo.task.stdVersion }}</div></div>
        <div class="field"><div class="l">SLA</div><div class="v mono" :class="{ 'c-red': vo.task.isOverdue }">{{ vo.task.slaDueAt?.slice(11, 16) || '-' }}</div></div>
        <div class="field"><div class="l">处置</div><div class="v">{{ vo.task.disposition || '-' }}</div></div>
        <div class="field"><div class="l">综合判定 / 状态</div><div class="v"><span class="pill" :class="judgeClass(vo.task.overallJudge)">{{ vo.task.overallJudge || '-' }}</span> · <span class="pill" :class="statusClass(vo.task.status)"><span class="d"></span>{{ vo.task.status }}</span></div></div>
      </div>

      <div class="grid-b">
        <!-- 检验项表格 -->
        <div class="card-b">
          <div class="card-head"><h2>检验项录入</h2><span class="sub">{{ vo.items?.length || 0 }} 项 · CTQ {{ ctqCount }}</span></div>
          <table>
            <thead><tr><th>序号</th><th>检验项</th><th>CTQ</th><th>标准值</th><th>公差</th><th>单位</th><th>测量值</th><th>判定</th></tr></thead>
            <tbody>
              <tr v-for="(item, i) in vo.items" :key="item.id">
                <td class="mono">{{ String(item.seq).padStart(2, '0') }}</td>
                <td>{{ item.itemName }}</td>
                <td><span class="tag-b" :class="{ 'tag-ctq': item.isCtq }">{{ item.isCtq ? 'CTQ' : '—' }}</span></td>
                <td class="mono">{{ item.stdValue || '-' }}</td>
                <td class="mono">{{ item.tolerance || '-' }}</td>
                <td class="mono">{{ item.unit || '-' }}</td>
                <td>
                  <input v-if="canEdit" class="meas-input" v-model="itemValues[i].measuredValue" placeholder="测量值" />
                  <span v-else class="mono">{{ item.measuredValue || '-' }}</span>
                </td>
                <td>
                  <select v-if="canEdit" class="judge-select" v-model="itemValues[i].judge">
                    <option value="合格">合格</option>
                    <option value="不合格">不合格</option>
                    <option value="警告">警告</option>
                  </select>
                  <span v-else class="pill" :class="itemJudgeClass(item.judge)"><span class="d"></span>{{ item.judge }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="canEdit" class="save-bar">
            <button class="btn-fill" @click="submitItems">保存检验结果</button>
          </div>
        </div>

        <!-- 右栏:签名 + 时间线 -->
        <div class="right-b">
          <div class="card-b">
            <div class="card-head"><h2>电子签名</h2><span class="sub">{{ signLevel }}</span></div>
            <div class="sign-list">
              <div class="sign-card" :class="{ done: vo.task.inspectorId, pending: !vo.task.inspectorId }">
                <div class="role">检验员</div><div class="name">{{ userMap[vo.task.inspectorId || ''] || vo.task.inspectorId || '待签名' }}</div>
              </div>
              <div class="sign-card" :class="{ done: vo.task.reviewerId, pending: !vo.task.reviewerId }">
                <div class="role">复核员</div><div class="name">{{ userMap[vo.task.reviewerId || ''] || vo.task.reviewerId || '待签名' }}</div>
              </div>
              <div class="sign-card" :class="{ done: vo.task.approverId, pending: !vo.task.approverId }" v-if="signLevel === '三级'">
                <div class="role">批准员</div><div class="name">{{ userMap[vo.task.approverId || ''] || vo.task.approverId || '待签名' }}</div>
              </div>
            </div>
          </div>

          <div class="card-b">
            <div class="card-head"><h2>任务轨迹</h2></div>
            <div class="timeline">
              <div v-for="(l, i) in vo.log" :key="i" class="tl-item" :class="i === vo.log!.length - 1 ? 'current' : 'done'">
                <div class="tl-dot"></div>
                <div class="tl-body"><div class="t">{{ l.node }}</div><div class="m mono">{{ l.t?.slice(0, 16) || '' }}</div></div>
              </div>
            </div>
          </div>

          <div class="card-b" v-if="needDisposition">
            <div class="card-head"><h2>处置操作</h2></div>
            <div style="padding:14px 22px">
              <el-select v-model="disposition" placeholder="选择处置路径" style="width:100%">
                <el-option v-for="d in dispositionOptions" :key="d" :label="d" :value="d" />
              </el-select>
              <button class="btn-fill" style="margin-top:8px; width:100%" @click="submitDisposition">提交处置</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 签名弹出 -->
    <el-dialog v-model="signVisible" :title="signRoleLabel" width="320px">
      <el-input v-model="signPassword" type="password" placeholder="密码" show-password />
      <template #footer>
        <el-button @click="signVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSign" :loading="signLoading" v-if="canSign">确认签名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { fiaSignConfigApi } from '@/api/modules/fia/sign-config'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { request } from '@/api/client'
import type { FiaTaskVo, FiaTaskStatus, InspResult, FiaSignConfig, PreviewJudgeRequest, PreviewJudgeResult } from '@/api/types/fia'
import type { SysUser } from '@/api/types/uop'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const perm = usePermissionStore()
const canSign = computed(() => perm.has('fia.sign.inspector'))
const vo = ref<FiaTaskVo | null>(null)
const id = route.params.id as string
const signConfig = ref<FiaSignConfig | null>(null)
const users = ref<SysUser[]>([])

const userMap = computed(() => {
  const m: Record<string, string> = {}
  users.value.forEach(u => { m[u.id] = u.username })
  return m
})

// 检验项编辑
const itemValues = reactive<{ id: string; measuredValue: string; judge: string }[]>([])
const canEdit = computed(() => vo.value && ['待检', '进行中'].includes(vo.value.task.status))
const ctqCount = computed(() => vo.value?.items?.filter(i => i.isCtq).length ?? 0)
const currentLogSeq = computed(() => vo.value?.log?.length ?? 0)

// 签名
const signVisible = ref(false)
const signLoading = ref(false)
const signPassword = ref('')
const signRole = ref<'inspector' | 'reviewer' | 'approver'>('inspector')
const signRoleLabel = computed(() => ({ inspector: '检验员签名', reviewer: '复核员签名', approver: '批准员签名' }[signRole.value]))
const signLevel = computed(() => signConfig.value?.signNodes || '两级')

function canSign(role: string): boolean {
  if (!vo.value) return false
  const s = vo.value.task.status
  if (role === 'inspector') return ['待检', '进行中'].includes(s)
  if (role === 'reviewer') return ['待复核', '待批准'].includes(s)
  if (role === 'approver') return s === '待批准'
  return false
}

function showSignDialog(role: 'inspector' | 'reviewer' | 'approver') {
  signRole.value = role
  signPassword.value = ''
  signVisible.value = true
}

// 任务签字通过(已完成)后,可进入首件 CPK 验证采集(自动带出该任务的参数/工单/批次,stage=FIRST)
const isCompleted = computed(() => vo.value?.task?.status === '已完成')
function goSpcCollect() {
  router.push({ path: '/spc/collect', query: { taskId: id, stage: 'FIRST' } })
}

async function submitSign() {
  signLoading.value = true
  try {
    const body = { password: signPassword.value }
    if (signRole.value === 'inspector') await fiaTaskApi.signInspector(id, body)
    else if (signRole.value === 'reviewer') await fiaTaskApi.signReviewer(id, body)
    else await fiaTaskApi.signApprover(id, body)
    ElMessage.success('签名成功')
    signVisible.value = false
    await load()
  } catch { /* request 已弹错 */ }
  finally { signLoading.value = false }
}

// 检验项提交
async function submitItems() {
  const items = itemValues.filter(v => v.measuredValue || v.judge).map(v => ({ id: v.id, measuredValue: v.measuredValue, judge: v.judge }))
  if (!items.length) { ElMessage.warning('请至少录入一项'); return }
  await fiaTaskApi.enterResults(id, { items })
  ElMessage.success('检验结果已保存')
  await load()
}

// 实时自动判定:测量值变化后,调用后端 previewJudge 按「标准值±公差 / passValues」
// 实时回填判定(可匹配则覆盖 judge;不可匹配项保留人工下拉选择)。
// 后端 enterResults 保存时也会再次以系统判定为准,此处仅提供即时视觉反馈。
const applyingPreview = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null
function scheduleAutoJudge() {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { void autoJudge() }, 250)
}
async function autoJudge() {
  const req: PreviewJudgeRequest = {
    items: itemValues
      .filter(v => v.measuredValue && v.measuredValue.trim())
      .map(v => ({ id: v.id, measuredValue: v.measuredValue.trim() })),
  }
  if (!req.items.length) return
  try {
    const res: PreviewJudgeResult[] = await fiaTaskApi.previewJudge(id, req)
    applyingPreview.value = true
    res.forEach(r => {
      if (r.matchable && r.judge) {
        const idx = itemValues.findIndex(v => v.id === r.id)
        if (idx >= 0) itemValues[idx].judge = r.judge
      }
    })
  } catch { /* 预览失败静默,保留人工判定 */ }
  finally { applyingPreview.value = false }
}
watch(
  () => itemValues.map(v => v.measuredValue),
  () => { if (!applyingPreview.value) scheduleAutoJudge() },
  { deep: false },
)

// 处置
const needDisposition = computed(() => vo.value && vo.value.task.overallJudge === '不合格')
const disposition = ref('')
const dispositionOptions = ['退货', '返工', '让步接收', '紧急放行', '豁免开工', '挑选']

async function submitDisposition() {
  if (!disposition.value) return ElMessage.warning('请选择处置路径')
  await fiaTaskApi.setDisposition(id, { disposition: disposition.value })
  ElMessage.success('处置已提交')
  await load()
}

// 加载详情
async function loadSignConfig() {
  try {
    signConfig.value = await fiaSignConfigApi.get({ orgId: vo.value?.task?.orgId || auth.user?.orgId || '' })
  } catch { /* 降级:默认两级 */ }
}

async function load() {
  const res = await fiaTaskApi.get(id)
  vo.value = res
  vo.value.items.forEach((it, i) => {
    if (!itemValues[i]) itemValues.push({ id: it.id, measuredValue: it.measuredValue || '', judge: it.judge || '' })
  })
  loadSignConfig()
  loadUsers()
  loadLog()
}

async function loadLog() {
  try { vo.value!.log = await fiaTaskApi.getLog(id) } catch { /* */ }
}

async function loadUsers() {
  try { users.value = await request.get<SysUser[]>('/v1/uop/users') } catch { /* */ }
}

// 状态/判定样式
function statusClass(s: FiaTaskStatus): string {
  const m: Record<string, string> = { '待检': 'p-wait', '进行中': 'p-run', '待复核': 'p-sign', '待批准': 'p-sign', '审批中': 'p-run', '已完成': 'p-done' }
  return m[s] || 'p-lock'
}
function judgeClass(j?: InspResult | string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '警告': 'p-wait' }
  return m[j || ''] || ''
}
function itemJudgeClass(j: string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '警告': 'p-wait' }
  return m[j] || 'p-wait'
}

onMounted(() => load())
</script>

<style lang="scss" scoped>
.head-b h1 { font-size: 26px; }
.first-badge { font-family: $font-mono; font-size: 10px; letter-spacing: 1px; background: rgba(0, 71, 171, 0.15); color: $cobalt; border: 1px solid rgba(0, 71, 171, 0.3); padding: 2px 6px; border-radius: 4px; margin-right: 6px; vertical-align: middle; }
.meas-input { width: 80px; border: none; border-bottom: 1.5px solid $hairline; background: transparent; padding: 4px 2px; font-size: 13px; font-family: $font-mono; outline: none; transition: border-color 0.25s; }
.meas-input:focus { border-bottom-color: $cobalt; }
.judge-select { font-size: 13px; border: 1px solid $hairline; border-radius: 4px; padding: 2px 6px; background: $white; outline: none; }
.judge-select:focus { border-color: $cobalt; }
.save-bar { padding: 14px 22px; background: $paper; border-top: 1px solid $hairline; }
.sign-list { padding: 12px 0; }
.sign-card { padding: 14px 22px; display: flex; justify-content: space-between; align-items: center; }
.sign-card + .sign-card { border-top: 1px solid $hairline-soft; }
.sign-card .role { font-size: 12px; color: $ink-faint; letter-spacing: 1px; text-transform: uppercase; }
.sign-card .name { font-size: 14px; font-weight: 500; }
.sign-card.pending .name { color: $ink-faint; }
.timeline { padding: 14px 22px; }
.tl-item { display: flex; gap: 12px; padding-bottom: 14px; position: relative; }
.tl-item:last-child { padding-bottom: 0; }
.tl-item::before { content: ''; position: absolute; left: 6px; top: 16px; bottom: 0; width: 1px; background: $hairline; }
.tl-item:last-child::before { display: none; }
.tl-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid $hairline; background: $white; flex-shrink: 0; margin-top: 2px; z-index: 1; }
.tl-item.done .tl-dot { border-color: $cobalt; background: $cobalt; }
.tl-item.current .tl-dot { border-color: $amber; background: $amber; }
.tl-body .t { font-size: 13px; font-weight: 500; }
.tl-body .m { font-size: 11px; color: $ink-faint; margin-top: 3px; }
</style>
