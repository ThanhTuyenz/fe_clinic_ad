import { apiFetch, getApiBase, parseJsonResponse, staffFetch } from './apiBase'

async function parseJson(res) {
  return parseJsonResponse(res)
}

async function staffGet(path, { token, query } = {}) {
  const base = getApiBase()
  const qs = query ? `?${query.toString()}` : ''
  const { res, data } = await staffFetch(`${base}${path}${qs}`, { token })
  if (!res.ok) {
    throw new Error(data.message || 'Yêu cầu thất bại.')
  }
  return data
}

export async function listDoctorAppointments({ token }) {
  const base = getApiBase()
  const res = await apiFetch(`${base}/appointments/doctor`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được lịch khám.')
  }
  return data?.appointments || []
}

export async function lookupPatientByCode({ token, code }) {
  const base = getApiBase()
  const qs = new URLSearchParams({ code: String(code || '').trim() })
  const res = await apiFetch(`${base}/appointments/patient-by-code?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không tìm thấy bệnh nhân.')
  }
  return data
}

export async function listPatientsReception({ token, page = 1, pageSize = 10, patientCode, name, phone, account }) {
  const qs = new URLSearchParams()
  if (page) qs.set('page', String(page))
  if (pageSize) qs.set('pageSize', String(pageSize))
  if (patientCode) qs.set('patientCode', String(patientCode).trim())
  if (name) qs.set('name', String(name).trim())
  if (phone) qs.set('phone', String(phone).trim())
  if (account) qs.set('account', String(account).trim())
  return staffGet('/appointments/patients', { token, query: qs })
}

export async function listPatientHistoryReception({ token, patientId }) {
  const base = getApiBase()
  const qs = new URLSearchParams({ patientId: String(patientId || '').trim() })
  const res = await apiFetch(`${base}/appointments/patient-history?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được lịch sử khám.')
  }
  return data?.appointments || []
}

/** Lịch sử khám bệnh nhân (bác sĩ hoặc tiếp nhận). */
export async function listPatientHistory({ token, patientId }) {
  return listPatientHistoryReception({ token, patientId })
}

export async function lookupAppointmentByTicket({ token, ticket }) {
  const base = getApiBase()
  const qs = new URLSearchParams({ ticket: String(ticket || '').trim() })
  const res = await apiFetch(`${base}/appointments/lookup-ticket?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không tra cứu được mã vé.')
  }
  return data
}

export async function getAvailability({ token, doctorId, date }) {
  const base = getApiBase()
  const qs = new URLSearchParams({
    doctorId: String(doctorId || '').trim(),
    date: String(date || '').trim(),
  })
  const res = await apiFetch(`${base}/appointments/availability?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được khung giờ.')
  }
  return data
}

export async function listReceptionAppointments({ token, from, to, status, q }) {
  const base = getApiBase()
  const qs = new URLSearchParams()
  if (from) qs.set('from', String(from).trim())
  if (to) qs.set('to', String(to).trim())
  if (status && status !== 'all') qs.set('status', String(status).trim())
  if (q) qs.set('q', String(q).trim())
  const res = await apiFetch(`${base}/appointments/reception?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh sách lịch.')
  }
  return data?.appointments || []
}

/** STT gợi ý kế tiếp theo ngày khám + phòng (max STT đã khám trong phòng + 1). */
export async function getNextVisitQueueNumber({ token, appointmentDate, clinicRoom, excludeAppointmentId }) {
  const qs = new URLSearchParams()
  qs.set('appointmentDate', String(appointmentDate || '').trim().slice(0, 10))
  qs.set('clinicRoom', String(clinicRoom ?? '').trim())
  if (excludeAppointmentId) qs.set('excludeAppointmentId', String(excludeAppointmentId).trim())
  const data = await staffGet('/appointments/next-visit-queue', { token, query: qs })
  const n = data?.nextVisitQueueNumber
  return Number.isFinite(Number(n)) && Number(n) >= 1 ? Number(n) : 1
}

export async function updateAppointmentStatus({
  token,
  appointmentId,
  status,
  cancelReason,
  cancelledBySystem,
  note,
  visitQueueNumber,
  clinicRoom,
}) {
  const base = getApiBase()
  const id = String(appointmentId || '').trim()
  const body = { status }
  if (cancelReason != null && String(cancelReason).trim()) body.cancelReason = String(cancelReason).trim()
  if (cancelledBySystem === true) body.cancelledBySystem = true
  if (note !== undefined) body.note = String(note || '')
  if (visitQueueNumber !== undefined) body.visitQueueNumber = visitQueueNumber
  if (clinicRoom !== undefined) body.clinicRoom = String(clinicRoom ?? '').trim()
  const res = await apiFetch(`${base}/appointments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không cập nhật được trạng thái.')
  }
  return data
}

export async function finishExamAppointment({ token, appointmentId }) {
  const base = getApiBase()
  const id = String(appointmentId || '').trim()
  const res = await apiFetch(`${base}/appointments/${encodeURIComponent(id)}/finish-exam`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không kết thúc khám được.')
  }
  return data
}

export async function createAppointmentReception({
  token,
  patientEmailOrPhone,
  patient,
  createdByStaff,
  doctorId,
  appointmentDate,
  startTime,
  note,
}) {
  const base = getApiBase()
  const res = await apiFetch(`${base}/appointments/reception`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      source: 'clinic',
      bookingSource: 'clinic',
      createdByStaff: createdByStaff || null,
      patientEmailOrPhone: String(patientEmailOrPhone || '').trim(),
      patient: patient || null,
      doctorId,
      appointmentDate,
      startTime,
      note: note || '',
    }),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Đặt lịch thất bại.')
  }
  return data
}
