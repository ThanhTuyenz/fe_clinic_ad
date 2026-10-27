export const API_BASE_PATH = '/api/v1'
export const MEDIA_PATHS = ['/uploads', '/imageapi'] as const

const publicBackendUrl = process.env.NEXT_PUBLIC_API_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || 'http://localhost:8011'

function getOrigin(url: string): string {
  const parsed = new URL(url.trim())
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
    throw new Error('Backend URL must use HTTP(S) or WS(S)')
  }
  return parsed.origin
}

export function getBackendOrigin(url = publicBackendUrl): string {
  return getOrigin(url)
}

export function getApiBase(): string {
  return API_BASE_PATH
}

export function getSocketBaseUrl(url = process.env.NEXT_PUBLIC_WS_URL || publicBackendUrl): string {
  return getOrigin(url)
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''
  if (/^(data:|blob:|\/\/)/.test(url)) return url
  if (/^https?:\/\//.test(url)) {
    const parsed = new URL(url)
    if (parsed.origin === getBackendOrigin()
      && MEDIA_PATHS.some(path => parsed.pathname.startsWith(`${path}/`))) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    return url
  }
  return url.startsWith('/') ? url : `/${url}`
}
