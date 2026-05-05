import { getApiBase, parseJsonResponse } from './apiBase.js'

export function isMongoObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)
}

export async function listDoctors() {
  const base = getApiBase()
  let res
  try {
    res = await fetch(`${base}/api/doctors`, { method: 'GET' })
  } catch {
    throw new Error(
      'Không kết nối được máy chủ. Hãy chạy backend (ví dụ port 5000) và kiểm tra VITE_API_URL.',
    )
  }
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh sách bác sĩ.')
  }
  const raw = data.doctors || []
  return raw.filter((d) => isMongoObjectId(d?.id))
}
