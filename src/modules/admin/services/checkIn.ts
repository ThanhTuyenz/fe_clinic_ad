import { apiClient, apiErrorMessage, unwrapApiData } from '@/lib/api-client'

export type CheckInResult = {
  appointmentId: string
  bookingCode: string
  queueNumber: number
  status: 'CHECKED_IN'
  channel: 'RECEPTIONIST'
  patient?: {
    id?: string
    fullName?: string
    nationalId?: string | null
    phoneNumber?: string | null
    gender?: string | null
    dateOfBirth?: string | null
    address?: string | null
  }
  doctor?: { fullName?: string }
  healthPackage?: { name?: string }
  room?: { code?: string; name?: string } | null
}

export type CheckInPreviewResult = {
  appointmentId: string
  bookingCode: string
  status: string
  queueNumber: number | null
  patient: {
    id: string
    fullName: string
    gender?: string | null
    dateOfBirth?: string | null
    nationalId?: string | null
    healthInsuranceNumber?: string | null
    phoneNumber?: string | null
    address?: string | null
  }
  doctor?: { id: string; fullName: string } | null
  healthPackage?: { id: string; name: string } | null
  room?: { id?: string; code?: string; name?: string } | null
  branch?: { id: string; name: string } | null
}

async function scan(path: string, token: string, branchId?: string): Promise<CheckInResult> {
  try {
    const response = await apiClient.post(path, { token: String(token || '').trim(), branchId })
    return unwrapApiData<CheckInResult>(response.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể check-in bằng mã QR.'))
  }
}

export const staffCheckInByQr = (token: string, branchId?: string) => scan('/check-in/scan', token, branchId)

export async function staffCheckInByNationalId(nationalId: string, branchId?: string): Promise<CheckInResult> {
  try {
    const response = await apiClient.post('/check-in/by-national-id', {
      nationalId: String(nationalId || '').trim(),
      branchId,
    })
    return unwrapApiData<CheckInResult>(response.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể check-in bằng số CCCD.'))
  }
}

export async function previewCheckInByQr(token: string, branchId?: string): Promise<CheckInPreviewResult> {
  try {
    const response = await apiClient.post('/check-in/preview', { token: String(token || '').trim(), branchId })
    return unwrapApiData<CheckInPreviewResult>(response.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể kiểm tra mã QR.'))
  }
}

export async function updatePatientProfileByStaff(id: string, dto: Record<string, any>) {
  try {
    const response = await apiClient.patch(`/patient-profiles/${id}`, dto)
    return unwrapApiData(response.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể cập nhật hồ sơ bệnh nhân.'))
  }
}
