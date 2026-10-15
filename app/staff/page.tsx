import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'

export default function StaffPage() {
  return <AuthGuard allowedRoles={['admin', 'chain_manager', 'branch_manager']}><RolePortal section="staff" /></AuthGuard>
}
