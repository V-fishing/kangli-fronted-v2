import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/modules/uop/auth'
import { meApi } from '@/api/modules/uop/me'
import { usePermissionStore } from '@/stores/permission'
import type { CurrentUserVo, LoginRequest } from '@/api/types/uop'

const TOKEN_KEY = 'qms_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<CurrentUserVo | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
  }

  function clearToken() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    usePermissionStore().clear()
  }

  async function login(data: LoginRequest) {
    const resp = await authApi.login(data)
    setToken(resp.accessToken)
    await fetchMe()
  }

  async function fetchMe() {
    const me = await meApi.me()
    user.value = me
    usePermissionStore().setCodes(me.permissions ?? [])
    return me
  }

  /** 刷新恢复:从本地 token 调 me 重建会话 */
  async function restore() {
    if (!token.value) return false
    try {
      await fetchMe()
      return true
    } catch {
      clearToken()
      return false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    clearToken()
    window.location.href = '/login'
  }

  return { token, user, isLoggedIn, login, fetchMe, restore, logout, clearToken, setToken }
})
