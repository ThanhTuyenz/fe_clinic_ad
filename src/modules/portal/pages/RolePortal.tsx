'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useAuth } from '@/common/hooks/useAuth'
import { fetchDashboardStats, AdminAnalyticsPage } from '@/modules/analytics'
import { StaffCrudPage, ClinicStaffPage, RolesPermissionsPage } from '@/modules/staff'
import { SystemCatalogCrudPage, BookingMethodsPage, BookingPackagesPage } from '@/modules/catalog'
import { DoctorWorkSchedulesPage } from '@/modules/doctor'
import { BillingPage } from '@/modules/billing'
import { AdminAppointmentsPage } from '@/modules/appointments'
import { AdminPatientsPage } from '@/modules/patients'
import { ReceptionPatientsPage } from '@/modules/reception'
import { staffRole } from '@/modules/admin/utils/staffSession'
import {
  LayoutDashboard,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  Users,
  CreditCard,
  Stethoscope,
  UserCheck,
  Cross,
  Package,
  Building2,
  SlidersHorizontal,
  Server,
  DoorOpen,
  UserPlus,
  FileText,
  FlaskConical,
  FileSpreadsheet,
  ChevronDown,
  LogOut,
  Menu,
  Shield,
  X,
  type LucideIcon,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  branch_manager: 'Quản lý chi nhánh',
  receptionist: 'Tiếp nhận',
  doctor: 'Bác sĩ',
}

const NAV: Record<string, [string, string, string][]> = {
  admin: [
    ['dashboard', 'Tổng quan', '/dashboard'],
    ['analytics', 'Báo cáo & Phân tích', '/analytics'],
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
    ['patients', 'Quản lý bệnh nhân', '/patients'],
    ['staff', 'Tài khoản & Nhân sự', '/staff'],
    ['roles', 'Vai trò & Phân quyền', '/roles-permissions'],
    ['slots', 'Lịch làm việc & Slot', '/work-schedules'],
    ['branches', 'Chi nhánh phòng khám', '/branches'],
    ['rooms', 'Phòng khám', '/rooms'],
    ['specialties', 'Chuyên khoa', '/specialties'],
    ['booking-methods', 'Quản lý hình thức đặt khám', '/booking-methods'],
    ['booking-packages', 'Quản lý gói khám', '/booking-packages'],
    ['billing', 'Thanh toán & Hóa đơn', '/billing'],
  ],
  branch_manager: [
    ['dashboard', 'Thống kê & Tổng quan', '/dashboard'],
    ['analytics', 'Báo cáo chi nhánh', '/analytics'],
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
    ['patients', 'Bệnh nhân', '/patients'],
    ['staff', 'Nhân sự chi nhánh', '/staff'],
    ['roles', 'Vai trò & Phân quyền', '/roles-permissions'],
    ['slots', 'Lịch làm việc & Slot', '/work-schedules'],
    ['branches', 'Chi nhánh phòng khám', '/branches'],
    ['rooms', 'Phòng khám', '/rooms'],
    ['specialties', 'Chuyên khoa', '/specialties'],
    ['booking-packages', 'Quản lý gói khám', '/booking-packages'],
    ['billing', 'Thanh toán', '/billing'],
  ],
  receptionist: [
    ['dashboard', 'Tổng quan tiếp đón', '/dashboard'],
    ['reception', 'Tiếp nhận bệnh nhân', '/reception'],
    ['patients', 'Danh bạ bệnh nhân', '/reception/patients'],
    ['registration', 'Đăng ký bệnh nhân', '/registration'],
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
    ['billing', 'Thanh toán', '/billing'],
  ],
  doctor: [
    ['exam', 'Phòng khám bệnh', '/doctor'],
    ['schedule', 'Lịch khám của tôi', '/doctor?view=schedule'],
    ['history', 'Lịch sử bệnh nhân', '/doctor?view=history'],
    ['laboratory', 'Chỉ định cận lâm sàng', '/clinical-orders'],
    ['prescription', 'Đơn thuốc', '/doctor/prescriptions'],
  ],
}

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  appointments: CalendarCheck,
  schedule: CalendarClock,
  patients: Users,
  billing: CreditCard,
  doctors: Stethoscope,
  staff: UserCheck,
  roles: Shield,
  specialties: Cross,
  packages: Package,
  branches: Building2,
  methods: SlidersHorizontal,
  server: Server,
  reception: DoorOpen,
  registration: UserPlus,
  exam: Stethoscope,
  history: FileText,
  laboratory: FlaskConical,
  prescription: FileSpreadsheet,
  rooms: DoorOpen,
  services: FlaskConical,
}

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name] || LayoutDashboard
  return <Comp className={className} strokeWidth={1.8} aria-hidden="true" />
}

