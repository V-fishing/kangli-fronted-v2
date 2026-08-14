import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { usePermissionStore } from '@/stores/permission'

export function setupGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore()

    // 公开页面(/login /404)
    if (to.meta.public) {
      if (to.name === 'Login' && auth.isLoggedIn) return next('/dashboard')
      return next()
    }

    // 需登录
    if (!auth.isLoggedIn) {
      const redirect = encodeURIComponent(to.fullPath)
      return next(`/login?redirect=${redirect}`)
    }

    // 有 token 但未加载用户信息 -> restore(会载入菜单树)
    if (!auth.user) {
      const ok = await auth.restore()
      if (!ok) return next('/login')
    }

    // 菜单权限拦截:功能按角色菜单权限可见,无权则重定向工作台
    if (to.path !== '/' && to.path !== '/dashboard') {
      const menu = useMenuStore()
      // 声明了 perm 元数据的路由(如 KPI 对比需 system.org.switch):权限满足即放行,不依赖菜单树
      const perm = to.meta.perm as string | undefined
      const permOk = perm ? usePermissionStore().has(perm) : false
      // permittedPaths 为空(后端未返回菜单)时降级放行,避免误锁
      if (!permOk && menu.permittedPaths.size > 0 && !menu.hasPath(to.path)) {
        return next('/dashboard')
      }
    }

    next()
  })
}
