import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionStore } from '@/stores/permission'
import { permission } from './directive'

describe('v-permission 指令（越权按钮防护）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /** 模拟指令挂载：构造 DOM 元素并调用 mounted 钩子 */
  function runMounted(el: HTMLElement, value: string | string[]) {
    permission.mounted!(el, { value } as any)
  }

  it('无权限时调用 el.remove() 移除元素', () => {
    const perm = usePermissionStore()
    perm.setCodes(['other.action'])
    const el = document.createElement('button')
    const removeSpy = vi.spyOn(el, 'remove')
    runMounted(el, 'fia.task.create')
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })

  it('有权限时保留元素（不调用 remove）', () => {
    const perm = usePermissionStore()
    perm.setCodes(['fia.task.create'])
    const el = document.createElement('button')
    const removeSpy = vi.spyOn(el, 'remove')
    runMounted(el, 'fia.task.create')
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('数组码任一命中即保留', () => {
    const perm = usePermissionStore()
    perm.setCodes(['fia.reject'])
    const el = document.createElement('button')
    const removeSpy = vi.spyOn(el, 'remove')
    runMounted(el, ['fia.approve', 'fia.reject'])
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('admin(*) 时保留元素', () => {
    const perm = usePermissionStore()
    perm.setCodes(['*'])
    const el = document.createElement('button')
    const removeSpy = vi.spyOn(el, 'remove')
    runMounted(el, 'anything.create')
    expect(removeSpy).not.toHaveBeenCalled()
  })
})
