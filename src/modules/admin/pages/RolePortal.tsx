'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { fetchDashboardStats } from '../services/stats'
import { clearStaffSession, getStaffSession, staffRole } from '../utils/staffSession'

const ROLE_LABELS = {
  admin: 'Quản trị hệ thống',
  branch_manager: 'Quản lý chi nhánh',
  pharmacist: 'Dược sĩ',
  cashier: 'Thu ngân',
}

const NAV_BY_ROLE = {
  admin: [['dashboard', 'Tổng quan', '/dashboard'], ['patients', 'Bệnh nhân', '/reception'], ['appointments', 'Lịch hẹn', '/reception'], ['inventory', 'Kho thuốc', '/inventory'], ['billing', 'Thanh toán', '/billing'], ['staff', 'Nhân sự', '/staff']],
  branch_manager: [['dashboard', 'Dashboard', '/dashboard'], ['patients', 'Bệnh nhân', '/reception'], ['appointments', 'Lịch bác sĩ', '/schedule'], ['inventory', 'Kho thuốc', '/inventory'], ['billing', 'Thanh toán', '/billing'], ['staff', 'Nhân sự', '/staff']],
  pharmacist: [['dashboard', 'Dashboard', '/dashboard'], ['inventory', 'Kho thuốc', '/inventory'], ['appointments', 'Đơn thuốc', '/schedule']],
  cashier: [['dashboard', 'Dashboard', '/dashboard'], ['billing', 'Thu tiền', '/billing'], ['appointments', 'Giao dịch', '/schedule']],
}

function Icon({ name }) {
  const paths = {
    dashboard: 'M4 5h6v6H4V5Zm10 0h6v4h-6V5ZM4 15h6v4H4v-4Zm10-2h6v6h-6v-6Z',
    patients: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
    appointments: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
    inventory: 'm4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10',
    billing: 'M4 5h16v14H4V5Zm0 4h16M8 15h3',
    staff: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-1a2.5 2.5 0 1 0 0-5M3 19a6 6 0 0 1 12 0m1-5a5 5 0 0 1 5 5',
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d={paths[name] || paths.dashboard} /></svg>
}

function Kpi({ label, value, note, tone = 'green' }) {
  const tones = { green: 'text-green-700', red: 'text-red-600', blue: 'text-blue-700', amber: 'text-amber-700' }
  return <article className="border border-slate-200 bg-white p-5"><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500">{label}</p><p className={`mt-3 text-3xl font-semibold ${tones[tone]}`}>{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></article>
}

function DashboardContent({ role, stats, loading }) {
  const today = stats?.today || stats?.data?.today || {}
  const cards = role === 'cashier'
    ? [['Chưa thanh toán', today.pendingPayment ?? 0, 'Cần xử lý', 'amber'], ['Đã thanh toán', today.paid ?? 0, 'Trong hôm nay', 'green'], ['Giao dịch lỗi', today.failed ?? 0, 'Cần đối soát', 'red'], ['Tổng thu', today.revenue ? `${Number(today.revenue).toLocaleString('vi-VN')}đ` : '0đ', 'Doanh thu hôm nay', 'blue']]
    : role === 'pharmacist'
      ? [['Đơn chờ cấp', today.pending ?? 0, 'Trong hàng đợi', 'amber'], ['Đang chuẩn bị', today.inProgress ?? 0, 'Đang xử lý', 'blue'], ['Đã cấp', today.completed ?? 0, 'Trong hôm nay', 'green'], ['Cảnh báo kho', today.alerts ?? 0, 'Cần kiểm tra', 'red']]
      : [['Lịch hẹn hôm nay', today.total ?? stats?.totalAppointments ?? 0, 'Toàn bộ trạng thái', 'green'], ['Đã check-in', today.checkedIn ?? 0, 'Đang chờ khám', 'blue'], ['Đã hoàn thành', today.completed ?? 0, 'Trong hôm nay', 'green'], ['Cần xử lý', today.pending ?? 0, 'Đang chờ xác nhận', 'red']]
  return <>
    <div className="flex items-end justify-between"><div><p className="text-sm text-slate-500">Dữ liệu vận hành cập nhật theo thời gian thực</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{role === 'admin' ? 'Tổng quan hệ thống' : role === 'branch_manager' ? 'Tổng quan chi nhánh' : ROLE_LABELS[role]}</h1></div><button className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Hôm nay</button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note, tone]) => <Kpi key={label} label={label} value={loading ? '—' : value} note={note} tone={tone} />)}</div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_.9fr]"><section className="border border-slate-200 bg-white"><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Hoạt động gần đây</h2><button className="text-xs font-medium text-green-700">Xem tất cả</button></header><div className="divide-y divide-slate-100">{['Lịch hẹn mới được tạo', 'Bệnh nhân đã check-in', 'Thanh toán được xác nhận', 'Lịch làm việc được cập nhật'].map((item, index) => <div key={item} className="flex items-center justify-between px-5 py-4 text-sm"><div><p className="font-medium text-slate-800">{item}</p><p className="mt-1 text-xs text-slate-400">Dữ liệu từ hệ thống</p></div><span className="text-xs text-slate-400">{index + 1} giờ trước</span></div>)}</div></section><section className="border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Cảnh báo hệ thống</h2></header><div className="space-y-3 p-5"><div className="border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-800">Kiểm tra các giao dịch đang chờ xử lý.</div><div className="border-l-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-800">Rà soát lịch làm việc chưa được xác nhận.</div><div className="border-l-2 border-green-600 bg-green-50 p-3 text-sm text-green-800">Hệ thống đang hoạt động bình thường.</div></div></section></div>
  </>
}

