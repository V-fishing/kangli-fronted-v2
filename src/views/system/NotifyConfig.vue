<template>
  <div class="notify-cfg rise">
    <!-- 统一页头 -->
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>通知配置<span class="no">NOTIFY CONFIG</span></h1>
      </div>
      <div class="head-actions">
        <el-button :loading="saving" type="primary" @click="saveAll">保存全部更改</el-button>
      </div>
    </div>

    <!-- 群机器人渠道(webhook) -->
    <div class="card-b channel-card">
      <div class="card-head">
        <h2>群机器人渠道</h2>
        <span class="sub">钉钉 / 企业微信等 Webhook，留空则跳过推送</span>
      </div>
      <div class="card-body">
        <div v-if="webhookChannels.length" class="chan-grid">
          <div v-for="ch in webhookChannels" :key="ch.id" class="chan-row" :class="{ off: !ch.isEnabled }">
            <div class="chan-meta">
              <span class="chan-name">{{ ch.channel }}</span>
              <el-switch v-model="ch.isEnabled" size="small" @change="() => (chDirty = true)" />
            </div>
            <el-input
              v-model="ch.webhookUrl"
              size="default"
              placeholder="webhook 地址（https://...）"
              clearable
              @input="() => (chDirty = true)"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
        <div v-else class="empty-tip">暂无群机器人渠道</div>
      </div>
    </div>

    <!-- 点对点渠道(direct) -->
    <div class="card-b channel-card">
      <div class="card-head">
        <h2>点对点渠道</h2>
        <span class="sub">钉钉应用消息 / 企业微信应用消息 / 邮件 / 短信，用于指派负责人、通知中心手动发起</span>
      </div>
      <div class="card-body">
        <div v-if="directChannels.length" class="chan-grid">
          <div v-for="ch in directChannels" :key="ch.id" class="chan-row" :class="{ off: !ch.isEnabled }">
            <div class="chan-meta">
              <span class="chan-name">
                {{ ch.channel }}
                <el-tag v-if="isDirectConfigured(ch)" type="success" size="small" effect="light">已配置</el-tag>
                <el-tag v-else type="info" size="small" effect="plain">待配置</el-tag>
              </span>
              <span class="chan-actions">
                <el-switch v-model="ch.isEnabled" size="small" @change="() => (chDirty = true)" />
                <el-button link type="primary" size="small" @click="openDirectConfig(ch)">配置</el-button>
              </span>
            </div>
            <div class="chan-desc">{{ ch.remark || '点对点通知渠道' }}</div>
          </div>
        </div>
        <div v-else class="empty-tip">暂无点对点渠道</div>
      </div>
    </div>

    <!-- 模块分组 -->
    <div v-for="grp in grouped" :key="grp.module" class="card-b mod-card">
      <div class="card-head">
        <h2>{{ grp.moduleLabel }}</h2>
        <span class="sub">{{ grp.items.length }} 个事件</span>
      </div>
      <div class="card-body">
        <table>
          <thead>
            <tr>
              <th style="width: 22%">事件</th>
              <th style="width: 12%">状态</th>
              <th style="width: 17%">接收角色</th>
              <th style="width: 27%">接收人</th>
              <th style="width: 22%">外部渠道</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in grp.items" :key="item.id" :class="{ disabled: !item.enabled }">
              <td>
                <div class="ev-name">{{ item.eventName }}</div>
                <div class="ev-code mono">{{ item.module }}.{{ item.eventCode }}</div>
              </td>
              <td>
                <el-switch
                  v-model="item.enabled"
                  size="small"
                  active-text="启用"
                  inactive-text="停用"
                  @change="() => markDirty(item)"
                />
              </td>
              <td>
                <div class="chip-wrap">
                  <button
                    v-for="r in roleOptions"
                    :key="r.code"
                    type="button"
                    class="chip"
                    :class="{ on: item._roles.includes(r.code), disabled: !item.enabled }"
                    :disabled="!item.enabled"
                    @click="toggleRole(item, r.code)"
                  >
                    {{ r.label }}
                  </button>
                </div>
              </td>
              <td>
                <el-select
                  v-model="item._receiverIds"
                  multiple
                  filterable
                  collapse-tags
                  collapse-tags-tooltip
                  clearable
                  size="small"
                  :disabled="!item.enabled"
                  placeholder="角色之外的具体人(可空)"
                  style="width: 100%"
                  @change="() => markDirty(item)"
                >
                  <el-option v-for="u in users" :key="u.id" :label="userLabel(u)" :value="u.id">
                    <span>{{ userLabel(u) }}</span>
                    <span class="usr-sub">{{ u.username }}</span>
                  </el-option>
                </el-select>
              </td>
              <td>
                <div class="chip-wrap">
                  <button
                    v-for="c in webhookChannels"
                    :key="c.id"
                    type="button"
                    class="chip ch"
                    :class="{ on: item._channels.includes(c.channel), disabled: !item.enabled }"
                    :disabled="!item.enabled"
                    @click="toggleChannel(item, c.channel)"
                  >
                    {{ c.channel }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 点对点渠道配置弹窗 -->
    <el-dialog v-model="directVisible" :title="`配置渠道 · ${directTarget?.channel || ''}`" width="520px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:14px"
        title="凭据保存后用于点对点发送;secret 类字段回显 ****,留空不修改" />
      <el-form v-if="directTarget" label-width="110px" style="margin-top:4px">
        <template v-for="f in directFieldDefs" :key="f.key">
          <el-form-item :label="f.label" v-if="f.boolean">
            <el-switch v-model="directForm[f.key]" />
          </el-form-item>
          <el-form-item :label="f.label" v-else-if="f.number">
            <el-input-number v-model="directForm[f.key]" :min="0" style="width:100%" />
          </el-form-item>
          <el-form-item :label="f.label" v-else>
            <el-input
              v-model="directForm[f.key]"
              :type="f.password ? 'password' : 'text'"
              :show-password="f.password"
              :placeholder="f.password && directForm[f.key] === '****' ? '留空不修改' : (f.placeholder || '请输入' + f.label)"
              clearable
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="directVisible=false">取消</el-button>
        <el-button type="primary" :loading="directSaving" @click="saveDirectConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Link } from '@element-plus/icons-vue'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { notifyConfigApi } from '@/api/modules/system/notify-config'
import type { NotifyConfig, NotifyChannel } from '@/api/types/system'
import type { UserSelectVo } from '@/api/types/uop'
import { MODULE_LABELS, ROLE_LABELS } from '@/api/types/system'

const channelList = ref<NotifyChannel[]>([])
const users = ref<UserSelectVo[]>([])
const editList = ref<EditItem[]>([])
const saving = ref(false)
const chDirty = ref(false)
const dirtyIds = reactive(new Set<string>())

const roleOptions = Object.entries(ROLE_LABELS).map(([code, label]) => ({ code, label }))

/** 用户下拉展示名:优先真实姓名,兜底登录名 */
function userLabel(u: UserSelectVo): string {
  return u.realName || u.username
}

// ══ 点对点(direct)渠道配置 ══
const webhookChannels = computed(() => channelList.value.filter((c) => c.channelType !== 'direct'))
const directChannels = computed(() => channelList.value.filter((c) => c.channelType === 'direct'))
const directVisible = ref(false)
const directSaving = ref(false)
const directTarget = ref<NotifyChannel | null>(null)
const directForm = reactive<Record<string, unknown>>({})

/** 渠道名 -> configJson type */
const DIRECT_TYPE_BY_NAME: Record<string, string> = {
  钉钉应用消息: 'dingtalk',
  企业微信应用消息: 'wecom',
  邮件: 'mail',
  短信: 'sms',
}

interface DirectFieldDef {
  key: string
  label: string
  password?: boolean
  number?: boolean
  boolean?: boolean
  placeholder?: string
}
const DIRECT_FIELDS: Record<string, DirectFieldDef[]> = {
  dingtalk: [
    { key: 'appKey', label: 'AppKey', placeholder: '钉钉开放平台应用的 AppKey' },
    { key: 'appSecret', label: 'AppSecret', password: true },
    { key: 'agentId', label: 'AgentId', placeholder: '钉钉应用的 AgentId' },
  ],
  wecom: [
    { key: 'corpId', label: 'CorpId', placeholder: '企业微信企业的 CorpId' },
    { key: 'agentId', label: 'AgentId', placeholder: '企业微信应用的 AgentId' },
    { key: 'secret', label: 'Secret', password: true },
  ],
  mail: [
    { key: 'host', label: 'SMTP 主机', placeholder: '如 smtp.qq.com' },
    { key: 'port', label: 'SMTP 端口', number: true },
    { key: 'username', label: '账号' },
    { key: 'password', label: '密码', password: true },
    { key: 'from', label: '发件人', placeholder: '发件邮箱地址' },
    { key: 'ssl', label: 'SSL', boolean: true },
  ],
  sms: [
    { key: 'provider', label: '服务商', placeholder: '短信服务商标识(预留)' },
    { key: 'appKey', label: 'AppKey' },
    { key: 'appSecret', label: 'AppSecret', password: true },
    { key: 'signName', label: '签名', placeholder: '短信签名' },
    { key: 'templateCode', label: '模板编码' },
  ],
}
const directFieldDefs = computed<DirectFieldDef[]>(() => {
  if (!directTarget.value) return []
  return DIRECT_FIELDS[directTypeOf(directTarget.value)] ?? []
})

function directTypeOf(ch: NotifyChannel): string {
  if (ch.configJson) {
    try {
      const j = JSON.parse(ch.configJson)
      if (j && typeof j.type === 'string' && j.type) return j.type
    } catch { /* ignore */ }
  }
  return DIRECT_TYPE_BY_NAME[ch.channel] ?? ''
}

/** 渠道是否已配置关键凭据(服务端脱敏后仍以关键字段非空判断) */
function isDirectConfigured(ch: NotifyChannel): boolean {
  if (!ch.configJson) return false
  try {
    const j = JSON.parse(ch.configJson)
    const required = directRequiredFields(directTypeOf(ch))
    return required.every((k) => j[k] !== undefined && String(j[k] ?? '').trim() !== '')
  } catch {
    return false
  }
}
function directRequiredFields(type: string): string[] {
  switch (type) {
    case 'dingtalk': return ['appKey', 'appSecret']
    case 'wecom': return ['corpId', 'secret']
    case 'mail': return ['host', 'username']
    case 'sms': return ['provider']
    default: return []
  }
}

function openDirectConfig(ch: NotifyChannel) {
  directTarget.value = ch
  Object.keys(directForm).forEach((k) => delete directForm[k])
  directForm.type = directTypeOf(ch)
  if (ch.configJson) {
    try {
      const j = JSON.parse(ch.configJson)
      Object.entries(j).forEach(([k, v]) => { if (k !== 'type') directForm[k] = v })
    } catch { /* ignore */ }
  }
  directVisible.value = true
}

async function saveDirectConfig() {
  const ch = directTarget.value
  if (!ch) return
  directSaving.value = true
  try {
    const json: Record<string, unknown> = { type: directTypeOf(ch) }
    for (const f of directFieldDefs.value) {
      json[f.key] = f.boolean ? !!directForm[f.key] : directForm[f.key]
    }
    await notifyConfigApi.updateChannel(ch.id, {
      enabled: ch.isEnabled,
      channelType: 'direct',
      configJson: JSON.stringify(json),
    })
    ElMessage.success('渠道配置已保存')
    directVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.message ?? ''))
  } finally {
    directSaving.value = false
  }
}

