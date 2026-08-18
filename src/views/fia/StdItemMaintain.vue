<template>
  <div class="std-maintain">
    <div class="head-b">
      <AppBreadcrumb />
      <h1>标准检验项明细维护</h1>
      <p class="sub">为各检验标准配置判定规则（标准值/公差 或 枚举/合格值），提升录入环节的系统自动判定覆盖率。</p>
    </div>

    <div class="layout">
      <!-- 左：标准列表 -->
      <el-card shadow="never" class="left-card">
        <div class="left-head">
          <span class="lt">检验标准</span>
          <el-input v-model="kw" size="small" placeholder="搜索编码/物料" clearable class="kw" />
        </div>
        <div class="std-list-scroll" ref="listScroll">
          <div
            v-for="s in pagedStds"
            :key="s.id"
            class="std-row"
            :class="{ active: s.id === selectedId }"
            @click="select(s.id)"
          >
            <div class="sr-top">
              <span class="code">{{ s.code }}</span>
              <el-tag size="small" effect="light" :type="s.status === '生效' ? 'success' : s.status === '草稿' ? 'warning' : 'info'">{{ s.status }}</el-tag>
            </div>
            <div class="sr-mat">{{ s.material || '未填写物料' }}</div>
            <div class="sr-meta">{{ s.procName || '—' }} · {{ s.partNo || '—' }}</div>
          </div>
          <el-empty v-if="!filteredStds.length" description="暂无标准" :image-size="60" />
        </div>
        <el-pagination
          v-if="filteredStds.length"
          class="std-pager"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredStds.length"
          :page-sizes="[10, 20, 50, 100]"
          v-model:page-size="pageSize"
          v-model:current-page="page"
          @current-change="scrollTop"
          @size-change="() => { page = 1; scrollTop() }"
        />
      </el-card>

      <!-- 右：明细编辑 + 试算 -->
      <el-card shadow="never" class="right-card" v-loading="loading">
        <template v-if="current">
          <div class="right-head">
            <div>
              <div class="rh-code">{{ current.code }}</div>
              <div class="rh-sub">{{ current.material }} · {{ current.procName }} · 版本 {{ current.stdVersion || '—' }}</div>
            </div>
            <div class="rh-actions">
              <el-button :loading="traceLoading" @click="openTrace">引用追溯</el-button>
              <el-button @click="goToSpcParams">去配置SPC参数</el-button>
              <el-button type="primary" :loading="saving" @click="save" v-if="canEditStd">保存明细</el-button>
            </div>
          </div>

          <StdItemEditor v-model="items" :highlight-id="locateItemId" />

          <el-divider content-position="left">
            判定试算
            <span class="divider-tip">对可匹配检验项填入实测示例，实时预览系统判定</span>
          </el-divider>

          <el-table :data="trialRows" size="small" border stripe class="trial-table">
            <el-table-column prop="itemName" label="检验项" min-width="150" />
            <el-table-column label="类型" width="80">
              <template #default="{ row }">{{ row.valueType === 'numeric' ? '数值' : '枚举' }}</template>
            </el-table-column>
            <el-table-column label="规则" min-width="160">
              <template #default="{ row }">{{ ruleText(row as FiaStdItemRequest) }}</template>
            </el-table-column>
            <el-table-column label="实测示例" min-width="130">
              <template #default="{ row }">
                <el-input v-model="trial[row.idx]" size="small" :placeholder="row.valueType === 'numeric' ? '如 10.01' : '如 合格'" />
              </template>
            </el-table-column>
            <el-table-column label="系统判定" width="120" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.mv" :type="row.judge === '合格' ? 'success' : row.judge === '不合格' ? 'danger' : 'info'" size="small" effect="light">
                  {{ row.judge || '不可匹配' }}
                </el-tag>
                <span v-else class="muted">待输入</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!trialRows.length" class="muted trial-empty">当前无可匹配的检验项，请先在上方为检验项配置判定规则。</div>
        </template>
        <el-empty v-else description="请选择左侧检验标准" :image-size="80" />
      </el-card>
    </div>

    <!-- 引用追溯抽屉 -->
    <el-drawer v-model="traceVisible" title="引用追溯 · 该标准的首件任务" size="44%" direction="rtl">
      <div v-loading="traceLoading">
        <div v-if="traceData && traceData.tasks.length" class="trace-list">
          <div v-for="t in traceData.tasks" :key="t.task.id" class="trace-card" @click="goTask(t.task.id)">
            <div class="tc-top">
              <span class="tc-code">{{ t.task.code }}</span>
              <el-tag size="small" effect="light" :type="statusTag(t.task.status)">{{ t.task.status }}</el-tag>
            </div>
            <div class="tc-sub">{{ t.task.productName || '—' }} · {{ t.task.procName || '—' }}</div>
            <div class="tc-stat">
              <span>综合判定 <b :class="judgeCls(t.task.overallJudge)">{{ t.task.overallJudge || '-' }}</b></span>
              <span>合格率 {{ Math.round((t.task.passRate ?? 0) * 100) }}%</span>
            </div>
            <div v-if="t.items && t.items.length" class="tc-items">
              <div v-for="it in t.items" :key="it.id" class="tc-item">
                <span class="ti-name">{{ it.itemName }}</span>
                <span class="ti-mv mono">{{ it.measuredValue || '-' }}</span>
                <span class="ti-judge" :class="judgeCls(it.judge)">{{ it.judge }}</span>
              </div>
            </div>
            <div class="tc-go">查看任务详情 →</div>
          </div>
        </div>
        <el-empty v-else description="暂无引用该标准的首件任务" :image-size="80" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { fiaStdApi } from '@/api/modules/fia/stds'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import StdItemEditor from '@/components/fia/StdItemEditor.vue'
