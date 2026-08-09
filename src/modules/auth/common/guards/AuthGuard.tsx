'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../../../common/hooks/useAuth'

export default function AuthGuard({ children, allowedRoles }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isInitializing, role } = useAuth()

  const wrongRole = Boolean(allowedRoles?.length && !allowedRoles.includes(role))

  useEffect(() => {
    if (isInitializing) return
    if (!isAuthenticated) {
      sessionStorage.setItem('medilink:navigation:/login', JSON.stringify({ from: pathname, message: 'Vui lòng đăng nhập để tiếp tục.' }))
      router.replace('/login')
    } else if (wrongRole) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isInitializing, pathname, router, wrongRole])

  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Đang xác thực phiên đăng nhập…
      </div>
    )
  }

  if (!isAuthenticated || wrongRole) return null
  return children
}
