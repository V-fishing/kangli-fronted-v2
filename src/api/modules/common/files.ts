import { request } from '@/api/client'

export interface UploadResult {
  path: string // 存储的相对文件名
  fileName: string // 原始文件名
}

/** 通用文件上传/下载(附件走 logs/files) */
export const fileApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return request.post<UploadResult>('/v1/files/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** 带 JWT 下载附件并触发浏览器保存 */
  async download(path: string, saveAs?: string) {
    const blob = await request.get<Blob>('/v1/files/download', {
      params: { path },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = saveAs || path
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
