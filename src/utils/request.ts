import axios, { type AxiosRequestConfig, type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

// 后端契约:R<T> = {code, msg, data},code=0 成功;读 msg 非 message;JWT key=qms_token
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  // 数组参数序列化为 key=v1&key=v2(Spring @RequestParam List 可绑定)
  paramsSerializer: {
    serialize: (params) => {
      const usp = new URLSearchParams()
      Object.entries(params || {}).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(item => usp.append(k, String(item)))
        else if (v !== undefined && v !== null) usp.append(k, String(v))
      })
      return usp.toString()
    },
  },
})

// ── 错误提示:全局统一弹窗 + 去重节流(1.5s 内相同文案只弹一次,避免并发刷屏)──
let lastMsg = ''
let lastMsgAt = 0
export function showError(message: string) {
  const now = Date.now()
  if (message && message === lastMsg && now - lastMsgAt < 1500) return
  lastMsg = message
  lastMsgAt = now
  if (message) ElMessage.error(message)
}

// 从响应体/错误中稳健提取可读错误信息(兼容 msg / message / error 等多种字段)
function extractError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const data = payload as Record<string, any>
  return data.msg || data.message || data.error || data.errorMessage || ''
}

let redirecting = false
function redirectToLogin() {
  if (redirecting) return
  redirecting = true
  localStorage.removeItem('qms_token')
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?redirect=${redirect}`
}

// 请求拦截:注入 JWT + X-Trace-Id + X-Org-Context(组织视图切换,供后端 DataScope 过滤)
service.interceptors.request.use((config) => {
  const token = localStorage.getItem('qms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Trace-Id'] = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  // 组织视图:ALL = 全局视图(不带头);MZ/SZ = 对应分公司过滤
  const org = localStorage.getItem('qms_current_org')
  if (org && org !== 'ALL') config.headers['X-Org-Context'] = org
  return config
})

// 响应拦截:对齐 R<T>,code=0/200 成功解包 data;401 登出;其余错误全局弹窗
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0 || res.code === 200) return res.data
      if (res.code === 401) {
        redirectToLogin()
        return Promise.reject(new Error(res.msg || '未认证'))
      }
      // 业务错误(如后端返回 code=400/403/500 等业务码,但 HTTP 仍为 200)
      const msg = extractError(res) || `请求失败 (code: ${res.code})`
      showError(msg)
      return Promise.reject(new Error(msg))
    }
    return res
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data

    // 401 统一跳登录
    if (status === 401) {
      redirectToLogin()
      return Promise.reject(error)
    }

    // 优先取后端返回的结构化错误信息
    let msg = extractError(data)

    // 无结构化信息时,按 HTTP 状态码给友好文案(重点覆盖 5xx)
    if (!msg) {
      switch (status) {
        case 400: msg = '请求参数错误 (400)'; break
        case 403: msg = '没有权限执行该操作 (403)'; break
        case 404: msg = '请求的资源不存在 (404)'; break
        case 500: msg = '服务器内部错误，请稍后重试 (500)'; break
        case 502: msg = '网关错误 (502)'; break
        case 503: msg = '服务暂不可用 (503)'; break
        case 504: msg = '网关超时 (504)'; break
        default:
          msg = !error.response ? '网络连接失败，请检查网络' : `请求失败 (${status})`
      }
    }

    showError(msg)
    return Promise.reject(error)
  }
)

export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config) as unknown as Promise<T>
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config) as unknown as Promise<T>
  },
}
