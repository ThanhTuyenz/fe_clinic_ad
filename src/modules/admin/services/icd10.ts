import { apiFetch, getApiBase, parseJsonResponse } from './apiBase'

export async function searchIcd10({ token, q, limit = 20, deptID }) {
  const base = getApiBase()
  const qs = new URLSearchParams()
  if (q != null && String(q).trim()) qs.set('q', String(q).trim())
  if (limit) qs.set('limit', String(limit))
  if (deptID) qs.set('deptID', String(deptID).trim())
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await apiFetch(`${base}/icd10?${qs.toString()}`, {
    method: 'GET',
    headers,
  })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không tìm được mã ICD-10.')
  }
  return data?.items || data?.icd10 || []
}
