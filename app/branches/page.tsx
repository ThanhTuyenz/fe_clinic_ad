import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { RolePortal } from '@/modules/portal'
export default function BranchesPage() { return <AuthGuard allowedRoles={['admin', 'branch_manager']}><RolePortal section="branches" /></AuthGuard> }

