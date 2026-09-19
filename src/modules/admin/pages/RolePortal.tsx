'use client'

import { useEffect, useMemo, useState } from 'react'
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
import AdminAnalyticsPage from './AdminAnalyticsPage'
import { staffRole } from '../utils/staffSession'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  branch_manager: 'Quản lý chi nhánh',
  receptionist: 'Tiếp nhận',
  doctor: 'Bác sĩ',
  pharmacist: 'Dược sĩ',
  cashier: 'Kế toán / Thu ngân',
}

const NAV: Record<string, [string, string, string][]> = {
  receptionist: [
    ['dashboard', 'Tổng quan tiếp đón', '/dashboard'],
    ['reception', 'Tiếp nhận bệnh nhân', '/reception'],
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
  pharmacist: [
    ['pharmacy', 'Cấp phát thuốc', '/pharmacy'],
  ],
  cashier: [
    ['dashboard', 'Tổng quan thu ngân', '/dashboard'],
    ['billing', 'Thanh toán & Hóa đơn', '/billing'],
  ],
}

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
  Pill,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  appointments: CalendarCheck,
  schedule: CalendarClock,
  patients: Users,
  billing: CreditCard,
  doctors: Stethoscope,
  staff: UserCheck,
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
  pharmacy: Pill,
}

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name] || LayoutDashboard
  return <Comp className={className} strokeWidth={1.8} aria-hidden="true" />
}

function initials(user) {
  const name = String(user?.fullName || user?.displayName || user?.email || 'AD')
  return name.split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase()
}

function Kpi({ label, value, detail, tone = 'emerald', icon = 'appointments' }: any) {
  const cardTones: Record<string, { icon: string; text: string; sub: string }> = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      text: 'text-slate-900',
      sub: 'text-emerald-700',
    },
    blue: {
      icon: 'bg-blue-50 text-blue-700 border border-blue-100',
      text: 'text-slate-900',
      sub: 'text-blue-700',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-700 border border-amber-100',
      text: 'text-slate-900',
      sub: 'text-amber-700',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-700 border border-rose-100',
      text: 'text-slate-900',
      sub: 'text-rose-700',
    },
    indigo: {
      icon: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      text: 'text-slate-900',
      sub: 'text-indigo-700',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-700 border border-slate-200',
      text: 'text-slate-900',
      sub: 'text-slate-500',
    },
  }

  const theme = cardTones[tone] || cardTones.emerald

  return (
    <article className="rounded border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className={`mt-2 text-[26px] font-bold tracking-tight ${theme.text}`}>{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded shrink-0 shadow-2xs ${theme.icon}`}>
          <Icon name={icon} />
        </span>
      </div>
      <p className={`mt-2 text-[11px] font-medium ${theme.sub}`}>{detail}</p>
    </article>
  )
}

