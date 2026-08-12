import { apiErrorMessage, apiRequest } from './apiBase'
const call = async (config, fallback) => { try { return await apiRequest(config) } catch (error) { throw new Error(apiErrorMessage(error, fallback)) } }
export const listPharmacyPrescriptions = ({ status, q }) => call({ method: 'GET', url: '/pharmacy/prescriptions', params: { status, q: q || undefined } }, 'Không tải được đơn thuốc nhà thuốc.')
export const dispensePrescription = (id) => call({ method: 'POST', url: `/pharmacy/prescriptions/${id}/dispense` }, 'Không cấp thuốc được.')
