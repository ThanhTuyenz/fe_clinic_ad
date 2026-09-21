import { apiClient, apiErrorMessage, unwrapApiData } from '@/lib/api-client'

export async function login({ email, password }: { email?: string; password?: string }) {
  try {
    const res = await apiClient.post('/auth/login', { email, password })
    return unwrapApiData(res.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Đăng nhập thất bại.'))
  }
}

export async function getCurrentStaff(token = '') {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await apiClient.get('/auth/status', { headers })
    const data = unwrapApiData<any>(res.data)
    return data?.user || data
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể xác thực phiên đăng nhập.'))
  }
}

export const authService = {
  login,
  getCurrentStaff,
}
