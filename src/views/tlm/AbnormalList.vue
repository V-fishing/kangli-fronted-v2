<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { TlmTooling } from '@/api/types/tlm'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'

const router = useRouter()
const tab = ref<'locked' | 'life' | 'calib'>('locked')
const list = ref<TlmTooling[]>([])
const loading = ref(false)

const statusPill = (s: string) => ({ IN_USE: 'p-done', DISABLED: 'p-mute', REPAIRING: 'p-run', SCRAPPED: 'p-lock' }[s] || 'p-wait')
const statusText = (s: string) => ({ IN_USE: '在用', DISABLED: '停用', REPAIRING: '维修中', SCRAPPED: '报废' }[s] || s)
const abnPill = (t: string) => (t === 'calib' ? 'p-lock' : t === 'life' ? 'p-lock' : 'p-wait')
const abnText = (t: string) => (t === 'calib' ? '校准逾期' : t === 'life' ? '寿命超限' : '锁定')

async function fetch() {
  loading.value = true
  try { list.value = await tlmToolingApi.abnormal(tab.value) } finally { loading.value = false }
}
function onTab(t: string) { tab.value = t as 'locked' | 'life' | 'calib'; fetch() }
function goDetail(id?: string) { if (id) router.push(`/tlm/tooling/${id}`) }

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">异常</span></div>
        <h1>工装异常<span class="no mono">ABNORMAL</span></h1>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-radio-group v-model="tab" @change="(t:any)=>onTab(t)">
        <el-radio-button value="locked">锁定</el-radio-button>
        <el-radio-button value="life">寿命超限</el-radio-button>
        <el-radio-button value="calib">校准逾期</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>异常清单</h2></div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="toolNo" label="编号" width="150"><template #default="{ row }"><span class="mono c-cobalt">{{ row.toolNo }}</span></template></el-table-column>
        <el-table-column prop="toolName" label="名称" min-width="180" />
        <el-table-column label="异常类型" width="120"><template #default="{ row }"><span class="pill" :class="abnPill(tab)"><span class="d"></span>{{ abnText(tab) }}</span></template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template></el-table-column>
        <el-table-column label="数值" width="160">
          <template #default="{ row }">
            <span class="mono" v-if="tab === 'life'">{{ row.bindCount }}/{{ row.designLife }}</span>
            <span class="mono" v-else-if="tab === 'calib'">{{ row.calibDueDate }}</span>
            <span class="mono" v-else>{{ row.locked ? '已锁定' : '正常' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="goDetail(row.id)">详情</el-button></template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && list.length === 0" style="padding:32px;text-align:center;color:$ink-faint;">暂无异常工装</div>
    </el-card>
  </div>
</template>
