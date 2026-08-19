<template>
  <div class="page-wrap rise" v-loading="loading">
    <div class="head-b" v-if="supplier">
      <div>
        <div class="crumb">
          <span class="crumb-node">供应商管理</span><span class="crumb-sep">/</span>
          <RouterLink to="/sqm/suppliers" class="crumb-link">供应商档案</RouterLink><span class="crumb-sep">/</span>
          <span class="crumb-node">详情</span>
        </div>
        <h1>{{ supplier.name }}<span class="no">{{ supplier.supplierNo || supplier.supplierCode || '' }}</span></h1>
        <div class="head-tags">
          <span class="pill" :class="levelPill(supplier.level)"><span class="d"></span>等级 {{ supplier.level || '未分级' }}</span>
          <span class="pill" :class="supplierStatusPill(supplier.status)"><span class="d"></span>{{ supplier.status || '—' }}</span>
          <span v-if="supplier.observeFlag" class="tag-b tag-ctq">重点观察</span>
          <span v-if="supplier.soleSourceFlag" class="tag-b">独家供应</span>
        </div>
      </div>
      <div class="head-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button v-if="canEdit" type="primary" @click="openEdit">编辑</el-button>
      </div>
    </div>

    <div class="seg-bar" v-if="supplier">
      <el-radio-group v-model="activeTab">
        <el-radio-button value="overview">档案概览</el-radio-button>
        <el-radio-button value="certs">资质证书</el-radio-button>
      </el-radio-group>
    </div>

    <template v-if="activeTab === 'overview' && supplier">
      <el-card class="card-b" :body-style="{ padding: '0' }" style="margin-bottom:16px">
        <div class="card-head"><h2>基本信息</h2></div>
        <div class="field-grid" style="margin-bottom:0">
          <div class="field"><div class="l">供应商编号</div><div class="v mono">{{ supplier.supplierNo || '—' }}</div></div>
          <div class="field"><div class="l">MES 编号</div><div class="v mono">{{ supplier.venCode || '—' }}</div></div>
          <div class="field"><div class="l">等级</div><div class="v"><span class="pill" :class="levelPill(supplier.level)"><span class="d"></span>{{ supplier.level || '未分级' }}</span></div></div>
          <div class="field"><div class="l">状态</div><div class="v"><span class="pill" :class="supplierStatusPill(supplier.status)"><span class="d"></span>{{ supplier.status || '—' }}</span></div></div>
          <div class="field"><div class="l">分类</div><div class="v">{{ supplier.category || '—' }}</div></div>
          <div class="field"><div class="l">统一信用代码</div><div class="v mono">{{ supplier.creditCode || '—' }}</div></div>
          <div class="field"><div class="l">联系人</div><div class="v">{{ supplier.contactPerson || '—' }}</div></div>
          <div class="field"><div class="l">联系电话</div><div class="v mono">{{ supplier.contactPhone || '—' }}</div></div>
          <div class="field"><div class="l">综合得分</div><div class="v mono">{{ supplier.score ?? '—' }}</div></div>
          <div class="field"><div class="l">最近审核</div><div class="v mono">{{ supplier.lastAuditDate || '—' }}</div></div>
          <div class="field"><div class="l">下次审核</div><div class="v mono">{{ supplier.nextAuditDate || '—' }}</div></div>
          <div class="field wide"><div class="l">地址</div><div class="v">{{ supplier.address || '—' }}</div></div>
        </div>
      </el-card>

      <el-card class="card-b" :body-style="{ padding: '0' }">
        <div class="card-head"><h2>关联数据概览</h2><span class="sub">点击卡片查看明细</span></div>
        <div class="rel-grid">
          <div class="rel-card" v-for="c in relCards" :key="c.label" @click="goRel(c)">
            <div class="rel-num" :class="{ 'c-red': c.danger && c.num > 0 }">{{ c.num }}</div>
            <div class="rel-label">{{ c.label }}</div>
            <span class="rel-go">查看 →</span>
          </div>
        </div>
      </el-card>
    </template>

    <template v-else-if="supplier">
      <el-card class="card-b" :body-style="{ padding: '0' }">
        <div class="card-head">
          <h2>资质证书（{{ certs.length }}）</h2>
          <el-button v-if="canEdit" type="primary" size="small" @click="openCertCreate">+ 新增证书</el-button>
        </div>
        <el-table :data="certs" size="small" border stripe empty-text="暂无资质证书" v-loading="certLoading">
          <el-table-column prop="certType" label="证书类型" width="180" show-overflow-tooltip />
          <el-table-column prop="certName" label="证书名称" min-width="140" show-overflow-tooltip />
          <el-table-column label="证书编号" width="170"><template #default="{ row }"><span class="mono">{{ row.certNo || '—' }}</span></template></el-table-column>
          <el-table-column label="发证日期" width="110"><template #default="{ row }"><span class="mono">{{ row.issueDate || '—' }}</span></template></el-table-column>
          <el-table-column label="有效期至" width="110"><template #default="{ row }"><span class="mono">{{ row.expiryDate || '—' }}</span></template></el-table-column>
          <el-table-column label="版本" width="70"><template #default="{ row }"><span class="mono">{{ row.certVersion ?? 1 }}</span></template></el-table-column>
          <el-table-column label="状态" width="90"><template #default="{ row }"><span class="pill" :class="certStatusPill(row.status)"><span class="d"></span>{{ row.status || '—' }}</span></template></el-table-column>
          <el-table-column label="临期预警" width="100"><template #default="{ row }"><span class="pill" :class="certWarn(row).pill"><span class="d"></span>{{ certWarn(row).text }}</span></template></el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.fileUrl" link type="primary" size="small" @click="downloadCertFile(row.fileUrl)">证照</el-button>
              <el-button v-if="canDelete" link type="danger" size="small" @click="deleteCert(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-dialog v-model="certDialog" :title="certEditing ? '编辑证书' : '新增证书'" width="560px" append-to-body>
      <el-form :model="certForm" label-width="90px">
        <el-form-item label="证书类型" required>
          <el-select v-model="certForm.certType" placeholder="选择证书类型" allow-create filterable style="width:100%">
            <el-option v-for="t in CERT_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="证书名称"><el-input v-model="certForm.certName" placeholder="如：医疗器械生产许可证（正本）" /></el-form-item>
        <el-form-item label="证书编号"><el-input v-model="certForm.certNo" placeholder="如：粤食药监械生产许 20261234 号" /></el-form-item>
        <el-form-item label="发证日期"><el-date-picker v-model="certForm.issueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择发证日期" style="width:100%" /></el-form-item>
        <el-form-item label="有效期至" required><el-date-picker v-model="certForm.expiryDate" type="date" value-format="YYYY-MM-DD" placeholder="选择有效期" style="width:100%" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="certForm.status" style="width:100%">
            <el-option label="生效" value="生效" /><el-option label="失效" value="失效" /><el-option label="过期" value="过期" />
          </el-select>
        </el-form-item>
        <el-form-item label="证照文件">
          <div class="cert-upload">
            <el-upload :show-file-list="false" :http-request="doCertUpload" accept=".pdf,.jpg,.jpeg,.png,.webp">
              <el-button :loading="uploading">上传证照</el-button>
            </el-upload>
            <template v-if="certForm.fileUrl">
              <span class="tag-b">已上传</span>
              <el-button link type="primary" size="small" @click="downloadCertFile(certForm.fileUrl!)">查看</el-button>
              <el-button link type="danger" size="small" @click="certForm.fileUrl = ''">移除</el-button>
            </template>
            <span v-else class="mute-tip">支持 PDF / 图片，上传后存至 MinIO</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="certDialog = false">取消</el-button>
        <el-button type="primary" :loading="certSaving" @click="submitCert">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialog" title="编辑供应商" width="520px" append-to-body>
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="名称" required><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="编号"><el-input v-model="editForm.supplierNo" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="editForm.category" placeholder="如 电子/五金/塑胶" /></el-form-item>
        <el-form-item label="信用代码"><el-input v-model="editForm.creditCode" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="editForm.contactPerson" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.contactPhone" /></el-form-item>
        <el-form-item label="等级">
          <el-select v-model="editForm.level" style="width:100%"><el-option v-for="l in ['A','B','C','D']" :key="l" :label="l" :value="l" /></el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width:100%">
            <el-option v-for="s in ['待审核','启用','冻结','淘汰']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址"><el-input v-model="editForm.address" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { supplierCertsApi } from '@/api/modules/sqm/supplier-certs'
