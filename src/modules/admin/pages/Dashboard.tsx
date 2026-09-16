'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import { fetchDashboardStats } from '../services/stats'
import DoctorAppHeader from '../components/DoctorAppHeader'
import RoleSidebar from '../components/RoleSidebar'
import { getStaffSession, isReceptionStaff, staffRole } from '../utils/staffSession'

const REFRESH_MS = 90_000

function displayName(user: any) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

function roleLabelVi(role: string) {
  if (role === 'receptionist') return 'Tiếp đón'
  if (role === 'registration') return 'Đăng ký'
  if (role === 'doctor') return 'Bác sĩ'
  return 'Nhân viên'
}

function formatWeekRange(week: any) {
  if (!week?.from || !week?.to) return ''
  const [yf, mf, df] = week.from.split('-')
  const [yt, mt, dt] = week.to.split('-')
  return `${df}/${mf}/${yf} – ${dt}/${mt}/${yt}`
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function todayLabelVi() {
  const d = new Date()
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatDateYmd(ymd: any) {
  if (!ymd) return todayLabelVi()
  const [y, m, d] = String(ymd).split('-')
  return d && m && y ? `${d}/${m}/${y}` : todayLabelVi()
}

function formatVnd(n: any) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `${Math.round(v).toLocaleString('vi-VN')} đ`
}

function pct(part: any, total: any) {
  const t = Number(total) || 0
  if (t <= 0) return 0
  return Math.round((Number(part) / t) * 100)
}

/** Tổng chờ xác nhận = tổng 4 nhóm việc cần xử lý (khớp KPI "Chờ xác nhận"). */
function pendingFromActions(actions: any) {
  if (!actions || typeof actions !== 'object') return null
  if (Number.isFinite(Number(actions.pendingTotal))) {
    return Number(actions.pendingTotal)
  }
  return (
    (Number(actions.unpaidPending) || 0) +
    (Number(actions.pendingNoRoom) || 0) +
    (Number(actions.readyToConfirm) || 0) +
    (Number(actions.expiringSoon) || 0)
  )
}

function activeAppointmentTotal(counts: any) {
  return (
    (Number(counts?.pending) || 0) +
    (Number(counts?.confirmed) || 0) +
    (Number(counts?.examined) || 0)
  )
}

function StatusBars({ counts, maxOverride, pendingLabel = 'Chờ xác nhận', hideCancelled = false }: any) {
  const total = hideCancelled ? activeAppointmentTotal(counts) : Number(counts?.total) || 0
  const max = maxOverride || total || 1
  const rows = [
    { key: 'pending', label: pendingLabel, barColor: 'bg-amber-500' },
    { key: 'confirmed', label: 'Đang chờ khám', barColor: 'bg-blue-600' },
    { key: 'examined', label: 'Đã khám', barColor: 'bg-emerald-600' },
    ...(hideCancelled ? [] : [{ key: 'cancelled', label: 'Đã hủy', barColor: 'bg-rose-500' }]),
  ]
  return (
    <div className="mt-3 space-y-2.5">
      {rows.map(({ key, label, barColor }) => {
        const n = Number(counts?.[key]) || 0
        return (
          <div key={key} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 text-slate-600 font-medium truncate">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.max(n ? 2 : 0, (n / max) * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right font-bold text-slate-800">{n}</span>
          </div>
        )
      })}
      {total === 0 ? <p className="text-xs text-slate-400 italic pt-1">Chưa có lịch trong khoảng thời gian này.</p> : null}
    </div>
  )
}

function SourceBars({ sources, total }: any) {
  const t = Number(total) || 0
  const items = [
    { key: 'clinic', label: 'Tại quầy', barColor: 'bg-emerald-600' },
    { key: 'online', label: 'Trực tuyến', barColor: 'bg-indigo-600' },
    { key: 'other', label: 'Khác', barColor: 'bg-slate-400' },
  ]
  return (
    <div className="mt-3 space-y-3">
      {items.map(({ key, label, barColor }) => {
        const n = Number(sources?.[key]) || 0
        if (key === 'other' && n === 0) return null
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">{label}</span>
              <span className="font-bold text-slate-800">
                {n}
                {t > 0 ? <span className="font-normal text-slate-400 ml-1">({pct(n, t)}%)</span> : ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.max(n ? 4 : 0, (n / (t || 1)) * 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ShortcutIcon({ name }: { name: string }) {
  if (name === 'user-plus') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h.01M12 12h.01M17 12h.01M7 16h.01M12 16h.01M17 16h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashShortcut({ icon, label, onClick }: any) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded transition-all text-left text-slate-800 font-semibold text-xs group cursor-pointer"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 group-hover:border-emerald-200 shadow-2xs">
        <ShortcutIcon name={icon} />
      </div>
      <span className="group-hover:text-emerald-900">{label}</span>
    </button>
  )
}

function KpiCard({ label, value, meta, metaBold, tone, onClick, disabled, title }: any) {
  const toneClasses: Record<string, string> = {
    warn: 'border-amber-200 bg-amber-50/40 text-amber-900 hover:border-amber-300',
    info: 'border-blue-200 bg-blue-50/40 text-blue-900 hover:border-blue-300',
    success: 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:border-emerald-300',
    cancelled: 'border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300',
    'dr-total': 'border-slate-200 bg-white text-slate-900',
    'dr-pending': 'border-amber-200 bg-amber-50/40 text-amber-900',
    'dr-waiting': 'border-blue-200 bg-blue-50/40 text-blue-900',
    'dr-done': 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
  }
  const cls = (tone && toneClasses[tone]) || 'border-slate-200/90 bg-white text-slate-900 hover:border-slate-300'
  return (
    <button
      type="button"
      className={`rounded border p-4 text-left shadow-xs transition-all ${
        disabled || !onClick ? 'cursor-default' : 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
      } ${cls}`}
      onClick={onClick}
      disabled={disabled || !onClick}
      title={title}
    >
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="mt-1.5 block text-2xl sm:text-3xl font-extrabold">{value}</span>
      {meta ? (
        <span className="mt-1.5 block text-[11px] text-slate-400">
          {metaBold ? <strong className="font-semibold text-slate-700">{meta}</strong> : meta}
        </span>
      ) : null}
    </button>
  )
}

export default function Dashboard() {
  const { performLogout } = useStaffLogout()
  const navigate = useNavigate()
  const { token, user } = useMemo(() => getStaffSession(), [])
  const role = staffRole(user)
  const showStaffExtras = isReceptionStaff(user)
  const isDoctor = role === 'doctor'

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetchGenRef = useRef(0)
  const hasStatsRef = useRef(false)

  const loadStats = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return
      const gen = ++fetchGenRef.current
      if (!silent) {
        if (!hasStatsRef.current) setLoading(true)
        setError('')
      }
      try {
        const data = await fetchDashboardStats({ token })
        if (gen !== fetchGenRef.current) return
        setStats(data)
        hasStatsRef.current = true
      } catch (err: any) {
        if (gen !== fetchGenRef.current) return
        setError(err?.message || 'Không tải được thống kê.')
        if (!silent) setStats(null)
      } finally {
        if (gen === fetchGenRef.current) setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
      return
    }
    void loadStats()
    return () => {
      fetchGenRef.current += 1
    }
  }, [token, user, navigate, loadStats])

  const goDoctor = useCallback(
    (statusFilter = 'confirmed') => {
      const day = stats?.today || ''
      navigate('/doctor', {
        state: {
          fromDate: day,
          toDate: day,
          statusFilter,
          dashNavAt: Date.now(),
        },
      })
    },
    [navigate, stats?.today],
  )

  const goReception = useCallback(
    (arg: any = 'all') => {
      if (isDoctor) {
        const st = typeof arg === 'string' ? arg : arg?.statusFilter || 'all'
        goDoctor(st)
        return
      }
      const opts = typeof arg === 'string' ? { statusFilter: arg } : arg || {}
      const day = stats?.today || ''
      navigate('/reception', {
        state: {
          fromDate: day,
          toDate: day,
          statusFilter: opts.statusFilter || 'all',
          dashFilter: opts.dashFilter || '',
          dashNavAt: Date.now(),
        },
      })
    },
    [navigate, stats?.today, isDoctor, goDoctor],
  )

  const openTicket = useCallback(
    (ticket: any) => {
      if (isDoctor) {
        goDoctor('confirmed')
        return
      }
      const t = String(ticket || '').trim()
      if (!t) {
        goReception('pending')
        return
      }
      navigate('/reception', { state: { lookupTicket: t } })
    },
    [goReception, navigate, isDoctor, goDoctor],
  )

  if (!token || !user) return null

  const today = stats?.appointments?.today
  const week = stats?.appointments?.week
  const sources = stats?.sourcesToday
  const actions = stats?.todayActions
  const revenue = stats?.revenueToday
  const byRoom = stats?.byRoomToday
  const pendingActionTotal = showStaffExtras ? pendingFromActions(actions) : null
  const pendingToday =
    pendingActionTotal != null ? pendingActionTotal : Number(today?.pending) || 0
  const todayTotal =
    pendingActionTotal != null
      ? pendingToday +
      (Number(today?.confirmed) || 0) +
      (Number(today?.examined) || 0) +
      (Number(today?.cancelled) || 0)
      : Number(today?.total) || 0
  const weekTotal = Number(week?.total) || 0
  const cancelRateWeek = pct(week?.cancelled, weekTotal)
  const kpiClickTitle = isDoctor ? 'Mở Khám bệnh — lọc theo trạng thái' : 'Mở Lịch hẹn với bộ lọc tương ứng'
  const waitingToday = Number(today?.confirmed) || 0
  const doctorTodayTotal = activeAppointmentTotal(today)
  const doctorWeekTotal = activeAppointmentTotal(week)

  function logout() {
    void performLogout()
  }

  if (isDoctor) {
    const doctorCards = [
      ['Lịch khám hôm nay', doctorTodayTotal, 'Tổng số ca được phân công', 'emerald'],
      ['Đang chờ khám', today?.confirmed ?? 0, 'Bệnh nhân sẵn sàng', 'blue'],
      ['Đã hoàn thành', today?.examined ?? 0, 'Ca khám đã kết thúc', 'green'],
      ['Chờ tiếp đón', pendingToday, 'Bệnh nhân chưa check-in', 'amber'],
    ]
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <DoctorAppHeader activeTab="stats" user={user} onLogout={logout} examBadge={waitingToday} onExamNavigate={() => goDoctor(waitingToday > 0 ? 'confirmed' : 'all')} />
        <main className="min-h-[calc(100vh-58px)] bg-[#f4faef] px-5 py-5 lg:px-7">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-700">TỔNG QUAN BÁC SĨ</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Chào buổi sáng, {displayName(user)}</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi lịch khám và bệnh nhân của bạn hôm nay · {formatDateYmd(stats?.today)}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => void loadStats({ silent: true })}>↻ Làm mới</button>
                <button className="rounded bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer" onClick={() => goDoctor(waitingToday > 0 ? 'confirmed' : 'all')}>Mở phòng khám →</button>
              </div>
            </div>
            {error && <div className="mt-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {doctorCards.map(([label, value, note, tone]) => (
                <button key={label} onClick={() => goDoctor(label === 'Đã hoàn thành' ? 'examined' : label === 'Đang chờ khám' ? 'confirmed' : 'all')} className="rounded border border-[#dce8d7] bg-white p-4 text-left shadow-[0_2px_7px_rgba(28,74,42,.04)] transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">{label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-slate-900">{loading ? '—' : value}</p>
                    </div>
                    <span className={`grid h-10 w-10 place-items-center rounded text-lg ${tone === 'amber' ? 'bg-amber-50 text-amber-600' : tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>✚</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">{note}</p>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
              <section className="rounded border border-[#dce8d7] bg-white shadow-[0_2px_7px_rgba(28,74,42,.04)]">
                <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-900">Lịch khám hôm nay</h2>
                    <p className="mt-1 text-xs text-slate-400">Các ca đang chờ bạn xử lý</p>
                  </div>
                  <button onClick={() => goDoctor('all')} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">Xem tất cả →</button>
                </header>
                <div className="p-5">
                  {doctorTodayTotal === 0 ? (
                    <div className="grid min-h-52 place-items-center rounded border border-dashed border-[#cfe0ca] bg-[#f8fcf5] text-center">
                      <div>
                        <span className="text-3xl">🗓</span>
                        <p className="mt-2 font-bold text-slate-700">Chưa có lịch khám hôm nay</p>
                        <p className="mt-1 text-xs text-slate-400">Lịch mới sẽ xuất hiện tại đây.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[['Đang chờ khám', today?.confirmed ?? 0, 'Bệnh nhân đã tiếp nhận'], ['Chờ tiếp đón', pendingToday, 'Chưa hoàn tất check-in'], ['Đã khám', today?.examined ?? 0, 'Đã hoàn thành hồ sơ']].map(([label, value, note], i) => (
                        <button key={label} onClick={() => goDoctor(i === 0 ? 'confirmed' : i === 2 ? 'examined' : 'all')} className="flex w-full items-center gap-4 rounded border border-slate-100 p-4 text-left hover:bg-[#f8fcf5] transition-colors cursor-pointer">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 font-bold text-emerald-700">{value}</span>
                          <span className="flex-1">
                            <b className="text-sm text-slate-800">{label}</b>
                            <p className="mt-1 text-xs text-slate-400">{note}</p>
                          </span>
                          <span className="text-emerald-600">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              <div className="space-y-5">
                <section className="rounded border border-[#dce8d7] bg-white p-5 shadow-[0_2px_7px_rgba(28,74,42,.04)]">
                  <h2 className="font-bold text-slate-900">Hiệu suất tuần này</h2>
                  <div className="mt-5 grid place-items-center">
                    <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(#16a34a 0 ${doctorWeekTotal ? Math.round((Number(week?.examined) || 0) / doctorWeekTotal * 100) : 0}%, #e8f0e5 0)` }}>
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                        <div>
                          <b className="text-2xl text-slate-900">{doctorWeekTotal}</b>
                          <p className="text-[10px] text-slate-400">ca trong tuần</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-xs">
                    <span className="text-slate-500">Đã hoàn thành</span>
                    <b className="text-emerald-700">{week?.examined ?? 0} ca</b>
                  </div>
                </section>
                <section className="rounded border border-[#dce8d7] bg-[#eff8e9] p-5">
                  <h2 className="font-bold text-emerald-900">Thao tác nhanh</h2>
                  <button onClick={() => goDoctor('confirmed')} className="mt-3 w-full rounded bg-emerald-600 hover:bg-emerald-700 transition-colors px-4 py-3 text-sm font-bold text-white cursor-pointer">Gọi bệnh nhân tiếp theo</button>
                  <button onClick={() => navigate('/doctor')} className="mt-2 w-full rounded border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors px-4 py-3 text-sm font-bold text-emerald-700 cursor-pointer">Mở hồ sơ khám bệnh</button>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pl-0 md:pl-[232px]">
      <RoleSidebar role="receptionist" active="dashboard" user={user} onLogout={logout} />

      <main className="p-5 md:p-7 max-w-[1500px] w-full mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thống kê</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {displayName(user)} · {roleLabelVi(role)} · {formatDateYmd(stats?.today)}
              {stats?.week ? ` · Tuần ${formatWeekRange(stats.week)}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="px-3.5 py-2 text-xs font-bold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
            onClick={() => void loadStats({ silent: true })}
          >
            Làm mới dữ liệu
          </button>
        </div>

        {error ? (
          <div className="mb-5 p-4 rounded bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-700 font-medium" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-white border border-rose-200 text-rose-800 font-bold hover:bg-rose-100/60 transition-colors cursor-pointer"
              onClick={() => void loadStats({ silent: Boolean(stats) })}
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {loading && !stats ? (
          <p className="text-xs text-slate-400 py-10 text-center">Đang tải dữ liệu thống kê…</p>
        ) : stats ? (
          <div className="space-y-5">
            {/* KPI hôm nay */}
            <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Hôm nay</h2>
                {showStaffExtras && stats.patientsTotal != null ? (
                  <p className="text-xs text-slate-500">
                    Tổng {stats.patientsTotal.toLocaleString('vi-VN')} bệnh nhân trong hệ thống.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard
                  label="Tổng lịch"
                  value={todayTotal}
                  meta="Bấm để xem danh sách"
                  title={kpiClickTitle}
                  onClick={() => goReception('all')}
                />
                <KpiCard
                  label="Chờ xác nhận"
                  value={pendingToday}
                  tone="warn"
                  meta="Cần thu phí / chọn phòng"
                  title={kpiClickTitle}
                  onClick={() => goReception('pending')}
                />
                <KpiCard
                  label="Đang chờ khám"
                  value={today?.confirmed ?? 0}
                  tone="info"
                  meta="Đã tiếp nhận — chờ khám"
                  title={kpiClickTitle}
                  onClick={() => goReception('confirmed')}
                />
                <KpiCard
                  label="Đã khám"
                  value={today?.examined ?? 0}
                  tone="success"
                  meta="Hoàn thành hồ sơ"
                  title={kpiClickTitle}
                  onClick={() => goReception('examined')}
                />
                <KpiCard
                  label="Đã hủy"
                  value={today?.cancelled ?? 0}
                  tone="cancelled"
                  meta="Hủy lịch hẹn"
                  title={kpiClickTitle}
                  onClick={() => goReception('cancelled')}
                />
              </div>
            </section>

            {/* Việc cần xử lý */}
            {showStaffExtras && actions ? (
              <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900">Việc cần xử lý</h2>
                <p className="text-xs text-slate-500 mb-3">Các lịch chờ xác nhận hôm nay — bấm để mở danh sách lọc theo trạng thái Chờ.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    className={`rounded border p-4 text-left transition-all cursor-pointer ${
                      actions.unpaidPending ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/60' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'unpaid' })}
                  >
                    <strong className="block text-2xl font-extrabold text-slate-900">{actions.unpaidPending ?? 0}</strong>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">Chưa thu phí</span>
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 p-4 text-left transition-all cursor-pointer"
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'noRoom' })}
                  >
                    <strong className="block text-2xl font-extrabold text-slate-900">{actions.pendingNoRoom ?? 0}</strong>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">Chưa chọn phòng</span>
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 p-4 text-left transition-all cursor-pointer"
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'ready' })}
                  >
                    <strong className="block text-2xl font-extrabold text-slate-900">{actions.readyToConfirm ?? 0}</strong>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">Sẵn sàng xác nhận</span>
                  </button>
                  <button
                    type="button"
                    className={`rounded border p-4 text-left transition-all cursor-pointer ${
                      actions.expiringSoon ? 'border-rose-300 bg-rose-50/60 hover:bg-rose-100/60' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'expiring' })}
                  >
                    <strong className="block text-2xl font-extrabold text-slate-900">{actions.expiringSoon ?? 0}</strong>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">Quá giờ — sắp tự hủy</span>
                  </button>
                </div>
                {actions.alerts?.length ? (
                  <ul className="mt-4 divide-y divide-slate-100 rounded border border-slate-200 bg-slate-50/50 p-2 space-y-1">
                    {actions.alerts.map((a: any) => (
                      <li key={a.id || a.ticket} className="flex items-center justify-between gap-3 p-2 text-xs">
                        <span className="text-slate-700">
                          <strong className="font-mono text-emerald-700">{a.ticket || '—'}</strong>
                          {' · '}
                          <span className="font-semibold">{a.patientName || 'Bệnh nhân'}</span>
                          {a.startTime ? ` · ${a.startTime}` : ''}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-xs font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => openTicket(a.ticket)}
                        >
                          Mở lịch
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            {/* Thu phí & Biểu đồ */}
            <div className="grid gap-5 lg:grid-cols-2">
              {showStaffExtras && revenue ? (
                <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-slate-900 mb-3">Thu phí hôm nay</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-3 rounded bg-emerald-50/60 border border-emerald-200 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Tổng đã thu</div>
                      <div className="mt-1 text-2xl font-extrabold text-emerald-900">{formatVnd(revenue.total)}</div>
                      <div className="mt-1 text-xs text-emerald-700 font-medium">{revenue.count ?? 0} lịch đã thanh toán</div>
                    </div>
                    <div className="rounded bg-slate-50 border border-slate-200 p-3.5">
                      <div className="text-[11px] font-bold uppercase text-slate-500">Tiền mặt</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{formatVnd(revenue.cash)}</div>
                    </div>
                    <div className="rounded bg-slate-50 border border-slate-200 p-3.5 sm:col-span-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">Chuyển khoản</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{formatVnd(revenue.transfer)}</div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900">Tuần này</h2>
                <p className="text-xs text-slate-500 mb-2">
                  {weekTotal} lịch
                  {weekTotal > 0 ? ` · Tỷ lệ hủy ${cancelRateWeek}%` : ''}
                </p>
                <StatusBars counts={week} pendingLabel="Chờ xác nhận" />
              </section>

              {showStaffExtras && sources ? (
                <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-slate-900 mb-1">Nguồn đặt lịch (hôm nay)</h2>
                  <SourceBars sources={sources} total={todayTotal} />
                </section>
              ) : null}

              <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-1">Phân bổ trạng thái (hôm nay)</h2>
                <StatusBars counts={today} />
              </section>
            </div>

            {/* Bảng phân bổ theo phòng */}
            {showStaffExtras && byRoom?.length ? (
              <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs overflow-hidden">
                <h2 className="text-sm font-bold text-slate-900 mb-3">Theo phòng khám (hôm nay)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">Phòng</th>
                        <th className="p-2.5">Tổng</th>
                        <th className="p-2.5">Chờ</th>
                        <th className="p-2.5">Xác nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {byRoom.map((r: any) => (
                        <tr key={r.room} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-semibold text-slate-900">{r.room}</td>
                          <td className="p-2.5">{r.total}</td>
                          <td className="p-2.5 text-amber-600 font-medium">{r.pending}</td>
                          <td className="p-2.5 text-emerald-600 font-medium">{r.confirmed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {/* Thao tác nhanh */}
            <section className="rounded border border-slate-200/90 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Thao tác nhanh</h2>
              {role === 'receptionist' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <DashShortcut
                    icon="user-plus"
                    label="+ Tiếp nhận bệnh nhân mới"
                    onClick={() => navigate('/registration', { state: { createNew: true } })}
                  />
                  <DashShortcut
                    icon="qr"
                    label="Quét mã QR hẹn lịch"
                    onClick={() =>
                      navigate('/reception', { state: { openQrScan: true, qrNavAt: Date.now() } })
                    }
                  />
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
