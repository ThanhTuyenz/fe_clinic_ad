'use client'

import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  AppPermission,
  calculateEffectivePermissions,
} from '../constants/permissions.constant'

/**
 * Hook kiểm tra quyền hạn của nhân sự hiện tại theo mô hình RBAC VitaCare
 */
export function usePermission() {
  const auth = useAuth() as any
  const user = auth?.session?.user || auth?.user

  const role = String(user?.role || '').toLowerCase()
  const isSuperAdmin = role === 'admin'

  const permissions = useMemo(() => {
    if (!user) return []
    if (isSuperAdmin) {
      return Object.values(AppPermission).map((p) => String(p))
    }
    if (Array.isArray(user.effectivePermissions) && user.effectivePermissions.length > 0) {
      return user.effectivePermissions.map((p: any) => String(p))
    }
    return calculateEffectivePermissions(user.role, user.customPermissions)
  }, [user, isSuperAdmin])

  const hasPermission = (permission: AppPermission | string): boolean => {
    if (isSuperAdmin) return true
    return permissions.includes(String(permission))
  }

  const hasAnyPermission = (requiredPermissions: (AppPermission | string)[]): boolean => {
    if (isSuperAdmin) return true
    return requiredPermissions.some((p) => permissions.includes(String(p)))
  }

  const hasAllPermissions = (requiredPermissions: (AppPermission | string)[]): boolean => {
    if (isSuperAdmin) return true
    return requiredPermissions.every((p) => permissions.includes(String(p)))
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role,
    isSuperAdmin,
  }
}