interface EditItem extends NotifyConfig {
  _roles: string[]
  _channels: string[]
  _receiverIds: string[]
}

const grouped = computed(() => {
  const map = new Map<string, EditItem[]>()
  for (const it of editList.value) {
    if (!map.has(it.module)) map.set(it.module, [])
    map.get(it.module)!.push(it)
  }
  return Array.from(map.entries()).map(([module, items]) => ({
    module,
    moduleLabel: MODULE_LABELS[module] ?? module,
    items,
  }))
})

function toEdit(list: NotifyConfig[]): EditItem[] {
  return list.map((c) => ({
    ...c,
    _roles: c.roleCodes ? c.roleCodes.split(',').map((s) => s.trim()).filter(Boolean) : [],
    _channels: c.channels ? c.channels.split(',').map((s) => s.trim()).filter(Boolean) : [],
    _receiverIds: c.receiverIds ? c.receiverIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
  }))
}

function markDirty(item: EditItem) {
  dirtyIds.add(item.id)
}
function toggleRole(item: EditItem, code: string) {
  const i = item._roles.indexOf(code)
  if (i >= 0) item._roles.splice(i, 1)
  else item._roles.push(code)
  markDirty(item)
}
function toggleChannel(item: EditItem, ch: string) {
  const i = item._channels.indexOf(ch)
  if (i >= 0) item._channels.splice(i, 1)
  else item._channels.push(ch)
  markDirty(item)
}

