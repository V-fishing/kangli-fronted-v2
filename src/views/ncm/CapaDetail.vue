<template>
  <div class="capa-detail">
    <div class="head-b"><div class="crumb">NCM / 不良管理</div><h1>CAPA 详情 <span class="mono no">{{ vo?.capa?.capaNo }}</span></h1></div>
    <div v-if="vo" class="detail-body">
      <!-- 头 -->
      <div class="task-card">
        <div class="field"><div class="l">触发类型</div><div class="v"><span class="tag-b">{{ vo.capa.triggerType || '-' }}</span></div></div>
        <div class="field"><div class="l">负责人</div><div class="v">{{ vo.capa.owner || '-' }}</div></div>
        <div class="field"><div class="l">期限</div><div class="v mono">{{ vo.capa.dueDate || '-' }}</div></div>
        <div class="field"><div class="l">状态</div><div class="v"><span class="pill" :class="capaStatusClass(vo.capa.status)"><span class="d"></span>{{ vo.capa.status }}</span></div></div>
      </div>

      <!-- 触发来源 -->
      <div class="card-b" style="margin-bottom:18px">
        <div class="card-head"><h2>触发来源</h2></div>
        <div style="padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="flex:1">
            <div class="info-row"><span class="l">来源类型</span><span><span class="tag-b">{{ sourceLabel || '无关联单据' }}</span></span></div>
            <div class="info-row"><span class="l">关联编号</span><span class="mono">{{ vo?.capa?.sourceRefId || '-' }}</span></div>
          </div>
          <el-button type="primary" :disabled="!sourceTarget" @click="goSource">查看触发来源</el-button>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="card-b" style="margin-bottom:18px;padding:18px 22px">
        <div class="card-head" style="border:none;padding:0 0 12px"><h2>进度</h2><span class="sub mono">{{ vo.capa.progress ?? 0 }}%</span></div>
        <el-progress :percentage="vo.capa.progress ?? 0" :status="vo.capa.progress===100?'success':''" :stroke-width="8" />
        <div v-if="vo.capa.status !== '已关闭'" style="margin-top:14px;display:flex;gap:10px;align-items:center">
          <el-input-number v-model="progress" :min="0" :max="100" size="small" style="width:120px" />
          <el-button type="primary" size="small" @click="updateProgress">更新进度</el-button>
          <el-button v-if="vo.capa.progress===100 && vo.capa.status==='已验证'" type="success" size="small" @click="doClose">关闭 CAPA</el-button>
          <el-button v-if="vo.capa.status==='待审批'" type="primary" size="small" @click="openApprove">审批</el-button>
          <el-button type="warning" size="small" @click="doReset">效果验证无效 — 重置</el-button>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="card-b">
        <div class="card-head"><h2>基本信息</h2></div>
        <div style="padding:14px 22px;font-size:13px">
          <div class="info-row"><span class="l">问题描述</span><span>{{ vo.capa.issue || '-' }}</span></div>
          <div class="info-row"><span class="l">纠正措施类型</span><span>{{ vo.capa.capaType || '-' }}</span></div>
          <div class="info-row"><span class="l">触发阶段</span><span>{{ vo.capa.triggerStage || '-' }}</span></div>
          <div class="info-row"><span class="l">触发条件</span><span>{{ vo.capa.triggerCondition || '-' }}</span></div>
          <div class="info-row"><span class="l">创建时间</span><span class="mono">{{ vo.capa.createdAt?.slice(0,10) || '-' }}</span></div>
        </div>
      </div>
    </div>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" title="审批 CAPA" width="400px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="决议" required><el-select v-model="approveForm.approved" style="width:100%"><el-option label="通过" :value="true" /><el-option label="驳回" :value="false" /></el-select></el-form-item>
        <el-form-item label="意见" required><el-input v-model="approveForm.comment" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="approveVisible=false">取消</el-button><el-button type="primary" @click="submitApprove">提交</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ncmCapaApi } from '@/api/modules/ncm/capas'
import type { CapaVo } from '@/api/types/ncm'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const vo = ref<CapaVo | null>(null)
const progress = ref(0)
const approveVisible = ref(false)
const approveForm = ref({ approved: true, comment: '' })

const sourceTarget = computed<null | { to: string; label: string }>(() => resolveSource(vo.value?.capa))
const sourceLabel = computed(() => sourceTarget.value?.label || '')
function goSource() { const t = resolveSource(vo.value?.capa); if (t) router.push(t.to) }
function resolveSource(c?: any): { to: string; label: string } | null {
  if (!c) return null
  if (c.d8Id) return { to: `/ncm/8d-reports/${c.d8Id}`, label: '8D 报告' }
  if (c.abnormalId) return { to: '/sqm/abnormals', label: '来料异常' }
  if (c.sourceType === '审核不符合项') return { to: '/sqm/audits', label: '内审不符合项' }
  if (c.sourceType === '不良记录') return { to: '/ncm/defect-records', label: '不良记录' }
  return null
}

async function load() { vo.value = await ncmCapaApi.get(id); progress.value = vo.value?.capa?.progress ?? 0 }
async function updateProgress() { await ncmCapaApi.updateProgress(id, progress.value); ElMessage.success('进度已更新'); load() }
async function doClose() { await ncmCapaApi.close(id); ElMessage.success('已关闭'); load() }
async function doReset() { await ncmCapaApi.reset(id); ElMessage.success('已重置'); load() }
function openApprove() { approveForm.value = { approved: true, comment: '' }; approveVisible.value = true }
async function submitApprove() { await ncmCapaApi.approve(id, approveForm.value); ElMessage.success('审批完成'); approveVisible.value = false; load() }
function capaStatusClass(s: string) { return { '待启动':'p-wait','分析中':'p-run','待审批':'p-sign','实施中':'p-run','已验证':'p-done','已关闭':'p-done' }[s] || '' }
onMounted(() => load())
</script>

<style lang="scss" scoped>
.capa-detail { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 26px; font-weight: 800; }
.head-b .no { font-family: $font-mono; font-size: 16px; font-weight: 500; color: $cobalt; margin-left: 12px; }
.task-card { background: $white; border: 1px solid $hairline; border-radius: 12px; box-shadow: $shadow-sm; padding: 24px 28px; margin-bottom: 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 32px; }
.task-card .field .l { font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
.task-card .field .v { font-size: 14px; font-weight: 500; }
.mono { font-family: $font-mono; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-sign { background: $purple-dim; color: $purple; } .p-sign .d { background: $purple; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.tag-b { display: inline-block; padding: 3px 9px; font-size: 11px; border-radius: 4px; background: $paper; color: $ink-soft; border: 1px solid $hairline; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; box-shadow: $shadow-sm; overflow: hidden; }
.card-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid $hairline; }
.card-head h2 { font-size: 14px; font-weight: 600; }
.card-head .sub { font-family: $font-mono; font-size: 11px; color: $ink-faint; }
.info-row { display: flex; justify-content: space-between; padding: 6px 0; }
.info-row .l { color: $ink-faint; }
</style>