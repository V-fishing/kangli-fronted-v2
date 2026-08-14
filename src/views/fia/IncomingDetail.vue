<template>
  <div class="incoming-detail">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>来料检验详情 <span class="mono no">{{ vo?.task?.code }}</span></h1>
      </div>
      <div class="head-actions">
        <button v-if="canSign('inspector')" class="btn-fill" @click="showSignDialog('inspector')">检验员签名</button>
        <button v-if="canSign('reviewer')" class="btn-fill" @click="showSignDialog('reviewer')">复核员签名</button>
        <button v-if="canSign('approver')" class="btn-fill" @click="showSignDialog('approver')">批准员签名</button>
      </div>
    </div>

    <div v-if="vo" class="detail-body">
      <!-- 任务头 -->
      <div class="field-grid">
        <div class="field"><div class="l">来料批次</div><div class="v mono">{{ vo.task.batchNo || vo.task.woNo || '-' }}</div></div>
        <div class="field"><div class="l">物料 / 产品</div><div class="v">{{ vo.task.productName }} <span class="mono" v-if="vo.task.partNo">({{ vo.task.partNo }})</span></div></div>
        <div class="field"><div class="l">供应商</div><div class="v">{{ supplierMap[vo.task.supplierId || ''] || vo.task.supplierId || '-' }}</div></div>
        <div class="field"><div class="l">工序</div><div class="v">{{ vo.task.procName || '-' }}</div></div>
        <div class="field"><div class="l">触发类型</div><div class="v"><span class="tag-b">{{ vo.task.triggerType || '来料入库' }}</span></div></div>
        <div class="field"><div class="l">AQL / 抽样数</div><div class="v mono">{{ vo.task.aql || '-' }} · {{ vo.task.sampleSize ?? '-' }}</div></div>
        <div class="field"><div class="l">SLA</div><div class="v mono" :class="{ 'c-red': vo.task.isOverdue }">{{ vo.task.slaDueAt?.slice(0, 16).replace('T', ' ') || '-' }}</div></div>
        <div class="field"><div class="l">处置</div><div class="v">{{ vo.task.disposition || '-' }}</div></div>
        <div class="field"><div class="l">综合判定 / 状态</div><div class="v"><span class="pill" :class="judgeClass(vo.task.overallJudge)">{{ vo.task.overallJudge || '-' }}</span> · <span class="pill" :class="statusClass(vo.task.status)"><span class="d"></span>{{ vo.task.status }}</span></div></div>
      </div>

      <div class="grid-b">
        <!-- 检验项 -->
        <div class="card-b">
          <div class="card-head"><h2>检验项录入</h2><span class="sub">{{ vo.items?.length || 0 }} 项 · CTQ {{ ctqCount }}</span></div>
          <div class="table-scroll">
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
                  <span v-else class="pill" :class="itemJudgeClass(item.judge)"><span class="d"></span>{{ judgeText(item.judge) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <div v-if="canEdit" class="save-bar">
            <button class="btn-fill" @click="submitItems">保存检验结果</button>
          </div>
        </div>

        <!-- 右栏 -->
        <div class="right-b">
          <div class="card-b">
            <div class="card-head"><h2>电子签名</h2><span class="sub">三级</span></div>
            <div class="sign-list">
              <div class="sign-card" :class="{ done: vo.task.inspectorId, pending: !vo.task.inspectorId }">
                <div class="role">检验员</div><div class="name">{{ userMap[vo.task.inspectorId || ''] || vo.task.inspectorId || '待签名' }}</div>
              </div>
              <div class="sign-card" :class="{ done: vo.task.reviewerId, pending: !vo.task.reviewerId }">
                <div class="role">复核员</div><div class="name">{{ userMap[vo.task.reviewerId || ''] || vo.task.reviewerId || '待签名' }}</div>
              </div>
              <div class="sign-card" :class="{ done: vo.task.approverId, pending: !vo.task.approverId }">
                <div class="role">批准员</div><div class="name">{{ userMap[vo.task.approverId || ''] || vo.task.approverId || '待签名' }}</div>
              </div>
            </div>
          </div>

          <div class="card-b">
            <div class="card-head"><h2>任务轨迹</h2></div>
            <div class="timeline">
              <template v-if="vo.log?.length">
                <div v-for="(l, i) in vo.log" :key="i" class="tl-item" :class="i === vo.log!.length - 1 ? 'current' : 'done'">
                  <div class="tl-dot"></div>
                  <div class="tl-body"><div class="t">{{ l.node }}</div><div class="m mono">{{ l.t?.slice(0, 16) || '' }}</div></div>
                </div>
              </template>
              <div v-else class="tl-empty">暂无轨迹记录</div>
            </div>
          </div>

          <div class="card-b" v-if="needDisposition">
            <div class="card-head"><h2>来料处置</h2></div>
            <div style="padding:14px 22px">
              <el-select v-model="disposition" placeholder="选择处置路径" style="width:100%">
                <el-option v-for="d in dispositionOptions" :key="d" :label="d" :value="d" />
              </el-select>
              <el-input v-model="dispositionRemark" placeholder="处置备注（可选）" style="margin-top:8px" />
              <button class="btn-fill" style="margin-top:8px; width:100%" @click="submitDisposition">提交处置</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 签名弹窗 -->
    <el-dialog v-model="signVisible" :title="signRoleLabel" width="320px">
      <el-input v-model="signPassword" type="password" placeholder="密码" show-password />
      <template #footer>
        <el-button @click="signVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSign" :loading="signLoading">确认签名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { fiaIncomingApi } from '@/api/modules/fia/incoming'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { request } from '@/api/client'
import type { FiaTaskVo, FiaTaskStatus, InspResult } from '@/api/types/fia'
import type { SysUser } from '@/api/types/uop'
import type { SqmSupplier } from '@/api/types/sqm'

const route = useRoute()
const vo = ref<FiaTaskVo | null>(null)
const id = route.params.id as string
const users = ref<SysUser[]>([])
const suppliers = ref<SqmSupplier[]>([])

const userMap = computed(() => {
  const m: Record<string, string> = {}
  users.value.forEach(u => { m[u.id] = u.username })
  return m
})
const supplierMap = computed(() => {
  const m: Record<string, string> = {}
  suppliers.value.forEach(s => { m[s.id] = s.name })
  return m
})

// 检验项编辑
const itemValues = reactive<{ id: string; measuredValue: string; judge: string }[]>([])
const canEdit = computed(() => vo.value && ['待检', '进行中'].includes(vo.value.task.status))
const ctqCount = computed(() => vo.value?.items?.filter(i => i.isCtq).length ?? 0)

// 签名
const signVisible = ref(false)
const signLoading = ref(false)
const signPassword = ref('')
const signRole = ref<'inspector' | 'reviewer' | 'approver'>('inspector')
const signRoleLabel = computed(() => ({ inspector: '检验员签名', reviewer: '复核员签名', approver: '批准员签名' }[signRole.value]))

function canSign(role: string): boolean {
  if (!vo.value) return false
  const s = vo.value.task.status
  // 后端 signInspector 强制要求"进行中"(待检需先录入结果推进),故与后端对齐仅"进行中"显示
  if (role === 'inspector') return s === '进行中'
  if (role === 'reviewer') return ['待复核', '待批准'].includes(s)
  if (role === 'approver') return s === '待批准'
  return false
}

function showSignDialog(role: 'inspector' | 'reviewer' | 'approver') {
  signRole.value = role
  signPassword.value = ''
  signVisible.value = true
}

async function submitSign() {
  signLoading.value = true
  try {
    const body = { password: signPassword.value }
    if (signRole.value === 'inspector') await fiaIncomingApi.signInspector(id, body)
    else if (signRole.value === 'reviewer') await fiaIncomingApi.signReviewer(id, body)
    else await fiaIncomingApi.signApprover(id, body)
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
  await fiaIncomingApi.enterResults(id, { items })
  ElMessage.success('检验结果已保存')
  await load()
}

// 来料处置（后端白名单：合格入库/退货/让步接收/挑选）
// 注意：必须在「复核人签名」之前可选定，后端会在复核签名时按 disposition 是否命中
// 审批类（让步接收）决定是否创建审批单；overallJudge 仅归档后才有，故不能用作显示条件。
const needDisposition = computed(() => {
  if (!vo.value) return false
  const t = vo.value.task
  if (!['待复核', '待批准', '审批中', '已完成'].includes(t.status)) return false
  return !t.disposition
})
const disposition = ref('')
const dispositionRemark = ref('')
const dispositionOptions = ['合格入库', '退货', '让步接收', '挑选']

async function submitDisposition() {
  if (!disposition.value) return ElMessage.warning('请选择处置路径')
  await fiaIncomingApi.setDisposition(id, { disposition: disposition.value, remark: dispositionRemark.value || undefined })
  ElMessage.success('处置已提交')
  await load()
}

// 加载详情（来料无独立 log 接口，使用 vo.log 空态降级）
async function load() {
  const res = await fiaIncomingApi.get(id)
  vo.value = res
  itemValues.length = 0
  vo.value.items.forEach(it => {
    itemValues.push({ id: it.id, measuredValue: it.measuredValue || '', judge: it.judge || '' })
  })
  loadUsers()
  loadSuppliers()
}

async function loadSuppliers() {
  try { suppliers.value = await sqmSupplierApi.list() } catch { /* */ }
}

async function loadUsers() {
  try { users.value = await request.get<SysUser[]>('/v1/uop/users') } catch { /* */ }
}

// 状态/判定样式
function statusClass(s: FiaTaskStatus): string {
  const m: Record<string, string> = { '待检': 'p-wait', '进行中': 'p-run', '待复核': 'p-sign', '待批准': 'p-sign', '审批中': 'p-run', '已完成': 'p-done' }
  return m[s] || 'p-lock'
}
function judgeText(j?: string): string {
  return j === '合格' || j === '不合格' || j === '警告' ? j : '未判定'
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
.meas-input { width: 80px; border: none; border-bottom: 1.5px solid $hairline; background: transparent; padding: 4px 2px; font-size: 13px; font-family: $font-mono; outline: none; transition: border-color 0.25s; }
.meas-input:focus { border-bottom-color: $cobalt; }
.judge-select { font-size: 13px; border: 1px solid $hairline; border-radius: 4px; padding: 2px 6px; background: $white; outline: none; }
.judge-select:focus { border-color: $cobalt; }
.save-bar { padding: 14px 22px; background: $paper; border-top: 1px solid $hairline; }
.table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table-scroll > table { min-width: 680px; }
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
.tl-empty { font-size: 12px; color: $ink-faint; text-align: center; padding: 8px 0; }
</style>
