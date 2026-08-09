import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RolePortal from '@/modules/admin/pages/RolePortal'
export default function PatientsPage() { return <AuthGuard allowedRoles={['admin','branch_manager']}><RolePortal section="patients" /></AuthGuard> }
