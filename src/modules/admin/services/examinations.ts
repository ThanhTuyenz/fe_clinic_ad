import { apiErrorMessage, apiRequest } from './apiBase'

/**
 * Lưu phiên khám vào collection `examination` (MongoDB).
 * @param {object} opts
 * @param {string} opts.token
 * @param {string} opts.appointmentId
 * @param {Record<string, unknown>} opts.payload — các trường form khám (symptoms, note, vitals, …)
 */
export async function saveExamination({ token, appointmentId, payload }) {
  try { return await apiRequest({ method: 'POST', url: '/examinations', data: {
      appointmentId: String(appointmentId || '').trim(),
      ...payload,
    } }) } catch (error) { throw new Error(apiErrorMessage(error, 'Không lưu được phiên khám.')) }
}

export async function getExaminationByAppointment({ token, appointmentId }) {
  try { return await apiRequest({ method: 'GET', url: '/examinations', params: { appointmentId: String(appointmentId || '').trim() } }) }
  catch (error) { throw new Error(apiErrorMessage(error, 'Không lấy được phiên khám.')) }
}
