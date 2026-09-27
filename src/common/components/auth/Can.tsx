'use client'

import React from 'react'
import { AppPermission } from '@/common/constants/permissions.constant'
import { usePermission } from '@/common/hooks/usePermission'

export interface CanProps {
  permission?: AppPermission | string
  anyPermissions?: (AppPermission | string)[]
  allPermissions?: (AppPermission | string)[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Component kiểm soát hiển thị dựa trên phân quyền RBAC:
 * Tự động ẩn hoặc hiển thị fallback nếu người dùng không đủ quyền hạn.
 * 
 * Ví dụ sử dụng:
 * <Can permission={AppPermission.APPOINTMENT_CANCEL}>
 *   <AdminButton variant="danger">Hủy lịch</AdminButton>
 * </Can>
 */
export function Can({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return <>{fallback}</>
  }

  if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
