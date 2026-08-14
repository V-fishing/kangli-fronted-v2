import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/modules/uop/auth'
import { meApi } from '@/api/modules/uop/me'
import { usePermissionStore } from '@/stores/permission'
import { useMenuStore } from '@/stores/menu'
import type { CurrentUserVo, LoginRequest } from '@/api/types/uop'

const TOKEN_KEY = 'qms_token'
const ORG_KEY = 'qms_current_org'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<CurrentUserVo | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  // 当前选中的组织视图(组织代码 MZ/SZ 或 'ALL')。用于 OrgSwitch 切换器与列表页 orgId 透传。
  const currentOrgId = ref<string>(localStorage.getItem(ORG_KEY) || 'ALL')
  // 是否显示组织切换下拉(演示/多租户环境默认开启; 生产可按 dataScope/权限收紧)
  const canSwitchOrg = ref(true)

  function setCurrentOrg(val: string) {
    currentOrgId.value = val
    localStorage.setItem(ORG_KEY, val)
  }

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
    useMenuStore().setMenus(me.menus ?? [])
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

  return { token, user, isLoggedIn, currentOrgId, canSwitchOrg, setCurrentOrg, login, fetchMe, restore, logout, clearToken, setToken }
})
