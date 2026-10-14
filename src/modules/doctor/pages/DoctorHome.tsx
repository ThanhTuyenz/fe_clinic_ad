'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from '@/common/hooks/useNextNavigation'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Building2,
  CalendarDays,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  CalendarCheck,
  UserCheck,
  Video,
} from 'lucide-react'
import {
  listDoctorAppointments,
  finishExamAppointment,
  updateAppointmentStatus,
} from '@/modules/admin/services/appointments'
import DoctorWorkSchedulesPage from './DoctorWorkSchedulesPage'
import DoctorAppHeader from '../components/DoctorAppHeader'
import { getStaffSession, staffRole } from '@/modules/admin/utils/staffSession'
import { useAppointmentsSocket } from '@/modules/admin/hooks/useAppointmentsSocket'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatPatientAge(dob?: string) {
  if (!dob) return '—'
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const md = now.getMonth() - d.getMonth()
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 && age <= 120 ? `${age} tuổi` : String(d.getFullYear())
}

function formatGenderVi(gender?: string) {
  const g = String(gender || '').toLowerCase()
  if (g === 'male' || g === 'nam') return 'Nam'
  if (g === 'female' || g === 'nu' || g === 'nữ') return 'Nữ'
  return 'Khác'
}

function formatApptDateVi(val?: string) {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatTimeOnly(timeStr?: string) {
  if (!timeStr) return '—'
  const s = String(timeStr).trim()
  if (s.includes('T')) {
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  }
  return s.slice(0, 5)
}

function statusBadge(status?: string, workflowStatus?: string) {
  const st = String(status || '').toLowerCase()
  const wf = String(workflowStatus || '').toUpperCase()

  if (st === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Đã hủy
      </span>
    )
  }
  if (st === 'examined' || st === 'completed' || wf === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Đã khám
      </span>
    )
  }
  if (wf === 'CHECKED_IN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" /> Đã tiếp nhận
      </span>
    )
  }
  if (st === 'confirmed' || wf === 'CONFIRMED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" /> Chờ khám
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" /> Chờ xử lý
    </span>
  )
}

function paymentBadge(payment?: any, invoice?: any) {
  const isPaid = payment?.paid === true || String(payment?.status || invoice?.status || '').toLowerCase() === 'paid'
  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CreditCard className="w-3 h-3 shrink-0" /> Đã thu phí
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      <CreditCard className="w-3 h-3 shrink-0" /> Chưa thu phí
    </span>
  )
}

function isTelehealthDoctorAppt(item: any) {
  if (!item) return false
  return Boolean(
    item.isTelehealth ||
    item.bookingMethod?.code === 'ONLINE_CONSULTATION'
  )
}

