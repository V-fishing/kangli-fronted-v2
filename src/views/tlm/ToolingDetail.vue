<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TlmTooling, TlmToolVersion, TlmToolProduct, TlmProductCandidate, TlmProductDetail } from '@/api/types/tlm'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'
import { tlmMaintApi } from '@/api/modules/tlm/maint'
import { usePermissionStore } from '@/stores/permission'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const perm = usePermissionStore()
const tool = ref<TlmTooling | null>(null)
const records = ref<any[]>([])
const versions = ref<TlmToolVersion[]>([])
const products = ref<TlmToolProduct[]>([])
const activeTab = ref<'maint' | 'product' | 'version'>('maint')

// ---- 关联产品(MES 真实来源) ----
const KIND_TEXT: Record<string, string> = { MATERIAL: '物料', SEMI: '半成品', FINISHED: '成品' }
const relDialog = ref(false)
const relKind = ref<'MATERIAL' | 'SEMI' | 'FINISHED' | ''>('')
const relKeyword = ref('')
const candidates = ref<TlmProductCandidate[]>([])
const relLoading = ref(false)
const savingRel = ref(false)
const selCandidate = ref<TlmProductCandidate | null>(null)

async function openRelate() {
  relKind.value = ''
  relKeyword.value = ''
  selCandidate.value = null
  candidates.value = []
  relDialog.value = true
  searchCandidates()
}
async function searchCandidates() {
  relLoading.value = true
  try {
    candidates.value = await tlmToolingApi.productCandidates(relKeyword.value || undefined, relKind.value || undefined)
  } finally { relLoading.value = false }
}
// 关键词 / 类别变化即模糊搜索(300ms 防抖)，无需点按钮
let kwTimer: any = null
watch([relKeyword, relKind], () => {
  if (!relDialog.value) return
  clearTimeout(kwTimer)
  kwTimer = setTimeout(searchCandidates, 300)
})
async function submitRelate() {
  if (!selCandidate.value) { ElMessage.warning('请选择要关联的产品'); return }
  savingRel.value = true
  try {
    await tlmToolingApi.relateProduct(id, {
      productCode: selCandidate.value.materialCode,
      productName: selCandidate.value.productName,
      kind: selCandidate.value.kind,
      specModel: selCandidate.value.specModel,
    })
    ElMessage.success('已关联产品')
    relDialog.value = false
    products.value = await tlmToolingApi.products(id)
  } finally { savingRel.value = false }
}
async function unrelate(row: TlmToolProduct) {
  await tlmToolingApi.unrelateProduct(id, row.id!)
  ElMessage.success('已取消关联')
  products.value = await tlmToolingApi.products(id)
}

// ---- 产品详情(MES 明细) ----
const detailDialog = ref(false)
const detailRows = ref<TlmProductDetail[]>([])
const detailLoading = ref(false)
const detailCode = ref('')
async function openProductDetail(row: TlmToolProduct) {
  detailCode.value = row.productCode || ''
  detailDialog.value = true
  detailLoading.value = true
  try {
    detailRows.value = await tlmToolingApi.productDetail(row.productCode!)
  } finally { detailLoading.value = false }
}
const loading = ref(false)

const statusPill = (s: string) => ({ IN_USE: 'p-done', DISABLED: 'p-mute', REPAIRING: 'p-run', SCRAPPED: 'p-lock' }[s] || 'p-wait')
const statusText = (s: string) => ({ IN_USE: '在用', DISABLED: '停用', REPAIRING: '维修中', SCRAPPED: '报废' }[s] || s)
const changeText = (t: string) => ({ DESIGN: '设计变更', UPGRADE: '升级', OTHER: '其他' }[t] || t || '—')

// ---- 新增版本记录 ----
const verDialog = ref(false)
const savingVer = ref(false)
const verForm = ref<Partial<TlmToolVersion>>({ changeType: 'DESIGN', changedAt: '' })
function openAddVersion() {
  verForm.value = { changeType: 'DESIGN', changedAt: '' }
  verDialog.value = true
}
async function submitVersion() {
  if (!verForm.value.changeDesc || !verForm.value.changeDesc.trim()) {
    ElMessage.warning('请填写变更说明')
    return
  }
  savingVer.value = true
  try {
    await tlmToolingApi.addVersion(id, verForm.value)
    ElMessage.success('已记录版本变更')
    verDialog.value = false
    versions.value = await tlmToolingApi.versions(id)
  } finally { savingVer.value = false }
}

