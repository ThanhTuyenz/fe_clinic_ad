import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDoctorAppointments } from '../api/appointments.js'
import {
  appointmentCreatorName,
  appointmentSourceLabel,
  appointmentSourceTitle,
  appointmentSourceValue,
} from '../utils/appointmentSource.js'
import { getStaffSession } from '../utils/staffSession.js'
import '../styles/auth.css'
import '../styles/doctor-home.css'

function getSession() {
  return getStaffSession()
}

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${first} ${last}`.trim()
  return full || String(user?.displayName || user?.fullName || '').trim() || user?.email || 'Bác sĩ'
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function dateKeyFromAppointmentDate(value) {
  if (!value) return ''
  if (typeof value === 'string') {
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

function patientLabel(a) {
  const p = a?.patient
  const fromParts = [p?.lastName, p?.firstName].filter(Boolean).join(' ').trim()
  return (
    String(p?.displayName || '').trim() ||
    fromParts ||
    String(p?.email || '').trim() ||
    'Bệnh nhân'
  )
}

function sourceCreatorLabel(appointment) {
  if (appointmentSourceValue(appointment) !== 'clinic') return '—'
  return appointmentCreatorName(appointment) || 'Nhân viên phòng khám'
}

function statusLabelVi(st) {
  const s = String(st || '').toLowerCase()
  if (s === 'cancelled') return 'Đã hủy'
  if (s === 'confirmed') return 'Chờ khám'
  return 'Chờ'
}

function formatDobVi(iso) {
  if (!iso) return '—'
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function DoctorHome() {
  const navigate = useNavigate()
  const { token, user } = getSession()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTicket, setFilterTicket] = useState('')
  const [filterFrom, setFilterFrom] = useState(() => ymd(new Date()))
  const [filterTo, setFilterTo] = useState(() => ymd(new Date()))
  const [filterName, setFilterName] = useState('')
  const [filterPatientCode, setFilterPatientCode] = useState('')
  const [filterRoom, setFilterRoom] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [selectedApptId, setSelectedApptId] = useState(null)
  const [examSubTab, setExamSubTab] = useState('info')

  const [vitals, setVitals] = useState({
    examAt: '',
    clinicRoom: 'Phòng nội tổng quát',
    temp: '',
    breath: '',
    bp: '',
    pulse: '',
    height: '',
    weight: '',
    bmi: '',
    spo2: '',
    symptoms: '',
    notes: '',
  })

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (user.userType === 'receptionist') {
      navigate('/reception', { replace: true })
    }
  }, [token, user, navigate])

  const loadAppointments = useMemo(() => {
    return async ({ silent } = { silent: false }) => {
      if (!token) return
      if (user?.userType !== 'doctor') {
        queueMicrotask(() => setLoading(false))
        return
      }
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)
      try {
        const rows = await listDoctorAppointments({ token })
        setError('')
        const onlyConfirmed = (rows || []).filter((a) => String(a?.status || '').toLowerCase() === 'confirmed')
        setItems(onlyConfirmed)
      } catch (err) {
        setError(err?.message || 'Không lấy được lịch khám.')
        setItems([])
      } finally {
        if (!silent) setLoading(false)
        setRefreshing(false)
      }
    }
  }, [token, user?.userType])

  useEffect(() => {
    let mounted = true
    void (async () => {
      if (!mounted) return
      await loadAppointments({ silent: false })
    })()
    return () => {
      mounted = false
    }
  }, [loadAppointments])

  useEffect(() => {
    if (!token || user?.userType !== 'doctor') return
    const t = setInterval(() => {
      void loadAppointments({ silent: true })
    }, 15000)
    return () => clearInterval(t)
  }, [token, user?.userType, loadAppointments])

  const filteredQueue = useMemo(() => {
    let rows = [...(items || [])]
    rows.sort((a, b) => {
      const da = dateKeyFromAppointmentDate(a?.appointmentDate)
      const db = dateKeyFromAppointmentDate(b?.appointmentDate)
      if (da !== db) return String(da).localeCompare(String(db))
      return String(a?.startTime || '').localeCompare(String(b?.startTime || ''))
    })

    if (filterFrom) {
      rows = rows.filter((a) => {
        const k = dateKeyFromAppointmentDate(a?.appointmentDate)
        return k && k >= filterFrom
      })
    }
    if (filterTo) {
      rows = rows.filter((a) => {
        const k = dateKeyFromAppointmentDate(a?.appointmentDate)
        return k && k <= filterTo
      })
    }
    const ft = filterTicket.trim().toLowerCase()
    if (ft) {
      rows = rows.filter((a) => String(a?.ticket || a?.id || '').toLowerCase().includes(ft))
    }
    const fn = filterName.trim().toLowerCase()
    if (fn) {
      rows = rows.filter((a) => patientLabel(a).toLowerCase().includes(fn))
    }
    const fp = filterPatientCode.trim().toLowerCase()
    if (fp) {
      rows = rows.filter((a) => String(a?.patient?.patientCode || '').toLowerCase().includes(fp))
    }
    if (filterStatus !== 'all') {
      rows = rows.filter((a) => String(a?.status || '').toLowerCase() === filterStatus)
    }
    return rows
  }, [items, filterFrom, filterTo, filterTicket, filterName, filterPatientCode, filterStatus])

  const totalFiltered = filteredQueue.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(page, pageCount)
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredQueue.slice(start, start + pageSize)
  }, [filteredQueue, safePage])

  useEffect(() => {
    setPage(1)
  }, [filterFrom, filterTo, filterTicket, filterName, filterPatientCode, filterStatus])

  const selectedAppt = useMemo(() => {
    if (!selectedApptId) return null
    return items.find((a) => String(a?.id || a?._id) === String(selectedApptId)) || null
  }, [items, selectedApptId])

  useEffect(() => {
    if (!selectedAppt) return
    const d = dateKeyFromAppointmentDate(selectedAppt?.appointmentDate)
    const t = timeLabel(selectedAppt?.startTime)
    setVitals((s) => ({
      ...s,
      examAt: d && t ? `${formatDobVi(`${d}T12:00:00`)} ${t}` : formatDobVi(new Date()) + ` ${pad2(new Date().getHours())}:${pad2(new Date().getMinutes())}`,
      symptoms: String(selectedAppt?.note || '').trim() || s.symptoms,
    }))
  }, [selectedAppt])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  if (!token || !user) return null

  return (
    <div className="dr-desk">
      <header className="dr-topbar">
        <div className="dr-brand" role="banner" aria-label="VitaCare Clinic">
          <span className="dr-brand-mark" aria-hidden="true">
            +
          </span>
          <span className="dr-brand-text">VitaCare Clinic</span>
        </div>

        <nav className="dr-topnav" aria-label="Điều hướng phân hệ">
          <button type="button" className="dr-topnav-item is-active">
            Khám bệnh
          </button>
          <button type="button" className="dr-topnav-item is-disabled" disabled title="Sắp có">
            Cận lâm sàng
          </button>
          <button type="button" className="dr-topnav-item is-disabled" disabled title="Sắp có">
            PT - TT
          </button>
          <button type="button" className="dr-topnav-item is-disabled" disabled title="Sắp có">
            Thu chi
          </button>
          <button type="button" className="dr-topnav-item is-disabled" disabled title="Sắp có">
            Báo cáo
          </button>
        </nav>

        <div className="dr-topbar-right">
          <span className="dr-user-name">{displayName(user)}</span>
          <button type="button" className="dr-btn dr-btn--ghost dr-logout" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dr-view dr-view--exam" role="main">
        {error ? (
          <div className="dr-banner dr-banner--error dr-banner--flush" role="alert">
            {error}
          </div>
        ) : null}
        <div className="dr-split">
            <aside className="dr-side" aria-label="Danh sách đăng ký">
              <div className="dr-filter-grid">
                <label className="dr-field">
                  <span className="dr-field-label">Trạng thái</span>
                  <select className="dr-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="confirmed">Chờ khám</option>
                  </select>
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Mã KCB</span>
                  <input
                    className="dr-input"
                    value={filterTicket}
                    onChange={(e) => setFilterTicket(e.target.value)}
                    placeholder="Mã vé / KCB"
                  />
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Từ ngày</span>
                  <input className="dr-input" type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Đến ngày</span>
                  <input className="dr-input" type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Họ tên</span>
                  <input className="dr-input" value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Tìm theo tên" />
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Mã BN</span>
                  <input
                    className="dr-input"
                    value={filterPatientCode}
                    onChange={(e) => setFilterPatientCode(e.target.value)}
                    placeholder="Mã bệnh nhân"
                  />
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Phòng đăng ký</span>
                  <select className="dr-input" value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="noi">Phòng nội tổng quát</option>
                    <option value="ngoai">Phòng ngoại</option>
                  </select>
                </label>
                <label className="dr-field">
                  <span className="dr-field-label">Ưu tiên</span>
                  <select className="dr-input" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </label>
              </div>

              <div className="dr-reg-head">
                <div className="dr-reg-title">Danh sách đăng ký</div>
                <div className="dr-reg-tools">
                  <button type="button" className="dr-icon-btn" title="Tải lên" aria-label="Tải lên">
                    ↑
                  </button>
                  <button
                    type="button"
                    className="dr-icon-btn"
                    title="Làm mới"
                    aria-label="Làm mới"
                    onClick={() => void loadAppointments({ silent: true })}
                  >
                    ↻
                  </button>
                  <button type="button" className="dr-icon-btn" title="Cài đặt" aria-label="Cài đặt">
                    ⚙
                  </button>
                </div>
              </div>

              <div className="dr-table-wrap">
                <table className="dr-table">
                  <thead>
                    <tr>
                      <th className="col-tt">TT</th>
                      <th>STT</th>
                      <th>Mã KCB</th>
                      <th>Nguồn</th>
                      <th>Mã BN</th>
                      <th>Tên BN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="dr-table-empty">
                          Đang tải…
                        </td>
                      </tr>
                    ) : pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="dr-table-empty">
                          Không có bản ghi phù hợp.
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((a, i) => {
                        const id = String(a?.id || a?._id || '')
                        const st = String(a?.status || '').toLowerCase()
                        const sel = selectedApptId && id === String(selectedApptId)
                        return (
                          <tr
                            key={id || `${i}`}
                            className={sel ? 'is-selected' : ''}
                            onClick={() => setSelectedApptId(id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setSelectedApptId(id)
                              }
                            }}
                            tabIndex={0}
                            role="button"
                          >
                            <td className="col-tt">
                              <span className={`dr-dot ${st === 'confirmed' ? 'is-wait' : ''}`} title={statusLabelVi(st)} />
                            </td>
                            <td>{(safePage - 1) * pageSize + i + 1}</td>
                            <td>{String(a?.ticket || a?.id || '—').slice(0, 14)}</td>
                            <td>
                              <span
                                className={`dr-source-pill dr-source-pill--${appointmentSourceValue(a)}`}
                                title={appointmentSourceTitle(a)}
                              >
                                {appointmentSourceLabel(a)}
                              </span>
                            </td>
                            <td>{a?.patient?.patientCode || '—'}</td>
                            <td>{patientLabel(a)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="dr-pagination">
                <span>
                  {totalFiltered ? `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, totalFiltered)} của ${totalFiltered}` : '0 của 0'}
                </span>
                <span className="dr-pagination-pages">{pageSize} / trang</span>
                <button type="button" className="dr-page-btn" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </button>
                <button
                  type="button"
                  className="dr-page-btn"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  ›
                </button>
              </div>
            </aside>

            <section className="dr-panel" aria-label="Khám bệnh">
              <div className="dr-panel-top">
                <div className="dr-subtabs" role="tablist">
                  {[
                    { id: 'info', label: 'Thông tin khám bệnh' },
                    { id: 'services', label: 'Kê dịch vụ' },
                    { id: 'rx', label: 'Đơn thuốc' },
                    { id: 'history', label: 'Lịch sử khám' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={examSubTab === t.id}
                      className={`dr-subtab${examSubTab === t.id ? ' is-active' : ''}`}
                      onClick={() => setExamSubTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="dr-panel-actions">
                  <button type="button" className="dr-btn dr-btn--muted" disabled={!selectedAppt}>
                    Kết thúc khám
                  </button>
                  <button type="button" className="dr-btn dr-btn--primary" disabled={!selectedAppt}>
                    Lưu
                  </button>
                </div>
              </div>

              <div className="dr-panel-alert" role="status">
                Bạn đang xem thông tin khám bệnh
                {selectedAppt ? ` — ${patientLabel(selectedAppt)}` : ''}
              </div>

              {examSubTab !== 'info' ? (
                <div className="dr-placeholder">Nội dung đang phát triển.</div>
              ) : (
                <>
                  <div className="dr-section">
                    <div className="dr-section-title">Thông tin người đăng ký</div>
                    <div className="dr-info-grid">
                      <div className="dr-kv">
                        <span className="dr-k">Mã lịch hẹn</span>
                        <span className="dr-v">{selectedAppt ? String(selectedAppt.id || selectedAppt._id || '—') : '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Mã KCB</span>
                        <span className="dr-v">{selectedAppt?.ticket || '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Nguồn đăng ký</span>
                        <span className="dr-v">{selectedAppt ? appointmentSourceTitle(selectedAppt) : '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Nhân viên tạo lịch</span>
                        <span className="dr-v">{selectedAppt ? sourceCreatorLabel(selectedAppt) : '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Mã bệnh nhân</span>
                        <span className="dr-v">{selectedAppt?.patient?.patientCode || '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Họ tên</span>
                        <span className="dr-v">{selectedAppt ? patientLabel(selectedAppt) : '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Điện thoại</span>
                        <span className="dr-v">{selectedAppt?.patient?.phone || '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Ngày sinh</span>
                        <span className="dr-v">{selectedAppt?.patient?.dob ? formatDobVi(selectedAppt.patient.dob) : '—'}</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Giới tính</span>
                        <span className="dr-v">
                          {(() => {
                            const g = String(selectedAppt?.patient?.gender || '').trim()
                            if (!g) return '—'
                            if (/^(male|nam)$/i.test(g)) return 'Nam'
                            if (/^(female|nữ|nu)$/i.test(g)) return 'Nữ'
                            return g
                          })()}
                        </span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Ngày đăng ký</span>
                        <span className="dr-v">
                          {selectedAppt ? formatDobVi(`${dateKeyFromAppointmentDate(selectedAppt.appointmentDate)}T12:00:00`) : '—'}
                        </span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Phòng đăng ký</span>
                        <span className="dr-v">Phòng nội tổng quát</span>
                      </div>
                      <div className="dr-kv">
                        <span className="dr-k">Số đăng ký</span>
                        <span className="dr-v">—</span>
                      </div>
                      <div className="dr-kv dr-kv--full">
                        <span className="dr-k">Địa chỉ</span>
                        <span className="dr-v">{selectedAppt?.patient?.address || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dr-section">
                    <div className="dr-section-title">Khám lâm sàng</div>
                    <div className="dr-info-grid dr-info-grid--tight">
                      <label className="dr-field">
                        <span className="dr-field-label">Ngày khám</span>
                        <input
                          className="dr-input"
                          value={vitals.examAt}
                          onChange={(e) => setVitals((s) => ({ ...s, examAt: e.target.value }))}
                          disabled={!selectedAppt}
                        />
                      </label>
                      <label className="dr-field">
                        <span className="dr-field-label">Bác sĩ</span>
                        <select className="dr-input" disabled={!selectedAppt}>
                          <option>{displayName(user)}</option>
                        </select>
                      </label>
                      <label className="dr-field">
                        <span className="dr-field-label">Phòng khám</span>
                        <select
                          className="dr-input"
                          value={vitals.clinicRoom}
                          onChange={(e) => setVitals((s) => ({ ...s, clinicRoom: e.target.value }))}
                          disabled={!selectedAppt}
                        >
                          <option>Phòng nội tổng quát</option>
                          <option>Phòng ngoại</option>
                        </select>
                      </label>
                    </div>

                    <div className="dr-vitals">
                      {[
                        ['temp', 'Nhiệt độ (°C)'],
                        ['breath', 'Nhịp thở (L/P)'],
                        ['bp', 'Huyết áp (mmHg)'],
                        ['pulse', 'Mạch (L/P)'],
                        ['height', 'Chiều cao (cm)'],
                        ['weight', 'Cân nặng (kg)'],
                        ['bmi', 'BMI (kg/m²)'],
                        ['spo2', 'SPO₂ (%)'],
                      ].map(([key, lab]) => (
                        <label key={key} className="dr-field">
                          <span className="dr-field-label">{lab}</span>
                          <input
                            className="dr-input"
                            value={vitals[key]}
                            onChange={(e) => setVitals((s) => ({ ...s, [key]: e.target.value }))}
                            disabled={!selectedAppt}
                          />
                        </label>
                      ))}
                    </div>

                    <label className="dr-field dr-field--block">
                      <span className="dr-field-label">Triệu chứng</span>
                      <textarea
                        className="dr-textarea"
                        rows={2}
                        value={vitals.symptoms}
                        onChange={(e) => setVitals((s) => ({ ...s, symptoms: e.target.value }))}
                        disabled={!selectedAppt}
                      />
                    </label>
                    <label className="dr-field dr-field--block">
                      <span className="dr-field-label">Ghi chú</span>
                      <textarea
                        className="dr-textarea"
                        rows={2}
                        value={vitals.notes}
                        onChange={(e) => setVitals((s) => ({ ...s, notes: e.target.value }))}
                        disabled={!selectedAppt}
                      />
                    </label>
                  </div>

                  <div className="dr-section">
                    <div className="dr-section-title">Chẩn đoán</div>
                    <div className="dr-table-wrap">
                      <table className="dr-table dr-table--dx">
                        <thead>
                          <tr>
                            <th>BC</th>
                            <th>Mã ICD</th>
                            <th>Tên bệnh</th>
                            <th>Diễn giải</th>
                            <th className="col-act">#</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="dr-table-empty">
                              Chưa có dòng chẩn đoán. Chọn bệnh nhân và nhập sau khi tích hợp ICD.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
      </main>
    </div>
  )
}
