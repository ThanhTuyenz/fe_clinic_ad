import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '169.254.223.69',
    '169.254.223.69:3001',
    '192.168.1.37',
    '192.168.1.37:3001',
    'localhost:3001',
    '127.0.0.1:3001',
  ],
  // Đồng bộ cách build với fe_clinic_web; lint chạy riêng trong CI/editor.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
