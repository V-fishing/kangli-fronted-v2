<template>
  <div class="layout">
    <!-- ════ 一级顶栏 + Mega 下拉 ════ -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo-b">
          <div class="mark"><span>KL</span></div>
          <div class="name">KONLI QMS</div>
        </div>

        <nav class="nav-b">
          <!-- 工作台 -->
          <div class="nav-item" :class="{ on: isMod('/dashboard') }">
            <RouterLink to="/dashboard">工作台</RouterLink>
          </div>

          <!-- 首件检验 FIA -->
          <div class="nav-item" :class="{ on: isMod('/fia') }">
            <RouterLink to="/fia/tasks">首件检验<span class="car">▾</span></RouterLink>
            <div class="mega" style="width:300px">
              <div class="mega-head"><span class="code">FIA</span><span class="nm">首件检验</span><span class="en">First Article</span></div>
              <div class="mega-body" style="grid-template-columns:1fr 1fr">
                <div class="mega-col">
                  <div class="g-title">检验操作</div>
                  <RouterLink to="/fia/tasks" class="dd"><span class="idx">01</span><span>任务列表</span></RouterLink>
                  <RouterLink to="/fia/tasks/create" class="dd"><span class="idx">02</span><span>新建任务</span></RouterLink>
                </div>
                <div class="mega-col">
                  <div class="g-title">配置管理</div>
                  <RouterLink to="/fia/stds" class="dd"><span class="idx">03</span><span>检验标准</span></RouterLink>
                  <RouterLink to="/fia/triggers" class="dd"><span class="idx">04</span><span>触发类型</span></RouterLink>
                  <RouterLink to="/fia/approvals" class="dd"><span class="idx">05</span><span>审批单</span></RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- SPC 监控 -->
          <div class="nav-item" :class="{ on: isMod('/spc') }">
            <RouterLink to="/spc/params">SPC 监控<span class="car">▾</span></RouterLink>
            <div class="mega" style="width:240px">
              <div class="mega-head"><span class="code">SPC</span><span class="nm">过程控制</span><span class="en">Statistical</span></div>
              <div class="mega-body" style="grid-template-columns:1fr">
                <div class="mega-col">
                  <RouterLink to="/spc/params" class="dd"><span class="idx">01</span><span>控制图 / 参数</span></RouterLink>
                  <RouterLink to="/spc/collect" class="dd"><span class="idx">02</span><span>数据采集</span></RouterLink>
                  <RouterLink to="/spc/alarms" class="dd"><span class="idx">03</span><span>告警列表</span></RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- 不良管理 NCM -->
          <div class="nav-item" :class="{ on: isMod('/ncm') }">
            <RouterLink to="/ncm">不良管理<span class="car">▾</span></RouterLink>
            <div class="mega" style="width:300px">
              <div class="mega-head"><span class="code">NCM</span><span class="nm">不良管理</span><span class="en">Nonconformity</span></div>
              <div class="mega-body" style="grid-template-columns:1fr 1fr">
                <div class="mega-col">
                  <div class="g-title">数据管理</div>
                  <RouterLink to="/ncm/defect-dicts" class="dd"><span class="idx">01</span><span>不良字典</span></RouterLink>
                  <RouterLink to="/ncm/defect-records" class="dd"><span class="idx">02</span><span>不良记录</span></RouterLink>
                  <RouterLink to="/ncm/trend-reports" class="dd"><span class="idx">03</span><span>趋势报表</span></RouterLink>
                </div>
                <div class="mega-col">
                  <div class="g-title">整改流程</div>
                  <RouterLink to="/ncm/8d-reports" class="dd"><span class="idx">04</span><span>8D 报告</span></RouterLink>
                  <RouterLink to="/ncm/capas" class="dd disabled"><span class="idx">05</span><span>CAPA</span></RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- 供应商 SQM -->
          <div class="nav-item" :class="{ on: isMod('/sqm') }">
            <RouterLink to="/sqm">供应商<span class="car">▾</span></RouterLink>
            <div class="mega" style="width:320px">
              <div class="mega-head"><span class="code">SQM</span><span class="nm">供应商质量</span><span class="en">Supplier QM</span></div>
              <div class="mega-body" style="grid-template-columns:1fr 1fr">
                <div class="mega-col">
                  <div class="g-title">核心业务</div>
                  <RouterLink to="/sqm/suppliers" class="dd"><span class="idx">01</span><span>供应商档案</span></RouterLink>
                  <RouterLink to="/sqm/abnormals" class="dd"><span class="idx">02</span><span>来料异常</span></RouterLink>
                  <RouterLink to="/sqm/audits" class="dd"><span class="idx">03</span><span>供应商审核</span></RouterLink>
                </div>
                <div class="mega-col">
                  <div class="g-title">其他</div>
                  <RouterLink to="/sqm/changes" class="dd"><span class="idx">04</span><span>物料变更</span></RouterLink>
                  <RouterLink to="/sqm/trace" class="dd"><span class="idx">05</span><span>物料追溯</span></RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- 巡检 -->
          <div class="nav-item" :class="{ on: isMod('/patrol') }">
            <RouterLink to="/patrol">巡检</RouterLink>
          </div>

          <!-- 归档 -->
          <div class="nav-item" :class="{ on: isMod('/archive') }">
            <RouterLink to="/archive">归档</RouterLink>
          </div>

          <!-- 系统 -->
          <div class="nav-item" :class="{ on: isMod('/system') }">
            <RouterLink to="/system">系统</RouterLink>
          </div>
        </nav>
      </div>
      <div class="topbar-right">
        <div class="date-chip">{{ clock }}</div>

        <!-- 站内消息铃铛 -->
        <el-popover placement="bottom-end" width="360" trigger="click" @show="loadNotices">
          <template #reference>
            <div class="bell-b" title="消息通知">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span v-if="unread > 0" class="bell-badge">{{ unread > 99 ? '99+' : unread }}</span>
            </div>
          </template>
          <div class="notice-panel">
            <div class="notice-head">
              <span class="t">消息通知</span>
              <el-button v-if="unread > 0" link type="primary" size="small" @click="markAll">全部已读</el-button>
            </div>
            <div v-if="notices.length === 0" class="notice-empty">暂无消息</div>
            <div v-else class="notice-list">
              <div v-for="n in notices" :key="n.id" class="notice-item" :class="{ unread: !n.isRead }" @click="clickNotice(n)">
                <div class="ni-title"><span v-if="!n.isRead" class="dot"></span>{{ n.title }}</div>
                <div class="ni-content">{{ n.content }}</div>
                <div class="ni-time">{{ fmtTime(n.createTime) }}</div>
              </div>
            </div>
          </div>
        </el-popover>

        <el-dropdown trigger="click">
          <div class="avatar-b">{{ avatarText }}</div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>{{ auth.user?.username }}</el-dropdown-item>
              <el-dropdown-item divided @click="auth.logout()">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ════ 二级 subnav Tab 栏(常驻) ════ -->
    <div class="subnav" v-if="subTabs.length">
      <div class="subnav-inner">
        <span class="mod-chip">{{ modLabel }}</span>
        <div class="tabs" ref="tabsRef">
          <RouterLink v-for="t in subTabs" :key="t.to" :to="t.to" class="tab-link" :class="{ active: route.path.startsWith(t.to) }">
            {{ t.label }}
          </RouterLink>
          <span class="tab-ink" ref="inkRef"></span>
        </div>
      </div>
    </div>

    <!-- ════ 内容 ════ -->
    <main class="main-b">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/hooks/useNotifications'
