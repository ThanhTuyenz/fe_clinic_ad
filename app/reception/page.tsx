import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import { ReceptionHome } from '@/modules/reception'

export default function ReceptionPage() {
  return <AuthGuard allowedRoles={['receptionist']}><ReceptionHome /></AuthGuard>
}
