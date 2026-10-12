import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function SystemLogsAppPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <RolePortal section="system-logs" />
    </AuthGuard>
  )
}
