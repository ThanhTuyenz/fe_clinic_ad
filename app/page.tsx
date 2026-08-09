'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/common/hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isInitializing } = useAuth()
  useEffect(() => {
    if (!isInitializing) router.replace(isAuthenticated ? '/dashboard' : '/login')
  }, [isAuthenticated, isInitializing, router])
  return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Đang chuyển hướng…</div>
}
