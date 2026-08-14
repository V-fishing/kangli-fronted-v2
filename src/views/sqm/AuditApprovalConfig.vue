<template>
  <div class="audit-cfg">
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>审核配置<span class="no">APPROVAL CONFIG</span></h1>
      </div>
      <el-button @click="goBack">返回</el-button>
    </div>
    <p class="tip">
      统一配置各业务模块的审核/签批规则。供应商审核按类型配置会签人员及其否决权；8D 报告按阶段配置是否需审核人签名及指定签批人。
      保存后，新发起或推进的对应业务按此规则执行。
    </p>

    <!-- 供应商审核会签配置 -->
    <section class="cfg-section">
      <h2 class="sec-title">供应商审核会签</h2>
      <el-collapse v-model="activeNames" class="cfg-collapse">
        <el-collapse-item v-for="t in types" :key="t" :name="t">
          <template #title>
            <span class="t-title">{{ t }}</span>
            <el-tag size="small" type="info" effect="plain" class="t-count">{{ (configs[t] || []).length }} 人</el-tag>
            <el-tag v-if="(configs[t] || []).some(a => a.veto)" size="small" type="danger" effect="plain">含一票否决</el-tag>
          </template>

          <div class="auditors">
            <el-table :data="configs[t] || []" size="small" border>
              <el-table-column label="会签人(可多选)" min-width="260">
                <template #default="{ row }">
                  <el-select v-model="row.userIds" multiple filterable collapse-tags
                    placeholder="选择会签人(可多选)" style="width:100%" @change="onUserChange(row, $event)">
                    <el-option v-for="u in userOptions" :key="u.id" :label="u.realName || u.username" :value="u.id">
                      <span>{{ u.realName || u.username }}</span>
                      <span style="color:#999;margin-left:6px;font-size:12px">{{ u.username }}</span>
                    </el-option>
                  </el-select>
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
    </section>

    <!-- 8D 报告阶段签批配置 -->
    <section class="cfg-section">
      <h2 class="sec-title">8D 阶段签批</h2>
      <div class="card-b">
        <div class="card-head">
          <h3>阶段签批设置</h3>
          <el-button type="primary" size="small" :loading="saving8d" @click="save8d">保存配置</el-button>
        </div>
        <el-table :data="rows8d" size="small" border>
          <el-table-column label="阶段" width="160">
            <template #default="{ row }">{{ row.stageCode }} · {{ stageNames[row.stageCode] }}</template>
          </el-table-column>
          <el-table-column label="需要审核人签名" width="160" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.needApproval" />
            </template>
          </el-table-column>
          <el-table-column label="指定签批人" min-width="220">
            <template #default="{ row }">
              <el-input v-model="row.signer" placeholder="留空 = 任意审核人" :disabled="!row.needApproval" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <!-- 工装(TLM)报废/维修签批配置 -->
    <section class="cfg-section">
      <h2 class="sec-title">工装报废 / 维修签批</h2>
      <p class="tip">配置工装报废、维修的默认审批人（会签范式，复用审核会签配置）。发起报废/送修时从对应节点读取审批人，审批中心按指定审批人聚合待办。</p>
      <div class="card-b">
        <div class="card-head">
          <h3>工装报废审批人</h3>
          <el-button type="primary" size="small" :loading="savingTlm" @click="saveTlm">保存配置</el-button>
        </div>
        <el-table :data="tlmApprovers" size="small" border>
          <el-table-column label="审批人(可多选)" min-width="260">
            <template #default="{ row }">
              <el-select v-model="row.userIds" multiple filterable collapse-tags
                placeholder="选择报废审批人(可多选)" style="width:100%" @change="onTlmUserChange(row, $event)">
                <el-option v-for="u in userOptions" :key="u.id" :label="u.realName || u.username" :value="u.id">
                  <span>{{ u.realName || u.username }}</span>
                  <span style="color:#999;margin-left:6px;font-size:12px">{{ u.username }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="一票否决" width="120">
            <template #default="{ row }"><el-switch v-model="row.veto" /></template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row, $index }">
              <el-button link type="danger" size="small" @click="tlmApprovers.splice($index, 1)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="row-actions">
          <el-button size="small" @click="tlmApprovers.push({ userIds: [], role: '', label: '', veto: false })">+ 添加审批人</el-button>
        </div>
      </div>

      <div class="card-b" style="margin-top:18px">
        <div class="card-head">
          <h3>工装维修审批人</h3>
          <el-button type="primary" size="small" :loading="savingTlmRepair" @click="saveTlmRepair">保存配置</el-button>
        </div>
        <el-table :data="tlmRepairApprovers" size="small" border>
          <el-table-column label="审批人(可多选)" min-width="260">
            <template #default="{ row }">
              <el-select v-model="row.userIds" multiple filterable collapse-tags
                placeholder="选择维修审批人(可多选)" style="width:100%" @change="onTlmRepairUserChange(row, $event)">
                <el-option v-for="u in userOptions" :key="u.id" :label="u.realName || u.username" :value="u.id">
                  <span>{{ u.realName || u.username }}</span>
                  <span style="color:#999;margin-left:6px;font-size:12px">{{ u.username }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="一票否决" width="120">
            <template #default="{ row }"><el-switch v-model="row.veto" /></template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row, $index }">
              <el-button link type="danger" size="small" @click="tlmRepairApprovers.splice($index, 1)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="row-actions">
          <el-button size="small" @click="tlmRepairApprovers.push({ userIds: [], role: '', label: '', veto: false })">+ 添加审批人</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import { usersApi } from '@/api/modules/uop/users'
import type { SqmAuditorItem, SqmAuditApprovalCfg } from '@/api/types/sqm'
import type { UserSelectVo } from '@/api/types/uop'
import type { D8Stage, EightDApprovalConfig } from '@/api/types/ncm'
import { AUDIT_TYPE_META } from '@/views/sqm/auditTypeMeta'

const router = useRouter()
const types = Object.keys(AUDIT_TYPE_META)
const activeNames = ref<string[]>(types.slice(0, 1))
const configs = reactive<Record<string, SqmAuditorItem[]>>({})
const savingType = ref<string | null>(null)
const userOptions = ref<UserSelectVo[]>([])

// ── 8D 阶段签批配置 ──
const ALL8D: D8Stage[] = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8']
const stageNames: Record<D8Stage, string> = {
  D1: '建立小组', D2: '问题描述', D3: '临时对策', D4: '根因分析',
  D5: '永久对策', D6: '对策验证', D7: '预防再发', D8: '结案',
}
const rows8d = ref<EightDApprovalConfig[]>([])
const saving8d = ref(false)

async function loadUsers() {
  try {
    userOptions.value = await usersApi.select()
  } catch {
    userOptions.value = []
  }
}

function deriveRole(label: string, idx: number): string {
  const ascii = (label || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  return ascii || 'r' + idx
}

// 角色码优先由所选用户 username 生成(唯一、ASCII 稳定),避免同名人员 label 相同导致后端 selectOne 冲突
function roleCodeFromUsername(username: string | undefined, idx: number): string {
  const ascii = (username || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  return ascii || ('r' + idx)
}

// 多选会签人:根据所选 userIds 推导展示名(label,多姓名用、分隔)与角色码(role)
function onUserChange(row: SqmAuditorItem, ids: string[]) {
  const picked = (userOptions.value || []).filter((x) => (ids || []).includes(x.id))
  if (picked.length) {
    if (!row.label) row.label = picked.map((u) => u.realName || u.username).join('、')
    // 角色码:取第一个用户的 username 派生(节点内多人共享同一 role 前缀,后端会加 seq 后缀保证唯一)
    row.role = roleCodeFromUsername(picked[0].username, 0)
  } else {
    row.label = ''
    row.role = ''
  }
}

// 兼容历史配置数据:
//  - 旧版 userIds 数组(可含多人)→ 整行保留为多人会签节点(不再拆行)
//  - 旧版单 userId → 包装成 [userId]
//  - 仅 role/label 的旧条目 → 按 label 反查用户回填 userIds
function normalizeItems(items: any[]): SqmAuditorItem[] {
  const out: SqmAuditorItem[] = []
  for (const it of items || []) {
    let ids: string[] = []
    if (Array.isArray(it.userIds) && it.userIds.length) ids = it.userIds
    else if (it.userId) ids = [it.userId]
    if (!ids.length) {
      const byLabel = (userOptions.value || []).find(
        (u) => u.realName === it.label || u.username === it.label)
      if (byLabel) ids = [byLabel.id]
    }
    if (!ids.length) {
      // 无绑定用户且反查失败:保留行,select 留空由用户手动指定
      out.push({ userIds: [], role: it.role || '', label: it.label || '', veto: !!it.veto })
      continue
    }
    const names = ids.map((uid: string) => {
      const u = (userOptions.value || []).find((x) => x.id === uid)
      return u ? (u.realName || u.username) : ''
    }).filter(Boolean)
    const firstU = (userOptions.value || []).find((x) => x.id === ids[0])
    out.push({
      userIds: ids,
      role: it.role || (firstU ? roleCodeFromUsername(firstU.username, out.length) : ''),
      label: it.label || names.join('、'),
      veto: !!it.veto,
    })
  }
  return out
}

// ── 8D 配置加载/保存 ──
async function load8d() {
  try {
    const list = await ncm8dApi.getApprovalConfig()
    rows8d.value = (list || []).map(c => ({
      stageCode: c.stageCode,
      needApproval: !!c.needApproval,
      signer: c.signer || null,
      sortOrder: c.sortOrder,
    }))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载 8D 配置失败')
  }
  ensureAll8d()
}
function ensureAll8d() {
  const have = new Set(rows8d.value.map(r => r.stageCode))
  for (const s of ALL8D) {
    if (!have.has(s)) rows8d.value.push({ stageCode: s, needApproval: false, signer: null })
  }
  rows8d.value.sort((a, b) => ALL8D.indexOf(a.stageCode) - ALL8D.indexOf(b.stageCode))
}
async function save8d() {
  saving8d.value = true
  try {
    await ncm8dApi.saveApprovalConfig(rows8d.value)
    ElMessage.success('8D 配置已保存')
    await load8d()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving8d.value = false
  }
}

// ── 工装(TLM)报废/维修签批配置 ──
const TLM_AUDIT_TYPE = '工装报废审核'
const TLM_REPAIR_AUDIT_TYPE = '工装维修审核'
const tlmApprovers = ref<any[]>([])
const tlmRepairApprovers = ref<any[]>([])
const savingTlm = ref(false)
const savingTlmRepair = ref(false)

function onTlmUserChange(row: any, ids: string[]) {
  const picked = (userOptions.value || []).filter((x) => (ids || []).includes(x.id))
  if (picked.length) {
    if (!row.label) row.label = picked.map((u) => u.realName || u.username).join('、')
    row.role = roleCodeFromUsername(picked[0].username, 0)
  } else { row.label = ''; row.role = '' }
}
function onTlmRepairUserChange(row: any, ids: string[]) {
  const picked = (userOptions.value || []).filter((x) => (ids || []).includes(x.id))
  if (picked.length) {
    if (!row.label) row.label = picked.map((u) => u.realName || u.username).join('、')
    row.role = roleCodeFromUsername(picked[0].username, 0)
  } else { row.label = ''; row.role = '' }
}
async function loadTlm() {
  try {
    const list = await sqmAuditApi.getAuditApprovalCfg()
    const cfg = (list || []).find((c: any) => c.auditType === TLM_AUDIT_TYPE)
    let items: any[] = []
    if (cfg && cfg.auditors) { try { items = JSON.parse(cfg.auditors) } catch { items = [] } }
    tlmApprovers.value = normalizeItems(items)
    const cfg2 = (list || []).find((c: any) => c.auditType === TLM_REPAIR_AUDIT_TYPE)
    let items2: any[] = []
    if (cfg2 && cfg2.auditors) { try { items2 = JSON.parse(cfg2.auditors) } catch { items2 = [] } }
    tlmRepairApprovers.value = normalizeItems(items2)
  } catch { tlmApprovers.value = []; tlmRepairApprovers.value = [] }
}
async function saveTlm() {
  const raw = tlmApprovers.value || []
  const auditors = raw.map((it: any, i: number) => {
    const ids: string[] = Array.isArray(it.userIds) ? it.userIds.filter(Boolean) : []
    if (ids.length === 0) return null
    const names = ids.map((uid: string) => {
      const u = (userOptions.value || []).find((x) => x.id === uid)
      return u ? (u.realName || u.username) : ''
    }).filter(Boolean)
    const label = (it.label || '').trim() || names.join('、')
    let role = (it.role || '').trim()
    if (!role && ids.length) {
      const u = (userOptions.value || []).find((x) => x.id === ids[0])
      role = roleCodeFromUsername(u ? u.username : undefined, i)
    }
    if (!role) role = deriveRole(label, i)
    return { userIds: ids, userId: ids.join(','), role, label, veto: !!it.veto }
  }).filter((a: any) => a && a.label)
  if (auditors.length === 0) { ElMessage.warning('请至少配置一名审批人'); return }
  savingTlm.value = true
  try {
    await sqmAuditApi.saveAuditApprovalCfg({ auditType: TLM_AUDIT_TYPE, auditors })
    ElMessage.success('工装报废审批配置已保存')
    await loadTlm()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '保存失败')
  } finally { savingTlm.value = false }
}
async function saveTlmRepair() {
  const raw = tlmRepairApprovers.value || []
  const auditors = raw.map((it: any, i: number) => {
    const ids: string[] = Array.isArray(it.userIds) ? it.userIds.filter(Boolean) : []
    if (ids.length === 0) return null
    const names = ids.map((uid: string) => {
      const u = (userOptions.value || []).find((x) => x.id === uid)
      return u ? (u.realName || u.username) : ''
    }).filter(Boolean)
    const label = (it.label || '').trim() || names.join('、')
    let role = (it.role || '').trim()
    if (!role && ids.length) {
      const u = (userOptions.value || []).find((x) => x.id === ids[0])
      role = roleCodeFromUsername(u ? u.username : undefined, i)
    }
    if (!role) role = deriveRole(label, i)
    return { userIds: ids, userId: ids.join(','), role, label, veto: !!it.veto }
  }).filter((a: any) => a && a.label)
  if (auditors.length === 0) { ElMessage.warning('请至少配置一名审批人'); return }
  savingTlmRepair.value = true
  try {
    await sqmAuditApi.saveAuditApprovalCfg({ auditType: TLM_REPAIR_AUDIT_TYPE, auditors })
    ElMessage.success('工装维修审批配置已保存')
    await loadTlm()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '保存失败')
  } finally { savingTlmRepair.value = false }
}

onMounted(async () => {
  for (const t of types) configs[t] = []
  await loadUsers()
  try {
    const list = await sqmAuditApi.getAuditApprovalCfg()
    for (const cfg of (list || []) as SqmAuditApprovalCfg[]) {
      let items: any[] = []
      try { items = cfg.auditors ? JSON.parse(cfg.auditors) : [] } catch { items = [] }
      configs[cfg.auditType] = normalizeItems(items)
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '加载配置失败')
  }
  await load8d()
  await loadTlm()
})

function addAuditor(type: string) {
  if (!configs[type]) configs[type] = []
  configs[type].push({ userIds: [], role: '', label: '', veto: false })
}
function removeAuditor(type: string, idx: number) {
  configs[type].splice(idx, 1)
}
async function save(type: string) {
  const raw = configs[type] || []
  const auditors = raw.map((it, i) => {
    // 多选会签人:userIds 为数组,合并成逗号串 userId(后端 OR 语义任一可签)
    const ids: string[] = Array.isArray(it.userIds) ? it.userIds.filter(Boolean) : (it.userId ? [it.userId] : [])
    if (ids.length === 0) return null
    // 展示名:多人用、分隔
    const names = ids.map((uid) => {
      const u = (userOptions.value || []).find((x) => x.id === uid)
      return u ? (u.realName || u.username) : ''
    }).filter(Boolean)
    const label = (it.label || '').trim() || names.join('、')
    // 角色码:优先 username 派生,未选则 label 派生(后端会加 seq 后缀保证节点唯一)
    let role = (it.role || '').trim()
    if (!role && ids.length) {
      const u = (userOptions.value || []).find((x) => x.id === ids[0])
      role = roleCodeFromUsername(u ? u.username : undefined, i)
    }
    if (!role) role = deriveRole(label, i)
    return {
      userIds: ids,
      userId: ids.join(','),
      role,
      label,
      veto: !!it.veto,
    }
  }).filter((a): a is NonNullable<typeof a> => !!a && !!a.label)
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
.head-b h1 .no { font-family: $font-mono; font-size: 12px; color: $ink-faint; margin-left: 12px; letter-spacing: 2px; font-weight: 500; }
.tip { color: #606266; font-size: 13px; line-height: 1.7; margin: 0 0 16px; background: #f5f7fa; padding: 12px 16px; border-radius: 8px; }
.cfg-section { margin-bottom: 24px; }
.sec-title { font-family: $font-display; font-size: 16px; font-weight: 700; margin: 0 0 12px; padding-left: 10px; border-left: 3px solid $cobalt; }
.cfg-collapse { background: $white; border: 1px solid $hairline; border-radius: 12px; padding: 0 8px; }
.t-title { font-weight: 600; margin-right: 10px; }
.t-count { margin-right: 8px; }
.auditors { padding: 8px 4px; }
.row-actions { margin-top: 10px; display: flex; gap: 10px; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; padding: 16px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-head h3 { font-family: $font-display; font-size: 15px; font-weight: 700; }
</style>