import { fileApi } from '@/api/modules/common/files'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'
import type { SqmSupplier, SqmSupplierOverview, SqmSupplierCert } from '@/api/types/sqm'

const CERT_TYPES = ['营业执照', '医疗器械生产许可证', '医疗器械经营许可证']

const route = useRoute()
const router = useRouter()
const perm = usePermissionStore()
const auth = useAuthStore()
const id = route.params.id as string

const canEdit = computed(() => perm.has('sqm.supplier.create'))
const canDelete = computed(() => perm.has('sqm.supplier.delete'))

const loading = ref(false)
const overview = ref<SqmSupplierOverview | null>(null)
const supplier = computed(() => overview.value?.supplier || null)
const activeTab = ref<'overview' | 'certs'>('overview')

const levelPill = (l?: string) => ({ A: 'p-done', B: 'p-run', C: 'p-wait', D: 'p-lock' }[l || ''] || 'p-mute')
const supplierStatusPill = (s?: string) => ({ 待审核: 'p-wait', 启用: 'p-done', 冻结: 'p-mute', 淘汰: 'p-lock' }[s || ''] || 'p-mute')
const certStatusPill = (s?: string) => ({ 生效: 'p-done', 失效: 'p-mute', 过期: 'p-lock' }[s || ''] || 'p-mute')

