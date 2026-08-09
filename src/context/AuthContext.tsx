'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentStaff } from '../modules/admin/services/auth'
import {
  clearStaffSession,
  getStaffSession,
  saveStaffSession,
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

  const syncSession = useCallback(() => setSession(getStaffSession()), [])

  const logout = useCallback(() => {
    clearStaffSession()
    setSession({ token: null, user: null })
  }, [])

  const verifySession = useCallback(async () => {
    const stored = getStaffSession()
    if (!stored.token) {
      setSession({ token: null, user: null })
      return null
    }
    setSession(stored)
    try {
      const verifiedUser = await getCurrentStaff(stored.token)
      const user = verifiedUser?.id ? { ...stored.user, ...verifiedUser } : stored.user
      setSession({ token: stored.token, user })
      return user
    } catch {
      logout()
      return null
    }
  }, [logout])

  useEffect(() => {
    verifySession().finally(() => setIsInitializing(false))
    window.addEventListener('storage', syncSession)
    window.addEventListener('staff-session-changed', syncSession)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener('staff-session-changed', syncSession)
    }
  }, [syncSession, verifySession])

  const login = useCallback(({ token, user, remember = true }) => {
    const role = staffRole(user)
    if (!STAFF_ROLES.includes(role)) {
      throw new Error('Tài khoản này không có quyền truy cập cổng nhân viên.')
    }
    saveStaffSession({ token, user, remember })
    setSession({ token, user })
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
