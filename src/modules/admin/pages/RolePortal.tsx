'use client'

import { useEffect, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useAuth } from '@/common/hooks/useAuth'
import { fetchDashboardStats } from '../services/stats'
import StaffCrudPage from './StaffCrudPage'
import ClinicStaffPage from './ClinicStaffPage'
import SystemCatalogCrudPage from './SystemCatalogCrudPage'
import BookingMethodsPage from './BookingMethodsPage'
import BookingPackagesPage from './BookingPackagesPage'
import DoctorWorkSchedulesPage from './DoctorWorkSchedulesPage'
import BillingPage from './BillingPage'
import { staffRole } from '../utils/staffSession'

const ROLE_LABELS = { admin: 'Quản trị viên', branch_manager: 'Quản lý chi nhánh', pharmacist: 'Dược sĩ', cashier: 'Thu ngân' }
const NAV = {
  admin: [
    ['dashboard', 'Tổng quan', '/dashboard'],
    ['doctors', 'Nhân sự phòng khám', '/doctors'],
    ['staff', 'Tài khoản & phân quyền', '/staff'],
    ['patients', 'Bệnh nhân', '/patients'],
    ['roles', 'Vai trò & Phân quyền', '/roles-permissions'],
    ['slots', 'Lịch làm việc & Slot', '/work-schedules'],
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
    ['branches', 'Chi nhánh phòng khám', '/branches'],
    ['specialties', 'Chuyên khoa', '/specialties'],
    ['services', 'Dịch vụ & Xét nghiệm', '/services'],
    ['booking-methods', 'Quản lý hình thức đặt khám', '/booking-methods'],
    ['booking-packages', 'Quản lý gói khám', '/booking-packages'],
    ['inventory', 'Kho thuốc', '/inventory'],
    ['billing', 'Thanh toán', '/billing'],
  ],
  branch_manager: [
    ['dashboard', 'Thống kê & Tổng quan', '/dashboard'],
    ['doctors', '👥 Nhân sự phòng khám', '/doctors'],
    ['patients', '   Bệnh nhân', '/patients'],
    ['roles', '   Vai trò & Phân quyền', '/roles-permissions'],
    ['slots', '📅 Lịch làm việc & Slot', '/work-schedules'],
    ['appointments', '   Danh sách lịch hẹn', '/appointments'],
    ['branches', '🏥 Chi nhánh phòng khám', '/branches'],
    ['specialties', '   Chuyên khoa', '/specialties'],
    ['services', '   Dịch vụ khám & xét nghiệm', '/services'],
    ['inventory', '   Thuốc & Vật tư', '/inventory'],
  ],
  pharmacist: [['pharmacy', 'Cấp thuốc', '/pharmacy'], ['inventory', 'Kho thuốc', '/inventory']],
  cashier: [['dashboard', 'Tổng quan', '/dashboard'], ['billing', 'Thu tiền', '/billing'], ['schedule', 'Giao dịch', '/schedule']],
}

const PATHS = {
  dashboard: 'M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z',
  staff: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-3h5m-2.5-2.5v5',
  patients: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  appointments: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  schedule: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  inventory: 'm4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10',
  billing: 'M4 5h16v14H4V5Zm0 4h16M8 15h3',
}