async function load() {
  const [cfg, chs, us] = await Promise.all([notifyConfigApi.list(), notifyConfigApi.channels(), notifyConfigApi.users()])
  channelList.value = chs
  users.value = us
  editList.value = toEdit(cfg)
  dirtyIds.clear()
  chDirty.value = false
}

async function saveAll() {
  saving.value = true
  try {
    if (chDirty.value) {
      for (const ch of channelList.value) {
        await notifyConfigApi.updateChannel(ch.id, {
          webhookUrl: ch.webhookUrl ?? '',
          enabled: ch.isEnabled,
        })
      }
    }
    for (const it of editList.value) {
      if (!dirtyIds.has(it.id)) continue
      await notifyConfigApi.update(it.id, {
        roleCodes: it._roles.join(','),
        receiverIds: it._receiverIds.join(','),
        channels: it._channels.join(','),
        enabled: it.enabled,
      })
      dirtyIds.delete(it.id)
    }
    ElMessage.success('通知配置已保存')
    await load()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.message ?? ''))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.notify-cfg { width: 100%; }

/* 外部渠道卡片 */
.channel-card { margin-bottom: 18px; }
.chan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px 20px;
}
.chan-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid $hairline;
  border-radius: $radius-md;
  background: $paper;
  transition: opacity 0.2s, border-color 0.2s;
  &.off { opacity: 0.62; }
}
.chan-meta { display: flex; align-items: center; justify-content: space-between; }
.chan-name { font-size: 13px; font-weight: 600; color: $ink; display: inline-flex; align-items: center; gap: 6px; }
.chan-actions { display: inline-flex; align-items: center; gap: 8px; }
.chan-desc { font-size: 12px; color: $ink-faint; line-height: 1.5; }
.empty-tip { color: $ink-faint; font-size: 12px; padding: 10px 2px; }

