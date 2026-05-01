const base =
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).replace(/\/$/, '')) ||
  'http://localhost:5000'

async function parseJson(res) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text || 'Lỗi không xác định.' }
  }
}

export async function listDoctorAppointments({ token }) {
  const res = await fetch(`${base}/api/appointments/doctor`, {
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
  const qs = new URLSearchParams({ code: String(code || '').trim() })
  const res = await fetch(`${base}/api/appointments/patient-by-code?${qs.toString()}`, {
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

  const res = await fetch(`${base}/api/appointments/patients?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được danh sách bệnh nhân.')
  }
  return data
}

export async function listPatientHistoryReception({ token, patientId }) {
  const qs = new URLSearchParams({ patientId: String(patientId || '').trim() })
  const res = await fetch(`${base}/api/appointments/patient-history?${qs.toString()}`, {
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

export async function lookupAppointmentByTicket({ token, ticket }) {
  const qs = new URLSearchParams({ ticket: String(ticket || '').trim() })
  const res = await fetch(`${base}/api/appointments/lookup-ticket?${qs.toString()}`, {
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
  const qs = new URLSearchParams({
    doctorId: String(doctorId || '').trim(),
    date: String(date || '').trim(),
  })
  const res = await fetch(`${base}/api/appointments/availability?${qs.toString()}`, {
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
  const qs = new URLSearchParams()
  if (from) qs.set('from', String(from).trim())
  if (to) qs.set('to', String(to).trim())
  if (status && status !== 'all') qs.set('status', String(status).trim())
  if (q) qs.set('q', String(q).trim())
  const res = await fetch(`${base}/api/appointments/reception?${qs.toString()}`, {
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

export async function updateAppointmentStatus({ token, appointmentId, status }) {
  const id = String(appointmentId || '').trim()
  const res = await fetch(`${base}/api/appointments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không cập nhật được trạng thái.')
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
  const res = await fetch(`${base}/api/appointments/reception`, {
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
