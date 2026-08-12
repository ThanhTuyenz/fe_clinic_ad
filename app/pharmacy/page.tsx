import AuthGuard from '@/modules/auth/common/guards/AuthGuard'
import PharmacyPage from '@/modules/admin/pages/PharmacyPage'
export default function Page(){return <AuthGuard allowedRoles={['pharmacist','admin','branch_manager']}><PharmacyPage/></AuthGuard>}
