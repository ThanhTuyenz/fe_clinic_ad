'use client'

import { useNavigate } from '@/common/hooks/useNextNavigation'

const paths = {
  dashboard: 'M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z',
  calendar: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  patient: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
}

export default function RoleSidebar({ role = 'doctor', active = 'dashboard', user, onLogout }) {
  const navigate = useNavigate()
  const doctor = role === 'doctor'
  const pharmacist = role === 'pharmacist'
  const links = doctor
    ? [['exam', 'Khám bệnh', '/doctor'], ['calendar', 'Lịch khám', '/doctor?view=schedule'], ['history', 'Lịch sử bệnh nhân', '/doctor?view=history'], ['laboratory', 'Cận lâm sàng', '/clinical-orders'], ['prescription', 'Đơn thuốc', '/doctor/prescriptions']]
    : pharmacist ? [['pharmacy', 'Cấp thuốc', '/pharmacy'], ['inventory', 'Kho thuốc', '/inventory']]
    : [['dashboard', 'Tổng quan', '/dashboard'], ['reception', 'Tiếp nhận', '/reception'], ['registration', 'Đăng ký bệnh nhân', '/registration']]
  const name = String(user?.fullName || user?.displayName || user?.email || (doctor ? 'Bác sĩ' : 'Lễ tân'))
  const avatar = name.split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase()
  return <aside className="role-sidebar">
    <div className="role-sidebar-brand"><span className="role-sidebar-logo">M</span><div><b>MediLink Global</b><small>Healthcare System</small></div></div>
    <div className="role-sidebar-context"><small>{doctor ? 'PHÒNG KHÁM' : 'KHÔNG GIAN LÀM VIỆC'}</small><strong>{doctor ? 'BÁC SĨ' : pharmacist ? 'NHÀ THUỐC' : 'TIẾP NHẬN'}</strong></div>
    <nav>{links.map(([id,label,href])=><button key={id} className={active===id?'is-active':''} onClick={()=>navigate(href)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={id==='dashboard'?paths.dashboard:id==='registration'?paths.patient:paths.calendar}/></svg>{label}</button>)}</nav>
    <div className="role-sidebar-user"><span>{avatar}</span><div><b>{name}</b><small>{doctor ? 'Bác sĩ' : pharmacist ? 'Dược sĩ' : 'Nhân viên tiếp nhận'}</small></div></div>
    <button className="role-sidebar-logout" onClick={onLogout}>Đăng xuất</button>
  </aside>
}
