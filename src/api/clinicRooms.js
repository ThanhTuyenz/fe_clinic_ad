import { getApiBase, parseJsonResponse } from './apiBase.js'

/** Danh mục phòng (không cần token — giống GET /api/doctors). */
export async function listClinicRooms({ activeOnly = true } = {}) {
  const base = getApiBase()
  const qs = new URLSearchParams()
  if (!activeOnly) qs.set('activeOnly', 'false')
  const q = qs.toString()
  let res
  try {
    res = await fetch(`${base}/api/clinic-rooms${q ? `?${q}` : ''}`, { method: 'GET' })
  } catch {
    throw new Error('Không kết nối được máy chủ.')
  }
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh sách phòng.')
  }
  return data?.rooms || []
}
