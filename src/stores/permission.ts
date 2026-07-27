import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  const codes = ref<string[]>([])
  const isAdmin = computed(() => codes.value.includes('*'))

  function setCodes(list: string[]) {
    codes.value = list
  }
  function clear() {
    codes.value = []
  }
  /** 操作级(按钮):后端权限码 {module}.{resource}.{action} */
  function has(code: string): boolean {
    if (isAdmin.value) return true
    return codes.value.includes(code)
  }
  function hasAny(list: string[]): boolean {
    if (isAdmin.value) return true
    return list.some((c) => codes.value.includes(c))
  }

  return { codes, isAdmin, setCodes, clear, has, hasAny }
})
