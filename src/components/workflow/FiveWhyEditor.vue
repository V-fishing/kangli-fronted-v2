<script setup lang="ts">
/**
 * 5Why 根因追问
 *  - mode="edit" : 简单问答列表(为什么 N / 因为: ... 逐条输入)
 *  - mode="view" : 可视化因果链(顶部问题 + 逐层↓ + 底部根本原因高亮)
 */
import { ref, computed, watch } from 'vue'

interface WhyItem { why: string; answer: string }
const props = defineProps<{
  items: WhyItem[]
  problem?: string
  mode?: 'edit' | 'view'
}>()
const emit = defineEmits<{ update: [items: WhyItem[]] }>()

const localItems = ref<WhyItem[]>(
  (props.items || []).map((x) => ({ why: x.why || '', answer: x.answer || '' })),
)
watch(() => props.items, (v) => {
  localItems.value = (v || []).map((x) => ({ why: x.why || '', answer: x.answer || '' }))
}, { deep: true })

const isEdit = computed(() => props.mode === 'edit')

function onUpdate() { emit('update', localItems.value) }
function addLayer() { localItems.value.push({ why: '', answer: '' }); onUpdate() }
function removeLayer(idx: number) { localItems.value.splice(idx, 1); onUpdate() }
</script>

<template>
  <!-- 简单问答式编辑 -->
  <div v-if="isEdit" class="why-form">
    <div v-for="(item, i) in localItems" :key="i" class="row">
      <span class="num">第 {{ i + 1 }} 层</span>
      <input v-model="item.why" type="text" placeholder="为什么..." @input="onUpdate" />
      <span class="because">因为</span>
      <input v-model="item.answer" type="text" placeholder="回答..." @input="onUpdate" />
      <button class="rm" @click="removeLayer(i)" title="删除本层">×</button>
    </div>
    <button class="add" @click="addLayer">+ 添加追问层</button>
  </div>

  <!-- 可视化因果链（仅在 8D 报告/末尾渲染） -->
  <div v-else class="why-chain">
    <div class="origin" v-if="problem">
      <div class="origin__label">原始问题</div>
      <div class="origin__text">{{ problem }}</div>
    </div>
    <div v-for="(item, i) in localItems" :key="i" class="layer">
      <div class="layer-num">第 {{ i + 1 }} 层</div>
      <div class="card">
        <div class="q-row"><span class="q-label">为什么？</span><span class="q-text">{{ item.why || '—' }}</span></div>
        <div class="a-row"><span class="a-label">因为：</span><span class="a-text">{{ item.answer || '—' }}</span></div>
      </div>
      <div v-if="i < localItems.length - 1" class="connector">↓</div>
    </div>
    <div v-if="localItems.length" class="root-cause">
      <div class="root-cause__label">根本原因</div>
      <div class="root-cause__text">{{ localItems[localItems.length - 1]?.answer || '—' }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.why-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    background: #f4f8ff;
    border: 1px solid #dbe7f7;
    border-radius: 4px;
    .num { color: #1e4d8b; font-size: 11px; font-weight: 600; min-width: 50px; }
    .because { color: #16a085; font-size: 11px; font-weight: 600; }
    input {
      flex: 1;
      border: 1px solid #c8d4e3;
      border-radius: 3px;
      padding: 3px 6px;
      font-size: 12px;
    }
    .rm {
      border: none;
      background: none;
      color: #c0392b;
      cursor: pointer;
      font-size: 14px;
    }
  }
  .add {
    background: #f4f8ff;
    color: #1e4d8b;
    border: 1px dashed #1e4d8b;
    border-radius: 4px;
    padding: 4px;
    font-size: 12px;
    cursor: pointer;
    &:hover { background: #1e4d8b; color: #fff; }
  }
}

.why-chain { display: flex; flex-direction: column; font-size: 12px; }
.origin {
  background: #fff8e1;
  border: 1px solid #f0c14b;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
  &__label { font-size: 10px; color: #b58a00; font-weight: 600; }
  &__text { font-size: 12px; color: #5a4400; margin-top: 2px; }
}
.layer { display: flex; flex-direction: column; }
.layer-num { font-size: 10px; color: #1e4d8b; font-weight: 600; margin-bottom: 4px; padding-left: 4px; }
.card {
  background: #f4f8ff;
  border: 1px solid #dbe7f7;
  border-radius: 6px;
  padding: 8px 10px;
  .q-row, .a-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; &:last-child { margin-bottom: 0; } }
  .q-label, .a-label { font-weight: 600; min-width: 48px; font-size: 11px; }
  .q-label { color: #1e4d8b; }
  .a-label { color: #16a085; }
  .q-text, .a-text { color: #3a4a5c; font-size: 12px; }
}
.connector { text-align: center; color: #1e4d8b; font-size: 18px; line-height: 1; margin: 4px 0; font-weight: 600; }
.root-cause {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  color: #fff;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  &__label { font-size: 10px; opacity: 0.9; font-weight: 600; }
  &__text { font-size: 13px; font-weight: 600; margin-top: 2px; word-break: break-all; }
}
</style>
