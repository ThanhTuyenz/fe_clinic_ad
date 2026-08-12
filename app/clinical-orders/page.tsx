import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import ClinicalQueuePage from '@/modules/admin/pages/ClinicalQueuePage'
export default function Page() { return <AuthGuard allowedRoles={['admin','branch_manager','receptionist','doctor']}><ClinicalQueuePage /></AuthGuard> }
