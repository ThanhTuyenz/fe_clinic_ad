import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RolePortal from '@/modules/admin/pages/RolePortal'
export default function RolesPermissionsPage() { return <AuthGuard allowedRoles={['branch_manager']}><RolePortal section="roles" /></AuthGuard> }
