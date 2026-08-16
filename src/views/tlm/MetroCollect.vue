<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { ElMessage } from 'element-plus'
import { metroApi } from '@/api/modules/tlm/metro'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()

const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const woNo = ref('')
const filterJudged = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)

const judgedPill = (s: string) => (s === '合格' ? 'p-done' : 'p-lock')
const judgedText = (s: string) => (s === '合格' ? '合格' : '不合格')

async function fetch() {
  loading.value = true
  try {
    const res = await metroApi.collectPage({
      keyword: keyword.value || undefined,
      woNo: woNo.value || undefined,
      judged: filterJudged.value || undefined,
      page: page.value,
      size: size.value,
    })
    list.value = res.records || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载采集记录失败')
  } finally {
    loading.value = false
  }
}

function onSearch() { page.value = 1; fetch() }

// ---------------- 新增采集 ----------------
const gaugeOptions = ref<{ id: string; label: string }[]>([])
const createDialog = ref(false)
const creating = ref(false)
const form = ref({
  toolId: '', woNo: '', batchNo: '', measurePoint: '', measureValue: '',
  measureUnit: 'mm', standardValue: '', upperLimit: '', lowerLimit: '',
  judged: '合格', measureTime: '', operator: '', remark: '',
})

async function openCreate() {
  Object.assign(form.value, {
    toolId: '', woNo: '', batchNo: '', measurePoint: '', measureValue: '',
    measureUnit: 'mm', standardValue: '', upperLimit: '', lowerLimit: '',
    judged: '合格', measureTime: new Date().toISOString().slice(0, 10), operator: '', remark: '',
  })
  createDialog.value = true
  try {
    const res = await metroApi.gaugeList({ page: 1, size: 200 })
    gaugeOptions.value = (res.records || []).map((g: any) => ({ id: g.id, label: g.toolNo + ' ' + g.toolName }))
  } catch { gaugeOptions.value = [] }
}

async function submitCreate() {
  if (!form.value.toolId) { ElMessage.warning('请选择计量器具'); return }
  if (!form.value.measureValue) { ElMessage.warning('请填写实测值'); return }
  creating.value = true
  try {
    await metroApi.collectCreate({
      toolId: form.value.toolId,
      woNo: form.value.woNo || undefined,
      batchNo: form.value.batchNo || undefined,
      measurePoint: form.value.measurePoint || undefined,
      measureValue: form.value.measureValue,
      measureUnit: form.value.measureUnit || undefined,
      standardValue: form.value.standardValue || undefined,
      upperLimit: form.value.upperLimit || undefined,
      lowerLimit: form.value.lowerLimit || undefined,
      judged: form.value.judged,
      measureTime: form.value.measureTime ? form.value.measureTime + ' 00:00:00' : undefined,
      operator: form.value.operator || undefined,
      remark: form.value.remark || undefined,
    })
    ElMessage.success('已录入采集记录')
    createDialog.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '录入失败')
  } finally {
    creating.value = false
  }
}

onMounted(fetch)
</script>

