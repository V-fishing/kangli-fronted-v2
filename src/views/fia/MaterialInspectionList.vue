<template>
  <div class="material-list">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>物料检验</h1>
      </div>
      <div class="head-actions">
        <el-button type="primary" :disabled="!canCreate" @click="router.push('/fia/material-inspection/create')">+ 新建物料检验</el-button>
      </div>
    </div>

    <!-- 搜索区(独立卡) -->
    <el-card class="card-b filter-bar" shadow="never" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" :model="filter" @submit.prevent>
        <el-form-item label="物料编码">
          <el-input v-model="filter.materialCode" clearable placeholder="物料编码" style="width:160px" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="filter.supplierName" clearable placeholder="供应商名称" style="width:180px" />
        </el-form-item>
        <el-form-item label="判定结论">
          <el-select v-model="filter.inspectionResult" clearable placeholder="全部" style="width:130px">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
            <el-option label="让步接收" value="让步接收" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" clearable placeholder="批次/条码/记录号/物料名" style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData(1)">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
      <el-radio-group v-model="segResult" class="seg" @change="onSegChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="合格">合格</el-radio-button>
        <el-radio-button value="不合格">不合格</el-radio-button>
        <el-radio-button value="让步接收">让步接收</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 列表区(独立卡) -->
    <el-card class="card-b" shadow="never" :body-style="{ padding: '0' }">
      <div class="card-head">
        <span class="card-title">检验记录</span>
        <span class="card-sub mono">{{ total }} 条</span>
      </div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column label="记录编号" width="210">
          <template #default="{ row }"><span class="mono">{{ row.recordNo || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="supplierName" label="供应商" min-width="140" />
        <el-table-column label="批次号" width="140">
          <template #default="{ row }"><span class="mono">{{ row.materialBatchNo || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="判定结论" width="110">
          <template #default="{ row }">
            <span class="pill" :class="judgeClass(row.inspectionResult)">{{ row.inspectionResult || '未判定' }}</span>
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
              <el-dropdown v-if="canEdit || canDelete" @command="(c:any)=>onCommand(c,row)">
                <el-button link type="primary" size="small">更多 ▾</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="canEdit" :command="{cmd:'edit',row}">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="canDelete" :command="{cmd:'delete',row}" divided style="color:var(--el-color-danger)">删除</el-dropdown-item>
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
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { materialInspectionApi } from '@/api/modules/fia/materialInspection'
import { usePermissionStore } from '@/stores/permission'
import type { MaterialInspectionVO, MaterialInspectionPageQuery } from '@/api/types/fia'

const router = useRouter()
const perm = usePermissionStore()
const canCreate = computed(() => perm.has('fia.material.create'))
const canEdit = computed(() => perm.has('fia.material.edit'))
const canDelete = computed(() => perm.has('fia.material.delete'))

const list = ref<MaterialInspectionVO[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const segResult = ref('')

const filter = reactive<MaterialInspectionPageQuery>({
  materialCode: '',
  supplierName: '',
  inspectionResult: '',
  keyword: '',
})

function onSegChange() { filter.inspectionResult = segResult.value; fetchData(1) }
function resetFilter() {
  filter.materialCode = ''; filter.supplierName = ''; filter.inspectionResult = ''; filter.keyword = ''
  segResult.value = ''; fetchData(1)
}

async function fetchData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const r = await materialInspectionApi.page({
      materialCode: filter.materialCode || undefined,
      supplierName: filter.supplierName || undefined,
      inspectionResult: filter.inspectionResult || undefined,
      keyword: filter.keyword || undefined,
      page: page.value,
      size: pageSize.value,
    })
    list.value = r.records || []
    total.value = r.total ?? 0
  } catch { /* request 已弹错 */ }
  finally { loading.value = false }
}

function goDetail(row: MaterialInspectionVO) {
  router.push(`/fia/material-inspection/${row.id}`)
}

function onCommand(c: { cmd: string; row: MaterialInspectionVO }, _row: MaterialInspectionVO) {
  if (c.cmd === 'edit') goDetail(c.row)
  else if (c.cmd === 'delete') doDelete(c.row)
}

async function doDelete(row: MaterialInspectionVO) {
  try {
    await ElMessageBox.confirm(`确认删除检验记录 ${row.recordNo || row.materialCode}?`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await materialInspectionApi.remove(row.id!)
    ElMessage.success('已删除')
    fetchData()
  } catch { /* request 已弹错 */ }
}

function judgeClass(j?: string): string {
  const m: Record<string, string> = { '合格': 'p-done', '不合格': 'p-lock', '让步接收': 'p-wait' }
  return m[j || ''] || 'p-mute'
}
function signoffText(row: MaterialInspectionVO): string {
  if (row.signatureUser) return '已签核'
  if (row.reviewer) return '已评审'
  if (row.inspectionResult) return '待签核'
  return '待检验'
}
function signoffClass(row: MaterialInspectionVO): string {
  const t = signoffText(row)
  return { '已签核': 'p-done', '已评审': 'p-sign', '待签核': 'p-wait', '待检验': 'p-mute' }[t] || 'p-mute'
}

onMounted(() => fetchData(1))
</script>

<style lang="scss" scoped>
.seg { margin-top: 10px; }
.op { display: flex; align-items: center; gap: 10px; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid $hairline; }
.card-title { font-family: $font-display; font-size: 16px; font-weight: 600; color: $ink; }
.card-sub { font-size: 12px; color: $ink-faint; }
.pager { padding: 14px 22px; display: flex; justify-content: flex-end; }
</style>
