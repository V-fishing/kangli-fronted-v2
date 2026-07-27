import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

    // 有 token 但未加载用户信息 -> restore
    if (!auth.user) {
      const ok = await auth.restore()
      if (!ok) return next('/login')
    }

    next()
  })
}
