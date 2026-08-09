import { getApiBase, parseJsonResponse, staffFetch } from './apiBase'

export async function fetchDashboardStats({ token }) {
  const base = getApiBase()
  const { res, data } = await staffFetch(`${base}/stats/dashboard`, { token })
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được thống kê.')
  }
  return data
}