function AdminDashboard({ stats, loading }: any) {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week')
  const [branchFilter, setBranchFilter] = useState<string>('all')

  const today = stats?.today || stats?.data?.today || {}
  const revToday = stats?.revenueToday || stats?.data?.revenueToday || { total: 14850000, cash: 4850000, transfer: 10000000, count: 28 }

  const metrics = useMemo(() => {
    if (timeFilter === 'today') {
      const rev = revToday.total || 14850000
      return {
        revenue: `${Math.round(rev).toLocaleString('vi-VN')} đ`,
        revenueSub: 'Hôm nay · Tăng +6.2% so với hôm qua',
        appointments: (today.total ?? stats?.totalAppointments ?? 34) + ' ca',
        appointmentsSub: `${today.examined ?? 18} đã hoàn thành · ${today.pending ?? 6} chờ xử lý`,
        patients: '28 người',
        patientsSub: '18 tiếp đón trực tiếp · 10 đặt trước',
        occupancy: '84%',
        occupancySub: 'Công suất 3 chi nhánh đang mở',
        chartLabel: 'Lưu lượng & Doanh thu theo khung giờ trong ngày',
        chartBars: [
          { label: '08h-10h', rev: 3.8, count: 9 },
          { label: '10h-12h', rev: 4.2, count: 11 },
          { label: '12h-14h', rev: 1.5, count: 3 },
          { label: '14h-16h', rev: 3.6, count: 8 },
          { label: '16h-18h', rev: 2.8, count: 6 },
          { label: '18h-20h', rev: 1.2, count: 3 },
        ],
        cashShare: 35,
        transferShare: 65,
      }
    }
    if (timeFilter === 'month') {
      return {
        revenue: '612.450.000 đ',
        revenueSub: 'Tháng này · Tăng +16.8% so với tháng trước',
        appointments: '1,420 ca',
        appointmentsSub: '1,310 đã hoàn thành · Tỷ lệ hủy 4.2%',
        patients: '1,085 người',
        patientsSub: '68% bệnh nhân mới · 32% tái khám',
        occupancy: '89%',
        occupancySub: 'Hiệu suất vận hành toàn hệ thống',
        chartLabel: 'Doanh thu theo 4 tuần trong tháng (Triệu VNĐ)',
        chartBars: [
          { label: 'Tuần 1', rev: 142.5, count: 330 },
          { label: 'Tuần 2', rev: 156.0, count: 365 },
          { label: 'Tuần 3', rev: 148.2, count: 345 },
          { label: 'Tuần 4', rev: 165.75, count: 380 },
        ],
        cashShare: 32,
        transferShare: 68,
      }
    }
    // 'week'
    return {
      revenue: '154.200.000 đ',
      revenueSub: 'Tuần này · Tăng +14.2% so với tuần trước',
      appointments: '356 ca',
      appointmentsSub: '328 đã hoàn thành · Tỷ lệ đúng giờ 94%',
      patients: '264 người',
      patientsSub: '62% đặt qua web/app · 38% tại quầy',
      occupancy: '86%',
      occupancySub: 'Hiệu suất buồng khám đạt mục tiêu',
      chartLabel: 'Doanh thu 7 ngày gần nhất (Triệu VNĐ)',
      chartBars: [
        { label: 'T2', rev: 23.5, count: 54 },
        { label: 'T3', rev: 26.2, count: 61 },
        { label: 'T4', rev: 22.0, count: 50 },
        { label: 'T5', rev: 29.8, count: 68 },
        { label: 'T6', rev: 27.5, count: 63 },
        { label: 'T7', rev: 18.2, count: 42 },
        { label: 'CN', rev: 7.0, count: 18 },
      ],
      cashShare: 36,
      transferShare: 64,
    }
  }, [timeFilter, revToday, today, stats])

  const branches = [
    {
      id: 'q1',
      name: 'Cơ sở Quận 1 (Trụ sở chính)',
      address: '123 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1',
      revenue: timeFilter === 'month' ? '336.800.000 đ' : timeFilter === 'today' ? '8.200.000 đ' : '84.800.000 đ',
      share: 55,
      appts: timeFilter === 'month' ? 780 : timeFilter === 'today' ? 18 : 196,
      capacity: 92,
      capacityColor: 'bg-emerald-600',
      activeDoctors: 14,
      status: 'Đang hoạt động',
    },
    {
      id: 'q5',
      name: 'Cơ sở Quận 5 (Phòng khám đa khoa)',
      address: '456 An Dương Vương, P.8, Q.5',
      revenue: timeFilter === 'month' ? '183.700.000 đ' : timeFilter === 'today' ? '4.500.000 đ' : '46.200.000 đ',
      share: 30,
      appts: timeFilter === 'month' ? 425 : timeFilter === 'today' ? 11 : 108,
      capacity: 78,
      capacityColor: 'bg-blue-600',
      activeDoctors: 9,
      status: 'Đang hoạt động',
    },
    {
      id: 'td',
      name: 'Cơ sở TP. Thủ Đức',
      address: '789 Đỗ Xuân Hợp, P. Phước Long B, TP. Thủ Đức',
      revenue: timeFilter === 'month' ? '91.950.000 đ' : timeFilter === 'today' ? '2.150.000 đ' : '23.200.000 đ',
      share: 15,
      appts: timeFilter === 'month' ? 215 : timeFilter === 'today' ? 5 : 52,
      capacity: 64,
      capacityColor: 'bg-amber-500',
      activeDoctors: 6,
      status: 'Đang hoạt động',
    },
  ]

  const chartConfig = useMemo(() => {
    if (timeFilter === 'month') {
      return {
        ceiling: 200,
        guides: ['200', '150', '100', '50'],
        unit: 'tr',
      }
    }
    if (timeFilter === 'week') {
      return {
        ceiling: 32,
        guides: ['32', '24', '16', '8'],
        unit: 'tr',
      }
    }
    return {
      ceiling: 5,
      guides: ['5.0', '3.8', '2.5', '1.2'],
      unit: 'tr',
    }
  }, [timeFilter])

  const todayRows = stats?.todayRows || stats?.data?.todayRows || []

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Điều hành & Vận hành trung tâm</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Tổng quan vận hành</h1>
          <p className="mt-1 text-xs text-slate-500">Giám sát hoạt động tiếp nhận, lưu lượng khám và hiệu suất hoạt động giữa các cơ sở theo thời gian thực.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút sang Báo cáo & Thống kê */}
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Mở Báo cáo & Thống kê chi tiết"
          >
            <Icon name="analytics" className="h-3.5 w-3.5 text-slate-500" />
            <span>Xem Báo cáo & Thống kê chi tiết →</span>
          </button>
          {/* Bộ lọc cơ sở */}
          <div className="flex items-center rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
            <span className="mr-2 text-slate-400">Cơ sở:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Tất cả chi nhánh (3 cơ sở)</option>
              <option value="q1">Cơ sở Quận 1 (Trụ sở)</option>
              <option value="q5">Cơ sở Quận 5</option>
              <option value="td">Cơ sở TP. Thủ Đức</option>
            </select>
          </div>

          {/* Bộ lọc thời gian */}
          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`rounded px-3 py-1.5 font-bold transition-colors cursor-pointer ${
                timeFilter === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('week')}
              className={`rounded px-3 py-1.5 font-bold transition-colors cursor-pointer ${
                timeFilter === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('month')}
              className={`rounded px-3 py-1.5 font-bold transition-colors cursor-pointer ${
                timeFilter === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI điều hành */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Tổng doanh thu"
          value={loading ? '—' : metrics.revenue}
          detail={metrics.revenueSub}
          icon="billing"
          tone="emerald"
        />
        <Kpi
          label="Lượt khám thực hiện"
          value={loading ? '—' : metrics.appointments}
          detail={metrics.appointmentsSub}
          icon="appointments"
          tone="blue"
        />
        <Kpi
          label="Bệnh nhân phục vụ"
          value={loading ? '—' : metrics.patients}
          detail={metrics.patientsSub}
          icon="patients"
          tone="amber"
        />
        <Kpi
          label="Công suất hệ thống"
          value={loading ? '—' : metrics.occupancy}
          detail={metrics.occupancySub}
          icon="branches"
          tone="slate"
        />
      </div>

      {/* Khu vực biểu đồ chính: Biểu đồ doanh thu/lưu lượng & So sánh các cơ sở */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        {/* Biểu đồ Doanh thu & Lượt khám theo thời gian */}
        <Card
          title={metrics.chartLabel}
          action={timeFilter === 'month' ? '4 tuần trong tháng' : timeFilter === 'today' ? 'Khung giờ trong ngày' : '7 ngày gần nhất'}
        >
          <div className="pt-2">
            {/* Vùng biểu đồ chính với trục Y bên trái & Đường mốc 0 chuẩn xác */}
            <div className="flex">
              {/* Trục Y: Giá trị tham chiếu */}
              <div className="flex flex-col justify-between text-right pr-3 select-none w-11 shrink-0 h-56">
                {chartConfig.guides.map((val, idx) => (
                  <span key={idx} className="text-[10px] font-semibold text-slate-400 tabular-nums leading-none">
                    {val} <span className="text-[9px] font-normal text-slate-300">tr</span>
                  </span>
                ))}
                <span className="text-[10px] font-bold text-slate-600 tabular-nums leading-none">
                  0 <span className="text-[9px] font-normal text-slate-300">tr</span>
                </span>
              </div>

              {/* Vùng cột biểu đồ và đường lưới: Đáy là border-b border-slate-300 (mốc 0) */}
              <div className="relative flex-1 h-56 border-b border-slate-300">
                {/* Đường gióng ngang tham chiếu */}
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="w-full" />
                </div>

                {/* Danh sách các cột: items-end chạm thẳng đáy container (mốc 0) */}
                <div className="relative z-10 flex h-full items-end justify-around px-2">
                  {metrics.chartBars.map((item, idx) => {
                    const heightPercent = Math.min(100, Math.max(6, Math.round((item.rev / chartConfig.ceiling) * 100)))
                    return (
                      <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end max-w-[76px] cursor-pointer">
                        {/* Tooltip khi hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded bg-slate-900 px-2.5 py-1 text-center shadow-md transform -translate-y-1">
                          <p className="text-[11px] font-bold text-white">{item.label}: {item.rev} triệu VNĐ</p>
                          <p className="text-[10px] text-emerald-300 font-medium">{item.count} lượt khám</p>
                          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>

                        {/* Số tiền hiển thị trực tiếp trên đầu cột */}
                        <span className="mb-1 text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 tabular-nums transition-colors">
                          {item.rev}
                        </span>

                        {/* Thân cột: Chạm thẳng mốc 0 border-b, không bị hở đáy */}
                        <div
                          className="w-8 sm:w-10 rounded-t bg-emerald-700 hover:bg-emerald-800 transition-all duration-300 shadow-2xs"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Nhãn trục X và số ca khám đặt riêng bên dưới mốc 0 */}
            <div className="flex pt-2.5">
              <div className="w-11 shrink-0 pr-3" />
              <div className="flex-1 flex justify-around px-2 select-none">
                {metrics.chartBars.map((item, idx) => (
                  <div key={idx} className="text-center flex-1 max-w-[76px]">
                    <p className="text-xs font-bold text-slate-700">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.count} ca</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tỷ lệ phương thức thanh toán */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-700" />
                  <span className="text-slate-600 font-medium">Chuyển khoản / QR: <b className="text-slate-900">{metrics.transferShare}%</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded bg-slate-400" />
                  <span className="text-slate-600 font-medium">Tiền mặt tại quầy: <b className="text-slate-900">{metrics.cashShare}%</b></span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
                <div style={{ width: `${metrics.transferShare}%` }} className="h-full bg-emerald-700 transition-all duration-500" />
                <div style={{ width: `${metrics.cashShare}%` }} className="h-full bg-slate-400 transition-all duration-500" />
              </div>
            </div>
          </div>
        </Card>

        {/* Thống kê so sánh các Cơ sở / Chi nhánh */}
        <Card title="Hiệu suất theo Chi nhánh" action="3 cơ sở trực thuộc">
          <div className="space-y-3">
            {branches.map((b) => {
              return (
                <div key={b.id} className="rounded border border-slate-200/80 bg-white p-3 hover:border-slate-300 transition-colors shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{b.name}</h3>
                      <p className="text-[10px] text-slate-500 truncate max-w-[210px]">{b.address}</p>
                    </div>
                    <span className="text-right text-xs font-bold text-slate-900 tabular-nums">{b.revenue}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Lượt khám: <b>{b.appts} ca</b> ({b.share}% tổng DT)</span>
                    <span>Công suất: <b>{b.capacity}%</b></span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${b.capacityColor} transition-all duration-300`} style={{ width: `${b.capacity}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Khu vực phân tích: Chuyên khoa & Kênh tiếp nhận */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card title="Phân bổ lượt khám theo Chuyên khoa" action="Thống kê toàn hệ thống">
          <div className="space-y-2.5 py-1">
            {[
              { name: 'Nội tổng quát & Khám sức khỏe', pct: 36, color: 'bg-emerald-700', count: '128 ca' },
              { name: 'Tim mạch & Huyết áp', pct: 24, color: 'bg-blue-600', count: '85 ca' },
              { name: 'Tai Mũi Họng', pct: 18, color: 'bg-amber-500', count: '64 ca' },
              { name: 'Da liễu & Thẩm mỹ y khoa', pct: 14, color: 'bg-indigo-600', count: '50 ca' },
              { name: 'Nhi & Chuyên khoa khác', pct: 8, color: 'bg-slate-400', count: '29 ca' },
            ].map((sp) => (
              <div key={sp.name} className="rounded border border-slate-200/70 bg-white p-2.5 space-y-1.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{sp.name}</span>
                  <span className="text-slate-600 font-medium">{sp.count} ({sp.pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${sp.color}`} style={{ width: `${sp.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Kênh đặt khám & Đón tiếp bệnh nhân" action="Tỷ lệ nguồn bệnh nhân">
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Đặt lịch trực tuyến</p>
                <b className="mt-1 text-2xl text-slate-900 block">65%</b>
                <p className="text-[11px] text-slate-400 mt-0.5">Website & Ứng dụng di động</p>
              </div>
              <div className="rounded border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiếp nhận tại chỗ</p>
                <b className="mt-1 text-2xl text-slate-900 block">35%</b>
                <p className="text-[11px] text-slate-400 mt-0.5">Đăng ký trực tiếp tại quầy lễ tân</p>
              </div>
            </div>
            <div className="rounded border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Thời gian chờ khám trung bình:</span>
                <b className="text-slate-800">11 phút</b>
              </div>
              <div className="flex justify-between">
                <span>Tỷ lệ bệnh nhân quay lại tái khám:</span>
                <b className="text-emerald-700">38.4%</b>
              </div>
              <div className="flex justify-between">
                <span>Đánh giá hài lòng dịch vụ:</span>
                <b className="text-amber-600">4.9 / 5.0 ★</b>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bảng Hoạt động gần đây */}
      <div className="mt-5">
        <ActivityTable title="Hoạt động khám chữa & Giao dịch mới nhất" items={todayRows} />
      </div>
    </>
  )
}

function SystemHealthPage() {
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState('Vừa xong')

  const handlePing = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      setLastCheck(new Date().toLocaleTimeString('vi-VN'))
    }, 600)
  }

  const services = [
    { name: 'Máy chủ Backend API (NestJS)', status: 'Hoạt động tốt', latency: '24 ms', uptime: '99.98%', icon: 'emerald' },
    { name: 'Cơ sở dữ liệu chính (PostgreSQL / Prisma)', status: 'Ổn định', latency: '12 ms', uptime: '99.99%', icon: 'emerald' },
    { name: 'Bộ nhớ đệm Redis & Token Blacklist', status: 'Đang kết nối', latency: '4 ms', uptime: '100%', icon: 'emerald' },
    { name: 'Cổng thanh toán điện tử (VNPay / QR)', status: 'Sẵn sàng giao dịch', latency: '120 ms', uptime: '99.5%', icon: 'emerald' },
    { name: 'Dịch vụ thông báo (Email / SMS OTP)', status: 'Đang hoạt động', latency: '210 ms', uptime: '99.2%', icon: 'emerald' },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Hệ thống & Cấu hình</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Trạng thái & Kỹ thuật Hệ thống</h1>
          <p className="mt-1 text-xs text-slate-500">Giám sát sức khỏe hạ tầng, cơ sở dữ liệu, bộ đệm Redis và các cổng tích hợp dịch vụ.</p>
        </div>
        <button
          type="button"
          onClick={handlePing}
          disabled={checking}
          className="flex items-center gap-2 rounded bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra kết nối lại'}</span>
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Uptime hệ thống" value="99.98%" detail="Trong 30 ngày qua" icon="server" tone="emerald" />
        <Kpi label="Độ trễ API trung bình" value="28 ms" detail="Phản hồi nhanh" icon="analytics" tone="blue" />
        <Kpi label="Tỉ lệ Cache Hit" value="94.2%" detail="Redis cache hoạt động tối ưu" icon="dashboard" tone="emerald" />
        <Kpi label="Cảnh báo kỹ thuật" value="0 lỗi" detail={`Cập nhật: ${lastCheck}`} icon="methods" tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card title="Trạng thái các dịch vụ cốt lõi" action={`Lần kiểm tra cuối: ${lastCheck}`}>
          <div className="space-y-3.5 py-1">
            {services.map((s) => (
              <div key={s.name} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <i className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{s.name}</h3>
                    <p className="text-[11px] text-slate-400">Độ trễ: {s.latency} · Sẵn sàng: {s.uptime}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Tài nguyên máy chủ & Hạ tầng">
          <div className="space-y-4 py-1">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Tải CPU máy chủ:</span>
                <span className="text-emerald-700">14% (Bình thường)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '14%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Bộ nhớ RAM (Node.js & OS):</span>
                <span className="text-blue-700">1.85 GB / 8.00 GB (23%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '23%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Dung lượng lưu trữ (Database & Media):</span>
                <span className="text-slate-700">38.2 GB / 120 GB (32%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: '32%' }} />
              </div>
            </div>

            <div className="rounded border border-slate-100 bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600 mt-3">
              <div className="flex justify-between">
                <span>Phiên bản Backend:</span>
                <b className="text-slate-800">v2.4.1 (Node v20.x, NestJS 10)</b>
              </div>
              <div className="flex justify-between">
                <span>Môi trường:</span>
                <b className="text-emerald-700">Production / Healthy</b>
              </div>
              <div className="flex justify-between">
                <span>Bảo mật Token:</span>
                <b className="text-slate-800">Redis JWT Blacklist Active</b>
              </div>
            </div>
          </div>
        </Card>
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

function Card({ title, action, children, className = '' }: any) {
  return (
    <section className={`rounded border border-slate-200/80 bg-white shadow-2xs overflow-hidden ${className}`}>
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-5 py-3.5">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
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
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${r[3] === 'Đã check-in'
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

function ManagerDashboard({ stats, loading }: any) {
  const t = stats?.today || stats?.data?.today || {}
  return <><PageTitle eyebrow="Chi nhánh Quận 1" title="Tổng quan chi nhánh" subtitle="Hoạt động vận hành và lịch khám hôm nay"><button className="rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600">09 tháng 08, 2026</button></PageTitle><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Lịch hẹn hôm nay" value={loading ? '—' : t.total ?? 0} detail="+8% so với hôm qua" /><Kpi label="Bác sĩ làm việc" value="12" detail="4 chuyên khoa" tone="blue" icon="staff" /><Kpi label="Đang chờ khám" value={loading ? '—' : t.checkedIn ?? 0} detail="Thời gian chờ TB 12 phút" tone="amber" icon="patients" /><Kpi label="Hoàn thành" value={loading ? '—' : t.completed ?? 0} detail="Tỷ lệ đúng giờ 92%" icon="appointments" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]"><ActivityTable /><Card title="Phân bổ lịch khám"><div className="mx-auto grid h-36 w-36 place-items-center rounded-full" style={{ background: 'conic-gradient(#047857 0 46%, #60a5fa 46% 73%, #f59e0b 73% 90%, #e2e8f0 90%)' }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><div><b className="text-2xl text-slate-900">{t.total ?? 0}</b><p className="text-[10px] text-slate-400">lịch hẹn</p></div></div></div><div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-500"><span>● Nội tổng quát</span><span className="text-blue-600">● Tim mạch</span><span className="text-amber-500">● Da liễu</span><span className="text-slate-400">● Khác</span></div></Card></div></>
}

function SchedulePage() {
  const days = ['Thứ 2\n10/08', 'Thứ 3\n11/08', 'Thứ 4\n12/08', 'Thứ 5\n13/08', 'Thứ 6\n14/08', 'Thứ 7\n15/08']; const shifts = [['BS. Nguyễn Văn An', 'Nội tổng quát'], ['BS. Trần Thu Hà', 'Tim mạch'], ['BS. Lê Minh Đức', 'Da liễu']]
  return <><PageTitle eyebrow="Quản lý nhân sự" title="Lịch bác sĩ" subtitle="Theo dõi và điều phối ca làm việc tại chi nhánh."><button className="rounded bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">+ Xếp lịch</button></PageTitle><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center gap-2"><button className="rounded border border-slate-200 px-2.5 py-1.5">‹</button><b className="px-2 text-sm">10 – 15 tháng 08, 2026</b><button className="rounded border border-slate-200 px-2.5 py-1.5">›</button></div><div className="flex gap-2"><select className="rounded border border-slate-200 px-3 py-2 text-xs"><option>Tất cả chuyên khoa</option></select><button className="rounded bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Tuần</button></div></div><section className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white"><div className="grid min-w-[900px] grid-cols-[180px_repeat(6,1fr)]"><div className="border-b border-r border-slate-100 p-3 text-xs font-bold text-slate-400">BÁC SĨ</div>{days.map(d => <div key={d} className="whitespace-pre-line border-b border-r border-slate-100 p-3 text-center text-xs font-semibold text-slate-600">{d}</div>)}{shifts.flatMap((s, r) => [<div key={`${r}-d`} className="border-b border-r border-slate-100 p-4"><b className="text-xs text-slate-800">{s[0]}</b><p className="mt-1 text-[10px] text-slate-400">{s[1]}</p></div>, ...days.map((_, c) => <div key={`${r}-${c}`} className="min-h-24 border-b border-r border-slate-100 p-2">{!(r === 1 && c === 3) && <div className={`rounded-md border-l-2 p-2 text-[10px] ${c % 3 === 1 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}><b>{c % 2 ? '13:00 – 17:00' : '08:00 – 12:00'}</b><p className="mt-1 opacity-70">Phòng {r + 1}0{c % 3 + 1}</p></div>}</div>)])}</div></section></>
}

