import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '169.254.223.69',
    '192.168.1.37',
    'localhost',
    '127.0.0.1',
  ],
}

export default nextConfig
