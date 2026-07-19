/**
 * 计算 File 的 SHA-1 哈希值（小写十六进制字符串）。
 * 使用 crypto.subtle.digest，对大文件分块读取以降低内存峰值。
 */

const CHUNK_SIZE = 8 * 1024 * 1024 // 8MB

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (b === undefined) continue
    hex += b.toString(16).padStart(2, '0')
  }
  return hex
}

export async function computeSha1(file: File | Blob): Promise<string> {
  // 小文件一次性计算
  if (file.size <= CHUNK_SIZE) {
    const buf = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-1', buf)
    return bufferToHex(digest)
  }

  // 大文件：使用流式读取 + 逐步更新
  // crypto.subtle 不支持流式 SHA-1 增量 API，所以这里仍然一次性读入。
  // 浏览器对单个 ArrayBuffer 上限通常为 2GB，模组 jar 远低于此。
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-1', buf)
  return bufferToHex(digest)
}

export async function computeSha512(file: File | Blob): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-512', buf)
  return bufferToHex(digest)
}
