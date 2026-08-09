import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import DoctorHome from '@/modules/admin/pages/DoctorHome'

export default function DoctorPage() {
  return <AuthGuard allowedRoles={['doctor']}><DoctorHome /></AuthGuard>
}
