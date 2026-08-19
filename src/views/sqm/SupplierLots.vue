<template>
  <div class="supplier-lots">
    <div class="head-b">
      <el-button link @click="router.back()">← 返回</el-button>
      <AppBreadcrumb />
      <h1>来料批次 · {{ supplierName || supplierId }}</h1>
    </div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px">
        <el-input v-model="keyword" clearable placeholder="批号 / 物料名 / 物料编码" style="width:260px" @input="reset(); fetch()" />
        <span style="margin-left:12px;color:#999;font-size:12px">共 {{ total }} 批</span>
      </div>
      <el-table :data="all" v-loading="loading" size="small" border stripe>
        <el-table-column prop="lotNo" label="批号" min-width="160" />
        <el-table-column prop="partName" label="产品/物料名" min-width="160" />
        <el-table-column prop="partNo" label="物料编码" width="140" />
        <el-table-column label="数量" width="130">
          <template #default="{row}">
            {{ row.qty ?? 0 }}<span v-if="row.usedQty" style="color:#999"> / 用{{ row.usedQty }}</span>
          </template>
        </el-table-column>
        <el-table-column label="IQC" width="120">
          <template #default="{row}">
            <el-tag :type="row.iqcPass ? 'success' : 'info'" size="small">{{ row.iqcPass ? '已通过' : '未通过' }}</el-tag>
            <div style="font-size:11px;color:#999;margin-top:2px">{{ row.inspectResult || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="inspectType" label="检验类型" width="100" />
        <el-table-column label="关键件" width="70">
          <template #default="{row}">
            <el-tag v-if="row.isKeyPart" type="warning" size="small">关键</el-tag><span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="receiveDate" label="接收日期" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="goTrace(row)">追溯 →</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && all.length === 0" style="padding:28px;text-align:center;color:#999">该供应商暂无来料批次（来料首件合格后才会免审直录到此）</div>
      <div style="margin-top:12px;display:flex;justify-content:flex-end" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" :current-page="page" :page-size="size"
          @current-change="(p: number) => { page = p; fetch() }"
          @size-change="(s: number) => { size = s as number; page = 1; fetch() }" small />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import type { SqmIncomingLot } from '@/api/types/sqm'

const route = useRoute()
const router = useRouter()
const supplierId = (route.query.supplierId as string) || ''
const supplierName = (route.query.supplierName as string) || ''

const all = ref<SqmIncomingLot[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const size = usePageSize()
const total = ref(0)

function reset() { page.value = 1 }
async function fetch() {
  loading.value = true
  try {
    const res = await sqmTraceApi.listLotsPage({ keyword: keyword.value || undefined, supplierId: supplierId || undefined, page: page.value, size: size.value })
    all.value = res.records
    total.value = res.total
  } finally { loading.value = false }
}
function goTrace(row: any) {
  // 统一到方案 B: 以来料批次号定位源表条码集合, 在 MesTraceView 渲染 MES 追溯森林
  router.push({ path: '/sqm/trace/mes-view', query: { lotNo: row.lotNo } })
}
onMounted(fetch)
</script>

<style lang="scss" scoped>
.supplier-lots { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin: 6px 0; }
.head-b h1 { font-family: $font-display; font-size: 26px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>
