import { apiFetch, getApiBase, parseJsonResponse } from './apiBase'

export async function searchMedicines({ token, q, limit = 25 }) {
  const base = getApiBase()
  const qs = new URLSearchParams()
  if (q != null && String(q).trim()) qs.set('q', String(q).trim())
  if (limit) qs.set('limit', String(limit))
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await apiFetch(`${base}/medicines?${qs.toString()}`, {
    method: 'GET',
    headers,
  })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không tìm được thuốc.')
  }
  return data?.medicines || []
}
