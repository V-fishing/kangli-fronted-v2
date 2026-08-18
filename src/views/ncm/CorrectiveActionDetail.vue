<template>
  <div class="ca-detail" v-loading="loading">
    <!-- 头部面包屑+标题 -->
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>{{ ca?.caNo || '纠正措施详情' }}</h1>
      </div>
      <div class="head-actions">
        <el-button @click="$router.back()">返回</el-button>
        <el-button v-if="ca?.status !== '已关闭' && canClose" type="danger" @click="doClose">关闭措施</el-button>
      </div>
    </div>

    <!-- 基本信息卡片 -->
    <el-card shadow="never" class="card-b" style="margin-bottom:16px" v-if="ca">
      <template #header><span class="card-title">基本信息</span></template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="措施编号">
          <span class="mono">{{ ca.caNo }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <span class="pill" :class="statusClass(ca.status)">
            <span class="d"></span>{{ ca.status }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="关联不良">
          <router-link v-if="ca.defectNo" :to="`/ncm/defect-records/${linkedDefectId}`" class="mono link">
            {{ ca.defectNo }}
          </router-link>
          <span v-else class="mono" style="color: #999">—</span>
        </el-descriptions-item>
        <el-descriptions-item label="责任人">{{ ca.owner || '—' }}</el-descriptions-item>
        <el-descriptions-item label="期限">{{ ca.dueDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="进度">
          <div style="display:flex;align-items:center;gap:8px">
            <el-progress :percentage="ca.progress ?? 0" :stroke-width="12" style="flex:1" />
            <span class="mono">{{ ca.progress ?? 0 }}%</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">
          <div style="white-space:pre-wrap">{{ ca.issue || '—' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 进度更新卡片 -->
    <el-card shadow="never" class="card-b" v-if="ca && ca.status !== '已关闭'">
      <template #header><span class="card-title">更新进度</span></template>
      <div style="display:flex;align-items:center;gap:16px">
        <el-slider v-model="progressVal" :min="0" :max="100" :step="5" show-input style="flex:1" />
        <el-button type="primary" :loading="submitting" v-if="canUpdateProgress" @click="submitProgress">保存进度</el-button>
      </div>
      <div class="hint" style="margin-top:8px">进度达到 100% 后自动置为「已完成」</div>
    </el-card>

    <el-empty v-if="!loading && !ca" description="未找到该纠正措施" />
  </div>
</template>

<script setup lang="ts">
// __TSC_NOCHECK_DISABLED__ // @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import { ncmCorrectiveActionApi } from '@/api/modules/ncm/corrective-actions'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import type { NcmCorrectiveAction } from '@/api/types/ncm'

const route = useRoute()
const perm = usePermissionStore()
const canUpdateProgress = computed(() => perm.has('ncm.ca.create'))
const canClose = computed(() => perm.has('ncm.ca.close'))
const loading = ref(false)
const submitting = ref(false)
const ca = ref<NcmCorrectiveAction | null>(null)
const progressVal = ref(0)
const linkedDefectId = ref('')

async function loadDefectId(defectNo: string) {
  try {
    const def = await ncmDefectRecordApi.getByDefectNo(defectNo)
    linkedDefectId.value = def?.id || ''
  } catch { linkedDefectId.value = '' }
}

function statusClass(s: string) {
  return { '待启动': 'p-wait', '进行中': 'p-progress', '已完成': 'p-done', '已关闭': 'p-done' }[s] || 'p-wait'
}

async function load() {
  loading.value = true
  try {
    ca.value = await ncmCorrectiveActionApi.get(route.params.id as string)
    progressVal.value = ca.value.progress ?? 0
    if (ca.value.defectNo) {
      loadDefectId(ca.value.defectNo)
    }
  } catch {
    ElMessage.error('加载纠正措施失败')
  } finally {
    loading.value = false
  }
}

async function submitProgress() {
  if (!ca.value?.id) return
  submitting.value = true
  try {
    await ncmCorrectiveActionApi.updateProgress(ca.value.id, progressVal.value)
    ElMessage.success('进度已更新')
    ca.value = await ncmCorrectiveActionApi.get(ca.value.id)
    progressVal.value = ca.value.progress ?? 0
  } catch {
    ElMessage.error('更新失败')
  } finally {
    submitting.value = false
  }
}

async function doClose() {
  if (!ca.value?.id) return
  try {
    await ElMessageBox.confirm(`确认关闭纠正措施 ${ca.value.caNo}？关闭后不可再更新进度。`, '关闭确认', {
      type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '取消',
    })
  } catch { return }
  try {
    await ncmCorrectiveActionApi.close(ca.value.id)
    ElMessage.success('已关闭，关联不良记录已回写为"已纠正"')
    ca.value = await ncmCorrectiveActionApi.get(ca.value.id)
  } catch {
    ElMessage.error('关闭失败')
  }
}

onMounted(() => load())
</script>

<style lang="scss" scoped>
.ca-detail { width: 100%; max-width: 900px; }
.head-b { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b .crumb a { color: $cobalt; text-decoration: none; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.head-actions { display: flex; gap: 10px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.card-title { font-size: 15px; font-weight: 700; color: $ink; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-progress { background: #dbeafe; color: #2563eb; } .p-progress .d { background: #2563eb; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.mono { font-family: $font-mono; }
.link { color: $cobalt; text-decoration: none; font-weight: 600; }
.link:hover { text-decoration: underline; }
.hint { font-size: 12px; color: $ink-faint; }
</style>
