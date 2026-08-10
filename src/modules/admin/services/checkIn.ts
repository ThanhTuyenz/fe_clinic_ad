import { apiClient, apiErrorMessage, unwrapApiData } from '@/lib/api-client'

export type CheckInResult = {
  appointmentId: string
  bookingCode: string
  queueNumber: number
  status: 'CHECKED_IN'
  channel: 'KIOSK' | 'RECEPTIONIST'
  patient?: { fullName?: string }
  doctor?: { fullName?: string }
  room?: { code?: string; name?: string } | null
}

async function scan(path: string, token: string): Promise<CheckInResult> {
  try {
    const response = await apiClient.post(path, { token: String(token || '').trim() })
    return unwrapApiData<CheckInResult>(response.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể check-in bằng mã QR.'))
  }
}

export const staffCheckInByQr = (token: string) => scan('/check-in/scan', token)
export const kioskCheckInByQr = (token: string) => scan('/check-in/kiosk/scan', token)
