<template>
  <div class="mes-trace">
    <el-card shadow="never" class="mt-bar">
      <div class="mt-head">
        <span class="mt-title">MES 追溯（基于源表 + 关系表）</span>

        <el-radio-group v-model="queryMode" size="default" class="mt-mode">
          <el-radio-button value="barcode">按条码（构成）</el-radio-button>
          <el-radio-button value="batchNo">按批号（来源）</el-radio-button>
        </el-radio-group>

        <el-input
          v-model="keyword"
          :placeholder="queryMode === 'barcode'
            ? '输入业务条码：成品·半成品 prod_batch_or_sn / 来料 material_barcode，向下查构成'
            : '输入批号：来料 material_batch_no / 成品·半成品 prod_batch_or_sn，查该批对应产品'"
          clearable
          style="width: 460px"
          @keyup.enter="onQuery"
        />
        <el-button type="primary" :loading="loading" @click="onQuery">查询追溯</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>

      <div class="mt-head mt-head-2">
        <span class="mt-dir-label">追溯方向：</span>
        <el-radio-group v-model="direction" size="default" @change="onDirectionChange">
          <el-radio-button value="forward">正向（向下追到物料）</el-radio-button>
          <el-radio-button value="backward">反向（向上追到客户）</el-radio-button>
          <el-radio-button value="all">全链路</el-radio-button>
        </el-radio-group>
      </div>

      <div class="mt-tip">
        <span class="mt-dir-tip" :class="direction">
          {{ directionTip }}
        </span>
        <span class="mt-sep">·</span>
        <span>「按条码」以产品为父向下查构成（成品 → 半成品/来料），成品下挂「终端客户(待补)」占位；「按批号」兼容来料批次号 material_batch_no 与成品·半成品批号 prod_batch_or_sn，查该批次对应的去向产品。</span>
      </div>
    </el-card>

    <el-card v-loading="loading" shadow="never" class="mt-body">
      <template v-if="errorMsg">
        <el-alert :title="errorMsg" type="error" :closable="false" />
      </template>
      <template v-else-if="forests.length">
        <!-- 批号森林: 多棵根树 -->
        <div v-for="(vo, idx) in forests" :key="idx" class="mt-forest">
          <div v-if="forests.length > 1" class="mt-forest-title">
            命中记录 {{ idx + 1 }} / {{ forests.length }}（根：{{ vo.rootNodeId }}）
          </div>
          <div v-if="vo.tree" class="mt-section">
            <div class="mt-section-title down">下游去向 →</div>
            <TraceNodeList :node="vo.tree" @select="onNodeClick" />
          </div>
          <div v-if="vo.upTree" class="mt-section">
            <div class="mt-section-title up">← 上游来源</div>
            <TraceNodeList :node="vo.upTree" @select="onNodeClick" />
          </div>
        </div>
      </template>
      <el-empty v-else description="输入条码或批号查询完整追溯树" />
    </el-card>

    <!-- 节点详情抽屉：容器为抽屉, 内容复用追溯表 SourceDetailContent 的样式与结构 -->
    <el-drawer v-model="detailState.visible" title="节点详情" size="620px" direction="rtl">
      <SourceDetailContent
        v-if="detailState.visible"
        :source-type="detailState.sourceType"
        :biz-key="detailState.bizKey"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TraceNodeList from './TraceNodeList.vue'
import SourceDetailContent from '@/components/sqm/SourceDetailContent.vue'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import type { TraceNodeTreeVO, TraceFullTreeVO } from '@/api/types/sqm'

const route = useRoute()
const router = useRouter()

const queryMode = ref<'barcode' | 'batchNo'>((route.query.mode as string) === 'batchNo' ? 'batchNo' : 'barcode')
const keyword = ref<string>((route.query.barcode as string) || (route.query.batchNo as string) || '')
const lotNo = ref<string>((route.query.lotNo as string) || '')
// 按批号查默认正向(只展示该批次的构成/下游), 避免上游料号聚合把同型号其他批次产品混入;
// 按条码查默认全链路。URL 带 direction 时以 URL 为准。
const routeDir = route.query.direction as string
const direction = ref<'forward' | 'backward' | 'all'>(
  routeDir === 'forward' || routeDir === 'backward' || routeDir === 'all'
    ? (routeDir as 'forward' | 'backward' | 'all')
    : (queryMode.value === 'batchNo' ? 'forward' : 'all')
)
const loading = ref(false)
const errorMsg = ref('')

// 切换查询模式时同步默认方向: 按批号默认正向(避免料号聚合混入其他产品), 按条码默认全链路
watch(queryMode, (m) => {
  if (m === 'batchNo') direction.value = 'forward'
  else direction.value = 'all'
})

// 森林: 条码查询时单棵(长度 1); 批号查询时可能多棵
const forests = ref<TraceFullTreeVO[]>([])

// 节点详情: 复用追溯表 SourceDetailDialog(按 sourceType + bizKey 查源表全字段)
const detailState = reactive({ visible: false, sourceType: '', bizKey: '' })

const directionTip = computed(() => {
  switch (direction.value) {
    case 'forward': return '正向（构成）：沿绑定表向下展开，本节点所用物料（成品/半成品 → 关键件/来料）。'
    case 'backward': return '反向（来源）：沿绑定表向上展开，谁使用了本节点、及其所属产品料号。'
    default: return '全链路：同时展示下游去向树（构成）与上游来源树。'
  }
})

