<template>
  <div class="alarm-list">
    <div class="head-b"><AppBreadcrumb /><h1>告警列表</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="状态"><el-select v-model="filter.status" clearable placeholder="全部" style="width:120px"><el-option value="待确认" /><el-option value="已关闭" /></el-select></el-form-item>
        <el-form-item label="级别"><el-select v-model="filter.level" clearable placeholder="全部" style="width:100px"><el-option value="报警" /><el-option value="预警" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetchData">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="code" label="告警编号" width="160" />
        <el-table-column prop="paramName" label="参数" />
        <el-table-column label="级别" width="80">
          <template #default="{row}"><span class="pill" :class="row.level==='报警'?'p-lock':'p-wait'"><span class="d"></span>{{ row.level }}</span></template>
        </el-table-column>
        <el-table-column label="触发规则" min-width="200">
          <template #default="{row}">{{ ruleName((row as SpcAlarm).triggeredRule) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{row}"><span class="pill" :class="row.status==='已关闭'?'p-done':'p-wait'"><span class="d"></span>{{ row.status }}</span></template>
        </el-table-column>
        <el-table-column label="告警时间" width="140">
          <template #default="{row}">{{ fmtMinute((row as SpcAlarm).alarmTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <el-button link type="info" size="small" @click="openDetail(row as SpcAlarm)">详情</el-button>
            <el-button v-if="(row as SpcAlarm).status !== '已关闭' && canCloseAlarm" link type="danger" size="small" @click="openClose(row as SpcAlarm)">关闭</el-button>
            <el-button v-if="canLaunch8d" link type="primary" size="small" @click="launch8d((row as SpcAlarm).id)">发起8D</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="closeVisible" title="关闭告警" width="380px" append-to-body>
      <el-form :model="closeForm" label-width="80px">
        <el-form-item label="关闭原因" required><el-input v-model="closeForm.closeReason" /></el-form-item>
        <el-form-item label="处置措施" required><el-input v-model="closeForm.disposition" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="closeVisible=false">取消</el-button><el-button type="primary" @click="submitClose">确认关闭</el-button></template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="告警详情" width="560px" destroy-on-close append-to-body>
      <div v-if="detailAlarm" v-loading="detailLoading" class="alarm-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="告警编号">{{ detailAlarm.code }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <span class="pill" :class="detailAlarm.status==='已关闭'?'p-done':'p-wait'"><span class="d"></span>{{ detailAlarm.status }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="参数">{{ detailAlarm.paramName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="级别">
            <span class="pill" :class="detailAlarm.level==='报警'?'p-lock':'p-wait'"><span class="d"></span>{{ detailAlarm.level }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="触发规则">{{ ruleName(detailAlarm.triggeredRule) }}</el-descriptions-item>
          <el-descriptions-item label="当前值">{{ detailAlarm.currentValue ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="工单号">{{ detailAlarm.woNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ detailAlarm.batchNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警时间" :span="2">{{ fmtMinute(detailAlarm.alarmTime) }}</el-descriptions-item>
          <el-descriptions-item label="处置措施" :span="2">{{ detailAlarm.disposition || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="关闭原因" :span="2">{{ detailAlarm.closeReason || '未填写' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-sec__title">8D 整改关联</div>
        <template v-if="detailLoading">
          <span class="muted">正在查询 8D 关联…</span>
        </template>
        <template v-else-if="linked8d">
          <el-descriptions :column="2" border size="small" class="mt-8">
            <el-descriptions-item label="8D 编号">{{ linked8d.d8No || linked8d.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="linked8d.status === '已闭环' ? 'success' : 'warning'" size="small" effect="dark">
                {{ linked8d.status }}<template v-if="linked8d.status === '已闭环'"> · 已结束</template>
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前阶段">{{ linked8d.currentStage || '-' }}</el-descriptions-item>
            <el-descriptions-item label="严重度">{{ linked8d.severity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="问题概述" :span="2">{{ linked8d.issue || '-' }}</el-descriptions-item>
            <el-descriptions-item label="闭环日期" :span="2">{{ linked8d.closeDate || '未闭环' }}</el-descriptions-item>
          </el-descriptions>
          <div class="detail-sec__actions">
            <el-button type="primary" @click="go8d(linked8d!.id)">查看 8D 流程</el-button>
          </div>
        </template>
        <template v-else>
          <div class="detail-sec__empty">
            <span class="muted">该告警尚未发起 8D 整改。</span>
            <el-button type="warning" size="small" v-if="canLaunch8d" @click="launch8d(detailAlarm.id); detailVisible = false">立即发起 8D</el-button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { spcAlarmApi } from '@/api/modules/spc/alarms'
import { spcRuleApi } from '@/api/modules/spc/rules'
const perm = usePermissionStore()
// 告警操作按钮权限(后端 spc.alarm.close / spc.alarm.launch-8d 守卫)
const canCloseAlarm = computed(() => perm.has('spc.alarm.close'))
const canLaunch8d = computed(() => perm.has('spc.alarm.launch-8d'))
import type { SpcAlarm, SpcRule } from '@/api/types/spc'
import type { Qms8dReport } from '@/api/types/ncm'

const router = useRouter()
const list = ref<SpcAlarm[]>([])
const loading = ref(false)
const filter = reactive({ status: '', level: '' as string })
const closeVisible = ref(false)
const closeId = ref('')
const closeForm = reactive({ closeReason: '', disposition: '' })

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailAlarm = ref<SpcAlarm | null>(null)
const linked8d = ref<Qms8dReport | null>(null)

const ruleMap = reactive<Record<string, string>>({})
function ruleName(code?: string | null): string {
  if (!code) return '-'
  const name = ruleMap[code]
  return name ? `${code} ${name}` : code
}
function fmtMinute(v?: string | null): string {
  if (!v) return '-'
  const m = v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  return m ? m[0] : v
}
async function loadRules() {
  try {
    const rules = await spcRuleApi.list()
    rules.forEach((r: SpcRule) => { if (r.ruleCode) ruleMap[r.ruleCode] = r.ruleName })
  } catch { /* ignore */ }
}

async function fetchData() { loading.value = true; try { const all = await spcAlarmApi.list(); list.value = all.filter(r => (!filter.status || r.status === filter.status) && (!filter.level || r.level === filter.level)) } finally { loading.value = false } }
function openClose(row: SpcAlarm) { closeId.value = row.id; closeForm.closeReason = ''; closeForm.disposition = ''; closeVisible.value = true }
async function submitClose() { await spcAlarmApi.close(closeId.value, { ...closeForm }); ElMessage.success('告警已关闭'); closeVisible.value = false; fetchData() }
async function launch8d(id: string) { try { await spcAlarmApi.launch8d(id); ElMessage.success('已发起8D') } catch { /* */ } }
async function openDetail(row: SpcAlarm) {
  detailAlarm.value = row
  linked8d.value = null
  detailVisible.value = true
  detailLoading.value = true
  try {
    linked8d.value = await spcAlarmApi.linked8d(row.id)
  } catch {
    linked8d.value = null
  } finally {
    detailLoading.value = false
  }
}
function go8d(id: string) {
  detailVisible.value = false
  router.push(`/ncm/8d-reports/${id}`)
}
onMounted(() => { fetchData(); loadRules() })
</script>

<style scoped>
.alarm-detail { padding: 4px 2px; }
.muted { color: var(--el-text-color-secondary); font-size: 13px; }
.mt-8 { margin-top: 8px; }
.detail-sec__title {
  margin: 18px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 8px;
}
.detail-sec__actions { margin-top: 12px; text-align: right; }
.detail-sec__empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
</style>
