<template>
  <div class="audit-cfg">
    <div class="head-b">
      <div>
        <div class="crumb">SQM / 供应商质量 / 配置</div>
        <h1>审核人员配置</h1>
      </div>
      <el-button @click="goBack">返回</el-button>
    </div>
    <p class="tip">
      按审核类型配置会签人员及其否决权。保存后，该类型下所有计划的会签链会按新配置重建（下次打开详情生效）。
      仅「物料变更审核」默认由「质量主管」具一票否决权，其余类型无否决权——你也可在此自由调整。
    </p>

    <el-collapse v-model="activeNames" class="cfg-collapse">
      <el-collapse-item v-for="t in types" :key="t" :name="t">
        <template #title>
          <span class="t-title">{{ t }}</span>
          <el-tag size="small" type="info" effect="plain" class="t-count">{{ (configs[t] || []).length }} 人</el-tag>
          <el-tag v-if="(configs[t] || []).some(a => a.veto)" size="small" type="danger" effect="plain">含一票否决</el-tag>
        </template>

        <div class="auditors">
          <el-table :data="configs[t] || []" size="small" border>
            <el-table-column label="会签人" min-width="160">
              <template #default="{ row }">
                <el-input v-model="row.label" placeholder="如 质量主管 / 采购 / SQE" />
              </template>
            </el-table-column>
            <el-table-column label="角色码(ASCII)" width="180">
              <template #default="{ row }">
                <el-input v-model="row.role" placeholder="留空自动生成" />
              </template>
            </el-table-column>
            <el-table-column label="一票否决" width="120">
              <template #default="{ row }">
                <el-switch v-model="row.veto" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ row, $index }">
                <el-button link type="danger" size="small" @click="removeAuditor(t, $index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="row-actions">
            <el-button size="small" @click="addAuditor(t)">+ 添加会签人</el-button>
            <el-button size="small" type="primary" :loading="savingType === t" @click="save(t)">保存该类型</el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import type { SqmAuditorItem, SqmAuditApprovalCfg } from '@/api/types/sqm'
import { AUDIT_TYPE_META } from '@/views/sqm/auditTypeMeta'

const router = useRouter()
const types = Object.keys(AUDIT_TYPE_META)
const activeNames = ref<string[]>(types.slice(0, 1))
const configs = reactive<Record<string, SqmAuditorItem[]>>({})
const savingType = ref<string | null>(null)

function deriveRole(label: string, idx: number): string {
  const ascii = (label || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  return ascii || 'r' + idx
}

onMounted(async () => {
  for (const t of types) configs[t] = []
  try {
    const list = await sqmAuditApi.getAuditApprovalCfg()
    for (const cfg of (list || []) as SqmAuditApprovalCfg[]) {
      let items: SqmAuditorItem[] = []
      try { items = cfg.auditors ? JSON.parse(cfg.auditors) : [] } catch { items = [] }
      configs[cfg.auditType] = items
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '加载配置失败')
  }
})

function addAuditor(type: string) {
  if (!configs[type]) configs[type] = []
  configs[type].push({ role: '', label: '', veto: false })
}
function removeAuditor(type: string, idx: number) {
  configs[type].splice(idx, 1)
}
async function save(type: string) {
  const raw = configs[type] || []
  const auditors = raw.map((it, i) => ({
    role: (it.role || '').trim() || deriveRole(it.label, i),
    label: (it.label || '').trim(),
    veto: !!it.veto,
  })).filter(a => a.label)
  if (auditors.length === 0) { ElMessage.warning('请至少配置一名会签人'); return }
  savingType.value = type
  try {
    await sqmAuditApi.saveAuditApprovalCfg({ auditType: type, auditors })
    configs[type] = auditors
    ElMessage.success(`${type} 配置已保存`)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '保存失败')
  } finally {
    savingType.value = null
  }
}

function goBack() { router.back() }
</script>

<style lang="scss" scoped>
.audit-cfg { width: 100%; }
.head-b { margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.tip { color: #606266; font-size: 13px; line-height: 1.7; margin: 0 0 16px; background: #f5f7fa; padding: 12px 16px; border-radius: 8px; }
.cfg-collapse { background: $white; border: 1px solid $hairline; border-radius: 12px; padding: 0 8px; }
.t-title { font-weight: 600; margin-right: 10px; }
.t-count { margin-right: 8px; }
.auditors { padding: 8px 4px; }
.row-actions { margin-top: 10px; display: flex; gap: 10px; }
</style>