import type { FiaInspStd, FiaStdItemRequest, StdTraceResult } from '@/api/types/fia'

const auth = useAuthStore()
const perm = usePermissionStore()
const canEditStd = computed(() => perm.has('fia.std.create'))
const route = useRoute()
const router = useRouter()
const stds = ref<FiaInspStd[]>([])
const kw = ref('')
const selectedId = ref('')
const page = ref(1)
const pageSize = usePageSize()
const listScroll = ref<HTMLElement | null>(null)
const current = ref<FiaInspStd | null>(null)
const items = ref<FiaStdItemRequest[]>([])
const trial = reactive<Record<number, string>>({})
const loading = ref(false)
const saving = ref(false)
const locateItemId = ref('')
const traceVisible = ref(false)
const traceLoading = ref(false)
const traceData = ref<StdTraceResult | null>(null)

const filteredStds = computed(() => {
  const k = kw.value.trim().toLowerCase()
  if (!k) return stds.value
  return stds.value.filter(s => (s.code + ' ' + (s.material || '')).toLowerCase().includes(k))
})

// 左列表分页（前端切片，与 StdList.vue 思路一致）
const pagedStds = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredStds.value.slice(start, start + pageSize.value)
})

function scrollTop() {
  listScroll.value?.scrollTo({ top: 0 })
}

// 搜索变化时回到第 1 页
watch(kw, () => { page.value = 1 })

// 仅可匹配项进入试算表
const trialRows = computed(() =>
  items.value
    .map((it, idx) => ({ ...it, idx }))
    .filter(r => isMatchable(r))
    .map(r => {
      const mv = (trial[r.idx] || '').trim()
      const j = mv ? mirrorJudge(r, mv) : { matchable: false, judge: null as string | null }
      return { ...r, mv, judge: j.judge }
    }),
)

async function select(id: string) {
  selectedId.value = id
  loading.value = true
  try {
    const vo = await fiaStdApi.get(id)
    current.value = vo.std
    items.value = (vo.items || []).map((it) => ({
      id: it.id,
      seq: it.seq,
      itemName: it.itemName,
      isCtq: it.isCtq,
      stdValue: it.stdValue,
      tolerance: it.tolerance,
      unit: it.unit,
      valueType: it.valueType,
      enumValues: it.enumValues,
      passValues: it.passValues,
      chartTypes: it.chartTypes ? String(it.chartTypes).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    }))
    // 清空试算输入
    Object.keys(trial).forEach(k => delete trial[Number(k)])
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!current.value) return
  saving.value = true
  try {
    // chartTypes 编辑态为数组, 提交后端归一为逗号分隔字符串
    const payloadItems = items.value.map((it) => ({
      ...it,
      chartTypes: Array.isArray(it.chartTypes) ? it.chartTypes.join(',') : (it.chartTypes || ''),
    }))
    await fiaStdApi.update(selectedId.value, { ...current.value, orgId: auth.user?.orgId ?? undefined, items: payloadItems })
    ElMessage.success('检验项明细已保存')
  } finally {
    saving.value = false
  }
}

