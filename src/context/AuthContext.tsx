'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../lib/api-client'
import { getCurrentStaff } from '../modules/admin/services/auth'
import {
  clearStaffSession,
  getStaffSession,
  saveStaffSession,
  setRuntimeStaffSession,
  staffRole,
} from '../modules/admin/utils/staffSession'

export const AuthContext = createContext(null)

const STAFF_ROLES = [
  'admin',
  'branch_manager',
  'doctor',
  'receptionist',
  'registration',
  'pharmacist',
  'cashier',
]

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ token: null, user: null })
  const [isInitializing, setIsInitializing] = useState(true)
  const syncRuntimeSession = useCallback(() => setSession(getStaffSession()), [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {})
    } catch {
      // UI vẫn phải đóng phiên nếu cookie phía server đã hết hạn.
    } finally {
      clearStaffSession()
      setSession({ token: null, user: null })
    }
  }, [])

  const verifySession = useCallback(async () => {
    try {
      const verifiedUser = await getCurrentStaff()
      const user = verifiedUser
      setRuntimeStaffSession(user)
      setSession({ token: 'cookie-session', user })
      return user
    } catch {
      clearStaffSession()
      setSession({ token: null, user: null })
      return null
    }
  }, [])

  useEffect(() => {
    verifySession().finally(() => setIsInitializing(false))
    window.addEventListener('staff-session-changed', syncRuntimeSession)
    return () => window.removeEventListener('staff-session-changed', syncRuntimeSession)
  }, [syncRuntimeSession, verifySession])

  const login = useCallback(({ user }) => {
    const role = staffRole(user)
    if (!STAFF_ROLES.includes(role)) {
      throw new Error('Tài khoản này không có quyền truy cập cổng nhân viên.')
    }
    saveStaffSession({ user })
    setSession({ token: 'cookie-session', user })
  }, [])

  const hasRole = useCallback(
    (...roles) => roles.map((role) => String(role).toLowerCase()).includes(staffRole(session.user)),
    [session.user],
  )

  const value = useMemo(
    () => ({
      token: session.token,
      user: session.user,
      role: staffRole(session.user),
      isAuthenticated: Boolean(session.token && session.user),
      isInitializing,
      login,
      logout,
      hasRole,
      verifySession,
    }),
    [hasRole, isInitializing, login, logout, session, verifySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
