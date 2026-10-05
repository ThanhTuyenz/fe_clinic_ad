import { apiErrorMessage, apiRequest } from './apiBase'

async function appointmentRequest(config, fallback) {
  try { return await apiRequest(config) }
  catch (error) { throw new Error(apiErrorMessage(error, fallback)) }
}

export async function listDoctorAppointments() {
  const data = await appointmentRequest({ method: 'GET', url: '/appointments/doctor' }, 'Không lấy được lịch khám.')
  return data?.appointments || []
}

export async function lookupPatientByCode({ code }) {
  return appointmentRequest({ method: 'GET', url: '/appointments/patient-by-code', params: { code: String(code || '').trim() } }, 'Không tìm thấy bệnh nhân.')
}

export async function listPatientsReception({ page = 1, pageSize = 50, q, patientCode, name, phone, account }: any = {}) {
  const params: Record<string, any> = { page, pageSize }
  const searchTerm = q || patientCode || name || phone || account
  if (searchTerm) params.q = searchTerm

  const data = await appointmentRequest({ method: 'GET', url: '/appointments/patients', params }, 'Không lấy được danh sách bệnh nhân.')
  const patients = Array.isArray(data?.patients) ? data.patients : Array.isArray(data?.rows) ? data.rows : []
  return {
    ...data,
    patients,
    rows: patients,
    total: Number(data?.total || 0),
    page: Number(data?.page || page),
    pageSize: Number(data?.pageSize || pageSize),
  }
}

export async function listPatientHistoryReception({ patientId }) {
  const data = await appointmentRequest({ method: 'GET', url: '/appointments/patient-history', params: { patientId: String(patientId || '').trim() } }, 'Không lấy được lịch sử khám.')
  return data?.appointments || []
}

export async function listPatientHistory(options) {
  return listPatientHistoryReception(options)
}

export async function lookupAppointmentByTicket({ ticket }) {
  return appointmentRequest({ method: 'GET', url: '/appointments/lookup-ticket', params: { ticket: String(ticket || '').trim() } }, 'Không tra cứu được mã vé.')
}

export async function getAvailability({ doctorId, date }) {
  return appointmentRequest({ method: 'GET', url: '/appointments/availability', params: { doctorId: String(doctorId || '').trim(), date: String(date || '').trim() } }, 'Không lấy được khung giờ.')
}

export async function listReceptionAppointments({ from, to, status, q }) {
  const params = { from, to, q, ...(status && status !== 'all' ? { status } : {}) }
  const data = await appointmentRequest({ method: 'GET', url: '/appointments/reception', params }, 'Không lấy được danh sách lịch.')
  return data?.appointments || []
}

export async function getNextVisitQueueNumber({ appointmentDate, clinicRoom, excludeAppointmentId }) {
  const data = await appointmentRequest({ method: 'GET', url: '/appointments/next-visit-queue', params: { appointmentDate: String(appointmentDate || '').trim().slice(0, 10), clinicRoom: String(clinicRoom ?? '').trim(), excludeAppointmentId } }, 'Không lấy được số thứ tự.')
  const value = Number(data?.nextVisitQueueNumber)
  return Number.isFinite(value) && value >= 1 ? value : 1
}

export async function updateAppointmentStatus({ appointmentId, status, cancelReason, cancelledBySystem, note, visitQueueNumber, clinicRoom }) {
  const id = String(appointmentId || '').trim()
  const data = { status }
  if (cancelReason != null && String(cancelReason).trim()) data.cancelReason = String(cancelReason).trim()
  if (cancelledBySystem === true) data.cancelledBySystem = true
  if (note !== undefined) data.note = String(note || '')
  if (visitQueueNumber !== undefined) data.visitQueueNumber = visitQueueNumber
  if (clinicRoom !== undefined) data.clinicRoom = String(clinicRoom ?? '').trim()
  return appointmentRequest({ method: 'PATCH', url: `/appointments/${encodeURIComponent(id)}/status`, data }, 'Không cập nhật được trạng thái.')
}

export async function finishExamAppointment({ appointmentId }) {
  const id = String(appointmentId || '').trim()
  return appointmentRequest({ method: 'PATCH', url: `/appointments/${encodeURIComponent(id)}/finish-visit` }, 'Không kết thúc khám được.')
}

export async function createAppointmentReception({ patientEmailOrPhone, patient, createdByStaff, doctorId, appointmentDate, startTime, note }: any) {
  return appointmentRequest({ method: 'POST', url: '/appointments/reception', data: { source: 'clinic', bookingSource: 'clinic', createdByStaff: createdByStaff || null, patientEmailOrPhone: String(patientEmailOrPhone || '').trim(), patient: patient || null, doctorId, appointmentDate, startTime, note: note || '' } }, 'Đặt lịch thất bại.')
}

export async function rescheduleAppointment({ appointmentId, newSlotId, note }: { appointmentId: string; newSlotId: string; note?: string }) {
  return appointmentRequest(
    { method: 'POST', url: `/appointments/${encodeURIComponent(appointmentId)}/reschedule`, data: { newSlotId, note } },
    'Đổi lịch khám thất bại.',
  )
}

