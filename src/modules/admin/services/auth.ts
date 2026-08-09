import { apiFetch, getApiBase, parseJsonResponse, staffFetch } from './apiBase'

async function parseJson(res) {
  return parseJsonResponse(res)
}

export async function login({ email, password }) {
  const base = getApiBase()
  const res = await apiFetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data.message || 'Đăng nhập thất bại.')
    if (data.code) err.code = data.code
    throw err
  }
  return data?.data || data
}

export async function getCurrentStaff(token) {
  const { res, data } = await staffFetch(`${getApiBase()}/auth/status`, { token })
  if (!res.ok) throw new Error(data.message || 'Không thể xác thực phiên đăng nhập.')
  return data?.data || data?.user || data
}
