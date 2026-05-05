import { getApiBase, parseJsonResponse } from './apiBase.js'

async function parseJson(res) {
  return parseJsonResponse(res)
}

export async function login({ email, password }) {
  const base = getApiBase()
  const res = await fetch(`${base}/api/auth/staff-login`, {
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
  return data
}
