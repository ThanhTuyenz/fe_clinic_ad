import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listReceptionAppointments,
  lookupAppointmentByTicket,
  updateAppointmentStatus,
} from '../api/appointments.js'
import {
  appointmentCreatorName,
  appointmentSourceLabel,
  appointmentSourceTitle,
  appointmentSourceValue,
} from '../utils/appointmentSource.js'
import { isPendingAppointmentPastSlot } from '../utils/appointmentExpiry.js'
import { getStaffSession } from '../utils/staffSession.js'
import '../styles/reception-home.css'

function getSession() {
  return getStaffSession()
}

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

function sourceCreatorLabel(appointment) {
  if (appointmentSourceValue(appointment) !== 'clinic') return '—'
  return appointmentCreatorName(appointment) || 'Nhân viên phòng khám'
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatDateVi(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatDateTimeVi(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatDob(iso) {
  if (!iso) return '—'
  return formatDateVi(iso)
}

function buildPatientCode(userId) {
  const raw = String(userId || '').replace(/[^a-fA-F0-9]/g, '')
  const yy = String(new Date().getFullYear()).slice(-2)
  const pad = (raw + '00000000').slice(0, 8).toUpperCase()
  return `YM${yy}${pad}`
}

function statusDotClass(st) {
  const s = String(st || '').toLowerCase()
  if (s === 'confirmed') return 'tcl-stt-dot--confirmed'
  if (s === 'cancelled') return 'tcl-stt-dot--cancelled'
  return 'tcl-stt-dot--pending'
}

function statusLabelVi(st) {
  const s = String(st || '').toLowerCase()
  if (s === 'confirmed') return 'Đã xác nhận'
  if (s === 'cancelled') return 'Từ chối'
  if (s === 'examined' || s === 'completed' || s === 'done') return 'Đã khám'
  return 'Chờ'
}

const PAGE_SIZE = 10

function normalizeStatus(st) {
  const s = String(st || '').toLowerCase()
  if (s === 'done' || s === 'completed') return 'examined'
  return s || 'pending'
}

/** Quét pending trong khoảng ngày; hủy các lịch đã quá hết khung giờ mà chưa được xác nhận. */
async function expireStalePendingInRange({ token, from, to }) {
  const pendingRows = await listReceptionAppointments({
    token,
    from,
    to,
    status: 'pending',
  })
  const stale = (pendingRows || []).filter((r) => isPendingAppointmentPastSlot(r))
  let anyOk = false
  for (const row of stale) {
    try {
      await updateAppointmentStatus({
        token,
        appointmentId: row.id,
        status: 'cancelled',
      })
      anyOk = true
    } catch {
      /* có thể đã xử lý ở tab/phiên khác */
    }
  }
  return anyOk
}

export default function ReceptionHome() {
  const navigate = useNavigate()
  const { token, user } = getSession()

  const [fromDate, setFromDate] = useState(() => ymd(new Date()))
  const [toDate, setToDate] = useState(() => ymd(new Date()))
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterTicket, setFilterTicket] = useState('')
  const [filterPatientCode, setFilterPatientCode] = useState('')
  const [filterName, setFilterName] = useState('')

  const [list, setList] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [listErr, setListErr] = useState('')
  const [page, setPage] = useState(0)

  const [selectedId, setSelectedId] = useState(null)
  const [lookupDetail, setLookupDetail] = useState(null)
  const [detailById, setDetailById] = useState(() => ({}))
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [detailErr, setDetailErr] = useState('')

  const [detailStatus, setDetailStatus] = useState('pending')
  const [saveMsg, setSaveMsg] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [saving, setSaving] = useState(false)

  const [ticket, setTicket] = useState('')
  const [ticketErr, setTicketErr] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.userType !== 'receptionist') {
      navigate('/doctor', { replace: true })
    }
  }, [token, user, navigate])

  const loadList = useCallback(async () => {
    if (!token) return
    setListLoading(true)
    setListErr('')
    try {
      let rows = await listReceptionAppointments({
        token,
        from: fromDate,
        to: toDate,
        status: statusFilter,
      })
      const didExpire = await expireStalePendingInRange({ token, from: fromDate, to: toDate })
      if (didExpire) {
        rows = await listReceptionAppointments({
          token,
          from: fromDate,
          to: toDate,
          status: statusFilter,
        })
      }
      setList(rows || [])
      setPage(0)
    } catch (e) {
      setListErr(e?.message || 'Không tải được danh sách.')
      setList([])
    } finally {
      setListLoading(false)
    }
  }, [token, fromDate, toDate, statusFilter])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (!token) return undefined
    const t = setInterval(() => {
      void loadList()
    }, 60000)
    return () => clearInterval(t)
  }, [token, loadList])

  const filteredRows = useMemo(() => {
    const ft = filterTicket.trim().toLowerCase()
    const fp = filterPatientCode.trim().toLowerCase()
    const fn = filterName.trim().toLowerCase()
    return (list || []).filter((r) => {
      if (ft && !String(r.ticket || '').toLowerCase().includes(ft)) return false
      if (fp && !String(r.patient?.patientCode || '').toLowerCase().includes(fp)) return false
      if (fn && !String(r.patient?.displayName || '').toLowerCase().includes(fn)) return false
      return true
    })
  }, [list, filterTicket, filterPatientCode, filterName])

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, page])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  const activeDetail = useMemo(() => {
    if (selectedId) {
      const cached = detailById[String(selectedId)]
      if (cached) return cached
      const row = list.find((a) => String(a.id) === String(selectedId))
      if (row) return row
    }
    if (lookupDetail) return lookupDetail
    return null
  }, [selectedId, list, lookupDetail, detailById])

  const currentStatus = useMemo(() => normalizeStatus(activeDetail?.status), [activeDetail?.status])
  const canEditStatus = currentStatus === 'pending'

  const lastDetailIdRef = useRef(null)
  useEffect(() => {
    if (!activeDetail) return
    const currentId = String(activeDetail.id ?? '')
    if (currentId && lastDetailIdRef.current === currentId) return
    lastDetailIdRef.current = currentId
    setDetailStatus(normalizeStatus(activeDetail.status || 'pending'))
  }, [activeDetail])

  function normalizeLookup(data) {
    return {
      id: data.appointment.id,
      ticket: data.ticket,
      appointmentDate: data.appointment.appointmentDate,
      startTime: data.appointment.startTime,
      endTime: data.appointment.endTime || '',
      status: data.appointment.status,
      source: data.appointment.source || data.appointment.bookingSource || data.source,
      bookingSource: data.appointment.bookingSource || data.appointment.source || data.source,
      createdByStaff: data.appointment.createdByStaff || data.appointment.createdByReceptionist || data.createdByStaff,
      note: data.appointment.note || '',
      createdAt: data.appointment.createdAt,
      patient: data.patient
        ? {
            ...data.patient,
            patientCode: data.patient.patientCode || buildPatientCode(data.patient.id),
          }
        : null,
      doctor: data.doctor,
    }
  }

  const runLookup = useCallback(
    async (raw) => {
      const t = String(raw != null ? raw : ticket).trim()
      setTicketErr('')
      setLookupLoading(true)
      setDetailErr('')
      if (!t) {
        setTicketErr('Vui lòng nhập mã vé (YMA…).')
        setLookupLoading(false)
        return
      }
      try {
        const data = await lookupAppointmentByTicket({ token, ticket: t })
        const norm = normalizeLookup(data)
        setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
        const found = list.find((r) => String(r.id) === String(norm.id))
        if (found) {
          setSelectedId(String(found.id))
          setLookupDetail(null)
        } else {
          setSelectedId(null)
          setLookupDetail(norm)
        }
        setSaveMsg('')
        setSaveErr('')
      } catch (e) {
        setTicketErr(e?.message || 'Không tra cứu được.')
        setLookupDetail(null)
      } finally {
        setLookupLoading(false)
      }
    },
    [token, ticket, list],
  )

  async function handleSaveStatus() {
    if (!activeDetail?.id) return
    setSaveErr('')
    setSaveMsg('')
    if (!canEditStatus) {
      setSaveErr('Chỉ có thể xác nhận/hủy khi lịch ở trạng thái Chờ xác nhận.')
      return
    }
    const next = normalizeStatus(detailStatus || '')
    if (next !== 'confirmed' && next !== 'cancelled') {
      setSaveErr('Vui lòng chọn Xác nhận hoặc Hủy.')
      return
    }
    setSaving(true)
    try {
      await updateAppointmentStatus({
        token,
        appointmentId: activeDetail.id,
        status: next,
      })
      setSaveMsg('Đã lưu trạng thái lịch hẹn.')
      setDetailById((prev) => {
        const key = String(activeDetail.id)
        const cur = prev[key]
        if (!cur) return prev
        return { ...prev, [key]: { ...cur, status: next } }
      })
      await loadList()
      setLookupDetail(null)
      setSelectedId(String(activeDetail.id))
    } catch (e) {
      setSaveErr(e?.message || 'Không lưu được.')
    } finally {
      setSaving(false)
    }
  }

  async function selectRow(row) {
    if (!row) return
    const id = String(row.id)
    setLookupDetail(null)
    setSelectedId(id)
    setSaveMsg('')
    setSaveErr('')
    setDetailErr('')
    setTicket(String(row.ticket || ''))

    if (!row.ticket || !token) return
    if (detailById[id]) return

    setDetailLoadingId(id)
    try {
      const data = await lookupAppointmentByTicket({ token, ticket: row.ticket })
      const norm = normalizeLookup(data)
      setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
    } catch (e) {
      setDetailErr(e?.message || 'Không tải được chi tiết lịch hẹn.')
    } finally {
      setDetailLoadingId(null)
    }
  }

  function handleAdd() {
    navigate('/registration', { state: { createNew: true } })
  }

  async function openRegistrationFromActive() {
    if (!token || !activeDetail?.ticket) return
    setSaveErr('')
    setSaveMsg('')
    setDetailErr('')

    let detail = activeDetail
    const hasNeeded =
      Boolean(detail?.patient) &&
      Boolean(detail?.doctor?.id) &&
      Boolean(detail?.appointmentDate) &&
      Boolean(detail?.startTime)

    if (!hasNeeded) {
      const id = String(detail?.id || '')
      setDetailLoadingId(id || 'lookup')
      try {
        const data = await lookupAppointmentByTicket({ token, ticket: detail.ticket })
        const norm = normalizeLookup(data)
        setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
        detail = norm
      } catch (e) {
        setDetailErr(e?.message || 'Không tải được chi tiết lịch hẹn.')
        return
      } finally {
        setDetailLoadingId(null)
      }
    }

    navigate('/registration', {
      state: {
        appointmentId: detail.id,
        ticket: detail.ticket,
        appointmentDate: detail.appointmentDate,
        startTime: detail.startTime,
        note: detail.note,
        createdAt: detail.createdAt,
        source: detail.source,
        bookingSource: detail.bookingSource,
        createdByStaff: detail.createdByStaff,
        patient: detail.patient,
        doctor: detail.doctor,
        doctorId: detail.doctor?.id ?? '',
        specialtyId: detail.doctor?.specialtyID ?? detail.doctor?.specialtyId ?? '',
      },
    })
  }

  if (!token || !user || user.userType !== 'receptionist') return null

  return (
    <div className="tcl-shell">
      <header className="tcl-top">
        <div className="tcl-brand">VITACARE</div>
        <nav className="tcl-nav" aria-label="Module">
          <button type="button" className="is-active">
            Lịch hẹn
          </button>
          <button type="button" onClick={() => navigate('/registration', { state: { createNew: true } })}>
            Đăng ký
          </button>
          <button type="button" disabled>
            Khám bệnh
          </button>
          <button type="button" disabled>
            Báo cáo
          </button>
        </nav>
        <div className="tcl-top-user">
          <span>{displayName(user)}</span>
          <button
            type="button"
            className="tcl-btn"
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              sessionStorage.removeItem('token')
              sessionStorage.removeItem('user')
              navigate('/login', { replace: true })
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="tcl-page">
        <div className="tcl-bar">
          <h1>Lịch hẹn</h1>
          <div className="tcl-bar-actions">
            <button type="button" className="tcl-btn tcl-btn--pri" onClick={handleAdd}>
              + Thêm
            </button>
            <button
              type="button"
              className="tcl-btn tcl-btn--pri"
              disabled={!activeDetail || saving || !canEditStatus}
              onClick={() => void handleSaveStatus()}
            >
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button type="button" className="tcl-btn tcl-btn--danger" disabled title="Chưa hỗ trợ">
              Xóa
            </button>
          </div>
        </div>

        <div className="tcl-split">
          <aside className="tcl-sidebar">
            <div className="tcl-filters">
              <div className="tcl-filters-row">
                <div>
                  <label>Trạng thái</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                <div>
                  <label>Mã lịch hẹn</label>
                  <input
                    value={filterTicket}
                    onChange={(e) => setFilterTicket(e.target.value)}
                    placeholder="YMA…"
                  />
                </div>
              </div>
              <div className="tcl-filters-row">
                <div>
                  <label>Mã bệnh nhân</label>
                  <input
                    value={filterPatientCode}
                    onChange={(e) => setFilterPatientCode(e.target.value)}
                    placeholder="YM…"
                  />
                </div>
                <div>
                  <label>Họ tên</label>
                  <input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Tên BN"
                  />
                </div>
              </div>
              <div className="tcl-filters-row">
                <div>
                  <label>Từ ngày</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <label>Đến ngày</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="tcl-lookup-block">
              <strong style={{ fontSize: '0.82rem', color: '#334155' }}>Tra cứu mã vé</strong>
              <div className="tcl-lookup-row">
                <input
                  style={{ flex: 1, minWidth: 120 }}
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  placeholder="YMA…"
                  autoComplete="off"
                />
                <button type="button" className="tcl-btn tcl-btn--pri" onClick={() => void runLookup()} disabled={lookupLoading}>
                  {lookupLoading ? '…' : 'Tìm'}
                </button>
              </div>
              {ticketErr ? <div className="tcl-banner-err" style={{ marginTop: 6 }}>{ticketErr}</div> : null}
            </div>

            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>TT</th>
                    <th>Mã LH</th>
                    <th>Nguồn</th>
                    <th>Mã BN</th>
                    <th>Tên BN</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '1rem', color: '#64748b' }}>
                        Đang tải…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '1rem', color: '#64748b' }}>
                        {listErr || 'Không có lịch trong khoảng thời gian này.'}
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr
                        key={String(row.id)}
                        className={String(selectedId) === String(row.id) ? 'is-selected' : ''}
                        onClick={() => selectRow(row)}
                      >
                        <td>
                          <span className={`tcl-stt-dot ${statusDotClass(row.status)}`} title={statusLabelVi(row.status)} />
                        </td>
                        <td>{row.ticket}</td>
                        <td>
                          <span
                            className={`tcl-source-badge tcl-source-badge--${appointmentSourceValue(row)}`}
                            title={appointmentSourceTitle(row)}
                          >
                            {appointmentSourceLabel(row)}
                          </span>
                        </td>
                        <td>{row.patient?.patientCode || '—'}</td>
                        <td>{row.patient?.displayName || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="tcl-pager">
              <span>
                {filteredRows.length} lịch — trang {page + 1}/{pageCount}
              </span>
              <span>
                <button
                  type="button"
                  className="tcl-btn"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ‹
                </button>{' '}
                <button
                  type="button"
                  className="tcl-btn"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  ›
                </button>
              </span>
            </div>
          </aside>

          <main className="tcl-detail">
            {activeDetail ? (
              <>
                <div className="tcl-banner-ok">Bạn đang xem thông tin lịch hẹn</div>
                {detailErr ? <div className="tcl-banner-err">{detailErr}</div> : null}
                {detailLoadingId && String(activeDetail?.id) === String(detailLoadingId) ? (
                  <div className="tcl-banner-ok">Đang tải chi tiết…</div>
                ) : null}
                {saveErr ? <div className="tcl-banner-err">{saveErr}</div> : null}
                {saveMsg ? <div className="tcl-banner-ok">{saveMsg}</div> : null}

                <section className="tcl-sec">
                  <h2 className="tcl-sec-title">
                    <span>1</span>
                    Thông tin bệnh nhân
                  </h2>
                  <div className="tcl-grid-form">
                    <div className="tcl-f">
                      <label>Mã bệnh nhân</label>
                      <input readOnly value={activeDetail.patient?.patientCode || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Họ tên</label>
                      <input readOnly value={activeDetail.patient?.displayName || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày sinh</label>
                      <input readOnly value={formatDob(activeDetail.patient?.dob)} />
                    </div>
                    <div className="tcl-f">
                      <label>Độ tuổi</label>
                      <input readOnly value={activeDetail.patient?.age != null ? String(activeDetail.patient.age) : '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Điện thoại</label>
                      <input readOnly value={activeDetail.patient?.phone || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Giới tính</label>
                      <input readOnly value={activeDetail.patient?.gender || '—'} />
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Địa chỉ</label>
                      <input readOnly value={activeDetail.patient?.address || '—'} />
                    </div>
                  </div>
                </section>

                <section className="tcl-sec">
                  <h2 className="tcl-sec-title">
                    <span>2</span>
                    Thông tin lịch hẹn
                  </h2>
                  <div className="tcl-grid-form">
                    <div className="tcl-f">
                      <label>Mã lịch hẹn</label>
                      <input readOnly value={activeDetail.ticket || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày đặt lịch</label>
                      <input readOnly value={formatDateTimeVi(activeDetail.createdAt)} />
                    </div>
                    <div className="tcl-f">
                      <label>Nguồn đăng ký</label>
                      <input readOnly value={appointmentSourceTitle(activeDetail)} />
                    </div>
                    <div className="tcl-f">
                      <label>Nhân viên tạo lịch</label>
                      <input readOnly value={sourceCreatorLabel(activeDetail)} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày khám</label>
                      <input readOnly value={formatDateVi(activeDetail.appointmentDate)} />
                    </div>
                    <div className="tcl-f">
                      <label>Giờ khám</label>
                      <input readOnly value={String(activeDetail.startTime || '').slice(0, 5)} />
                    </div>
                    <div className="tcl-f">
                      <label>Bác sĩ</label>
                      <input readOnly value={activeDetail.doctor?.displayName || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Chuyên khoa</label>
                      <input readOnly value={activeDetail.doctor?.specialtyName || '—'} />
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Triệu chứng / Ghi chú</label>
                      <textarea readOnly rows={3} value={activeDetail.note || ''} placeholder="—" />
                    </div>
                  </div>
                </section>

                <section className="tcl-sec">
                  <h2 className="tcl-sec-title">
                    <span>3</span>
                    Thông tin xác nhận
                  </h2>
                  <div className="tcl-f" style={{ marginBottom: '0.65rem' }}>
                    <label>Trạng thái</label>
                    <div className="tcl-status-row">
                      <label title="Chỉ hiển thị">
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={detailStatus === 'pending'}
                          disabled
                          readOnly
                        />
                        Chờ xác nhận
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={detailStatus === 'cancelled'}
                          disabled={!canEditStatus}
                          onChange={() => canEditStatus && setDetailStatus('cancelled')}
                        />
                        Hủy
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={detailStatus === 'confirmed'}
                          disabled={!canEditStatus}
                          onChange={() => canEditStatus && setDetailStatus('confirmed')}
                        />
                        Xác nhận
                      </label>
                      <label title="Trạng thái này do bác sĩ/cận lâm sàng cập nhật">
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={detailStatus === 'examined'}
                          disabled
                          readOnly
                        />
                        Đã khám
                      </label>
                      <span
                        className="tcl-muted"
                        title={
                          canEditStatus
                            ? 'Quá hết khung giờ mà chưa xác nhận — hệ thống tự hủy'
                            : 'Lịch không còn ở trạng thái Chờ xác nhận nên không thể thay đổi.'
                        }
                      >
                        {canEditStatus ? 'Chờ (tự hủy nếu quá giờ)' : `Đã khóa: ${statusLabelVi(currentStatus)}`}
                      </span>
                    </div>
                  </div>
                  <div className="tcl-grid-form">
                    <div className="tcl-f">
                      <label>Nhân viên xác nhận</label>
                      <input readOnly value={displayName(user)} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày xác nhận</label>
                      <input readOnly placeholder="—" />
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Nội dung xác nhận</label>
                      <input readOnly value={saveMsg || '—'} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="tcl-btn tcl-btn--pri"
                      disabled={!activeDetail || saving || !canEditStatus}
                      onClick={() => void handleSaveStatus()}
                    >
                      {saving ? 'Đang lưu…' : 'Lưu'}
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Chọn một dòng trong danh sách hoặc nhập mã vé để tra cứu chi tiết.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
