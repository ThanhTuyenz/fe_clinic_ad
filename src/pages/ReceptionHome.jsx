import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getNextVisitQueueNumber,
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
import { clearStaffSession, getStaffSession, staffRole } from '../utils/staffSession.js'
import { listClinicRooms } from '../api/clinicRooms.js'
import { recordAppointmentPayment } from '../api/payments.js'
import { Html5Qrcode } from 'html5-qrcode'
import { resolveConsultationFee } from '../utils/consultationFee.js'
import { printVisitSlip } from '../utils/printVisitSlip.js'
import { ticketFromQrPayload } from '../utils/ticketQr.js'
import '../styles/reception-home.css'

const QR_READER_ELEMENT_ID = 'tcl-ticket-qr-reader'

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

function formatCancelledByLine(cancelledBy) {
  if (!cancelledBy || typeof cancelledBy !== 'object') return '—'
  const ut = String(cancelledBy.userType || '').toLowerCase()
  const role = String(cancelledBy.role || '').toLowerCase()
  if (role === 'system' || ut === 'system') return 'Hệ thống'
  const isPatient = role === 'patient' || ut === 'patient'
  const label = isPatient ? 'Bệnh nhân' : 'Phòng khám'
  const name = String(cancelledBy.displayName || '').trim() || String(cancelledBy.email || '').trim()
  return name ? `${label}: ${name}` : label
}

function formatConfirmedByLine(confirmedBy) {
  if (!confirmedBy || typeof confirmedBy !== 'object') return '—'
  const name = String(confirmedBy.displayName || '').trim() || String(confirmedBy.email || '').trim()
  return name || '—'
}

