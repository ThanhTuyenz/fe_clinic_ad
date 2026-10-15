'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/common/hooks/useAuth'
import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { Dashboard } from '@/modules/analytics'
import { RolePortal } from '@/modules/portal'

function DashboardByRole() {
  const { role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (role === 'doctor') {
      router.replace('/doctor')
    }
  }, [role, router])

  if (role === 'doctor') return null

  return ['admin', 'chain_manager', 'branch_manager'].includes(role)
    ? <RolePortal />
    : <Dashboard />
}

export default function DashboardPage() {
  return <AuthGuard><DashboardByRole /></AuthGuard>
}
