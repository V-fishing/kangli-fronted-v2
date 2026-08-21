<template>
  <div class="finish-list">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>完工检验</h1>
      </div>
      <div class="head-actions">
        <el-button type="primary" :disabled="!canCreate" @click="onCreate">+ 新建{{ isMaterial ? '物料检验' : '完工检验' }}</el-button>
      </div>
    </div>

    <!-- 搜索区(独立卡) -->
    <el-card class="card-b filter-bar" shadow="never" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" :model="filter" @submit.prevent>
        <el-form-item v-if="!isMaterial && !isMerged" label="生产订单号">
          <el-input v-model="filter.productionOrderNo" clearable placeholder="生产订单号" style="width:180px" />
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="filter.materialCode" clearable placeholder="物料编码" style="width:160px" />
        </el-form-item>
        <el-form-item v-if="!isMaterial && !isMerged" label="品类">
          <el-select v-model="filter.category" clearable placeholder="全部" style="width:130px">
            <el-option label="成品" value="成品" />
            <el-option label="半成品" value="半成品" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isMaterial" label="供应商">
          <el-input v-model="filter.supplierName" clearable placeholder="供应商名称" style="width:180px" />
        </el-form-item>
        <el-form-item v-if="isMaterial" label="判定结论">
          <el-select v-model="filter.inspectionResult" clearable placeholder="全部" style="width:130px">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
            <el-option label="让步接收" value="让步接收" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isMaterial || isMerged" label="关键字">
          <el-input v-model="filter.keyword" clearable placeholder="编号/订单/名称/供应商/批次" style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData(1)">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
      <el-radio-group v-model="segCategory" class="seg" @change="onSegChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="成品">成品</el-radio-button>
        <el-radio-button value="半成品">半成品</el-radio-button>
        <el-radio-button value="material">物料</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 列表区(独立卡) -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '0' }">
      <div class="card-head">
        <span class="card-title">{{ isMaterial ? '物料检验记录' : (isMerged ? '检验记录' : '完工检验记录') }}</span>
        <span class="card-sub mono">{{ total }} 条</span>
      </div>
      <el-table :data="list" v-loading="loading" size="small">
        <!-- 完工档列(成品/半成品) -->
        <template v-if="!isMaterial && !isMerged">
          <el-table-column label="报告编号" width="200">
            <template #default="{ row }"><span class="mono">{{ row.reportNo || '-' }}</span></template>
          </el-table-column>
          <el-table-column label="生产订单号" width="160">
            <template #default="{ row }"><span class="mono">{{ row.productionOrderNo || '-' }}</span></template>
          </el-table-column>
          <el-table-column prop="materialCode" label="物料编码" width="130" />
          <el-table-column prop="productName" label="产品名称" min-width="140" />
          <el-table-column label="品类" width="90">
            <template #default="{ row }"><span class="pill">{{ row.category || '-' }}</span></template>
          </el-table-column>
        </template>
        <!-- 全部档列(完工 + 物料 合并) -->
        <template v-else-if="isMerged">
          <el-table-column label="来源" width="80">
            <template #default="{ row }">
              <span class="pill" :class="row.srcType === 'material' ? 'p-wait' : 'p-sign'">{{ row.srcType === 'material' ? '物料' : '完工' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="编号" width="200">
            <template #default="{ row }"><span class="mono">{{ row.srcType === 'material' ? row.recordNo : row.reportNo }}</span></template>
          </el-table-column>
          <el-table-column label="生产订单号" width="150">
            <template #default="{ row }"><span class="mono">{{ row.productionOrderNo || '-' }}</span></template>
          </el-table-column>
          <el-table-column prop="materialCode" label="物料编码" width="120" />
          <el-table-column label="名称" min-width="150">
            <template #default="{ row }">{{ row.productName || row.materialName || '-' }}</template>
          </el-table-column>
          <el-table-column label="品类" width="80">
            <template #default="{ row }">{{ row.srcType === 'material' ? '-' : (row.category || '-') }}</template>
          </el-table-column>
          <el-table-column label="供应商" min-width="120">
            <template #default="{ row }">{{ row.supplierName || '-' }}</template>
          </el-table-column>
        </template>
        <!-- 物料档列 -->
        <template v-else>
          <el-table-column label="记录编号" width="210">
            <template #default="{ row }"><span class="mono">{{ row.recordNo || '-' }}</span></template>
          </el-table-column>
          <el-table-column prop="materialCode" label="物料编码" width="130" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="supplierName" label="供应商" min-width="140" />
          <el-table-column label="批次号" width="140">
            <template #default="{ row }"><span class="mono">{{ row.materialBatchNo || '-' }}</span></template>
          </el-table-column>
        </template>
        <el-table-column label="判定结论" width="110">
          <template #default="{ row }">
            <span class="pill" :class="judgeClass(row)">{{ row.inspectionResult || '未判定' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="签核状态" width="110">
          <template #default="{ row }">
            <span class="pill" :class="signoffClass(row)">{{ signoffText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="op">
              <el-button link type="primary" size="small" @click="goDetail(row)">详情</el-button>
              <el-dropdown v-if="perm.has(rowActionPerm(row, 'edit')) || perm.has(rowActionPerm(row, 'delete'))"
                @command="(c:any)=>onCommand(c,row)">
                <el-button link type="primary" size="small">更多 ▾</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="perm.has(rowActionPerm(row, 'edit'))" :command="{cmd:'edit',row}">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="perm.has(rowActionPerm(row, 'delete'))" :command="{cmd:'delete',row}" divided style="color:var(--el-color-danger)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          layout="total, prev, pager, next"
          :total="total" :page-size="pageSize" :current-page="page"
          @current-change="(p:number)=>fetchData(p)" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { finishInspectionApi } from '@/api/modules/fia/finishInspection'
import { materialInspectionApi } from '@/api/modules/fia/materialInspection'
import { mergedInspectionApi } from '@/api/modules/fia/mergedInspection'
import { usePermissionStore } from '@/stores/permission'

/** 行宽类型:完工(MES finished_goods_inspection)与物料(MES material_inspection)两套字段取并集;全部档带 srcType */
interface RowVO {
  id?: string
  srcType?: string
  reportNo?: string
  recordNo?: string
  productionOrderNo?: string
  materialCode?: string
  productName?: string
  materialName?: string
  category?: string
  supplierName?: string
  materialBatchNo?: string
  inspectionResult?: string
  signatureUser?: string
  mgrApproval?: string
  qcReviewer?: string
  inspectedQty?: string | number | null
  reviewer?: string
  [key: string]: any
}

const router = useRouter()
const route = useRoute()
const perm = usePermissionStore()

/** 分段: ''=全部 / 成品 / 半成品 / material=物料 */
const segCategory = ref('')
const isMaterial = computed(() => segCategory.value === 'material')
/** 全部档 = 完工 + 物料 合并 */
const isMerged = computed(() => segCategory.value === '')

/** 行是否物料来源:物料档恒真;全部档按行 srcType 判断 */
function rowMaterial(row: RowVO): boolean {
  return isMaterial.value || (isMerged.value && row.srcType === 'material')
}
function rowActionPerm(row: RowVO, action: string): string {
  return rowMaterial(row) ? `fia.material.${action}` : `fia.finish.${action}`
}

const canCreate = computed(() => perm.has(isMaterial.value ? 'fia.material.create' : 'fia.finish.create'))

const list = ref<RowVO[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filter = reactive({
  productionOrderNo: '',
  category: '',
  materialCode: '',
  supplierName: '',
  inspectionResult: '',
  keyword: '',
})

function onSegChange() {
  if (isMaterial.value || isMerged.value) {
    filter.productionOrderNo = ''; filter.category = ''
    filter.supplierName = ''; filter.inspectionResult = ''
  } else {
    filter.category = segCategory.value
    filter.supplierName = ''; filter.inspectionResult = ''
  }
  fetchData(1)
}
function resetFilter() {
  filter.productionOrderNo = ''; filter.category = ''; filter.materialCode = ''
  filter.supplierName = ''; filter.inspectionResult = ''; filter.keyword = ''
  segCategory.value = ''; fetchData(1)
}

async function fetchData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const q = { page: page.value, size: pageSize.value }
    const r: any = isMaterial.value
      ? await materialInspectionApi.page({
          materialCode: filter.materialCode || undefined,
          supplierName: filter.supplierName || undefined,
          inspectionResult: filter.inspectionResult || undefined,
          keyword: filter.keyword || undefined,
          ...q,
        })
      : isMerged.value
        ? await mergedInspectionApi.page({
            materialCode: filter.materialCode || undefined,
            keyword: filter.keyword || undefined,
            ...q,
          })
        : await finishInspectionApi.page({
            category: filter.category || undefined,
            productionOrderNo: filter.productionOrderNo || undefined,
            materialCode: filter.materialCode || undefined,
            keyword: filter.keyword || undefined,
            ...q,
          })
    list.value = r?.records || []
    total.value = r?.total ?? 0
  } catch { /* request 已弹错 */ }
  finally { loading.value = false }
}

function onCreate() {
  if (isMaterial.value) router.push('/fia/material-inspection/create')
  else router.push({ path: '/fia/finish-inspection/create', query: { category: segCategory.value || undefined } })
}
function goDetail(row: RowVO) {
  router.push(rowMaterial(row) ? `/fia/material-inspection/${row.id}` : `/fia/finish-inspection/${row.id}`)
}

function onCommand(c: { cmd: string; row: RowVO }, _row: RowVO) {
  if (c.cmd === 'edit') goDetail(c.row)
  else if (c.cmd === 'delete') doDelete(c.row)
}

async function doDelete(row: RowVO) {
  const mt = rowMaterial(row)
  const label = mt ? (row.recordNo || row.materialCode) : (row.reportNo || row.productionOrderNo)
  try {
    await ElMessageBox.confirm(`确认删除${mt ? '检验记录 ' : '报告 '}${label}?`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    if (mt) await materialInspectionApi.remove(row.id!)
    else await finishInspectionApi.remove(row.id!)
    ElMessage.success('已删除')
    fetchData()
  } catch { /* request 已弹错 */ }
}

function judgeClass(row: RowVO): string {
  const m: Record<string, string> = rowMaterial(row)
    ? { '合格': 'p-done', '不合格': 'p-lock', '让步接收': 'p-wait' }
    : { '合格': 'p-done', '不合格': 'p-lock', '警告': 'p-wait' }
  return m[row.inspectionResult || ''] || 'p-mute'
}
function signoffText(row: RowVO): string {
  if (rowMaterial(row)) {
    if (row.signatureUser) return '已签核'
    if (row.reviewer) return '已评审'
    if (row.inspectionResult) return '待签核'
    return '待检验'
  }
  if (row.signatureUser || row.mgrApproval) return '已签核'
  if (row.qcReviewer) return '已复核'
  if (row.inspectedQty != null && row.inspectedQty !== '') return '待签核'
  return '待检验'
}
function signoffClass(row: RowVO): string {
  const t = signoffText(row)
  const m: Record<string, string> = rowMaterial(row)
    ? { '已签核': 'p-done', '已评审': 'p-sign', '待签核': 'p-wait', '待检验': 'p-mute' }
    : { '已签核': 'p-done', '已复核': 'p-sign', '待签核': 'p-wait', '待检验': 'p-mute' }
  return m[t] || 'p-mute'
}

onMounted(() => {
  const seg = route.query.seg as string | undefined
  if (seg === 'material') segCategory.value = 'material'
  else if (seg === '成品' || seg === '半成品') {
    segCategory.value = seg
    filter.category = seg
  }
  fetchData(1)
})
</script>

<style lang="scss" scoped>
.seg { margin-top: 10px; }
.op { display: flex; align-items: center; gap: 10px; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid $hairline; }
.card-title { font-family: $font-display; font-size: 16px; font-weight: 600; color: $ink; }
.card-sub { font-size: 12px; color: $ink-faint; }
.pager { padding: 14px 22px; display: flex; justify-content: flex-end; }
</style>
