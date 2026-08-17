import { describe, it, expect } from 'vitest'
import {
  statusPill,
  csWorkOrderPill,
  tlmToolingPill,
  ncmStagePill,
  isStatusPillVariant,
  STATUS_PILL_VARIANTS,
} from './status'

describe('status.ts — StatusPill 映射（铁律第2条）', () => {
  it('售后工单状态映射到正确变体', () => {
    expect(statusPill(csWorkOrderPill, 'PENDING')).toBe('p-wait')
    expect(statusPill(csWorkOrderPill, 'ASSIGNED')).toBe('p-run')
    expect(statusPill(csWorkOrderPill, 'DONE')).toBe('p-sign')
    expect(statusPill(csWorkOrderPill, 'CLOSED')).toBe('p-done')
  })

  it('工装状态映射到正确变体', () => {
    expect(statusPill(tlmToolingPill, 'IN_USE')).toBe('p-done')
    expect(statusPill(tlmToolingPill, 'DISABLED')).toBe('p-mute')
    expect(statusPill(tlmToolingPill, 'REPAIRING')).toBe('p-run')
    expect(statusPill(tlmToolingPill, 'SCRAPPED')).toBe('p-lock')
  })

  it('8D/缺陷阶段状态映射到正确变体', () => {
    expect(statusPill(ncmStagePill, 'WAIT')).toBe('p-wait')
    expect(statusPill(ncmStagePill, 'RUNNING')).toBe('p-run')
    expect(statusPill(ncmStagePill, 'PENDING_APPROVE')).toBe('p-sign')
    expect(statusPill(ncmStagePill, 'REJECTED')).toBe('p-lock')
    expect(statusPill(ncmStagePill, 'APPROVED')).toBe('p-done')
  })

  it('未命中/空码回退 p-mute（禁止裸状态文字）', () => {
    expect(statusPill(csWorkOrderPill, 'UNKNOWN')).toBe('p-mute')
    expect(statusPill(csWorkOrderPill, undefined)).toBe('p-mute')
    expect(statusPill(csWorkOrderPill, null)).toBe('p-mute')
    expect(statusPill(csWorkOrderPill, '')).toBe('p-mute')
  })

  it('六变体集合完整无缺', () => {
    expect(STATUS_PILL_VARIANTS).toEqual([
      'p-wait',
      'p-run',
      'p-sign',
      'p-lock',
      'p-done',
      'p-mute',
    ])
  })

  it('isStatusPillVariant 校验合法/非法', () => {
    expect(isStatusPillVariant('p-done')).toBe(true)
    expect(isStatusPillVariant('p-bad')).toBe(false)
  })
})
