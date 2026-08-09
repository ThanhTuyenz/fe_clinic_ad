import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import RegistrationHome from '@/modules/admin/pages/RegistrationHome'

export default function RegistrationPage() {
  return <AuthGuard allowedRoles={['receptionist', 'registration']}><RegistrationHome /></AuthGuard>
}
