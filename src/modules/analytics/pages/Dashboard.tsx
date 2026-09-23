'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import {
  fetchReceptionSummary,
  fetchReceptionRoomsStatus,
  fetchDoctorQueueSummary,
} from '../services/analyticsService'
import DoctorAppHeader from '@/modules/doctor/components/DoctorAppHeader'
import RoleSidebar from '@/modules/admin/components/RoleSidebar'
import { getStaffSession, isReceptionStaff, staffRole } from '@/modules/admin/utils/staffSession'
import { UserPlus, Calendar, ArrowRight, RefreshCw, Users, QrCode } from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  branch_manager: 'Quản lý chi nhánh',
  receptionist: 'Tiếp đón',
  doctor: 'Bác sĩ',
}

function formatDateYmd(ymd?: string) {
  if (!ymd) {
    const d = new Date()
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }
  const [y, m, d] = String(ymd).split('-')
  return d && m && y ? `${d}/${m}/${y}` : ymd
}

function formatVnd(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? `${Math.round(v).toLocaleString('vi-VN')} đ` : '—'
}

function pct(part: any, total: any) {
  const t = Number(total) || 0
  return t <= 0 ? 0 : Math.round((Number(part) / t) * 100)
}

function pendingFromActions(actions: any) {
  if (!actions || typeof actions !== 'object') return null
  if (Number.isFinite(Number(actions.pendingTotal))) return Number(actions.pendingTotal)
  return (
    (Number(actions.unpaidPending) || 0) +
    (Number(actions.pendingNoRoom) || 0) +
    (Number(actions.readyToConfirm) || 0) +
    (Number(actions.expiringSoon) || 0)
  )
}

function StatusBars({ counts, maxOverride, pendingLabel = 'Chờ xác nhận', hideCancelled = false }: any) {
  const total = hideCancelled
    ? (Number(counts?.pending) || 0) + (Number(counts?.confirmed) || 0) + (Number(counts?.examined) || 0)
    : Number(counts?.total) || 0
  const max = maxOverride || total || 1
  const rows = [
    { key: 'pending', label: pendingLabel, color: 'bg-amber-500' },
    { key: 'confirmed', label: 'Đang chờ khám', color: 'bg-blue-600' },
    { key: 'examined', label: 'Đã khám', color: 'bg-emerald-600' },
    ...(hideCancelled ? [] : [{ key: 'cancelled', label: 'Đã hủy', color: 'bg-rose-500' }]),
  ]
  return (
    <div className="mt-3 space-y-2 text-xs">
      {rows.map(({ key, label, color }) => {
        const n = Number(counts?.[key]) || 0
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-slate-600 font-medium truncate">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.max(n ? 2 : 0, (n / max) * 100)}%` }} />
            </div>
            <span className="w-8 text-right font-bold text-slate-800">{n}</span>
          </div>
        )
      })}
    </div>
  )
}

