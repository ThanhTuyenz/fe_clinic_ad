import { apiErrorMessage, apiRequest } from './apiBase'

export async function fetchDashboardStats({ token }: { token?: string } = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    return await apiRequest({ method: 'GET', url: '/stats/dashboard', headers })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được thống kê.'))
  }
}
