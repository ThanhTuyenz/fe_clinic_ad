import { apiClient } from '@/lib/api-client'

function unwrap(payload: any) {
  return payload?.success === true && 'data' in payload ? payload.data : payload
}

export async function listUsers(params: Record<string, any> = {}) {
  const response = await apiClient.get('/users', { params: { page: 1, limit: 100, isDeleted: false, ...params } })
  const result = unwrap(response.data) || {}
  return { data: Array.isArray(result.data) ? result.data : [], total: Number(result.total) || 0 }
}

export async function createUser(payload: Record<string, any>) {
  const response = await apiClient.post('/users', payload)
  return unwrap(response.data)
}

export async function updateUser(id: string, payload: Record<string, any>) {
  const response = await apiClient.patch(`/users/${id}`, payload)
  return unwrap(response.data)
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/users/${id}`)
}
