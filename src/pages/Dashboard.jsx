import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardStats } from '../api/stats.js'
import { clearStaffSession, getStaffSession, isReceptionStaff, staffRole } from '../utils/staffSession.js'
import '../styles/reception-home.css'
import '../styles/dashboard.css'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const { token, user } = useMemo(() => getStaffSession(), [])
  const role = staffRole(user)
  const showPatients = isReceptionStaff(user)

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
    return () => {
      fetchGenRef.current += 1
    }
  }, [token, navigate, loadStats])

  if (!token || !user) return null

  const today = stats?.appointments?.today
  const week = stats?.appointments?.week
  const sources = stats?.sourcesToday

  return (
    <div className="tcl-shell">
      <header className="tcl-top">
        <div className="tcl-brand">VITACARE</div>
        <nav className="tcl-nav" aria-label="Module">
          <button type="button" className="is-active">
            Thống kê
          </button>
          {showPatients ? (
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
          ) : (
            <button type="button" onClick={() => navigate('/doctor')}>
              Khám bệnh
            </button>
          )}
        </nav>
        <div className="tcl-top-user">
          <span>{displayName(user)}</span>
          <button
            type="button"
            className="tcl-btn"
            onClick={() => {
              clearStaffSession()
              navigate('/login', { replace: true })
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dash-page">
        <div className="dash-intro">
          <h1 className="dash-title">Thống kê</h1>
          <p className="dash-sub">
            {displayName(user)} · {roleLabelVi(role)} ·{' '}
            {stats?.today ? stats.today.split('-').reverse().join('/') : todayLabelVi()}
            {stats?.week ? ` · Tuần: ${formatWeekRange(stats.week)}` : ''}
          </p>
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
          <div className="dash-stack">
            <section className="dash-block" aria-labelledby="dash-today">
              <h2 id="dash-today" className="dash-block-title">
                Hôm nay
              </h2>
              <table className="dash-table">
                <tbody>
                  {showPatients && stats.patientsTotal != null ? (
                    <tr>
                      <th scope="row">Tổng bệnh nhân</th>
                      <td>{stats.patientsTotal}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <th scope="row">Tổng lịch</th>
                    <td>{today?.total ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Chờ xác nhận</th>
                    <td>{today?.pending ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đã xác nhận</th>
                    <td>{today?.confirmed ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đã khám</th>
                    <td>{today?.examined ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đã hủy</th>
                    <td>{today?.cancelled ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="dash-block" aria-labelledby="dash-week">
              <h2 id="dash-week" className="dash-block-title">
                Tuần này
              </h2>
              <table className="dash-table">
                <tbody>
                  <tr>
                    <th scope="row">Tổng lịch</th>
                    <td>{week?.total ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Chờ xác nhận</th>
                    <td>{week?.pending ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đã xác nhận</th>
                    <td>{week?.confirmed ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đã khám</th>
                    <td>{week?.examined ?? 0}</td>
                  </tr>
                  <tr>
                    <th scope="row">Đã hủy</th>
                    <td>{week?.cancelled ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {showPatients && sources ? (
              <section className="dash-block" aria-labelledby="dash-src">
                <h2 id="dash-src" className="dash-block-title">
                  Nguồn đặt lịch (hôm nay)
                </h2>
                <table className="dash-table">
                  <tbody>
                    <tr>
                      <th scope="row">Tại quầy</th>
                      <td>{sources.clinic ?? 0}</td>
                    </tr>
                    <tr>
                      <th scope="row">Trực tuyến</th>
                      <td>{sources.online ?? 0}</td>
                    </tr>
                    {(sources.other ?? 0) > 0 ? (
                      <tr>
                        <th scope="row">Khác</th>
                        <td>{sources.other}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section className="dash-block" aria-labelledby="dash-go">
              <h2 id="dash-go" className="dash-block-title">
                Thao tác
              </h2>
              <div className="dash-actions">
                {role === 'receptionist' ? (
                  <>
                    <button type="button" className="tcl-btn tcl-btn--pri" onClick={() => navigate('/reception')}>
                      Lịch hẹn
                    </button>
                    <button
                      type="button"
                      className="tcl-btn tcl-btn--pri"
                      onClick={() => navigate('/registration', { state: { createNew: true } })}
                    >
                      Đăng ký
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
                  <button type="button" className="tcl-btn tcl-btn--pri" onClick={() => navigate('/doctor')}>
                    Khám bệnh
                  </button>
                ) : null}
                <button type="button" className="tcl-btn" onClick={() => void loadStats({ silent: true })}>
                  Làm mới số liệu
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
