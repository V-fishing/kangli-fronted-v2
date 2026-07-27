<template>
  <div class="collect-view">
    <div class="head-b"><div class="crumb">SPC / 过程控制</div><h1>数据采集</h1></div>
    <el-card shadow="never" class="card-b">
      <el-form label-width="100px" style="max-width:760px">
        <el-form-item label="参数" required>
          <el-select v-model="paramId" @change="onParamChange" placeholder="选择 SPC 参数" style="width:100%">
            <el-option v-for="p in params" :key="p.id" :label="`${p.paramName} · ${p.procName || ''}`" :value="p.id" />
          </el-select>
        </el-form-item>

        <template v-if="param">
          <div class="param-meta">
            <span class="mono">子组大小 n = {{ param.subgroupSize }}</span>
            <span class="mono" v-if="param.specLower != null || param.specUpper != null">
              规格 [{{ param.specLower ?? '—' }}, {{ param.specUpper ?? '—' }}] {{ param.unit || '' }}
            </span>
            <span class="mono" v-if="param.targetValue != null">目标 {{ param.targetValue }}</span>
          </div>

          <el-form-item label="班次"><el-input v-model="form.shift" placeholder="如 A / B / C" style="width:160px" /></el-form-item>
          <el-form-item label="工单号"><el-input v-model="form.woNo" style="width:240px" /></el-form-item>
          <el-form-item label="批次号"><el-input v-model="form.batchNo" style="width:240px" /></el-form-item>

          <el-form-item label="测量值" required>
            <div class="vals">
              <div class="val-cell" v-for="(v, i) in form.values" :key="i">
                <span class="idx mono">{{ i + 1 }}</span>
                <el-input-number v-model="form.values[i]" :precision="3" :controls="false" :step="0.001" style="width:120px" />
                <span class="u">{{ param.unit || '' }}</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submit">提交子组</el-button>
            <el-button @click="reset">重置</el-button>
            <span class="hint">共 {{ form.values.length }} 个测量值</span>
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { spcParamApi } from '@/api/modules/spc/params'
import { spcSubgroupApi } from '@/api/modules/spc/subgroups'
import type { SpcParam } from '@/api/types/spc'

const params = ref<SpcParam[]>([])
const paramId = ref('')
const param = ref<SpcParam | null>(null)
const submitting = ref(false)
const form = ref({ shift: '', woNo: '', batchNo: '', values: [] as (number | null)[] })

function onParamChange(id: string) {
  const p = params.value.find(x => x.id === id) || null
  param.value = p
  const n = p?.subgroupSize || 5
  form.value.values = Array.from({ length: n }, () => null)
}

async function submit() {
  if (!paramId.value) { ElMessage.warning('请先选择参数'); return }
  if (form.value.values.some(v => v == null || isNaN(v))) { ElMessage.warning('请完整录入所有测量值'); return }
  submitting.value = true
  try {
    await spcSubgroupApi.create({
      paramId: paramId.value,
      subgroupTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      shift: form.value.shift || undefined,
      woNo: form.value.woNo || undefined,
      batchNo: form.value.batchNo || undefined,
      values: form.value.values as number[],
    })
    ElMessage.success('子组已提交')
    const n = param.value?.subgroupSize || 5
    form.value.values = Array.from({ length: n }, () => null)
  } finally { submitting.value = false }
}

function reset() {
  form.value = { shift: '', woNo: '', batchNo: '', values: Array.from({ length: param.value?.subgroupSize || 5 }, () => null) }
}

onMounted(async () => { params.value = await spcParamApi.list() })
</script>

<style lang="scss" scoped>
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.param-meta { display: flex; flex-wrap: wrap; gap: 16px; margin: 4px 0 18px; padding: 10px 14px; background: $paper; border-radius: 8px; font-size: 12px; color: $ink-soft; }
.param-meta .mono { font-family: $font-mono; }
.vals { display: flex; flex-wrap: wrap; gap: 12px; }
.val-cell { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid $hairline; border-radius: 8px; background: $white; }
.val-cell .idx { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; background: $cobalt-dim; color: $cobalt; border-radius: 50%; font-size: 10px; font-weight: 700; }
.val-cell .u { font-size: 11px; color: $ink-faint; }
.hint { font-size: 12px; color: $ink-faint; }
</style>
