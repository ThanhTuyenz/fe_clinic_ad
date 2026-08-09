import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RolePortal from '@/modules/admin/pages/RolePortal'

export default function InventoryPage() {
  return <AuthGuard allowedRoles={['admin', 'branch_manager', 'pharmacist']}><RolePortal section="inventory" /></AuthGuard>
}
