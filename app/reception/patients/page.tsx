import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import ReceptionPatientsPage from '@/modules/admin/pages/ReceptionPatientsPage'

export default function ReceptionPatientsRoute() {
  return (
    <AuthGuard allowedRoles={['receptionist', 'registration']}>
      <ReceptionPatientsPage />
    </AuthGuard>
  )
}
