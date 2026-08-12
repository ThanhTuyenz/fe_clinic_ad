import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import DoctorPrescriptionsPage from '@/modules/admin/pages/DoctorPrescriptionsPage'

export default function Page() {
  return <AuthGuard allowedRoles={['doctor']}><DoctorPrescriptionsPage /></AuthGuard>
}
