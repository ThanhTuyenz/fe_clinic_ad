import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import ReceptionHome from '@/modules/admin/pages/ReceptionHome'

export default function ReceptionPage() {
  return <AuthGuard allowedRoles={['receptionist']}><ReceptionHome /></AuthGuard>
}
