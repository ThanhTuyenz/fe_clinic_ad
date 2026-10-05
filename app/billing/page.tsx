import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function BillingPage() {
  return <AuthGuard allowedRoles={['admin', 'branch_manager', 'receptionist']}><RolePortal section="billing" /></AuthGuard>
}
