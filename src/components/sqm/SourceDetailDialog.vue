<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="760px"
    top="5vh"
    destroy-on-close
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <SourceDetailContent :source-type="sourceType" :biz-key="bizKey" />
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SourceDetailContent from './SourceDetailContent.vue'

const SOURCE_LABEL: Record<string, string> = {
  material: '来料检验明细',
  finished: '成品检验明细',
  semi: '半成品检验明细',
  critical: '关键件绑定明细',
}

const props = defineProps<{
  sourceType: string
  bizKey: string
}>()

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

const visible = ref(false)
const title = computed(() => SOURCE_LABEL[props.sourceType] || '源表明细')

function onClosed() {
  emit('update:visible', false)
}

defineExpose({
  open() {
    visible.value = true
  },
})
</script>
