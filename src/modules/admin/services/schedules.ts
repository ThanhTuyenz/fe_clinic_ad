import { apiClient } from '@/lib/api-client'

function unwrap(payload: any) {
  return payload?.success === true && 'data' in payload ? payload.data : payload
}

export async function listSchedules(params?: { doctorId?: string; branchId?: string; startDate?: string; endDate?: string }) {
  const response = await apiClient.get('/schedules', { params })
  console.log('🔍 [API GET /schedules] Raw Response:', response.data)
  const result = unwrap(response.data)
  console.log('🔍 [API GET /schedules] Unwrapped Result:', result)
  return Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []
}

export async function createSchedule(data: {
  doctorId: string
  branchId: string
  workDate: string
  startTime?: string
  endTime?: string
  slotDurationMin?: number
  roomId?: string
  status?: string
}) {
  const response = await apiClient.post('/schedules', data)
  return unwrap(response.data)
}

export async function updateSchedule(id: string, data: any) {
  const response = await apiClient.patch(`/schedules/${id}`, data)
  return unwrap(response.data)
}

export async function deleteSchedule(id: string) {
  const response = await apiClient.delete(`/schedules/${id}`)
  return unwrap(response.data)
}
