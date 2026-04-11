const base =
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).replace(/\/$/, '')) ||
  'http://localhost:5000'

export function isMongoObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)
}

async function parseJson(res) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text || 'Lỗi không xác định.' }
  }
}

export async function listDoctors() {
  let res
  try {
    res = await fetch(`${base}/api/doctors`, { method: 'GET' })
  } catch {
    throw new Error(
      'Không kết nối được máy chủ. Hãy chạy backend (ví dụ port 5000) và kiểm tra VITE_API_URL.',
    )
  }
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh sách bác sĩ.')
  }
  const raw = data.doctors || []
  return raw.filter((d) => isMongoObjectId(d?.id))
}
