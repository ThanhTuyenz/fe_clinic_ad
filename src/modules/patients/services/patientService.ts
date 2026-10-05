import { createUser, deleteUser, listUsers, updateUser } from '@/modules/admin/services/users'
import { listPatientHistoryReception, listPatientsReception } from '@/modules/appointments'

export const patientService = {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  listPatientHistoryReception,
  listPatientsReception,
}

export { createUser, deleteUser, listUsers, updateUser, listPatientHistoryReception, listPatientsReception }
