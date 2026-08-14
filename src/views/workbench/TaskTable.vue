<template>
  <div v-loading="loading ?? false" class="task-table">
    <table>
      <thead>
        <tr><th>模块</th><th>类型</th><th>单号</th><th>事项</th><th>负责人</th><th>截止</th><th>状态</th></tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.module + (t.bizNo || '')" class="clickable" @click="$emit('open', t.url)">
          <td><span class="mod-tag" :class="moduleTagClass(t.module)">{{ moduleLabel(t.module) }}</span></td>
          <td>{{ t.taskType }}</td>
          <td class="wo-b">{{ t.bizNo || '—' }}</td>
          <td class="prod-b">{{ t.title || '—' }}</td>
          <td>{{ t.assignee || '—' }}</td>
          <td class="elapsed-b">{{ fmtDue(t.dueAt) }}</td>
          <td><span class="pill" :class="statusPill(t.status)"><span class="d"></span>{{ t.status || '待处理' }}</span></td>
        </tr>
        <tr v-if="!loading && !rows.length"><td colspan="7" class="empty-b">{{ emptyText }}</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { MyTask } from '@/api/types/myTask'

defineProps<{
  rows: MyTask[]
  loading?: boolean
  emptyText?: string
}>()
defineEmits<{ (e: 'open', url?: string): void }>()

function moduleLabel(m?: string) {
  switch (m) {
    case 'FIA':
      return '首件'
    case 'NCM':
      return '异常'
    case 'PATROL':
      return '巡检'
    default:
      return m || '任务'
  }
}
function moduleTagClass(m?: string) {
  switch (m) {
    case 'FIA':
      return 'mod-cobalt'
    case 'NCM':
      return 'mod-red'
    case 'PATROL':
      return 'mod-green'
    default:
      return 'mod-cobalt'
  }
}
function fmtDue(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function statusPill(s?: string) {
  switch (s) {
    case '待检':
    case '待巡检':
      return 'p-wait'
    case '进行中':
      return 'p-run'
    case '待复核':
    case '待批准':
    case '分析中':
      return 'p-sign'
    case '超时':
    case '已作废':
    case '已驳回':
      return 'p-lock'
    case '已完成':
    case '已关闭':
    case '已通过':
    case '已闭环':
    case '审批中':
      return 'p-done'
    default:
      return 'p-wait'
  }
}
</script>

<style lang="scss" scoped>
.task-table { background: $white; border: 1px solid $hairline; border-radius: 10px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead th { text-align: left; padding: 12px 16px; background: #fafaf8; color: $ink-faint; font-weight: 500; font-size: 12px; border-bottom: 1px solid $hairline; }
tbody td { padding: 13px 16px; border-bottom: 1px solid $hairline-soft; color: $ink-soft; }
tbody tr:last-child td { border-bottom: none; }
.clickable { cursor: pointer; }
tbody tr.clickable:hover { background: #fafaf8; }
.wo-b { font-family: $font-mono; font-size: 12px; color: $cobalt; font-weight: 500; }
.elapsed-b { font-family: $font-mono; font-size: 12px; color: $ink-soft; }
.elapsed-b.over { color: $signal-red; font-weight: 500; }
.mod-tag { display: inline-block; padding: 2px 9px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.mod-cobalt { background: $cobalt-dim; color: $cobalt; }
.mod-red { background: $signal-red-dim; color: $signal-red; }
.mod-green { background: #e7f4ec; color: #1f9d55; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.p-wait { background: #eef1f5; color: #6b7280; }
.p-run { background: $cobalt-dim; color: $cobalt; }
.p-sign { background: #fff4e0; color: #c77700; }
.p-lock { background: $signal-red-dim; color: $signal-red; }
.p-done { background: #e7f4ec; color: #1f9d55; }
.empty-b { text-align: center; color: $ink-faint; padding: 40px; font-size: 13px; }
</style>