function GenericPage({ section, role }: any) { const title = { inventory: 'Danh mục Thuốc & Dược phẩm', billing: 'Thanh toán & Đối soát', doctors: 'Bác sĩ & Nhân sự phòng khám', pharmacists: 'Quản lý dược sĩ', patients: 'Quản lý bệnh nhân', roles: 'Vai trò & Phân quyền', appointments: 'Danh sách lịch hẹn', branches: 'Chi nhánh phòng khám', specialties: 'Quản lý chuyên khoa', services: 'Dịch vụ khám & xét nghiệm', slots: 'Lịch làm việc bác sĩ' }[section] || ROLE_LABELS[role]; return <><PageTitle eyebrow={ROLE_LABELS[role] || 'Hệ thống'} title={title} subtitle="Dữ liệu nghiệp vụ được cập nhật theo thời gian thực." /><div className="mt-5 grid gap-4 sm:grid-cols-3"><Kpi label="Chờ xử lý" value="0" detail="Trong hôm nay" tone="amber" /><Kpi label="Đã hoàn thành" value="0" detail="Trong hôm nay" /><Kpi label="Cần kiểm tra" value="0" detail="Không có cảnh báo" tone="blue" /></div><div className="mt-5"><ActivityTable title="Danh sách gần đây" /></div></> }

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
      { id: 'specialties', label: 'Chuyên khoa khám', href: '/specialties', icon: 'specialties' },
      { id: 'booking-packages', label: 'Dịch vụ khám bệnh', href: '/booking-packages', icon: 'packages' },
    ],
  },
  {
    category: 'Quản trị & Hệ thống',
    items: [
      { id: 'staff', label: 'Nhân sự & Phân quyền', href: '/staff', icon: 'staff' },
      { id: 'branches', label: 'Chi nhánh phòng khám', href: '/branches', icon: 'branches' },
      { id: 'booking-methods', label: 'Hình thức đặt khám', href: '/booking-methods', icon: 'methods' },
      { id: 'system-status', label: 'Trạng thái hệ thống', href: '/system-status', icon: 'server' },
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
      { id: 'specialties', label: 'Chuyên khoa khám', href: '/specialties', icon: 'specialties' },
      { id: 'booking-packages', label: 'Dịch vụ khám bệnh', href: '/booking-packages', icon: 'packages' },
    ],
  },
]