function certWarn(c: SqmSupplierCert): { text: string; pill: string } {
  if (!c.expiryDate) return { text: '—', pill: 'p-mute' }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.floor((new Date(c.expiryDate).getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { text: '已过期', pill: 'p-lock' }
  if (diff <= 30) return { text: '临期', pill: 'p-wait' }
  return { text: '正常', pill: 'p-done' }
}

const relCards = computed(() => {
  const o = overview.value
  return [
    { label: '资质证书', num: o?.certCount ?? 0, action: 'certs' },
    { label: '审核计划', num: o?.auditCount ?? 0, path: '/sqm/audits' },
    { label: '绩效记录', num: o?.performanceCount ?? 0, path: '/sqm/performance' },
    { label: '来料异常', num: o?.abnormalCount ?? 0, path: '/sqm/abnormals', danger: true },
    { label: '物料变更', num: o?.changeCount ?? 0, path: '/sqm/changes' },
    { label: '来料批次', num: o?.lotCount ?? 0, path: '/sqm/supplier-lots' },
  ]
})

function goRel(c: any) {
  if (!supplier.value) return
  if (c.action === 'certs') { activeTab.value = 'certs'; return }
  router.push({ path: c.path, query: { supplierId: supplier.value.id, supplierName: supplier.value.name } })
}

// ── 资质证书 ──
const certs = ref<SqmSupplierCert[]>([])
const certLoading = ref(false)
const certDialog = ref(false)
const certEditing = ref(false)
const certSaving = ref(false)
const uploading = ref(false)
const certForm = reactive<Partial<SqmSupplierCert>>({})

async function loadCerts() {
  certLoading.value = true
  try { certs.value = await supplierCertsApi.list(id) } finally { certLoading.value = false }
}
function openCertCreate() {
  certEditing.value = false
  Object.assign(certForm, { certType: '', certName: '', certNo: '', issueDate: '', expiryDate: '', status: '生效', fileUrl: '' })
  certDialog.value = true
}
async function doCertUpload(options: any) {
  uploading.value = true
  try {
    const res = await fileApi.upload(options.file as File)
    certForm.fileUrl = res.path
    if (!certForm.certName) certForm.certName = res.fileName
    ElMessage.success('证照已上传')
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally { uploading.value = false }
}
async function submitCert() {
  if (!certForm.certType) { ElMessage.warning('请选择证书类型'); return }
  if (!certForm.expiryDate) { ElMessage.warning('请选择有效期'); return }
  certSaving.value = true
  try {
    await supplierCertsApi.create({ ...certForm, supplierId: id })
    ElMessage.success('已保存')
    certDialog.value = false
    await loadCerts()
    await loadOverview()
  } finally { certSaving.value = false }
}
async function deleteCert(row: SqmSupplierCert) {
  await ElMessageBox.confirm('确认删除该资质证书？', '提示', { type: 'warning' })
  await supplierCertsApi.delete(row.id)
  ElMessage.success('已删除')
  await loadCerts()
  await loadOverview()
}
function downloadCertFile(path: string) { fileApi.download(path) }

// ── 编辑供应商 ──
const editDialog = ref(false)
const editSaving = ref(false)
const editForm = reactive<Partial<SqmSupplier>>({})
function openEdit() {
  if (!supplier.value) return
  Object.assign(editForm, supplier.value)
  editDialog.value = true
}
async function submitEdit() {
  if (!editForm.name) { ElMessage.warning('请填写名称'); return }
  editSaving.value = true
  try {
    await sqmSupplierApi.update({ ...editForm, orgId: editForm.orgId || auth.user?.orgId })
    ElMessage.success('已更新')
    editDialog.value = false
    await loadOverview()
  } finally { editSaving.value = false }
}

async function loadOverview() {
  loading.value = true
  try { overview.value = await sqmSupplierApi.overview(id) } finally { loading.value = false }
}
function goBack() { router.back() }

onMounted(async () => {
  await loadOverview()
  if (supplier.value) await loadCerts()
})
</script>

<style lang="scss" scoped>
.page-wrap { width: 100%; }
.head-tags { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.seg-bar { margin-bottom: 16px; }
.field-grid { grid-template-columns: repeat(4, 1fr); }
.field.wide { grid-column: span 2; }
.rel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 18px 22px 22px; }
.rel-card {
  border: 1px solid $hairline; border-radius: 10px; padding: 18px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: border-color .15s, box-shadow .15s; background: $white;
}
.rel-card:hover { border-color: $cobalt; box-shadow: $shadow-md; }
.rel-num { font-family: $font-mono; font-size: 30px; font-weight: 700; line-height: 1.1; }
.rel-label { font-size: 13px; color: $ink-faint; }
.rel-go { font-size: 12px; color: $cobalt; }
.cert-upload { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mute-tip { font-size: 12px; color: $ink-faint; }
</style>
