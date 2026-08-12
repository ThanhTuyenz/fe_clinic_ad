import { apiErrorMessage, apiRequest } from './apiBase'
const call = async (config, fallback) => { try { return await apiRequest(config) } catch (error) { throw new Error(apiErrorMessage(error, fallback)) } }
export const listClinicalRooms = () => call({ method: 'GET', url: '/clinical-queue/rooms' }, 'Không lấy được danh sách phòng.')
export const receiveClinicalQr = ({ qrPayload }) => call({ method: 'POST', url: '/clinical-queue/receive', data: { qrPayload } }, 'Không tiếp nhận được phiếu chỉ định.')
export const listClinicalQueue = ({ roomId, date, status = 'waiting' }) => call({ method: 'GET', url: '/clinical-queue', params: { roomId, date, status } }, 'Không tải được hàng đợi.')
export const completeClinicalOrderMock = (orderId) => call({ method: 'POST', url: `/clinical-queue/orders/${orderId}/mock-result` }, 'Không tạo được kết quả mô phỏng.')
