import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDoctorAppointments } from '../api/appointments.js'
import '../styles/auth.css'
import '../styles/doctor-home.css'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getSession() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user')
  const user = safeParse(userRaw || 'null')
  return { token, user }
}

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${first} ${last}`.trim()
  return full || String(user?.displayName || user?.fullName || '').trim() || user?.email || 'Nhân viên'
}

function firstNameFromUser(user) {
  const fn = String(user?.firstName || '').trim()
  if (fn) return fn
  const dn = String(user?.displayName || '').trim()
  if (dn) return dn.split(/\s+/).slice(-1)[0]
  return 'bạn'
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function monthLabelVi(date) {
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return `Tháng ${m} / ${y}`
}

function dateKeyFromAppointmentDate(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    // usually ISO string
    return value.includes('T') ? value.slice(0, 10) : value.slice(0, 10)
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return ymd(d)
}

function timeLabel(v) {
  const s = String(v || '').trim()
  return s.length >= 5 ? s.slice(0, 5) : s
}

function buildMonthGrid(baseMonthDate) {
  // baseMonthDate: any date within month
  const year = baseMonthDate.getFullYear()
  const month = baseMonthDate.getMonth()

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // JS: 0=Sun..6=Sat -> convert to Monday-first index 0..6
  const jsDay = firstOfMonth.getDay()
  const startOffset = (jsDay + 6) % 7

  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null)
    } else {
      cells.push(new Date(year, month, dayNum))
    }
  }
  return cells
}

export default function DoctorHome() {
  const navigate = useNavigate()
  const { token, user } = getSession()
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => ymd(new Date()))
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (user.userType === 'receptionist') {
      navigate('/reception', { replace: true })
    }
  }, [token, user, navigate])

  const todayKey = useMemo(() => ymd(new Date()), [])
  const monthCells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor])

  useEffect(() => {
    if (!token) return
    if (user?.userType !== 'doctor') {
      queueMicrotask(() => setLoading(false))
      return
    }
    let mounted = true
    listDoctorAppointments({ token })
      .then((rows) => {
        if (!mounted) return
        setError('')
        setItems(rows || [])
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Không lấy được lịch khám.')
        setItems([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [token, user?.userType])

  const byDate = useMemo(() => {
    const map = new Map()
    for (const a of items || []) {
      const k = dateKeyFromAppointmentDate(a?.appointmentDate)
      if (!k) continue
      const prev = map.get(k) || []
      prev.push(a)
      map.set(k, prev)
    }
    // Sort each day by time
    for (const [k, rows] of map.entries()) {
      rows.sort((x, y) => String(x?.startTime || '').localeCompare(String(y?.startTime || '')))
      map.set(k, rows)
    }
    return map
  }, [items])

  const selectedRows = useMemo(() => byDate.get(selected) || [], [byDate, selected])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  if (!token || !user) return null

  return (
    <div className="dr-landing">
      <header className="dr-header">
        <div className="dr-brand" role="banner" aria-label="VitaCare Clinic">
          <span className="dr-brand-mark" aria-hidden="true">
            +
          </span>
          <span className="dr-brand-text">VitaCare Clinic</span>
        </div>

        <nav className="dr-nav" aria-label="Điều hướng chính">
          <button type="button" className="dr-nav-link is-active">
            Bảng điều khiển
          </button>
          <button type="button" className="dr-nav-link">
            Lịch khám
          </button>
          <button type="button" className="dr-nav-link">
            Tin tức và thông báo
          </button>
        </nav>

        <div className="dr-user">
          <span className="dr-user-greet">Xin chào, {displayName(user)}</span>
          <button type="button" className="dr-btn dr-btn--ghost" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dr-main" role="main" aria-label="Trang chủ bác sĩ">
        <h1 className="dr-title">
          Chào mừng quay trở lại, {firstNameFromUser(user)}!
        </h1>

        <section className="dr-card" aria-label="Lịch">
          <div className="dr-card-head">
            <div className="dr-card-title">Lịch</div>
            <div className="dr-card-actions">
              <select className="dr-select" aria-label="Bộ lọc lịch">
                <option>Tất cả lịch khám</option>
                <option>Hôm nay</option>
                <option>Tuần này</option>
              </select>
              <button type="button" className="dr-btn dr-btn--solid">
                Sự kiện mới
              </button>
            </div>
          </div>

          <div className="dr-cal">
            {error ? (
              <div className="dr-banner dr-banner--error" role="alert">
                {error}
              </div>
            ) : null}
            <div className="dr-cal-top">
              <button
                type="button"
                className="dr-cal-nav"
                aria-label="Tháng trước"
                onClick={() => {
                  setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }}
              >
                ‹
              </button>
              <div className="dr-cal-month" aria-live="polite">
                {monthLabelVi(monthCursor)}
              </div>
              <button
                type="button"
                className="dr-cal-nav"
                aria-label="Tháng sau"
                onClick={() => {
                  setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }}
              >
                ›
              </button>
            </div>

            <div className="dr-cal-grid" role="grid" aria-label="Lịch theo tháng">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => (
                <div key={w} className="dr-cal-dow" role="columnheader">
                  {w}
                </div>
              ))}

              {monthCells.map((d, idx) => {
                const key = d ? ymd(d) : `empty-${idx}`
                const isEmpty = !d
                const isToday = d ? ymd(d) === todayKey : false
                const isSelected = d ? ymd(d) === selected : false
                const count = d ? (byDate.get(ymd(d)) || []).length : 0
                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      'dr-cal-cell',
                      isEmpty ? 'is-empty' : '',
                      isToday ? 'is-today' : '',
                      isSelected ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="gridcell"
                    disabled={isEmpty}
                    onClick={() => {
                      if (!d) return
                      setSelected(ymd(d))
                    }}
                    aria-label={d ? `Ngày ${d.getDate()}` : 'Trống'}
                  >
                    {d ? (
                      <>
                        <span className="dr-cal-day">{d.getDate()}</span>
                        {count ? <span className="dr-cal-badge">{count}</span> : null}
                      </>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="dr-cal-foot">
              <div className="dr-cal-foot-title">Đang chọn</div>
              <div className="dr-cal-foot-value">{selected}</div>
            </div>

            <div className="dr-agenda" aria-label="Danh sách lịch theo ngày">
              <div className="dr-agenda-head">
                <div className="dr-agenda-title">Lịch khám trong ngày</div>
                <div className="dr-agenda-sub">
                  {loading ? 'Đang tải…' : `${selectedRows.length} ca`}
                </div>
              </div>

              {loading ? (
                <div className="dr-agenda-empty">Đang tải dữ liệu…</div>
              ) : selectedRows.length ? (
                <div className="dr-agenda-list">
                  {selectedRows.map((a) => {
                    const pid =
                      a?.patient?.displayName ||
                      [a?.patient?.lastName, a?.patient?.firstName].filter(Boolean).join(' ').trim() ||
                      a?.patient?.email ||
                      'Bệnh nhân'
                    const note = String(a?.note || '').trim()
                    const st = String(a?.status || '').toLowerCase()
                    return (
                      <div className="dr-agenda-row" key={String(a?.id || a?._id || `${a?.appointmentDate}-${a?.startTime}`)}>
                        <div className="dr-agenda-time">{timeLabel(a?.startTime) || '—'}</div>
                        <div className="dr-agenda-main">
                          <div className="dr-agenda-name">{pid}</div>
                          <div className="dr-agenda-meta">{note || 'Không ghi chú'}</div>
                        </div>
                        <span className={`dr-pill ${st === 'cancelled' ? 'is-bad' : st === 'confirmed' ? 'is-ok' : 'is-pending'}`}>
                          {st === 'cancelled' ? 'Đã hủy' : st === 'confirmed' ? 'Đã xác nhận' : 'Chờ'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="dr-agenda-empty">Không có lịch khám cho ngày này.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

