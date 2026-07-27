<template>
  <div class="tl-page">
    <div class="head-b">物料追溯</div>
    <!-- 4个页签 -->
    <div class="tl-tabs">
      <button v-for="t in tabs" :key="t.key" :class="{sel:activeTab===t.key}" @click="switchTab(t.key)">{{t.label}}</button>
    </div>

    <!-- 搜索栏 -->
    <div class="tl-bar">
      <div class="tl-bar-l">
        <el-input v-model="keyword" :placeholder="searchHint" clearable @keyup.enter="doSearch" style="width:280px"/>
        <button class="btn-b" @click="doSearch">查询</button>
        <el-button v-if="activeTab==='master'" type="primary" link @click="lotDialogVisible=true">+ 新建来料批次</el-button>
      </div>
      <span class="tl-summary" v-if="total>0">共 {{total}} 条</span>
    </div>

    <!-- 总表 -->
    <div v-if="activeTab==='master'" class="tl-card">
      <el-table :data="masterData" border stripe size="small" v-loading="loading" max-height="calc(100vh - 260px)">
        <el-table-column prop="lotNo" label="批次号" width="150" show-overflow-tooltip />
        <el-table-column prop="partNo" label="物料编码" width="120" />
        <el-table-column prop="partName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="supplierName" label="供应商" width="140" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="receiveDate" label="收货日期" width="110" />
        <el-table-column prop="inspectResult" label="检验结果" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="row.inspectResult==='合格'?'success':row.inspectResult==='不合格'?'danger':'warning'" size="small">{{row.inspectResult||'-'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isKeyPart" label="关键件" width="75" align="center">
          <template #default="{row}">{{row.isKeyPart?'是':'否'}}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="goTrace(row)">追溯</el-button>
            <el-button type="primary" link size="small" @click="editLot(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="tl-pager"><el-pagination v-model:current-page="masterPage" :page-size="pageSize" :total="total" layout="total,prev,pager,next" @current-change="loadMasterData"/></div>
    </div>

    <!-- 物料表 -->
    <div v-if="activeTab==='material'" class="tl-card">
      <el-table :data="materialData" border stripe size="small" v-loading="loading" max-height="calc(100vh - 260px)">
        <el-table-column prop="lotNo" label="批次号" width="150" show-overflow-tooltip />
        <el-table-column prop="partNo" label="物料编码" width="120" />
        <el-table-column prop="partName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="supplierName" label="供应商" width="140" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="inspectResult" label="检验结果" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="row.inspectResult==='合格'?'success':row.inspectResult==='不合格'?'danger':'warning'" size="small">{{row.inspectResult||'-'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="goTrace(row)">追溯</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="tl-pager"><el-pagination v-model:current-page="materialPage" :page-size="pageSize" :total="total" layout="total,prev,pager,next" @current-change="loadMaterialData"/></div>
    </div>

    <!-- 半成品表（工厂自制：节点名=物料名，无供应商） -->
    <div v-if="activeTab==='semi'" class="tl-card">
      <el-table :data="semiData" border stripe size="small" v-loading="loading" max-height="calc(100vh - 260px)">
        <el-table-column prop="batchNo" label="批次号" width="150" show-overflow-tooltip />
        <el-table-column label="物料名称" min-width="160" show-overflow-tooltip>
          <template #default="{row}">{{ row.materialName || row.nodeName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="nodeDate" label="日期" width="110" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="goNodeTrace(row)">追溯</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="tl-pager"><el-pagination v-model:current-page="semiPage" :page-size="pageSize" :total="total" layout="total,prev,pager,next" @current-change="loadSemiData"/></div>
    </div>

    <!-- 成品表（工厂自制：节点名=物料名，无供应商） -->
    <div v-if="activeTab==='finish'" class="tl-card">
      <el-table :data="finishData" border stripe size="small" v-loading="loading" max-height="calc(100vh - 260px)">
        <el-table-column prop="batchNo" label="批次号" width="150" show-overflow-tooltip />
        <el-table-column label="物料名称" min-width="160" show-overflow-tooltip>
          <template #default="{row}">{{ row.materialName || row.nodeName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="nodeDate" label="日期" width="110" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="goNodeTrace(row)">追溯</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="tl-pager"><el-pagination v-model:current-page="finishPage" :page-size="pageSize" :total="total" layout="total,prev,pager,next" @current-change="loadFinishData"/></div>
    </div>

    <!-- 批次详情弹窗 -->
    <el-dialog v-model="lotDetailVisible" title="来料批次详情" width="620px" :close-on-click-modal="false">
      <el-descriptions v-if="currentLot" :column="2" border size="small">
        <el-descriptions-item label="批次号">{{currentLot.lotNo||'-'}}</el-descriptions-item>
        <el-descriptions-item label="物料编码">{{currentLot.partNo||'-'}}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{currentLot.partName||'-'}}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{currentLot.supplierName||'-'}}</el-descriptions-item>
        <el-descriptions-item label="数量">{{currentLot.qty??'-'}}</el-descriptions-item>
        <el-descriptions-item label="检验结果">{{currentLot.inspectResult||'-'}}</el-descriptions-item>
        <el-descriptions-item label="关键件">{{currentLot.isKeyPart?'是':'否'}}</el-descriptions-item>
        <el-descriptions-item label="收货日期">{{currentLot.receiveDate||'-'}}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{currentLot.remark||'-'}}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="currentLot" type="primary" @click="goTrace(currentLot);lotDetailVisible=false">追溯该批次</el-button>
        <el-button @click="lotDetailVisible=false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新建来料批次弹窗 -->
    <el-dialog v-model="lotDialogVisible" title="新建来料批次" width="560px" :close-on-click-modal="false" @closed="resetLotForm">
      <el-form :model="lotForm" :rules="lotRules" ref="lotFormRef" label-width="100px">
        <el-form-item label="批次号" prop="lotNo"><el-input v-model="lotForm.lotNo" placeholder="请输入批次号"/></el-form-item>
        <el-form-item label="物料编码" prop="partNo"><el-input v-model="lotForm.partNo" placeholder="请输入物料编码"/></el-form-item>
        <el-form-item label="物料名称"><el-input v-model="lotForm.partName" placeholder="请输入物料名称"/></el-form-item>
        <el-form-item label="供应商" prop="supplierName"><el-input v-model="lotForm.supplierName" placeholder="请输入供应商"/></el-form-item>
        <el-form-item label="数量" prop="qty"><el-input-number v-model="lotForm.qty" :min="0" style="width:100%"/></el-form-item>
        <el-form-item label="单位"><el-input v-model="lotForm.unit" placeholder="如：个、kg"/></el-form-item>
        <el-form-item label="收货日期"><el-date-picker v-model="lotForm.receiveDate" type="date" value-format="YYYY-MM-DD" style="width:100%"/></el-form-item>
        <el-form-item label="检验结果"><el-select v-model="lotForm.inspectResult" style="width:100%"><el-option label="合格" value="合格"/><el-option label="不合格" value="不合格"/><el-option label="待检" value="待检"/></el-select></el-form-item>
        <el-form-item label="是否关键件"><el-switch v-model="lotForm.isKeyPart"/></el-form-item>
        <el-form-item label="备注"><el-input v-model="lotForm.remark" type="textarea" rows="2"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="lotDialogVisible=false">取消</el-button><el-button type="primary" :loading="lotSubmitting" @click="submitLot">确认创建</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import type { SqmIncomingLot } from '@/api/types/sqm'

