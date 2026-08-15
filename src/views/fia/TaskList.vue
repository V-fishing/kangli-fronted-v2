<template>
  <div class="task-list">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>任务列表</h1>
      </div>
      <div class="head-actions">
        <button class="btn-fill" @click="router.push('/fia/tasks/create')">+ 新建检验任务</button>
      </div>
    </div>

    <el-card class="card-b filter-bar" shadow="never">
      <el-form :inline="true" :model="filter" @submit.prevent="fetchData">
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width:140px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品/工序">
          <el-cascader v-model="productProc" :options="productTreeOptions" :props="{ expandTrigger: 'hover' }"
            clearable placeholder="选择产品→工序" style="width:260px" @change="onProductProcChange" />
        </el-form-item>
        <el-form-item label="工单号">
          <el-input v-model="filter.woNo" clearable placeholder="请输入" style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="card-b">
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="code" label="校验单号" width="170" />
        <el-table-column prop="woNo" label="工单号" width="150" />
        <el-table-column prop="productName" label="产品" min-width="140" />
        <el-table-column prop="procName" label="工序" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span class="pill" :class="statusClass(row.status)">
              <span class="d"></span>{{ row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="判定" width="90">
          <template #default="{ row }">
            <span class="pill" :class="judgeClass(row.overallJudge)">{{ row.overallJudge || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push(`/fia/tasks/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="padding:16px; text-align:right">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @current-change="fetchData" @size-change="fetchData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import type { FiaTask, FiaTaskStatus, ProductTreeNode } from '@/api/types/fia'

const router = useRouter()
const list = ref<FiaTask[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(20)
const filter = reactive({ status: '', woNo: '', productName: '', procName: '' })
const statusOptions: FiaTaskStatus[] = ['待检', '进行中', '待复核', '待批准', '审批中', '已完成', '超时', '已作废', '已驳回']

// 产品→工序 二级树(cascader)
const productProc = ref<(string | null)[]>([])
type CascaderNode = { value: string; label: string; children?: CascaderNode[] }
const productTreeOptions = ref<CascaderNode[]>([])
async function loadProductTree() {
  try {
    const nodes = await fiaTaskApi.productTree().catch(() => [] as ProductTreeNode[])
    productTreeOptions.value = (nodes || []).map(n => ({
      value: n.productName,
      label: n.productName,
      children: (n.procNames || []).map(p => ({ value: p, label: p })),
    }))
  } catch { /* */ }
}
function onProductProcChange(val: (string | null)[]) {
  // 选中二级节点 = [productName, procName];仅选一级节点 = [productName]
  const [productName, procName] = val || []
  filter.productName = productName || ''
  filter.procName = procName || ''
  page.value = 1
  fetchData()
}

function statusClass(s: FiaTaskStatus): string {
  const m: Record<string, string> = {
    '待检': 'p-wait', '进行中': 'p-run', '待复核': 'p-sign', '待批准': 'p-sign',
    '审批中': 'p-run', '已完成': 'p-done', '超时': 'p-lock', '已作废': 'p-lock', '已驳回': 'p-lock',
  }
  return m[s] || ''
}
function judgeClass(j?: string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '警告': 'p-wait' }
  return m[j || ''] || ''
}

async function fetchData() {
  loading.value = true
  try {
    const res = await fiaTaskApi.list({
      page: page.value, size: size.value,
      status: filter.status || undefined,
      woNo: filter.woNo || undefined,
      productName: filter.productName || undefined,
      procName: filter.procName || undefined,
    })
    list.value = res ?? []
    total.value = list.value.length
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadProductTree(); fetchData() })
</script>
