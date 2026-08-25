<template>
  <div class="ym-range">
    <el-select :model-value="start" placeholder="起始月" class="f-sel" @change="onStart">
      <el-option v-for="m in MONTHS" :key="m" :label="m" :value="m" />
    </el-select>
    <span class="tilde">~</span>
    <el-select :model-value="end" placeholder="截止月" class="f-sel" @change="onEnd">
      <el-option v-for="m in MONTHS" :key="m" :label="m" :value="m" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  start?: string
  end?: string
}>()
const emit = defineEmits<{
  'update:start': [string]
  'update:end': [string]
  change: []
}>()

// 近 18 个月月份选项(与看板一致),组件自包含,避免依赖父级 MONTHS
const now = new Date()
const MONTHS = (() => {
  const arr: string[] = []
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = 0; i < 18; i++) {
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return arr
})()

function onStart(v: string) {
  emit('update:start', v)
  emit('change')
}
function onEnd(v: string) {
  emit('update:end', v)
  emit('change')
}

// 兜底:若父级未传入默认月份,自动取最近区间首/尾
onMounted(() => {
  if (!props.start) emit('update:start', MONTHS[MONTHS.length - 1])
  if (!props.end) emit('update:end', MONTHS[0])
})
</script>

<style lang="scss" scoped>
.ym-range { display: inline-flex; align-items: center; gap: 6px; }
.f-sel { width: 108px; }
.tilde { color: $ink-faint; }
</style>
