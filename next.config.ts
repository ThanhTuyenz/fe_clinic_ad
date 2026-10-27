import type { NextConfig } from 'next'
import { API_BASE_PATH, MEDIA_PATHS, getBackendOrigin } from './src/config/backend'

// Server-side upstream. Keep browser requests on the admin origin, including
// when an existing Vercel NEXT_PUBLIC_API_URL still points to an HTTP backend.
const backendOrigin = getBackendOrigin(process.env.BACKEND_API_URL || undefined)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '169.254.223.69',
    '192.168.1.37',
    'localhost',
    '127.0.0.1',
  ],
  async rewrites() {
    return [API_BASE_PATH, ...MEDIA_PATHS].map(path => ({
      source: `${path}/:path*`, destination: `${backendOrigin}${path}/:path*`,
    }))
  },
  async headers() {
    return [{ source: `${API_BASE_PATH}/:path*`, headers: [{ key: 'Cache-Control', value: 'no-store' }] }]
  },
}

export default nextConfig
