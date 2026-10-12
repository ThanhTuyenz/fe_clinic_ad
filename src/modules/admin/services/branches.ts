import { apiErrorMessage, apiRequest } from './apiBase'

export async function listBranches() {
  try {
    const data = await apiRequest({ method: 'GET', url: '/branches' })
    return Array.isArray(data) ? data : data?.branches || data?.items || []
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được danh sách chi nhánh.'))
  }
}
