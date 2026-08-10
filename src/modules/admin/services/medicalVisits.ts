import { apiErrorMessage, apiRequest } from './apiBase'

/**
 * Lưu hồ sơ của một lần khám vào PostgreSQL.
 * @param {object} opts
 * @param {string} opts.token
 * @param {string} opts.appointmentId
 * @param {Record<string, unknown>} opts.payload — các trường form khám (symptoms, note, vitals, …)
 */
export async function saveMedicalVisit({ token, appointmentId, payload }) {
  try { return await apiRequest({ method: 'POST', url: '/medical-visits', data: {
      appointmentId: String(appointmentId || '').trim(),
      ...payload,
    } }) } catch (error) { throw new Error(apiErrorMessage(error, 'Không lưu được phiên khám.')) }
}

export async function getMedicalVisitByAppointment({ token, appointmentId }) {
  try { return await apiRequest({ method: 'GET', url: '/medical-visits', params: { appointmentId: String(appointmentId || '').trim() } }) }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không lấy được phiên khám.')) }
}
