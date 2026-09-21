'use client'

import { useAuth } from '@/common/hooks/useAuth'
import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { Dashboard } from '@/modules/analytics'
import { RolePortal } from '@/modules/portal'

function DashboardByRole() {
  const { role } = useAuth()
  return ['admin', 'branch_manager'].includes(role)
    ? <RolePortal />
    : <Dashboard />
}

export default function DashboardPage() {
  return <AuthGuard><DashboardByRole /></AuthGuard>
}