import type { SysNotification } from '@/api/types/notify'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const clock = ref('')
let timer = 0

function tick() {
  const n = new Date()
  clock.value =
    n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' +
    String(n.getDate()).padStart(2, '0') + ' ' + ['周日','周一','周二','周三','周四','周五','周六'][n.getDay()] + ' ' +
    n.toTimeString().slice(0, 5)
}
onMounted(() => { tick(); timer = window.setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))
const avatarText = computed(() => auth.user?.username?.[0]?.toUpperCase() || 'U')

// 站内消息铃铛(统一封装: 列表/未读/已读/30s 轮询)
const { notices, unread, fmtTime, loadNotices, markRead, markAll, startPolling } = useNotifications()

function clickNotice(n: SysNotification) {
  markRead(n)
  if (n.link) router.push(n.link.replace('/sqm/change', '/sqm/changes'))
}
onMounted(startPolling)

// ── 二级导航滑动指示线 ──
const tabsRef = ref<HTMLElement>()
const inkRef = ref<HTMLElement>()
function positionInk() {
  const tabs = tabsRef.value, ink = inkRef.value
  if (!tabs || !ink) return
  const actives = tabs.querySelectorAll<HTMLElement>('.tab-link.active')
  const on = actives[actives.length - 1] // 取最具体(最后一个)匹配项
  if (!on) { ink.style.width = '0'; return }
  ink.style.left = on.offsetLeft + 'px'
  ink.style.width = on.offsetWidth + 'px'
}
watch(() => route.path, () => nextTick(positionInk))
function onResize() { positionInk() }
onMounted(() => { nextTick(positionInk); window.addEventListener('resize', onResize) })
onUnmounted(() => window.removeEventListener('resize', onResize))

