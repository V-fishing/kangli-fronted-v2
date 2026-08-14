<template>
  <div class="tnl-wrap">
    <div class="tnl-node" :class="[node.nodeType || 'raw']" @click="onSelect">
      <span v-if="hasChildren" class="tnl-toggle" @click.stop="toggle">{{ open ? '▼' : '▶' }}</span>
      <span v-else class="tnl-toggle leaf">•</span>
      <span class="tnl-name">{{ node.nodeName || node.batchNo || '未命名节点' }}</span>
      <el-tag size="small" :type="tagType" class="tnl-badge">{{ typeLabel }}</el-tag>
      <el-tag v-if="node.noBarcode" size="small" type="warning" effect="plain" class="tnl-nobar">无 material_barcode</el-tag>
      <span class="tnl-meta" :class="{ 'tnl-missing': node.noBarcode }">批次：{{ node.noBarcode ? '源表无此字段' : (node.batchNo || '-') }}</span>
      <span v-if="node.qty != null" class="tnl-meta">数量：{{ node.qty }}{{ node.unit || '' }}</span>
    </div>
    <div v-show="open" v-if="hasChildren" class="tnl-children">
      <TraceNodeList
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TraceNodeTreeVO } from '@/api/types/sqm'

const props = defineProps<{
  node: TraceNodeTreeVO
}>()
const emit = defineEmits<{
  (e: 'select', node: TraceNodeTreeVO): void
}>()

// 默认折叠: 仅展开根节点, 点击节点才展开其直接下级(避免超大树一次性渲染卡顿)
const open = ref(false)
const hasChildren = computed(() => !!(props.node.children && props.node.children.length))

const typeLabelMap: Record<string, string> = {
  incoming: '来料批次',
  raw: '原料采购',
  semi: '半成品',
  keypart: '关键件',
  material: '物料',
  finished: '成品',
  productNo: '产品料号',
  ship: '出货交付',
  customer: '终端客户',
  virtualCustomer: '客户(待补)',
  root: '本节点',
  unknown: '未知',
}
const typeTagMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  incoming: 'primary',
  raw: 'success',
  semi: 'warning',
  keypart: 'warning',
  material: 'info',
  finished: 'success',
  productNo: 'primary',
  ship: 'danger',
  customer: 'info',
  virtualCustomer: 'info',
  root: 'primary',
  unknown: 'info',
}
const typeLabel = computed(() => typeLabelMap[props.node.nodeType || 'raw'] || '其他')
const tagType = computed(() => typeTagMap[props.node.nodeType || 'raw'] || 'info')

function toggle() {
  open.value = !open.value
}
function onSelect() {
  emit('select', props.node)
}
</script>

<style scoped>
.tnl-wrap { position: relative; }
.tnl-node {
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
.tnl-node:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
.tnl-node.incoming { border-left: 4px solid #1e4d8b; }
.tnl-node.raw { border-left: 4px solid #2f7d32; }
.tnl-node.semi { border-left: 4px solid #8e44ad; }
.tnl-node.keypart { border-left: 4px solid #b9770e; }
.tnl-node.finished { border-left: 4px solid #1e88e5; }
.tnl-node.ship { border-left: 4px solid #c0392b; }
.tnl-node.customer { border-left: 4px solid #16a085; }
.tnl-node.virtualCustomer {
  border: 1px dashed #9ca3af;
  background: #f1f5f9;
  border-left: 4px dashed #9ca3af;
  color: #64748b;
}
.tnl-toggle { width: 18px; text-align: center; color: #64748b; font-size: 11px; user-select: none; }
.tnl-toggle.leaf { color: #cbd5e1; }
.tnl-name { font-weight: 600; color: #1f2937; }
.tnl-node.virtualCustomer .tnl-name { font-weight: 500; color: #64748b; }
.tnl-badge { font-size: 11px; }
.tnl-nobar { font-size: 11px; }
.tnl-meta { color: #94a3b8; font-size: 12px; }
.tnl-meta.tnl-missing { color: #b9770e; font-style: italic; }
.tnl-children {
  margin-left: 26px;
  padding-left: 14px;
  border-left: 1px dashed #d8dee9;
}
</style>
