import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { ClinicalQueuePage } from '@/modules/doctor'
export default function Page() { return <AuthGuard allowedRoles={['chain_manager','branch_manager','receptionist','doctor']}><ClinicalQueuePage /></AuthGuard> }