export default function DoctorHome() {
  const { performLogout } = useStaffLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getStaffSession()
  const token = session?.token
  const user = session?.user
  const role = staffRole(user)

  const isHistoryView = location.search.includes('view=history')
  const isScheduleView = location.search.includes('view=schedule')
  const isWaitingView = location.search.includes('view=waiting')

  // State Appointments
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('') // '' = all dates, or 'YYYY-MM-DD'
  const [statusFilter, setStatusFilter] = useState<string>('') // '' = all statuses
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modal chi tiết
  const [detailAppt, setDetailAppt] = useState<any | null>(null)
  const [finishingId, setFinishingId] = useState<string | null>(null)

  const handleFinishExam = async (item: any) => {
    const patientName = item.patient?.fullName || 'bệnh nhân'
    if (!window.confirm(`Xác nhận hoàn thành lượt khám cho ${patientName}?`)) {
      return
    }
    setFinishingId(item.id)
    try {
      try {
        await finishExamAppointment({ appointmentId: item.id })
      } catch {
        await updateAppointmentStatus({ appointmentId: item.id, status: 'completed' })
      }
      if (detailAppt?.id === item.id) {
        setDetailAppt(null)
      }
      await loadAppointments({ silent: true })
    } catch (err: any) {
      alert(err?.message || 'Không thể hoàn thành lượt khám.')
    } finally {
      setFinishingId(null)
    }
  }

  // Redirect if not doctor
  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (role !== 'doctor' && role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [token, user, role, navigate])

  const loadAppointments = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)
      try {
        const rows = await listDoctorAppointments()
        setAppointments(Array.isArray(rows) ? rows : [])
        setError('')
      } catch (err: any) {
        setError(err?.message || 'Không thể tải lịch khám của bác sĩ.')
      } finally {
        if (!silent) setLoading(false)
        setRefreshing(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (!isScheduleView) {
      void loadAppointments({ silent: false })
    }
  }, [isScheduleView, loadAppointments])

  // Lắng nghe realtime
  useAppointmentsSocket({
    enabled: Boolean(token && role === 'doctor'),
    onAppointmentBooked: useCallback(() => {
      void loadAppointments({ silent: true })
    }, [loadAppointments]),
    onStatusChanged: useCallback(() => {
      void loadAppointments({ silent: true })
    }, [loadAppointments]),
  })

  // Lọc dữ liệu Lịch khám / Chờ khám / Lịch sử
  const filteredList = useMemo(() => {
    const list = appointments.filter((item) => {
      const st = String(item.status || '').toLowerCase()
      const wf = String(item.workflowStatus || '').toUpperCase()

      if (isHistoryView) {
        // Tab Lịch sử: chỉ hiển thị lịch đã khám xong
        if (!(st === 'examined' || st === 'completed' || wf === 'COMPLETED')) return false
      } else if (isWaitingView) {
        // Tab Chờ khám bệnh: CHỈ hiển thị các bệnh nhân ĐÃ TIẾP NHẬN / CHECKED IN tại phòng khám
        const isCheckedIn = wf === 'CHECKED_IN' || st === 'checked_in'
        if (!isCheckedIn) return false
      } else if (statusFilter) {
        // Tab Lịch khám: nếu người dùng chủ động chọn lọc trạng thái
        if (statusFilter === 'CHECKED_IN') {
          if (wf !== 'CHECKED_IN' && st !== 'checked_in') return false
        } else if (statusFilter === 'COMPLETED') {
          if (st !== 'examined' && st !== 'completed' && wf !== 'COMPLETED') return false
        } else if (statusFilter === 'CANCELLED') {
          if (st !== 'cancelled') return false
        } else if (statusFilter === 'CONFIRMED') {
          if (st !== 'confirmed' && wf !== 'CONFIRMED') return false
        } else if (statusFilter === 'PENDING') {
          if (st !== 'pending' && wf !== 'PENDING') return false
        }
      }

      // Lọc theo ngày
      if (dateFilter) {
        const d = String(item.appointmentDate || '').slice(0, 10)
        if (d !== dateFilter) return false
      }

      // Tìm kiếm từ khóa
      const q = searchTerm.trim().toLowerCase()
      if (q) {
        const ticket = String(item.ticket || item.bookingCode || '').toLowerCase()
        const patientName = String(item.patient?.fullName || '').toLowerCase()
        const patientCode = String(item.patient?.patientCode || '').toLowerCase()
        const phone = String(item.patient?.phone || '').toLowerCase()
        const match =
          ticket.includes(q) || patientName.includes(q) || patientCode.includes(q) || phone.includes(q)
        if (!match) return false
      }

      return true
    })

    if (isWaitingView) {
      // Ưu tiên sắp xếp danh sách chờ khám:
      // 1. Thời gian check-in tại quầy (checkedInAt) tăng dần (ai check-in trước khám trước)
      // 2. Số thứ tự khám (visitQueueNumber / queueNumber)
      // 3. Khung giờ khám (startTime)
      return [...list].sort((a, b) => {
        if (a.checkedInAt && b.checkedInAt) {
          const tA = new Date(a.checkedInAt).getTime()
          const tB = new Date(b.checkedInAt).getTime()
          if (tA !== tB) return tA - tB
        } else if (a.checkedInAt && !b.checkedInAt) {
          return -1
        } else if (!a.checkedInAt && b.checkedInAt) {
          return 1
        }

        const qA = Number(a.visitQueueNumber || a.queueNumber || 999999)
        const qB = Number(b.visitQueueNumber || b.queueNumber || 999999)
        if (qA !== qB) return qA - qB

        const timeA = String(a.startTime || '99:99')
        const timeB = String(b.startTime || '99:99')
        return timeA.localeCompare(timeB)
      })
    }

    return list
  }, [appointments, isHistoryView, isWaitingView, statusFilter, dateFilter, searchTerm])

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, page, pageSize])

  // Thống kê nhanh
  const stats = useMemo(() => {
    const checkedIn = appointments.filter((a) => {
      const st = String(a.status || '').toLowerCase()
      const wf = String(a.workflowStatus || '').toUpperCase()
      return wf === 'CHECKED_IN' || st === 'checked_in'
    }).length
    const completed = appointments.filter((a) => {
      const st = String(a.status || '').toLowerCase()
      const wf = String(a.workflowStatus || '').toUpperCase()
      return st === 'examined' || st === 'completed' || wf === 'COMPLETED'
    }).length
    const cancelled = appointments.filter((a) => String(a.status || '').toLowerCase() === 'cancelled').length
    const total = appointments.length

    return { total, checkedIn, completed, cancelled }
  }, [appointments])

  if (!token || !user) return null

  const activeHeaderTab = isHistoryView
    ? 'history'
    : isScheduleView
      ? 'schedule'
      : isWaitingView
        ? 'waiting'
        : 'calendar'

  return (
    <div className="min-h-screen bg-[#f5f8f5] relative text-slate-800">
      <DoctorAppHeader
        activeTab={activeHeaderTab}
        user={user}
        onLogout={() => void performLogout()}
      />

      <main className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full space-y-5 lg:pl-[264px]" role="main">
        {/* Tiêu đề trang & Tác vụ chính */}
        {!isScheduleView ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded border shrink-0 ${isWaitingView
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                  {isHistoryView ? (
                    <Users className="w-5 h-5" />
                  ) : isWaitingView ? (
                    <UserCheck className="w-5 h-5 text-blue-700" />
                  ) : (
                    <CalendarCheck className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {isHistoryView
                      ? 'Lịch sử bệnh nhân'
                      : isWaitingView
                        ? 'Chờ khám bệnh'
                        : 'Lịch khám của bác sĩ'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHistoryView
                      ? 'Danh sách hồ sơ bệnh nhân đã hoàn thành khám tại phòng khám.'
                      : isWaitingView
                        ? 'Danh sách bệnh nhân đã hoàn tất tiếp nhận (Checked In) tại quầy và đang chờ khám.'
                        : 'Danh sách toàn bộ lịch hẹn khám bệnh của bác sĩ.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                onClick={() => void loadAppointments({ silent: true })}
                disabled={refreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Đang làm mới…' : 'Làm mới'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Thông báo lỗi nếu có */}
        {!isScheduleView && error ? (
          <div className="p-4 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs shadow-2xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* VIEW 1: LỊCH LÀM VIỆC (VIEW === 'schedule') */}
        {/* ============================================================ */}
        {isScheduleView ? (
          <DoctorWorkSchedulesPage
            isDoctorRole={true}
            readOnly={true}
            initialDoctorId={user?.doctor?.id || user?.doctorId || user?.id}
          />
        ) : (
          /* ============================================================ */
          /* VIEW 2 & 3: LỊCH KHÁM (CHECKED-IN) & LỊCH SỬ BỆNH NHÂN */
          /* ============================================================ */
          <div className="space-y-4">
            {/* Thẻ thống kê KPI (Bấm để lọc nhanh trạng thái, viền mỏng nhẹ tinh tế) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setStatusFilter('')}
                className={`bg-white p-4 rounded border transition-all cursor-pointer ${!statusFilter ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                  } flex items-center justify-between`}
                title="Bấm để xem tất cả lịch khám"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">Tổng ca khám</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <span className="p-2.5 rounded bg-slate-50 text-slate-600 border border-slate-200/70 shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </span>
              </div>

              <div
                onClick={() => setStatusFilter(statusFilter === 'CHECKED_IN' ? '' : 'CHECKED_IN')}
                className={`bg-white p-4 rounded border transition-all cursor-pointer ${statusFilter === 'CHECKED_IN' ? 'border-blue-300 bg-blue-50/20 shadow-2xs' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                  } flex items-center justify-between`}
                title="Bấm để lọc ca đã tiếp nhận"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">Đã tiếp nhận (Chờ khám)</p>
                  <p className="text-2xl font-extrabold text-blue-700 mt-1">{stats.checkedIn}</p>
                </div>
                <span className="p-2.5 rounded bg-blue-50 text-blue-700 border border-blue-200/70 shrink-0">
                  <Clock className="w-5 h-5" />
                </span>
              </div>

              <div
                onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? '' : 'COMPLETED')}
                className={`bg-white p-4 rounded border transition-all cursor-pointer ${statusFilter === 'COMPLETED' ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                  } flex items-center justify-between`}
                title="Bấm để lọc ca đã khám xong"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">Đã khám xong</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.completed}</p>
                </div>
                <span className="p-2.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>

              <div
                onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? '' : 'CANCELLED')}
                className={`bg-white p-4 rounded border transition-all cursor-pointer ${statusFilter === 'CANCELLED' ? 'border-rose-300 bg-rose-50/20 shadow-2xs' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                  } flex items-center justify-between`}
                title="Bấm để lọc ca đã hủy"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">Đã hủy</p>
                  <p className="text-2xl font-extrabold text-rose-700 mt-1">{stats.cancelled}</p>
                </div>
                <span className="p-2.5 rounded bg-rose-50 text-rose-700 border border-rose-200/70 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </span>
              </div>
            </div>

            {/* Thanh tìm kiếm & Bộ lọc */}
            <div className="bg-white p-4 rounded border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Tìm theo tên bệnh nhân, mã vé, mã BN, số điện thoại..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Lọc trạng thái nhanh (chỉ hiển thị ở tab Lịch khám chung) */}
                {!isHistoryView && !isWaitingView && (
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="CHECKED_IN">Đã tiếp nhận (Chờ khám)</option>
                    <option value="COMPLETED">Đã khám xong</option>
                    <option value="CONFIRMED">Chờ khám / Đã xác nhận</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value)
                      setPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    title="Lọc theo ngày khám"
                  />
                  {dateFilter ? (
                    <button
                      type="button"
                      onClick={() => setDateFilter('')}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Xem tất cả các ngày"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Bảng danh sách lịch khám */}
            <div className="bg-white rounded border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  {isHistoryView
                    ? 'Danh sách bệnh nhân đã khám'
                    : isWaitingView
                      ? 'Danh sách bệnh nhân chờ khám (Checked In)'
                      : statusFilter === 'CHECKED_IN'
                        ? 'Danh sách bệnh nhân đã tiếp nhận (Checked In)'
                        : statusFilter === 'COMPLETED'
                          ? 'Danh sách bệnh nhân đã khám xong'
                          : statusFilter === 'CANCELLED'
                            ? 'Danh sách lịch hẹn đã hủy'
                            : 'Danh sách toàn bộ lịch khám'}
                </h2>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  Tổng số: <b>{filteredList.length}</b> lịch hẹn
                </span>
              </div>

              <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold whitespace-nowrap">
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Mã phiếu</th>
                      <th className="py-2.5 px-3">Bệnh nhân</th>
                      <th className="py-2.5 px-3">Thời gian khám</th>
                      <th className="py-2.5 px-3">Triệu chứng / Ghi chú</th>
                      {!isWaitingView && !isHistoryView && (
                        <th className="py-2.5 px-3">Trạng thái</th>
                      )}
                      <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[200px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={!isWaitingView && !isHistoryView ? 7 : 6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                            <span>Đang tải danh sách lịch khám…</span>
                          </div>
                        </td>
                      </tr>
                    ) : pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={!isWaitingView && !isHistoryView ? 7 : 6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Calendar className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                            <span className="font-medium">Không tìm thấy lịch khám phù hợp.</span>
                            <span className="text-[11px] text-slate-400">
                              {isWaitingView
                                ? 'Hiện không có bệnh nhân nào đang chờ khám.'
                                : 'Chỉ các bệnh nhân đã check-in tại quầy lễ tân mới hiển thị ở đây.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((item, idx) => {
                        const stt = (page - 1) * pageSize + idx + 1
                        const patient = item.patient
                        const st = String(item.status || '').toLowerCase()
                        const wf = String(item.workflowStatus || '').toUpperCase()
                        const isDone =
                          st === 'examined' ||
                          st === 'completed' ||
                          wf === 'COMPLETED' ||
                          st === 'cancelled' ||
                          wf === 'CANCELLED'
                        const canFinish = !isDone

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-500 whitespace-nowrap">
                              {stt}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{item.ticket || item.bookingCode || '—'}</span>
                              {item.visitQueueNumber ? (
                                <span className="text-[10px] text-emerald-700 font-semibold block">
                                  STT khám: {item.visitQueueNumber}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{patient?.fullName || '—'}</span>
                              <span className="text-[11px] text-slate-500 block">
                                {formatGenderVi(patient?.gender)} · {formatPatientAge(patient?.dateOfBirth)} · {patient?.phone || '—'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-800 block">
                                {item.startTime ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` : '—'}
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 shrink-0" /> {formatApptDateVi(item.appointmentDate)}
                              </span>
                              {item.checkedInAt ? (
                                <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 shrink-0" /> Check-in: {new Date(item.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 max-w-[260px]">
                              <p className="text-slate-600 line-clamp-2" title={item.symptoms || 'Khám theo lịch hẹn'}>
                                {item.symptoms || 'Khám theo lịch hẹn'}
                              </p>
                            </td>
                            {!isWaitingView && !isHistoryView && (
                              <td className="py-2.5 px-3 whitespace-nowrap">{statusBadge(item.status, item.workflowStatus)}</td>
                            )}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {isTelehealthDoctorAppt(item) && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                                    onClick={() => navigate(`/doctor/telehealth/${item.id}`)}
                                    title="Vào phòng khám trực tuyến với bệnh nhân này"
                                  >
                                    <Video className="w-3.5 h-3.5 shrink-0" />
                                    <span>Tư vấn từ xa</span>
                                  </button>
                                )}
                                {canFinish && (
                                  <button
                                    type="button"
                                    disabled={finishingId === item.id}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                                    onClick={() => void handleFinishExam(item)}
                                    title="Hoàn thành khám cho bệnh nhân này"
                                  >
                                    {finishingId === item.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    <span>Hoàn thành khám</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                  onClick={() => setDetailAppt(item)}
                                  title="Xem chi tiết phiếu khám"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                  <span>Chi tiết</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {totalPages > 1 ? (
                <div className="p-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Trang {page} / {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-3 py-1 rounded text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CHI TIẾT PHIẾU KHÁM */}
      {detailAppt ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailAppt(null)}
        >
          <div
            className="bg-white rounded border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi tiết lịch khám bệnh</h3>
                <p className="text-xs text-slate-500">Mã vé: <b className="text-slate-800">{detailAppt.ticket || detailAppt.bookingCode}</b></p>
              </div>
              <button
                type="button"
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                onClick={() => setDetailAppt(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin bệnh nhân */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" /> Thông tin bệnh nhân
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Họ và tên:</span>
                  <b className="text-slate-900">{detailAppt.patient?.fullName || '—'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block">Mã bệnh nhân:</span>
                  <b className="text-slate-900">{detailAppt.patient?.patientCode || '—'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block">Giới tính / Tuổi:</span>
                  <span className="text-slate-800 font-medium">
                    {formatGenderVi(detailAppt.patient?.gender)} · {formatPatientAge(detailAppt.patient?.dateOfBirth)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Số điện thoại:</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {detailAppt.patient?.phone || '—'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Địa chỉ:</span>
                  <span className="text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {detailAppt.patient?.address || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin ca khám */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Ca khám & Phòng khám
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Ngày khám:</span>
                  <b className="text-slate-900">{formatApptDateVi(detailAppt.appointmentDate)}</b>
                </div>
                <div>
                  <span className="text-slate-500 block">Khung giờ:</span>
                  <b className="text-slate-900">{detailAppt.startTime || '—'} - {detailAppt.endTime || '—'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block">Phòng khám:</span>
                  <span className="text-slate-800 font-medium">{detailAppt.clinicRoomName || detailAppt.clinicRoom || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cơ sở:</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" /> {detailAppt.branch?.name || 'VitaCare Clinic'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bác sĩ phụ trách:</span>
                  <span className="text-emerald-800 font-bold">{detailAppt.doctor?.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Trạng thái:</span>
                  <div className="mt-0.5">{statusBadge(detailAppt.status, detailAppt.workflowStatus)}</div>
                </div>
              </div>
            </div>

            {/* Triệu chứng & Lý do khám */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" /> Triệu chứng ban đầu
              </h4>
              <div className="p-3 rounded bg-emerald-50/40 border border-emerald-100 text-xs text-slate-700 font-medium">
                {detailAppt.symptoms || 'Bệnh nhân chưa cung cấp triệu chứng cụ thể.'}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
                onClick={() => setDetailAppt(null)}
              >
                Đóng
              </button>
              {(() => {
                const st = String(detailAppt.status || '').toLowerCase()
                const wf = String(detailAppt.workflowStatus || '').toUpperCase()
                const isDoneDetail =
                  st === 'examined' ||
                  st === 'completed' ||
                  wf === 'COMPLETED' ||
                  st === 'cancelled' ||
                  wf === 'CANCELLED'
                if (isDoneDetail) return null
                return (
                  <button
                    type="button"
                    disabled={finishingId === detailAppt.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                    onClick={async () => {
                      await handleFinishExam(detailAppt)
                    }}
                  >
                    {finishingId === detailAppt.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>Hoàn thành khám</span>
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
