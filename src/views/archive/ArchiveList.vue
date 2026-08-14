<template>
  <div class="archive-list">
    <div class="head-b"><AppBreadcrumb /><h1>归档查询</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="类型"><el-select v-model="filterType" clearable placeholder="全部" style="width:120px"><el-option value="fia" label="FIA首件" /><el-option value="audit" label="SQM审核" /><el-option value="8d" label="8D整改" /><el-option value="patrol" label="巡检" /></el-select></el-form-item>
        <el-form-item label="关键词"><el-input v-model="filterKeyword" clearable placeholder="报告号/工单号" style="width:200px" /></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="archiveType" label="类型" width="80"><template #default="{row}"><el-tag size="small">{{ (row as any).archiveType==='fia'?'FIA':(row as any).archiveType==='audit'?'SQM':(row as any).archiveType==='8d'?'8D':'巡检' }}</el-tag></template></el-table-column>
        <el-table-column prop="archiveNo" label="归档号" width="180" />
        <el-table-column prop="refNo" label="关联单号" width="160" />
        <el-table-column prop="archiveDate" label="归档日期" width="160" />
        <el-table-column label="留存到期" width="160"><template #default="{row}"><span :style="{color:(row as any).daysRemaining<30?'var(--el-color-danger)':''}" class="mono">{{ (row as any).retentionUntil?.slice(0,10) || '-' }} ({{ (row as any).daysRemaining ?? '-' }}天)</span></template></el-table-column>
        <el-table-column prop="reportHash" label="哈希" width="140"><template #default="{row}"><span class="mono" style="font-size:11px">{{ (row as any).reportHash?.slice(0,16) || '-' }}...</span></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="openDetail(row)">查看详情</el-button>
            <el-button link type="primary" size="small" :loading="dlId===(row as any).refId" @click="downloadPdf(row)">下载报告</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="drawer" :title="drawerTitle" size="600px" destroy-on-close>
      <template v-if="detail">
        <!-- 档案信息 -->
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="类型">{{ detail.archiveType==='fia'?'FIA 首件':detail.archiveType==='audit'?'SQM 审核':detail.archiveType==='8d'?'8D 整改':'巡检' }}</el-descriptions-item>
          <el-descriptions-item label="归档号">{{ detail.archiveNo }}</el-descriptions-item>
          <el-descriptions-item label="关联单号">{{ detail.refNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归档日期">{{ detail.archiveDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="detail.status === '已归档'" type="success" size="small">已归档</el-tag>
            <el-tag v-else-if="detail.status === '已作废'" type="danger" size="small">已作废</el-tag>
            <span v-else>{{ detail.status || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="留存到期">{{ detail.retentionUntil || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报告哈希"><span class="mono" style="font-size:11px">{{ detail.reportHash || '-' }}</span></el-descriptions-item>
        </el-descriptions>

        <!-- 8D 概要 -->
        <template v-if="detail.archiveType==='8d'">
          <div class="sec-title">8D 报告概要</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="8D 单号">{{ detail.refNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="问题概述">{{ detail.issue || '-' }}</el-descriptions-item>
            <el-descriptions-item label="严重度">{{ detail.severity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="来源">
              <el-link v-if="sourceTarget" type="primary" :underline="false" @click="jumpSource">{{ detail.source }}</el-link>
              <span v-else>{{ detail.source || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="来源单号">
              <el-link v-if="sourceTarget" type="primary" :underline="false" @click="jumpSource">{{ detail.sourceRefId }}</el-link>
              <span v-else>{{ detail.sourceRefId || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="流程类型">{{ detail.flowType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="团队">{{ detail.team || '-' }}</el-descriptions-item>
            <el-descriptions-item label="报告状态">{{ detail.reportStatus || '-' }}</el-descriptions-item>
            <el-descriptions-item label="闭环日期">{{ detail.closeDate || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div class="dl-row" style="margin-top:12px">
            <button class="el-button el-button--primary" @click="go8dDetail('D4')"><span>查看阶段详情（鱼骨图 / 5Why）</span></button>
          </div>
        </template>
        <!-- 巡检概要 -->
        <template v-else-if="detail.archiveType==='patrol'">
          <div class="sec-title">巡检任务概要</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="任务编号">{{ detail.refNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="巡检路线">{{ detail.routeName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="班次">{{ detail.shift || '-' }}</el-descriptions-item>
            <el-descriptions-item label="巡检员">{{ detail.inspectorId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="计划时间">{{ detail.planTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ detail.finishTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="应检/已检点位">{{ detail.totalPoints ?? '-' }} / {{ detail.donePoints ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="异常点数">{{ detail.abnormalCount ?? '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <!-- 任务概要(FIA) -->
        <template v-else-if="detail.archiveType==='fia'">
          <div class="sec-title">任务概要</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="检验单号">{{ detail.taskCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="工单">{{ detail.refNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物料/产品">{{ detail.productName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ supplierMap[detail.supplierId] || detail.supplierId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="工序">{{ detail.procName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="综合判定">{{ detail.overallJudge || '-' }}</el-descriptions-item>
            <el-descriptions-item label="处置">{{ detail.disposition || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <template v-else>
          <div class="sec-title">审核概要</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="审核类型">{{ detail.auditType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核员">{{ detail.auditor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结论">{{ detail.conclusion || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 流程轨迹 -->
        <div class="sec-title">流程轨迹</div>
        <el-timeline v-if="detail.log && (detail.log as any[]).length">
          <el-timeline-item v-for="(l, i) in (detail.log as any[])" :key="i" :timestamp="l.time" placement="top">
            <div class="tl-node clickable" :title="nodeHint(l.node)" @click="goNode(l)">
              {{ l.node }}
              <span class="goto">›</span>
            </div>
            <div class="tl-op">操作人：{{ l.operator || '-' }}</div>
          </el-timeline-item>
        </el-timeline>
        <div v-else class="empty">暂无轨迹记录</div>

        <!-- 检验项明细(FIA) -->
        <template v-if="detail.archiveType==='fia'">
          <div class="sec-title">检验项明细</div>
          <el-table v-if="detail.items && (detail.items as any[]).length" :data="detail.items as any[]" size="small" border>
            <el-table-column type="index" label="#" width="40" />
            <el-table-column label="CTQ" width="60"><template #default="{row}"><el-tag v-if="row.isCtq" size="small" type="danger">CTQ</el-tag><span v-else>-</span></template></el-table-column>
            <el-table-column prop="itemName" label="检验项" min-width="120" />
            <el-table-column prop="stdValue" label="标准值" width="90" />
            <el-table-column prop="tolerance" label="公差" width="80" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="measuredValue" label="测量值" width="90" />
            <el-table-column label="判定" width="80"><template #default="{row}"><span class="pill" :class="judgeCls(row.judge)">{{ judgeText(row.judge) }}</span></template></el-table-column>
          </el-table>
          <div v-else class="empty">暂无检验项</div>
        </template>

        <div class="dl-row">
          <el-button type="primary" :loading="dlId===detail.refId" @click="downloadPdf(detail)">下载归档报告 PDF</el-button>
          <span v-if="!detail.hasPdf" class="warn">报告文件未生成</span>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { getSourceTarget } from '@/utils/sourceTrace'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { useRouter } from 'vue-router'
import { request } from '@/api/client'
import { ElMessage } from 'element-plus'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'

const list = ref<any[]>([])
const loading = ref(false)
const filterType = ref(''), filterKeyword = ref('')
const drawer = ref(false)
const detail = ref<any>(null)
const dlId = ref('')
const suppliers = ref<any[]>([])

const supplierMap = computed(() => {
  const m: Record<string, string> = {}
  for (const s of suppliers.value) m[s.id] = s.name
  return m
})
const drawerTitle = computed(() => detail.value
  ? (detail.value.archiveType === 'fia' ? '来料检验归档 · 全流程'
     : detail.value.archiveType === 'audit' ? '审核归档 · 详情'
     : detail.value.archiveType === '8d' ? '8D 整改归档 · 详情'
     : '巡检归档 · 详情')
  : '归档详情')

// 8D 来源单号 → 追溯跳转目标
const sourceTarget = computed(() => getSourceTarget(detail.value?.source, detail.value?.sourceRefId))

async function fetch() {
  loading.value = true
  try {
    const all = await request.get<any[]>('/v1/archives', { params: { type: filterType.value || undefined, keyword: filterKeyword.value || undefined } }).catch(() => [])
    list.value = (all || []).filter(r => !filterType.value || r.archiveType === filterType.value)
  } finally { loading.value = false }
}

async function openDetail(row: any) {
  const data = await request.get('/v1/archives/detail', { params: { type: row.archiveType, refId: row.refId } }).catch(() => null)
  if (!data) { ElMessage.warning('未找到该档案详情'); return }
  detail.value = data
  drawer.value = true
}

async function downloadPdf(row: any) {
  if (row.hasPdf === false) { ElMessage.warning('报告文件未生成'); return }
  dlId.value = row.refId
  try {
    const blob = await request.get('/v1/archives/pdf', {
      params: { type: row.archiveType, refId: row.refId },
      responseType: 'blob'
    }).catch(() => null)
    if (!blob || (blob.type && blob.type !== 'application/pdf')) {
      ElMessage.warning('报告文件未生成或不存在')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (row.archiveNo || 'archive') + '.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } finally { dlId.value = '' }
}

function judgeText(j?: string): string {
  return j === '合格' || j === '不合格' || j === '警告' ? j : '未判定'
}
function judgeCls(j: string): string {
  if (j === '合格' || j === 'OK' || j === 'PASS') return 'p-done'
  if (j === '不合格' || j === 'NG' || j === 'FAIL' || j === 'NOGO') return 'p-lock'
  if (j === '警告' || j === 'WARN') return 'p-wait'
  return ''
}

const router = useRouter()

// 流程轨迹节点点击跳转
function goNode(l: any) {
  const at = detail.value?.archiveType
  const node = l?.node || ''
  if (/(归档|报告)/.test(node)) { ElMessage.info('当前已在归档详情页'); return }
  const id = detail.value?.refId
  if (!id) return
  if (at === 'audit') {
    // 审核类:统一跳审核记录详情(含会签/现场审核/结论)
    drawer.value = false
    router.push(`/sqm/audits/record/${id}`)
    return
  }
  if (at === 'fia') {
    const path = /(审批|批准)/.test(node) ? '/fia/approvals' : `/fia/incoming/${id}`
    drawer.value = false
    router.push(path)
  }
  if (at === '8d') {
    const m = node.match(/^(D\d) 阶段/)
    go8dDetail(m ? m[1] : 'D4')
  }
}

// 跳转到触发本 8D 的源头事件(来料异常 / SPC 告警等)
function jumpSource() {
  if (!sourceTarget.value) return
  drawer.value = false
  router.push({ path: sourceTarget.value.path, query: sourceTarget.value.query })
}

function go8dDetail(stage?: string) {
  const id = detail.value?.refId
  if (!id) { ElMessage.warning('缺少报告ID,无法跳转'); return }
  drawer.value = false
  // from=archive:标记从归档入口进入,目标页据此隐藏"重开"等可写操作(归档快照应为只读)
  router.push({ path: `/ncm/8d-reports/${id}`, query: { ...(stage ? { stage } : {}), from: 'archive' } })
}

function nodeHint(node: string): string {
  if (/(归档|报告)/.test(node || '')) return '当前页面(归档详情)'
  if (/阶段/.test(node || '')) return '跳转到 8D 阶段详情(含鱼骨图/5Why)'
  if (/(会签|审核)/.test(node || '')) return '跳转到审核记录详情'
  if (/(审批|批准)/.test(node || '')) return '跳转到审批单页面'
  return '跳转到来料检验详情'
}

onMounted(() => {
  fetch()
  sqmSupplierApi.list().then(r => { suppliers.value = (r?.records || r?.list || r || []) }).catch(() => {})
})
</script>

<style lang="scss" scoped>
.archive-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.mono { font-family: $font-mono; }
.sec-title { font-weight: 700; font-size: 13px; margin: 18px 0 8px; padding-left: 8px; border-left: 3px solid var(--el-color-primary); }
.tl-node { font-weight: 600; }
.tl-node.clickable { cursor: pointer; color: var(--el-color-primary); display: inline-flex; align-items: center; gap: 4px; }
.tl-node.clickable:hover { text-decoration: underline; }
.tl-node .goto { font-size: 14px; line-height: 1; }
.tl-op { font-size: 12px; color: #888; }
.empty { color: #999; font-size: 12px; padding: 8px 0; }
.dl-row { margin-top: 18px; }
.warn { color: var(--el-color-warning); margin-left: 8px; font-size: 12px; }
.pill { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 12px; }
.p-done { background: #e8f5e9; color: #2e7d32; }
.p-lock { background: #fdecea; color: #c62828; }
.p-wait { background: #fff8e1; color: #f9a825; }
</style>