/* 模块表格 */
.mod-card { margin-bottom: 18px; }
.mod-card table { width: 100%; border-collapse: collapse; }
.mod-card th {
  text-align: left;
  padding: 11px 18px;
  font-size: 11px;
  color: $ink-faint;
  font-weight: 500;
  letter-spacing: 1px;
  border-bottom: 1px solid $hairline;
  background: $paper;
}
.mod-card td {
  padding: 12px 18px;
  font-size: 13px;
  border-bottom: 1px solid $hairline-soft;
  vertical-align: middle;
}
.mod-card tbody tr { transition: background 0.12s, opacity 0.2s; }
.mod-card tbody tr:hover { background: #fafaf8; }
.mod-card tbody tr:last-child td { border-bottom: none; }
.mod-card tbody tr.disabled { opacity: 0.55; }

.ev-name { font-size: 13px; font-weight: 600; color: $ink; }
.ev-code { font-size: 11px; color: $ink-faint; margin-top: 2px; }
.usr-sub { float: right; color: #9ca3af; font-size: 12px; }

/* 角色 / 渠道 chip 选择器 */
.chip-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 4px 10px;
  font-size: 12px;
  font-family: $font-body;
  border: 1px solid $hairline;
  border-radius: $radius-round;
  background: $white;
  color: $ink-soft;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.chip:hover:not(.disabled) { border-color: $cobalt; color: $cobalt; }
.chip.on {
  background: $cobalt-dim;
  border-color: $cobalt;
  color: $cobalt;
  font-weight: 500;
}
.chip.ch.on { background: $green-dim; border-color: $green; color: $green; }
.chip.disabled { cursor: not-allowed; opacity: 0.5; }
</style>