// 模块匹配
const MOD_KEYS = ['/fia', '/spc', '/ncm', '/sqm', '/patrol', '/archive', '/system', '/dashboard']
function isMod(key: string) { return route.path.startsWith(key) }

// 子导航配置
const SUB: Record<string, { label: string; tabs: { label: string; to: string }[] }> = {
  '/fia':    { label: 'FIA', tabs: [{label:'任务列表',to:'/fia/tasks'},{label:'新建任务',to:'/fia/tasks/create'},{label:'检验标准',to:'/fia/stds'},{label:'触发类型',to:'/fia/triggers'},{label:'审批单',to:'/fia/approvals'}] },
  '/spc':    { label: 'SPC', tabs: [{label:'控制图/参数',to:'/spc/params'},{label:'数据采集',to:'/spc/collect'},{label:'告警',to:'/spc/alarms'}] },
  '/ncm':    { label: 'NCM', tabs: [{label:'不良字典',to:'/ncm/defect-dicts'},{label:'不良记录',to:'/ncm/defect-records'},{label:'8D 报告',to:'/ncm/8d-reports'},{label:'CAPA',to:'/ncm/capas'}] },
  '/sqm':    { label: 'SQM', tabs: [{label:'供应商',to:'/sqm/suppliers'},{label:'异常',to:'/sqm/abnormals'},{label:'审核',to:'/sqm/audits'},{label:'变更',to:'/sqm/changes'},{label:'物料追溯',to:'/sqm/trace'}] },
  '/patrol': { label: 'PATL', tabs: [{label:'路线',to:'/patrol/routes'},{label:'任务',to:'/patrol/tasks'}] },
  '/archive':{ label: 'ARCH', tabs: [{label:'归档查询',to:'/archive/list'}] },
  '/system': { label: 'SYS',  tabs: [{label:'用户',to:'/system/users'},{label:'角色',to:'/system/roles'},{label:'组织',to:'/system/orgs'},{label:'菜单',to:'/system/menus'},{label:'审核配置',to:'/system/audit-config'}] },
  '/dashboard':{label:'DASH', tabs:[]},
}
const modLabel = computed(() => {
  for (const k of MOD_KEYS) { if (route.path.startsWith(k)) return SUB[k]?.label || '' }
  return ''
})
const subTabs = computed(() => {
  for (const k of MOD_KEYS) { if (route.path.startsWith(k)) return SUB[k]?.tabs || [] }
  return []
})
</script>

<style lang="scss" scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; background: $paper; }