function SectionContent({ section }) {
  const names = { staff: 'Tài khoản & Phân quyền', schedule: 'Lịch làm việc', inventory: 'Kho thuốc', billing: 'Thanh toán & Đối soát' }
  return <><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Quản lý dữ liệu nghiệp vụ</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">{names[section]}</h1></div><button className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white">+ Tạo mới</button></div><section className="mt-6 border border-slate-200 bg-white"><div className="flex flex-wrap gap-3 border-b border-slate-200 p-4"><input className="min-w-64 flex-1 border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600" placeholder="Tìm kiếm…" /><select className="border border-slate-300 bg-white px-3 py-2 text-sm"><option>Tất cả trạng thái</option></select><button className="border border-slate-300 px-4 py-2 text-sm">Xuất dữ liệu</button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr>{['Mã', 'Tên/Thông tin', 'Vai trò/Loại', 'Chi nhánh', 'Trạng thái', 'Thao tác'].map(h => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody><tr className="border-t border-slate-100"><td colSpan="6" className="px-5 py-16 text-center text-slate-400">Dữ liệu sẽ được tải từ API theo quyền của tài khoản.</td></tr></tbody></table></div></section></>
}

export default function RolePortal({ section = 'dashboard' }) {
  const navigate = useNavigate()
  const session = useMemo(() => getStaffSession(), [])
  const role = staffRole(session.user)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!session.token) return navigate('/login', { replace: true })
    fetchDashboardStats({ token: session.token }).then(setStats).catch(() => setStats(null)).finally(() => setLoading(false))
  }, [navigate, session.token])
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.admin
  const logout = () => { clearStaffSession(); navigate('/login', { replace: true }) }
  return <div className="min-h-screen bg-[#f6f8f7] text-slate-800"><aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-slate-200 bg-white lg:flex lg:flex-col"><div className="border-b border-slate-100 px-5 py-5"><p className="text-lg font-semibold text-green-800">MediLink Global</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Admin Portal</p></div><nav className="flex-1 space-y-1 p-3">{nav.map(([id, label, href]) => <button key={id} onClick={() => navigate(href)} className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left text-sm ${section === id ? 'border-green-700 bg-[#eef5e8] font-semibold text-green-800' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}><Icon name={id} />{label}</button>)}</nav><div className="border-t border-slate-100 p-3"><button className="w-full px-3 py-2 text-left text-sm text-slate-500">Trung tâm hỗ trợ</button><button onClick={logout} className="w-full px-3 py-2 text-left text-sm text-slate-500">Đăng xuất</button></div></aside><div className="lg:pl-60"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8"><div><p className="text-xs text-slate-400">MediLink Global</p><p className="text-sm font-medium text-slate-800">{ROLE_LABELS[role] || role}</p></div><div className="flex items-center gap-4"><span className="hidden text-sm text-slate-500 sm:inline">Chi nhánh chính</span><span className="grid h-8 w-8 place-items-center rounded-full bg-green-100 text-xs font-bold text-green-800">{String(session.user?.fullName || 'AD').slice(0, 2).toUpperCase()}</span></div></header><main className="mx-auto max-w-[1440px] p-5 lg:p-8">{section === 'dashboard' ? <DashboardContent role={role} stats={stats} loading={loading} /> : <SectionContent section={section} />}</main></div></div>
}
