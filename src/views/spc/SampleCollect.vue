<template>
  <div class="sample-collect">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>抽样采集</h1>
      </div>
      <el-button class="back-btn" @click="goBack">
        <span class="mono">←</span> 返回任务列表
      </el-button>
    </div>

    <div v-if="loading" class="loading-block">任务加载中…</div>

    <template v-else-if="task && param">
      <!-- 任务信息卡 -->
      <el-card shadow="never" class="card-b">
        <div class="task-head">
          <div class="task-id">
            <span class="mono">任务 {{ task.id.slice(0, 8).toUpperCase() }}</span>
            <span class="pill" :class="statusPill(task.status)"><span class="d"></span>{{ task.status }}</span>
          </div>
          <div class="task-meta">
            <span class="mono">工单 {{ task.woNo }}</span>
            <span class="mono">料号 {{ task.partNo }}</span>
            <span v-if="task.procName">工序 {{ task.procName }}</span>
          </div>
        </div>

        <!-- 进度 -->
        <div class="progress-row">
          <span class="lbl">采集进度</span>
          <span class="mono prog" :class="task.targetCount > 0 && task.currentCount >= task.targetCount ? 'c-green' : ''">
            {{ task.currentCount }} / {{ task.targetCount > 0 ? task.targetCount : '不限' }}
          </span>
          <span v-if="task.status === '已结案'" class="mono done-tip">已结案</span>
        </div>

        <!-- 参数规格只读 -->
        <div class="param-meta">
          <span class="mono">参数 {{ param.paramName }}</span>
          <span class="mono">子组大小 n = {{ param.subgroupSize }}</span>
          <span class="mono" v-if="param.specLower != null || param.specUpper != null">
            规格 [{{ param.specLower ?? '—' }}, {{ param.specUpper ?? '—' }}] {{ param.unit || '' }}
          </span>
          <span class="mono" v-if="param.targetValue != null">目标 {{ param.targetValue }}</span>
          <span class="mono" v-if="task.cpk != null">CPK {{ task.cpk.toFixed(2) }}</span>
          <span v-if="task.alarmFlag" class="mono c-red">⚠ CPK 软告警</span>
        </div>
      </el-card>

      <!-- 录入块 -->
      <el-card shadow="never" class="card-b" v-if="task.status === '采集中'">
        <div class="block-title">录入子组（第 {{ task.currentCount + 1 }} 批）</div>
        <el-form label-width="100px" style="max-width: 760px">
          <el-form-item label="批次号" required>
            <el-input v-model="batchNo" placeholder="同工单可录不同批次号" style="width: 280px" />
          </el-form-item>
          <el-form-item label="测量值" required>
            <div class="vals">
              <div class="val-cell" v-for="(v, i) in values" :key="i">
                <span class="idx mono">{{ i + 1 }}</span>
                <el-input-number v-model="values[i]" :precision="3" :controls="false" :step="0.001" style="width: 120px" />
                <span class="u">{{ param.unit || '' }}</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submit">提交子组</el-button>
            <el-button @click="clearBatch">清空批次号</el-button>
            <span class="hint">共 {{ values.length }} 个测量值，提交后批次号保留以便续录下一批</span>
          </el-form-item>
        </el-form>
      </el-card>
      <el-card shadow="never" class="card-b" v-else>
        <div class="done-block">
          <span class="dot"></span>
          该抽样任务已结案（共录入 {{ task.currentCount }} 批）。
          <span v-if="task.cpk != null">CPK = {{ task.cpk.toFixed(2) }}，</span>
          <span :class="task.released ? 'c-green' : 'c-red'">{{ task.released ? '达标' : '跌破门槛(软告警)' }}</span>。
        </div>
      </el-card>
    </template>

    <div v-else class="loading-block">任务不存在或已删除。</div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcSubgroupApi } from '@/api/modules/spc/subgroups'
import { spcSampleTaskApi } from '@/api/modules/spc/sampleTasks'
import type { SpcParam, SpcSampleTask } from '@/api/types/spc'

const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId as string

const task = ref<SpcSampleTask | null>(null)
const param = ref<SpcParam | null>(null)
const loading = ref(true)
const batchNo = ref('')
const values = ref<(number | null)[]>([])
const submitting = ref(false)

async function loadTask() {
  loading.value = true
  try {
    const t = await spcSampleTaskApi.get(taskId)
    task.value = t
    param.value = await spcParamApi.get(t.paramId).catch(() => null)
    const n = param.value?.subgroupSize || 5
    values.value = Array.from({ length: n }, () => null)
  } catch {
    task.value = null
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!batchNo.value.trim()) { ElMessage.warning('请录入批次号'); return }
  if (values.value.some(v => v == null || isNaN(v))) { ElMessage.warning('请完整录入所有测量值'); return }
  if (!task.value || !param.value) return
  submitting.value = true
  try {
    await spcSubgroupApi.create({
      paramId: task.value.paramId,
      subgroupTime: new Date().toISOString().slice(0, 19),
      woNo: task.value.woNo,
      batchNo: batchNo.value.trim(),
      stage: 'ROUTINE',
      sampleTaskId: task.value.id,
      productCode: task.value.partNo,
      values: values.value as number[],
    })
    ElMessage.success('子组已提交')
    // 续录下一批：清空测量值、保留批次号
    const n = param.value.subgroupSize || 5
    values.value = Array.from({ length: n }, () => null)
    await loadTask()
  } finally { submitting.value = false }
}

function clearBatch() { batchNo.value = '' }

function goBack() {
  router.push({ path: '/spc/params' })
}

function statusPill(s?: string) {
  if (s === '已结案') return 'p-done'
  if (s === '采集中') return 'p-run'
  return 'p-wait'
}

onMounted(loadTask)
</script>

<style lang="scss" scoped>
.head-b { margin-bottom: 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.back-btn { font-family: $font-mono; }
.loading-block { padding: 60px; text-align: center; color: $ink-faint; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; margin-bottom: 16px; }
.task-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.task-id { display: flex; align-items: center; gap: 10px; }
.task-id .mono { font-family: $font-mono; font-size: 14px; color: $ink; font-weight: 600; }
.task-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: $ink-soft; }
.task-meta .mono { font-family: $font-mono; }
.progress-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: $paper; border-radius: 8px; margin-bottom: 14px; }
.progress-row .lbl { font-size: 12px; color: $ink-faint; }
.progress-row .prog { font-family: $font-mono; font-size: 18px; font-weight: 700; color: $ink; }
.progress-row .done-tip { font-family: $font-mono; font-size: 12px; color: $green; }
.param-meta { display: flex; flex-wrap: wrap; gap: 16px; padding: 10px 14px; background: $paper; border-radius: 8px; font-size: 12px; color: $ink-soft; }
.param-meta .mono { font-family: $font-mono; }
.block-title { font-family: $font-display; font-size: 15px; font-weight: 700; margin-bottom: 14px; color: $ink; }
.vals { display: flex; flex-wrap: wrap; gap: 12px; }
.val-cell { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid $hairline; border-radius: 8px; background: $white; }
.val-cell .idx { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; background: $cobalt-dim; color: $cobalt; border-radius: 50%; font-size: 10px; font-weight: 700; }
.val-cell .u { font-size: 11px; color: $ink-faint; }
.hint { font-size: 12px; color: $ink-faint; margin-left: 8px; }
.c-green { color: $green; }
.c-red { color: $signal-red; }
.done-block { display: flex; align-items: center; gap: 8px; font-size: 13px; color: $ink-soft; }
.done-block .dot { width: 8px; height: 8px; border-radius: 50%; background: $green; flex-shrink: 0; }
</style>
