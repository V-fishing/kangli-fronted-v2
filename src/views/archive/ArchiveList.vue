<template>
  <div class="archive-list">
    <div class="head-b"><div class="crumb">ARCHIVE / 归档查询</div><h1>归档查询</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="类型"><el-select v-model="filterType" clearable placeholder="全部" style="width:120px"><el-option value="fia" label="FIA首件" /><el-option value="audit" label="SQM审核" /></el-select></el-form-item>
        <el-form-item label="关键词"><el-input v-model="filterKeyword" clearable placeholder="报告号/工单号" style="width:200px" /></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="archiveType" label="类型" width="80"><template #default="{row}"><el-tag size="small">{{ (row as any).archiveType==='fia'?'FIA':'SQM' }}</el-tag></template></el-table-column>
        <el-table-column prop="archiveNo" label="归档号" width="180" />
        <el-table-column prop="refNo" label="关联单号" width="160" />
        <el-table-column prop="archiveDate" label="归档日期" width="160" />
        <el-table-column label="留存到期" width="160"><template #default="{row}"><span :style="{color:(row as any).daysRemaining<30?'var(--el-color-danger)':''}" class="mono">{{ (row as any).retentionUntil?.slice(0,10) || '-' }} ({{ (row as any).daysRemaining ?? '-' }}天)</span></template></el-table-column>
        <el-table-column prop="reportHash" label="哈希" width="140"><template #default="{row}"><span class="mono" style="font-size:11px">{{ (row as any).reportHash?.slice(0,16) || '-' }}...</span></template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { request } from '@/api/client'

const list = ref<any[]>([])
const loading = ref(false)
const filterType = ref(''), filterKeyword = ref('')

async function fetch() {
  loading.value = true
  try {
    const all = await request.get<any[]>('/v1/archives', { params: { type: filterType.value || undefined, keyword: filterKeyword.value || undefined } }).catch(() => [])
    list.value = (all || []).filter(r => !filterType.value || r.archiveType === filterType.value)
  } finally { loading.value = false }
}
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.archive-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.mono { font-family: $font-mono; }
</style>