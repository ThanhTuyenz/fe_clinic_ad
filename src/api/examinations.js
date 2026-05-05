import { getApiBase, parseJsonResponse } from './apiBase.js'

/**
 * Lưu phiên khám vào collection `examination` (MongoDB).
 * @param {object} opts
 * @param {string} opts.token
 * @param {string} opts.appointmentId
 * @param {Record<string, unknown>} opts.payload — các trường form khám (symptoms, note, vitals, …)
 */
export async function saveExamination({ token, appointmentId, payload }) {
  const base = getApiBase()
  const res = await fetch(`${base}/api/examinations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      appointmentId: String(appointmentId || '').trim(),
      ...payload,
    }),
  })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lưu được phiên khám.')
  }
  return data
}

export async function getExaminationByAppointment({ token, appointmentId }) {
  const base = getApiBase()
  const qs = new URLSearchParams({ appointmentId: String(appointmentId || '').trim() })
  const res = await fetch(`${base}/api/examinations?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không lấy được phiên khám.')
  }
  return data
}
