import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'
export default function Page(){return <AuthGuard allowedRoles={['admin','branch_manager']}><RolePortal section="booking-packages"/></AuthGuard>}
