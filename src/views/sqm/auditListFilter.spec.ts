import { describe, it, expect } from 'vitest'
import {
  CHANGE_LINKED_AUDIT_TYPE,
  listableAuditTypesOf,
  filterAuditPlans,
} from './auditListFilter'

describe('auditListFilter.ts — 剔除物料变更审核', () => {
  it('listableAuditTypesOf 剔除变更联动类型', () => {
    const keys = ['物料变更审核', '资质审核', '年度审核']
    expect(listableAuditTypesOf(keys)).toEqual(['资质审核', '年度审核'])
  })

  it('listableAuditTypesOf 全为普通类型时原样返回', () => {
    const keys = ['资质审核', '年度审核']
    expect(listableAuditTypesOf(keys)).toEqual(keys)
  })

  it('filterAuditPlans 剔除变更联动审核并修正 total', () => {
    const records = [
      { id: '1', auditType: '资质审核' },
      { id: '2', auditType: '物料变更审核' },
      { id: '3', auditType: '年度审核' },
    ]
    const { list, total } = filterAuditPlans(records, 3)
    expect(list.map(p => p.id)).toEqual(['1', '3'])
    expect(total).toBe(2)
  })

  it('filterAuditPlans 无变更联动时 total 不变', () => {
    const records = [{ id: '1', auditType: '资质审核' }]
    const { list, total } = filterAuditPlans(records, 1)
    expect(list).toHaveLength(1)
    expect(total).toBe(1)
  })

  it('filterAuditPlans 空数组/空 total 兜底', () => {
    const { list, total } = filterAuditPlans([], 0)
    expect(list).toEqual([])
    expect(total).toBe(0)
  })

  it('CHANGE_LINKED_AUDIT_TYPE 常量与元数据一致', () => {
    expect(CHANGE_LINKED_AUDIT_TYPE).toBe('物料变更审核')
  })
})