function Icon({ name, className = 'h-[18px] w-[18px]' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={PATHS[name] || PATHS.dashboard}/></svg>
}

function initials(user) {
  const name = String(user?.fullName || user?.displayName || user?.email || 'AD')
  return name.split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase()
}

function Kpi({ label, value, detail, tone = 'emerald', icon = 'appointments' }) {
  const tones = { emerald:'bg-emerald-50 text-emerald-700', blue:'bg-blue-50 text-blue-700', amber:'bg-amber-50 text-amber-700', rose:'bg-rose-50 text-rose-700' }
  return <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
    <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900">{value}</p></div><span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}><Icon name={icon}/></span></div>
    <p className="mt-2 text-[11px] text-slate-400">{detail}</p>
  </article>
}

function AdminDashboard({ stats, loading }: any) {
  const today = stats?.today || stats?.data?.today || {}
  const checkedInCount = today.confirmed ?? ((today.checkedIn || 0) + (today.inExamination || 0))
  const values = [
    today.total ?? stats?.totalAppointments ?? 0,
    checkedInCount,
    today.examined ?? today.completed ?? 0,
    today.pending ?? 0,
  ]
  const todayRows = stats?.todayRows || stats?.data?.todayRows || []

  return (
    <>
      <PageTitle eyebrow="Tổng quan hệ thống" title="Xin chào, Quản trị viên" subtitle="Theo dõi hoạt động toàn hệ thống trong hôm nay." />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Tổng lịch hẹn" value={loading ? '—' : values[0]} detail="Tất cả chi nhánh" />
        <Kpi label="Đã check-in" value={loading ? '—' : values[1]} detail="Bệnh nhân đang phục vụ" tone="blue" icon="patients" />
        <Kpi label="Đã hoàn thành" value={loading ? '—' : values[2]} detail="Cập nhật theo thời gian thực" icon="staff" />
        <Kpi label="Cần xử lý" value={loading ? '—' : values[3]} detail="Lịch đang chờ xác nhận" tone="rose" icon="billing" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
        <Card title="Lưu lượng khám toàn hệ thống" action="7 ngày gần nhất">
          <div className="flex h-52 items-end gap-3 px-2 pt-8">
            {[42, 58, 47, 72, 61, 84, 70].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative h-36 w-full rounded-t bg-emerald-50">
                  <div className="absolute inset-x-0 bottom-0 rounded-t bg-emerald-600" style={{ height: `${v}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">T{i + 2}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Tình trạng hệ thống">
          <div className="space-y-4 py-1">
            {[
              ['Máy chủ API', 'Hoạt động'],
              ['Cơ sở dữ liệu', 'Ổn định'],
              ['Cổng thanh toán', 'Kết nối'],
              ['Dịch vụ thông báo', 'Hoạt động'],
            ].map(([a, b]) => (
              <div key={a} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                <span className="text-slate-600">{a}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {b}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-5">
        <ActivityTable title="Hoạt động gần đây" items={todayRows} />
      </div>
    </>
  )
}

function PageTitle({ eyebrow, title, subtitle, children }: any) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function Card({ title, action, children }: any) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {action && <span className="text-xs text-slate-400">{action}</span>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ActivityTable({ title = 'Lịch hẹn hôm nay', items = [] }: { title?: string; items?: any[] }) {
  const rows = items.length
    ? items.map((it: any) => [
        it.startTime || '08:00',
        it.patientProfile?.fullName || 'Bệnh nhân',
        it.doctor?.fullName ? `BS. ${it.doctor.fullName}` : 'Khám tổng quát',
        it.status === 'CHECKED_IN' ? 'Đã check-in' : it.status === 'COMPLETED' ? 'Đã khám' : 'Chờ xử lý',
      ])
    : [
        ['08:30', 'Nguyễn Minh Anh', 'Khám Nội tổng quát', 'Đã check-in'],
        ['09:15', 'Trần Hoàng Nam', 'Khám Tim mạch', 'Đang chờ'],
        ['10:00', 'Lê Thu Hà', 'Tái khám', 'Đã xác nhận'],
        ['10:30', 'Phạm Quốc Bảo', 'Khám Da liễu', 'Chờ xác nhận'],
      ]

  return (
    <Card title={title} action="Xem tất cả →">
      <div className="-m-5 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-[#f8faf9] text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {['Thời gian', 'Bệnh nhân', 'Dịch vụ / Bác sĩ', 'Trạng thái'].map((x) => (
                <th key={x} className="px-5 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 py-3 font-semibold text-slate-700">{r[0]}</td>
                <td className="px-5 py-3 font-medium text-slate-900">{r[1]}</td>
                <td className="px-5 py-3 text-slate-500">{r[2]}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      r[3] === 'Đã check-in'
                        ? 'bg-emerald-50 text-emerald-700'
                        : r[3] === 'Chờ xử lý'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {r[3]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ManagerDashboard({ stats, loading }) {
  const t=stats?.today||stats?.data?.today||{}
  return <><PageTitle eyebrow="Chi nhánh Quận 1" title="Tổng quan chi nhánh" subtitle="Hoạt động vận hành và lịch khám hôm nay"><button className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600">09 tháng 08, 2026</button></PageTitle><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Lịch hẹn hôm nay" value={loading?'—':t.total??0} detail="+8% so với hôm qua"/><Kpi label="Bác sĩ làm việc" value="12" detail="4 chuyên khoa" tone="blue" icon="staff"/><Kpi label="Đang chờ khám" value={loading?'—':t.checkedIn??0} detail="Thời gian chờ TB 12 phút" tone="amber" icon="patients"/><Kpi label="Hoàn thành" value={loading?'—':t.completed??0} detail="Tỷ lệ đúng giờ 92%" icon="appointments"/></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]"><ActivityTable/><Card title="Phân bổ lịch khám"><div className="mx-auto grid h-36 w-36 place-items-center rounded-full" style={{background:'conic-gradient(#047857 0 46%, #60a5fa 46% 73%, #f59e0b 73% 90%, #e2e8f0 90%)'}}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><div><b className="text-2xl text-slate-900">{t.total??0}</b><p className="text-[10px] text-slate-400">lịch hẹn</p></div></div></div><div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-500"><span>● Nội tổng quát</span><span className="text-blue-600">● Tim mạch</span><span className="text-amber-500">● Da liễu</span><span className="text-slate-400">● Khác</span></div></Card></div></>
}

function SchedulePage() {
 const days=['Thứ 2\n10/08','Thứ 3\n11/08','Thứ 4\n12/08','Thứ 5\n13/08','Thứ 6\n14/08','Thứ 7\n15/08']; const shifts=[['BS. Nguyễn Văn An','Nội tổng quát'],['BS. Trần Thu Hà','Tim mạch'],['BS. Lê Minh Đức','Da liễu']]
 return <><PageTitle eyebrow="Quản lý nhân sự" title="Lịch bác sĩ" subtitle="Theo dõi và điều phối ca làm việc tại chi nhánh."><button className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">+ Xếp lịch</button></PageTitle><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center gap-2"><button className="rounded border border-slate-200 px-2.5 py-1.5">‹</button><b className="px-2 text-sm">10 – 15 tháng 08, 2026</b><button className="rounded border border-slate-200 px-2.5 py-1.5">›</button></div><div className="flex gap-2"><select className="rounded border border-slate-200 px-3 py-2 text-xs"><option>Tất cả chuyên khoa</option></select><button className="rounded bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Tuần</button></div></div><section className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white"><div className="grid min-w-[900px] grid-cols-[180px_repeat(6,1fr)]"><div className="border-b border-r border-slate-100 p-3 text-xs font-bold text-slate-400">BÁC SĨ</div>{days.map(d=><div key={d} className="whitespace-pre-line border-b border-r border-slate-100 p-3 text-center text-xs font-semibold text-slate-600">{d}</div>)}{shifts.flatMap((s,r)=>[<div key={`${r}-d`} className="border-b border-r border-slate-100 p-4"><b className="text-xs text-slate-800">{s[0]}</b><p className="mt-1 text-[10px] text-slate-400">{s[1]}</p></div>,...days.map((_,c)=><div key={`${r}-${c}`} className="min-h-24 border-b border-r border-slate-100 p-2">{!(r===1&&c===3)&&<div className={`rounded-md border-l-2 p-2 text-[10px] ${c%3===1?'border-blue-500 bg-blue-50 text-blue-700':'border-emerald-500 bg-emerald-50 text-emerald-700'}`}><b>{c%2?'13:00 – 17:00':'08:00 – 12:00'}</b><p className="mt-1 opacity-70">Phòng {r+1}0{c%3+1}</p></div>}</div>)])}</div></section></>
}

function GenericPage({ section, role }) { const title={inventory:'Danh mục Thuốc & Vật tư',billing:'Thanh toán & Đối soát',doctors:'Nhân sự phòng khám',pharmacists:'Quản lý dược sĩ',patients:'Quản lý bệnh nhân',roles:'Vai trò & Phân quyền',appointments:'Danh sách lịch hẹn',branches:'Chi nhánh phòng khám',specialties:'Quản lý chuyên khoa',services:'Dịch vụ khám & xét nghiệm',slots:'Lịch làm việc & Slot'}[section]||ROLE_LABELS[role]; return <><PageTitle eyebrow={ROLE_LABELS[role]||'Hệ thống'} title={title} subtitle="Dữ liệu nghiệp vụ được cập nhật theo thời gian thực."/><div className="mt-5 grid gap-4 sm:grid-cols-3"><Kpi label="Chờ xử lý" value="0" detail="Trong hôm nay" tone="amber"/><Kpi label="Đã hoàn thành" value="0" detail="Trong hôm nay"/><Kpi label="Cần kiểm tra" value="0" detail="Không có cảnh báo" tone="blue"/></div><div className="mt-5"><ActivityTable title="Danh sách gần đây"/></div></> }

const ADMIN_GROUPS = [
  { id: 'users', label: 'Quản lý người dùng', icon: 'staff', children: [
    ['doctors', 'Nhân sự phòng khám', '/doctors'], ['staff', 'Tài khoản & Phân quyền', '/staff'], ['patients', 'Bệnh nhân', '/patients'], ['roles', 'Vai trò & Phân quyền', '/roles-permissions'],
  ]},
  { id: 'work-schedules', label: 'Quản lý lịch làm việc', icon: 'appointments', children: [
    ['slots', 'Lịch làm việc & Slot', '/work-schedules'],
  ]},
  { id: 'appointments-group', label: 'Quản lý lịch khám', icon: 'receptionist', children: [
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
  ]},
  { id: 'system', label: 'Quản lý danh mục & Cơ sở', icon: 'inventory', children: [
    ['branches', 'Chi nhánh phòng khám', '/branches'], ['specialties', 'Chuyên khoa', '/specialties'], ['services', 'Dịch vụ khám & xét nghiệm', '/services'], ['booking-methods', 'Hình thức đặt khám', '/booking-methods'], ['booking-packages', 'Gói khám sức khỏe', '/booking-packages'], ['inventory', 'Thuốc & Vật tư', '/inventory'], ['billing', 'Thanh toán & Hóa đơn', '/billing'],
  ]},
]

const MANAGER_GROUPS = [
  { id: 'users', label: 'Quản lý người dùng', icon: 'staff', children: [
    ['doctors', 'Nhân sự phòng khám', '/doctors'], ['patients', 'Bệnh nhân', '/patients'], ['roles', 'Vai trò & Phân quyền', '/roles-permissions'],
  ]},
  { id: 'work-schedules', label: 'Quản lý lịch làm việc', icon: 'appointments', children: [
    ['slots', 'Lịch làm việc & Slot', '/work-schedules'],
  ]},
  { id: 'appointments-group', label: 'Quản lý lịch khám', icon: 'receptionist', children: [
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
  ]},
  { id: 'system', label: 'Quản lý danh mục & Cơ sở', icon: 'inventory', children: [
    ['branches', 'Chi nhánh phòng khám', '/branches'], ['specialties', 'Chuyên khoa', '/specialties'], ['booking-methods', 'Hình thức đặt khám', '/booking-methods'], ['booking-packages', 'Gói khám sức khỏe', '/booking-packages'], ['services', 'Cận lâm sàng & xét nghiệm', '/services'], ['inventory', 'Thuốc & Vật tư', '/inventory'],
  ]},
]

function GroupedPortal({ section, user, role, content, menu, setMenu, navigate, logout }) {
  const groups = role === 'admin' ? ADMIN_GROUPS : MANAGER_GROUPS
  const roleTitle = ROLE_LABELS[role] || 'Quản trị viên'
  const initialOpen = Object.fromEntries(groups.map((group) => [group.id, group.children.some(([id]) => id === section)]))
  const [openGroups, setOpenGroups] = useState(initialOpen)
  const go = (href) => { navigate(href); setMenu(false) }
  return <div className="min-h-screen bg-[#f5f8f5] text-slate-800">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu?'translate-x-0':'-translate-x-full'}`}>
      <div className="flex h-[70px] items-center gap-3 border-b border-slate-100 px-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 font-black text-white">M</span><div><b className="text-sm text-emerald-800">MediLink Global</b><p className="text-[9px] uppercase tracking-[.14em] text-slate-400">Healthcare System</p></div></div>
      <nav className="flex-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Không gian làm việc</p>
        <button onClick={()=>go('/dashboard')} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] ${section==='dashboard'?'bg-emerald-50 font-bold text-emerald-800':'font-medium text-slate-600 hover:bg-slate-50'}`}><Icon name="dashboard"/>Thống kê & Tổng quan</button>
        {groups.map((group) => {
          if (group.children?.length === 1) {
            const [id, _, href] = group.children[0]
            const active = section === id || section === group.id
            return (
              <button
                key={group.id}
                onClick={() => go(href)}
                className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] transition ${
                  active ? 'bg-emerald-50 font-bold text-emerald-800' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon name={group.icon} />
                <span>{group.label}</span>
              </button>
            )
          }
          const active = group.children.some(([id]) => id === section)
          const open = openGroups[group.id]
          return <div key={group.id} className="mb-1">
            <button onClick={()=>setOpenGroups((old)=>({...old,[group.id]:!old[group.id]}))} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] ${active?'font-bold text-emerald-800':'font-semibold text-slate-600 hover:bg-slate-50'}`}>
              <Icon name={group.icon}/>
              <span className="flex-1">{group.label}</span>
              <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-700' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open&&<div className="ml-5 border-l border-slate-200 pl-2">{group.children.map(([id,label,href])=><button key={id} onClick={()=>go(href)} className={`mt-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${section===id?'bg-emerald-50 font-bold text-emerald-800':'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><span className={`h-1.5 w-1.5 rounded-full ${section===id?'bg-emerald-600':'bg-slate-300'}`}/>{label}</button>)}</div>}
          </div>
        })}
      </nav>
      <div className="border-t border-slate-100 p-3"><div className="mb-2 flex items-center gap-3 rounded-md bg-slate-50 p-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">{initials(user)}</span><div className="min-w-0"><p className="truncate text-xs font-bold">{user?.fullName||user?.email}</p><p className="text-[10px] text-slate-400">{roleTitle}</p></div></div><button onClick={logout} className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600">Đăng xuất</button></div>
    </aside>
    {menu&&<button aria-label="Đóng menu" className="fixed inset-0 z-20 bg-slate-900/20 lg:hidden" onClick={()=>setMenu(false)}/>}<div className="lg:pl-[264px]"><header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-7"><button onClick={()=>setMenu(true)} className="rounded border border-slate-200 px-2.5 py-1.5 lg:hidden">☰</button><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><b className="text-xs">{role === 'admin' ? 'Hệ thống Trung tâm' : 'Chi nhánh chính'}</b><p className="text-[10px] text-slate-400">TP. Hồ Chí Minh</p></div><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">{initials(user)}</span></div></header><main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{content}</main></div>
  </div>
}

