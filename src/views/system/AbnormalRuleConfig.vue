<template>
  <div class="abnormal-rule">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>异常严重度规则<span class="no">ABNORMAL RULE</span></h1>
      </div>
      <el-button v-permission="'sqm.abnormal.rule.config'" type="primary" @click="openCreate">+ 新建规则</el-button>
    </div>

    <div class="card-b">
      <el-table :data="rules" size="small" v-loading="loading" border stripe>
        <el-table-column label="序号" width="64" align="center">
          <template #default="{ $index }"><span class="mono">#{{ String($index + 1).padStart(2, '0') }}</span></template>
        </el-table-column>
        <el-table-column label="严重判定阈值" min-width="150">
          <template #default="{ row }">来料不良数 ≥ <b class="mono">{{ row.severeMinQty ?? '—' }}</b> 件判「严重」</template>
        </el-table-column>
        <el-table-column label="一般不良累计窗口" min-width="190">
          <template #default="{ row }"><b class="mono">{{ row.generalAccumDays ?? '—' }}</b> 天内累计 <b class="mono">{{ row.generalAccumQty ?? '—' }}</b> 件触发 8D</template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'sqm.abnormal.rule.config'" link type="primary" size="small" @click="openEdit(row as SqmAbnormalRule)">编辑</el-button>
            <el-button v-permission="'sqm.abnormal.rule.config'" link type="danger" size="small" @click="remove(row as SqmAbnormalRule)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && rules.length === 0" class="empty-tip">暂无异常严重度规则，点击右上角新建</div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="visible" :title="editId ? '编辑规则' : '新建规则'" width="540px" append-to-body>
      <el-form :model="form" label-width="130px">
        <el-form-item label="严重判定阈值" required>
          <el-input-number v-model="form.severeMinQty" :min="1" :max="999" class="rule-num" />
          <div class="hint">来料不良数 ≥ 该值判为「严重」（默认 3 件）</div>
        </el-form-item>
        <el-form-item label="累计窗口天数" required>
          <el-input-number v-model="form.generalAccumDays" :min="1" :max="365" class="rule-num" />
          <div class="hint">同供应商 + 同物料在窗口期内的不良计数周期（默认 30 天）</div>
        </el-form-item>
        <el-form-item label="累计触发件数" required>
          <el-input-number v-model="form.generalAccumQty" :min="1" :max="999" class="rule-num" />
          <div class="hint">窗口内一般不良累计达该件数自动触发 8D（默认 3 件）</div>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="规则备注说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { sqmAbnormalRuleApi } from '@/api/modules/sqm/abnormalRule'
import type { SqmAbnormalRule } from '@/api/types/sqm'

const loading = ref(false)
const saving = ref(false)
const rules = ref<SqmAbnormalRule[]>([])

const visible = ref(false)
const editId = ref('')
const form = reactive<Partial<SqmAbnormalRule>>({
  severeMinQty: 3, generalAccumDays: 30, generalAccumQty: 3, remark: '',
})

async function fetch() {
  loading.value = true
  try {
    rules.value = await sqmAbnormalRuleApi.list()
  } finally { loading.value = false }
}

function resetForm() {
  Object.assign(form, { severeMinQty: 3, generalAccumDays: 30, generalAccumQty: 3, remark: '' })
}

function openCreate() {
  editId.value = ''
  resetForm()
  visible.value = true
}

function openEdit(r: SqmAbnormalRule) {
  editId.value = r.id || ''
  Object.assign(form, {
    severeMinQty: r.severeMinQty ?? 3,
    generalAccumDays: r.generalAccumDays ?? 30,
    generalAccumQty: r.generalAccumQty ?? 3,
    remark: r.remark || '',
  })
  visible.value = true
}

async function submit() {
  if (!form.severeMinQty || !form.generalAccumDays || !form.generalAccumQty) {
    ElMessage.warning('请填写完整阈值参数')
    return
  }
  saving.value = true
  try {
    const payload: Partial<SqmAbnormalRule> = {
      severeMinQty: form.severeMinQty,
      generalAccumDays: form.generalAccumDays,
      generalAccumQty: form.generalAccumQty,
      remark: form.remark,
    }
    if (editId.value) payload.id = editId.value
    await sqmAbnormalRuleApi.save(payload)
    ElMessage.success(editId.value ? '已更新' : '已创建')
    visible.value = false
    fetch()
  } finally { saving.value = false }
}

async function remove(r: SqmAbnormalRule) {
  if (!r.id) return
  const { value } = await ElMessageBox.confirm(`确认删除该异常严重度规则？`, '删除确认', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
  }).catch(() => ({ value: false }))
  if (!value) return
  await sqmAbnormalRuleApi.remove(r.id)
  ElMessage.success('已删除')
  fetch()
}

onMounted(fetch)
</script>

<style lang="scss" scoped>
.abnormal-rule { width: 100%; }
.head-b {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 24px;
}
.head-b h1 {
  font-family: $font-display; font-size: 28px; font-weight: 800;
  display: flex; align-items: baseline; gap: 12px;
}
.head-b .no {
  font-family: $font-mono; font-size: 11px; letter-spacing: 2px;
  color: $ink-faint; font-weight: 500;
}
.card-b {
  background: $white; border: 1px solid $hairline; border-radius: 12px;
  padding: 4px 0;
}
.mono { font-family: $font-mono; }
.rule-num { width: 220px; }
.hint { font-size: 11px; color: $ink-faint; margin-top: 6px; line-height: 1.5; }
.empty-tip { padding: 24px; text-align: center; color: $ink-faint; font-size: 13px; }
</style>