const router = useRouter()
const pageSize = 20

const tabs = [
  { key: 'master', label: '总表' },
  { key: 'material', label: '物料表' },
  { key: 'semi', label: '半成品表' },
  { key: 'finish', label: '成品表' },
]
const hints: Record<string, string> = {
  master: '输入批次号 / 物料编码查询',
  material: '输入物料编码 / 物料名称查询',
  semi: '输入半成品编码 / 批次号查询',
  finish: '输入成品编码 / 批次号查询',
}

// ====== 状态 ======
const activeTab = ref('master')
const keyword = ref('')
const loading = ref(false)
const total = ref(0)

const searchHint = computed(() => hints[activeTab.value] || '输入关键词查询')

// 总表（来料批次）
const masterData = ref<SqmIncomingLot[]>([])
const masterPage = ref(1)

// 物料表（来料批次，列稍有不同）
const materialData = ref<SqmIncomingLot[]>([])
const materialPage = ref(1)

// 半成品表 / 成品表（追溯节点）
const semiData = ref<any[]>([])
const semiPage = ref(1)
const finishData = ref<any[]>([])
const finishPage = ref(1)

// 详情
const lotDetailVisible = ref(false)
const currentLot = ref<SqmIncomingLot | null>(null)

// 新建
const lotDialogVisible = ref(false)
const lotSubmitting = ref(false)
const lotFormRef = ref<FormInstance>()
const lotForm = reactive({
  lotNo: '', partNo: '', partName: '', supplierName: '',
  qty: 0, unit: '', receiveDate: '', inspectResult: '合格', isKeyPart: false, remark: '',
})
const lotRules: FormRules = {
  lotNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  partNo: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  supplierName: [{ required: true, message: '请输入供应商', trigger: 'blur' }],
  qty: [{ required: true, message: '请输入数量', trigger: 'blur' }],
}

