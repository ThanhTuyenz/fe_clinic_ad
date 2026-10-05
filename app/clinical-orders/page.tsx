import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { ClinicalQueuePage } from '@/modules/doctor'
export default function Page() { return <AuthGuard allowedRoles={['admin','branch_manager','receptionist','doctor']}><ClinicalQueuePage /></AuthGuard> }
