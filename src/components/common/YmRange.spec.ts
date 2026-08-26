import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import YmRange from './YmRange.vue'

// Element Plus 组件在 happy-dom 下无需真实渲染,stub 为可触发 change 的轻量组件
const ElSelectStub = defineComponent({
  name: 'ElSelect',
  props: ['modelValue', 'placeholder'],
  emits: ['change'],
  template: '<div class="el-select-stub"><slot /></div>',
})

function mountYmRange(props: { start?: string; end?: string } = {}) {
  return mount(YmRange, {
    props,
    global: {
      stubs: {
        'el-select': ElSelectStub,
        'el-option': true,
      },
    },
  })
}

describe('YmRange.vue — 月份区间双下拉', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('传入 start/end 时渲染两个下拉并回显', () => {
    const wrapper = mountYmRange({ start: '2026-01', end: '2026-06' })
    const selects = wrapper.findAllComponents(ElSelectStub)
    expect(selects).toHaveLength(2)
    expect(selects[0].props('modelValue')).toBe('2026-01')
    expect(selects[1].props('modelValue')).toBe('2026-06')
  })

  it('选择起始月触发 update:start 与 change', async () => {
    const wrapper = mountYmRange({ start: '2026-01', end: '2026-06' })
    const selects = wrapper.findAllComponents(ElSelectStub)
    await selects[0].vm.$emit('change', '2025-12')
    expect(wrapper.emitted('update:start')).toEqual([['2025-12']])
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('选择截止月触发 update:end 与 change', async () => {
    const wrapper = mountYmRange({ start: '2026-01', end: '2026-06' })
    const selects = wrapper.findAllComponents(ElSelectStub)
    await selects[1].vm.$emit('change', '2026-07')
    expect(wrapper.emitted('update:end')).toEqual([['2026-07']])
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('未传 start/end 时 onMounted 兜底 emit 最近 18 个月首尾', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-26T00:00:00'))
    const wrapper = mountYmRange()
    // MONTHS[0] = 2026-08(当前月), MONTHS[17] = 2025-03(17 个月前)
    expect(wrapper.emitted('update:start')).toEqual([['2025-03']])
    expect(wrapper.emitted('update:end')).toEqual([['2026-08']])
  })

  it('仅缺 start 时只兜底 start,end 保持传入值', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-26T00:00:00'))
    const wrapper = mountYmRange({ end: '2026-06' })
    expect(wrapper.emitted('update:start')).toEqual([['2025-03']])
    expect(wrapper.emitted('update:end')).toBeUndefined()
  })
})