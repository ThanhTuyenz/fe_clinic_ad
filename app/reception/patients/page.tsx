import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { ReceptionPatientsPage } from '@/modules/reception'

export default function ReceptionPatientsRoute() {
  return (
    <AuthGuard allowedRoles={['receptionist', 'registration']}>
      <ReceptionPatientsPage />
    </AuthGuard>
  )
}