// 节点 → 追溯表详情参数(sourceType + bizKey), 复用 SourceDetailDialog
function nodeToDetail(node: TraceNodeTreeVO): { sourceType: string; bizKey: string } | null {
  const src = node.detailSource
  const key = node.batchNo
  if (!key) return null
  if (src === 'material_inspection') return { sourceType: 'material', bizKey: key }
  if (src === 'finished_goods_inspection') {
    return { sourceType: node.nodeType === 'semi' ? 'semi' : 'finished', bizKey: key }
  }
  if (src === 'binding' || src === 'product_no') return { sourceType: 'critical', bizKey: key }
  // 兜底: 按 nodeType 推断
  if (node.nodeType === 'semi') return { sourceType: 'semi', bizKey: key }
  if (node.nodeType === 'ship') return { sourceType: 'finished', bizKey: key }
  if (node.nodeType === 'incoming' || node.nodeType === 'raw' || node.nodeType === 'keypart') {
    return { sourceType: 'material', bizKey: key }
  }
  return null
}

async function onQuery() {
  // 入口带了来料批次号(lotNo): 走 traceByLotNo 定位条码集合再渲染森林
  if (lotNo.value && !keyword.value.trim()) {
    loading.value = true
    errorMsg.value = ''
    forests.value = []
    try {
      const list: TraceFullTreeVO[] = await sqmTraceApi.getMesTraceTreeByLotNo(lotNo.value, direction.value)
      if (!list.length) {
        errorMsg.value = '未找到该来料批次号对应的源表条码（请确认批次号属于来料批次 sqm_incoming_lot.lot_no）'
      } else {
        forests.value = list
      }
    } catch (e: any) {
      errorMsg.value = '查询失败：' + (e?.message || e)
    } finally {
      loading.value = false
    }
    return
  }
  const kw = keyword.value.trim()
  if (!kw) {
    ElMessage.warning(queryMode.value === 'barcode' ? '请输入源表业务条码' : '请输入批号')
    return
  }
  loading.value = true
  errorMsg.value = ''
  forests.value = []
  try {
    if (queryMode.value === 'barcode') {
      const data: TraceFullTreeVO = await sqmTraceApi.getMesTraceTree(kw, direction.value)
      if (!data.tree && !data.upTree) {
        errorMsg.value = '未找到该条码的追溯关系（请确认条码属于来料 material_barcode / 成品·半成品 prod_batch_or_sn）'
      } else {
        forests.value = [data]
      }
    } else {
      // 按来料批号: material_batch_no → material_barcode → 产品来源链
      const list: TraceFullTreeVO[] = await sqmTraceApi.getMesTraceTreeByLotNo(kw, direction.value)
      if (!list.length) {
        errorMsg.value = '未找到该批号对应的源表记录（支持来料批次号 material_batch_no / 成品·半成品批号 prod_batch_or_sn）'
      } else {
        forests.value = list
      }
    }
  } catch (e: any) {
    errorMsg.value = '查询失败：' + (e?.message || e)
  } finally {
    loading.value = false
  }
}

// 方向切换后, 若已查询过则自动重查
function onDirectionChange() {
  if (forests.value.length || errorMsg.value) onQuery()
}

function onNodeClick(node: TraceNodeTreeVO) {
  // 末端客户占位节点无源表, 不弹详情
  if (node.nodeType === 'virtualCustomer') {
    ElMessage.info('该节点为终端客户占位（成品表暂无 customer 字段），无源表明细')
    return
  }
  const d = nodeToDetail(node)
  if (!d) {
    ElMessage.warning('该节点无可用源表业务条码，无法查看明细')
    return
  }
  detailState.sourceType = d.sourceType
  detailState.bizKey = d.bizKey
  detailState.visible = true
}

function goBack() {
  router.back()
}

onMounted(() => {
  if (lotNo.value) onQuery()
  else if (keyword.value) onQuery()
})
</script>

<style scoped>
.mes-trace { padding: 16px; }
.mt-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mt-head-2 { margin-top: 10px; }
.mt-title { font-weight: 600; font-size: 15px; }
.mt-mode { margin-left: 4px; }
.mt-dir-label { font-size: 13px; color: #475569; font-weight: 500; }
.mt-tip { margin-top: 8px; color: #8a94a6; font-size: 12px; line-height: 1.6; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mt-dir-tip { font-weight: 500; }
.mt-dir-tip.forward { color: #1e88e5; }
.mt-dir-tip.backward { color: #8e44ad; }
.mt-dir-tip.all { color: #1e4d8b; }
.mt-sep { color: #cbd5e1; }
.mt-body { margin-top: 12px; min-height: 320px; }
.mt-section { margin-bottom: 18px; }
.mt-section-title { font-weight: 600; margin-bottom: 8px; border-left: 4px solid #1e4d8b; padding-left: 8px; }
.mt-section-title.down { color: #1e88e5; border-left-color: #1e88e5; }
.mt-section-title.up { color: #8e44ad; border-left-color: #8e44ad; }
.mt-forest { margin-bottom: 22px; border: 1px solid #eef2f7; border-radius: 10px; padding: 12px 14px; background: #fff; }
.mt-forest-title { font-weight: 600; color: #475569; font-size: 13px; margin-bottom: 10px; }
.dt-desc { margin-bottom: 16px; }
.dt-vc { margin-bottom: 16px; }
.dt-sub { margin-top: 18px; }
.dt-sub-title { font-weight: 600; color: #1e4d8b; margin-bottom: 8px; border-left: 4px solid #1e4d8b; padding-left: 8px; }
.dt-link { padding: 6px 10px; margin: 4px 0; border: 1px solid #e5e7eb; border-radius: 6px; background: #f8fafc; font-size: 13px; display: flex; justify-content: space-between; gap: 8px; }
.dt-link-code { color: #94a3b8; }
.dt-empty { color: #94a3b8; font-size: 13px; padding: 4px 0; }
.dt-tip { margin-top: 18px; }
</style>
