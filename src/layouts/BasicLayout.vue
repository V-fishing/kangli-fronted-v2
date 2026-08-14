<template>
  <div class="layout">
    <!-- ════ 一级顶栏 + Mega 下拉(由菜单权限动态生成) ════ -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo-b">
          <div class="mark"><span>KL</span></div>
          <div class="name">KONLI QMS</div>
        </div>

        <nav class="nav-b">
          <template v-for="mod in menuStore.topModules" :key="mod.id">
            <!-- 含子页签的模块:Mega 下拉 -->
            <div class="nav-item" :class="{ on: isMod(mod.path) }" v-if="mod.children && mod.children.length">
              <RouterLink :to="mod.path || '/'">{{ mod.menuName }}<span class="car">▾</span></RouterLink>
              <div class="mega" :style="{ width: megaWidth(mod) }">
                <div class="mega-head">
                  <span class="code">{{ (mod.menuCode || '').toUpperCase() }}</span>
                  <span class="nm">{{ mod.menuName }}</span>
                </div>
                <div class="mega-cols">
                  <RouterLink v-for="c in mod.children" :key="c.id" :to="c.path || '/'" class="dd">
                    <span class="idx">{{ pad(c.sortOrder) }}</span><span>{{ c.menuName }}</span>
                  </RouterLink>
                </div>
              </div>
            </div>
            <!-- 无子页签(如工作台):普通链接 -->
            <div class="nav-item" :class="{ on: isMod(mod.path) }" v-else>
              <RouterLink :to="mod.path || '/'">{{ mod.menuName }}</RouterLink>
            </div>
          </template>
        </nav>
      </div>
      <div class="topbar-right">
        <OrgSwitch v-if="auth.canSwitchOrg" />
        <RouterLink v-if="auth.canSwitchOrg" to="/kpi/compare" class="kpi-link">KPI 对比</RouterLink>
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

    <!-- ════ 二级 subnav Tab 栏(常驻,按当前模块动态) ════ -->
    <div class="subnav" v-if="activeModule && activeModule.children && activeModule.children.length">
      <div class="subnav-inner">
        <span class="mod-chip">{{ (activeModule.menuCode || '').toUpperCase() }}</span>
        <div class="tabs" ref="tabsRef">
          <RouterLink v-for="t in activeModule.children" :key="t.id" :to="t.path || '/'" class="tab-link" :class="{ active: !!t.path && route.path.startsWith(t.path) }">
            {{ t.menuName }}
          </RouterLink>
          <span class="tab-ink" ref="inkRef"></span>
        </div>
      </div>
    </div>

    <!-- ════ 内容 ════ -->
    <main class="main-b">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="auth.currentOrgId" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { useNotifications } from '@/hooks/useNotifications'
import OrgSwitch from '@/components/OrgSwitch.vue'
import type { SysNotification } from '@/api/types/notify'
import type { SysMenu } from '@/api/types/uop'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuStore = useMenuStore()
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

// 站内消息铃铛(统一封装: 列表/未读/已读/30s轮询降级)
const { notices, unread, fmtTime, loadNotices, markRead, markAll, startPolling, stopPolling } = useNotifications()
// 登录后常驻轮询未读数,保证徽标实时可见(与消息中心共享同一 unread 单例)
onMounted(() => { startPolling(30000) })
onUnmounted(() => { stopPolling() })

function clickNotice(n: SysNotification) {
  markRead(n)
  if (n.link) router.push(n.link.replace('/sqm/change', '/sqm/changes'))
}

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

// 当前激活模块(用于二级页签)。
// 匹配规则:route 以模块 path 为前缀,或命中模块下任一子页签 path(含其详情/新建子路径),
// 保证停留在同模块的任意子页(如 /dashboard 与 /workbench/tasks)时二级 tab 栏始终常驻。
const activeModule = computed<SysMenu | null>(() => {
  const matchByPath = (m: SysMenu): boolean => {
    if (m.path && route.path.startsWith(m.path)) return true
    return (m.children || []).some(
      (c) => !!c.path && (route.path === c.path || route.path.startsWith(c.path + '/') || route.path.startsWith(c.path)),
    )
  }
  return menuStore.topModules.find((m) => m.path && matchByPath(m)) || null
})

