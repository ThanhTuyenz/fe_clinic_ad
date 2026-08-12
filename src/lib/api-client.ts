import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const configured = (raw && String(raw).trim().replace(/\/+$/, '')) || 'http://localhost:8011'
  if (/\/api\/v\d+$/i.test(configured)) return configured
  if (/\/api$/i.test(configured)) return `${configured}/v1`
  return `${configured}/api/v1`
}

export const apiClient = axios.create({
  baseURL: resolveApiBase(),
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean }
let refreshPromise: Promise<void> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined
    const isRefresh = request?.url?.includes('/auth/refresh')
    if (error.response?.status === 401 && request && !request._retry && !isRefresh) {
      request._retry = true
      try {
        refreshPromise ??= apiClient.post('/auth/refresh', {}).then(() => undefined).finally(() => { refreshPromise = null })
        await refreshPromise
        return apiClient(request)
      } catch (refreshError) {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth-session-expired'))
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export function unwrapApiData<T = any>(payload: any): T {
  return payload?.success === true && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data as T
    : payload as T
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as any
    return String(payload?.message || payload?.data?.message || error.message || fallback)
  }
  return error instanceof Error ? error.message : fallback
}
