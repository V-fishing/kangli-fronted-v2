<template>
  <div class="notify-center">
    <!-- 统一页头 -->
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>通知中心<span class="no">NOTIFY CENTER</span></h1>
      </div>
      <div class="head-actions">
        <el-button @click="$router.push('/system/notify-config')">通知配置</el-button>
        <el-button type="primary" :loading="sending" @click="openSend">+ 发起通知</el-button>
      </div>
    </div>

    <!-- 筛选条 -->
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width:120px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="filter.channel" clearable placeholder="全部" style="width:160px">
            <el-option v-for="c in allChannels" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" placeholder="标题/接收人" clearable style="width:200px" @keyup.enter="fetch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 发送记录 -->
    <el-card shadow="never" class="card-b">
      <el-table :data="records" v-loading="loading" size="small">
        <el-table-column label="发送时间" width="160">
          <template #default="{row}">{{ fmtTime((row as NotifyCenterRow).sendTime) }}</template>
        </el-table-column>
        <el-table-column label="发送人" width="110">
          <template #default="{row}">{{ (row as NotifyCenterRow).senderName || '—' }}</template>
        </el-table-column>
        <el-table-column label="接收人" width="110">
          <template #default="{row}">{{ (row as NotifyCenterRow).receiverName || '—' }}</template>
        </el-table-column>
        <el-table-column label="标题" min-width="180" show-overflow-tooltip>
          <template #default="{row}">{{ (row as NotifyCenterRow).title || '—' }}</template>
        </el-table-column>
        <el-table-column label="投递明细" min-width="200">
          <template #default="{row}">
            <span v-for="d in (row as NotifyCenterRow).deliveries" :key="d.channel || ''" class="ch-tag" :class="deliveryClass(d.status)">
              {{ d.channel }}<i class="ch-dot" :class="deliveryClass(d.status)"></i>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tooltip :content="failSummary(row as NotifyCenterRow)" placement="top">
              <el-tag :type="statusTagType((row as NotifyCenterRow).status)" size="small">{{ (row as NotifyCenterRow).status }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="关联单据" width="140">
          <template #default="{row}">
            <span v-if="(row as NotifyCenterRow).bizLink" class="biz-link" @click="goBiz(row as NotifyCenterRow)">{{ (row as NotifyCenterRow).bizNo || (row as NotifyCenterRow).bizId }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch"
          @size-change="fetch" />
      </div>
    </el-card>

    <!-- 发起通知弹窗 -->
    <el-dialog v-model="sendVisible" title="发起通知" width="560px" append-to-body>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:14px"
        title="选择接收人与渠道后发送,发送记录将在此页面可追溯;外部渠道失败不影响站内信与其他渠道" />
      <el-form :model="sendForm" label-width="80px">
        <el-form-item label="接收人" required>
          <el-select v-model="sendForm.receiverIds" multiple filterable clearable placeholder="选择一位或多位用户" style="width:100%">
            <el-option v-for="u in users" :key="u.id" :label="u.realName || u.username || u.id" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知渠道" required>
          <el-checkbox-group v-model="sendForm.channels">
            <el-checkbox v-for="c in directChannels" :key="c.id" :value="c.channel" :disabled="!c.isEnabled">
              {{ c.channel }}{{ c.isEnabled ? '' : '(未启用)' }}
            </el-checkbox>
          </el-checkbox-group>
          <div v-if="!directChannels.length" class="hint">暂无点对点渠道,请先到「通知配置」中配置</div>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="sendForm.title" placeholder="通知标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="sendForm.content" type="textarea" :rows="4" placeholder="通知正文,将点对点发送给所选接收人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible=false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="doSend">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// __TSC_NOCHECK_DISABLED__ // @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage } from 'element-plus'
import { notifyMessageApi } from '@/api/modules/system/notify-messages'
import { usersApi } from '@/api/modules/uop/users'
import type { NotifyCenterRow, NotifyChannel } from '@/api/types/system'
import type { UserSelectVo } from '@/api/types/uop'

const statusOptions = ['成功', '失败', '发送中']
const router = useRouter()
const loading = ref(false), sending = ref(false)
const records = ref<NotifyCenterRow[]>([])
const users = ref<UserSelectVo[]>([])
const directChannels = ref<NotifyChannel[]>([])
const allChannels = ref<string[]>([])
const page = ref(1), pageSize = usePageSize(), total = ref(0)
const filter = reactive({ status: '', channel: '', keyword: '' })

const sendVisible = ref(false)
const sendForm = reactive({ receiverIds: [] as string[], channels: [] as string[], title: '', content: '' })

async function fetch() {
  loading.value = true
  try {
    const res = await notifyMessageApi.centerPage({
      status: filter.status || undefined,
      channel: filter.channel || undefined,
      keyword: filter.keyword || undefined,
      page: page.value,
      size: pageSize.value,
    })
    records.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}
function search() { page.value = 1; fetch() }
function reset() { filter.status = ''; filter.channel = ''; filter.keyword = ''; search() }

async function loadOptions() {
  const [us, chs] = await Promise.all([usersApi.select(), notifyMessageApi.channels()])
  users.value = us
  directChannels.value = chs
  allChannels.value = chs.map((c) => c.channel).filter(Boolean) as string[]
}

function openSend() {
  sendForm.receiverIds = []
  sendForm.channels = directChannels.value.filter((c) => c.isEnabled).map((c) => c.channel)
  sendForm.title = ''
  sendForm.content = ''
  sendVisible.value = true
}

async function doSend() {
  if (!sendForm.receiverIds.length) { ElMessage.warning('请选择接收人'); return }
  if (!sendForm.channels.length) { ElMessage.warning('请至少选择一个通知渠道'); return }
  if (!sendForm.title.trim()) { ElMessage.warning('请输入标题'); return }
  if (!sendForm.content.trim()) { ElMessage.warning('请输入内容'); return }
  sending.value = true
  try {
    const n = await notifyMessageApi.send({
      receiverIds: sendForm.receiverIds,
      channels: sendForm.channels,
      title: sendForm.title.trim(),
      content: sendForm.content.trim(),
    })
    ElMessage.success(`已发送 ${n} 条通知`)
    sendVisible.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error('发送失败: ' + (e?.message ?? ''))
  } finally {
    sending.value = false
  }
}

function statusTagType(status: string): 'success' | 'danger' | 'primary' {
  if (status === '成功') return 'success'
  if (status === '失败') return 'danger'
  return 'primary' // 发送中
}

function fmtTime(v?: string | null) {
  if (!v) return ''
  const m = String(v).match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/)
  return m ? m[0].replace('T', ' ') : String(v)
}

function goBiz(row: NotifyCenterRow) {
  const link = row.bizLink
  if (!link) return
  router.push(link)
}

// 投递明细标签配色: 成功=绿 / 发送中=蓝 / 失败=红
function deliveryClass(status?: string | null): string {
  if (status === '成功') return 'ok'
  if (status === '失败') return 'fail'
  return 'run'
}
// 状态列 tooltip: 汇总该通知所有失败渠道的失败原因
function failSummary(row: NotifyCenterRow): string {
  const fails = (row.deliveries || []).filter(d => d.status === '失败' && d.failReason)
  return fails.length ? fails.map(d => `${d.channel}: ${d.failReason}`).join('；') : ''
}

onMounted(() => { fetch(); loadOptions() })
</script>

<style lang="scss" scoped>
.notify-center { width: 100%; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.hint { margin-top: 4px; color: #909399; font-size: 12px; }
.biz-link { color: $cobalt; cursor: pointer; font-weight: 600; }
.biz-link:hover { text-decoration: underline; }
// 投递明细标签: 渠道名 + 状态圆点(站内弹窗/钉钉/邮件...)
.ch-tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: $font-mono; font-size: 11px; line-height: 1;
  padding: 3px 7px; margin: 2px 6px 2px 0; border-radius: 4px;
  background: $hairline-soft; color: $ink-soft; white-space: nowrap;
}
.ch-tag .ch-dot { width: 6px; height: 6px; border-radius: 50%; background: $ink-faint; }
.ch-tag.ok { background: rgba($green, 0.12); color: $green; }
.ch-tag.ok .ch-dot { background: $green; }
.ch-tag.run { background: rgba($cobalt, 0.12); color: $cobalt; }
.ch-tag.run .ch-dot { background: $cobalt; }
.ch-tag.fail { background: rgba($signal-red, 0.12); color: $signal-red; }
.ch-tag.fail .ch-dot { background: $signal-red; }
</style>
