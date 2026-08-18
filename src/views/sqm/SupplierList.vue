<template>
  <div class="supplier-list">
    <div class="head-b"><AppBreadcrumb /><h1>供应商档案</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="名称"><el-input v-model="filterName" clearable placeholder="搜索" style="width:180px" /></el-form-item>
        <el-form-item label="等级"><el-select v-model="filterLevel" clearable placeholder="全部" style="width:100px"><el-option v-for="l in ['A','B','C','D']" :key="l" :label="l" :value="l" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="filterStatus" clearable placeholder="全部" style="width:110px"><el-option v-for="s in ['待审核','启用','冻结','淘汰']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" v-if="canManage" @click="openCreate()">+ 新建供应商</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe>
        <el-table-column type="index" label="#" width="50" :index="(i: number) => (page - 1) * size + i + 1" />
        <el-table-column prop="supplierNo" label="编号" width="120" />
        <el-table-column prop="name" label="名称" />
        <el-table-column label="等级" width="60"><template #default="{row}"><span class="pill" :class="levelClass((row as SqmSupplier).level)">{{ (row as SqmSupplier).level || '-' }}</span></template></el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="statusType((row as SqmSupplier).status)" size="small">{{ (row as SqmSupplier).status }}</el-tag></template></el-table-column>
        <el-table-column prop="score" label="得分" width="70" />
        <el-table-column prop="lastAuditDate" label="最近审核" width="110" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="openDetail(row as SqmSupplier)">详情</el-button>
            <el-button link type="warning" size="small" v-if="canManage" @click="openEdit(row as SqmSupplier)">编辑</el-button>
            <el-button link type="danger" size="small" v-if="canDelete" @click="handleDelete((row as SqmSupplier).id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" v-model:current-page="page" v-model:page-size="size"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑供应商':'新建供应商'" width="480px" append-to-body>
      <el-form :model="form" label-width="80px">
        <el-form-item label="编号"><el-input v-model="form.supplierNo" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="如 电子/五金/塑胶" /></el-form-item>
        <el-form-item label="信用代码"><el-input v-model="form.creditCode" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status" style="width:100%"><el-option v-for="s in ['待审核','启用','冻结','淘汰']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>

    <!-- 供应商详情 -->
    <el-dialog v-model="detailVisible" title="供应商详情" width="680px" append-to-body>
      <template v-if="detailRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="编号">{{ detailRow.supplierNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ detailRow.name }}</el-descriptions-item>
          <el-descriptions-item label="等级"><span class="pill" :class="levelClass(detailRow.level)">{{ detailRow.level || '—' }}</span></el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusType(detailRow.status)" size="small">{{ detailRow.status || '—' }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="分类">{{ detailRow.category || '—' }}</el-descriptions-item>
          <el-descriptions-item label="信用代码">{{ detailRow.creditCode || '—' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailRow.contactPerson || '—' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ detailRow.contactPhone || '—' }}</el-descriptions-item>
          <el-descriptions-item label="得分">{{ detailRow.score ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="重点观察"><el-tag :type="detailRow.observeFlag ? 'warning' : 'info'" size="small">{{ detailRow.observeFlag ? '是' : '否' }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="最近审核">{{ detailRow.lastAuditDate || '—' }}</el-descriptions-item>
          <el-descriptions-item label="下次审核">{{ detailRow.nextAuditDate || '—' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ detailRow.address || '—' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>相关数据</el-divider>

        <div class="rel-grid" v-loading="relLoading">
          <div class="rel-card" @click="goRelated('/sqm/abnormals')">
            <div class="rel-num" :class="{ danger: relStats.abnormal > 0 }">{{ relStats.abnormal }}</div>
            <div class="rel-label">来料异常</div>
            <el-button link type="primary" size="small">查看 →</el-button>
          </div>
          <div class="rel-card" @click="goRelated('/sqm/audits')">
            <div class="rel-num">{{ relStats.audit }}</div>
            <div class="rel-label">审核计划</div>
            <el-button link type="primary" size="small">查看 →</el-button>
          </div>
          <div class="rel-card" @click="goRelated('/sqm/changes')">
            <div class="rel-num">{{ relStats.change }}</div>
            <div class="rel-label">物料变更</div>
            <el-button link type="primary" size="small">查看 →</el-button>
          </div>
          <div class="rel-card" @click="goRelated('/sqm/supplier-lots')">
            <div class="rel-num">{{ relStats.lot }}</div>
            <div class="rel-label">来料批次</div>
            <el-button link type="primary" size="small">查看 →</el-button>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible=false">关闭</el-button>
        <el-button type="warning" v-if="canManage" @click="detailVisible=false; openEdit(detailRow!)">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { sqmAbnormalApi } from '@/api/modules/sqm/abnormals'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmChangeApi } from '@/api/modules/sqm/changes'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import type { SqmSupplier } from '@/api/types/sqm'

const router = useRouter()
const auth = useAuthStore()
const perm = usePermissionStore()
const canManage = computed(() => perm.has('sqm.supplier.create'))
const canDelete = computed(() => perm.has('sqm.supplier.delete'))
const list = ref<SqmSupplier[]>([])
const loading = ref(false)
const filterName = ref(''), filterLevel = ref(''), filterStatus = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)
const dialogVisible = ref(false), isEdit = ref(false)
const form = reactive<Partial<SqmSupplier>>({ name: '', status: '启用' })

// ---------------- 详情弹窗 ----------------
const detailVisible = ref(false)
const detailRow = ref<SqmSupplier | null>(null)
const relLoading = ref(false)
const relStats = reactive({ abnormal: 0, audit: 0, change: 0, lot: 0 })

async function openDetail(r: SqmSupplier) {
  detailRow.value = r
  detailVisible.value = true
  relLoading.value = true
  Object.assign(relStats, { abnormal: 0, audit: 0, change: 0, lot: 0 })
  try {
    const [abnormals, audits, changes, lots] = await Promise.all([
      sqmAbnormalApi.list().catch(() => []),
      sqmAuditApi.listPlans().catch(() => []),
      sqmChangeApi.list().catch(() => []),
      sqmTraceApi.listLots().catch(() => []),
    ])
    relStats.abnormal = abnormals.filter(a => a.supplierId === r.id).length
    relStats.audit = audits.filter(a => a.supplierId === r.id).length
    relStats.change = changes.filter(c => c.supplierId === r.id).length
    const lotArr = Array.isArray(lots) ? lots : (lots as any)?.records || (lots as any)?.list || []
    relStats.lot = lotArr.filter((l: any) => l.supplierId === r.id).length
  } finally {
    relLoading.value = false
  }
}

function goRelated(path: string) {
  if (!detailRow.value) return
  detailVisible.value = false
  router.push({ path, query: { supplierId: detailRow.value.id, supplierName: detailRow.value.name } })
}

async function fetch() { loading.value = true; try { const res = await sqmSupplierApi.page({ keyword: filterName.value || undefined, level: filterLevel.value || undefined, status: filterStatus.value || undefined, page: page.value, size: size.value }); list.value = res.records; total.value = res.total } finally { loading.value = false } }
function openCreate() { isEdit.value = false; Object.assign(form, { supplierNo: '', name: '', category: '', creditCode: '', contactPerson: '', contactPhone: '', address: '', status: '启用' }); dialogVisible.value = true }
function openEdit(r: SqmSupplier) { isEdit.value = true; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await sqmSupplierApi.update({ ...form, orgId: form.orgId || auth.user?.orgId }); ElMessage.success('已更新') }
  else { await sqmSupplierApi.create({ ...form, orgId: auth.user?.orgId }); ElMessage.success('已创建') }
  dialogVisible.value = false; page.value = 1; fetch()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await sqmSupplierApi.delete(id); ElMessage.success('已删除'); page.value = 1; fetch() }
function levelClass(l?: string) { return { A: 'p-done', B: 'p-run', C: 'p-wait', D: 'p-lock' }[l || ''] || '' }
function statusType(s?: string) { return { '启用': 'success', '待审核': 'warning', '冻结': 'info', '淘汰': 'danger' }[s || ''] || '' }
onMounted(() => fetch())
// 组织视图切换(梅州/深圳/全部)时自动重置分页并重新拉取,保证数据按所选分公司隔离
watch(() => auth.currentOrgId, () => { page.value = 1; fetch() })
</script>

<style lang="scss" scoped>
.supplier-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.p-done { background: $green-dim; color: $green; }
.p-run { background: $cobalt-dim; color: $cobalt; }
.p-wait { background: $amber-dim; color: $amber; }
.p-lock { background: $signal-red-dim; color: $signal-red; }
.rel-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.rel-card { border: 1px solid $hairline; border-radius: 10px; padding: 14px; text-align: center; cursor: pointer; transition: box-shadow .15s, border-color .15s; }
.rel-card:hover { border-color: $cobalt; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.rel-num { font-family: $font-display; font-size: 26px; font-weight: 800; line-height: 1.2; }
.rel-num.danger { color: $signal-red; }
.rel-label { font-size: 12px; color: $ink-faint; margin: 4px 0 6px; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>
