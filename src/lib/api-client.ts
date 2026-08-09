import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

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
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

/** Adapter tương thích các service cũ; request vẫn được Axios gửi bằng cookie httpOnly. */
export async function apiFetch(url: string, init: Record<string, any> = {}) {
  const rawHeaders = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : { ...(init.headers || {}) }
  delete rawHeaders.Authorization
  const config: AxiosRequestConfig = { url, method: init.method || 'GET', headers: rawHeaders, data: init.body }
  try {
    const response = await apiClient.request(config)
    return toFetchLike(response)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) return toFetchLike(error.response)
    throw error
  }
}

function toFetchLike(response: any) {
  const payload = response.data?.success === true && 'data' in response.data ? response.data.data : response.data
  return { ok: response.status >= 200 && response.status < 300, status: response.status, async text() { return typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}) } }
}
