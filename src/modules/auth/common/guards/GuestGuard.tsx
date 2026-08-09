'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../common/hooks/useAuth'

export default function GuestGuard({ children }) {
  const router = useRouter()
  const { isAuthenticated, isInitializing } = useAuth()
  useEffect(() => {
    if (!isInitializing && isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, isInitializing, router])
  if (isInitializing) return null
  return isAuthenticated ? null : children
}
