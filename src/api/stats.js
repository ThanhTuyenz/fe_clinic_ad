import { getApiBase, parseJsonResponse, staffFetch } from './apiBase.js'

export async function fetchDashboardStats({ token }) {
  const base = getApiBase()
  const { res, data } = await staffFetch(`${base}/api/stats/dashboard`, { token })
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được thống kê.')
  }
  return data
}
