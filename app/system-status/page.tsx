import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function SystemStatusPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <RolePortal section="system-status" />
    </AuthGuard>
  )
}
