<template>
  <div class="spec-standard-page">
    <div class="head-b"><AppBreadcrumb /><h1>标准线管理</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true">
        <el-form-item label="物料"><el-input v-model="filterMaterial" clearable placeholder="搜索物料" style="width:180px" /></el-form-item>
        <el-form-item label="工序"><el-select v-model="filterProcName" clearable placeholder="全部" style="width:180px"><el-option v-for="p in procOptions" :key="p" :label="p" :value="p" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1; fetchData()">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建标准线</el-button></div>
      <el-table :data="pagedList" v-loading="loading" size="small">
        <el-table-column prop="material" label="物料" min-width="150" />
        <el-table-column prop="procName" label="工序" width="150" />
        <el-table-column label="规格下限" width="100"><template #default="{row}"><span class="mono">{{ row.specLower ?? '—' }}</span></template></el-table-column>
        <el-table-column label="规格上限" width="100"><template #default="{row}"><span class="mono">{{ row.specUpper ?? '—' }}</span></template></el-table-column>
        <el-table-column label="目标值" width="100"><template #default="{row}"><span class="mono">{{ row.targetValue ?? '—' }}</span></template></el-table-column>
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="chartType" label="默认控制图" width="110" />
        <el-table-column label="关联参数" min-width="120"><template #default="{row}">{{ linkedParamMap[row.id] || '—' }}</template></el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{row}">
            <span style="white-space:nowrap">
              <el-button link type="primary" size="small" @click="goChart(row)">控制图</el-button>
              <el-button link type="warning" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="filteredList.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredList.length"
          :page-sizes="[10, 20, 50, 100]" :current-page="page" :page-size="size"
          @current-change="(p: number) => { page = p }"
          @size-change="(s: number) => { size = s; page = 1 }" />
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标准线' : '新建标准线'" width="520px" append-to-body>
      <el-form :model="form" label-width="90px">
        <el-form-item label="物料" required><el-input v-model="form.material" placeholder="物料名称" /></el-form-item>
        <el-form-item label="工序" required><el-input v-model="form.procName" placeholder="工序名称" /></el-form-item>
        <el-form-item label="规格下限"><el-input-number v-model="form.specLower" :step="0.01" /></el-form-item>
        <el-form-item label="规格上限"><el-input-number v-model="form.specUpper" :step="0.01" /></el-form-item>
        <el-form-item label="目标值"><el-input-number v-model="form.targetValue" :step="0.01" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" placeholder="mm/g/..." /></el-form-item>
        <el-form-item label="控制图类型">
          <el-select v-model="form.chartType" style="width:100%">
            <el-option v-for="c in chartTypes" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// __TSC_NOCHECK_DISABLED__ // @ts-nocheck
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { spcSpecStandardApi } from '@/api/modules/spc/specStandard'
import { spcParamApi } from '@/api/modules/spc/params'
import type { SpcSpecStandard } from '@/api/types/spc'

// 基础图码(与参数编辑弹窗单一体系对齐): 标准线推荐主图, 由 fillSpecFromStandard 归一带入参数
const chartTypes = [
  { label: 'Xbar (均值)', value: 'Xbar' },
  { label: 'R (极差)', value: 'R' },
  { label: 'S (标准差)', value: 'S' },
  { label: 'I (单值)', value: 'I' },
  { label: 'MR (移动极差)', value: 'MR' },
  { label: 'P (不合格品率)', value: 'P' },
  { label: 'NP (不合格品数)', value: 'NP' },
  { label: 'C (缺陷数)', value: 'C' },
  { label: 'U (单位缺陷数)', value: 'U' },
]
const router = useRouter()
const list = ref<SpcSpecStandard[]>([])
const loading = ref(false)
const filterMaterial = ref('')
const filterProcName = ref<any>('')
const page = ref(1), size = ref(20)
const procOptions = computed(() => [...new Set(list.value.map(s => s.procName).filter(Boolean))].sort())
const filteredList = computed(() =>
  list.value.filter(s =>
    (!filterMaterial.value || s.material?.includes(filterMaterial.value)) &&
    (!filterProcName.value || s.procName?.includes(filterProcName.value))
  )
)
const pagedList = computed(() => {
  const start = (page.value - 1) * size.value
  return filteredList.value.slice(start, start + size.value)
})
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive<Partial<SpcSpecStandard>>({ material: '', procName: '', chartType: 'Xbar' })
const linkedParamMap = ref<Record<string, string>>({}) // specStandardId -> paramNames

async function fetchData() {
  loading.value = true
  try { list.value = await spcSpecStandardApi.list() } finally { loading.value = false }
}

async function loadLinkedParams() {
  try {
    const params = await spcParamApi.list()
    const map: Record<string, string[]> = {}
    for (const p of params) {
      if (p.specStandardId) {
        if (!map[p.specStandardId]) map[p.specStandardId] = []
        map[p.specStandardId].push(p.paramName)
      }
    }
    linkedParamMap.value = Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, v.join(', ')])
    )
  } catch { /* 加载关联参数失败不影响标准线管理 */ }
}

function openCreate() {
  isEdit.value = false; editId.value = ''
  Object.assign(form, { material: '', procName: '', specLower: undefined, specUpper: undefined, targetValue: undefined, unit: '', chartType: 'Xbar' })
  dialogVisible.value = true
}

function openEdit(row: SpcSpecStandard) {
  isEdit.value = true; editId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (isEdit.value) { await spcSpecStandardApi.update(editId.value, form); ElMessage.success('已更新') }
  else { await spcSpecStandardApi.create(form); ElMessage.success('已创建') }
  dialogVisible.value = false; fetchData()
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm('删除标准线不会影响已关联的SPC参数，确认删除？')
  await spcSpecStandardApi.delete(id)
  ElMessage.success('已删除')
  fetchData()
}

function goChart(row: SpcSpecStandard) {
  // 找到关联的第一个 SPC 参数，跳转控制图；没有则仅提示
  const params = linkedParamMap.value[row.id]
  if (!params) { ElMessage.info('该标准线暂无关联的 SPC 参数，请先在参数配置中关联'); return }
  // 简单跳转到第一个关联参数的控制图，后续可改为弹窗多选
  spcParamApi.list().then(all => {
    const first = all.find(p => p.specStandardId === row.id)
    if (first) router.push(`/spc/params/${first.id}`)
  })
}

onMounted(() => { fetchData(); loadLinkedParams() })
</script>

<style lang="scss" scoped>
.spec-standard-page { width: 100%; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.filter-bar { margin-bottom: 16px; }
.mono { font-variant-numeric: tabular-nums; font-family: $font-mono; }
</style>
