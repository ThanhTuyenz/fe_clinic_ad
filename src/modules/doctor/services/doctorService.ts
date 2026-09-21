import { apiClient, apiErrorMessage } from '@/lib/api-client'
import {
  finishExamAppointment,
  listDoctorAppointments,
  listPatientHistory,
  updateAppointmentStatus,
} from '@/modules/admin/services/appointments'
import { listClinicRooms } from '@/modules/admin/services/clinicRooms'
import {
  getClinicalOrderPass,
  getMedicalVisitByAppointment,
  listClinicalServices,
  listDoctorPrescriptions,
  mockClinicalOrderResult,
  saveMedicalVisit,
} from '@/modules/admin/services/medicalVisits'
import { searchMedicines } from '@/modules/admin/services/medicines'

export {
  finishExamAppointment,
  listDoctorAppointments,
  listPatientHistory,
  updateAppointmentStatus,
  listClinicRooms,
  getClinicalOrderPass,
  getMedicalVisitByAppointment,
  listClinicalServices,
  listDoctorPrescriptions,
  mockClinicalOrderResult,
  saveMedicalVisit,
  searchMedicines,
}
