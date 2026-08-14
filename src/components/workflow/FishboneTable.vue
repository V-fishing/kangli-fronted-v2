<script setup lang="ts">
/**
 * 鱼骨图(5M1E)分类表格录入
 *  - 按 人/机/料/法/环/测 六类分组,每类下增删原因行
 *  - 数据存于后端独立表 ops.qms_8d_fishbone(category + causeText 扁平结构)
 *  - readonly=true 时仅展示(用于已审批/已完成阶段)
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fishboneApi } from '@/api/modules/ncm/fishbone'
import type { Qms8dFishbone } from '@/api/types/ncm'

const props = defineProps<{
  d8Id: string
  orgId?: string
  problem?: string
  readonly?: boolean
}>()

const CATEGORIES = ['人', '机', '料', '法', '环', '测']
const items = ref<Qms8dFishbone[]>([])
const drafts = reactive<Record<string, string>>({})

const grouped = computed<Record<string, Qms8dFishbone[]>>(() => {
  const m: Record<string, Qms8dFishbone[]> = {}
  CATEGORIES.forEach((c) => (m[c] = []))
  items.value.forEach((it) => {
    if (!it.category) return
    ;(m[it.category] ||= []).push(it)
  })
  return m
})

async function load() {
  items.value = await fishboneApi.list(props.d8Id)
}

async function add(category: string) {
  const text = (drafts[category] || '').trim()
  if (!text) return ElMessage.warning('请先填写原因内容')
  const created = await fishboneApi.create({
    d8Id: props.d8Id,
    orgId: props.orgId,
    problem: props.problem,
    category,
    causeText: text,
  })
  items.value.push(created)
  drafts[category] = ''
}

async function remove(it: Qms8dFishbone) {
  if (!it.id) return
  await fishboneApi.remove(it.id)
  items.value = items.value.filter((x) => x.id !== it.id)
}

onMounted(load)
</script>

<template>
  <div class="fishbone">
    <div v-for="cat in CATEGORIES" :key="cat" class="fb-cat">
      <div class="fb-cat__head">{{ cat }}</div>
      <div class="fb-cat__rows">
        <div v-for="it in grouped[cat]" :key="it.id" class="fb-row">
          <span class="fb-row__text">{{ it.causeText }}</span>
          <button v-if="!readonly" class="fb-rm" @click="remove(it)" title="删除">×</button>
        </div>
        <div v-if="!grouped[cat].length" class="fb-empty">—</div>
      </div>
      <div v-if="!readonly" class="fb-add">
        <input
          v-model="drafts[cat]"
          class="fb-input"
          :placeholder="`添加「${cat}」的原因`"
          @keyup.enter="add(cat)"
        />
        <button class="fb-add-btn" @click="add(cat)">+ 添加</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fishbone { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.fb-cat {
  border: 1px solid #dbe7f7;
  border-radius: 6px;
  padding: 8px 10px;
  background: #fbfdff;
}
.fb-cat__head { font-size: 12px; font-weight: 700; color: #1e4d8b; margin-bottom: 6px; }
.fb-cat__rows { min-height: 24px; display: flex; flex-direction: column; gap: 4px; }
.fb-row {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #e6eef8;
  border-radius: 4px;
  padding: 3px 6px;
}
.fb-row__text { flex: 1; font-size: 12px; color: #3a4a5c; word-break: break-all; }
.fb-rm { border: none; background: none; color: #c0392b; cursor: pointer; font-size: 14px; }
.fb-empty { color: #b9c4d0; font-size: 12px; }
.fb-add { display: flex; gap: 6px; margin-top: 6px; }
.fb-input {
  flex: 1;
  border: 1px solid #c8d4e3;
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 12px;
}
.fb-add-btn {
  border: 1px dashed #1e4d8b;
  background: #f4f8ff;
  color: #1e4d8b;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}
</style>
