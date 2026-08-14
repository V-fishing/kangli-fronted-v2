<template>
  <div class="std-item-editor">
    <div class="sie-head">
      <div class="sie-title">
        <span class="dot" />
        检验项明细
        <span class="cnt">({{ total }} 项)</span>
      </div>
      <div class="sie-cov">
        <span class="cov-label">可匹配覆盖率</span>
        <el-progress
          :percentage="coverage"
          :stroke-width="10"
          :color="covColor"
          class="cov-bar"
        />
        <span class="cov-num" :style="{ color: covColor }">{{ matchableCount }}/{{ total }}</span>
      </div>
      <el-button type="primary" size="small" @click="addRow">+ 新增检验项</el-button>
    </div>

    <el-table :data="items" size="small" border stripe class="sie-table" :fit="true" :row-class-name="rowClass">
      <el-table-column type="index" label="#" width="44" />
      <el-table-column label="检验项" min-width="150">
        <template #default="{ row }">
          <el-input v-model="row.itemName" placeholder="如 外观/长度" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="CTQ" width="62" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.isCtq" :active-value="true" :inactive-value="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="96">
        <template #default="{ row }">
          <el-select v-model="row.valueType" size="small" placeholder="类型" @change="onTypeChange(row)">
            <el-option label="数值" value="numeric" />
            <el-option label="枚举" value="enum" />
            <el-option label="文本" value="text" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="标准值" min-width="96">
        <template #default="{ row }">
          <el-input v-model="row.stdValue" :disabled="row.valueType === 'enum' || row.valueType === 'text'" size="small" placeholder="如 10.0" />
        </template>
      </el-table-column>
      <el-table-column label="公差" min-width="96">
        <template #default="{ row }">
          <el-input v-model="row.tolerance" :disabled="row.valueType === 'enum' || row.valueType === 'text'" size="small" placeholder="±0.02 / 9.8~10.2" />
        </template>
      </el-table-column>
      <el-table-column label="单位" width="80">
        <template #default="{ row }">
          <el-input v-model="row.unit" size="small" placeholder="mm" />
        </template>
      </el-table-column>
      <el-table-column label="枚举值" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.enumValues" :disabled="row.valueType !== 'enum'" size="small" placeholder="合格,不合格" />
        </template>
      </el-table-column>
      <el-table-column label="合格值" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.passValues" :disabled="row.valueType !== 'enum'" size="small" placeholder="如 合格" />
        </template>
      </el-table-column>
      <el-table-column label="控制图类型" width="140">
        <template #default="{ row }">
          <el-select v-model="row.chartTypes" multiple size="small" collapse-tags collapse-tags-tooltip
                     placeholder="随类型自动带出" style="width:100%">
            <el-option v-for="c in chartTypeOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="可匹配" width="84" align="center">
        <template #default="{ row }">
          <el-tag :type="isMatchable(row) ? 'success' : 'info'" size="small" effect="light">
            {{ isMatchable(row) ? '可匹配' : '人工' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row, $index }">
          <el-button v-if="row.valueType === 'numeric'" link type="primary" size="small" @click="openPullSpec(row)">从SPC拉取</el-button>
          <el-button link type="danger" size="small" @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="sie-tip">
      提示：数值型填「标准值+公差」、枚举型填「枚举值+合格值」即可被系统自动判定，未配置规则的检验项在录入时由人工判定（尽量配齐以提升覆盖率）。
    </div>

    <!-- 从SPC标准线拉取 -->
    <el-dialog v-model="pullSpecVisible" title="从 SPC 标准线拉取规格" width="560px" append-to-body>
      <el-table :data="pullSpecList" size="small" highlight-current-row @row-click="onPullSpecSelect" max-height="400px">
        <el-table-column prop="material" label="物料" min-width="150" />
        <el-table-column prop="procName" label="工序" width="150" />
        <el-table-column label="规格范围" width="200">
          <template #default="{row}">
            <span class="mono">{{ row.specLower ?? '—' }} ~ {{ row.specUpper ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="70" />
      </el-table>
      <template #footer><el-button @click="pullSpecVisible=false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FiaStdItemRequest } from '@/api/types/fia'
import type { SpcSpecStandard } from '@/api/types/spc'
import { spcSpecStandardApi } from '@/api/modules/spc/specStandard'

const items = defineModel<FiaStdItemRequest[]>({ required: true })

const props = defineProps<{ highlightId?: string }>()
function rowClass({ row }: { row: any }): string {
  return props.highlightId && row.id === props.highlightId ? 'row-hl' : ''
}

const total = computed(() => items.value?.length || 0)
const matchableCount = computed(() => (items.value || []).filter(isMatchable).length)
const coverage = computed(() => (total.value ? Math.round((matchableCount.value / total.value) * 100) : 0))
const covColor = computed(() => (coverage.value >= 80 ? '#52C41A' : coverage.value >= 50 ? '#FAAD14' : '#F5222D'))

// 基础图码可选集合(与后端 FiaChartTypeResolver.ALL_CHART_TYPES、字典 spc_chart_type 对齐)
const chartTypeOptions = [
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

// 按「类型」给出默认推荐基础图码集合(与后端 FiaChartTypeResolver.defaultChartTypes 对齐)
function defaultChartTypes(valueType: string): string[] {
  if (valueType === 'enum' || valueType === 'text') return ['P']
  return ['Xbar', 'R']
}

function isMatchable(it?: any): boolean {
  if (!it) return false
  const vt = it.valueType
  if (vt === 'numeric' || vt === '数值') return !!(it.stdValue && it.stdValue.trim() && it.tolerance && it.tolerance.trim())
  if (vt === 'enum' || vt === '枚举') return !!(it.enumValues && it.enumValues.trim() && it.passValues && it.passValues.trim())
  return false
}

function addRow() {
  if (!items.value) items.value = []
  items.value.push({
    seq: items.value.length + 1,
    itemName: '',
    isCtq: false,
    valueType: 'numeric',
    stdValue: '',
    tolerance: '',
    unit: '',
    enumValues: '',
    passValues: '',
    chartTypes: ['Xbar', 'R'],
  })
}

function removeRow(index: number) {
  items.value?.splice(index, 1)
  // 重新排序号
  items.value?.forEach((it, i) => (it.seq = i + 1))
}

function onTypeChange(row: any) {
  if (row.valueType === 'enum') {
    if (row.stdValue !== undefined) row.stdValue = ''
    if (row.tolerance !== undefined) row.tolerance = ''
  } else if (row.valueType === 'numeric') {
    if (row.enumValues !== undefined) row.enumValues = ''
    if (row.passValues !== undefined) row.passValues = ''
  } else {
    row.stdValue = ''
    row.tolerance = ''
    row.enumValues = ''
    row.passValues = ''
  }
  // 控制图类型随「类型」联动: 自动带默认推荐集合, 用户可在此基础手动增减
  if (row.chartTypes !== undefined) row.chartTypes = defaultChartTypes(row.valueType)
}

// 从 SPC 标准线拉取规格
const pullSpecVisible = ref(false)
const pullSpecList = ref<SpcSpecStandard[]>([])
const pullSpecTarget = ref<FiaStdItemRequest | null>(null)

async function openPullSpec(row: any) {
  pullSpecTarget.value = row
  pullSpecVisible.value = true
  try { pullSpecList.value = await spcSpecStandardApi.list() }
  catch { pullSpecList.value = [] }
}

function onPullSpecSelect(std: SpcSpecStandard) {
  if (!pullSpecTarget.value) return
  const target = pullSpecTarget.value
  // 标准值: 优先取 targetValue, 否则取 (specLower + specUpper) / 2
  if (std.targetValue != null) {
    target.stdValue = String(std.targetValue)
  } else if (std.specLower != null && std.specUpper != null) {
    target.stdValue = String((std.specLower + std.specUpper) / 2)
  }
  // 公差: "±X" 格式, X = (specUpper - specLower) / 2
  if (std.specLower != null && std.specUpper != null) {
    const tol = (std.specUpper - std.specLower) / 2
    target.tolerance = `±${tol}`
  }
  // 单位
  if (std.unit) {
    target.unit = std.unit
  }
  pullSpecVisible.value = false
  pullSpecTarget.value = null
}

const _origDefineExpose = { isMatchable, coverage, matchableCount, total }
defineExpose(_origDefineExpose)
</script>

<style lang="scss" scoped>
.std-item-editor { width: 100%; }
.sie-head {
  display: flex; align-items: center; gap: 16px; margin-bottom: 12px; flex-wrap: wrap;
  .sie-title { font-family: $font-display; font-size: 15px; font-weight: 700; color: $ink; display: flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: $cobalt; box-shadow: 0 0 0 3px rgba($cobalt, 0.15); }
  .cnt { color: $ink-faint; font-weight: 400; font-size: 12px; }
  .sie-cov { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 240px; }
  .cov-label { font-size: 12px; color: $ink-faint; white-space: nowrap; }
  .cov-bar { flex: 1; max-width: 280px; }
  .cov-num { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
}
.sie-table :deep(.el-table__row) { transition: background 0.2s; }
.sie-table :deep(.el-table__row:hover) { background: rgba($cobalt, 0.04); }
.sie-table :deep(.el-table__row.row-hl) { animation: rowHl 1.6s ease 2; }
@keyframes rowHl {
  0% { background: rgba($cobalt, 0.28); }
  100% { background: transparent; }
}
.sie-tip {
  margin-top: 10px; font-size: 12px; color: $ink-faint; line-height: 1.6;
  padding: 8px 12px; background: rgba($cobalt, 0.05); border-radius: 8px; border: 1px solid $hairline;
}
.mono { font-variant-numeric: tabular-nums; font-family: $font-mono; }
</style>
