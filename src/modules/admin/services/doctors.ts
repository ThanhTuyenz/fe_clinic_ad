import { apiFetch, getApiBase, parseJsonResponse } from './apiBase'

export function isValidDoctorId(id) {
  return typeof id === 'string' && (/^[a-fA-F0-9]{24}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))
}

export async function listDoctors() {
  const base = getApiBase()
  let res
  try {
    res = await apiFetch(`${base}/doctors`, { method: 'GET' })
  } catch {
    throw new Error(
      'Không kết nối được máy chủ. Hãy chạy backend (ví dụ port 5000) và kiểm tra NEXT_PUBLIC_API_URL.',
    )
  }
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh sách bác sĩ.')
  }
  const raw = Array.isArray(data) ? data : data?.doctors || []
  return raw.filter((d) => isValidDoctorId(d?.id))
}
