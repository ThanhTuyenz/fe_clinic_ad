import type { AxiosRequestConfig } from 'axios'
import { apiClient, apiErrorMessage, unwrapApiData } from '../../../lib/api-client'

export { getApiBase } from '@/config/backend'

export { apiClient, apiErrorMessage, unwrapApiData }

/** Giữ kiểu lỗi phiên cho các màn hình đang xử lý đăng xuất riêng. */
export class AuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

export async function apiRequest<T = any>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request(config)
  return unwrapApiData<T>(response.data)
}
