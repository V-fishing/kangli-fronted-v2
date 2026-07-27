<template>
  <div class="record-list">
    <div class="head-b"><div class="crumb">NCM / 不良管理</div><h1>不良记录</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="缺陷编码"><el-input v-model="filter.defectDictCode" clearable placeholder="搜索" style="width:140px" /></el-form-item>
        <el-form-item label="工单号"><el-input v-model="filter.woNo" clearable placeholder="搜索" style="width:160px" /></el-form-item>
        <el-form-item label="严重度"><el-select v-model="filter.severity" clearable placeholder="全部" style="width:100px"><el-option v-for="s in ['严重','一般','轻微']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 录入不良</el-button></div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="defectNo" label="记录编号" width="170" />
        <el-table-column prop="woNo" label="工单号" width="140" />
        <el-table-column prop="processCode" label="工序" width="90" />
        <el-table-column prop="defectDictCode" label="缺陷编码" width="100" />
        <el-table-column prop="severity" label="严重度" width="80" />
        <el-table-column label="不良数/批总" width="90"><template #default="{row}"><span class="mono">{{ (row as NcmDefectRecord).defectCount }}/{{ (row as NcmDefectRecord).batchTotal }}</span></template></el-table-column>
        <el-table-column prop="disposition" label="处置" width="90" />
        <el-table-column prop="source" label="来源" width="90" />
        <el-table-column label="发生时间" width="160"><template #default="{row}">{{ fmtMinute((row as NcmDefectRecord).occurredAt) }}</template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="launch8d((row as NcmDefectRecord).id)">发起8D</el-button>
            <el-button link type="warning" size="small" @click="launchCapa((row as NcmDefectRecord).id)">发起CAPA</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="录入不良记录" width="520px">
      <el-form :model="form" label-width="80px">
        <!-- ══ 必填 ══ -->
        <el-form-item label="缺陷编码" required>
          <el-select v-model="form.defectDictCode" filterable placeholder="选择不良字典" style="width:100%" v-loading="dictLoading">
            <el-option v-for="d in dicts" :key="d.code" :label="`${d.code} · ${d.name}`" :value="d.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重度" required>
          <el-select v-model="form.severity" style="width:100%"><el-option v-for="s in ['严重','一般','轻微']" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="不良数量" required><el-input-number v-model="form.defectCount" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="批次总数"><el-input-number v-model="form.batchTotal" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <!-- ══ 常用 ══ -->
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="来源"><el-select v-model="form.source" clearable style="width:100%"><el-option v-for="s in sources" :key="s" :label="s" :value="s" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处置"><el-select v-model="form.disposition" clearable style="width:100%" placeholder="可选"><el-option v-for="d in dispos" :key="d" :label="d" :value="d" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="工单号"><el-input v-model="form.woNo" placeholder="如 WO-240726-001" /></el-form-item>
        <el-form-item label="工序编码"><el-input v-model="form.processCode" placeholder="如 注塑" /></el-form-item>
        <!-- ══ 更多信息(可折叠) ══ -->
        <el-divider><el-button link size="small" type="primary" @click="moreVisible=!moreVisible">{{ moreVisible?'收起':'更多信息' }}</el-button></el-divider>
        <template v-if="moreVisible">
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="设备编号"><el-input v-model="form.deviceCode" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="设备载荷"><el-input v-model="form.devicePayload" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="批次号"><el-input v-model="form.batchNo" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="产品型号"><el-input v-model="form.productModel" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="发生时间"><el-date-picker v-model="form.occurredAt" type="datetime" placeholder="默认当前时间" style="width:100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
        </template>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import { ncmDefectDictApi } from '@/api/modules/ncm/defect-dicts'
import type { NcmDefectRecord, NcmDefectDict } from '@/api/types/ncm'

const auth = useAuthStore()
const list = ref<NcmDefectRecord[]>([])
const loading = ref(false), dictLoading = ref(false)
const dicts = ref<NcmDefectDict[]>([])
const sources = ['手动', '首件检验', 'SQM', 'SPC']
const dispos = ['退货', '返修', '报废', '让步接收', '挑选', '合格入库']

const dialogVisible = ref(false), moreVisible = ref(false)
const filter = reactive({ defectDictCode: '', woNo: '', severity: '' })
// orgId / operatorId / defectNo 由后端自动处理,前端不传
const form = reactive({
  defectDictCode: '', woNo: '', processCode: '', severity: '一般', defectCount: 1, batchTotal: 1,
  deviceCode: '', devicePayload: '', batchNo: '', productModel: '', occurredAt: '', source: '手动', disposition: '', remark: '',
})

async function fetch() { loading.value = true; try { const all = await ncmDefectRecordApi.list(); list.value = all.filter(r => (!filter.defectDictCode || r.defectDictCode?.includes(filter.defectDictCode)) && (!filter.woNo || r.woNo?.includes(filter.woNo)) && (!filter.severity || r.severity === filter.severity)) } finally { loading.value = false } }
async function loadDicts() { dictLoading.value = true; try { dicts.value = await ncmDefectDictApi.list() } finally { dictLoading.value = false } }

function openCreate() {
  Object.assign(form, { defectDictCode: '', woNo: '', processCode: '', severity: '一般', defectCount: 1, batchTotal: 1, deviceCode: '', devicePayload: '', batchNo: '', productModel: '', occurredAt: '', source: '手动', disposition: '', remark: '' })
  dialogVisible.value = true
}

async function handleSubmit() { await ncmDefectRecordApi.create(form as any); ElMessage.success('已录入'); dialogVisible.value = false; fetch() }
async function launch8d(id: string) { try { await ncmDefectRecordApi.launch8d(id); ElMessage.success('已发起8D') } catch { /* */ } }
async function launchCapa(id: string) { try { await ncmDefectRecordApi.launchCapa(id); ElMessage.success('已发起CAPA') } catch { /* */ } }
function fmtMinute(v: any) { if (!v) return ''; const m = String(v).match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/); return m ? m[0].replace('T', ' ') : String(v) }
onMounted(() => { fetch(); loadDicts() })
</script>