function initials(user: any) {
  const name = String(user?.fullName || user?.displayName || user?.email || 'AD')
  return name.split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase()
}

function Kpi({ label, value, detail, tone = 'emerald', icon = 'appointments' }: any) {
  const tones: Record<string, { icon: string; text: string; sub: string }> = {
    emerald: { icon: 'bg-emerald-50 text-emerald-700 border border-emerald-100', text: 'text-slate-900', sub: 'text-emerald-700' },
    blue: { icon: 'bg-blue-50 text-blue-700 border border-blue-100', text: 'text-slate-900', sub: 'text-blue-700' },
    amber: { icon: 'bg-amber-50 text-amber-700 border border-amber-100', text: 'text-slate-900', sub: 'text-amber-700' },
    slate: { icon: 'bg-slate-100 text-slate-700 border border-slate-200', text: 'text-slate-900', sub: 'text-slate-500' },
  }
  const theme = tones[tone] || tones.emerald
  return (
    <article className="rounded border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${theme.text}`}>{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded shrink-0 ${theme.icon}`}>
          <Icon name={icon} />
        </span>
      </div>
      <p className={`mt-2 text-[11px] font-medium ${theme.sub}`}>{detail}</p>
    </article>
  )
}

function Card({ title, action, children, className = '' }: any) {
  return (
    <section className={`rounded border border-slate-200/80 bg-white shadow-xs overflow-hidden ${className}`}>
      <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
        {action && <span className="text-xs font-semibold text-slate-500">{action}</span>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ActivityTable({ title = 'Lịch hẹn hôm nay', items = [] }: { title?: string; items?: any[] }) {
  const rows = items.length
    ? items.map((it: any) => [
      it.startTime || '08:00',
      it.patientName || it.patientProfile?.fullName || 'Bệnh nhân',
      it.doctorName || (it.doctor?.fullName ? `BS. ${it.doctor.fullName}` : 'Khám tổng quát'),
      it.status === 'CHECKED_IN' ? 'Đã check-in' : it.status === 'COMPLETED' ? 'Đã khám' : 'Chờ xử lý',
    ])
    : []

  return (
    <Card title={title} action="Xem tất cả →">
      {rows.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400">Chưa có lịch hẹn nào ghi nhận trong ca trực</p>
      ) : (
        <div className="-m-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                {['Thời gian', 'Bệnh nhân', 'Dịch vụ / Bác sĩ', 'Trạng thái'].map((x) => (
                  <th key={x} className="px-5 py-3">{x}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-700">{r[0]}</td>
                  <td className="px-5 py-3 font-bold text-slate-900">{r[1]}</td>
                  <td className="px-5 py-3 text-slate-500">{r[2]}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${r[3] === 'Đã check-in' ? 'bg-emerald-50 text-emerald-700' : r[3] === 'Chờ xử lý' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                      {r[3]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function AdminDashboard({ stats, loading }: any) {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week')
  const [branchFilter, setBranchFilter] = useState('all')

  const todayCounts = stats?.appointments?.today || stats?.today || {}
  const weekCounts = stats?.appointments?.week || {}
  const monthCounts = stats?.appointments?.month || {}

  const revTodayObj = stats?.revenue?.today || stats?.revenueToday || {}
  const revWeekObj = stats?.revenue?.week || {}
  const revMonthObj = stats?.revenue?.month || {}

  const metrics = useMemo(() => {
    if (timeFilter === 'today') {
      const rev = revTodayObj.total != null ? revTodayObj.total : 0
      const totalRev = Number(rev) || 0
      const cash = Number(revTodayObj.cash) || 0
      const transfer = Number(revTodayObj.transfer || 0) + Number(revTodayObj.online || 0)
      const cashShare = totalRev > 0 ? Math.round((cash / totalRev) * 100) : 0
      const transferShare = totalRev > 0 ? 100 - cashShare : 0

      return {
        revenue: `${Math.round(rev).toLocaleString('vi-VN')} đ`,
        revenueSub: 'Hôm nay · Dữ liệu ghi nhận từ hệ thống',
        appointments: `${todayCounts.total ?? 0} ca`,
        appointmentsSub: `${todayCounts.examined ?? 0} đã hoàn thành · ${todayCounts.pending ?? 0} chờ xử lý`,
        patients: `${stats?.patients?.today ?? 0} người`,
        patientsSub: 'Tiếp đón trực tiếp và đặt trước',
        occupancy: `${stats?.occupancyRate ?? 0}%`,
        occupancySub: 'Công suất các phòng khám hôm nay',
        chartLabel: 'Doanh thu theo khung giờ hôm nay (Triệu VNĐ)',
        chartBars: stats?.chartBars?.today || [],
        cashShare,
        transferShare,
      }
    }
    if (timeFilter === 'month') {
      const rev = revMonthObj.total != null ? revMonthObj.total : 0
      const totalRev = Number(rev) || 0
      const cash = Number(revMonthObj.cash) || 0
      const transfer = Number(revMonthObj.transfer || 0) + Number(revMonthObj.online || 0)
      const cashShare = totalRev > 0 ? Math.round((cash / totalRev) * 100) : 0
      const transferShare = totalRev > 0 ? 100 - cashShare : 0

      return {
        revenue: `${Math.round(rev).toLocaleString('vi-VN')} đ`,
        revenueSub: 'Tháng này · Giao dịch thanh toán thành công',
        appointments: `${monthCounts.total ?? 0} ca`,
        appointmentsSub: `${monthCounts.examined ?? 0} hoàn thành · Hủy ${monthCounts.cancelled ?? 0} ca`,
        patients: `${stats?.patients?.month ?? 0} người`,
        patientsSub: 'Bệnh nhân khám trong tháng',
        occupancy: `${stats?.occupancyRate ?? 0}%`,
        occupancySub: 'Hiệu suất vận hành toàn hệ thống',
        chartLabel: 'Doanh thu theo tuần trong tháng (Triệu VNĐ)',
        chartBars: stats?.chartBars?.month || [],
        cashShare,
        transferShare,
      }
    }

    const rev = revWeekObj.total != null ? revWeekObj.total : 0
    const totalRev = Number(rev) || 0
    const cash = Number(revWeekObj.cash) || 0
    const transfer = Number(revWeekObj.transfer || 0) + Number(revWeekObj.online || 0)
    const cashShare = totalRev > 0 ? Math.round((cash / totalRev) * 100) : 0
    const transferShare = totalRev > 0 ? 100 - cashShare : 0

    return {
      revenue: `${Math.round(rev).toLocaleString('vi-VN')} đ`,
      revenueSub: 'Tuần này · Giao dịch thanh toán thành công',
      appointments: `${weekCounts.total ?? 0} ca`,
      appointmentsSub: `${weekCounts.examined ?? 0} hoàn thành · ${weekCounts.pending ?? 0} chờ xử lý`,
      patients: `${stats?.patients?.week ?? 0} người`,
      patientsSub: 'Bệnh nhân khám trong tuần',
      occupancy: `${stats?.occupancyRate ?? 0}%`,
      occupancySub: 'Hiệu suất buồng khám đạt mục tiêu',
      chartLabel: 'Doanh thu 7 ngày gần nhất (Triệu VNĐ)',
      chartBars: stats?.chartBars?.week || [],
      cashShare,
      transferShare,
    }
  }, [timeFilter, revTodayObj, revWeekObj, revMonthObj, todayCounts, weekCounts, monthCounts, stats])

  const maxBarRev = Math.max(...(metrics.chartBars.map((b: any) => Number(b.rev) || 0) || [0]), 1)
  const ceiling = Math.ceil(maxBarRev * 1.25) || (timeFilter === 'month' ? 200 : timeFilter === 'week' ? 32 : 5)
  const todayRows = stats?.todayRows || stats?.data?.todayRows || []

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Điều hành & Vận hành trung tâm</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">Tổng quan vận hành</h1>
          <p className="text-xs text-slate-500">Giám sát hoạt động tiếp nhận, lưu lượng khám và hiệu suất hoạt động theo thời gian thực.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Báo cáo chi tiết →</span>
          </button>
          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-xs shadow-xs">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeFilter(t)}
                className={`rounded px-3 py-1 font-bold transition-colors cursor-pointer ${timeFilter === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {t === 'today' ? 'Hôm nay' : t === 'week' ? 'Tuần này' : 'Tháng này'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Tổng doanh thu" value={loading ? '—' : metrics.revenue} detail={metrics.revenueSub} icon="billing" tone="emerald" />
        <Kpi label="Lượt khám thực hiện" value={loading ? '—' : metrics.appointments} detail={metrics.appointmentsSub} icon="appointments" tone="blue" />
        <Kpi label="Bệnh nhân phục vụ" value={loading ? '—' : metrics.patients} detail={metrics.patientsSub} icon="patients" tone="amber" />
        <Kpi label="Công suất buồng khám" value={loading ? '—' : metrics.occupancy} detail={metrics.occupancySub} icon="branches" tone="slate" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card title={metrics.chartLabel} action={timeFilter === 'month' ? '4 tuần trong tháng' : timeFilter === 'today' ? 'Khung giờ trong ngày' : '7 ngày gần nhất'}>
          {metrics.chartBars.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">Chưa có dữ liệu biểu đồ trong khoảng thời gian này</p>
          ) : (
            <div className="pt-2">
              <div className="relative h-48 border-b border-slate-200 flex items-end justify-around px-2">
                {metrics.chartBars.map((item: any, idx: number) => {
                  const height = Math.min(100, Math.max(8, Math.round((item.rev / ceiling) * 100)))
                  return (
                    <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end max-w-[64px] cursor-pointer">
                      <span className="mb-1 text-[10px] font-bold text-slate-700 group-hover:text-emerald-700">{item.rev}</span>
                      <div className="w-7 sm:w-9 rounded-t bg-emerald-700 hover:bg-emerald-800 transition-all shadow-xs" style={{ height: `${height}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-around px-2 pt-2 text-center">
                {metrics.chartBars.map((item: any, idx: number) => (
                  <div key={idx} className="flex-1 max-w-[64px]">
                    <p className="text-xs font-bold text-slate-700">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.count} ca</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Chuyển khoản / QR: <b className="text-slate-900">{metrics.transferShare}%</b></span>
                <span>Tiền mặt tại quầy: <b className="text-slate-900">{metrics.cashShare}%</b></span>
              </div>
            </div>
          )}
        </Card>

        <Card title="Hiệu suất theo Chi nhánh" action="Hệ thống VitaCare Clinic">
          <div className="space-y-3">
            {(!stats?.branchComparison || stats.branchComparison.length === 0) ? (
              <p className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu cơ sở chi nhánh</p>
            ) : (
              stats.branchComparison.map((b: any) => (
                <div key={b.id || b.name} className="rounded border border-slate-200/80 bg-white p-3 shadow-xs">
                  <div className="flex items-start justify-between text-xs">
                    <h3 className="font-bold text-slate-900">{b.name}</h3>
                    <span className="font-bold text-slate-900">{b.rev}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Lượt khám: <b>{b.appts} ca</b></span>
                    <span>Công suất: <b>{b.cap}%</b></span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${b.col}`} style={{ width: `${b.cap}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <ActivityTable title="Hoạt động khám & Tiếp nhận mới nhất" items={todayRows} />
      </div>
    </>
  )
}


function ManagerDashboard({ stats, loading }: any) {
  const t = stats?.appointments?.today || stats?.today || {}
  const rev = stats?.revenue?.today?.total != null
    ? `${Math.round(stats.revenue.today.total).toLocaleString('vi-VN')} đ`
    : '—'
  const todayRows = stats?.todayRows || []

  return (
    <>
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Chi nhánh quản lý</p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Tổng quan chi nhánh</h1>
        <p className="text-xs text-slate-500">Hoạt động vận hành và lịch khám hôm nay theo thời gian thực.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Lịch hẹn hôm nay" value={loading ? '—' : `${t.total ?? 0} ca`} detail={`Đã khám: ${t.examined ?? 0} · Đang chờ: ${t.checkedIn ?? 0}`} icon="appointments" />
        <Kpi label="Doanh thu hôm nay" value={loading ? '—' : rev} detail="Thu tiền mặt & chuyển khoản" tone="emerald" icon="billing" />
        <Kpi label="Đang chờ khám" value={loading ? '—' : `${t.checkedIn ?? 0} ca`} detail="Bệnh nhân đã tiếp đón vào phòng" tone="amber" icon="patients" />
        <Kpi label="Hoàn thành" value={loading ? '—' : `${t.examined ?? 0} ca`} detail="Đã hoàn tất ca khám và kê đơn" tone="blue" icon="appointments" />
      </div>
      <div className="mt-5">
        <ActivityTable title="Lịch hẹn tại chi nhánh hôm nay" items={todayRows} />
      </div>
    </>
  )
}

function GenericPage({ section, role }: any) {
  const titles: Record<string, string> = {
    billing: 'Thanh toán & Hóa đơn',
    doctors: 'Bác sĩ & Nhân sự',
    patients: 'Quản lý bệnh nhân',
    roles: 'Vai trò & Phân quyền',
    appointments: 'Danh sách lịch hẹn',
    branches: 'Chi nhánh phòng khám',
    specialties: 'Quản lý chuyên khoa',
    services: 'Dịch vụ khám & xét nghiệm',
    slots: 'Lịch làm việc bác sĩ',
  }
  return (
    <>
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{ROLE_LABELS[role] || 'Hệ thống'}</p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900">{titles[section] || 'Quản lý hệ thống'}</h1>
        <p className="text-xs text-slate-500">Dữ liệu nghiệp vụ cập nhật theo thời gian thực.</p>
      </div>
      <div className="mt-5"><ActivityTable title="Danh sách gần đây" /></div>
    </>
  )
}

const ADMIN_NAV_SECTIONS = [
  {
    category: 'Vận hành phòng khám',
    items: [
      { id: 'dashboard', label: 'Tổng quan vận hành', href: '/dashboard', icon: 'dashboard' },
      { id: 'analytics', label: 'Báo cáo & Thống kê', href: '/analytics', icon: 'analytics' },
      { id: 'appointments', label: 'Danh sách lịch hẹn', href: '/appointments', icon: 'appointments' },
      { id: 'slots', label: 'Lịch làm việc bác sĩ', href: '/work-schedules', icon: 'schedule' },
      { id: 'patients', label: 'Hồ sơ bệnh nhân', href: '/patients', icon: 'patients' },
      { id: 'billing', label: 'Thanh toán & Hóa đơn', href: '/billing', icon: 'billing' },
    ],
  },
  {
    category: 'Chuyên môn & Dịch vụ',
    items: [
      { id: 'rooms', label: 'Phòng khám', href: '/rooms', icon: 'rooms' },
      { id: 'specialties', label: 'Chuyên khoa khám', href: '/specialties', icon: 'specialties' },
      { id: 'booking-packages', label: 'Dịch vụ khám bệnh', href: '/booking-packages', icon: 'packages' },
    ],
  },
  {
    category: 'Quản trị & Hệ thống',
    items: [
      { id: 'staff', label: 'Tài khoản & Nhân sự', href: '/staff', icon: 'staff' },
      { id: 'roles', label: 'Vai trò & Phân quyền', href: '/roles-permissions', icon: 'roles' },
      { id: 'branches', label: 'Chi nhánh phòng khám', href: '/branches', icon: 'branches' },
      { id: 'booking-methods', label: 'Hình thức đặt khám', href: '/booking-methods', icon: 'methods' },
    ],
  },
]

const MANAGER_NAV_SECTIONS = [
  {
    category: 'Vận hành chi nhánh',
    items: [
      { id: 'dashboard', label: 'Tổng quan chi nhánh', href: '/dashboard', icon: 'dashboard' },
      { id: 'analytics', label: 'Báo cáo & Thống kê', href: '/analytics', icon: 'analytics' },
      { id: 'appointments', label: 'Danh sách lịch hẹn', href: '/appointments', icon: 'appointments' },
      { id: 'slots', label: 'Lịch làm việc & Ca trực', href: '/work-schedules', icon: 'schedule' },
      { id: 'patients', label: 'Hồ sơ bệnh nhân', href: '/patients', icon: 'patients' },
      { id: 'billing', label: 'Thanh toán & Hóa đơn', href: '/billing', icon: 'billing' },
      { id: 'branches', label: 'Thông tin chi nhánh', href: '/branches', icon: 'branches' },
    ],
  },
  {
    category: 'Chuyên môn & Nhân sự',
    items: [
      { id: 'staff', label: 'Nhân sự chi nhánh', href: '/staff', icon: 'staff' },
      { id: 'roles', label: 'Vai trò & Phân quyền', href: '/roles-permissions', icon: 'roles' },
      { id: 'rooms', label: 'Phòng khám', href: '/rooms', icon: 'rooms' },
      { id: 'specialties', label: 'Chuyên khoa khám', href: '/specialties', icon: 'specialties' },
      { id: 'booking-packages', label: 'Dịch vụ khám bệnh', href: '/booking-packages', icon: 'packages' },
    ],
  },
]

function GroupedPortal({ section, user, role, content, menu, setMenu, navigate, logout }: any) {
  const sections = role === 'admin' ? ADMIN_NAV_SECTIONS : MANAGER_NAV_SECTIONS
  const roleTitle = ROLE_LABELS[role] || 'Quản trị viên'
  const go = (href: string) => { navigate(href); setMenu(false) }

  return (
    <div className="min-h-screen bg-[#f5f8f5] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50/60 flex-1 min-w-0" onClick={() => go('/dashboard')}>
            <img src="/imgs/logo/logo2.png" alt="VitaCare Clinic" className="h-11 w-11 object-contain shrink-0" />
            <div className="min-w-0 flex-1">
              <strong className="text-sm font-extrabold text-emerald-800 tracking-tight block truncate">VitaCare Clinic</strong>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{roleTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenu(false)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0 ml-1"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {sections.map((sec, idx) => (
            <div key={sec.category || idx}>
              <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{sec.category}</p>
              <div className="space-y-0.5">
                {sec.items.map((item: any) => {
                  const active = section === item.id || (item.id === 'slots' && ['slots', 'work-schedules'].includes(section))
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.href)}
                      className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${active ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <span className={`shrink-0 ${active ? 'text-emerald-700' : 'text-slate-400'}`}><Icon name={item.icon} /></span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 bg-white space-y-2">
          <div className="flex items-center gap-3 rounded bg-slate-50 p-2.5 border border-slate-200/80">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 shrink-0">{initials(user)}</span>
            <div className="min-w-0 flex-1">
              <strong className="text-xs font-bold text-slate-800 truncate block">{user?.fullName || user?.displayName || 'Nhân viên'}</strong>
              <p className="text-[10px] text-slate-400 truncate">{roleTitle} · VitaCare</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {menu && <button aria-label="Đóng menu" className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setMenu(false)} />}

      <div className="lg:pl-[264px]">
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMenu(true)} className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Menu className="h-5 w-5" /></button>
            <span className="text-sm font-bold text-slate-800">VitaCare Clinic</span>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">{roleTitle}</span>
        </div>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{content}</main>
      </div>
    </div>
  )
}

export default function RolePortal({ section = 'dashboard' }: { section?: string }) {
  const navigate = useNavigate()
  const { token, user, logout: clearAuthSession } = useAuth()
  const role = staffRole(user) || 'admin'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchDashboardStats({ token }).then(setStats).catch(() => setStats(null)).finally(() => setLoading(false))
  }, [token])

  const logout = async () => {
    await clearAuthSession()
    navigate('/login', { replace: true })
  }

  const nav = NAV[role] || NAV.admin

  const content =
    section === 'analytics' ? <AdminAnalyticsPage stats={stats} loading={loading} /> :
      section === 'roles' ? <RolesPermissionsPage /> :
        section === 'patients' ? (role === 'receptionist' ? <ReceptionPatientsPage /> : <AdminPatientsPage />) :
          section === 'appointments' ? <AdminAppointmentsPage /> :
            section === 'billing' ? <BillingPage /> :
              section === 'booking-methods' ? <BookingMethodsPage /> :
                section === 'booking-packages' ? <BookingPackagesPage /> :
                  ['branches', 'rooms', 'specialties', 'service-packages', 'services', 'inventory'].includes(section) && ['admin', 'branch_manager'].includes(role) ? <SystemCatalogCrudPage resource={section === 'inventory' ? 'medicines' : section} /> :
                    ['doctors', 'staff'].includes(section) ? (['admin', 'branch_manager'].includes(role) ? <ClinicStaffPage /> : <StaffCrudPage role="doctor" />) :
                      ['schedule', 'slots', 'work-schedules'].includes(section) && ['admin', 'branch_manager'].includes(role) ? <DoctorWorkSchedulesPage /> :
                        section === 'dashboard' ? (role === 'branch_manager' ? <ManagerDashboard stats={stats} loading={loading} /> : <AdminDashboard stats={stats} loading={loading} />) :
                          <GenericPage section={section} role={role} />

  if (['admin', 'branch_manager'].includes(role)) {
    return <GroupedPortal section={section} user={user} role={role} content={content} menu={menu} setMenu={setMenu} navigate={navigate} logout={logout} />
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50/60 flex-1 min-w-0" onClick={() => { navigate('/dashboard'); setMenu(false) }}>
            <img src="/imgs/logo/logo2.png" alt="VitaCare Clinic" className="h-11 w-11 object-contain shrink-0" />
            <div className="min-w-0 flex-1">
              <strong className="text-sm font-extrabold text-emerald-800 tracking-tight block truncate">VitaCare Clinic</strong>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenu(false)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0 ml-1"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Không gian làm việc</p>
          {nav.map(([id, label, href]) => (
            <button key={id} onClick={() => { navigate(href); setMenu(false) }} className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${section === id ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
              <Icon name={id} />{label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 bg-white space-y-2">
          <div className="flex items-center gap-3 rounded bg-slate-50 p-2.5 border border-slate-200/80">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 shrink-0">{initials(user)}</span>
            <div className="min-w-0 flex-1">
              <strong className="text-xs font-bold text-slate-800 truncate block">{user?.fullName || user?.email || 'Nhân viên'}</strong>
              <p className="text-[10px] text-slate-400 truncate">{ROLE_LABELS[role]} · VitaCare</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      {menu && <button aria-label="Đóng menu" className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setMenu(false)} />}
      <div className="lg:pl-[244px]">
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMenu(true)} className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 cursor-pointer" aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
            <span className="text-sm font-bold text-slate-800">VitaCare Clinic</span>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">{ROLE_LABELS[role] || 'Nhân viên'}</span>
        </div>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{content}</main>
      </div>
    </div>
  )
}

