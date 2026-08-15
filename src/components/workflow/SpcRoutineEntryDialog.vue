<template>
  <el-dialog
    :model-value="modelValue"
    :title="''"
    width="620px"
    :close-on-click-modal="false"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    append-to-body
  >
    <template #header>
      <div class="dlg-head">
        <div>
          <div class="crumb mono">SPC / 量产过程监控</div>
          <h3>量产抽样 SPC 录入</h3>
        </div>
        <span class="stage-badge routine">ROUTINE · 量产监控</span>
      </div>
    </template>

    <div class="ctx-block" v-if="ctx">
      <div class="ctx-item"><span class="l">批次号</span><span class="v mono">{{ ctx.batchNo || '—' }}</span></div>
      <div class="ctx-item"><span class="l">工单号</span><span class="v mono">{{ ctx.woNo || '—' }}</span></div>
      <div class="ctx-item"><span class="l">产品料号</span><span class="v mono">{{ ctx.partNo || '—' }}</span></div>
      <div class="ctx-item"><span class="l">工序</span><span class="v">{{ ctx.procName || '—' }}</span></div>
    </div>

    <!-- 首件前置校验提示 -->
    <div v-if="verdictChecked" class="verify-block" :class="released ? 'ok' : 'block'">
      <template v-if="released">
        <span class="dot ok"></span>
        首件已合格放行（{{ verdict?.code }}），可启动量产监控采集。
      </template>
      <template v-else>
        <span class="dot block"></span>
        首件未通过，量产监控未启动。请先完成首件检验（{{ verdict?.code || '无记录' }}）。
      </template>
    </div>
    <div v-else class="verify-block checking">
      <span class="dot"></span>正在校验首件结论…</div>

    <el-form label-width="96px" style="margin-top: 8px">
      <el-form-item label="SPC 参数" required>
        <el-select v-model="paramId" @change="onParamChange" placeholder="选择参数(按产品+工序过滤)" style="width: 100%">
          <el-option v-for="p in params" :key="p.id" :label="`${p.paramName} · ${p.procName || ''}`" :value="p.id" />
        </el-select>
      </el-form-item>

      <template v-if="param">
        <div class="param-meta">
          <span class="mono">子组大小 n = {{ param.subgroupSize }}</span>
          <span class="mono" v-if="param.specLower != null || param.specUpper != null">
            规格 [{{ param.specLower ?? '—' }}, {{ param.specUpper ?? '—' }}] {{ param.unit || '' }}
          </span>
        </div>
        <el-form-item label="测量值" required>
          <div class="vals">
            <div class="val-cell" v-for="(v, i) in values" :key="i">
              <span class="idx mono">{{ i + 1 }}</span>
              <el-input-number v-model="values[i]" :precision="3" :controls="false" :step="0.001" style="width: 120px" />
              <span class="u">{{ param.unit || '' }}</span>
            </div>
          </div>
        </el-form-item>
        <div class="hint mono" v-if="param && values.length === (param.subgroupSize || 0)">
          xbar = {{ xbarText }} · R = {{ rangeText }}
        </div>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!released" @click="submit">
        提交子组（量产）
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcSubgroupApi } from '@/api/modules/spc/subgroups'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import type { SpcParam } from '@/api/types/spc'

