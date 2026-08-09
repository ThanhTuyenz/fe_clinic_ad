import { apiErrorMessage, apiRequest } from './apiBase'

export async function fetchDashboardStats({ token }) {
  try { return await apiRequest({ method: 'GET', url: '/stats/dashboard' }) }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không lấy được thống kê.')) }
}