// ====== 切换页签 ======
function switchTab(key: string) {
  if (activeTab.value === key) return
  activeTab.value = key
  keyword.value = ''
  if (key === 'master' && masterData.value.length === 0) loadMasterData()
  else if (key === 'material' && materialData.value.length === 0) loadMaterialData()
  else if (key === 'semi' && semiData.value.length === 0) loadSemiData()
  else if (key === 'finish' && finishData.value.length === 0) loadFinishData()
}

// ====== 加载数据 ======
async function loadMasterData(page = 1) {
  loading.value = true
  try {
    const res: any = await sqmTraceApi.listLots({ keyword: keyword.value || undefined, page, size: pageSize })
    masterData.value = res?.records ?? (Array.isArray(res) ? res : [])
    total.value = res?.total ?? masterData.value.length
    masterPage.value = page
  } catch (e: any) { ElMessage.error('加载失败: ' + (e.message || '未知错误')) }
  finally { loading.value = false }
}

async function loadMaterialData(page = 1) {
  loading.value = true
  try {
    const res: any = await sqmTraceApi.listLots({ keyword: keyword.value || undefined, page, size: pageSize })
    materialData.value = res?.records ?? (Array.isArray(res) ? res : [])
    total.value = res?.total ?? materialData.value.length
    materialPage.value = page
  } catch (e: any) { ElMessage.error('加载失败: ' + (e.message || '未知错误')) }
  finally { loading.value = false }
}

async function loadSemiData(page = 1) {
  loading.value = true
  try {
    const res: any = await sqmTraceApi.searchNodes({ nodeType: 'semi', keyword: keyword.value || undefined, page, size: pageSize })
    semiData.value = res?.records ?? (Array.isArray(res) ? res : [])
    total.value = res?.total ?? semiData.value.length
    semiPage.value = page
  } catch (e: any) { ElMessage.error('加载失败: ' + (e.message || '未知错误')) }
  finally { loading.value = false }
}

async function loadFinishData(page = 1) {
  loading.value = true
  try {
    const res: any = await sqmTraceApi.searchNodes({ nodeType: 'ship', keyword: keyword.value || undefined, page, size: pageSize })
    finishData.value = res?.records ?? (Array.isArray(res) ? res : [])
    total.value = res?.total ?? finishData.value.length
    finishPage.value = page
  } catch (e: any) { ElMessage.error('加载失败: ' + (e.message || '未知错误')) }
  finally { loading.value = false }
}

