'use client'

import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function AnalyticsPage() {
  return (
    <AuthGuard allowedRoles={['chain_manager', 'branch_manager']}>
      <RolePortal section="analytics" />
    </AuthGuard>
  )
}