/* ════ topbar ════ */
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 40px; height: 60px; background: $white; border-bottom: 1px solid $hairline; position: sticky; top: 0; z-index: 30; }
.topbar-left { display: flex; align-items: center; gap: 28px; }
.logo-b { display: flex; align-items: center; gap: 10px; }
.logo-b .mark { width: 28px; height: 28px; background: $cobalt; display: flex; align-items: center; justify-content: center; }
.logo-b .mark span { color: #fff; font-family: $font-display; font-weight: 800; font-size: 11px; }
.logo-b .name { font-family: $font-display; font-size: 13px; font-weight: 700; letter-spacing: 3px; }

/* ════ 一级 nav + Mega ════ */
.nav-b { display: flex; gap: 2px; }
.nav-item { position: relative; height: 60px; display: flex; align-items: center; }
.nav-item > a { display: flex; align-items: center; gap: 6px; font-size: 13px; color: $ink-soft; text-decoration: none; padding: 8px 14px; border-radius: 6px; transition: all .15s; font-weight: 400; }
.nav-item > a:hover { color: $ink; background: $paper; }
.nav-item.on > a { color: $cobalt; background: $cobalt-dim; font-weight: 500; }
.nav-item > a .car { font-size: 8px; color: $ink-faint; transition: transform .2s, color .2s; }
.nav-item:hover > a .car { transform: rotate(180deg); color: $cobalt; }

.mega { position: absolute; top: 100%; left: -14px; background: $white; border: 1px solid $hairline; border-radius: 12px; box-shadow: $shadow-md; padding: 18px 20px 14px; opacity: 0; visibility: hidden; transform: translateY(10px); transition: opacity .18s ease, transform .18s ease, visibility .18s; z-index: 60; }
.nav-item:nth-last-child(-n+2) .mega { left: auto; right: -14px; }
.nav-item:hover .mega { opacity: 1; visibility: visible; transform: translateY(0); }
.mega-head { display: flex; align-items: center; gap: 10px; padding: 0 4px 12px; border-bottom: 1px solid $hairline; margin-bottom: 12px; }
.mega-head .code { font-family: $font-mono; font-size: 11px; font-weight: 500; color: $cobalt; background: $cobalt-dim; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; }
.mega-head .nm { font-size: 14px; font-weight: 600; }
.mega-head .en { font-family: $font-mono; font-size: 10px; color: $ink-faint; letter-spacing: 1.5px; margin-left: auto; }
.mega-body { display: grid; gap: 6px 26px; }
.mega-col .g-title { font-size: 11px; font-weight: 500; color: $ink-faint; letter-spacing: 2px; padding: 2px 10px 8px; }
.dd { display: flex; gap: 10px; padding: 8px 10px; border-radius: 8px; text-decoration: none; color: inherit; transition: background .12s; }
.dd:hover { background: $paper; }
.dd .idx { font-family: $font-mono; font-size: 11px; color: $cobalt; opacity: .65; padding-top: 2px; flex-shrink: 0; }
.dd.router-link-active { background: $cobalt-dim; }
.dd.router-link-active .idx { opacity: 1; }
.dd.router-link-active { color: $cobalt; font-weight: 500; }
.dd.disabled { opacity: .4; pointer-events: none; }

.topbar-right { display: flex; align-items: center; gap: 18px; }
.date-chip { font-family: $font-mono; font-size: 11px; color: $ink-faint; }

/* ════ 消息铃铛 ════ */
.bell-b { position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: $ink-soft; cursor: pointer; transition: all .15s; }
.bell-b:hover { color: $cobalt; background: $cobalt-dim; }
.bell-badge { position: absolute; top: -2px; right: -4px; min-width: 16px; height: 16px; padding: 0 4px; background: $signal-red; color: #fff; font-size: 10px; font-weight: 600; line-height: 16px; text-align: center; border-radius: 8px; box-shadow: 0 0 0 2px $white; }
.avatar-b { width: 30px; height: 30px; border-radius: 50%; background: $ink; color: $paper; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; cursor: pointer; }

/* ════ 消息面板(popover 内容,scoped 属性随模板生效) ════ */
.notice-panel { margin: -4px 0; }
.notice-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 2px 10px; border-bottom: 1px solid $hairline; }
.notice-head .t { font-size: 13px; font-weight: 600; }
.notice-empty { padding: 28px 0; text-align: center; font-size: 12px; color: $ink-faint; }
.notice-list { max-height: 380px; overflow-y: auto; }
.notice-item { padding: 10px 6px; border-bottom: 1px solid $hairline; cursor: pointer; transition: background .12s; }
.notice-item:last-child { border-bottom: none; }
.notice-item:hover { background: $paper; }
.notice-item .ni-title { font-size: 13px; font-weight: 500; color: $ink-soft; display: flex; align-items: center; gap: 6px; }
.notice-item.unread .ni-title { color: $ink; }
.notice-item .ni-title .dot { width: 6px; height: 6px; border-radius: 50%; background: $signal-red; flex-shrink: 0; }
.notice-item .ni-content { font-size: 12px; color: $ink-faint; margin-top: 4px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.notice-item .ni-time { font-family: $font-mono; font-size: 10px; color: $ink-faint; margin-top: 4px; }

/* ════ subnav ════ */
.subnav { background: $white; border-bottom: 1px solid $hairline; position: sticky; top: 60px; z-index: 20; }
.subnav-inner { max-width: 1360px; margin: 0 auto; padding: 0 40px; height: 46px; display: flex; align-items: center; gap: 14px; }
.mod-chip { font-family: $font-mono; font-size: 11px; font-weight: 500; color: $cobalt; background: $cobalt-dim; padding: 4px 9px; border-radius: 5px; letter-spacing: 1px; flex-shrink: 0; }
.tabs { position: relative; flex: 1; height: 100%; display: flex; align-items: center; gap: 2px; overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab-link { font-size: 13px; color: $ink-soft; text-decoration: none; padding: 6px 14px; white-space: nowrap; transition: color 0.15s; font-weight: 400; }
.tab-link:hover { color: $ink; }
.tab-link.active { color: $cobalt; font-weight: 500; }
.tab-ink { position: absolute; bottom: 0; height: 2px; background: $cobalt; border-radius: 2px 2px 0 0; transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1); }

/* ════ main ════ */
.main-b { flex: 1; max-width: 1360px; width: 100%; margin: 0 auto; padding: 32px 40px; }
</style>