function formatVnd(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('vi-VN')} đ`
}

function paymentMethodLabel(method) {
  const m = String(method || '').trim().toLowerCase()
  if (m === 'cash') return 'Tiền mặt'
  if (m === 'transfer') return 'Chuyển khoản'
  return '—'
}

function formatPaidByLine(paidBy) {
  if (!paidBy || typeof paidBy !== 'object') return '—'
  const name = String(paidBy.displayName || '').trim() || String(paidBy.email || '').trim()
  return name || '—'
}

/** Ưu tiên bản đã thu khi gộp payment từ list + cache chi tiết. */
function mergePayment(primary, secondary) {
  const isPaid = (p) => String(p?.status || 'unpaid').trim().toLowerCase() === 'paid'
  if (isPaid(primary)) return primary
  if (isPaid(secondary)) return secondary
  return primary ?? secondary ?? null
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

/** Hiển thị chuyên khoa — đồng bộ với be_clinic doctorEmbed / fe_clinic khi API thiếu specialtyName. */
function doctorDisplayName(d) {
  if (!d) return '—'
  const name = String(d.displayName || '').trim()
  if (name) return name
  const last = String(d.lastName || '').trim()
  const first = String(d.firstName || '').trim()
  return `${last} ${first}`.trim() || String(d.email || '').trim() || '—'
}

function clinicRoomLabel(roomId, rooms) {
  const id = String(roomId || '').trim()
  if (!id) return '—'
  const hit = (rooms || []).find((r) => String(r.roomID) === id)
  return hit?.name ? String(hit.name).trim() : id
}

function formatExamTimeLine(start, end) {
  const s = String(start || '').trim().slice(0, 5)
  if (!s) return '—'
  const e = String(end || '').trim().slice(0, 5)
  return e && e !== s ? `${s} – ${e}` : s
}

function doctorSpecialtyDisplay(d) {
  if (!d || typeof d !== 'object') return '—'
  const direct = String(d.specialtyName || d.specialty || '').trim()
  if (direct) return direct
  const sid = String(d.specialtyID || d.specialtyId || d.chuyenKhoaId || '').trim()
  if (sid) return sid
  const dept = String(d.deptName || d.department || d.departmentName || '').trim()
  if (dept) return dept
  const bio = String(d.bio || '').trim()
  if (bio) {
    const dash = bio.match(/(?:—|-)\s*([^\n]+)/)
    if (dash) return String(dash[1]).trim().slice(0, 120)
    const head = bio.match(/^Bác sĩ\s*([^\n—-]+)/i)
    if (head) return String(head[1]).trim().slice(0, 120)
    const linhvuc = bio.match(/lĩnh vực\s+([^.\n]+)/i)
    if (linhvuc) return String(linhvuc[1]).trim().slice(0, 120)
  }
  return '—'
}

function patientListDisplayName(p) {
  if (!p) return '—'
  const dn = String(p.displayName || '').trim()
  if (dn) return dn
  const last = String(p.lastName || '').trim()
  const first = String(p.firstName || '').trim()
  const vi = `${last} ${first}`.trim()
  if (vi) return vi
  const en = `${first} ${last}`.trim()
  return en || '—'
}

function ageFromDobField(dob) {
  if (dob == null || dob === '') return ''
  const d = dob instanceof Date ? dob : new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
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

function readReceptionNavState(location) {
  const today = ymd(new Date())
  const from = String(location?.state?.fromDate || '').trim()
  const to = String(location?.state?.toDate || '').trim()
  const st = String(location?.state?.statusFilter || '').trim()
  const dashFilter = String(location?.state?.dashFilter || '').trim()
  return {
    fromDate: from || today,
    toDate: to || today,
    statusFilter: st || 'all',
    dashFilter,
    filtersOpen: Boolean(from || to || st || dashFilter),
  }
}

function dashFilterLabelVi(key) {
  if (key === 'unpaid') return 'Chưa thu phí'
  if (key === 'noRoom') return 'Chưa chọn phòng'
  if (key === 'ready') return 'Sẵn sàng xác nhận'
  if (key === 'expiring') return 'Quá giờ — sắp tự hủy'
  return ''
}

function matchesDashFilter(row, dashFilter) {
  const f = String(dashFilter || '').trim()
  if (!f) return true
  if (normalizeStatus(row?.status) !== 'pending') return false
  const isPaid = String(row?.payment?.status || '').toLowerCase() === 'paid'
  const room = String(row?.clinicRoom || '').trim()
  if (f === 'unpaid') return !isPaid
  if (f === 'noRoom') return !room
  if (f === 'ready') return isPaid && Boolean(room)
  if (f === 'expiring') return isPendingAppointmentPastSlot(row)
  return true
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
  const systemCancelReason =
    'Quá thời gian chờ xác nhận — khung giờ khám đã kết thúc, hệ thống tự hủy lịch.'
  for (const row of stale) {
    try {
      await updateAppointmentStatus({
        token,
        appointmentId: row.id,
        status: 'cancelled',
        cancelledBySystem: true,
        cancelReason: systemCancelReason,
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
  const location = useLocation()
  const { token, user } = getSession()
  const navInit = useMemo(() => readReceptionNavState(location), [])

  const [fromDate, setFromDate] = useState(navInit.fromDate)
  const [toDate, setToDate] = useState(navInit.toDate)
  const [statusFilter, setStatusFilter] = useState(navInit.statusFilter)
  const [dashFilter, setDashFilter] = useState(navInit.dashFilter)
  /** Tìm nhanh trong danh sách đã tải: mã lịch hẹn, mã BN hoặc tên. */
  const [listSearch, setListSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(navInit.filtersOpen)

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

  const [visitQueueDraft, setVisitQueueDraft] = useState('')
  const [clinicRoomDraft, setClinicRoomDraft] = useState('')
  const [clinicRooms, setClinicRooms] = useState([])
  const [clinicRoomsErr, setClinicRoomsErr] = useState('')
  const [visitErr, setVisitErr] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentErr, setPaymentErr] = useState('')

  const [ticket, setTicket] = useState('')
  const [ticketErr, setTicketErr] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  const [qrOpen, setQrOpen] = useState(false)
  const [qrErr, setQrErr] = useState('')
  const [qrListFocusTicket, setQrListFocusTicket] = useState('')
  const runLookupRef = useRef(async () => ({ ok: false }))
  const qrScanDoneRef = useRef(false)
  const didAutoLookupRef = useRef(false)
  const roomSttReqRef = useRef(0)

  const [flashOk, setFlashOk] = useState('')
  const [flashErr, setFlashErr] = useState('')

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
      return
    }
    if (staffRole(user) !== 'receptionist') {
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
    setPage(0)
  }, [listSearch])

  useEffect(() => {
    if (!token) return undefined
    const t = setInterval(() => {
      void loadList()
    }, 60000)
    return () => clearInterval(t)
  }, [token, loadList])

  const filteredRows = useMemo(() => {
    let base = list || []
    if (dashFilter) base = base.filter((r) => matchesDashFilter(r, dashFilter))

    const focus = qrListFocusTicket.trim().toLowerCase()
    if (focus) {
      const hits = base.filter((r) => String(r.ticket || '').toLowerCase() === focus)
      if (hits.length) return hits
      if (lookupDetail && String(lookupDetail.ticket || '').toLowerCase() === focus) {
        return [lookupDetail]
      }
      return []
    }
    const q = listSearch.trim().toLowerCase()
    if (!q) return base
    return base.filter((r) => {
      const ticket = String(r.ticket || '').toLowerCase()
      const code = String(r.patient?.patientCode || '').toLowerCase()
      const name = patientListDisplayName(r.patient).toLowerCase()
      return ticket.includes(q) || code.includes(q) || name.includes(q)
    })
  }, [list, lookupDetail, qrListFocusTicket, listSearch, dashFilter])

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, page])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  const activeDetail = useMemo(() => {
    if (selectedId) {
      const idStr = String(selectedId)
      const cached = detailById[idStr]
      const row = list.find((a) => String(a.id) === idStr)
      if (cached && row) {
        return {
          ...cached,
          status: row.status,
          cancelReason: row.cancelReason,
          cancelledAt: row.cancelledAt,
          cancelledBy: row.cancelledBy,
          confirmedAt: row.confirmedAt,
          confirmedBy: row.confirmedBy,
          visitQueueNumber: row.visitQueueNumber ?? cached.visitQueueNumber,
          clinicRoom: row.clinicRoom != null ? row.clinicRoom : cached.clinicRoom,
          payment: mergePayment(row.payment, cached.payment),
        }
      }
      if (cached) return cached
      if (row) return row
    }
    if (lookupDetail) {
      const cached = detailById[String(lookupDetail.id)]
      if (cached) {
        return {
          ...lookupDetail,
          ...cached,
          payment: mergePayment(lookupDetail.payment, cached.payment),
        }
      }
      return lookupDetail
    }
    return null
  }, [selectedId, list, lookupDetail, detailById])

  const currentStatus = useMemo(() => normalizeStatus(activeDetail?.status), [activeDetail?.status])
  const canEditStatus = currentStatus === 'pending'
  /** Chỉnh phòng / STT khi lịch còn Chờ — ghi DB khi Xác nhận + Lưu. */
  const canEditVisit = currentStatus === 'pending'
  const paymentStatus = String(activeDetail?.payment?.status || 'unpaid').toLowerCase()
  const isPaid = paymentStatus === 'paid'
  const hasClinicRoom = Boolean(String(clinicRoomDraft || '').trim())
  const consultationFee = resolveConsultationFee(
    activeDetail?.payment?.amount,
    activeDetail?.consultationFee ?? activeDetail?.doctor?.consultationFee,
  )
  const canConfirm = canEditStatus && isPaid && hasClinicRoom
  const canSaveStatus =
    canEditStatus && (detailStatus !== 'confirmed' || (isPaid && hasClinicRoom))
  const canPrintVisitSlip = currentStatus === 'confirmed'
  const visitSlipView = useMemo(() => {
    if (!activeDetail || !canPrintVisitSlip) return null
    const q = activeDetail.visitQueueNumber
    return {
      queueNumber: q != null && q !== '' ? String(q) : '—',
      clinicRoom: clinicRoomLabel(activeDetail.clinicRoom, clinicRooms),
      doctorName: doctorDisplayName(activeDetail.doctor),
      examTime: formatExamTimeLine(activeDetail.startTime, activeDetail.endTime),
      examDate: formatDateVi(activeDetail.appointmentDate),
      ticket: activeDetail.ticket || '—',
    }
  }, [activeDetail, canPrintVisitSlip, clinicRooms])
  const confirmBlockTitle =
    !isPaid && canEditStatus
      ? 'Cần thu phí khám trước'
      : !hasClinicRoom && canEditStatus && isPaid
        ? 'Cần chọn phòng khám trước'
        : undefined

  const applyClinicRoomSelection = useCallback(
    async (roomValue) => {
      const r = String(roomValue ?? '').trim()
      if (!r) {
        setVisitQueueDraft('')
        return
      }
      if (!token || !activeDetail?.id) return
      const dateStr = String(activeDetail.appointmentDate || '').trim().slice(0, 10)
      if (!dateStr || dateStr.length < 10) return
      setVisitErr('')
      const reqId = ++roomSttReqRef.current
      try {
        const next = await getNextVisitQueueNumber({
          token,
          appointmentDate: dateStr,
          clinicRoom: r,
          excludeAppointmentId: activeDetail.id,
        })
        if (reqId !== roomSttReqRef.current) return
        setVisitQueueDraft(String(next))
      } catch (e) {
        if (reqId !== roomSttReqRef.current) return
        setVisitErr(e?.message || 'Không lấy được số thứ tự gợi ý.')
      }
    },
    [token, activeDetail?.id, activeDetail?.appointmentDate],
  )

  useEffect(() => {
    let alive = true
    setClinicRoomsErr('')
    listClinicRooms()
      .then((rows) => {
        if (alive) setClinicRooms(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (alive) {
          setClinicRooms([])
          setClinicRoomsErr(e?.message || 'Không tải được danh sách phòng.')
        }
      })
    return () => {
      alive = false
    }
  }, [])

  const lastDetailIdRef = useRef(null)
  useEffect(() => {
    if (!activeDetail) return
    const currentId = String(activeDetail.id ?? '')
    if (currentId && lastDetailIdRef.current === currentId) return
    lastDetailIdRef.current = currentId
    setDetailStatus(normalizeStatus(activeDetail.status || 'pending'))
  }, [activeDetail])

  useEffect(() => {
    if (!activeDetail?.id) {
      setVisitQueueDraft('')
      setClinicRoomDraft('')
      return
    }
    const q = activeDetail.visitQueueNumber
    setVisitQueueDraft(q != null && q !== '' ? String(q) : '')
    const savedRoom = String(activeDetail.clinicRoom || '').trim()
    if (savedRoom) {
      setClinicRoomDraft(savedRoom)
    } else {
      const dr = String(activeDetail.doctor?.clinicRoomID || '').trim()
      setClinicRoomDraft(dr)
    }
  }, [activeDetail?.id, activeDetail?.visitQueueNumber, activeDetail?.clinicRoom, activeDetail?.doctor?.clinicRoomID])

  useEffect(() => {
    if (!activeDetail?.id) return
    setPaymentMethod('cash')
    setPaymentErr('')
  }, [activeDetail?.id])

  function handlePrintVisitSlip() {
    if (!visitSlipView) return
    const ok = printVisitSlip(visitSlipView)
    if (!ok) setSaveErr('Không mở được cửa sổ in. Thử lại hoặc kiểm tra trình duyệt.')
  }

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
      cancelReason: data.appointment.cancelReason || '',
      cancelledAt: data.appointment.cancelledAt ?? null,
      cancelledBy: data.appointment.cancelledBy ?? null,
      confirmedAt: data.appointment.confirmedAt ?? null,
      confirmedBy: data.appointment.confirmedBy ?? null,
      createdAt: data.appointment.createdAt,
      visitQueueNumber: data.appointment.visitQueueNumber ?? null,
      clinicRoom: data.appointment.clinicRoom || '',
      payment: data.appointment.payment || null,
      consultationFee: data.consultationFee ?? data.doctor?.consultationFee ?? null,
      patient: data.patient
        ? {
            ...data.patient,
            patientCode: data.patient.patientCode || buildPatientCode(data.patient.id),
          }
        : null,
      doctor: data.doctor || data.appointment?.doctor || null,
    }
  }

  const runLookup = useCallback(
    async (raw, options = {}) => {
      const t = String(raw != null ? raw : ticket).trim()
      setTicketErr('')
      setLookupLoading(true)
      setDetailErr('')
      if (!t) {
        setTicketErr('Vui lòng nhập mã vé (YMA…).')
        setLookupLoading(false)
        return { ok: false }
      }
      try {
        const data = await lookupAppointmentByTicket({ token, ticket: t })
        const norm = normalizeLookup(data)
        const ticketCode = String(norm.ticket || t).trim()
        setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
        const found = list.find((r) => String(r.id) === String(norm.id))
        if (found) {
          setSelectedId(String(found.id))
          setLookupDetail(null)
        } else {
          setSelectedId(null)
          setLookupDetail(norm)
        }
        if (options.focusList) {
          setQrListFocusTicket(ticketCode)
          setListSearch(ticketCode)
          setPage(0)
        }
        setSaveMsg('')
        setSaveErr('')
        setVisitErr('')
        return { ok: true, norm, ticket: ticketCode }
      } catch (e) {
        setTicketErr(e?.message || 'Không tra cứu được.')
        setLookupDetail(null)
        return { ok: false }
      } finally {
        setLookupLoading(false)
      }
    },
    [token, ticket, list],
  )

  runLookupRef.current = runLookup

  // Auto tra cứu khi chuyển từ trang Đăng ký về (state.lookupTicket)
  useEffect(() => {
    const t = String(location.state?.lookupTicket || '').trim()
    if (!token || !t) return
    if (didAutoLookupRef.current) return
    didAutoLookupRef.current = true
    setTicket(t)
    void runLookup(t)
  }, [token, location.state, runLookup])

  // Flash message khi điều hướng từ trang khác sang (vd. đăng ký thành công).
  useEffect(() => {
    const msg = location.state?.flash
    const type = String(msg?.type || '').toLowerCase()
    const text = String(msg?.message || '').trim()
    if (!text) return
    if (type === 'error' || type === 'err') {
      setFlashErr(text)
      setFlashOk('')
    } else {
      setFlashOk(text)
      setFlashErr('')
    }
    const t = setTimeout(() => {
      setFlashOk('')
      setFlashErr('')
    }, 4500)
    return () => clearTimeout(t)
  }, [location.state])

  // Bộ lọc từ trang Thống kê (Dashboard) — mỗi lần bấm ô KPI áp dụng lại
  useEffect(() => {
    const navAt = location.state?.dashNavAt
    if (navAt == null || navAt === '') return
    const n = readReceptionNavState(location)
    setFromDate(n.fromDate)
    setToDate(n.toDate)
    setStatusFilter(n.statusFilter)
    setDashFilter(n.dashFilter)
    setFiltersOpen(n.filtersOpen)
    setListSearch('')
    setQrListFocusTicket('')
    setPage(0)
  }, [location.state?.dashNavAt])

  useEffect(() => {
    if (!qrOpen) return undefined
    setQrErr('')
    qrScanDoneRef.current = false
    const html5 = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false })
    const config = { fps: 10, qrbox: { width: 250, height: 250 } }

    const onScan = async (decodedText) => {
      if (qrScanDoneRef.current) return
      const code = ticketFromQrPayload(decodedText)
      if (!code) return
      qrScanDoneRef.current = true
      try {
        await html5.stop()
      } catch {
        /* ignore */
      }
      try {
        html5.clear()
      } catch {
        /* ignore */
      }
      setQrOpen(false)
      setTicket(code)
      try {
        await runLookupRef.current(code, { focusList: true })
      } catch {
        /* lỗi đã xử lý trong runLookup */
      }
    }

    const onFail = () => {}

    let cancelled = false
    ;(async () => {
      try {
        await html5.start({ facingMode: 'environment' }, config, onScan, onFail)
      } catch {
        if (cancelled) return
        try {
          await html5.start({ facingMode: 'user' }, config, onScan, onFail)
        } catch (e2) {
          if (!cancelled) setQrErr(e2?.message || 'Không mở được camera. Kiểm tra quyền truy cập.')
        }
      }
    })()

    return () => {
      cancelled = true
      /** `stop()` throws đồng bộ nếu scanner đã dừng (vd. sau khi quét xong) — phải bắt để không crash React. */
      let stopPromise
      try {
        stopPromise = html5.stop()
      } catch {
        stopPromise = Promise.resolve()
      }
      void stopPromise
        .catch(() => {})
        .finally(() => {
          try {
            html5.clear()
          } catch {
            /* ignore */
          }
        })
    }
  }, [qrOpen])

  const applyPaymentToCaches = useCallback((id, payment, norm = null) => {
    const key = String(id)
    if (!key || !payment) return
    setDetailById((prev) => ({
      ...prev,
      [key]: norm
        ? { ...(prev[key] || {}), ...norm, payment }
        : { ...(prev[key] || activeDetail || {}), payment },
    }))
    setList((prev) => prev.map((r) => (String(r.id) === key ? { ...r, payment } : r)))
    setLookupDetail((prev) =>
      prev && String(prev.id) === key
        ? { ...prev, ...(norm || {}), payment }
        : prev,
    )
  }, [activeDetail])

  const refreshPaymentFromServer = useCallback(
    async (ticket) => {
      const t = String(ticket || activeDetail?.ticket || '').trim()
      if (!t || !token) return false
      try {
        const data = await lookupAppointmentByTicket({ token, ticket: t })
        const norm = normalizeLookup(data)
        if (norm?.payment) {
          applyPaymentToCaches(norm.id, norm.payment, norm)
          return true
        }
      } catch {
        /* bỏ qua */
      }
      return false
    },
    [token, activeDetail?.ticket, applyPaymentToCaches],
  )

  async function handleRecordPayment() {
    if (!activeDetail?.id || !canEditStatus || isPaid) return
    setPaymentErr('')
    setSaveMsg('')
    setPaymentSaving(true)
    try {
      const data = await recordAppointmentPayment({
        token,
        appointmentId: activeDetail.id,
        method: paymentMethod,
        amount: consultationFee,
      })
      const ap = data?.appointment
      const paid = ap?.payment || null
      if (paid) {
        applyPaymentToCaches(activeDetail.id, paid, ap ? { ...activeDetail, ...ap, payment: paid } : null)
      }
      setPaymentErr('')
      setSaveMsg('Đã ghi nhận thanh toán phí khám.')
    } catch (e) {
      const msg = e?.message || 'Không ghi nhận được thanh toán.'
      if (/đã được ghi nhận thanh toán/i.test(msg)) {
        const synced = await refreshPaymentFromServer(activeDetail.ticket)
        setPaymentErr('')
        setSaveMsg(synced ? 'Lịch này đã được ghi nhận thanh toán.' : msg)
      } else {
        setPaymentErr(msg)
      }
    } finally {
      setPaymentSaving(false)
    }
  }

  async function handleSaveStatus() {
    if (!activeDetail?.id) return
    setSaveErr('')
    setSaveMsg('')
    setVisitErr('')
    if (!canEditStatus) {
      setSaveErr('Chỉ có thể xác nhận/hủy khi lịch ở trạng thái Chờ xác nhận.')
      return
    }
    const next = normalizeStatus(detailStatus || '')
    if (next !== 'confirmed' && next !== 'cancelled') {
      setSaveErr('Vui lòng chọn Xác nhận hoặc Hủy.')
      return
    }
    if (next === 'confirmed' && !isPaid) {
      setSaveErr('Chưa thu phí khám. Vui lòng ghi nhận thanh toán trước khi xác nhận.')
      return
    }

    const visitExtra = {}
    if (next === 'confirmed') {
      const room = String(clinicRoomDraft || '').trim()
      if (!room) {
        setSaveErr('Vui lòng chọn phòng khám trước khi xác nhận.')
        return
      }
      visitExtra.clinicRoom = room
      const qStr = String(visitQueueDraft || '').trim()
      if (qStr) {
        const n = parseInt(qStr, 10)
        if (!Number.isFinite(n) || n < 1) {
          setSaveErr('Số thứ tự phải là số nguyên dương hoặc để trống.')
          return
        }
        visitExtra.visitQueueNumber = n
      }
    }

    setSaving(true)
    try {
      const saveRes = await updateAppointmentStatus({
        token,
        appointmentId: activeDetail.id,
        status: next,
        ...visitExtra,
      })
      setSaveMsg('Đã lưu trạng thái lịch hẹn.')
      const ap = saveRes?.appointment
      setDetailById((prev) => {
        const key = String(activeDetail.id)
        const cur = prev[key] || activeDetail
        let patch = {}
        if (next === 'cancelled' && ap) {
          patch = {
            cancelReason: ap.cancelReason ?? cur.cancelReason,
            cancelledAt: ap.cancelledAt ?? cur.cancelledAt,
            cancelledBy: ap.cancelledBy ?? cur.cancelledBy,
            confirmedAt: null,
            confirmedBy: null,
            visitQueueNumber: null,
            clinicRoom: '',
          }
        } else if (next === 'confirmed' && ap) {
          patch = {
            cancelReason: '',
            cancelledAt: null,
            cancelledBy: null,
            confirmedAt: ap.confirmedAt ?? cur.confirmedAt,
            confirmedBy: ap.confirmedBy ?? cur.confirmedBy,
            visitQueueNumber: ap.visitQueueNumber ?? cur.visitQueueNumber,
            clinicRoom: ap.clinicRoom != null ? ap.clinicRoom : cur.clinicRoom,
          }
        }
        return { ...prev, [key]: { ...cur, status: next, ...patch } }
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
    setVisitErr('')
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

  if (!token || !user || staffRole(user) !== 'receptionist') return null

  return (
    <div className="tcl-shell">
      <header className="tcl-top">
        <div className="tcl-brand">VITACARE</div>
        <nav className="tcl-nav" aria-label="Module">
          <button type="button" onClick={() => navigate('/dashboard')}>
            Thống kê
          </button>
          <button type="button" className="is-active">
            Lịch hẹn
          </button>
          <button type="button" onClick={() => navigate('/registration', { state: { createNew: true } })}>
            Đăng ký
          </button>
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

      <div className="tcl-page">
        {flashOk ? <div className="tcl-banner-ok">{flashOk}</div> : null}
        {flashErr ? <div className="tcl-banner-err">{flashErr}</div> : null}
        <div className="tcl-bar">
          <h1>Lịch hẹn</h1>
          <div className="tcl-bar-actions">
            <button type="button" className="tcl-btn tcl-btn--pri" onClick={handleAdd}>
              + Thêm
            </button>
            <button
              type="button"
              className="tcl-btn tcl-btn--pri"
              disabled={!activeDetail || saving || !canSaveStatus}
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
              <div className="tcl-search-filter-row">
                <input
                  id="reception-list-search"
                  className="tcl-list-search-input"
                  type="search"
                  value={listSearch}
                  onChange={(e) => {
                    setListSearch(e.target.value)
                    setQrListFocusTicket('')
                  }}
                  placeholder="Tìm mã lịch hẹn, mã BN hoặc tên…"
                  autoComplete="off"
                  enterKeyHint="search"
                  aria-label="Tìm trong danh sách đã tải"
                />
                <button
                  type="button"
                  className={`tcl-btn tcl-btn--filter-toggle${filtersOpen ? ' is-open' : ''}`}
                  aria-expanded={filtersOpen}
                  aria-controls="reception-advanced-filters"
                  onClick={() => setFiltersOpen((o) => !o)}
                >
                  Lọc
                </button>
                <button
                  type="button"
                  className="tcl-btn"
                  title="Mở camera để quét mã QR lịch hẹn"
                  disabled={lookupLoading}
                  onClick={() => {
                    setTicketErr('')
                    setQrErr('')
                    setQrOpen(true)
                  }}
                >
                  {lookupLoading ? '…' : 'Quét QR'}
                </button>
              </div>
              {ticketErr ? <div className="tcl-banner-err">{ticketErr}</div> : null}
              {filtersOpen ? (
                <div
                  id="reception-advanced-filters"
                  className="tcl-filters-advanced"
                  role="region"
                  aria-label="Lọc theo trạng thái và khoảng ngày"
                >
                  <p className="tcl-filters-advanced-hint">
                    Trạng thái và khoảng ngày dùng để tải danh sách từ máy chủ; ô phía trên lọc nhanh trong dữ liệu đã tải.
                  </p>
                  <div className="tcl-filters-body tcl-filters-body--advanced">
                    <div className="tcl-filter-field">
                      <label htmlFor="reception-status-filter">Trạng thái</label>
                      <select
                        id="reception-status-filter"
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value)
                          setDashFilter('')
                        }}
                      >
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="examined">Đã khám</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                    <div className="tcl-filter-field">
                      <label htmlFor="reception-from-date">Từ ngày</label>
                      <input id="reception-from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </div>
                    <div className="tcl-filter-field">
                      <label htmlFor="reception-to-date">Đến ngày</label>
                      <input id="reception-to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {dashFilter ? (
              <div className="tcl-dash-filter-banner" role="status">
                <span>
                  Lọc từ Thống kê: <strong>{dashFilterLabelVi(dashFilter)}</strong>
                  {' · '}
                  {formatDateVi(fromDate)}
                  {statusFilter !== 'all' ? ` · ${statusLabelVi(statusFilter)}` : ''}
                </span>
                <button
                  type="button"
                  className="tcl-btn"
                  onClick={() => {
                    setDashFilter('')
                    setListSearch('')
                  }}
                >
                  Bỏ lọc
                </button>
              </div>
            ) : null}

            <div className="tcl-list-panel">
              <div className="tcl-list-head">
                <div>
                  <h3 className="tcl-list-title">Danh sách lịch hẹn</h3>
                  <p className="tcl-list-meta">
                    {listLoading
                      ? 'Đang tải…'
                      : `${filteredRows.length} lịch${dashFilter ? ` · ${dashFilterLabelVi(dashFilter)}` : ''}${listSearch.trim() ? ' · tìm kiếm' : ''}`}
                  </p>
                </div>
                <span className="tcl-list-page">Trang {page + 1}/{pageCount}</span>
              </div>
              <div className="tcl-table-wrap">
                <table className="tcl-table tcl-list-table">
                  <thead>
                    <tr>
                      <th className="tcl-col-status" scope="col">TT</th>
                      <th className="tcl-col-ticket" scope="col">Mã lịch hẹn</th>
                      <th className="tcl-col-source" scope="col">Nguồn</th>
                      <th className="tcl-col-code" scope="col">Mã bệnh nhân</th>
                      <th className="tcl-col-name" scope="col">Tên bệnh nhân</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading ? (
                      <tr className="tcl-table-empty-row">
                        <td colSpan={5} className="tcl-table-empty">
                          Đang tải danh sách…
                        </td>
                      </tr>
                    ) : pageRows.length === 0 ? (
                      <tr className="tcl-table-empty-row">
                        <td colSpan={5} className="tcl-table-empty">
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
                          <td className="tcl-cell-status">
                            <span className={`tcl-stt-dot ${statusDotClass(row.status)}`} title={statusLabelVi(row.status)} />
                          </td>
                          <td className="tcl-cell-ticket">{row.ticket}</td>
                          <td className="tcl-cell-source">
                            <span
                              className={`tcl-source-badge tcl-source-badge--${appointmentSourceValue(row)}`}
                              title={appointmentSourceTitle(row)}
                            >
                              {appointmentSourceLabel(row)}
                            </span>
                          </td>
                          <td className="tcl-cell-code">{row.patient?.patientCode || '—'}</td>
                          <td className="tcl-cell-name">{patientListDisplayName(row.patient)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="tcl-pager">
                <span className="tcl-pager-summary">
                  {filteredRows.length} lịch — trang {page + 1}/{pageCount}
                </span>
                <div className="tcl-pager-actions">
                  <button
                    type="button"
                    className="tcl-btn"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="tcl-btn"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              </div>
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
                      <input readOnly value={patientListDisplayName(activeDetail.patient)} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày sinh</label>
                      <input readOnly value={formatDob(activeDetail.patient?.dob)} />
                    </div>
                    <div className="tcl-f">
                      <label>Độ tuổi</label>
                      <input
                        readOnly
                        value={
                          activeDetail.patient?.age != null && activeDetail.patient.age !== ''
                            ? String(activeDetail.patient.age)
                            : ageFromDobField(activeDetail.patient?.dob) || '—'
                        }
                      />
                    </div>
                    <div className="tcl-f">
                      <label>Điện thoại</label>
                      <input readOnly value={activeDetail.patient?.phone || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Giới tính</label>
                      <input
                        readOnly
                        value={(() => {
                          const g = activeDetail.patient?.gender
                          if (g === true || g === 'true') return 'Nam'
                          if (g === false || g === 'false') return 'Nữ'
                          const s = String(g ?? '').trim()
                          return s || '—'
                        })()}
                      />
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
                      <input readOnly value={doctorDisplayName(activeDetail.doctor)} />
                    </div>
                    <div className="tcl-f">
                      <label>Chuyên khoa</label>
                      <input readOnly value={doctorSpecialtyDisplay(activeDetail.doctor)} />
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label htmlFor="reception-clinic-room">Phòng khám</label>
                      {clinicRoomsErr ? <div className="tcl-banner-err" style={{ marginBottom: 8 }}>{clinicRoomsErr}</div> : null}
                      <select
                        id="reception-clinic-room"
                        value={clinicRoomDraft}
                        onChange={(e) => {
                          const v = e.target.value
                          setClinicRoomDraft(v)
                          if (!canEditVisit) return
                          void applyClinicRoomSelection(v)
                        }}
                        disabled={!canEditVisit}
                      >
                        <option value="">— Chọn phòng —</option>
                        {clinicRoomDraft &&
                        !clinicRooms.some((r) => String(r.roomID) === String(clinicRoomDraft)) ? (
                          <option value={clinicRoomDraft}>
                            {clinicRoomDraft} (giá trị hiện tại / ngoài danh mục)
                          </option>
                        ) : null}
                        {clinicRooms.map((r) => (
                          <option key={r.roomID} value={r.roomID}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Triệu chứng / Ghi chú</label>
                      <textarea readOnly rows={3} value={activeDetail.note || ''} placeholder="—" />
                    </div>
                    {currentStatus !== 'cancelled' && currentStatus !== 'examined' ? (
                      <>
                        {currentStatus === 'pending' ? (
                          <div className="tcl-f tcl-f--full">
                            <p className="tcl-muted" style={{ margin: 0, fontSize: '0.86rem' }}>
                              Cần <strong>thu phí khám</strong> và <strong>chọn phòng khám</strong> trước khi chọn{' '}
                              <strong>Xác nhận</strong>. <strong>Số thứ tự</strong> có thể để trống (hệ thống tự gán theo phòng).
                              Bấm <strong>Lưu</strong> để ghi trạng thái, phòng và STT vào hệ thống.
                            </p>
                          </div>
                        ) : null}
                        {visitErr ? (
                          <div className="tcl-f tcl-f--full">
                            <div className="tcl-banner-err">{visitErr}</div>
                          </div>
                        ) : null}
                        <div className="tcl-f">
                          <label htmlFor="reception-visit-queue">Số thứ tự</label>
                          <input
                            id="reception-visit-queue"
                            type="number"
                            min={1}
                            step={1}
                            value={visitQueueDraft}
                            onChange={(e) => setVisitQueueDraft(e.target.value)}
                            disabled={!canEditVisit}
                            placeholder="Để trống = tự gán theo phòng"
                            autoComplete="off"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>

                <section className="tcl-sec">
                  <h2 className="tcl-sec-title">
                    <span>3</span>
                    Thanh toán
                  </h2>
                  {currentStatus === 'pending' ? (
                    <>
                      <div className="tcl-payment-summary">
                        <span className="tcl-payment-label">Phí khám</span>
                        <strong className="tcl-payment-amount">{formatVnd(consultationFee)}</strong>
                      </div>
                      {isPaid ? (
                        <div className="tcl-grid-form tcl-payment-readonly">
                          <div className="tcl-f tcl-f--full">
                            <span className="tcl-payment-badge">Đã thu phí — không thể chỉnh sửa</span>
                          </div>
                          <div className="tcl-f">
                            <label>Số tiền</label>
                            <input readOnly value={formatVnd(activeDetail.payment?.amount ?? consultationFee)} />
                          </div>
                          <div className="tcl-f">
                            <label>Phương thức</label>
                            <input readOnly value={paymentMethodLabel(activeDetail.payment?.method)} />
                          </div>
                          <div className="tcl-f">
                            <label>Thu bởi</label>
                            <input readOnly value={formatPaidByLine(activeDetail.payment?.paidBy)} />
                          </div>
                          <div className="tcl-f">
                            <label>Thời điểm thu</label>
                            <input
                              readOnly
                              value={
                                activeDetail.payment?.paidAt
                                  ? formatDateTimeVi(activeDetail.payment.paidAt)
                                  : '—'
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="tcl-grid-form">
                            <div className="tcl-f">
                              <label htmlFor="reception-payment-method">Phương thức</label>
                              <select
                                id="reception-payment-method"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                disabled={paymentSaving || isPaid}
                              >
                                <option value="cash">Tiền mặt</option>
                                <option value="transfer">Chuyển khoản</option>
                              </select>
                            </div>
                          </div>
                          {paymentErr ? <div className="tcl-banner-err">{paymentErr}</div> : null}
                          <div className="tcl-payment-actions">
                            <button
                              type="button"
                              className="tcl-btn tcl-btn--pri"
                              disabled={paymentSaving || !canEditStatus || isPaid}
                              onClick={() => void handleRecordPayment()}
                            >
                              {paymentSaving ? 'Đang ghi nhận…' : 'Xác nhận đã thu'}
                            </button>
                          </div>
                          <p className="tcl-payment-hint">
                            Cần ghi nhận thanh toán và chọn phòng khám trước khi chọn <strong>Xác nhận</strong> ở mục
                            bên dưới.
                          </p>
                        </>
                      )}
                    </>
                  ) : isPaid ? (
                    <div className="tcl-grid-form">
                      <div className="tcl-f">
                        <label>Trạng thái thu</label>
                        <input readOnly value="Đã thu phí" />
                      </div>
                      <div className="tcl-f">
                        <label>Số tiền</label>
                        <input readOnly value={formatVnd(activeDetail.payment?.amount ?? consultationFee)} />
                      </div>
                      <div className="tcl-f">
                        <label>Phương thức</label>
                        <input readOnly value={paymentMethodLabel(activeDetail.payment?.method)} />
                      </div>
                    </div>
                  ) : (
                    <p className="tcl-payment-hint">Chưa ghi nhận thanh toán cho lịch này.</p>
                  )}
                </section>

                <section className="tcl-sec">
                  <h2 className="tcl-sec-title">
                    <span>4</span>
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
                      <label title={confirmBlockTitle}>
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={detailStatus === 'confirmed'}
                          disabled={!canConfirm}
                          onChange={() => canConfirm && setDetailStatus('confirmed')}
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
                        {canEditStatus && !isPaid ? ' · Chưa thu phí' : ''}
                        {canEditStatus && isPaid && !hasClinicRoom ? ' · Chưa chọn phòng' : ''}
                      </span>
                    </div>
                  </div>
                  {currentStatus === 'cancelled' ? (
                    <div className="tcl-grid-form tcl-cancel-info">
                      <div className="tcl-f">
                        <label>Hủy bởi</label>
                        <input readOnly value={formatCancelledByLine(activeDetail.cancelledBy)} />
                      </div>
                      <div className="tcl-f">
                        <label>Thời điểm hủy</label>
                        <input
                          readOnly
                          value={
                            activeDetail.cancelledAt != null && activeDetail.cancelledAt !== ''
                              ? formatDateTimeVi(activeDetail.cancelledAt)
                              : '—'
                          }
                        />
                      </div>
                      <div className="tcl-f tcl-f--full">
                        <label>Lý do hủy</label>
                        <textarea
                          readOnly
                          rows={3}
                          value={String(activeDetail.cancelReason || '').trim() || '—'}
                          className="tcl-cancel-reason-ta"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="tcl-grid-form">
                      <div className="tcl-f">
                        <label>Nhân viên xác nhận</label>
                        <input
                          readOnly
                          value={
                            String(activeDetail?.status || '').toLowerCase() === 'confirmed'
                              ? formatConfirmedByLine(activeDetail.confirmedBy)
                              : '—'
                          }
                        />
                      </div>
                      <div className="tcl-f">
                        <label>Ngày xác nhận</label>
                        <input
                          readOnly
                          value={
                            String(activeDetail?.status || '').toLowerCase() === 'confirmed' &&
                            activeDetail.confirmedAt != null &&
                            activeDetail.confirmedAt !== ''
                              ? formatDateTimeVi(activeDetail.confirmedAt)
                              : '—'
                          }
                        />
                      </div>
                      <div className="tcl-f tcl-f--full">
                        <label>Nội dung xác nhận</label>
                        <input readOnly value={saveMsg || '—'} />
                      </div>
                    </div>
                  )}
                  <div className="tcl-confirm-actions">
                    <button
                      type="button"
                      className="tcl-btn tcl-btn--pri"
                      disabled={!activeDetail || saving || !canSaveStatus}
                      onClick={() => void handleSaveStatus()}
                    >
                      {saving ? 'Đang lưu…' : 'Lưu'}
                    </button>
                    {canPrintVisitSlip && visitSlipView ? (
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--print"
                        onClick={handlePrintVisitSlip}
                      >
                        In phiếu khám
                      </button>
                    ) : null}
                  </div>
                </section>
              </>
            ) : (
              <div className="tcl-empty">
                Chọn một dòng trong danh sách hoặc quét mã QR để tra cứu chi tiết.
              </div>
            )}
          </main>
        </div>
      </div>

      {qrOpen ? (
        <div
          className="tcl-qr-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQrOpen(false)
          }}
        >
          <div
            className="tcl-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tcl-qr-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tcl-qr-title" className="tcl-qr-modal-title">
              Quét mã QR lịch hẹn
            </h2>
            <p className="tcl-qr-modal-hint">Đưa mã QR vé vào khung hình; hệ thống sẽ tra cứu khi quét xong.</p>
            <div id={QR_READER_ELEMENT_ID} className="tcl-qr-reader-wrap" />
            {qrErr ? (
              <div className="tcl-banner-err" style={{ marginTop: 8 }}>
                {qrErr}
              </div>
            ) : null}
            <div className="tcl-qr-modal-actions">
              <button type="button" className="tcl-btn" onClick={() => setQrOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
