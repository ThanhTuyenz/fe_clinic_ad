import { apiErrorMessage, apiRequest } from './apiBase'

/** Ghi nhận đã thu phí khám (150k mặc định). method: 'cash' | 'transfer' */
export async function recordAppointmentPayment({ token, appointmentId, method, amount, note }) {
  const id = String(appointmentId || '').trim()
  const body = { method }
  if (amount != null) body.amount = amount
  if (note != null) body.note = String(note || '')
  try { return await apiRequest({ method: 'POST', url: `/appointments/${encodeURIComponent(id)}/payment`, data: body }) }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không ghi nhận được thanh toán.')) }
}
