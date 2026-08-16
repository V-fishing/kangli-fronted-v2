<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TlmTooling } from '@/api/types/tlm'
import type { NcmDefectDict } from '@/api/types/ncm'
import { tlmToolingApi } from '@/api/modules/tlm/tooling'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import { ncmDefectDictApi } from '@/api/modules/ncm/defect-dicts'

const router = useRouter()
const tab = ref<'locked' | 'life' | 'calib' | 'maint'>('locked')
const list = ref<TlmTooling[]>([])
const loading = ref(false)
const dicts = ref<NcmDefectDict[]>([])

const statusPill = (s: string) => ({ IN_USE: 'p-done', DISABLED: 'p-mute', REPAIRING: 'p-run', SCRAPPED: 'p-lock' }[s] || 'p-wait')
const statusText = (s: string) => ({ IN_USE: '在用', DISABLED: '停用', REPAIRING: '维修中', SCRAPPED: '报废' }[s] || s)
const abnPill = (t: string) => (t === 'calib' || t === 'life' || t === 'maint' ? 'p-lock' : 'p-wait')
const abnText = (t: string) => (t === 'calib' ? '校准逾期' : t === 'life' ? '寿命超限' : t === 'maint' ? '保养到期' : '锁定')

async function fetch() {
  loading.value = true
  try { list.value = await tlmToolingApi.abnormal(tab.value) } finally { loading.value = false }
}
function onTab(t: string) { tab.value = t as 'locked' | 'life' | 'calib'; fetch() }
function goDetail(id?: string) { if (id) router.push(`/tlm/tooling/${id}`) }

// ---- 发起不良(工装 → NCM 不良列表) ----
const defectDialog = ref(false)
const defectSubmitting = ref(false)
const defectRow = ref<TlmTooling | null>(null)
const defectForm = reactive({
  defectDictCode: '',
  severity: '一般',
  defectCount: 1,
  batchTotal: 1,
  remark: '',
})
function openDefect(row: TlmTooling) {
  defectRow.value = row
  Object.assign(defectForm, { defectDictCode: '', severity: '一般', defectCount: 1, batchTotal: 1, remark: '' })
  defectDialog.value = true
}
async function submitDefect() {
  if (!defectRow.value?.id) return
  if (!defectForm.defectDictCode) { ElMessage.warning('请选择缺陷编码'); return }
  defectSubmitting.value = true
  try {
    await ncmDefectRecordApi.create({
      source: '工装',
      toolId: defectRow.value.id,
      toolNo: defectRow.value.toolNo,
      defectDictCode: defectForm.defectDictCode,
      severity: defectForm.severity,
      defectCount: defectForm.defectCount,
      batchTotal: defectForm.batchTotal,
      remark: defectForm.remark || `工装异常发起:${defectRow.value.toolNo} ${abnText(tab.value)}`,
      stage: '半成品不良',
    } as any)
    ElMessage.success('已发起不良记录，已进入不良管理列表')
    defectDialog.value = false
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '发起失败')
  } finally {
    defectSubmitting.value = false
  }
}

onMounted(() => { fetch(); ncmDefectDictApi.list().then(d => dicts.value = d).catch(() => {}) })
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">工装管理</span><span class="crumb-sep">/</span><span class="crumb-link">异常</span></div>
        <h1>工装异常<span class="no mono">ABNORMAL</span></h1>
      </div>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-radio-group v-model="tab" @change="(t:any)=>onTab(t)">
        <el-radio-button value="locked">锁定</el-radio-button>
        <el-radio-button value="life">寿命超限</el-radio-button>
        <el-radio-button value="calib">校准逾期</el-radio-button>
        <el-radio-button value="maint">保养到期</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>异常清单</h2></div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="toolNo" label="编号" width="150"><template #default="{ row }"><span class="mono c-cobalt">{{ row.toolNo }}</span></template></el-table-column>
        <el-table-column prop="toolName" label="名称" min-width="180" />
        <el-table-column label="异常类型" width="120"><template #default="{ row }"><span class="pill" :class="abnPill(tab)"><span class="d"></span>{{ abnText(tab) }}</span></template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><span class="pill" :class="statusPill(row.status)"><span class="d"></span>{{ statusText(row.status) }}</span></template></el-table-column>
        <el-table-column label="数值" width="160">
          <template #default="{ row }">
            <span class="mono" v-if="tab === 'life'">{{ row.bindCount }}/{{ row.designLife }}</span>
            <span class="mono" v-else-if="tab === 'calib'">{{ row.calibDueDate }}</span>
            <span class="mono" v-else-if="tab === 'maint'">{{ row.nextMaintDate }}</span>
            <span class="mono" v-else>{{ row.locked ? '已锁定' : '正常' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goDetail(row.id)">详情</el-button>
            <el-button link type="warning" size="small" @click="openDefect(row)">发起不良</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && list.length === 0" style="padding:32px;text-align:center;color:$ink-faint;">暂无异常工装</div>
    </el-card>

    <el-dialog v-model="defectDialog" title="发起不良记录（工装来源）" width="520px" append-to-body>
      <div v-if="defectRow" style="margin-bottom:12px;font-size:13px;color:var(--el-text-color-regular);">
        工装：<span class="mono c-cobalt">{{ defectRow.toolNo }}</span> {{ defectRow.toolName }}
        <span class="pill" :class="abnPill(tab)"><span class="d"></span>{{ abnText(tab) }}</span>
      </div>
      <el-form :model="defectForm" label-width="80px">
        <el-form-item label="缺陷编码" required>
          <el-select v-model="defectForm.defectDictCode" filterable placeholder="选择不良字典" style="width:100%" v-loading="dicts.length===0">
            <el-option v-for="d in dicts" :key="d.code" :label="`${d.code} · ${d.name}`" :value="d.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重度" required>
          <el-select v-model="defectForm.severity" style="width:100%"><el-option v-for="s in ['严重','一般','轻微']" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="不良数量" required><el-input-number v-model="defectForm.defectCount" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="批次总数"><el-input-number v-model="defectForm.batchTotal" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="defectForm.remark" type="textarea" :rows="2" placeholder="如：工装磨损导致尺寸超差" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="defectDialog=false">取消</el-button>
        <el-button type="primary" :loading="defectSubmitting" @click="submitDefect">确认发起不良</el-button>
      </template>
    </el-dialog>
  </div>
</template>
