import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SysMenu } from '@/api/types/uop'

/**
 * 菜单(功能可见性)状态:由 /me 返回的按角色过滤的菜单树驱动。
 * 导航顶栏模块与二级页签、路由守卫均消费本 store。
 */
export const useMenuStore = defineStore('menu', () => {
  const tree = ref<SysMenu[]>([])

  function setMenus(menus: SysMenu[] | undefined) {
    tree.value = menus ?? []
  }
  function clear() {
    tree.value = []
  }

  /** 顶级模块(导航栏项) */
  const topModules = computed(() => tree.value)

  /** 当前激活的顶级模块(路由前缀匹配) */
  function findModule(path: string): SysMenu | undefined {
    return tree.value.find((m) => m.path === path || (m.path && path.startsWith(m.path + '/')))
  }

  /** 某模块下的二级页签 */
  function subTabs(modulePath: string): SysMenu[] {
    return findModule(modulePath)?.children ?? []
  }

  /** 所有可见路径集合(路由守卫用) */
  const permittedPaths = computed(() => {
    const set = new Set<string>()
    const walk = (list: SysMenu[]) =>
      list.forEach((n) => {
        if (n.path) set.add(n.path)
        if (n.children?.length) walk(n.children)
      })
    walk(tree.value)
    return set
  })

  /**
   * 双前缀判定:to.path 可见当且仅当
   *  - 自身在可见路径集合,或
   *  - 存在可见路径 p 使 to.path 以 p+'/' 开头(详情/新建子页),或
   *  - 存在可见路径 p 以 to.path+'/' 开头(点开含子页签的父模块)。
   */
  function hasPath(path: string): boolean {
    const set = permittedPaths.value
    if (set.has(path)) return true
    for (const p of set) {
      if (path.startsWith(p + '/')) return true
    }
    for (const p of set) {
      if (p.startsWith(path + '/')) return true
    }
    return false
  }

  return { tree, topModules, permittedPaths, subTabs, findModule, hasPath, setMenus, clear }
})
