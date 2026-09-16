'use client'

import { useNavigate } from '@/common/hooks/useNextNavigation'

const paths = {
  dashboard: 'M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z',
  calendar: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  patient: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
}

export default function RoleSidebar({ role = 'doctor', active = 'dashboard', user, onLogout, hideTopBar = false }) {
  const navigate = useNavigate()
  const doctor = role === 'doctor'
  const pharmacist = role === 'pharmacist'
  const links = doctor
    ? [
        ['exam', 'Khám bệnh', '/doctor'],
        ['calendar', 'Lịch khám', '/doctor?view=schedule'],
        ['history', 'Lịch sử bệnh nhân', '/doctor?view=history'],
        ['laboratory', 'Cận lâm sàng', '/clinical-orders'],
        ['prescription', 'Đơn thuốc', '/doctor/prescriptions'],
      ]
    : pharmacist
    ? [
        ['pharmacy', 'Cấp thuốc', '/pharmacy'],
        ['inventory', 'Kho thuốc', '/inventory'],
      ]
    : [
        ['dashboard', 'Tổng quan', '/dashboard'],
        ['reception', 'Tiếp nhận', '/reception'],
        ['registration', 'Đăng ký bệnh nhân', '/registration'],
      ]

  const name = String(user?.fullName || user?.displayName || user?.email || (doctor ? 'Bác sĩ' : 'Nhân viên'))
  const avatar = name.split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase() || 'NV'
  const roleLabel = doctor ? 'Bác sĩ' : pharmacist ? 'Dược sĩ' : 'Lễ tân & Tiếp nhận'

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-slate-200 bg-white transition-transform">
        {/* Logo thương hiệu */}
        <div
          className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          <img
            src="/imgs/logo/logo2.png"
            alt="VitaCare Clinic"
            className="h-12 w-12 object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <b className="text-sm font-extrabold text-emerald-800 tracking-tight block truncate">
              VitaCare Clinic
            </b>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              {doctor ? 'Bác sĩ' : pharmacist ? 'Nhà thuốc' : 'Lễ tân & Tiếp nhận'}
            </p>
          </div>
        </div>

        {/* Phân hệ làm việc */}
        <div className="px-5 pt-3 pb-1">
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">
            {doctor ? 'PHÒNG KHÁM' : 'KHÔNG GIAN LÀM VIỆC'}
          </p>
          <p className="text-xs font-extrabold text-emerald-800">
            {doctor ? 'BÁC SĨ' : pharmacist ? 'NHÀ THUỐC' : 'LỄ TÂN & TIẾP NHẬN'}
          </p>
        </div>

        {/* Danh sách menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {links.map(([id, label, href]) => (
            <button
              key={id}
              type="button"
              className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-[13px] transition cursor-pointer ${
                active === id
                  ? 'bg-emerald-50 font-bold text-emerald-800'
                  : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => navigate(href)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 shrink-0">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={id === 'dashboard' ? paths.dashboard : id === 'registration' ? paths.patient : paths.calendar}
                />
              </svg>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Góc menu dưới bên trái: Thông tin phòng khám/nhân viên & nút Đăng xuất */}
        <div className="border-t border-slate-100 p-3 bg-white space-y-2">
          <div className="flex items-center gap-3 rounded bg-slate-50 p-2.5 border border-slate-200/80">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 shrink-0">
              {avatar}
            </span>
            <div className="min-w-0 flex-1">
              <b className="text-xs font-bold text-slate-800 truncate block" title={name}>
                {name}
              </b>
              <p className="text-[11px] font-semibold text-emerald-700 truncate">
                Phòng khám Đa khoa VitaCare
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Cơ sở chính · TP. Hồ Chí Minh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-colors cursor-pointer shadow-2xs"
            title="Đăng xuất khỏi hệ thống"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}
