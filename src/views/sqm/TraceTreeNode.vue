<template>
  <div class="tn-wrap">
    <div
      class="tree-node"
      :class="[node.nodeType || 'raw', { current: node.id === focusId, onpath: pathSet.includes(node.id) }]"
      @click="select"
    >
      <span v-if="hasChildren" class="tree-toggle" @click.stop="toggle">{{ open ? '▼' : '▶' }}</span>
      <span v-else class="tree-toggle leaf">•</span>
      <span class="tn-icon">{{ typeIcon }}</span>
      <span class="tn-name">{{ node.nodeName || node.batchNo || '未命名节点' }}</span>
      <span class="tn-type-badge" :class="node.nodeType || 'raw'">{{ typeLabel }}</span>
      <span class="tn-meta">批次：{{ node.batchNo || '-' }}</span>
    </div>
    <div v-show="open" v-if="hasChildren" class="tree-children">
      <TraceTreeNode
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        :focus-id="focusId"
        :path-set="pathSet"
        @select="(n: any) => emit('select', n)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TraceNodeTreeVO } from '@/api/types/sqm'

const props = defineProps<{
  node: TraceNodeTreeVO
  focusId?: string | null
  pathSet?: string[]
}>()
const emit = defineEmits<{
  (e: 'select', node: TraceNodeTreeVO): void
}>()

const open = ref(true)
const hasChildren = computed(() => !!(props.node.children && props.node.children.length))

const typeLabelMap: Record<string, string> = {
  incoming: '来料批次',
  raw: '原材料',
  semi: '半成品',
  ship: '出货交付',
  customer: '终端客户',
}
const typeIconMap: Record<string, string> = {
  incoming: '📦',
  raw: '🌿',
  semi: '⚙️',
  ship: '🚚',
  customer: '🏢',
}
const typeLabel = computed(() => typeLabelMap[props.node.nodeType || 'raw'] || '其他')
const typeIcon = computed(() => typeIconMap[props.node.nodeType || 'raw'] || '📋')

function toggle() {
  open.value = !open.value
}
function select() {
  emit('select', props.node)
}
</script>

<style scoped>
.tn-wrap {
  position: relative;
}
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  margin: 6px 0;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
  flex-wrap: wrap;
}
.tree-node:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.tree-node.incoming { border-left: 4px solid #1e4d8b; }
.tree-node.raw { border-left: 4px solid #2f7d32; }
.tree-node.semi { border-left: 4px solid #8e44ad; }
.tree-node.ship { border-left: 4px solid #c0392b; }
.tree-node.customer { border-left: 4px solid #16a085; }
.tree-node.onpath { background: #fff7e6; border-color: #f0c14b; }
.tree-node.current {
  background: #fff3cd;
  border-color: #f0a500;
  box-shadow: 0 0 0 2px rgba(240,165,0,0.35);
}
.tree-toggle {
  width: 18px;
  text-align: center;
  color: #64748b;
  font-size: 11px;
  user-select: none;
  flex-shrink: 0;
}
.tree-toggle.leaf { color: #cbd5e1; }
.tn-icon { font-size: 15px; flex-shrink: 0; }
.tn-name { font-weight: 600; color: #1f2937; }
.tn-meta { color: #94a3b8; font-size: 12px; }
.tree-children {
  margin-left: 26px;
  padding-left: 14px;
  border-left: 1px dashed #d8dee9;
}
.tn-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}
.tn-type-badge.incoming { background: #1e4d8b; }
.tn-type-badge.raw { background: #2f7d32; }
.tn-type-badge.semi { background: #8e44ad; }
.tn-type-badge.ship { background: #c0392b; }
.tn-type-badge.customer { background: #16a085; }
</style>