// 模块高亮
function isMod(key?: string) {
  return !!key && route.path.startsWith(key)
}
// Mega 下拉宽度(按子页签数量自适应)
function megaWidth(mod: SysMenu): string {
  const n = mod.children?.length || 0
  return Math.min(460, Math.max(240, n * 132)) + 'px'
}
// 序号补零
function pad(n?: number): string {
  return String(n == null ? 0 : n).padStart(2, '0')
}
</script>

<style lang="scss" scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; background: $paper; }

/* ════ topbar ════ */
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 60px; background: $white; border-bottom: 1px solid $hairline; position: sticky; top: 0; z-index: 30; }
.topbar-left { display: flex; align-items: center; gap: 18px; min-width: 0; flex: 1 1 auto; }
.logo-b { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.logo-b .mark { width: 28px; height: 28px; background: $cobalt; display: flex; align-items: center; justify-content: center; }
.logo-b .mark span { color: #fff; font-family: $font-display; font-weight: 800; font-size: 11px; }
.logo-b .name { font-family: $font-display; font-size: 13px; font-weight: 700; letter-spacing: 3px; }

/* ════ 一级 nav + Mega ════ */
.nav-b { display: flex; gap: 2px; min-width: 0; flex: 1 1 auto; overflow-x: auto; scrollbar-width: none; }
.nav-b::-webkit-scrollbar { display: none; }
.nav-item { position: relative; height: 60px; display: flex; align-items: center; flex-shrink: 0; }
.nav-item > a { display: flex; align-items: center; gap: 3px; font-size: 13px; color: $ink-soft; text-decoration: none; padding: 8px 8px; border-radius: 6px; transition: all .15s; font-weight: 400; white-space: nowrap; }
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
.mega-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 26px; }
.dd { display: flex; gap: 10px; padding: 8px 10px; border-radius: 8px; text-decoration: none; color: inherit; transition: background .12s; }
.dd:hover { background: $paper; }
.dd .idx { font-family: $font-mono; font-size: 11px; color: $cobalt; opacity: .65; padding-top: 2px; flex-shrink: 0; }
.dd.router-link-active { background: $cobalt-dim; }
.dd.router-link-active .idx { opacity: 1; }
.dd.router-link-active { color: $cobalt; font-weight: 500; }
.dd.disabled { opacity: .4; pointer-events: none; }

.topbar-right { display: flex; align-items: center; gap: 18px; flex-shrink: 0; margin-left: auto; }
.date-chip { font-family: $font-mono; font-size: 11px; color: $ink-faint; }

/* ════ 组织切换 + KPI 对比入口 ════ */
.kpi-link { font-size: 12px; font-weight: 500; color: $cobalt; background: $cobalt-dim; padding: 6px 14px; border-radius: 7px; text-decoration: none; transition: all .15s; white-space: nowrap; }
.kpi-link:hover { background: $cobalt; color: #fff; }

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

/* ════ 响应式:窄屏顶栏 ════ */
/* 窄屏下一级菜单改为横向滚动,不再裁切/挤压;右侧收起次要元素 */
@media (max-width: 1100px) {
  .topbar { padding: 0 14px; }
  .topbar-left { gap: 10px; }
  .logo-b .name { display: none; }
  .nav-b { overflow-x: auto; overflow-y: hidden; flex: 1 1 auto; scrollbar-width: none; }
  .nav-b::-webkit-scrollbar { display: none; }
  .nav-item > a { padding: 8px 6px; }
  .topbar-right { gap: 12px; }
  .date-chip { display: none; }
  /* 顶栏右上角的 KPI 对比与导航内重复,窄屏收起 */
  .topbar-right .kpi-link { display: none; }
}
@media (max-width: 640px) {
  .topbar { padding: 0 10px; height: 54px; }
  .nav-item { height: 54px; }
  .topbar-right .org-switch { display: none; }
}
</style>
