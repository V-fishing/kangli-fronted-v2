<template>
  <div class="message-center rise">
    <!-- 页头 -->
    <div class="head-b">
      <div>
        <AppBreadcrumb />
        <h1>消息中心</h1>
      </div>
      <div class="head-actions">
        <el-button :disabled="unread === 0" @click="readAll">全部已读</el-button>
        <el-button :icon="Refresh" circle @click="load" title="刷新" />
      </div>
    </div>

    <!-- 筛选条 -->
    <el-card class="card-b filter-bar" shadow="never">
      <div class="filter-inner">
        <el-radio-group v-model="unreadOnly" @change="onFilter">
          <el-radio-button :value="false">全部</el-radio-button>
          <el-radio-button :value="true">仅未读</el-radio-button>
        </el-radio-group>
        <el-select v-model="bizType" placeholder="全部分类" clearable style="width: 160px" @change="onFilter">
          <el-option label="全部分类" value="" />
          <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="标题 / 内容 / 类型关键字"
          clearable
          style="width: 260px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </el-card>

    <!-- 消息列表 -->
    <el-card class="card-b list-card" shadow="never">
      <el-table :data="rows" v-loading="loading" size="small" class="msg-table" @row-click="openRow">
        <el-table-column label="消息" min-width="300">
          <template #default="{ row }">
            <div class="msg-title" :class="{ unread: !row.isRead }">
              <span v-if="!row.isRead" class="dot"></span>
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="260">
          <template #default="{ row }">
            <div class="msg-content">{{ row.content || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="130">
          <template #default="{ row }">
            <span class="tag-b">{{ bizTypeLabel(row.bizType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            <span class="msg-time">{{ fmtTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click.stop="openDetail(row as SysNotification)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && rows.length === 0" class="empty-b">
        <el-empty description="暂无消息" :image-size="90" />
      </div>

      <div v-if="total > 0" class="pager-b">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="size"
          :current-page="page"
          :page-sizes="[20, 50, 100]"
          @current-change="onPage"
          @size-change="onSize"
        />
      </div>
    </el-card>

    <!-- 消息详情弹窗 -->
    <el-dialog v-model="detailVisible" title="消息详情" width="520px" align-center append-to-body>
      <div v-if="detail" class="detail-b">
        <div class="detail-row">
          <span class="detail-k">状态</span>
          <span class="detail-v">
            <span class="dot" v-if="!detail.isRead"></span>{{ detail.isRead ? '已读' : '未读' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-k">类型</span>
          <span class="detail-v"><span class="tag-b">{{ bizTypeLabel(detail.bizType) }}</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-k">时间</span>
          <span class="detail-v mono">{{ fmtTime(detail.createTime) }}</span>
        </div>
        <div class="detail-row col">
          <span class="detail-k">标题</span>
          <span class="detail-v">{{ detail.title || '—' }}</span>
        </div>
        <div class="detail-row col">
          <span class="detail-k">内容</span>
          <span class="detail-v body">{{ detail.content || '—' }}</span>
        </div>
      </div>
      <template #footer>
        <el-button v-if="detail && detail.link" type="primary" @click="goDetail">前往处理</el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { Refresh } from '@element-plus/icons-vue'
import { notificationApi } from '@/api/modules/common/notifications'
import { useNotifications } from '@/hooks/useNotifications'
import type { SysNotification } from '@/api/types/notify'

const router = useRouter()

const rows = ref<SysNotification[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const unreadOnly = ref(false)
const bizType = ref('')
const loading = ref(false)

// 与顶栏铃铛共用同一数据源/未读计数,保证徽标实时联动
const { unread, fmtTime, markRead, markAll, startPolling } = useNotifications()

const BIZ_TYPE_LABEL: Record<string, string> = {
  abnormal_overdue: '异常超期',
  audit_task: '审核任务',
  fia_overdue: '首件超期',
  spc_alarm: 'SPC 报警',
  fia_task: '首件任务',
  spc_collect: 'SPC 采集',
  ncm_8d: '8D 报告',
  sqm_change: '物料变更',
  capa_action: 'CAPA 措施',
  NCM_ASSIGN: 'NCM 指派',
  PATROL: '巡检',
  SYS: '系统通知',
}

// 分类筛选项(与标签映射同源;新增业务类型时在此追加即可)
const categories = Object.entries(BIZ_TYPE_LABEL).map(([value, label]) => ({ value, label }))

function bizTypeLabel(t?: string) {
  if (!t) return '—'
  return BIZ_TYPE_LABEL[t] || t
}

// 详情弹窗状态
const detailVisible = ref(false)
const detail = ref<SysNotification | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await notificationApi.listPage({
      page: page.value,
      size: size.value,
      keyword: keyword.value.trim() || undefined,
      unread: unreadOnly.value || undefined,
      bizType: bizType.value || undefined,
    })
    rows.value = res.records ?? []
    total.value = res.total ?? 0
  } catch {
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  load()
}

function onReset() {
  keyword.value = ''
  unreadOnly.value = false
  bizType.value = ''
  page.value = 1
  load()
}

/** 打开详情弹窗:标记已读,但不跳转(由用户决定是否前往) */
function openDetail(row: SysNotification) {
  detail.value = row
  detailVisible.value = true
  markRead(row) // 内部联动未读徽标
  if (unreadOnly.value) load() // 仅未读视图下已读行即时移出
}

/** 详情弹窗内的「前往处理」 */
function goDetail() {
  detailVisible.value = false
  if (detail.value?.link) {
    router.push(detail.value.link.replace('/sqm/change', '/sqm/changes'))
  }
}

function onFilter() {
  page.value = 1
  load()
}

function onPage(p: number) {
  page.value = p
  load()
}

function onSize(s: number) {
  size.value = s
  page.value = 1
  load()
}

/** 点击消息:标记已读并跳转关联单据(沿用铃铛的 /sqm/change → /sqm/changes 兼容逻辑) */
async function openRow(row: SysNotification) {
  markRead(row) // 内部联动未读徽标
  if (unreadOnly.value) load() // 仅未读视图下已读行即时移出
  if (row.link) {
    router.push(row.link.replace('/sqm/change', '/sqm/changes'))
  }
}

async function readAll() {
  await markAll()
  load()
}

onMounted(() => {
  load()
  startPolling(30000) // 30s 轮询,与铃铛徽标保持同步
})
</script>

<style lang="scss" scoped>
.message-center { animation: rise 0.4s ease both; }

.filter-inner { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.list-card { padding-bottom: 4px; }

.msg-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: $ink-faint; }
.msg-title.unread { color: $ink; font-weight: 600; }
.msg-title .dot { width: 6px; height: 6px; border-radius: 50%; background: $signal-red; flex-shrink: 0; }

.msg-content { font-size: 12px; color: $ink-faint; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.msg-time { font-family: $font-mono; font-size: 11px; color: $ink-faint; }

.pager-b { display: flex; justify-content: flex-end; padding: 16px 22px 18px; }

.empty-b { padding: 8px 0 20px; }

.detail-b { display: flex; flex-direction: column; gap: 14px; }
.detail-row { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.detail-row.col { flex-direction: column; align-items: flex-start; gap: 6px; }
.detail-k { width: 48px; color: $ink-faint; flex-shrink: 0; }
.detail-v { color: $ink; display: flex; align-items: center; gap: 6px; line-height: 1.6; }
.detail-v.mono { font-family: $font-mono; font-size: 12px; }
.detail-v.body { white-space: pre-wrap; word-break: break-all; background: $hairline-soft; border: 1px solid $hairline; border-radius: 6px; padding: 10px 12px; width: 100%; }
.detail-v .dot { width: 6px; height: 6px; border-radius: 50%; background: $signal-red; }
</style>
