<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { qmsBoardApi } from '@/api/modules/qmsMgmt'
import { csFeedbackApi } from '@/api/modules/cs/feedback'
import { usePermissionStore } from '@/stores/permission'
import { downloadBlob } from '@/api/modules/common/files'
import StatCards from '@/components/common/StatCards.vue'

const perm = usePermissionStore()

const fb = ref<any>({})
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await qmsBoardApi.board()
    fb.value = res.feedback || {}
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { if (perm.has('qms-mgmt.feedback.list')) load() })

async function onExport() {
  try {
    await downloadBlob('/api/v1/cs/feedbacks/export', '顾客反馈.csv', {})
    ElMessage.success('导出成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}
</script>

<template>
  <div class="page-wrap rise" v-if="perm.has('qms-mgmt.feedback.list')">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">体系管理</span><span class="crumb-sep">/</span><span class="crumb-link">顾客反馈分析</span></div>
        <h1>顾客反馈<span class="no mono">QMS</span></h1>
      </div>
    </div>

    <el-card class="card-b" v-loading="loading" :body-style="{ padding: '22px' }">
      <div class="card-head" style="padding:0 0 12px;display:flex;justify-content:space-between;align-items:center;">
        <h2>顾客反馈概览（数据来源：售后管理 · 客户反馈）</h2>
        <el-button v-if="perm.has('cs.feedback.list')" @click="onExport">导出 CSV</el-button>
      </div>
      <StatCards :cards="[
        { num: fb.total || 0, label: '反馈总数', tone: 'cobalt' },
        { num: fb.done || 0, label: '已处理', tone: 'done' },
        { num: (fb.handleRate || 0) + '%', label: '处理率', tone: 'run' },
        { num: fb.avgScore || 0, label: '平均满意度', tone: 'red', warn: true },
      ]" />

      <el-divider>类型分布</el-divider>
      <el-table :data="fb.typeDist || []" style="width:100%">
        <el-table-column label="反馈类型" min-width="160">
          <template #default="{ row }">{{ row.type || '—' }}</template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="{ row }"><span class="mono">{{ row.cnt }}</span></template>
        </el-table-column>
      </el-table>

      <el-divider>状态分布</el-divider>
      <el-table :data="fb.statusDist || []" style="width:100%">
        <el-table-column label="状态" min-width="160">
          <template #default="{ row }">{{ row.status || '—' }}</template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="{ row }"><span class="mono">{{ row.cnt }}</span></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

