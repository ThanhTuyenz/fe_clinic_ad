import { clearStaffSession } from '../utils/staffSession.js'

/** Base URL của be_clinic — ưu tiên `VITE_API_URL`, mặc định dev :5000 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL
  return (raw && String(raw).replace(/\/$/, '')) || 'http://localhost:5000'
}

export async function parseJsonResponse(res) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text || 'Lỗi không xác định.' }
  }
}

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/** Gọi API có Bearer; 401 → xóa phiên và ném AuthError. */
export async function staffFetch(url, { token, method = 'GET', headers, body } = {}) {
  const h = new Headers(headers || {})
  const tok = String(token || '').trim()
  if (tok) h.set('Authorization', `Bearer ${tok}`)
  const init = { method, headers: h }
  if (body !== undefined) {
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json')
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const res = await fetch(url, init)
  const data = await parseJsonResponse(res)
  if (res.status === 401) {
    clearStaffSession()
    const msg = String(data.message || '')
    const friendly =
      /không hợp lệ|hết hạn|thiếu token/i.test(msg)
        ? 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
        : msg || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    throw new AuthError(friendly, 401)
  }
  return { res, data }
}