function SourceBars({ sources, total }: any) {
  const t = Number(total) || 0
  const items = [
    { key: 'clinic', label: 'Tại quầy', color: 'bg-emerald-600' },
    { key: 'online', label: 'Trực tuyến', color: 'bg-indigo-600' },
    { key: 'other', label: 'Khác', color: 'bg-slate-400' },
  ]
  return (
    <div className="mt-3 space-y-2.5">
      {items.map(({ key, label, color }) => {
        const n = Number(sources?.[key]) || 0
        if (key === 'other' && n === 0) return null
        return (
          <div key={key} className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">{label}</span>
              <span className="font-bold text-slate-800">{n} {t > 0 && <span className="font-normal text-slate-400">({pct(n, t)}%)</span>}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.max(n ? 4 : 0, (n / (t || 1)) * 100)}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KpiCard({ label, value, meta, tone, onClick, title }: any) {
  const tones: Record<string, string> = {
    warn: 'border-amber-200 bg-amber-50/40 text-amber-900',
    info: 'border-blue-200 bg-blue-50/40 text-blue-900',
    success: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
    cancelled: 'border-slate-200 bg-slate-50/70 text-slate-600',
  }
  const cls = (tone && tones[tone]) || 'border-slate-200/90 bg-white text-slate-900'
  return (
    <button
      type="button"
      className={`rounded border p-4 text-left shadow-xs transition-all ${onClick ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : 'cursor-default'} ${cls}`}
      onClick={onClick}
      disabled={!onClick}
      title={title}
    >
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="mt-1 block text-2xl font-extrabold">{value}</span>
      {meta && <span className="mt-1 block text-[11px] text-slate-400">{meta}</span>}
    </button>
  )
}

export default function Dashboard() {
  const { performLogout } = useStaffLogout()
  const navigate = useNavigate()
  const { token, user } = useMemo(() => getStaffSession(), [])
  const role = staffRole(user)
  const isDoctor = role === 'doctor'
  const showStaffExtras = isReceptionStaff(user)

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetchGenRef = useRef(0)

  const loadStats = useCallback(async ({ silent = false } = {}) => {
    if (!token) return
    const gen = ++fetchGenRef.current
    if (!silent) { setLoading(true); setError('') }
    try {
      if (isDoctor) {
        const docData = await fetchDoctorQueueSummary({ token })
        if (gen === fetchGenRef.current) {
          setStats({
            today: docData.date,
            appointments: { today: docData.appointments },
          })
        }
      } else {
        const [summaryRes, roomsRes] = await Promise.all([
          fetchReceptionSummary({ token }),
          fetchReceptionRoomsStatus({ token }),
        ])
        if (gen === fetchGenRef.current) {
          setStats({
            today: summaryRes.date,
            appointments: { today: summaryRes.appointments },
            revenueToday: summaryRes.revenueToday,
            sourcesToday: summaryRes.sourcesToday,
            patientsTotal: summaryRes.patientsTotal,
            todayActions: summaryRes.todayActions,
            byRoomToday: roomsRes.rooms,
          })
        }
      }
    } catch (err: any) {
      if (gen === fetchGenRef.current) {
        setError(err?.message || 'Không tải được thống kê.')
        if (!silent) setStats(null)
      }
    } finally {
      if (gen === fetchGenRef.current) setLoading(false)
    }
  }, [token, isDoctor])

  useEffect(() => {
    if (!token || !user) { navigate('/login', { replace: true }); return }
    void loadStats()

    // Polling định kỳ tải phòng khám độc lập (15s/lần) cho Lễ tân để tối ưu hiệu năng
    const timer = setInterval(() => {
      if (isDoctor) {
        void loadStats({ silent: true })
      } else {
        fetchReceptionRoomsStatus({ token })
          .then((roomsRes) => {
            setStats((prev: any) => (prev ? { ...prev, byRoomToday: roomsRes.rooms } : prev))
          })
          .catch(() => { })
      }
    }, 15000)

    // Sau 60s mới đồng bộ lại toàn bộ số liệu summary
    const summaryTimer = setInterval(() => {
      void loadStats({ silent: true })
    }, 60000)

    return () => {
      clearInterval(timer)
      clearInterval(summaryTimer)
      fetchGenRef.current += 1
    }
  }, [token, user, navigate, loadStats, isDoctor])

  const goDoctor = useCallback((statusFilter = 'confirmed') => {
    navigate('/doctor', { state: { fromDate: stats?.today || '', toDate: stats?.today || '', statusFilter, dashNavAt: Date.now() } })
  }, [navigate, stats?.today])

  const goReception = useCallback((arg: any = 'all') => {
    if (isDoctor) { goDoctor(typeof arg === 'string' ? arg : arg?.statusFilter || 'all'); return }
    const opts = typeof arg === 'string' ? { statusFilter: arg } : arg || {}
    navigate('/reception', { state: { fromDate: stats?.today || '', toDate: stats?.today || '', statusFilter: opts.statusFilter || 'all', dashFilter: opts.dashFilter || '', dashNavAt: Date.now() } })
  }, [navigate, stats?.today, isDoctor, goDoctor])

  if (!token || !user) return null

  const today = stats?.appointments?.today
  const sources = stats?.sourcesToday
  const actions = stats?.todayActions
  const revenue = stats?.revenueToday
  const byRoom = stats?.byRoomToday
  const pendingActionTotal = showStaffExtras ? pendingFromActions(actions) : null
  const pendingToday = pendingActionTotal != null ? pendingActionTotal : Number(today?.pending) || 0
  const waitingToday = Number(today?.confirmed) || 0
  const todayTotal = pendingActionTotal != null
    ? pendingToday + (Number(today?.confirmed) || 0) + (Number(today?.examined) || 0) + (Number(today?.cancelled) || 0)
    : Number(today?.total) || 0

  if (isDoctor) {
    const doctorCards = [
      { label: 'Lịch khám hôm nay', val: todayTotal, note: 'Tổng số ca được phân công', filter: 'all' },
      { label: 'Đang chờ khám', val: today?.confirmed ?? 0, note: 'Bệnh nhân sẵn sàng', tone: 'info', filter: 'confirmed' },
      { label: 'Đã hoàn thành', val: today?.examined ?? 0, note: 'Ca khám đã kết thúc', tone: 'success', filter: 'examined' },
      { label: 'Chờ tiếp đón', val: pendingToday, note: 'Bệnh nhân chưa check-in', tone: 'warn', filter: 'pending' },
    ]
    return (
      <div className="min-h-screen bg-slate-50">
        <DoctorAppHeader activeTab="stats" user={user} onLogout={performLogout} examBadge={waitingToday} onExamNavigate={() => goDoctor(waitingToday > 0 ? 'confirmed' : 'all')} />
        <main className="max-w-[1400px] mx-auto p-5 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Tổng quan Bác sĩ</p>
              <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Xin chào, {user?.fullName || user?.displayName || 'Bác sĩ'}</h1>
              <p className="text-xs text-slate-500">Theo dõi tiến độ khám và bệnh nhân trong ngày · {formatDateYmd(stats?.today)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void loadStats({ silent: true })} className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
              <button onClick={() => goDoctor(waitingToday > 0 ? 'confirmed' : 'all')} className="rounded bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer">
                Mở phòng khám →
              </button>
            </div>
          </div>

          {error && <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doctorCards.map((c) => (
              <KpiCard key={c.label} label={c.label} value={loading ? '—' : c.val} meta={c.note} tone={c.tone} onClick={() => goDoctor(c.filter)} />
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Lịch khám hôm nay</h2>
                <button onClick={() => goDoctor('all')} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">Xem tất cả →</button>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: 'Đang chờ khám', val: today?.confirmed ?? 0, note: 'Bệnh nhân đã tiếp nhận sẵn sàng', filter: 'confirmed' },
                  { label: 'Chờ tiếp đón', val: pendingToday, note: 'Chưa hoàn tất check-in', filter: 'pending' },
                  { label: 'Đã hoàn thành', val: today?.examined ?? 0, note: 'Đã hoàn tất khám và lưu hồ sơ', filter: 'examined' },
                ].map((item) => (
                  <button key={item.label} onClick={() => goDoctor(item.filter)} className="flex w-full items-center justify-between rounded border border-slate-100 p-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded bg-emerald-50 text-xs font-bold text-emerald-800">{item.val}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.note}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Thao tác nhanh</h2>
                <p className="mt-1 text-xs text-slate-500">Các lối tắt nghiệp vụ phòng khám</p>
                <div className="mt-4 space-y-2.5">
                  <button onClick={() => goDoctor('confirmed')} className="flex w-full items-center gap-2.5 rounded bg-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer">
                    <UserPlus className="w-4 h-4" /> Gọi bệnh nhân tiếp theo {waitingToday > 0 ? `(${waitingToday})` : ''}
                  </button>
                  <button onClick={() => navigate('/doctor?view=schedule')} className="flex w-full items-center gap-2.5 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                    <Calendar className="w-4 h-4" /> Xem lịch làm việc của tôi
                  </button>
                </div>
              </div>
              <div className="mt-6 rounded bg-emerald-50/60 border border-emerald-100 p-3.5 text-xs text-emerald-800">
                <p className="font-bold">VitaCare Clinic · Bác sĩ</p>
                <p className="mt-0.5 text-[11px] text-emerald-700">Chẩn đoán theo mã ICD-10 và kê đơn thuốc điện tử trực tiếp trong ca khám.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pl-0 md:pl-[232px]">
      <RoleSidebar role="receptionist" active="dashboard" user={user} onLogout={performLogout} />

      <main className="p-5 md:p-7 max-w-[1500px] w-full mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{ROLE_LABEL[role] || 'Tiếp đón'}</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Tổng quan thống kê</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {user?.fullName || user?.displayName || user?.email} · {formatDateYmd(stats?.today)}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer"
            onClick={() => void loadStats({ silent: true })}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700">
            <span>{error}</span>
            <button type="button" className="px-2.5 py-1 rounded bg-white border border-rose-200 font-bold hover:bg-rose-100 cursor-pointer" onClick={() => void loadStats()}>Thử lại</button>
          </div>
        )}

        {loading && !stats ? (
          <p className="text-xs text-slate-400 py-16 text-center">Đang tải dữ liệu thống kê…</p>
        ) : stats ? (
          <div className="space-y-5">
            {/* 1. HÔM NAY: 5 Thẻ trạng thái KPI */}
            <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Hôm nay</h2>
                {showStaffExtras && stats.patientsTotal != null && (
                  <p className="text-xs text-slate-500">Tổng {Number(stats.patientsTotal).toLocaleString('vi-VN')} bệnh nhân trong hệ thống.</p>
                )}
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard label="Tổng lịch" value={todayTotal} meta="Bấm để xem tất cả" onClick={() => goReception('all')} />
                <KpiCard label="Chờ xác nhận" value={pendingToday} tone="warn" meta="Cần thu phí / chọn phòng" onClick={() => goReception('pending')} />
                <KpiCard label="Đang chờ khám" value={today?.confirmed ?? 0} tone="info" meta="Đã tiếp nhận vào phòng" onClick={() => goReception('confirmed')} />
                <KpiCard label="Đã khám" value={today?.examined ?? 0} tone="success" meta="Hoàn thành ca khám" onClick={() => goReception('examined')} />
                <KpiCard label="Đã hủy" value={today?.cancelled ?? 0} tone="cancelled" meta="Hủy lịch hẹn" onClick={() => goReception('cancelled')} />
              </div>
            </section>

            {/* 2. BỐ CỤC 2 CỘT: CÂN ĐỐI, SẠCH SẼ, HEIGHT BẰNG NHAU */}
            <div className="grid gap-5 lg:grid-cols-2 items-stretch">
              {/* Cột trái: Doanh thu quầy & Nguồn đặt khám */}
              <div className="flex flex-col gap-5 justify-between">
                {/* Cơ cấu Doanh thu thu tại quầy (Hôm nay) */}
                {showStaffExtras && revenue && (() => {
                  const cashAmount = Number(revenue?.cash || 0)
                  const transferAmount = Number(revenue?.transfer || 0)
                  const counterTotal = cashAmount + transferAmount
                  const cashPct = counterTotal > 0 ? Math.round((cashAmount / counterTotal) * 100) : 0
                  const transferPct = counterTotal > 0 ? 100 - cashPct : 0
                  const onlineAmount = Number(revenue?.online || 0)
                  const onlineCount = Number(revenue?.onlineCount || 0)

                  return (
                    <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Cơ cấu doanh thu thu tại quầy (hôm nay)</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Dòng tiền thực thu trực tiếp tại ca trực quầy tiếp đón</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                          {/* Donut Chart - Tỷ trọng Tiền mặt vs Chuyển khoản tại quầy */}
                          <div className="flex flex-col items-center justify-center">
                            <div
                              className="relative grid place-items-center rounded-full shadow-xs shrink-0"
                              style={{
                                width: '124px',
                                height: '124px',
                                background: counterTotal > 0
                                  ? `conic-gradient(
                                      #047857 0% ${cashPct}%,
                                      #2563eb ${cashPct}% 100%
                                    )`
                                  : '#e2e8f0',
                              }}
                            >
                              {/* Tâm tròn tạo hình Donut */}
                              <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-white text-center shadow-inner">
                                <div className="px-1">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Tổng thu quầy</span>
                                  <p className="text-xs font-bold text-emerald-900 leading-tight mt-0.5 truncate max-w-[78px]" title={formatVnd(counterTotal)}>
                                    {formatVnd(counterTotal)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Legend mini dưới Donut */}
                            <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-[#047857]" /> Tiền mặt ({cashPct}%)
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> CK/QR ({transferPct}%)
                              </span>
                            </div>
                          </div>

                          {/* 2 Thẻ chi tiết dạng hình chữ nhật nằm ngang - Xếp dọc cân đối hoàn hảo với Donut chart */}
                          <div className="flex flex-col gap-2.5 flex-1 justify-center">
                            {/* Kênh Tiền mặt */}
                            <div className="rounded border border-emerald-200/90 bg-emerald-50/20 px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-3 hover:bg-emerald-50/40 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#047857] shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">Tiền mặt (Két quầy)</span>
                                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                                      {cashPct}%
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-28 sm:w-36 rounded-full bg-slate-200 overflow-hidden">
                                    <div className="h-full bg-[#047857] rounded-full transition-all duration-500" style={{ width: `${cashPct}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-bold text-slate-900 tabular-nums">{formatVnd(cashAmount)}</p>
                                <span className="text-[10px] text-slate-400">Tiền mặt thu tại quầy</span>
                              </div>
                            </div>

                            {/* Kênh Chuyển khoản / QR */}
                            <div className="rounded border border-blue-200/90 bg-blue-50/20 px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">Chuyển khoản / QR</span>
                                    <span className="text-[10px] font-bold text-blue-800 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                                      {transferPct}%
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-28 sm:w-36 rounded-full bg-slate-200 overflow-hidden">
                                    <div className="h-full bg-[#2563eb] rounded-full transition-all duration-500" style={{ width: `${transferPct}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-bold text-slate-900 tabular-nums">{formatVnd(transferAmount)}</p>
                                <span className="text-[10px] text-slate-400">Quét mã QR / POS</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dòng thông tin phụ: Đã thanh toán trước online (không cộng vào két tiền) */}
                        <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-50/80 px-3 py-2 rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <span>
                              Đã thanh toán trước (Online qua App/Web): <strong className="text-slate-900">{onlineCount} ca</strong> ({formatVnd(onlineAmount)})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 italic">Không cộng vào tiền bàn giao két ca trực</span>
                        </div>
                      </div>
                    </section>
                  )
                })()}

                {/* Nguồn đặt khám (hôm nay) */}
                {showStaffExtras && sources && (
                  <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Nguồn đặt khám (hôm nay)</h2>
                    <SourceBars sources={sources} total={todayTotal} />
                  </section>
                )}
              </div>

              {/* Cột phải: Tình trạng tải phòng khám theo thời gian thực (Hiển thị danh sách tất cả phòng, chiều cao bằng 2 khối trái) */}
              <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5 shrink-0">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Tình trạng tải phòng khám theo thời gian thực</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Giám sát số lượng bệnh nhân chờ và mức độ tải tại từng phòng</p>
                  </div>
                </div>

                {showStaffExtras && byRoom?.length ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                      {byRoom.map((r: any) => {
                        const waitingInRoom = Number(r.confirmed) || 0
                        const pendingCheckIn = Number(r.pending) || 0
                        const examinedInRoom = Number(r.examined) || 0
                        const totalInRoom = Number(r.total) || 0
                        const isHighLoad = waitingInRoom >= 4
                        const isBusy = waitingInRoom > 0
                        const hasDocOrSchedule = r.hasScheduleToday || r.doctorName || totalInRoom > 0
                        const loadPct = Math.min(100, Math.round((waitingInRoom / Math.max(totalInRoom, 4)) * 100))

                        return (
                          <div key={r.id || r.room} className="p-3 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between mb-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{r.room}</span>
                                {r.doctorName && (
                                  <span className="text-[11px] font-medium text-emerald-700">· {r.doctorName}</span>
                                )}
                                {r.specialty && !r.doctorName && (
                                  <span className="text-[11px] text-slate-400">· {r.specialty}</span>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${isHighLoad
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isBusy
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : hasDocOrSchedule
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}
                              >
                                {isHighLoad ? 'Tải cao' : isBusy ? 'Đang khám' : hasDocOrSchedule ? 'Sẵn sàng' : 'Chưa có BS'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                              <span>
                                Đang chờ: <strong className="text-slate-900">{waitingInRoom}</strong> ca
                                {examinedInRoom > 0 && (
                                  <span className="text-slate-400 ml-1.5">(Đã khám: <strong className="text-emerald-700">{examinedInRoom}</strong>)</span>
                                )}
                              </span>
                              <span>
                                Chờ tiếp đón: <strong className="text-amber-700">{pendingCheckIn}</strong> ca
                              </span>
                            </div>

                            <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isHighLoad ? 'bg-rose-500' : isBusy ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                style={{ width: `${Math.max(waitingInRoom > 0 ? 15 : totalInRoom > 0 ? 5 : 0, loadPct)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                      <span>Tổng <strong>{byRoom.length}</strong> phòng khám · <strong>{byRoom.reduce((acc: number, x: any) => acc + (Number(x.confirmed) || 0), 0)}</strong> ca đang chờ</span>
                      <button
                        type="button"
                        onClick={() => goReception('all')}
                        className="font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Xem chi tiết bàn tiếp đón →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Chưa có phòng khám nào được thiết lập trong hệ thống.
                  </div>
                )}
              </section>
            </div>

            {/* 3. LỐI TẮT THAO TÁC NHANH */}
            <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Lối tắt thao tác nhanh</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => navigate('/registration', { state: { createNew: true } })}
                  className="flex items-center gap-3 p-3.5 rounded border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 text-left text-xs font-bold text-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shadow-xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span>+ Đăng ký bệnh nhân mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/reception/patients')}
                  className="flex items-center gap-3 p-3.5 rounded border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 text-left text-xs font-bold text-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Danh bạ bệnh nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/reception', { state: { openQrScan: true, qrNavAt: Date.now() } })}
                  className="flex items-center gap-3 p-3.5 rounded border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 text-left text-xs font-bold text-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shadow-xs">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span>Quét mã QR lịch hẹn</span>
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}

