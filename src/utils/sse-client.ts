/**
 * SSE 客户端封装(fetch + ReadableStream 实现):
 * - 通过 fetch 发送 Authorization 头,解决原生 EventSource 无法携带 token 导致 401 的问题
 * - 自动重连(指数退避,最长 30s)
 * - visibilitychange 管理:切后台断开,切回前台重连
 * - 心跳检测:30s 无消息则重连
 */
type SseEventCallback = (event: string, data: unknown) => void

export function createSseClient(onEvent: SseEventCallback) {
  const baseUrl = import.meta.env.VITE_API_BASE || '/api'
  const url = `${baseUrl}/v1/notifications/stream`

  let abortCtrl: AbortController | null = null
  let reconnectTimer = 0
  let heartbeatTimer = 0
  let retryDelay = 1000 // 初始重试延迟 1s,指数退避最大 30s
  let stopped = false
  let paused = false // 页面切后台时暂停,不重连
  let connecting = false
  let buffer = ''

  function getToken(): string {
    try {
      return localStorage.getItem('qms_token') || ''
    } catch {
      return ''
    }
  }

  function scheduleReconnect() {
    if (stopped || paused) return
    clearTimeout(reconnectTimer)
    reconnectTimer = window.setTimeout(() => {
      connect()
      retryDelay = Math.min(retryDelay * 2, 30000)
    }, retryDelay)
  }

  function resetHeartbeat() {
    clearTimeout(heartbeatTimer)
    heartbeatTimer = window.setTimeout(() => {
      // 30s 无消息,主动断开重连
      abortCtrl?.abort()
      abortCtrl = null
      scheduleReconnect()
    }, 30000)
  }

  function clearTimers() {
    clearTimeout(reconnectTimer)
    clearTimeout(heartbeatTimer)
  }

  let curEvent = ''
  let curData = ''

  function handleLine(line: string) {
    if (line === '') {
      if (curEvent) {
        let payload: unknown = curData
        try {
          payload = JSON.parse(curData)
        } catch {
          /* data 不是 JSON 时保持原始字符串(如 connected -> "ok") */
        }
        onEvent(curEvent, payload)
      }
      curEvent = ''
      curData = ''
      return
    }
    if (line.startsWith('event:')) {
      curEvent = line.slice(6).trim()
      return
    }
    if (line.startsWith('data:')) {
      curData += (curData ? '\n' : '') + line.slice(5).trim()
      return
    }
    // 以 ':' 开头的注释行(心跳/keepalive)忽略
  }

  async function connect() {
    if (stopped || paused || connecting) return
    const token = getToken()
    if (!token) {
      // 未登录,等待一段时间后重试(登录成功后下次重连即可成功)
      scheduleReconnect()
      return
    }
    connecting = true
    try {
      const ctrl = new AbortController()
      abortCtrl = ctrl
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: ctrl.signal,
        cache: 'no-store',
      })
      if (!res.ok || !res.body) {
        connecting = false
        scheduleReconnect()
        return
      }
      retryDelay = 1000
      resetHeartbeat()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).replace(/\r$/, '')
          buffer = buffer.slice(idx + 1)
          handleLine(line)
        }
      }
    } catch {
      /* aborted 或网络错误,交给 finally 重连 */
    } finally {
      connecting = false
      if (!stopped && !paused) scheduleReconnect()
    }
  }

  function disconnect() {
    stopped = true
    clearTimers()
    abortCtrl?.abort()
    abortCtrl = null
  }

  function onVisibilityChange() {
    if (document.hidden) {
      paused = true
      abortCtrl?.abort()
      abortCtrl = null
      clearTimers()
    } else {
      paused = false
      stopped = false
      retryDelay = 1000
      connect()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  return {
    connect,
    disconnect: () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      disconnect()
    },
  }
}
