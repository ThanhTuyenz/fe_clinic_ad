'use client'

import { useAuth } from '@/common/hooks/useAuth'
import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import Dashboard from '@/modules/admin/pages/Dashboard'
import RolePortal from '@/modules/admin/pages/RolePortal'

function DashboardByRole() {
  const { role } = useAuth()
  return ['admin', 'branch_manager', 'pharmacist', 'cashier'].includes(role)
    ? <RolePortal />
    : <Dashboard />
}

export default function DashboardPage() {
  return <AuthGuard><DashboardByRole /></AuthGuard>
}
