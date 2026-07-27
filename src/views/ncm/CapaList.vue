<template>
  <div class="capa-list">
    <div class="head-b"><div class="crumb">NCM / 不良管理</div><h1>CAPA</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态"><el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px"><el-option v-for="s in ['待启动','分析中','待审批','实施中','已验证','已关闭']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="capaNo" label="编号" width="170" />
        <el-table-column prop="issue" label="问题" min-width="200" />
        <el-table-column prop="triggerType" label="触发类型" width="100" />
        <el-table-column label="进度" width="80"><template #default="{row}"><span class="mono">{{ (row as QmsCapa).progress ?? 0 }}%</span></template></el-table-column>
        <el-table-column prop="owner" label="负责人" width="100" />
        <el-table-column prop="dueDate" label="期限" width="110" />
        <el-table-column label="状态" width="90"><template #default="{row}"><span class="pill" :class="capaStatusClass((row as QmsCapa).status)"><span class="d"></span>{{ (row as QmsCapa).status }}</span></template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="openQuick(row as QmsCapa)">详情</el-button>
            <el-button link type="primary" size="small" @click="router.push(`/ncm/capas/${(row as QmsCapa).id}`)">完整页</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 快速查看弹窗 -->
    <el-dialog v-model="dialogVisible" title="CAPA 快速查看" width="520px" append-to-body>
      <div v-if="cur" class="quick">
        <div class="q-head">
          <span class="mono no">{{ cur.capaNo }}</span>
          <span class="tag-b">{{ cur.triggerType || '-' }}</span>
          <span class="pill" :class="capaStatusClass(cur.status)"><span class="d"></span>{{ cur.status }}</span>
        </div>
        <div class="q-grid">
          <div class="q-f"><div class="l">问题描述</div><div class="v">{{ cur.issue || '-' }}</div></div>
          <div class="q-f"><div class="l">触发阶段</div><div class="v">{{ cur.triggerStage || '-' }}</div></div>
          <div class="q-f"><div class="l">负责人</div><div class="v">{{ cur.owner || '-' }}</div></div>
          <div class="q-f"><div class="l">期限</div><div class="v mono">{{ cur.dueDate || '-' }}</div></div>
        </div>
        <div class="q-prog"><span class="l">进度</span><el-progress :percentage="cur.progress ?? 0" :stroke-width="8" /></div>
      </div>
      <template #footer>
        <el-button :disabled="!sourceTarget" type="primary" @click="goSource">查看触发来源</el-button>
        <el-button @click="goDetail">前往完整详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ncmCapaApi } from '@/api/modules/ncm/capas'
import type { QmsCapa } from '@/api/types/ncm'

const router = useRouter()
const list = ref<QmsCapa[]>([])
const loading = ref(false)
const filterStatus = ref('')
const dialogVisible = ref(false)
const cur = ref<QmsCapa | null>(null)

async function fetch() { loading.value = true; try { const all = await ncmCapaApi.list(); list.value = all.filter(r => !filterStatus.value || r.status === filterStatus.value) } finally { loading.value = false } }

function openQuick(row: QmsCapa) { cur.value = row; dialogVisible.value = true }

/** 根据触发类型/来源字段计算跳转目标;无来源则返回 null(按钮禁用)。 */
const sourceTarget = computed<null | { to: string; label: string }>(() => resolveSource(cur.value))

function goSource() {
  const t = resolveSource(cur.value)
  if (t) router.push(t.to)
}
function goDetail() { if (cur.value) router.push(`/ncm/capas/${cur.value.id}`) }

function resolveSource(row?: QmsCapa | null): { to: string; label: string } | null {
  if (!row) return null
  if (row.d8Id) return { to: `/ncm/8d-reports/${row.d8Id}`, label: '8D 报告' }
  if (row.abnormalId) return { to: '/sqm/abnormals', label: '来料异常' }
  if (row.sourceType === '审核不符合项') return { to: '/sqm/audits', label: '内审不符合项' }
  if (row.sourceType === '不良记录') return { to: '/ncm/defect-records', label: '不良记录' }
  return null
}

function capaStatusClass(s: string) { return { '待启动':'p-wait','分析中':'p-run','待审批':'p-sign','实施中':'p-run','已验证':'p-done','已关闭':'p-done' }[s] || '' }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.capa-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-sign { background: $purple-dim; color: $purple; } .p-sign .d { background: $purple; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.mono { font-family: $font-mono; }
.tag-b { display: inline-block; padding: 3px 9px; font-size: 11px; border-radius: 4px; background: $paper; color: $ink-soft; border: 1px solid $hairline; }
.quick { .q-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; } .q-head .no { font-family: $font-mono; font-size: 16px; font-weight: 700; color: $cobalt; } }
.q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
.q-f .l { font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase; }
.q-f .v { font-size: 13px; }
.q-prog { margin-top: 18px; display: flex; align-items: center; gap: 12px; .l { font-size: 11px; color: $ink-faint; letter-spacing: 1px; text-transform: uppercase; } ::v-deep(.el-progress) { flex: 1; } }
</style>
