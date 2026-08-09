import { apiErrorMessage, apiRequest } from './apiBase'

export async function searchIcd10({ token, q, limit = 20, deptID }) {
  const qs = new URLSearchParams()
  if (q != null && String(q).trim()) qs.set('q', String(q).trim())
  if (limit) qs.set('limit', String(limit))
  if (deptID) qs.set('deptID', String(deptID).trim())
  try { const data = await apiRequest({ method: 'GET', url: '/icd10', params: Object.fromEntries(qs) }); return data?.items || data?.icd10 || [] }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không tìm được mã ICD-10.')) }
}
