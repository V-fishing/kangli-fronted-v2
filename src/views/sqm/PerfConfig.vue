<template>
  <div class="perf-config-page">
    <div class="head-b"><AppBreadcrumb /><h1>绩效指标配置</h1></div>

    <el-card shadow="never" class="card-b">
      <div class="tip">配置各考核指标的权重与达标/挑战阈值，以及是否参与绩效计算、是否联动采购份额与供应商状态。保存后下一次自动计算即时生效。</div>
      <el-table :data="cfgs" v-loading="loading" size="small" border>
        <el-table-column prop="metricName" label="指标" min-width="160" />
        <el-table-column label="权重%" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.weight" :min="0" :max="100" :precision="2" :step="5" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="达标阈值%" width="120">
          <template #default="{ row }"><el-input-number v-model="row.target" :min="0" :max="100" :precision="2" controls-position="right" style="width:100%" /></template>
        </el-table-column>
        <el-table-column label="挑战阈值%" width="120">
          <template #default="{ row }"><el-input-number v-model="row.challenge" :min="0" :max="100" :precision="2" controls-position="right" style="width:100%" /></template>
        </el-table-column>
        <el-table-column label="参与计算" width="100">
          <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
        </el-table-column>
        <el-table-column label="状态联动" width="100">
          <template #default="{ row }"><el-switch v-model="row.autoLinkage" /></template>
        </el-table-column>
      </el-table>
      <div class="actions">
        <span class="weight-hint">当前参与计算权重合计：<b :class="{ warn: totalWeight !== 100 }">{{ totalWeight.toFixed(2) }}%</b><span v-if="totalWeight !== 100" class="warn-text">（建议合计 100，否则将自动归一）</span></span>
        <el-button type="primary" :loading="saving" @click="saveAll" v-if="canCfg">保存配置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { sqmPerfMetricCfgApi } from '@/api/modules/sqm/perfAnalysis'
import type { SqmPerfMetricCfg } from '@/api/types/sqm'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()
const canCfg = computed(() => perm.has('sqm.perf.cfg'))

const cfgs = ref<SqmPerfMetricCfg[]>([])
const loading = ref(false)
const saving = ref(false)

const totalWeight = computed(() =>
  cfgs.value.filter(c => c.enabled).reduce((s, c) => s + (Number(c.weight) || 0), 0)
)

async function load() {
  loading.value = true
  try {
    cfgs.value = await sqmPerfMetricCfgApi.list()
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function saveAll() {
  saving.value = true
  try {
    for (const c of cfgs.value) {
      await sqmPerfMetricCfgApi.save({
        id: c.id, metricCode: c.metricCode, metricName: c.metricName,
        weight: Number(c.weight) || 0, target: c.target != null ? Number(c.target) : undefined,
        challenge: c.challenge != null ? Number(c.challenge) : undefined,
        enabled: !!c.enabled, autoLinkage: !!c.autoLinkage,
      })
    }
    ElMessage.success('指标配置已保存，下次自动计算即时生效')
  } catch { /* ignore */ }
  finally { saving.value = false }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.perf-config-page {
  .head-b { margin-bottom: 20px; .crumb { font-size: 12px; color: $ink-faint; } h1 { font-size: 20px; font-weight: 600; margin: 4px 0 0; } }
  .card-b { border-radius: 10px; }
  .tip { color: $ink-faint; font-size: 13px; margin-bottom: 14px; line-height: 1.6; }
  .actions { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 16px; }
  .weight-hint { color: $ink-faint; font-size: 13px; }
  .warn { color: #c0392b; }
  .warn-text { color: #c77800; margin-left: 6px; }
}
</style>
