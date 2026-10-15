import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function IntegrationsPage() {
  return <AuthGuard allowedRoles={['admin']}><RolePortal section="integrations" /></AuthGuard>
}
