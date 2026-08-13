import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RolePortal from '@/modules/admin/pages/RolePortal'
export default function AppointmentsPage() { return <AuthGuard allowedRoles={['admin', 'branch_manager']}><RolePortal section="appointments" /></AuthGuard> }

