import axios, { type AxiosRequestConfig } from 'axios'
import { clearStaffSession, getStaffSession } from '@/modules/admin/utils/staffSession'

export function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  const configured = (raw && String(raw).trim().replace(/\/+$/, '')) || 'http://localhost:8011'
  if (/\/api\/v\d+$/i.test(configured)) return configured
  if (/\/api$/i.test(configured)) return `${configured}/v1`
  return `${configured}/api/v1`
}

export const apiClient = axios.create({
  baseURL: resolveApiBase(),
  withCredentials: true,
  validateStatus: () => true,
})

apiClient.interceptors.request.use((config) => {
  const token = getStaffSession().token
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use((response) => {
  if (response.status === 401) clearStaffSession()
  return response
})

/** Adapter tạm tương thích chữ ký Fetch để không làm đổi logic các service cũ. */
export async function apiFetch(url: string, init: Record<string, any> = {}) {
  const config: AxiosRequestConfig = {
    url,
    method: init.method || 'GET',
    headers: init.headers,
    data: init.body,
  }
  const response = await apiClient.request(config)
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    async text() {
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data ?? {})
    },
  }
}
