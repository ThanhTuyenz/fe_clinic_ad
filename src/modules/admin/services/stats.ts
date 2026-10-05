import { apiErrorMessage, apiRequest } from './apiBase'

export async function fetchDashboardStats({
  token,
  branchId,
  timeFilter,
}: {
  token?: string
  branchId?: string
  timeFilter?: 'today' | 'week' | 'month'
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = {}
    if (branchId && branchId !== 'all') params.branchId = branchId
    if (timeFilter) params.timeFilter = timeFilter

    return await apiRequest({ method: 'GET', url: '/stats/dashboard', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được thống kê tổng quan.'))
  }
}

export async function fetchAnalyticsData({
  token,
  timeFilter = 'month',
  branchId,
  startDate,
  endDate,
}: {
  token?: string
  timeFilter?: 'today' | 'week' | 'month' | 'quarter'
  branchId?: string
  startDate?: string
  endDate?: string
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = { timeFilter }
    if (branchId && branchId !== 'all') params.branchId = branchId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    return await apiRequest({ method: 'GET', url: '/stats/analytics', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được dữ liệu phân tích thống kê.'))
  }
}

export async function fetchDemandInsights({
  token,
  timeFilter = '30days',
  branchId,
}: {
  token?: string
  timeFilter?: 'today' | '7days' | '30days'
  branchId?: string
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = { timeFilter }
    if (branchId && branchId !== 'all') params.branchId = branchId

    return await apiRequest({ method: 'GET', url: '/stats/demand-insights', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được dữ liệu phân tích nhu cầu khám bệnh.'))
  }
}

export async function fetchAiExecutiveReport({
  token,
  timeFilter = '30days',
  branchId,
  forceRefresh,
}: {
  token?: string
  timeFilter?: 'today' | '7days' | '30days' | string
  branchId?: string
  forceRefresh?: boolean
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = { timeFilter }
    if (branchId && branchId !== 'all') params.branchId = branchId
    if (forceRefresh) params.forceRefresh = true

    return await apiRequest({ method: 'GET', url: '/stats/ai-executive-report', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không tạo được Báo cáo Chiến lược AI.'))
  }
}


// ─────────────────────────────────────────────────────────────
// PHÂN HỆ TIẾP ĐÓN & THU NGÂN QUẦY (RECEPTION DESK)
// ─────────────────────────────────────────────────────────────

export async function fetchReceptionSummary({
  token,
  date,
  branchId,
}: {
  token?: string
  date?: string
  branchId?: string
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = {}
    if (date) params.date = date
    if (branchId && branchId !== 'all') params.branchId = branchId

    return await apiRequest({ method: 'GET', url: '/appointments/reception-summary', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không tải được báo cáo ca trực tiếp đón.'))
  }
}

export async function fetchReceptionRoomsStatus({
  token,
  date,
  branchId,
}: {
  token?: string
  date?: string
  branchId?: string
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = {}
    if (date) params.date = date
    if (branchId && branchId !== 'all') params.branchId = branchId

    return await apiRequest({ method: 'GET', url: '/clinic-rooms/rooms-status', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không tải được tình trạng tải phòng khám.'))
  }
}

export async function fetchReceptionUpcoming({
  token,
  date,
  branchId,
  limit = 5,
}: {
  token?: string
  date?: string
  branchId?: string
  limit?: number
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = { limit, from: date, to: date, status: 'confirmed' }
    if (branchId && branchId !== 'all') params.branchId = branchId

    return await apiRequest({ method: 'GET', url: '/appointments/reception', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không tải được danh sách ca khám sắp tới.'))
  }
}

// ─────────────────────────────────────────────────────────────
// PHÂN HỆ BÁC SĨ PHÒNG KHÁM (DOCTOR DESK)
// ─────────────────────────────────────────────────────────────

export async function fetchDoctorQueueSummary({
  token,
  date,
}: {
  token?: string
  date?: string
} = {}) {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const params: Record<string, any> = {}
    if (date) params.date = date

    return await apiRequest({ method: 'GET', url: '/doctors/queue-summary', headers, params })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không tải được tiến độ khám của Bác sĩ.'))
  }
}

