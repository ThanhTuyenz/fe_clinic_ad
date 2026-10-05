import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { DoctorPrescriptionsPage } from '@/modules/doctor'

export default function Page() {
  return <AuthGuard allowedRoles={['doctor']}><DoctorPrescriptionsPage /></AuthGuard>
}
