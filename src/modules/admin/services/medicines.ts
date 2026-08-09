import { apiErrorMessage, apiRequest } from './apiBase'

export async function searchMedicines({ token, q, limit = 25 }) {
  const qs = new URLSearchParams()
  if (q != null && String(q).trim()) qs.set('q', String(q).trim())
  if (limit) qs.set('limit', String(limit))
  try { const data = await apiRequest({ method: 'GET', url: '/medicines', params: Object.fromEntries(qs) }); return data?.medicines || [] }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không tìm được thuốc.')) }
}
