'use client'

import { useNavigate } from '@/common/hooks/useNextNavigation'

import {
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  FileText,
  FlaskConical,
  FileSpreadsheet,
  DoorOpen,
  UserPlus,
  Users,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: CalendarCheck,
  exam: Stethoscope,
  history: FileText,
  laboratory: FlaskConical,
  prescription: FileSpreadsheet,
  reception: DoorOpen,
  registration: UserPlus,
  patients: Users,
}

export default function RoleSidebar({ role = 'doctor', active = 'dashboard', user, onLogout, hideTopBar = false }: any) {
  const navigate = useNavigate()
  const doctor = role === 'doctor'
  const links = doctor
    ? [
        ['exam', 'Khám bệnh', '/doctor'],
        ['calendar', 'Lịch khám', '/doctor?view=schedule'],
        ['history', 'Lịch sử bệnh nhân', '/doctor?view=history'],
        ['laboratory', 'Cận lâm sàng', '/clinical-orders'],
        ['prescription', 'Đơn thuốc', '/doctor/prescriptions'],
      ]
    : [
        ['dashboard', 'Tổng quan', '/dashboard'],
        ['reception', 'Tiếp nhận', '/reception'],
        ['patients', 'Bệnh nhân', '/reception/patients'],
        ['registration', 'Đăng ký bệnh nhân', '/registration'],
      ]

  const name = String(user?.fullName || user?.displayName || user?.email || (doctor ? 'Bác sĩ' : 'Nhân viên'))
  const avatar = name.split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase() || 'NV'
  const roleLabel = doctor ? 'Bác sĩ' : 'Lễ tân & Tiếp nhận'

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
              {doctor ? 'Bác sĩ' : 'Lễ tân & Tiếp nhận'}
            </p>
          </div>
        </div>

        {/* Phân hệ làm việc */}
        <div className="px-5 pt-3 pb-1">
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">
            {doctor ? 'PHÒNG KHÁM' : 'KHÔNG GIAN LÀM VIỆC'}
          </p>
          <p className="text-xs font-extrabold text-emerald-800">
            {doctor ? 'BÁC SĨ' : 'LỄ TÂN & TIẾP NHẬN'}
          </p>
        </div>

        {/* Danh sách menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {links.map(([id, label, href]) => {
            const IconComp = ICON_MAP[id] || LayoutDashboard
            return (
              <button
                key={id}
                type="button"
                className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-[13px] transition cursor-pointer ${
                  active === id
                    ? 'bg-emerald-50 font-bold text-emerald-800'
                    : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => navigate(href, id === 'registration' ? { state: { createNew: true } } : undefined)}
              >
                <IconComp className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </button>
            )
          })}
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
            <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}