function ruleText(it: FiaStdItemRequest): string {
  if (it.valueType === 'numeric') return `${it.stdValue ?? ''} ${it.tolerance ?? ''} ${it.unit ?? ''}`.trim()
  if (it.valueType === 'enum') return `枚举[${it.enumValues}] 合格[${it.passValues}]`
  return '—'
}

function isMatchable(it?: FiaStdItemRequest): boolean {
  if (!it) return false
  if (it.valueType === 'numeric') return !!(it.stdValue && it.stdValue.trim() && it.tolerance && it.tolerance.trim())
  if (it.valueType === 'enum') return !!(it.enumValues && it.enumValues.trim() && it.passValues && it.passValues.trim())
  return false
}

// 与后端 computeItemJudge 保持一致的判定逻辑（维护页试算用，非权威）
function mirrorJudge(it: FiaStdItemRequest, mvRaw: string): { matchable: boolean; judge: string | null } {
  const mv = mvRaw.trim()
  if (it.valueType === 'numeric' || it.valueType === '数值') {
    if (!/^[-+]?\d+(?:\.\d+)?$/.test(mv)) return { matchable: false, judge: null }
    const center = it.stdValue && /^[-+]?\d+(?:\.\d+)?$/.test(it.stdValue.trim()) ? parseFloat(it.stdValue.trim()) : 0
    const t = (it.tolerance || '').trim()
    let lower = 0, upper = 0
    let m = t.match(/±\s*(\d+(?:\.\d+)?)/)
    if (m) {
      const half = parseFloat(m[1]); lower = center - half; upper = center + half
    } else {
      m = t.match(/(\d+(?:\.\d+)?)\s*[~\-]\s*(\d+(?:\.\d+)?)/)
      if (m) { lower = parseFloat(m[1]); upper = parseFloat(m[2]) }
      else if (/^[-+]?\d+(?:\.\d+)?$/.test(t)) { const half = parseFloat(t); lower = center - half; upper = center + half }
      else return { matchable: false, judge: null }
    }
    const val = parseFloat(mv)
    return { matchable: true, judge: val >= lower && val <= upper ? '合格' : '不合格' }
  }
  if (it.valueType === 'enum' || it.valueType === '枚举') {
    const pass = (it.passValues || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!pass.length) return { matchable: false, judge: null }
    if (pass.includes(mv)) return { matchable: true, judge: '合格' }
    const enums = (it.enumValues || '').split(',').map(s => s.trim()).filter(Boolean)
    if (enums.includes(mv)) return { matchable: true, judge: '不合格' }
    return { matchable: false, judge: null }
  }
  return { matchable: false, judge: null }
}

async function openTrace() {
  if (!selectedId.value) return
  traceVisible.value = true
  traceLoading.value = true
  try {
    traceData.value = await fiaTaskApi.traceByStd({ stdId: selectedId.value })
  } catch { /* request 已弹错 */ }
  finally { traceLoading.value = false }
}

function goToSpcParams() {
  if (!current.value) return
  const procName = encodeURIComponent(current.value.procName || '')
  const material = encodeURIComponent(current.value.material || '')
  router.push(`/spc/params?procName=${procName}&material=${material}`)
}

function goTask(id: string) {
  router.push(`/fia/tasks/${id}`)
}

function statusTag(s?: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const m: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    '待检': 'info', '进行中': 'primary', '待复核': 'warning', '待批准': 'warning',
    '审批中': 'warning', '已完成': 'success', '已驳回': 'danger', '已作废': 'info', '超时': 'danger',
  }
  return m[s || ''] ?? 'info'
}

