import { apiFetch, getApiBase, parseJsonResponse } from './apiBase'

async function parseJson(res) {
  return parseJsonResponse(res)
}

/** Ghi nhận đã thu phí khám (150k mặc định). method: 'cash' | 'transfer' */
export async function recordAppointmentPayment({ token, appointmentId, method, amount, note }) {
  const base = getApiBase()
  const id = String(appointmentId || '').trim()
  const body = { method }
  if (amount != null) body.amount = amount
  if (note != null) body.note = String(note || '')
  const res = await apiFetch(`${base}/appointments/${encodeURIComponent(id)}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data.message || 'Không ghi nhận được thanh toán.')
  }
  return data
}
