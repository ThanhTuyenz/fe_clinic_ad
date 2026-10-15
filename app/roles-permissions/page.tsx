import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function RolesPermissionsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <RolePortal section="roles" />
    </AuthGuard>
  )
}

