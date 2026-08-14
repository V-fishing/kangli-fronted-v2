<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TlmScrap } from '@/api/types/tlm'
import { tlmScrapApi } from '@/api/modules/tlm/scrap'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const perm = usePermissionStore()

const list = ref<TlmScrap[]>([])
const loading = ref(false)
const keyword = ref('')
const filterStatus = ref('')
const page = ref(1), size = ref(20), total = ref(0)

function goApprove() {
  router.push('/workbench/tasks')
}

const statusPill = (s: string) => {
  switch (s) {
    case 'PENDING': return 'p-wait'
    case 'APPROVED': return 'p-done'
    case 'REJECTED': return 'p-lock'
    default: return 'p-wait'
  }
}
const statusText = (s: string) => ({ PENDING: '待审批', APPROVED: '已通过', REJECTED: '已驳回' }[s] || s)
const methodText = (m: string) => (m === 'RETURN' ? '退供应商' : m === 'DESTROY' ? '销毁' : m || '—')

async function fetch() {
  loading.value = true
  try {
    const res = await tlmScrapApi.page({
      keyword: keyword.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载报废单失败')
  } finally {
    loading.value = false
  }
}

function onSearch() { page.value = 1; fetch() }
function goTooling(row: TlmScrap) {
  if (row.toolId) router.push(`/tlm/tooling/${row.toolId}`)
}

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">报废管理</span></div>
        <h1>工装报废单<span class="no mono">TLM</span></h1>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="报废单号 / 工装编号 / 名称" clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:140px" @change="onSearch">
            <el-option label="待审批" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>报废单清单</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="报废单号" width="190">
          <template #default="{ row }"><span class="mono c-cobalt">{{ row.scrapNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="工装" min-width="200">
          <template #default="{ row }">
            <span class="mono">{{ row.toolNo || '—' }}</span>
            <span v-if="row.toolName" style="margin-left:6px;">{{ row.toolName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="报废方式" width="120">
          <template #default="{ row }"><span class="tag-b">{{ methodText(row.scrapMethod) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column prop="reason" label="报废原因" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }"><span class="mono">{{ row.createdAt || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goTooling(row)">详情</el-button>
            <el-button v-if="row.status === 'PENDING' && perm.has('tlm.scrap.approve')" link type="primary" size="small" @click="goApprove">去审批</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination :current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next"
          @current-change="(p:number)=>{page=p;fetch()}" />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page-wrap :deep(.pill) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}
.page-wrap :deep(.pill .d) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.page-wrap :deep(.p-wait) { background: $amber-dim; color: $amber; }
.page-wrap :deep(.p-wait .d) { background: $amber; }
.page-wrap :deep(.p-run) { background: $cobalt-dim; color: $cobalt; }
.page-wrap :deep(.p-run .d) { background: $cobalt; }
.page-wrap :deep(.p-lock) { background: $signal-red-dim; color: $signal-red; }
.page-wrap :deep(.p-lock .d) { background: $signal-red; }
.page-wrap :deep(.p-done) { background: $green-dim; color: $green; }
.page-wrap :deep(.p-done .d) { background: $green; }
.page-wrap :deep(.p-mute) { background: $ink-faint-dim; color: $ink-faint; }
.page-wrap :deep(.p-mute .d) { background: $ink-faint; }
.page-wrap :deep(.tag-b) {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  background: $cobalt-dim;
  color: $cobalt;
  font-size: 12px;
  font-weight: 600;
}
</style>
