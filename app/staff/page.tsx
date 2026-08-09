import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RolePortal from '@/modules/admin/pages/RolePortal'

export default function StaffPage() {
  return <AuthGuard allowedRoles={['admin']}><RolePortal section="staff" /></AuthGuard>
}
