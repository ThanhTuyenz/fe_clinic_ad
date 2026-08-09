'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { fetchDashboardStats } from '../services/stats'
import DoctorAppHeader from '../components/DoctorAppHeader'
import RoleSidebar from '../components/RoleSidebar'
import { clearStaffSession, getStaffSession, isReceptionStaff, staffRole } from '../utils/staffSession'

const REFRESH_MS = 90_000

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

function roleLabelVi(role) {
  if (role === 'receptionist') return 'Tiếp đón'
  if (role === 'registration') return 'Đăng ký'
  if (role === 'doctor') return 'Bác sĩ'
  return 'Nhân viên'
}

function formatWeekRange(week) {
  if (!week?.from || !week?.to) return ''
  const [yf, mf, df] = week.from.split('-')
  const [yt, mt, dt] = week.to.split('-')
  return `${df}/${mf}/${yf} – ${dt}/${mt}/${yt}`
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function todayLabelVi() {
  const d = new Date()
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatDateYmd(ymd) {
  if (!ymd) return todayLabelVi()
  const [y, m, d] = String(ymd).split('-')
  return d && m && y ? `${d}/${m}/${y}` : todayLabelVi()
}

function formatVnd(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `${Math.round(v).toLocaleString('vi-VN')} đ`
}

function pct(part, total) {
  const t = Number(total) || 0
  if (t <= 0) return 0
  return Math.round((Number(part) / t) * 100)
}

/** Tổng chờ xác nhận = tổng 4 nhóm việc cần xử lý (khớp KPI "Chờ xác nhận"). */
function pendingFromActions(actions) {
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

function activeAppointmentTotal(counts) {
  return (
    (Number(counts?.pending) || 0) +
    (Number(counts?.confirmed) || 0) +
    (Number(counts?.examined) || 0)
  )
}

function StatusBars({ counts, maxOverride, pendingLabel = 'Chờ xác nhận', hideCancelled = false }) {
  const total = hideCancelled ? activeAppointmentTotal(counts) : Number(counts?.total) || 0
  const max = maxOverride || total || 1
  const rows = [
    { key: 'pending', label: pendingLabel, fill: 'dash-bar-fill--pending' },
    { key: 'confirmed', label: 'Đang chờ khám', fill: 'dash-bar-fill--confirmed' },
    { key: 'examined', label: 'Đã khám', fill: 'dash-bar-fill--examined' },
    ...(hideCancelled ? [] : [{ key: 'cancelled', label: 'Đã hủy', fill: 'dash-bar-fill--cancelled' }]),
  ]
  return (
    <div className="dash-chart-body dash-bars">
      {rows.map(({ key, label, fill }) => {
        const n = Number(counts?.[key]) || 0
        return (
          <div key={key} className="dash-bar-row">
            <span className="dash-bar-label">{label}</span>
            <div className="dash-bar-track" aria-hidden>
              <div
                className={`dash-bar-fill ${fill}`.trim()}
                style={{ width: `${Math.max(2, (n / max) * 100)}%` }}
              />
            </div>
            <span className="dash-bar-count">{n}</span>
          </div>
        )
      })}
      {total === 0 ? <p className="dash-empty-inline">Chưa có lịch trong khoảng thời gian này.</p> : null}
    </div>
  )
}

function SourceBars({ sources, total }) {
  const t = Number(total) || 0
  const items = [
    { key: 'clinic', label: 'Tại quầy' },
    { key: 'online', label: 'Trực tuyến' },
    { key: 'other', label: 'Khác' },
  ]
  return (
    <div className="dash-chart-body dash-source-list">
      {items.map(({ key, label }) => {
        const n = Number(sources?.[key]) || 0
        if (key === 'other' && n === 0) return null
        return (
          <div key={key} className="dash-source-bar">
            <div className="dash-source-head">
              <span>{label}</span>
              <span>
                {n}
                {t > 0 ? ` (${pct(n, t)}%)` : ''}
              </span>
            </div>
            <div className="dash-bar-track" aria-hidden>
              <div className="dash-bar-fill" style={{ width: `${Math.max(n ? 4 : 0, (n / (t || 1)) * 100)}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ShortcutIcon({ name }) {
  if (name === 'user-plus') {
    return (
      <svg className="dash-shortcut-icon" viewBox="0 0 24 24" aria-hidden focusable="false">
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
    <svg className="dash-shortcut-icon" viewBox="0 0 24 24" aria-hidden focusable="false">
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

function DashShortcut({ icon, label, onClick }) {
  return (
    <button type="button" className="dash-shortcut-btn" onClick={onClick}>
      <ShortcutIcon name={icon} />
      <span className="dash-shortcut-label">{label}</span>
    </button>
  )
}

/** Phụ đề thẻ KPI — góc nhìn bác sĩ. */
const DOCTOR_KPI_META = {
  total: 'Bấm để mở phòng khám',
  pending: 'Bệnh nhân chưa đến quầy',
  confirmed: 'Bác sĩ gọi vào khám ngay',
  examined: 'Đã hoàn thành',
}

function KpiCard({ label, value, meta, metaBold, tone, onClick, disabled, title }) {
  return (
    <button
      type="button"
      className={`dash-kpi${tone ? ` dash-kpi--${tone}` : ''}`}
      onClick={onClick}
      disabled={disabled || !onClick}
      title={title}
    >
      <span className="dash-kpi-label">{label}</span>
      <span className="dash-kpi-value">{value}</span>
      {meta ? (
        <span className="dash-kpi-meta">
          {metaBold ? <strong>{meta}</strong> : meta}
        </span>
      ) : null}
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { token, user } = useMemo(() => getStaffSession(), [])
  const role = staffRole(user)
  const showStaffExtras = isReceptionStaff(user)
  const isDoctor = role === 'doctor'

  const [stats, setStats] = useState(null)
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
      } catch (err) {
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
    const id = setInterval(() => void loadStats({ silent: true }), REFRESH_MS)
    return () => {
      fetchGenRef.current += 1
      clearInterval(id)
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
    (arg = 'all') => {
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
    (ticket) => {
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
    clearStaffSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className={isDoctor ? 'dr-desk' : 'tcl-shell'}>
      {isDoctor ? (
        <DoctorAppHeader
          activeTab="stats"
          user={user}
          onLogout={logout}
          examBadge={waitingToday}
          onExamNavigate={() => goDoctor(waitingToday > 0 ? 'confirmed' : 'all')}
        />
      ) : (
        <>
        <RoleSidebar role="receptionist" active="dashboard" user={user} onLogout={logout} />
        <header className="tcl-top">
          <div className="tcl-brand">VITACARE</div>
          <nav className="tcl-nav" aria-label="Module">
            <button type="button" className="is-active">
              Thống kê
            </button>
            {showStaffExtras ? (
              <>
                <button type="button" onClick={() => navigate('/reception')}>
                  Lịch hẹn
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/registration', { state: { createNew: true } })}
                >
                  Đăng ký
                </button>
              </>
            ) : null}
          </nav>
          <div className="tcl-top-user">
            <span>{displayName(user)}</span>
            <button type="button" className="tcl-btn" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>
        </>
      )}

      <main className="dash-page">
        <div className="dash-intro">
          <div>
            <h1 className="dash-title">Thống kê</h1>
            <p className="dash-sub">
              {displayName(user)} · {roleLabelVi(role)} · {formatDateYmd(stats?.today)}
              {stats?.week ? ` · Tuần ${formatWeekRange(stats.week)}` : ''}
            </p>
          </div>
          <div className="dash-intro-actions">
            <button type="button" className="tcl-btn" onClick={() => void loadStats({ silent: true })}>
              Làm mới
            </button>
          </div>
        </div>

        {error ? (
          <div className="dash-err" role="alert">
            {error}
            <div className="dash-err-actions">
              <button type="button" className="tcl-btn" onClick={() => void loadStats({ silent: Boolean(stats) })}>
                Thử lại
              </button>
            </div>
          </div>
        ) : null}

        {loading && !stats ? (
          <p className="dash-muted">Đang tải…</p>
        ) : stats ? (
          <div className="dash-layout">
            <section className="dash-section" aria-labelledby="dash-kpi-today">
              <h2 id="dash-kpi-today" className="dash-section-title">
                {isDoctor ? 'Lịch của tôi — hôm nay' : 'Hôm nay'}
              </h2>
              {showStaffExtras && stats.patientsTotal != null ? (
                <p className="dash-section-hint">
                  Tổng {stats.patientsTotal.toLocaleString('vi-VN')} bệnh nhân trong hệ thống.
                </p>
              ) : null}
              {isDoctor ? (
                <div className="dash-kpi-grid dash-kpi-grid--doctor">
                  <KpiCard
                    label="Tổng lịch"
                    value={doctorTodayTotal}
                    meta={DOCTOR_KPI_META.total}
                    tone="dr-total"
                    title={kpiClickTitle}
                    onClick={() => goDoctor('all')}
                  />
                  <KpiCard
                    label="Chờ tiếp đón"
                    value={pendingToday}
                    meta={DOCTOR_KPI_META.pending}
                    tone="dr-pending"
                    title={kpiClickTitle}
                    onClick={() => goDoctor('all')}
                  />
                  <KpiCard
                    label="Đang chờ khám"
                    value={today?.confirmed ?? 0}
                    meta={DOCTOR_KPI_META.confirmed}
                    metaBold
                    tone="dr-waiting"
                    title={kpiClickTitle}
                    onClick={() => goDoctor('confirmed')}
                  />
                  <KpiCard
                    label="Đã khám"
                    value={today?.examined ?? 0}
                    meta={DOCTOR_KPI_META.examined}
                    tone="dr-done"
                    title={kpiClickTitle}
                    onClick={() => goDoctor('examined')}
                  />
                </div>
              ) : (
                <div className="dash-kpi-grid">
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
                    meta="Đã tiếp nhận — chờ bác sĩ khám"
                    title={kpiClickTitle}
                    onClick={() => goReception('confirmed')}
                  />
                  <KpiCard
                    label="Đã khám"
                    value={today?.examined ?? 0}
                    tone="success"
                    title={kpiClickTitle}
                    onClick={() => goReception('examined')}
                  />
                  <KpiCard
                    label="Đã hủy"
                    value={today?.cancelled ?? 0}
                    tone="cancelled"
                    title={kpiClickTitle}
                    onClick={() => goReception('cancelled')}
                  />
                </div>
              )}
            </section>

            {showStaffExtras && actions ? (
              <section className="dash-section" aria-labelledby="dash-actions">
                <h2 id="dash-actions" className="dash-section-title">
                  Việc cần xử lý
                </h2>
                <p className="dash-section-hint">Các lịch chờ xác nhận hôm nay — bấm để mở danh sách lọc theo trạng thái Chờ.</p>
                <div className="dash-action-grid">
                  <button
                    type="button"
                    className={`dash-action-card${actions.unpaidPending ? ' dash-action-card--urgent' : ''}`}
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'unpaid' })}
                  >
                    <strong>{actions.unpaidPending ?? 0}</strong>
                    <span>Chưa thu phí</span>
                  </button>
                  <button
                    type="button"
                    className="dash-action-card"
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'noRoom' })}
                  >
                    <strong>{actions.pendingNoRoom ?? 0}</strong>
                    <span>Chưa chọn phòng</span>
                  </button>
                  <button
                    type="button"
                    className="dash-action-card"
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'ready' })}
                  >
                    <strong>{actions.readyToConfirm ?? 0}</strong>
                    <span>Sẵn sàng xác nhận</span>
                  </button>
                  <button
                    type="button"
                    className={`dash-action-card${actions.expiringSoon ? ' dash-action-card--urgent' : ''}`}
                    onClick={() => goReception({ statusFilter: 'pending', dashFilter: 'expiring' })}
                  >
                    <strong>{actions.expiringSoon ?? 0}</strong>
                    <span>Quá giờ — sắp tự hủy</span>
                  </button>
                </div>
                {actions.alerts?.length ? (
                  <ul className="dash-alert-list" style={{ marginTop: '0.85rem' }}>
                    {actions.alerts.map((a) => (
                      <li key={a.id || a.ticket} className="dash-alert-item">
                        <span className="dash-alert-main">
                          <strong>{a.ticket || '—'}</strong>
                          {' · '}
                          {a.patientName || 'Bệnh nhân'}
                          {a.startTime ? ` · ${a.startTime}` : ''}
                        </span>
                        <button type="button" className="tcl-btn" onClick={() => openTicket(a.ticket)}>
                          Mở lịch
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            <div className={`dash-cols${showStaffExtras ? ' dash-cols--wide-right' : ''}`}>
              {showStaffExtras && revenue ? (
                <section className="dash-section" aria-labelledby="dash-revenue">
                  <h2 id="dash-revenue" className="dash-section-title">
                    Thu phí hôm nay
                  </h2>
                  <div className="dash-revenue">
                    <div className="dash-revenue-item dash-revenue-item--full">
                      <div className="dash-revenue-label">Tổng đã thu</div>
                      <div className="dash-revenue-value">{formatVnd(revenue.total)}</div>
                      <div className="dash-kpi-meta" style={{ marginTop: 4 }}>
                        {revenue.count ?? 0} lịch đã thanh toán
                      </div>
                    </div>
                    <div className="dash-revenue-item">
                      <div className="dash-revenue-label">Tiền mặt</div>
                      <div className="dash-revenue-value">{formatVnd(revenue.cash)}</div>
                    </div>
                    <div className="dash-revenue-item">
                      <div className="dash-revenue-label">Chuyển khoản</div>
                      <div className="dash-revenue-value">{formatVnd(revenue.transfer)}</div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="dash-section dash-section--chart" aria-labelledby="dash-week">
                <h2 id="dash-week" className="dash-section-title">
                  Tuần này
                </h2>
                <p className="dash-section-hint">
                  {isDoctor ? doctorWeekTotal : weekTotal} lịch
                  {!isDoctor && weekTotal > 0 ? ` · Tỷ lệ hủy ${cancelRateWeek}%` : ''}
                </p>
                <StatusBars
                  counts={week}
                  pendingLabel={isDoctor ? 'Chờ tiếp đón' : 'Chờ xác nhận'}
                  hideCancelled={isDoctor}
                />
              </section>

              {showStaffExtras && sources ? (
                <section className="dash-section dash-section--chart" aria-labelledby="dash-src">
                  <h2 id="dash-src" className="dash-section-title">
                    Nguồn đặt lịch (hôm nay)
                  </h2>
                  <SourceBars sources={sources} total={todayTotal} />
                </section>
              ) : null}

              {!isDoctor ? (
                <section className="dash-section dash-section--chart" aria-labelledby="dash-today-breakdown">
                  <h2 id="dash-today-breakdown" className="dash-section-title">
                    Phân bổ trạng thái (hôm nay)
                  </h2>
                  <StatusBars counts={today} />
                </section>
              ) : null}
            </div>

            {showStaffExtras && byRoom?.length ? (
              <section className="dash-section" aria-labelledby="dash-rooms">
                <h2 id="dash-rooms" className="dash-section-title">
                  Theo phòng khám (hôm nay)
                </h2>
                <table className="dash-room-table">
                  <thead>
                    <tr>
                      <th scope="col">Phòng</th>
                      <th scope="col">Tổng</th>
                      <th scope="col">Chờ</th>
                      <th scope="col">Xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byRoom.map((r) => (
                      <tr key={r.room}>
                        <td>{r.room}</td>
                        <td>{r.total}</td>
                        <td>{r.pending}</td>
                        <td>{r.confirmed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section className="dash-section dash-section--shortcuts" aria-labelledby="dash-go">
              <h2 id="dash-go" className="dash-section-title">
                Thao tác nhanh
              </h2>
              {role === 'receptionist' ? (
                <div className="dash-shortcuts">
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
              <div className="dash-actions">
                {role === 'receptionist' ? (
                  <>
                    <button type="button" className="tcl-btn" onClick={() => navigate('/reception')}>
                      Lịch hẹn
                    </button>
                  </>
                ) : null}
                {role === 'registration' ? (
                  <>
                    <button
                      type="button"
                      className="tcl-btn tcl-btn--pri"
                      onClick={() => navigate('/registration', { state: { createNew: true } })}
                    >
                      Đăng ký
                    </button>
                    <button type="button" className="tcl-btn tcl-btn--pri" onClick={() => navigate('/reception')}>
                      Lịch hẹn
                    </button>
                  </>
                ) : null}
                {role === 'doctor' ? (
                  <button
                    type="button"
                    className="tcl-btn tcl-btn--pri dash-btn-with-badge"
                    onClick={() => goDoctor(waitingToday > 0 ? 'confirmed' : 'all')}
                  >
                    Khám bệnh
                    {waitingToday > 0 ? (
                      <span className="dash-nav-badge" aria-label={`${waitingToday} ca chờ khám`}>
                        {waitingToday > 99 ? '99+' : waitingToday}
                      </span>
                    ) : null}
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
