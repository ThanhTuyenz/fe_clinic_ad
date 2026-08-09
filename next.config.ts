import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Đồng bộ cách build với fe_clinic_web; lint chạy riêng trong CI/editor.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
