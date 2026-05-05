import { getApiBase, parseJsonResponse } from './apiBase.js'

/**
 * Danh sách thuốc từ MongoDB (GET /api/medicines) — cùng máy chủ với `VITE_API_URL`.
 * @param {object} opts
 * @param {string} [opts.token] — Bearer nếu backend yêu cầu
 * @param {string} [opts.q] — tìm theo tên hoặc mã
 */
export async function listMedicines({ token, q } = {}) {
  const base = getApiBase()
  const qs = new URLSearchParams()
  const qq = String(q || '').trim()
  if (qq) qs.set('q', qq)
  const url = `${base}/api/medicines${qs.toString() ? `?${qs}` : ''}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { method: 'GET', headers })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh mục thuốc.')
  }
  return Array.isArray(data.medicines) ? data.medicines : []
}
