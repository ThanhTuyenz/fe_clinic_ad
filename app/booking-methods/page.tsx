import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'
export default function Page(){return <AuthGuard allowedRoles={['chain_manager']}><RolePortal section="booking-methods"/></AuthGuard>}