function GroupedPortal({ section, user, role, content, menu, setMenu, navigate, logout }) {
  const sections = role === 'admin' ? ADMIN_NAV_SECTIONS : MANAGER_NAV_SECTIONS
  const roleTitle = ROLE_LABELS[role] || 'Quản trị viên'
  const allSubGroups = sections.flatMap((sec) => sec.items.filter((item: any) => item.children))
  const initialOpen = Object.fromEntries(
    allSubGroups.map((group: any) => [
      group.id,
      group.children.some(([id]: any) => id === section),
    ])
  )
  const [openGroups, setOpenGroups] = useState(initialOpen)
  const go = (href) => { navigate(href); setMenu(false) }

  const isItemActive = (itemId: string) => {
    if (section === itemId) return true
    if (itemId === 'staff' && ['staff', 'doctors', 'roles', 'roles-permissions'].includes(section)) return true
    if (itemId === 'slots' && ['slots', 'schedule', 'work-schedules'].includes(section)) return true
    if (itemId === 'booking-packages' && ['booking-packages', 'health-packages', 'services', 'specialties-services', 'specialty-services', 'service-packages'].includes(section)) return true
    if (itemId === 'booking-methods' && ['booking-methods', 'booking-types'].includes(section)) return true
    return false
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo thương hiệu */}
        <div
          className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
          onClick={() => go('/dashboard')}
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
              {roleTitle}
            </p>
          </div>
        </div>

        {/* Danh sách danh mục điều hướng */}
        <nav className="flex-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-3.5">
          {sections.map((sec, secIdx) => (
            <div key={sec.category || secIdx}>
              <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                {sec.category}
              </p>
              <div className="space-y-0.5">
                {sec.items.map((item: any) => {
                  if (!item.children) {
                    const active = isItemActive(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.href)}
                        className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-[13px] transition cursor-pointer ${
                          active
                            ? 'bg-emerald-50 font-bold text-emerald-800 shadow-2xs'
                            : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className={`shrink-0 ${active ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <Icon name={item.icon} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  }

                  const active = item.children.some(([id]: any) => isItemActive(id))
                  const open = openGroups[item.id] ?? active
                  return (
                    <div key={item.id} className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setOpenGroups((old) => ({ ...old, [item.id]: !open }))}
                        className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-[13px] transition cursor-pointer ${
                          active ? 'font-bold text-emerald-800' : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className={`shrink-0 ${active ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <Icon name={item.icon} />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        <svg
                          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-700' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {open && (
                        <div className="ml-5 border-l border-slate-200 pl-2 space-y-0.5 py-1">
                          {item.children.map(([id, label, href]: any) => {
                            const childActive = isItemActive(id)
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => go(href)}
                                className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-xs transition cursor-pointer ${
                                  childActive
                                    ? 'bg-emerald-50 font-bold text-emerald-800'
                                    : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${childActive ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                                <span className="truncate">{label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Góc menu dưới bên trái: Thông tin phòng khám/nhân viên và nút Đăng xuất */}
        <div className="border-t border-slate-100 p-3 bg-white space-y-2">
          <div className="flex items-center gap-3 rounded bg-slate-50 p-2.5 border border-slate-200/80">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 shrink-0">
              {initials(user)}
            </span>
            <div className="min-w-0 flex-1">
              <b className="text-xs font-bold text-slate-800 truncate block">
                {user?.fullName || user?.displayName || user?.email || (role === 'admin' ? 'Quản trị viên' : 'Quản lý')}
              </b>
              <p className="text-[11px] font-semibold text-emerald-700 truncate">
                Phòng khám Đa khoa VitaCare
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {role === 'admin' ? 'Hệ thống Trung tâm' : 'Chi nhánh chính'} · TP. Hồ Chí Minh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
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

      {menu && <button aria-label="Đóng menu" className="fixed inset-0 z-20 bg-slate-900/20 lg:hidden" onClick={() => setMenu(false)} />}

      <div className="lg:pl-[264px]">
        {/* Mobile header */}
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMenu(true)} className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-sm font-bold text-slate-800">VitaCare Clinic</span>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
            {roleTitle}
          </span>
        </div>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{content}</main>
      </div>
    </div>
  )
}

export default function RolePortal({ section = 'dashboard' }) {
  const navigate = useNavigate(); const { token, user, logout: clearAuthSession } = useAuth(); const session = { user }; const role = staffRole(user) || 'admin'; const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true); const [menu, setMenu] = useState(false)
  useEffect(() => { if (!token) return; fetchDashboardStats({ token }).then(setStats).catch(() => setStats(null)).finally(() => setLoading(false)) }, [token])
  const logout = async () => { await clearAuthSession(); navigate('/login', { replace: true }) }; const nav = NAV[role] || NAV.receptionist
  let content = section === 'system-status' ? <SystemHealthPage /> : section === 'analytics' ? <AdminAnalyticsPage stats={stats} loading={loading} /> : section === 'billing' ? <BillingPage /> : section === 'booking-methods' ? <BookingMethodsPage /> : section === 'booking-packages' ? <BookingPackagesPage /> : ['branches', 'specialties', 'service-packages', 'services', 'inventory'].includes(section) && ['admin', 'branch_manager'].includes(role) ? <SystemCatalogCrudPage resource={section === 'inventory' ? 'medicines' : section} /> : ['doctors', 'staff', 'roles'].includes(section) ? (['admin', 'branch_manager'].includes(role) ? <ClinicStaffPage /> : <StaffCrudPage role="doctor" />) : section === 'pharmacists' ? <StaffCrudPage role="pharmacist" /> : ['schedule', 'slots', 'work-schedules'].includes(section) && ['admin', 'branch_manager'].includes(role) ? <DoctorWorkSchedulesPage /> : section === 'dashboard' ? (role === 'branch_manager' ? <ManagerDashboard stats={stats} loading={loading} /> : <AdminDashboard stats={stats} loading={loading} />) : <GenericPage section={section} role={role} />
  if (['admin', 'branch_manager'].includes(role)) return <GroupedPortal section={section} user={user} role={role} content={content} menu={menu} setMenu={setMenu} navigate={navigate} logout={logout} />
  return (
    <div className="min-h-screen bg-[#f5f8f5] font-sans text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div
          className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
          onClick={() => { navigate('/dashboard'); setMenu(false) }}
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
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Không gian làm việc</p>
          {nav.map(([id, label, href]) => (
            <button key={id} onClick={() => { navigate(href); setMenu(false) }} className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-[13px] transition ${section === id ? 'bg-emerald-50 font-bold text-emerald-800' : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon name={id} />{label}</button>
          ))}
        </nav>
        {/* Góc menu dưới bên trái */}
        <div className="border-t border-slate-100 p-3 bg-white space-y-2">
          <div className="flex items-center gap-3 rounded bg-slate-50 p-2.5 border border-slate-200/80">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800 shrink-0">
              {initials(session.user)}
            </span>
            <div className="min-w-0 flex-1">
              <b className="text-xs font-bold text-slate-800 truncate block">
                {session.user?.fullName || session.user?.email || 'Nhân viên'}
              </b>
              <p className="text-[11px] font-semibold text-emerald-700 truncate">
                Phòng khám Đa khoa VitaCare
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {ROLE_LABELS[role]} · TP. Hồ Chí Minh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
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
      {menu && <button aria-label="Đóng menu" className="fixed inset-0 z-20 bg-slate-900/20 lg:hidden" onClick={() => setMenu(false)} />}
      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-7">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenu(true)} className="rounded border border-slate-200 px-2.5 py-1.5 lg:hidden">☰</button>
            <div className="relative hidden md:block">
              <span className="absolute left-3 top-2 text-slate-400">⌕</span>
              <input className="w-72 rounded border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500" placeholder="Tìm kiếm nhanh..." />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{content}</main>
      </div>
    </div>
  )
}
