import { ref, watch } from 'vue'

// 全局「每页条数」偏好: 所有列表页共享同一偏好并持久化到 localStorage,
// 用户在某页切换每页条数后, 刷新或进入其它列表页仍沿用上次选择。
const STORAGE_KEY = 'qms:page-size'
const ALLOWED = [10, 20, 50, 100]
const DEFAULT_SIZE = 20

function read(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SIZE
    const n = parseInt(raw, 10)
    return ALLOWED.includes(n) ? n : DEFAULT_SIZE
  } catch {
    return DEFAULT_SIZE
  }
}

// 模块级单例: 所有调用方拿到的是同一个 ref
const pageSize = ref<number>(read())

watch(pageSize, (v) => {
  try { localStorage.setItem(STORAGE_KEY, String(v)) } catch { /* ignore */ }
})

export function usePageSize() {
  return pageSize
}

// 供特殊场景(如把 size 放在 reactive query 对象里)使用
export function loadPageSize(): number {
  return read()
}
export function savePageSize(v: number) {
  pageSize.value = v
}
