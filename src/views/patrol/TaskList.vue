<template>
  <div class="task-list">
    <div class="head-b"><AppBreadcrumb /><h1>巡检任务</h1></div>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="taskNo" label="任务编号" width="170" />
        <el-table-column prop="shift" label="班次" width="80" />
        <el-table-column prop="planTime" label="计划时间" width="160" />
        <el-table-column label="进度" width="100"><template #default="{row}"><span class="mono">{{ (row as PatlTask).donePoints }}/{{ (row as PatlTask).totalPoints }}</span></template></el-table-column>
        <el-table-column label="异常" width="60"><template #default="{row}"><span :style="{color:(row as PatlTask).abnormalCount>0?'var(--el-color-danger)':''}">{{ (row as PatlTask).abnormalCount || 0 }}</span></template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{row}"><span class="pill" :class="(row as PatlTask).status==='已完成'?'p-done':'p-wait'"><span class="d"></span>{{ (row as PatlTask).status }}</span></template></el-table-column>
        <el-table-column label="操作" width="100" fixed="right"><template #default="{row}"><el-button v-if="(row as PatlTask).status!=='已完成'" link type="danger" size="small" @click="doClose((row as PatlTask).id)">关闭</el-button></template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { patlTaskApi } from '@/api/modules/patrol/tasks'
import type { PatlTask } from '@/api/types/patrol'

const list = ref<PatlTask[]>([])
const loading = ref(false)

async function fetch() { loading.value = true; try { list.value = await patlTaskApi.list() } finally { loading.value = false } }
async function doClose(id: string) { await patlTaskApi.close(id); ElMessage.success('已关闭'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.task-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.mono { font-family: $font-mono; }
</style>