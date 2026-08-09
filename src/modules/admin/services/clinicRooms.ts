import { apiErrorMessage, apiRequest } from './apiBase'

/** Danh mục phòng (không cần token — giống GET /api/doctors). */
export async function listClinicRooms({ activeOnly = true } = {}) {
  const qs = new URLSearchParams()
  if (!activeOnly) qs.set('activeOnly', 'false')
  try {
    const data = await apiRequest({ method: 'GET', url: '/clinic-rooms', params: Object.fromEntries(qs) })
    return Array.isArray(data) ? data : data?.rooms || []
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được danh sách phòng.'))
  }
}
