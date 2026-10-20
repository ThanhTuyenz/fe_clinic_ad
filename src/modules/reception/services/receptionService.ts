import { apiClient, apiErrorMessage, unwrapApiData } from '@/lib/api-client'
import {
  listReceptionAppointments,
  lookupAppointmentByTicket,
  updateAppointmentStatus,
  createAppointmentReception,
  getAvailability,
  listPatientHistoryReception,
  listPatientsReception,
  lookupPatientByCode,
} from '@/modules/admin/services/appointments'
import { listClinicRooms } from '@/modules/admin/services/clinicRooms'
import { recordAppointmentPayment } from '@/modules/admin/services/payments'
import { listSpecialties, listDoctorsBySpecialty, listSpecialtyServices } from '@/modules/admin/services/specialties'
import { listUsers } from '@/modules/admin/services/users'
import { listSchedules } from '@/modules/admin/services/schedules'

export async function updatePatientProfileByStaff(id: string, dto: Record<string, any>) {
  try {
    const response = await apiClient.patch(`/patient-profiles/${id}`, dto)
    return unwrapApiData(response.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không thể cập nhật hồ sơ bệnh nhân.'))
  }
}

export const receptionService = {
  updatePatientProfileByStaff,
  listReceptionAppointments,
  lookupAppointmentByTicket,
  updateAppointmentStatus,
  createAppointmentReception,
  getAvailability,
  listPatientHistoryReception,
  listPatientsReception,
  lookupPatientByCode,
  recordAppointmentPayment,
  listClinicRooms,
  listSpecialties,
  listDoctorsBySpecialty,
  listSpecialtyServices,
  listUsers,
  listSchedules,
}
