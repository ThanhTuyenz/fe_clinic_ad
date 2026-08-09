import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RolePortal from '@/modules/admin/pages/RolePortal'
export default function SpecialtiesServicesPage() { return <AuthGuard allowedRoles={['branch_manager']}><RolePortal section="specialties" /></AuthGuard> }