function judgeCls(j?: string): string {
  const m: Record<string, string> = { '合格': 'ok', '不合格': 'bad', '警告': 'warn', '-': 'muted' }
  return m[j || ''] ?? 'muted'
}

onMounted(async () => {
  stds.value = await fiaStdApi.list().catch(() => [])
  const q = route.query
  const targetStd = (q.stdId as string) || (stds.value[0]?.id)
  if (targetStd) {
    await select(targetStd)
    if (q.itemId) locateItemId.value = q.itemId as string
  }
})

// 任务详情"查看规则"跳回时,路由 query 变化要重新定位(已挂载不复用 onMounted)
watch(() => `${route.query.stdId}|${route.query.itemId}`, (key) => {
  const sid = route.query.stdId as string
  const iid = route.query.itemId as string
  if (sid && sid !== selectedId.value) select(sid)
  locateItemId.value = iid || ''
})
</script>

<style lang="scss" scoped>
.std-maintain { width: 100%; }
.head-b { margin-bottom: 20px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.head-b .sub { color: $ink-faint; font-size: 13px; margin-top: 6px; }
.layout { display: flex; gap: 16px; align-items: flex-start; }
.left-card { width: 320px; flex: none; border: 1px solid $hairline; border-radius: 12px; }
.right-card { flex: 1; min-width: 0; border: 1px solid $hairline; border-radius: 12px; }
.left-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.left-head .lt { font-family: $font-display; font-weight: 700; font-size: 15px; }
.left-head .kw { width: 150px; }
.std-list-scroll { max-height: 70vh; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; }
.std-pager { display: flex; justify-content: center; margin-top: 12px; }
.std-row { padding: 10px 12px; border: 1px solid $hairline; border-radius: 10px; cursor: pointer; transition: all 0.18s; background: $white; }
.std-row:hover { border-color: rgba($cobalt, 0.4); background: rgba($cobalt, 0.03); }
.std-row.active { border-color: $cobalt; background: rgba($cobalt, 0.06); box-shadow: 0 0 0 3px rgba($cobalt, 0.1); }
.sr-top { display: flex; align-items: center; justify-content: space-between; }
.sr-top .code { font-weight: 700; font-family: $font-mono; }
.sr-mat { font-size: 13px; color: $ink; margin-top: 4px; }
.sr-meta { font-size: 12px; color: $ink-faint; margin-top: 2px; }
.right-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.rh-code { font-family: $font-display; font-size: 18px; font-weight: 800; }
.rh-sub { color: $ink-faint; font-size: 12px; margin-top: 2px; }
.divider-tip { color: $ink-faint; font-size: 12px; font-weight: 400; margin-left: 8px; }
.trial-table { margin-top: 4px; }
.muted { color: $ink-faint; font-size: 12px; }
.trial-empty { margin-top: 12px; }
.rh-actions { display: flex; gap: 8px; }
.trace-list { display: flex; flex-direction: column; gap: 12px; }
.trace-card { border: 1px solid $hairline; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.18s; background: $white; }
.trace-card:hover { border-color: $cobalt; box-shadow: 0 4px 16px rgba($cobalt, 0.08); transform: translateY(-1px); }
.tc-top { display: flex; align-items: center; justify-content: space-between; }
.tc-code { font-family: $font-mono; font-weight: 700; }
.tc-sub { font-size: 12px; color: $ink-faint; margin-top: 4px; }
.tc-stat { display: flex; gap: 18px; margin-top: 8px; font-size: 13px; }
.tc-stat b.ok { color: $green; } .tc-stat b.bad { color: $signal-red; } .tc-stat b.warn { color: $amber; } .tc-stat b.muted { color: $ink-faint; }
.tc-items { margin-top: 8px; border-top: 1px dashed $hairline-soft; padding-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.tc-item { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.ti-name { flex: 1; color: $ink; }
.ti-mv { font-family: $font-mono; color: $ink-faint; }
.ti-judge.ok { color: $green; } .ti-judge.bad { color: $signal-red; } .ti-judge.warn { color: $amber; } .ti-judge.muted { color: $ink-faint; }
.tc-go { margin-top: 10px; text-align: right; font-size: 12px; color: $cobalt; font-weight: 600; }
</style>
