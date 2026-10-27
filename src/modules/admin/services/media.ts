import { apiClient } from '@/lib/api-client'

export { resolveMediaUrl } from '@/config/backend'

export async function uploadMediaFile(file: File): Promise<{ url: string; fullUrl?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiClient.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
