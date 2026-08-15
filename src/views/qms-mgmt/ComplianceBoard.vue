<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { qmsBoardApi } from '@/api/modules/qmsMgmt'
import { usePermissionStore } from '@/stores/permission'
import StatCards from '@/components/common/StatCards.vue'

const perm = usePermissionStore()

const board = ref<any>({})
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    board.value = await qmsBoardApi.board()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { if (perm.has('qms-mgmt.dashboard.list')) load() })
</script>

<template>
  <div class="page-wrap rise" v-if="perm.has('qms-mgmt.dashboard.list')">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">体系管理</span><span class="crumb-sep">/</span><span class="crumb-link">体系合规监控</span></div>
        <h1>体系合规<span class="no mono">QMS</span></h1>
      </div>
      <el-button @click="load" :loading="loading">刷新</el-button>
    </div>

    <div v-loading="loading">
      <!-- 1. 质量目标达成率 -->
      <el-card class="card-b" :body-style="{ padding: '22px' }">
        <div class="card-head" style="padding:0 0 12px;"><h2>质量目标达成率</h2></div>
        <StatCards :cards="[
          { num: board.goal?.total || 0, label: '目标总数', tone: 'cobalt' },
          { num: (board.goal?.overallRate || 0) + '%', label: '整体达成率', tone: 'done' },
          { num: board.goal?.notReached || 0, label: '未达标数', tone: 'red', warn: true },
        ]" />
      </el-card>

      <!-- 2. 内审不符合项关闭率 -->
      <el-card class="card-b" :body-style="{ padding: '22px' }">
        <div class="card-head" style="padding:0 0 12px;"><h2>内审与不符合项</h2></div>
        <StatCards :cards="[
          { num: board.audit?.auditTotal || 0, label: '内审总数', tone: 'cobalt' },
          { num: board.audit?.ncOpen || 0, label: '待整改NC', tone: 'wait' },
          { num: board.audit?.ncInProgress || 0, label: '整改中NC', tone: 'run' },
          { num: board.audit?.ncClosed || 0, label: '已关闭NC', tone: 'done' },
          { num: (board.audit?.ncCloseRate || 0) + '%', label: 'NC关闭率', tone: 'done' },
        ]" />
      </el-card>

      <!-- 3. 不良事件处理率 -->
      <el-card class="card-b" :body-style="{ padding: '22px' }">
        <div class="card-head" style="padding:0 0 12px;"><h2>不良事件</h2></div>
        <StatCards :cards="[
          { num: board.adverse?.total || 0, label: '事件总数', tone: 'cobalt' },
          { num: board.adverse?.pending || 0, label: '待处理', tone: 'wait', warn: true },
          { num: board.adverse?.handling || 0, label: '处理中', tone: 'run' },
          { num: board.adverse?.done || 0, label: '已办结', tone: 'done' },
          { num: board.adverse?.critical || 0, label: '危急事件', tone: 'red', warn: true },
        ]" />
      </el-card>

      <!-- 4. 顾客反馈（复用 CS） -->
      <el-card class="card-b" :body-style="{ padding: '22px' }">
        <div class="card-head" style="padding:0 0 12px;"><h2>顾客反馈（来源：售后管理）</h2></div>
        <StatCards :cards="[
          { num: board.feedback?.total || 0, label: '反馈总数', tone: 'cobalt' },
          { num: board.feedback?.done || 0, label: '已处理', tone: 'done' },
          { num: (board.feedback?.handleRate || 0) + '%', label: '处理率', tone: 'run' },
          { num: board.feedback?.avgScore || 0, label: '平均满意度', tone: 'red', warn: true },
        ]" />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.card-b { margin-bottom: 16px; }
</style>