const props = defineProps<{
  modelValue: boolean
  ctx?: { batchNo?: string; woNo?: string; partNo?: string; procName?: string; productName?: string }
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const params = ref<SpcParam[]>([])
const paramId = ref('')
const param = ref<SpcParam | null>(null)
const values = ref<(number | null)[]>([])
const submitting = ref(false)

const verdict = ref<any>(null)
const verdictChecked = ref(false)
const released = computed(() => !!verdict.value?.released)

const xbarText = computed(() => {
  const nums = values.value.filter((v) => v != null) as number[]
  if (!nums.length) return '—'
  const sum = nums.reduce((a, b) => a + b, 0)
  return (sum / nums.length).toFixed(3)
})
const rangeText = computed(() => {
  const nums = values.value.filter((v) => v != null) as number[]
  if (!nums.length) return '—'
  return (Math.max(...nums) - Math.min(...nums)).toFixed(3)
})

function onParamChange(id: string) {
  const p = params.value.find((x) => x.id === id) || null
  param.value = p
  const n = p?.subgroupSize || 5
  values.value = Array.from({ length: n }, () => null)
}

async function loadParams() {
  if (!props.ctx) return
  const list = await spcParamApi
    .list({
      productName: props.ctx.productName || props.ctx.partNo,
      procName: props.ctx.procName,
    })
    .catch(() => [])
  params.value = list
  if (list.length > 0) {
    onParamChange(list[0].id)
    paramId.value = list[0].id
  } else {
    param.value = null
    paramId.value = ''
    values.value = []
  }
}

async function checkSetup() {
  verdictChecked.value = false
  verdict.value = null
  if (!props.ctx) return
  try {
    const res = await fiaTaskApi.getBySetup({
      woNo: props.ctx.woNo,
      partNo: props.ctx.partNo,
      procName: props.ctx.procName,
    })
    verdict.value = res
  } catch {
    verdict.value = { exists: false, released: false, message: '首件结论校验失败' }
  } finally {
    verdictChecked.value = true
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      nextTick(async () => {
        await loadParams()
        await checkSetup()
      })
    }
  },
)

async function submit() {
  if (!released.value) {
    ElMessage.warning('首件未通过,量产监控未启动')
    return
  }
  if (!paramId.value) {
    ElMessage.warning('请先选择 SPC 参数')
    return
  }
  if (values.value.some((v) => v == null || isNaN(v as number))) {
    ElMessage.warning('请完整录入所有测量值')
    return
  }
  submitting.value = true
  try {
    await spcSubgroupApi.create({
      paramId: paramId.value,
      subgroupTime: new Date().toISOString().slice(0, 19),
      woNo: props.ctx?.woNo || undefined,
      batchNo: props.ctx?.batchNo || undefined,
      productCode: props.ctx?.partNo || undefined,
      stage: 'ROUTINE',
      values: values.value as number[],
    })
    ElMessage.success('量产抽样子组已提交')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.dlg-head { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.dlg-head .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 4px; }
.dlg-head h3 { font-family: $font-display; font-size: 20px; font-weight: 800; margin: 0; }
.stage-badge {
  font-family: $font-mono; font-size: 11px; letter-spacing: 1px;
  padding: 4px 10px; border-radius: 999px; white-space: nowrap;
}
.stage-badge.routine { background: rgba(0, 71, 171, 0.1); color: $cobalt; border: 1px solid rgba(0, 71, 171, 0.25); }
.ctx-block { display: flex; flex-wrap: wrap; gap: 10px 20px; padding: 12px 14px; background: $paper; border: 1px solid $hairline; border-radius: 8px; }
.ctx-item { display: flex; flex-direction: column; gap: 2px; }
.ctx-item .l { font-size: 11px; color: $ink-faint; letter-spacing: 0.5px; }
.ctx-item .v { font-size: 13px; color: $ink; }
.verify-block { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
.verify-block .dot { width: 8px; height: 8px; border-radius: 50%; background: $ink-faint; flex-shrink: 0; }
.verify-block.ok { background: rgba(26, 127, 75, 0.08); color: $green; }
.verify-block.ok .dot { background: $green; }
.verify-block.block { background: rgba(224, 54, 22, 0.08); color: $signal-red; }
.verify-block.block .dot { background: $signal-red; }
.verify-block.checking { background: $paper; color: $ink-faint; }
.param-meta { display: flex; flex-wrap: wrap; gap: 16px; margin: 4px 0 14px; padding: 10px 14px; background: $paper; border-radius: 8px; font-size: 12px; color: $ink-soft; }
.param-meta .mono { font-family: $font-mono; }
.vals { display: flex; flex-wrap: wrap; gap: 12px; }
.val-cell { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid $hairline; border-radius: 8px; background: $white; }
.val-cell .idx { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; background: $cobalt-dim; color: $cobalt; border-radius: 50%; font-size: 10px; font-weight: 700; }
.val-cell .u { font-size: 11px; color: $ink-faint; }
.hint { font-size: 12px; color: $ink-faint; margin-top: 8px; }
</style>
