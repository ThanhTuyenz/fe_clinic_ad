'use client'

import { useCallback, useState } from 'react'
import { useNavigate } from './useNextNavigation'
import { useAuth } from './useAuth'

export function useStaffLogout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const performLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }, [isLoggingOut, logout, navigate])

  return { performLogout, isLoggingOut }
}
