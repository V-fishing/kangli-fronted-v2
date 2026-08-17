import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionStore } from './permission'

describe('usePermissionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('空权限码时 has 返回 false', () => {
    const s = usePermissionStore()
    s.setCodes([])
    expect(s.has('fia.task.create')).toBe(false)
    expect(s.hasAny(['fia.approve', 'fia.reject'])).toBe(false)
  })

  it('精确码命中 has 返回 true', () => {
    const s = usePermissionStore()
    s.setCodes(['fia.task.create', 'fia.task.edit'])
    expect(s.has('fia.task.create')).toBe(true)
    expect(s.has('fia.task.delete')).toBe(false)
  })

  it('hasAny 任一命中即返回 true（OR 语义，符合后端审批人 OR 校验）', () => {
    const s = usePermissionStore()
    s.setCodes(['a.b.c'])
    expect(s.hasAny(['x.y.z', 'a.b.c'])).toBe(true)
    expect(s.hasAny(['x.y.z', 'm.n.p'])).toBe(false)
  })

  it('admin(*) 短路：isAdmin 为真时任何 has/hasAny 均返回 true', () => {
    const s = usePermissionStore()
    s.setCodes(['*'])
    expect(s.isAdmin).toBe(true)
    expect(s.has('anything.create')).toBe(true)
    expect(s.hasAny(['no', 'matter'])).toBe(true)
  })

  it('clear 清空权限码', () => {
    const s = usePermissionStore()
    s.setCodes(['a.b.c'])
    s.clear()
    expect(s.has('a.b.c')).toBe(false)
  })
})
