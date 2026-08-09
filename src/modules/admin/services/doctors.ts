import { apiErrorMessage, apiRequest } from './apiBase'

export function isValidDoctorId(id) {
  return typeof id === 'string' && (/^[a-fA-F0-9]{24}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))
}

export async function listDoctors() {
  try {
    const data = await apiRequest({ method: 'GET', url: '/doctors' })
    const raw = Array.isArray(data) ? data : data?.doctors || []
    return raw.filter((d) => isValidDoctorId(d?.id))
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được danh sách bác sĩ.'))
  }
}
