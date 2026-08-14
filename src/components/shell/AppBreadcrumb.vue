<!--
  AppBreadcrumb — 统一可点击面包屑层级导航
  推导链: 一级模块(menuCode 大写) / 二级页签(menuName) / 更细页面(route.meta.title)
  上级节点可点击逐级返回,当前页面级为纯文本;无匹配模块时降级只显示标题。
  设计依据: AGENTS.md 铁律 — 颜色仅用 variables token,字体 mono,组件落 shell/,kebab 命名。
-->
<template>
  <div class="crumb">
    <template v-for="(item, i) in chain" :key="item.path || item.label">
      <RouterLink v-if="item.clickable && item.path" :to="item.path" class="crumb-link">
        {{ item.label }}
      </RouterLink>
      <span v-else class="crumb-node">{{ item.label }}</span>
      <span v-if="i < chain.length - 1" class="crumb-sep"> / </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import type { SysMenu } from '@/api/types/uop'

const route = useRoute()
const menuStore = useMenuStore()

interface CrumbItem {
  label: string
  path?: string
  clickable: boolean
}

/** 命中当前路由的一级模块(与 BasicLayout.activeModule 同匹配逻辑) */
function matchModule(path: string): SysMenu | undefined {
  const hit = (m: SysMenu): boolean => {
    if (m.path && path.startsWith(m.path)) return true
    return (m.children || []).some(
      (c) => !!c.path && (path === c.path || path.startsWith(c.path + '/')),
    )
  }
  return menuStore.topModules.find((m) => m.path && hit(m))
}

/** 命中当前路由的二级页签(含其详情/新建子路径) */
function matchSubtab(mod: SysMenu, path: string): SysMenu | undefined {
  return (mod.children || []).find(
    (c) => !!c.path && (path === c.path || path.startsWith(c.path + '/')),
  )
}

const chain = computed<CrumbItem[]>(() => {
  const path = route.path
  const mod = matchModule(path)

  // 无匹配模块(如 /dashboard、/kpi/compare):降级只显示标题
  if (!mod || !mod.path) {
    const title = (route.meta?.title as string) || ''
    return title ? [{ label: title, clickable: false }] : []
  }

  const modItem: CrumbItem = {
    label: (mod.menuCode || mod.menuName || '').toUpperCase(),
    path: mod.path,
    clickable: true,
  }

  const tab = matchSubtab(mod, path)
  const result: CrumbItem[] = [modItem]

  if (tab && tab.path) {
    const isExactTab = path === tab.path
    const tabItem: CrumbItem = {
      label: tab.menuName || tab.menuCode || '',
      path: tab.path,
      // 若停在三层级(详情/新建),二级页签仍可点返回;当前恰为二级页签本身则不可点
      clickable: !isExactTab,
    }
    result.push(tabItem)

    // 三级:更细的页面(非二级页签本身)→ 取 meta.title,回退到二级页签
    if (!isExactTab) {
      const pageTitle = (route.meta?.title as string) || ''
      if (pageTitle && pageTitle !== tabItem.label) {
        result.push({ label: pageTitle, clickable: false })
      }
    }
  } else {
    // 模块本身即页面(无二级页签,如工作台):若恰为模块首页则不可点
    modItem.clickable = path !== mod.path
  }

  return result
})
</script>
