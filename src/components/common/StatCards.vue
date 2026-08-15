<script setup lang="ts">
// 体系/通用统计卡片行。cards: { num, label, tone? }
// tone: 'cobalt' | 'done' | 'run' | 'wait' | 'red' | 'warn'(红框)
defineProps<{
  cards: { num: string | number; label: string; tone?: 'cobalt' | 'done' | 'run' | 'wait' | 'red'; warn?: boolean }[]
}>()
</script>

<template>
  <div class="stat-row">
    <div v-for="(c, i) in cards" :key="i" class="stat-card" :class="{ warn: c.warn }">
      <div class="stat-num mono" :class="{
        'c-cobalt': c.tone === 'cobalt',
        'p-done-t': c.tone === 'done',
        'p-run-t': c.tone === 'run',
        'p-wait-t': c.tone === 'wait',
        'hl-red': c.tone === 'red',
      }">{{ c.num }}</div>
      <div class="stat-lbl">{{ c.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border: 1px solid $hairline; border-radius: 8px; padding: 14px 16px; }
.stat-card.warn { border-color: $signal-red-dim; }
.stat-num { font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-lbl { font-size: 12px; color: $ink-faint; margin-top: 4px; }
</style>
