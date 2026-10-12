'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useAuth } from '@/common/hooks/useAuth'
import { fetchDashboardStats, AdminAnalyticsPage, Sparkline, DonutChart, KpiMetricCard, SectionCard as Card } from '@/modules/analytics'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StaffCrudPage, ClinicStaffPage, RolesPermissionsPage } from '@/modules/staff'
import { SystemCatalogCrudPage, BookingMethodsPage, BookingPackagesPage } from '@/modules/catalog'
import { DoctorWorkSchedulesPage } from '@/modules/doctor'
import { BillingPage } from '@/modules/billing'
import { AdminAppointmentsPage } from '@/modules/appointments'
import { AdminPatientsPage } from '@/modules/patients'
import { ReceptionPatientsPage } from '@/modules/reception'
import { staffRole } from '@/modules/admin/utils/staffSession'
import { AdminModal, AdminButton } from '@/common/components/ui'
import SystemAdminDashboard from '../components/SystemAdminDashboard'
import SystemLogsPage from '../components/SystemLogsPage'
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
  MapPin,
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
  Clock,
  Eye,
  Phone,
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
    ['dashboard', 'Tổng quan hệ thống', '/dashboard'],
    ['branches', 'Chi nhánh phòng khám', '/branches'],
    ['booking-methods', 'Hình thức đặt khám', '/booking-methods'],
    ['staff', 'Tài khoản & Nhân sự', '/staff'],
    ['roles', 'Vai trò & Phân quyền', '/roles-permissions'],
    ['system-logs', 'Nhật ký & Lỗi hệ thống', '/system-logs'],
  ],
  branch_manager: [
    ['dashboard', 'Tổng quan chi nhánh', '/dashboard'],
    ['analytics', 'Báo cáo & Tăng trưởng', '/analytics'],
    ['appointments', 'Danh sách lịch hẹn', '/appointments'],
    ['patients', 'Hồ sơ bệnh nhân', '/patients'],
    ['slots', 'Lịch làm việc bác sĩ', '/work-schedules'],
    ['billing', 'Thanh toán & Doanh thu', '/billing'],
    ['branches', 'Thông tin chi nhánh', '/branches'],
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
    ['schedule', 'Lịch khám', '/doctor'],
    ['waiting', 'Chờ khám bệnh', '/doctor?view=waiting'],
    ['slots', 'Lịch làm việc', '/doctor?view=schedule'],
    ['history', 'Lịch sử bệnh nhân', '/doctor?view=history'],
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

function ActivityTable({
  title = 'Lịch hẹn hôm nay',
  items = [],
  actionHref = '/appointments',
}: {
  title?: string
  items?: any[]
  actionHref?: string
}) {
  const navigate = useNavigate()
  const [selectedDetail, setSelectedDetail] = useState<any>(null)

  const formatStatus = (status: string) => {
    const s = String(status || '').toUpperCase()
    if (s === 'COMPLETED' || s === 'EXAMINED') {
      return { label: 'Đã khám', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    }
    if (s === 'CHECKED_IN' || s === 'WAITING') {
      return { label: 'Đang chờ khám', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' }
    }
    if (s === 'CONFIRMED') {
      return { label: 'Đã tiếp nhận', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' }
    }
    if (s === 'IN_CONSULTATION' || s === 'EXAMINING') {
      return { label: 'Đang khám', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    }
    if (s === 'CANCELLED') {
      return { label: 'Đã hủy', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' }
    }
    return { label: 'Chờ xử lý', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' }
  }

  const actionNode = (
    <button
      type="button"
      onClick={() => navigate(actionHref)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition"
    >
      <span>Xem tất cả</span>
      <span aria-hidden="true">→</span>
    </button>
  )

  return (
    <>
      <Card title={title} action={actionNode}>
        {items.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">Chưa có lịch hẹn nào ghi nhận trong ca trực hôm nay</p>
        ) : (
          <div className="-m-5 overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Mã vé / Đặt hẹn</th>
                  <th className="px-5 py-3">Bệnh nhân</th>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Bác sĩ & Phòng khám</th>
                  <th className="px-5 py-3">Thanh toán</th>
                  <th className="px-5 py-3 text-center">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it: any, i: number) => {
                  const statusInfo = formatStatus(it.status)
                  const bookingCode = it.bookingCode || it.ticket || '—'
                  const patientName = it.patientName || it.patientProfile?.fullName || 'Bệnh nhân'
                  const patientPhone = it.patientPhone || it.patientProfile?.phoneNumber || ''
                  const doctorName = it.doctorName || (it.doctor?.fullName ? `BS. ${it.doctor.fullName}` : 'Khám tổng quát')
                  const clinicRoom = it.clinicRoom || it.room?.name || it.room?.code || 'Chưa xếp phòng'
                  const timeDisplay = it.startTime ? `${it.startTime}${it.endTime ? ` – ${it.endTime}` : ''}` : '08:00'
                  const isPaid = it.isPaid ?? (it.invoice?.status === 'PAID')
                  const amount = it.amount || it.invoice?.totalAmount || 0

                  return (
                    <tr
                      key={it.id || i}
                      onClick={() => setSelectedDetail(it)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Cột 1: Mã vé / Đặt hẹn */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                            {bookingCode}
                          </span>
                          {it.queueNumber != null && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              STT: #{it.queueNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Bệnh nhân */}
                      <td className="px-5 py-3.5">
                        <strong className="text-xs font-semibold text-slate-900 block group-hover:text-emerald-800 transition-colors">
                          {patientName}
                        </strong>
                        {patientPhone ? (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{patientPhone}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5">Bệnh nhân tiếp đón</p>
                        )}
                      </td>

                      {/* Cột 3: Thời gian */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{timeDisplay}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                          {it.startTime && it.startTime < '12:00' ? 'Ca sáng' : it.startTime && it.startTime >= '17:30' ? 'Ca tối' : 'Ca chiều'}
                        </span>
                      </td>

                      {/* Cột 4: Bác sĩ & Phòng khám */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800 text-xs">{doctorName}</p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                          <DoorOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[150px]" title={clinicRoom}>{clinicRoom}</span>
                        </p>
                      </td>

                      {/* Cột 5: Thanh toán */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Đã thu' : 'Chưa thu'}
                        </span>
                        {amount > 0 && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 font-mono">
                            {amount.toLocaleString('vi-VN')} đ
                          </p>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDetail(it)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold cursor-pointer transition shadow-2xs"
                          title="Xem chi tiết ca hẹn"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <AdminModal
          isOpen={Boolean(selectedDetail)}
          onClose={() => setSelectedDetail(null)}
          title={`Chi tiết lịch hẹn: ${selectedDetail.bookingCode || selectedDetail.ticket || '—'}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã đặt hẹn</span>
                <p className="text-sm font-mono font-bold text-emerald-800">
                  {selectedDetail.bookingCode || selectedDetail.ticket || '—'}
                </p>
              </div>
              {selectedDetail.queueNumber != null && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số thứ tự khám</span>
                  <p className="text-sm font-bold text-slate-800">
                    STT: #{selectedDetail.queueNumber}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded border border-slate-200 bg-white">
                <p className="text-slate-400 text-[11px]">Bệnh nhân</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedDetail.patientName || 'Bệnh nhân'}</p>
                {selectedDetail.patientPhone && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedDetail.patientPhone}</p>
                )}
              </div>

              <div className="p-2.5 rounded border border-slate-200 bg-white">
                <p className="text-slate-400 text-[11px]">Bác sĩ phụ trách</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedDetail.doctorName || 'BS. Trực'}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{selectedDetail.clinicRoom || 'Chưa xếp phòng'}</p>
              </div>

              <div className="p-2.5 rounded border border-slate-200 bg-white">
                <p className="text-slate-400 text-[11px]">Khung giờ khám</p>
                <p className="font-bold text-emerald-800 mt-0.5">
                  {selectedDetail.startTime ? `${selectedDetail.startTime}${selectedDetail.endTime ? ` – ${selectedDetail.endTime}` : ''}` : '08:00'}
                </p>
              </div>

              <div className="p-2.5 rounded border border-slate-200 bg-white">
                <p className="text-slate-400 text-[11px]">Cơ sở khám bệnh</p>
                <p className="font-bold text-slate-900 mt-0.5 truncate">{selectedDetail.branchName || 'VitaCare Clinic'}</p>
              </div>

              <div className="p-2.5 rounded border border-slate-200 bg-white">
                <p className="text-slate-400 text-[11px]">Tình trạng viện phí</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${selectedDetail.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {selectedDetail.isPaid ? 'Đã thu tiền' : 'Chưa thu tiền'}
                  </span>
                  {selectedDetail.amount > 0 && (
                    <span className="font-semibold text-slate-700 font-mono">{selectedDetail.amount.toLocaleString('vi-VN')} đ</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded border border-slate-200 bg-white">
                <p className="text-slate-400 text-[11px]">Trạng thái lịch hẹn</p>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${formatStatus(selectedDetail.status).badgeClass}`}>
                    {formatStatus(selectedDetail.status).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedDetail(null)
                  navigate('/appointments')
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Mở trong Quản lý lịch hẹn</span>
                <span aria-hidden="true">→</span>
              </button>
              <AdminButton variant="secondary" onClick={() => setSelectedDetail(null)}>
                Đóng
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </>
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
        cashAmount: cash,
        transferAmount: transfer,
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
        cashAmount: cash,
        transferAmount: transfer,
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
      cashAmount: cash,
      transferAmount: transfer,
    }
  }, [timeFilter, revTodayObj, revWeekObj, revMonthObj, todayCounts, weekCounts, monthCounts, stats])

  // Tính trần hiển thị linh hoạt để biểu đồ đạt độ cao đẹp mắt (~75-80%), tránh bị lùn và trống trải
  const maxBarRev = Math.max(...(metrics.chartBars.map((b: any) => Number(b.rev) || 0) || [0]), 0.1)
  const ceiling = maxBarRev * 1.35
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
        <KpiMetricCard
          label="Tổng doanh thu"
          value={loading ? '—' : metrics.revenue}
          detail={metrics.revenueSub}
          tone="emerald"
          sparklineData={metrics.chartBars.map((b: any) => b.rev)}
        />
        <KpiMetricCard
          label="Lượt khám thực hiện"
          value={loading ? '—' : metrics.appointments}
          detail={metrics.appointmentsSub}
          tone="blue"
          sparklineData={metrics.chartBars.map((b: any) => b.count)}
        />
        <KpiMetricCard
          label="Bệnh nhân phục vụ"
          value={loading ? '—' : metrics.patients}
          detail={metrics.patientsSub}
          tone="amber"
          sparklineData={metrics.chartBars.map((b: any) => (b.patients != null ? b.patients : b.count))}
        />
        <KpiMetricCard
          label="Công suất buồng khám"
          value={loading ? '—' : metrics.occupancy}
          detail={metrics.occupancySub}
          tone="slate"
          sparklineData={metrics.chartBars.map((b: any) => (b.occupancy != null ? b.occupancy : (b.count > 0 ? 75 : 0)))}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card title={metrics.chartLabel} action={timeFilter === 'month' ? '4 tuần trong tháng' : timeFilter === 'today' ? 'Khung giờ trong ngày' : '7 ngày gần nhất'}>
          {metrics.chartBars.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">Chưa có dữ liệu biểu đồ trong khoảng thời gian này</p>
          ) : (
            <div className="pt-2">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.chartBars}
                    margin={{ top: 18, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      unit=" tr"
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                            <p className="font-bold text-slate-900">{label}</p>
                            <p className="text-emerald-700 font-bold mt-0.5">Doanh thu: {d.rev} triệu VNĐ</p>
                            <p className="text-slate-500 text-[11px]">Lượt khám: {d.count} ca</p>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="rev"
                      fill="#047857"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                    >
                      <LabelList
                        dataKey="rev"
                        position="top"
                        formatter={(val: any) => `${val}`}
                        className="fill-slate-700 text-[10px] font-bold"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Thông tin tóm tắt vận hành */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span>Tổng doanh thu ghi nhận: <b className="text-slate-900">{metrics.revenue}</b></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span>Tổng ca khám: <b className="text-slate-800">{metrics.appointments}</b></span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Cột phải: Donut Chart Cơ cấu Kênh Thanh toán & Hiệu suất chi nhánh */}
        <div className="space-y-4 flex flex-col justify-between">
          <Card title="Cơ cấu Kênh Thanh toán" action="Thời gian thực">
            <DonutChart
              segments={[
                {
                  label: 'Chuyển khoản & QR',
                  value: metrics.transferAmount > 0 || metrics.cashAmount > 0 ? metrics.transferAmount : (metrics.transferShare > 0 ? metrics.transferShare : 100),
                  color: '#047857',
                  subLabel: `${Math.round(metrics.transferAmount || 0).toLocaleString('vi-VN')} đ`,
                },
                {
                  label: 'Tiền mặt tại quầy',
                  value: metrics.cashAmount > 0 ? metrics.cashAmount : (metrics.cashShare > 0 ? metrics.cashShare : 0),
                  color: '#0284c7',
                  subLabel: `${Math.round(metrics.cashAmount || 0).toLocaleString('vi-VN')} đ`,
                },
              ]}
              size={110}
              thickness={18}
              centerLabel="Thanh toán"
              centerValue="100%"
              layout="horizontal"
            />
          </Card>

          <Card title="Hiệu suất theo Chi nhánh" action="Hệ thống VitaCare Clinic">
            <div className="space-y-3">
              {(!stats?.branchComparison || stats.branchComparison.length === 0) ? (
                <p className="py-6 text-center text-xs text-slate-400">Chưa có dữ liệu cơ sở chi nhánh</p>
              ) : (
                stats.branchComparison.map((b: any) => (
                  <div key={b.id || b.name} className="rounded border border-slate-100 bg-slate-50/70 p-3 shadow-2xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between text-xs">
                      <h3 className="font-bold text-slate-900 truncate pr-2">{b.name}</h3>
                      <span className="font-bold text-slate-900 tabular-nums shrink-0">{b.rev}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Lượt khám: <b className="text-slate-700">{b.appts} ca</b></span>
                      <span>Công suất: <b className="text-slate-700">{b.cap}%</b></span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                      <div className={`h-full ${b.col}`} style={{ width: `${b.cap}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <ActivityTable title="Hoạt động khám & Tiếp nhận mới nhất" items={todayRows} />
      </div>
    </>
  )
}


function ManagerDashboard({ stats, loading, user }: any) {
  const t = stats?.appointments?.today || stats?.today || {}
  const rev = stats?.revenue?.today?.total != null
    ? `${Math.round(stats.revenue.today.total).toLocaleString('vi-VN')} đ`
    : '—'
  const todayRows = stats?.todayRows || []

  const assignedBranch =
    stats?.currentBranch ||
    user?.branchAssignments?.find((b: any) => b.isPrimary)?.branch ||
    user?.branchAssignments?.[0]?.branch ||
    null

  return (
    <>
      <div className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Chi nhánh quản lý</span>
              {assignedBranch ? (
                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  <Building2 className="w-3 h-3 text-emerald-700" />
                  Mã CS: {assignedBranch.code}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Toàn hệ thống
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Tổng quan: {assignedBranch?.name || 'Chi nhánh phòng khám'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{assignedBranch?.address || 'Hoạt động vận hành và lịch khám hôm nay theo thời gian thực.'}</span>
            </p>
          </div>

          {assignedBranch && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded px-4 py-3 shrink-0">
              <div className="grid h-10 w-10 place-items-center rounded bg-emerald-100 text-emerald-800 shrink-0">
                <Building2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">{assignedBranch.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {assignedBranch.phoneNumber ? `Hotline: ${assignedBranch.phoneNumber}` : 'Phạm vi quản lý cơ sở'} · VitaCare Clinic
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMetricCard label="Lịch hẹn hôm nay" value={loading ? '—' : `${t.total ?? 0} ca`} detail={`Đã khám: ${t.examined ?? 0} · Đang chờ: ${t.checkedIn ?? 0}`} tone="blue" />
        <KpiMetricCard label="Doanh thu hôm nay" value={loading ? '—' : rev} detail="Thu tiền mặt & chuyển khoản" tone="emerald" />
        <KpiMetricCard label="Đang chờ khám" value={loading ? '—' : `${t.checkedIn ?? 0} ca`} detail="Bệnh nhân đã tiếp đón vào phòng" tone="amber" />
        <KpiMetricCard label="Hoàn thành" value={loading ? '—' : `${t.examined ?? 0} ca`} detail="Đã hoàn tất ca khám và kê đơn" tone="emerald" />
      </div>
      <div className="mt-5">
        <ActivityTable title={`Lịch hẹn tại ${assignedBranch?.name || 'chi nhánh'} hôm nay`} items={todayRows} />
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
    category: 'Hệ thống & Cơ sở',
    items: [
      { id: 'dashboard', label: 'Tổng quan hệ thống', href: '/dashboard', icon: 'dashboard' },
      { id: 'branches', label: 'Chi nhánh phòng khám', href: '/branches', icon: 'branches' },
      { id: 'booking-methods', label: 'Hình thức đặt khám', href: '/booking-methods', icon: 'methods' },
    ],
  },
  {
    category: 'Tài khoản & Bảo mật',
    items: [
      { id: 'staff', label: 'Tài khoản & Nhân sự', href: '/staff', icon: 'staff' },
      { id: 'roles', label: 'Vai trò & Phân quyền', href: '/roles-permissions', icon: 'roles' },
    ],
  },
  {
    category: 'Giám sát & Vận hành',
    items: [
      { id: 'system-logs', label: 'Nhật ký & Lỗi hệ thống', href: '/system-logs', icon: 'server' },
    ],
  },
]

const MANAGER_NAV_SECTIONS = [
  {
    category: 'Giám sát & Doanh thu',
    items: [
      { id: 'dashboard', label: 'Tổng quan chi nhánh', href: '/dashboard', icon: 'dashboard' },
      { id: 'analytics', label: 'Báo cáo & Tăng trưởng', href: '/analytics', icon: 'analytics' },
      { id: 'billing', label: 'Thanh toán & Doanh thu', href: '/billing', icon: 'billing' },
      { id: 'branches', label: 'Thông tin chi nhánh', href: '/branches', icon: 'branches' },
    ],
  },
  {
    category: 'Vận hành khám chữa bệnh',
    items: [
      { id: 'appointments', label: 'Danh sách lịch hẹn', href: '/appointments', icon: 'appointments' },
      { id: 'slots', label: 'Lịch làm việc bác sĩ', href: '/work-schedules', icon: 'schedule' },
      { id: 'patients', label: 'Hồ sơ bệnh nhân', href: '/patients', icon: 'patients' },
    ],
  },
]

function GroupedPortal({ section, user, role, content, menu, setMenu, navigate, logout }: any) {
  const sections = role === 'admin' ? ADMIN_NAV_SECTIONS : MANAGER_NAV_SECTIONS
  const roleTitle = ROLE_LABELS[role] || 'Quản trị viên'
  const go = (href: string) => { navigate(href); setMenu(false) }

  const assignedBranch =
    user?.branchAssignments?.find((b: any) => b.isPrimary)?.branch ||
    user?.branchAssignments?.[0]?.branch ||
    null
  const branchName = assignedBranch?.name || null
  const branchCode = assignedBranch?.code || null

  return (
    <div className="min-h-screen bg-[#f5f8f5] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50/60 flex-1 min-w-0" onClick={() => go('/dashboard')}>
            <img src="/imgs/logo/logo2.png" alt="VitaCare Clinic" className="h-11 w-11 object-contain shrink-0" />
            <div className="min-w-0 flex-1">
              <strong className="text-sm font-extrabold text-emerald-800 tracking-tight block truncate">VitaCare Clinic</strong>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                {role === 'branch_manager' && branchName ? (
                  <span className="text-emerald-700 font-bold truncate block">{branchName}</span>
                ) : (
                  roleTitle
                )}
              </p>
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
            <span className="grid h-8 w-8 place-items-center rounded bg-emerald-100 text-xs font-bold text-emerald-800 shrink-0">{initials(user)}</span>
            <div className="min-w-0 flex-1">
              <strong className="text-xs font-bold text-slate-800 truncate block">{user?.fullName || user?.displayName || 'Nhân viên'}</strong>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {role === 'branch_manager' && branchName ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 truncate">
                    <Building2 className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span className="truncate">{branchName}</span>
                  </span>
                ) : (
                  `${roleTitle} · VitaCare`
                )}
              </p>
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
            <button onClick={() => setMenu(true)} className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 cursor-pointer" aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
            <span className="text-sm font-bold text-slate-800">VitaCare Clinic</span>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
            {role === 'branch_manager' && branchName ? branchName : roleTitle}
          </span>
        </div>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">
          {role === 'branch_manager' && branchName && section !== 'dashboard' && (
            <div className="mb-4 flex items-center justify-between rounded bg-emerald-50/70 border border-emerald-200/90 px-4 py-2.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Đang thao tác tại cơ sở: <strong>{branchName}</strong> {branchCode ? `(${branchCode})` : ''}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline">Phạm vi dữ liệu chi nhánh được phân công</span>
            </div>
          )}
          {content}
        </main>
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

  const managerBranchId =
    role === 'branch_manager'
      ? (user?.branchAssignments?.find((b: any) => b.isPrimary)?.branchId ||
         user?.branchAssignments?.[0]?.branchId ||
         user?.branchAssignments?.[0]?.branch?.id ||
         '')
      : undefined

  const content =
    section === 'system-logs' ? <SystemLogsPage /> :
      section === 'analytics' ? (role === 'admin' ? <SystemAdminDashboard /> : <AdminAnalyticsPage stats={stats} loading={loading} />) :
        section === 'roles' ? <RolesPermissionsPage /> :
          section === 'patients' ? (role === 'receptionist' ? <ReceptionPatientsPage /> : <AdminPatientsPage />) :
            section === 'appointments' ? <AdminAppointmentsPage /> :
              section === 'billing' ? <BillingPage /> :
                section === 'booking-methods' ? <BookingMethodsPage /> :
                  section === 'booking-packages' ? <BookingPackagesPage /> :
                    ['branches', 'rooms', 'specialties', 'service-packages', 'services', 'inventory'].includes(section) && ['admin', 'branch_manager'].includes(role) ? <SystemCatalogCrudPage resource={section === 'inventory' ? 'medicines' : section} /> :
                      ['doctors', 'staff'].includes(section) ? (['admin', 'branch_manager'].includes(role) ? <ClinicStaffPage /> : <StaffCrudPage role="doctor" />) :
                        ['schedule', 'slots', 'work-schedules'].includes(section) && ['admin', 'branch_manager'].includes(role) ? <DoctorWorkSchedulesPage initialBranchId={managerBranchId} /> :
                          section === 'dashboard' ? (role === 'branch_manager' ? <ManagerDashboard stats={stats} loading={loading} user={user} /> : (role === 'admin' ? <SystemAdminDashboard /> : <AdminDashboard stats={stats} loading={loading} />)) :
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

