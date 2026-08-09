import { apiErrorMessage, apiRequest } from './apiBase'

export async function login({ email, password }) {
  try { return await apiRequest({ method: 'POST', url: '/auth/login', data: { email, password } }) }
  catch (error) { throw new Error(apiErrorMessage(error, 'Đăng nhập thất bại.')) }
}

export async function getCurrentStaff(token = '') {
  try { const data = await apiRequest({ method: 'GET', url: '/auth/status' }); return data?.user || data }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không thể xác thực phiên đăng nhập.')) }
}