export default function RolePortal({ section='dashboard' }) {
 const navigate=useNavigate(); const { token, user, logout: clearAuthSession }=useAuth(); const session={ user }; const role=staffRole(user)||'admin'; const [stats,setStats]=useState(null); const [loading,setLoading]=useState(true); const [menu,setMenu]=useState(false)
 useEffect(()=>{if(!token)return; fetchDashboardStats({token}).then(setStats).catch(()=>setStats(null)).finally(()=>setLoading(false))},[token])
 const logout=async()=>{await clearAuthSession();navigate('/login',{replace:true})}; const nav=NAV[role]||NAV.admin
 let content=section==='billing'?<BillingPage/>:section==='booking-methods'?<BookingMethodsPage/>:section==='booking-packages'?<BookingPackagesPage/>:['branches','specialties','service-packages','services','inventory'].includes(section)&&['admin','branch_manager'].includes(role)?<SystemCatalogCrudPage resource={section==='inventory'?'medicines':section}/>:['doctors','staff'].includes(section)?(['admin','branch_manager'].includes(role)?<ClinicStaffPage/>:<StaffCrudPage role="doctor"/>):section==='pharmacists'?<StaffCrudPage role="pharmacist"/>:['schedule','slots','work-schedules'].includes(section)&&['admin','branch_manager'].includes(role)?<DoctorWorkSchedulesPage/>:section==='dashboard'?(role==='branch_manager'?<ManagerDashboard stats={stats} loading={loading}/>:<AdminDashboard stats={stats} loading={loading}/>):<GenericPage section={section} role={role}/>
 if(['admin','branch_manager'].includes(role)) return <GroupedPortal section={section} user={user} role={role} content={content} menu={menu} setMenu={setMenu} navigate={navigate} logout={logout}/>
 return <div className="min-h-screen bg-[#f5f8f5] font-sans text-slate-800"><aside className={`fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu?'translate-x-0':'-translate-x-full'}`}><div className="flex h-[70px] items-center gap-3 border-b border-slate-100 px-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-lg font-black text-white">M</span><div><p className="text-sm font-extrabold tracking-tight text-emerald-800">MediLink Global</p><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">Healthcare System</p></div></div><nav className="flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"><p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Không gian làm việc</p>{nav.map(([id,label,href])=><button key={id} onClick={()=>{navigate(href);setMenu(false)}} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] transition ${section===id?'bg-emerald-50 font-bold text-emerald-800':'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon name={id}/>{label}</button>)}</nav><div className="border-t border-slate-100 p-3"><div className="mb-2 flex items-center gap-3 rounded-md bg-slate-50 p-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">{initials(session.user)}</span><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{session.user?.fullName||session.user?.email||'Nhân viên'}</p><p className="truncate text-[10px] text-slate-400">{ROLE_LABELS[role]}</p></div></div><button onClick={logout} className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600">Đăng xuất</button></div></aside>{menu&&<button aria-label="Đóng menu" className="fixed inset-0 z-20 bg-slate-900/20 lg:hidden" onClick={()=>setMenu(false)}/>}<div className="lg:pl-[244px]"><header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-7"><div className="flex items-center gap-3"><button onClick={()=>setMenu(true)} className="rounded border border-slate-200 px-2.5 py-1.5 lg:hidden">☰</button><div className="relative hidden md:block"><span className="absolute left-3 top-2 text-slate-400">⌕</span><input className="w-72 rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500" placeholder="Tìm kiếm nhanh..."/></div></div><div className="flex items-center gap-4"><button className="relative text-lg text-slate-500">♧<i className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-rose-500"/></button><div className="hidden border-l border-slate-200 pl-4 text-right sm:block"><p className="text-xs font-bold text-slate-700">Chi nhánh chính</p><p className="text-[10px] text-slate-400">TP. Hồ Chí Minh</p></div><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">{initials(session.user)}</span></div></header><main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{content}</main></div></div>
}
