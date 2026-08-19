import type { App, ObjectDirective } from 'vue'
import { usePermissionStore } from '@/stores/permission'

// v-permission="'fia.task.create'" 或 v-permission="['fia.approve','fia.reject']"(满足任一)
export const permission: ObjectDirective<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const store = usePermissionStore()
    const codes = Array.isArray(binding.value) ? binding.value : [binding.value]
    if (!store.hasAny(codes)) {
      el.remove()
    }
  },
}

export function setupDirectives(app: App) {
  app.directive('permission', permission)
}