// ====== 搜索 ======
function doSearch() {
  if (activeTab.value === 'master') loadMasterData(1)
  else if (activeTab.value === 'material') loadMaterialData(1)
  else if (activeTab.value === 'semi') loadSemiData(1)
  else if (activeTab.value === 'finish') loadFinishData(1)
}

// ====== 追溯 ======
// 把行数据序列化为 seed 查询参数(含 nodeType/名称/批次号/数量/单位/日期/供应商),
// 供追溯页在 API 返回空树时构造"自身即节点"的种子,保证三个表点击追溯后至少能看到本节点。
function encodeSeed(o: Record<string, any>) {
  return encodeURIComponent(JSON.stringify(o))
}

function goTrace(row: SqmIncomingLot) {
  const seed = encodeSeed({
    nodeType: 'incoming',
    nodeName: row.partName || row.lotNo,
    batchNo: row.lotNo,
    materialCode: row.partNo,
    qty: row.qty,
    unit: row.unit,
    nodeDate: row.receiveDate,
    supplierName: row.supplierName,
    isValid: row.inspectResult,
  })
  router.push({
    path: '/sqm/trace/view',
    query: { rootLotId: row.id, lotNo: row.lotNo, seed },
  })
}
function goNodeTrace(row: any) {
  const rootLotId = row.rootLotId || ''
  const nodeId = row.id || ''
  const nodeType = row.nodeType || ''
  const seed = encodeSeed({
    nodeType,
    nodeName: row.materialName || row.nodeName,
    batchNo: row.batchNo,
    materialCode: row.materialCode,
    qty: row.qty,
    unit: row.unit,
    nodeDate: row.nodeDate,
  })
  router.push({
    path: '/sqm/trace/view',
    query: { rootLotId, rootNodeId: nodeId, lotNo: row.rootLotNo || '', nodeType, seed },
  })
}

// ====== 详情/新建 ======
function editLot(row: SqmIncomingLot) {
  currentLot.value = row
  lotDetailVisible.value = true
}

async function submitLot() {
  const valid = await lotFormRef.value?.validate().catch(() => false)
  if (!valid) return
  lotSubmitting.value = true
  try {
    await sqmTraceApi.createLot({ ...lotForm } as any)
    ElMessage.success('来料批次创建成功')
    lotDialogVisible.value = false
    loadMasterData(1)
  } catch (e: any) { ElMessage.error('创建失败: ' + (e.message || '未知错误')) }
  finally { lotSubmitting.value = false }
}

function resetLotForm() {
  Object.assign(lotForm, { lotNo: '', partNo: '', partName: '', supplierName: '', qty: 0, unit: '', receiveDate: '', inspectResult: '合格', isKeyPart: false, remark: '' })
  lotFormRef.value?.resetFields()
}

// 首次加载
loadMasterData()
</script>

<style scoped>
.tl-page { background: #F8FAFC; min-height: 100%; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.head-b { background: #fff; border-bottom: 1px solid #E5E7EB; padding: 14px 24px; font-size: 17px; font-weight: 600; color: #111827; }

/* 页签 */
.tl-tabs { display: flex; gap: 0; background: #fff; border-bottom: 1px solid #E5E7EB; padding: 0 24px; }
.tl-tabs button { padding: 10px 20px; font-size: 13px; font-weight: 500; color: #6B7280; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all .15s; outline: none; }
.tl-tabs button:hover { color: #111827; }
.tl-tabs button.sel { color: #2563EB; border-bottom-color: #2563EB; }

/* 搜索栏 */
.tl-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #F3F4F6; gap: 12px; }
.tl-bar-l { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tl-summary { font-size: 12px; color: #6B7280; white-space: nowrap; }

.btn-b { padding: 6px 18px; font-size: 13px; font-weight: 500; color: #fff; background: #2563EB; border: none; border-radius: 6px; cursor: pointer; transition: background .15s; }
.btn-b:hover { background: #1D4ED8; }

/* 表格卡片 */
.tl-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; margin: 12px 24px; overflow: hidden; }
.tl-pager { padding: 12px 16px; display: flex; justify-content: flex-end; }
</style>