async function doRepairComplete() {
  try {
    await tlmToolingApi.repairComplete(id)
    ElMessage.success('维修完成，已触发首件检验任务')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

// 创建首件: 跳转到 FIA 新建检验任务并以工装首件模式预填该工装
function createFirst() {
  if (!tool.value) return
  if (!tool.value.productCode || !tool.value.procName) {
    ElMessage.warning('该工装缺少产品编码或工序，无法匹配检验标准，请先完善工装档案')
    return
  }
  router.push({ path: '/fia/tasks/create', query: { toolId: tool.value.id, toolNo: tool.value.toolNo, toolName: tool.value.toolName } })
}

async function load() {
  loading.value = true
  try {
    tool.value = await tlmToolingApi.get(id)
    records.value = await tlmMaintApi.records(id)
    versions.value = await tlmToolingApi.versions(id)
    products.value = await tlmToolingApi.products(id)
  } finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <div class="page-wrap rise" v-loading="loading">
    <div class="head-b" v-if="tool">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><RouterLink to="/tlm/tooling" class="crumb-link">台账</RouterLink><span class="crumb-sep">/</span><span class="crumb-node">详情</span></div>
        <h1>{{ tool.toolName }}<span class="no mono">{{ tool.toolNo }}</span></h1>
      </div>
      <span class="pill" :class="statusPill(tool.status)"><span class="d"></span>{{ statusText(tool.status) }}</span>
      <span v-if="!tool.productCode || !tool.procName" class="pill p-wait"><span class="d"></span>待首件</span>
      <el-button v-if="tool.status === 'REPAIRING' && perm.has('tlm.tooling.repair')" type="primary" size="small" @click="doRepairComplete">维修完成</el-button>
      <el-button v-if="perm.has('tlm.tooling.first')" type="primary" size="small" @click="createFirst">创建首件</el-button>
    </div>

    <div class="grid-b" v-if="tool">
      <div>
        <el-card class="card-b info-card" style="margin-bottom:18px" :body-style="{ padding: '0' }">
          <div class="card-head"><h2>资产信息</h2></div>
          <div class="grp">
            <div class="grp-title">基础与归属</div>
            <div class="info-cols">
              <div class="info-col">
                <div class="field"><div class="l">类别</div><div class="v">{{ tool.toolCategory === 'GAUGE' ? '测量设备' : '工装夹具' }}</div></div>
                <div class="field"><div class="l">工装类型</div><div class="v">{{ tool.toolType || '—' }}</div></div>
                <div class="field"><div class="l">风险等级</div><div class="v">{{ tool.riskClass || '—' }}</div></div>
                <div class="field"><div class="l">状态</div><div class="v"><span class="pill" :class="statusPill(tool.status)"><span class="d"></span>{{ statusText(tool.status) }}</span></div></div>
                <div class="field"><div class="l">数量</div><div class="v mono">{{ tool.quantity ?? 1 }}</div></div>
                <div class="field"><div class="l">验证周期</div><div class="v">{{ tool.verifyCycle || '—' }}</div></div>
                <div class="field"><div class="l">材质</div><div class="v">{{ tool.material || '—' }}</div></div>
                <div class="field"><div class="l">存放地点</div><div class="v">{{ tool.location || '—' }}</div></div>
                <div class="field"><div class="l">锁定</div><div class="v">{{ tool.locked ? '是' : '否' }}</div></div>
              </div>
              <div class="info-col">
                <div class="field"><div class="l">领用人</div><div class="v">{{ tool.ownerName || '—' }}</div></div>
                <div class="field"><div class="l">设备管理员</div><div class="v">{{ tool.adminName || '—' }}</div></div>
                <div class="field"><div class="l">供应商/厂家</div><div class="v">{{ tool.supplierName || '—' }}</div></div>
                <div class="field"><div class="l">规格</div><div class="v">{{ tool.spec || '—' }}</div></div>
                <div class="field"><div class="l">产品编码</div><div class="v mono">{{ tool.productCode || '—' }}</div></div>
                <div class="field"><div class="l">工序</div><div class="v">{{ tool.procName || '—' }}</div></div>
              </div>
            </div>
          </div>

          <div class="grp" v-if="tool.toolCategory === 'GAUGE'">
            <div class="grp-title">计量与校准</div>
            <div class="info-cols">
              <div class="info-col">
                <div class="field"><div class="l">精度</div><div class="v">{{ tool.precisionVal || '—' }}</div></div>
                <div class="field"><div class="l">计量点位</div><div class="v">{{ tool.measurePoint || '—' }}</div></div>
                <div class="field"><div class="l">软件版本</div><div class="v">{{ tool.softwareVer || '—' }}</div></div>
                <div class="field"><div class="l">校准周期</div><div class="v">{{ tool.calibCycle != null ? tool.calibCycle + ' 月' : '—' }}</div></div>
                <div class="field"><div class="l">保养周期</div><div class="v">{{ tool.maintCycle != null ? tool.maintCycle + ' 月' : '—' }}</div></div>
              </div>
              <div class="info-col">
                <div class="field"><div class="l">校准日期</div><div class="v mono">{{ tool.calibDate || '—' }}</div></div>
                <div class="field"><div class="l">下次校准</div><div class="v mono" :class="tool.calibDueDate && new Date(tool.calibDueDate) < new Date() ? 'c-red' : 'c-green'">{{ tool.calibDueDate || '—' }}</div></div>
              </div>
            </div>
          </div>

          <div class="grp">
            <div class="grp-title">生命周期与备注</div>
            <div class="info-cols">
              <div class="info-col">
                <div class="field"><div class="l">采购日期</div><div class="v mono">{{ tool.purchaseDate || '—' }}</div></div>
                <div class="field"><div class="l">入库日期</div><div class="v mono">{{ tool.inboundDate || '—' }}</div></div>
                <div class="field"><div class="l">金额</div><div class="v mono">{{ tool.cost != null ? '¥' + tool.cost : '—' }}</div></div>
                <div class="field"><div class="l">寿命</div><div class="v mono">{{ tool.bindCount || 0 }}<span v-if="tool.designLife">/{{ tool.designLife }}</span></div></div>
              </div>
              <div class="info-col">
                <div class="field remark-field"><div class="l">备注</div><div class="v">{{ tool.remark || '—' }}</div></div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="card-b" :body-style="{ padding: '0' }">
          <div class="card-head" style="gap:14px;justify-content:space-between">
            <el-radio-group v-model="activeTab">
              <el-radio-button value="maint">保养历史</el-radio-button>
              <el-radio-button value="product">产品关联</el-radio-button>
              <el-radio-button value="version">版本变更</el-radio-button>
            </el-radio-group>
            <el-button v-if="perm.has('tlm.tooling.edit') && activeTab === 'version'" type="primary" size="small" @click="openAddVersion">+ 新增版本记录</el-button>
            <el-button v-if="perm.has('tlm.tooling.edit') && activeTab === 'product'" type="primary" size="small" @click="openRelate">+ 关联产品</el-button>
          </div>
          <el-table v-if="activeTab === 'maint'" :data="records" style="width:100%">
            <el-table-column label="保养日期" width="130"><template #default="{ row }"><span class="mono">{{ row.maintDate }}</span></template></el-table-column>
            <el-table-column prop="result" label="结果" min-width="200" />
            <el-table-column prop="attachment" label="附件" width="160"><template #default="{ row }"><span v-if="row.attachment" class="tag-b">{{ row.attachment }}</span><span v-else>—</span></template></el-table-column>
          </el-table>
          <div v-else-if="activeTab === 'product'">
            <el-table :data="products" style="width:100%" empty-text="暂无关联产品">
              <el-table-column label="产品编码" width="140"><template #default="{ row }"><span class="mono">{{ row.productCode || '—' }}</span></template></el-table-column>
              <el-table-column prop="productName" label="产品名称" min-width="160" />
              <el-table-column label="类型" width="90"><template #default="{ row }"><span class="tag-b">{{ KIND_TEXT[row.kind] || row.kind || '—' }}</span></template></el-table-column>
              <el-table-column prop="specModel" label="规格型号" min-width="200" />
              <el-table-column label="操作" width="170" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openProductDetail(row)">详情</el-button>
                  <el-button v-if="perm.has('tlm.tooling.edit')" link type="danger" size="small" @click="unrelate(row)">取消关联</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <template v-else>
            <el-table :data="versions" style="width:100%" empty-text="暂无版本变更记录">
              <el-table-column label="版本号" width="100"><template #default="{ row }"><span class="mono c-cobalt">{{ row.versionNo }}</span></template></el-table-column>
              <el-table-column label="变更类型" width="120"><template #default="{ row }"><span class="tag-b">{{ changeText(row.changeType) }}</span></template></el-table-column>
              <el-table-column prop="changeDesc" label="变更说明" min-width="220" />
              <el-table-column label="变更人" width="120"><template #default="{ row }">{{ row.changedBy || '—' }}</template></el-table-column>
              <el-table-column label="变更日期" width="130"><template #default="{ row }"><span class="mono">{{ row.changedAt || '—' }}</span></template></el-table-column>
            </el-table>
          </template>
        </el-card>
      </div>

      <div class="right-b">
        <el-card class="card-b meter-card" :body-style="{ padding: '0' }">
          <div class="card-head"><h2>计量预警</h2></div>
          <div class="info-row"><span class="l">校准到期</span><span class="mono" :class="tool.calibDueDate && new Date(tool.calibDueDate) < new Date() ? 'c-red' : 'c-green'">{{ tool.calibDueDate || '—' }}</span></div>
          <div class="info-row"><span class="l">下次保养</span><span class="mono">{{ tool.nextMaintDate || '—' }}</span></div>
          <div class="info-row"><span class="l">寿命进度</span><span class="mono">{{ tool.bindCount || 0 }}<span v-if="tool.designLife">/{{ tool.designLife }}</span></span></div>
          <div class="info-row"><span class="l">锁定状态</span><span :class="tool.locked ? 'c-red' : 'c-green'">{{ tool.locked ? '已锁定' : '正常' }}</span></div>
        </el-card>
      </div>
    </div>

    <!-- 新增版本记录弹窗 -->
    <el-dialog v-model="verDialog" title="新增版本记录" width="520px" append-to-body>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><label class="l">变更类型</label>
          <el-select v-model="verForm.changeType" style="width:100%">
            <el-option label="设计变更" value="DESIGN" />
            <el-option label="升级" value="UPGRADE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </div>
        <div><label class="l">变更日期</label>
          <el-date-picker v-model="verForm.changedAt" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </div>
        <div style="grid-column:1 / -1"><label class="l">变更说明 *</label>
          <el-input v-model="verForm.changeDesc" type="textarea" :rows="3" placeholder="如：电极结构优化升级" />
        </div>
      </div>
      <template #footer>
        <el-button @click="verDialog = false">取消</el-button>
        <el-button type="primary" :disabled="savingVer" @click="submitVersion">{{ savingVer ? '保存中' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 关联产品弹窗(MES 真实来源) -->
    <el-dialog v-model="relDialog" title="关联产品" width="620px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <el-radio-group v-model="relKind">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="MATERIAL">物料</el-radio-button>
          <el-radio-button value="SEMI">半成品</el-radio-button>
          <el-radio-button value="FINISHED">成品</el-radio-button>
        </el-radio-group>
        <el-input v-model="relKeyword" placeholder="输入编码 / 名称 / 规格模糊搜索" style="flex:1;min-width:200px" clearable @keyup.enter="searchCandidates" />
        <el-button type="primary" :loading="relLoading" @click="searchCandidates">搜索</el-button>
      </div>
      <el-table :data="candidates" style="width:100%" max-height="320" empty-text="输入关键词搜索 MES 产品" @current-change="(c: any) => selCandidate = c" highlight-current-row>
        <el-table-column label="产品编码" width="130"><template #default="{ row }"><span class="mono">{{ row.materialCode }}</span></template></el-table-column>
        <el-table-column prop="productName" label="名称" min-width="140" />
        <el-table-column label="类型" width="80"><template #default="{ row }"><span class="tag-b">{{ KIND_TEXT[row.kind] || row.kind }}</span></template></el-table-column>
        <el-table-column prop="specModel" label="规格" min-width="160" />
      </el-table>
      <template #footer>
        <el-button @click="relDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!selCandidate || savingRel" @click="submitRelate">{{ savingRel ? '保存中' : '关联' }}</el-button>
      </template>
    </el-dialog>

    <!-- 产品详情弹窗(MES 检验记录) -->
    <el-dialog v-model="detailDialog" :title="`产品详情 · ${detailCode}`" width="860px" append-to-body>
      <el-table v-loading="detailLoading" :data="detailRows" style="width:100%" max-height="420" empty-text="无检验记录">
        <el-table-column label="类型" width="80"><template #default="{ row }"><span class="tag-b">{{ KIND_TEXT[row.kind] || row.kind }}</span></template></el-table-column>
        <el-table-column label="批次/批号" width="140"><template #default="{ row }"><span class="mono">{{ row.batchNo || '—' }}</span></template></el-table-column>
        <el-table-column label="供应商" width="120"><template #default="{ row }">{{ row.supplierName || '—' }}</template></el-table-column>
        <el-table-column label="检验结果" width="90"><template #default="{ row }"><span :class="row.inspectionResult === '合格' ? 'c-green' : (row.inspectionResult ? 'c-red' : '')">{{ row.inspectionResult || '—' }}</span></template></el-table-column>
        <el-table-column label="检验日期" width="120"><template #default="{ row }"><span class="mono">{{ row.inspectionDate || '—' }}</span></template></el-table-column>
        <el-table-column label="生产订单" width="130"><template #default="{ row }"><span class="mono">{{ row.productionOrderNo || '—' }}</span></template></el-table-column>
        <el-table-column label="数量" width="90"><template #default="{ row }">{{ row.qty || '—' }}{{ row.unit ? ' ' + row.unit : '' }}</template></el-table-column>
        <el-table-column prop="plantName" label="工厂" min-width="100" />
      </el-table>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 整体收窄：本页右栏略收，主内容更聚焦 */
.page-wrap :deep(.grid-b) {
  grid-template-columns: minmax(0, 920px) 300px;
  gap: 16px;
  align-items: start;
}
/* 资产信息卡：分组 + 双栏紧凑，组间用发丝线与 mono 小标题轻量分隔 */
.info-card :deep(.grp) {
  padding: 0 22px;
}
.info-card :deep(.grp + .grp) {
  border-top: 1px solid $hairline-soft;
}
.info-card :deep(.grp-title) {
  font-family: $font-display;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: $ink;
  padding: 12px 0 2px;
}
.info-card :deep(.info-cols) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 36px;
  padding-bottom: 4px;
}
.info-card :deep(.info-col) {
  display: flex;
  flex-direction: column;
}
.info-card :deep(.info-col .field) {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid $hairline-soft;
}
.info-card :deep(.info-col .field:last-child) {
  border-bottom: none;
}
.info-card :deep(.info-col .field.remark-field) {
  align-items: flex-start;
}
.info-card :deep(.info-col .field .l) {
  font-size: 12px;
  color: $ink-faint;
  flex-shrink: 0;
  width: 84px;
}
.info-card :deep(.info-col .field .v) {
  font-size: 13px;
  font-weight: 500;
  text-align: left;
}
/* 计量预警：info-row 补左右内边距并对齐 card-head，加细分隔线 */
.meter-card :deep(.info-row) {
  padding: 11px 22px;
  border-bottom: 1px solid $hairline-soft;
}
.meter-card :deep(.info-row:last-child) {
  border-bottom: none;
}
/* 面包屑二级页签可点跳回列表,并区分激活色 */
.crumb :deep(.crumb-link) {
  cursor: pointer;
  color: $cobalt;
}
.crumb :deep(.crumb-link):hover {
  text-decoration: underline;
}
</style>