<template>
  <div class="page-wrap rise">
    <div class="head-b">
      <div>
        <div class="crumb"><span class="crumb-node">计量管理</span><span class="crumb-sep">/</span><span class="crumb-link">计量数据采集</span></div>
        <h1>计量数据采集<span class="no mono">GAUGE</span></h1>
      </div>
      <el-button v-if="perm.has('tlm.metro.collect')" type="primary" @click="openCreate">+ 新增采集</el-button>
    </div>

    <el-card class="card-b filter-bar" :body-style="{ padding: '16px 22px' }">
      <el-form :inline="true" @submit.prevent="onSearch">
        <el-form-item label="器具">
          <el-input v-model="keyword" placeholder="编号 / 名称" clearable style="width:200px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="工单号">
          <el-input v-model="woNo" placeholder="绑定工单号" clearable style="width:180px" @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
        <el-form-item label="判定">
          <el-select v-model="filterJudged" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-b" :body-style="{ padding: '0' }">
      <div class="card-head"><h2>采集记录</h2></div>
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column label="器具" min-width="200">
          <template #default="{ row }">
            <span class="mono">{{ row.toolNo || '—' }}</span>
            <span v-if="row.toolName" style="margin-left:6px;">{{ row.toolName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="工单号" width="150"><template #default="{ row }"><span class="mono">{{ row.woNo || '—' }}</span></template></el-table-column>
        <el-table-column label="批次号" width="150"><template #default="{ row }"><span class="mono">{{ row.batchNo || '—' }}</span></template></el-table-column>
        <el-table-column label="计量点位" width="120"><template #default="{ row }">{{ row.measurePoint || '—' }}</template></el-table-column>
        <el-table-column label="实测值" width="130"><template #default="{ row }"><span class="mono c-cobalt">{{ row.measureValue || '—' }}</span><span class="mute" v-if="row.measureUnit"> {{ row.measureUnit }}</span></template></el-table-column>
        <el-table-column label="标准值" width="110"><template #default="{ row }"><span class="mono">{{ row.standardValue || '—' }}</span></template></el-table-column>
        <el-table-column label="允差" min-width="150"><template #default="{ row }">
          <span v-if="row.lowerLimit || row.upperLimit" class="mono">{{ row.lowerLimit || '−' }} ~ {{ row.upperLimit || '−' }}</span>
          <span v-else class="mute">—</span>
        </template></el-table-column>
        <el-table-column label="判定" width="100"><template #default="{ row }"><span class="pill" :class="judgedPill(row.judged)"><span class="d"></span>{{ judgedText(row.judged) }}</span></template></el-table-column>
        <el-table-column label="测量时间" width="170"><template #default="{ row }"><span class="mono">{{ (row.measureTime || '').slice(0, 19) || '—' }}</span></template></el-table-column>
        <el-table-column label="操作员" width="100"><template #default="{ row }">{{ row.operator || '—' }}</template></el-table-column>
      </el-table>

      <div style="padding:14px 22px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="createDialog" title="新增计量采集" width="640px" append-to-body>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><label class="l">计量器具 *</label>
          <el-select v-model="form.toolId" filterable placeholder="选择 GAUGE 器具" style="width:100%">
            <el-option v-for="g in gaugeOptions" :key="g.id" :label="g.label" :value="g.id" />
          </el-select>
        </div>
        <div><label class="l">计量点位</label><el-input v-model="form.measurePoint" placeholder="如：长度/直径/温度" style="width:100%" /></div>
        <div><label class="l">实测值 *</label><el-input v-model="form.measureValue" placeholder="如：10.02" style="width:100%" /></div>
        <div><label class="l">单位</label>
          <el-select v-model="form.measureUnit" style="width:100%">
            <el-option label="mm" value="mm" /><el-option label="μm" value="μm" />
            <el-option label="℃" value="℃" /><el-option label="%" value="%" />
            <el-option label="g" value="g" /><el-option label="其他" value="" />
          </el-select>
        </div>
        <div><label class="l">标准值</label><el-input v-model="form.standardValue" style="width:100%" /></div>
        <div><label class="l">允差上限</label><el-input v-model="form.upperLimit" style="width:100%" /></div>
        <div><label class="l">允差下限</label><el-input v-model="form.lowerLimit" style="width:100%" /></div>
        <div><label class="l">工单号</label><el-input v-model="form.woNo" placeholder="绑定工单号" style="width:100%" /></div>
        <div><label class="l">批次号</label><el-input v-model="form.batchNo" placeholder="绑定批次号" style="width:100%" /></div>
        <div><label class="l">测量时间</label><el-date-picker v-model="form.measureTime" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></div>
        <div><label class="l">操作员</label><el-input v-model="form.operator" style="width:100%" /></div>
        <div><label class="l">判定</label>
          <el-radio-group v-model="form.judged">
            <el-radio-button value="合格">合格</el-radio-button>
            <el-radio-button value="不合格">不合格</el-radio-button>
          </el-radio-group>
        </div>
        <div style="grid-column:1 / -1"><label class="l">备注</label><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" /></div>
      </div>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" :disabled="creating" @click="submitCreate">{{ creating ? '提交中' : '确认录入' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-wrap :deep(.pill) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}
.page-wrap :deep(.pill .d) { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.page-wrap :deep(.p-done) { background: $green-dim; color: $green; }
.page-wrap :deep(.p-done .d) { background: $green; }
.page-wrap :deep(.p-lock) { background: $signal-red-dim; color: $signal-red; }
.page-wrap :deep(.p-lock .d) { background: $signal-red; }
</style>
