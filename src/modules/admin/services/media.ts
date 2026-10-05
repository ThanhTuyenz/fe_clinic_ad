import { apiClient } from '@/lib/api-client'

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8011'
  const base = raw.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '')
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function uploadMediaFile(file: File): Promise<{ url: string; fullUrl?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiClient.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
