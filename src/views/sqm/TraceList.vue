<template>
  <div class="tl-page">
    <div class="head-b">物料追溯</div>

    <!-- 顶部 tab：总表(合并三表) + 三个独立子表(不动) -->
    <div class="tl-tabs">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="tl-tab"
        :class="{ active: activeTab === t.value }"
        @click="switchTab(t.value)"
      >{{ t.label }}</button>
    </div>

    <!-- 搜索栏：来源类型筛选 + 关键字 + 查询 + 新建 -->
    <div class="tl-bar">
      <div class="tl-bar-l">
        <el-select v-model="filterType" placeholder="来源类型" clearable style="width: 150px" @change="onFilterChange">
          <el-option label="全部" value="" />
          <el-option label="物料" value="material" />
          <el-option label="半成品" value="semi" />
          <el-option label="成品" value="finished" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="输入批次号 / 编码 / 名称查询"
          clearable
          style="width: 300px"
          @keyup.enter="doSearch"
        />
        <button class="btn-b" @click="doSearch">查询</button>
        <el-button type="primary" link @click="lotDialogVisible = true">+ 新建来料批次</el-button>
      </div>
      <span class="tl-summary" v-if="total > 0">共 <b class="mono">{{ total }}</b> 条</span>
    </div>

    <!-- 大表：总表(合并三表, 精简列 + 来源类型列) / 三个子表(各自关键字段列) -->
    <div class="tl-card">
      <el-table
        :data="rows"
        border
        stripe
        size="small"
        v-loading="loading"
        max-height="calc(100vh - 250px)"
        :row-class-name="() => 'tl-row'"
      >
        <!-- ===== 总表(全部)：合并视图, 保持原精简列 + 类型列 ===== -->
        <template v-if="isAll">
          <el-table-column label="来源类型" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="typeTag(row.bizType)">{{ typeLabel(row.bizType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="code" label="编码" width="140" show-overflow-tooltip />
          <el-table-column label="批次 / 条码" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono">{{ row.batchNo || row.barcode || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100" align="right">
            <template #default="{ row }">
              <span class="mono">{{ row.qty != null ? row.qty + (row.unit || '') : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="日期" width="120" align="center">
            <template #default="{ row }">
              <span class="mono">{{ row.nodeDate || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="plantCode" label="工厂" width="90" align="center" />
        </template>

        <!-- ===== 子表(物料/半成品/成品)：各自关键字段列 ===== -->
        <template v-else>
          <el-table-column prop="batchNo" label="批号" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono">{{ row.batchNo || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="料号" width="150" show-overflow-tooltip />
          <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="barcode" label="条码" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono">{{ row.barcode || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'material'" prop="supplierName" label="供应商" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.supplierName || '-' }}</span>
            </template>
          </el-table-column>
          <!-- 物料表：检验申请单号 ; 半成品/成品表：生产订单号 -->
          <el-table-column v-if="activeTab === 'material'" prop="inspectRequestNo" label="检验申请单号" width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono">{{ row.inspectRequestNo || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-else prop="productionOrder" label="生产订单号" width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono">{{ row.productionOrder || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="inspectResult" label="检验结论" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="resultTag(row.inspectResult)">{{ row.inspectResult || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="110" align="right">
            <template #default="{ row }">
              <span class="mono">{{ row.qty != null ? row.qty + (row.unit || '') : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="日期" width="120" align="center">
            <template #default="{ row }">
              <span class="mono">{{ row.nodeDate || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="plantCode" label="工厂" width="90" align="center" />
        </template>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goMesTrace(row)">追溯</el-button>
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="tl-pager">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <!-- 新建来料批次弹窗 -->
    <el-dialog v-model="lotDialogVisible" title="新建来料批次" width="560px" :close-on-click-modal="false" @closed="resetLotForm" append-to-body>
      <el-form :model="lotForm" :rules="lotRules" ref="lotFormRef" label-width="100px">
        <el-form-item label="批次号" prop="lotNo"><el-input v-model="lotForm.lotNo" placeholder="请输入批次号" /></el-form-item>
        <el-form-item label="物料编码" prop="partNo"><el-input v-model="lotForm.partNo" placeholder="请输入物料编码" /></el-form-item>
        <el-form-item label="物料名称"><el-input v-model="lotForm.partName" placeholder="请输入物料名称" /></el-form-item>
        <el-form-item label="供应商" prop="supplierName"><el-input v-model="lotForm.supplierName" placeholder="请输入供应商" /></el-form-item>
        <el-form-item label="数量" prop="qty"><el-input-number v-model="lotForm.qty" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="lotForm.unit" placeholder="如：个、kg" /></el-form-item>
        <el-form-item label="收货日期"><el-date-picker v-model="lotForm.incomingDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="检验结果"><el-select v-model="lotForm.inspectResult" style="width: 100%"><el-option label="合格" value="合格" /><el-option label="不合格" value="不合格" /><el-option label="待检" value="待检" /></el-select></el-form-item>
        <el-form-item label="是否关键件"><el-switch v-model="lotForm.isKeyPart" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="lotForm.remark" type="textarea" rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="lotDialogVisible = false">取消</el-button><el-button type="primary" :loading="lotSubmitting" @click="submitLot">确认创建</el-button></template>
    </el-dialog>

    <!-- 源表全字段明细弹窗 -->
    <SourceDetailDialog
      v-if="detailState.visible"
      ref="detailRef"
      :source-type="detailState.sourceType"
      :biz-key="detailState.bizKey"
      @update:visible="detailState.visible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import { useAuthStore } from '@/stores/auth'
import SourceDetailDialog from '@/components/sqm/SourceDetailDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const pageSize = 20

// 组织隔离: 当前选中的组织视图(非空且非 'ALL' 时透传给后端)
const orgParam = computed(() => (auth.currentOrgId && auth.currentOrgId !== 'ALL' ? auth.currentOrgId : undefined))

// 四个 tab: all=总表(合并三表) + 三个独立子表(物料/半成品/成品)
const tabs = [
  { label: '全部', value: 'all' },
  { label: '物料表', value: 'material' },
  { label: '半成品表', value: 'semi' },
  { label: '成品表', value: 'finished' },
]
const activeTab = ref('all') // 'all' | 'material' | 'semi' | 'finished'

// ====== 状态 ======
const isAll = computed(() => activeTab.value === 'all')
const filterType = ref('') // 来源类型筛选(总表内用): ''=全部 / material / semi / finished
const keyword = ref('')
const loading = ref(false)
const rows = ref<Array<Record<string, any>>>([])
const pageNo = ref(1)
const total = ref(0)

// 源表全字段明细弹窗
const detailRef = ref<InstanceType<typeof SourceDetailDialog> | null>(null)
const detailState = reactive({ visible: false, sourceType: '', bizKey: '' })

// 新建
const lotDialogVisible = ref(false)
const lotSubmitting = ref(false)
const lotFormRef = ref<FormInstance>()
const lotForm = reactive({
  lotNo: '', partNo: '', partName: '', supplierName: '',
  qty: 0, unit: '', incomingDate: '', inspectResult: '合格', isKeyPart: false, remark: '',
})
const lotRules: FormRules = {
  lotNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  partNo: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  supplierName: [{ required: true, message: '请输入供应商', trigger: 'blur' }],
  qty: [{ required: true, message: '请输入数量', trigger: 'blur' }],
}

const typeLabel = (t: string) => ({ material: '物料', semi: '半成品', finished: '成品' }[t] || t)
const typeTag = (t: string) => ({ material: '', semi: 'info', finished: 'info' }[t] || 'info')
const resultTag = (r: string) => {
  if (!r) return 'info'
  if (r.includes('合格')) return 'success'
  if (r.includes('不合格')) return 'danger'
  return 'warning'
}

// ====== 加载数据 ======
// all  -> type=union(合并三表, 加类型列); 其余 -> type=单表全字段
async function loadData(page = 1) {
  loading.value = true
  try {
    const isAll = activeTab.value === 'all'
    const res: any = await sqmTraceApi.sourcePage({
      type: isAll ? 'union' : activeTab.value,
      bizType: isAll ? (filterType.value || undefined) : undefined,
      keyword: keyword.value || undefined,
      plantCode: orgParam.value,
      page,
      size: pageSize,
    })
    rows.value = res?.records ?? []
    total.value = res?.total ?? rows.value.length
    pageNo.value = page
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  pageNo.value = 1
  keyword.value = ''
  filterType.value = ''
  loadData(1)
}

function onFilterChange() {
  loadData(1)
}

function doSearch() {
  loadData(1)
}

// ====== 追溯 ======
function goMesTrace(row: any) {
  const barcode = row.bizKey || row.batchNo || row.barcode || ''
  if (!barcode) {
    ElMessage.warning('该行缺少可追溯的源表条码')
    return
  }
  router.push({ path: '/sqm/trace/mes-view', query: { barcode } })
}

// ====== 详情 ======
// 行 bizType(material/semi/finished) -> 详情 sourceType; key 用行 bizKey(后端已对物料回退 batch_no)
function openDetail(row: any) {
  const sourceType = row.bizType || activeTab.value
  const bizKey = row.bizKey
  if (!bizKey) {
    ElMessage.warning('该行缺少可查询的源表业务条码')
    return
  }
  detailState.sourceType = sourceType
  detailState.bizKey = bizKey
  detailState.visible = true
  nextTick(() => detailRef.value?.open())
}

async function submitLot() {
  const valid = await lotFormRef.value?.validate().catch(() => false)
  if (!valid) return
  lotSubmitting.value = true
  try {
    await sqmTraceApi.createLot({ ...lotForm } as any)
    ElMessage.success('来料批次创建成功')
    lotDialogVisible.value = false
    loadData(1)
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e.message || '未知错误'))
  } finally {
    lotSubmitting.value = false
  }
}

function resetLotForm() {
  Object.assign(lotForm, { lotNo: '', partNo: '', partName: '', supplierName: '', qty: 0, unit: '', incomingDate: '', inspectResult: '合格', isKeyPart: false, remark: '' })
  lotFormRef.value?.resetFields()
}

// 量产抽样 SPC 录入入口已迁移至 SPC 数据采集页(抽样 Tab),此处不再保留。

// 首次加载
loadData(1)
</script>

<style scoped>
.tl-page { background: #f8f7f4; min-height: 100%; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.head-b { background: #fff; border-bottom: 1px solid #e4e2dd; padding: 14px 24px; font-size: 17px; font-weight: 600; color: #141414; }

/* tab 栏 */
.tl-tabs { display: flex; gap: 4px; padding: 0 24px; background: #fff; border-bottom: 1px solid #e4e2dd; }
.tl-tab { padding: 10px 18px; font-size: 13px; font-weight: 500; color: #5b5b57; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: color .15s, border-color .15s; }
.tl-tab:hover { color: #141414; }
.tl-tab.active { color: #0047ab; border-bottom-color: #0047ab; }

/* 搜索栏 */
.tl-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #f0eee9; gap: 12px; }
.tl-bar-l { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tl-summary { font-size: 12px; color: #5b5b57; white-space: nowrap; }

.btn-b { padding: 6px 18px; font-size: 13px; font-weight: 500; color: #fff; background: #0047ab; border: none; border-radius: 6px; cursor: pointer; transition: background .15s; }
.btn-b:hover { background: #003a8c; }

/* 表格卡片 */
.tl-card { background: #fff; border: 1px solid #e4e2dd; border-radius: 8px; margin: 12px 24px; overflow: hidden; }
.tl-pager { padding: 12px 16px; display: flex; justify-content: flex-end; }

/* mono 数值/编号/时间 */
.mono { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
</style>
