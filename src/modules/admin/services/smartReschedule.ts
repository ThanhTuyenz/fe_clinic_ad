import { apiClient, apiErrorMessage, unwrapApiData } from '@/lib/api-client'

export interface DoctorLeaveImpactItem {
  appointment: any
  suggestedSlots: Array<{
    slotId: string
    doctorName: string
    workDate: string
    startTime: string
    endTime: string
    branchName: string
    roomName: string
  }>
}

export interface DoctorLeaveImpactResponse {
  doctor: {
    id: string
    fullName?: string
    specialtyName?: string
  }
  affectedCount: number
  impacts: DoctorLeaveImpactItem[]
}

export async function analyzeDoctorLeaveImpact(payload: {
  doctorId: string
  fromDate: string
  toDate: string
}): Promise<DoctorLeaveImpactResponse> {
  try {
    const res = await apiClient.post('/appointments/doctor-leave/impact-analysis', payload)
    return unwrapApiData<DoctorLeaveImpactResponse>(res.data)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Không thể phân tích tác động lịch nghỉ của bác sĩ.'))
  }
}

export async function executeSmartReschedule(payload: {
  items: Array<{ appointmentId: string; newSlotId: string }>
}): Promise<{ total: number; successCount: number; results: any[] }> {
  try {
    const res = await apiClient.post('/appointments/doctor-leave/smart-reschedule', payload)
    return unwrapApiData<any>(res.data)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Không thể thực hiện đổi lịch thông minh.'))
  }
}
