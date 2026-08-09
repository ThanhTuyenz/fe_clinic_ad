'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RoleSidebar from '../components/RoleSidebar'
import { useLocation, useNavigate } from '@/common/hooks/useNextNavigation'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import {
  getNextVisitQueueNumber,
  listReceptionAppointments,
  lookupAppointmentByTicket,
  updateAppointmentStatus,
} from '../services/appointments'
import {
  appointmentCreatorName,
  appointmentSourceLabel,
  appointmentSourceTitle,
  appointmentSourceValue,
} from '../utils/appointmentSource'
import { isPendingAppointmentPastSlot } from '../utils/appointmentExpiry'
import { clearStaffSession, getStaffSession, staffRole } from '../utils/staffSession'
import { listClinicRooms } from '../services/clinicRooms'
import { recordAppointmentPayment } from '../services/payments'
import { Html5Qrcode } from 'html5-qrcode'
import { resolveConsultationFee } from '../utils/consultationFee'
import { buildPaymentInvoiceView } from '../utils/paymentInvoiceView'
import { printPaymentInvoice, printPaymentThenVisitSlip } from '../utils/printPaymentInvoice'
import { printVisitSlip } from '../utils/printVisitSlip'
import { ticketFromQrPayload } from '../utils/ticketQr'

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

function mergeReceptionDetail(cached, row) {
  if (!row) return cached ?? null
  if (!cached) return row
  const rowRoom = String(row.clinicRoom ?? '').trim()
  const cachedRoom = String(cached.clinicRoom ?? '').trim()
  const rowPatient = row.patient
  const rowDoctor = row.doctor
  return {
    ...cached,
    status: row.status ?? cached.status,
    cancelReason: row.cancelReason ?? cached.cancelReason,
    cancelledAt: row.cancelledAt ?? cached.cancelledAt,
    cancelledBy: row.cancelledBy ?? cached.cancelledBy,
    confirmedAt: row.confirmedAt ?? cached.confirmedAt,
    confirmedBy: row.confirmedBy ?? cached.confirmedBy,
    visitQueueNumber:
      row.visitQueueNumber != null && row.visitQueueNumber !== ''
        ? row.visitQueueNumber
        : cached.visitQueueNumber,
    clinicRoom: rowRoom || cachedRoom,
    payment: mergePayment(row.payment, cached.payment),
    patient:
      rowPatient && (rowPatient.id || rowPatient.patientCode || rowPatient.phone)
        ? { ...cached.patient, ...rowPatient }
        : cached.patient,
    doctor:
      rowDoctor && (rowDoctor.id || rowDoctor.email || rowDoctor.displayName)
        ? { ...cached.doctor, ...rowDoctor }
        : cached.doctor,
    ticket: row.ticket || cached.ticket,
    appointmentDate: row.appointmentDate || cached.appointmentDate,
    startTime: row.startTime || cached.startTime,
    endTime: row.endTime != null && row.endTime !== '' ? row.endTime : cached.endTime,
  }
}

function detailMissingForSlip(detail) {
  if (!detail) return true
  if (patientListDisplayName(detail.patient) === '—') return true
  if (doctorDisplayName(detail.doctor) === '—') return true
  if (!String(detail.startTime || '').trim()) return true
  return false
}

function buildVisitSlipView(detail, rooms, overrides = {}) {
  if (!detail) return null
  const roomId = String(overrides.clinicRoom ?? detail.clinicRoom ?? '').trim()
  let q = overrides.visitQueueNumber ?? detail.visitQueueNumber
  if (q === '' || q == null) q = null
  const patientName = patientListDisplayName(detail.patient)
  const clinicRoom = roomId ? clinicRoomLabel(roomId, rooms) : '—'
  const doctorName = doctorDisplayName(detail.doctor)
  const examTime = formatExamTimeLine(detail.startTime, detail.endTime)
  const examDate = formatDateVi(detail.appointmentDate)
  const ticket = String(detail.ticket || '').trim() || '—'
  return {
    queueNumber: q != null && q !== '' ? String(q) : '—',
    patientName: patientName === '—' ? '—' : patientName,
    clinicRoom: clinicRoom === '—' ? '—' : clinicRoom,
    doctorName: doctorName === '—' ? '—' : doctorName,
    examTime: examTime === '—' ? '—' : examTime,
    examDate: examDate === '—' ? '—' : examDate,
    ticket,
  }
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
  const expiring = isPendingAppointmentPastSlot(row)
  if (f === 'expiring') return expiring
  if (expiring) return false
  if (f === 'unpaid') return !isPaid
  if (f === 'noRoom') return isPaid && !room
  if (f === 'ready') return isPaid && Boolean(room)
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
  const { performLogout } = useStaffLogout()
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
        return mergeReceptionDetail(cached, row)
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
  /** Thu phí + xác nhận lịch: cần chọn phòng trước (một nút «Xác nhận đã thu»). */
  const canRecordPayment = canEditStatus && !isPaid && hasClinicRoom
  /** Lịch đã thu phí nhưng chưa xác nhận (dữ liệu cũ / lỗi tách bước). */
  const canFinishConfirm = canEditStatus && isPaid && hasClinicRoom
  const canPrintVisitSlip = currentStatus === 'confirmed'
  const slipOverrides = useMemo(
    () => ({
      clinicRoom: clinicRoomDraft || activeDetail?.clinicRoom,
      visitQueueNumber:
        visitQueueDraft !== '' && visitQueueDraft != null
          ? visitQueueDraft
          : activeDetail?.visitQueueNumber,
    }),
    [activeDetail?.clinicRoom, activeDetail?.visitQueueNumber, clinicRoomDraft, visitQueueDraft],
  )
  const visitSlipView = useMemo(() => {
    if (!activeDetail || !canPrintVisitSlip) return null
    return buildVisitSlipView(activeDetail, clinicRooms, slipOverrides)
  }, [activeDetail, canPrintVisitSlip, clinicRooms, slipOverrides])
  const canPrintPaymentInvoice = isPaid
  const paymentInvoiceView = useMemo(() => {
    if (!activeDetail || !canPrintPaymentInvoice) return null
    return buildPaymentInvoiceView(activeDetail, slipOverrides)
  }, [activeDetail, canPrintPaymentInvoice, slipOverrides])
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

  async function handlePrintVisitSlip() {
    if (!activeDetail?.id) return false
    if (!canPrintVisitSlip) {
      setSaveErr('Chỉ in phiếu khi lịch đã xác nhận.')
      return false
    }
    setSaveErr('')
    let detail = activeDetail
    const ticket = String(detail.ticket || '').trim()
    if (detailMissingForSlip(detail) && ticket && token) {
      setDetailLoadingId(String(detail.id))
      try {
        const data = await lookupAppointmentByTicket({ token, ticket })
        const norm = normalizeLookup(data)
        setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
        detail = mergeReceptionDetail(norm, list.find((r) => String(r.id) === String(norm.id)))
      } catch (e) {
        setSaveErr(e?.message || 'Không tải được dữ liệu lịch hẹn để in.')
        return false
      } finally {
        setDetailLoadingId(null)
      }
    }
    const view = buildVisitSlipView(detail, clinicRooms, {
      clinicRoom: clinicRoomDraft || detail.clinicRoom,
      visitQueueNumber:
        visitQueueDraft !== '' && visitQueueDraft != null
          ? visitQueueDraft
          : detail.visitQueueNumber,
    })
    if (!view) {
      setSaveErr('Không tạo được phiếu khám.')
      return false
    }
    const ok = printVisitSlip(view)
    if (!ok) setSaveErr('Không mở được cửa sổ in. Thử lại hoặc kiểm tra trình duyệt.')
    return ok
  }

  function handlePrintPaymentInvoice() {
    if (!activeDetail?.id || !isPaid) {
      setSaveErr('Chỉ in hóa đơn khi đã thu phí.')
      return false
    }
    setSaveErr('')
    const view = buildPaymentInvoiceView(activeDetail, slipOverrides)
    if (!view) {
      setSaveErr('Không tạo được hóa đơn — thiếu thông tin thanh toán.')
      return false
    }
    const ok = printPaymentInvoice(view)
    if (!ok) setSaveErr('Không mở được cửa sổ in. Thử lại hoặc kiểm tra trình duyệt.')
    return ok
  }

  function printAfterConfirm({ visitSlip, invoice }) {
    return printPaymentThenVisitSlip({
      invoice,
      visitSlip,
      printVisitSlip,
    })
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
    if (!location.state?.openQrScan) return
    setTicketErr('')
    setQrErr('')
    setQrOpen(true)
  }, [location.state?.qrNavAt, location.state?.openQrScan])

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

  function staffConfirmFallback() {
    return {
      displayName: displayName(user),
      email: String(user?.email || '').trim(),
    }
  }

  async function persistAppointmentStatus(next, options = {}) {
    if (!activeDetail?.id) return
    const status = normalizeStatus(next)
    if (status !== 'confirmed' && status !== 'cancelled') {
      throw new Error('Trạng thái không hợp lệ.')
    }
    if (!canEditStatus) {
      throw new Error('Chỉ có thể xác nhận/hủy khi lịch ở trạng thái Chờ xác nhận.')
    }
    if (status === 'confirmed' && !options.afterPayment && !isPaid) {
      throw new Error('Chưa thu phí khám.')
    }

    const visitExtra = {}
    if (status === 'confirmed') {
      const room = String(clinicRoomDraft || '').trim()
      if (!room) {
        throw new Error('Vui lòng chọn phòng khám trước khi xác nhận.')
      }
      visitExtra.clinicRoom = room
      const qStr = String(visitQueueDraft || '').trim()
      if (qStr) {
        const n = parseInt(qStr, 10)
        if (!Number.isFinite(n) || n < 1) {
          throw new Error('Số thứ tự phải là số nguyên dương hoặc để trống.')
        }
        visitExtra.visitQueueNumber = n
      }
    }

    const saveRes = await updateAppointmentStatus({
      token,
      appointmentId: activeDetail.id,
      status,
      ...visitExtra,
    })
    const ap = saveRes?.appointment
    const key = String(activeDetail.id)
    const fallbackConfirm = staffConfirmFallback()
    const nowIso = new Date().toISOString()
    const paymentPatch = options.payment ? { payment: options.payment } : {}
    let patch = {}
    if (status === 'cancelled' && ap) {
      patch = {
        cancelReason: ap.cancelReason ?? activeDetail.cancelReason,
        cancelledAt: ap.cancelledAt ?? activeDetail.cancelledAt,
        cancelledBy: ap.cancelledBy ?? activeDetail.cancelledBy,
        confirmedAt: null,
        confirmedBy: null,
        visitQueueNumber: null,
        clinicRoom: '',
      }
    } else if (status === 'confirmed') {
      const qFromDraft = (() => {
        const qStr = String(visitQueueDraft || '').trim()
        if (!qStr) return undefined
        const n = parseInt(qStr, 10)
        return Number.isFinite(n) && n >= 1 ? n : undefined
      })()
      patch = {
        cancelReason: '',
        cancelledAt: null,
        cancelledBy: null,
        confirmedAt: ap?.confirmedAt ?? nowIso,
        confirmedBy: ap?.confirmedBy ?? fallbackConfirm,
        visitQueueNumber: ap?.visitQueueNumber ?? qFromDraft ?? activeDetail.visitQueueNumber,
        clinicRoom: ap?.clinicRoom != null ? ap.clinicRoom : clinicRoomDraft || activeDetail.clinicRoom,
      }
    }

    setDetailById((prev) => {
      const cur = prev[key] || activeDetail
      return { ...prev, [key]: { ...cur, status, ...paymentPatch, ...patch } }
    })
    setList((prev) =>
      prev.map((r) => {
        if (String(r.id) !== key) return r
        if (status === 'confirmed') {
          return {
            ...r,
            status,
            payment: options.payment ?? r.payment,
            clinicRoom:
              (ap?.clinicRoom != null && String(ap.clinicRoom).trim() ? ap.clinicRoom : null) ??
              patch.clinicRoom ??
              r.clinicRoom,
            visitQueueNumber: ap?.visitQueueNumber ?? patch.visitQueueNumber ?? r.visitQueueNumber,
            confirmedAt: ap?.confirmedAt ?? nowIso,
            confirmedBy: ap?.confirmedBy ?? fallbackConfirm,
          }
        }
        if (status === 'cancelled' && ap) {
          return {
            ...r,
            status,
            cancelReason: ap.cancelReason ?? r.cancelReason,
            cancelledAt: ap.cancelledAt ?? r.cancelledAt,
            cancelledBy: ap.cancelledBy ?? r.cancelledBy,
          }
        }
        return { ...r, status }
      }),
    )
    setDetailStatus(status)
    await loadList()
    setLookupDetail(null)
    setSelectedId(key)

    if (status !== 'confirmed') return null
    const merged = { ...activeDetail, status, ...paymentPatch, ...patch }
    const slipOverridesNext = {
      clinicRoom: patch.clinicRoom,
      visitQueueNumber: patch.visitQueueNumber,
    }
    return {
      visitSlip: buildVisitSlipView(merged, clinicRooms, slipOverridesNext),
      invoice: buildPaymentInvoiceView(merged, slipOverridesNext),
    }
  }

  async function handleRecordPayment() {
    if (!activeDetail?.id || !canEditStatus || isPaid) return
    if (!hasClinicRoom) {
      setPaymentErr('Vui lòng chọn phòng khám trước khi thu phí.')
      return
    }
    setPaymentErr('')
    setSaveErr('')
    setSaveMsg('')
    setVisitErr('')
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
      const docs = await persistAppointmentStatus('confirmed', { afterPayment: true, payment: paid })
      setPaymentErr('')
      if (docs && printAfterConfirm(docs)) {
        setSaveMsg('Đã thu phí, xác nhận lịch và mở in hóa đơn + phiếu khám.')
      } else if (docs?.visitSlip || docs?.invoice) {
        setSaveMsg('Đã thu phí và xác nhận lịch. Không mở được cửa sổ in — bấm «In hóa đơn» hoặc «In phiếu khám».')
        setSaveErr('Không mở được cửa sổ in. Thử lại hoặc kiểm tra trình duyệt.')
      } else {
        setSaveMsg('Đã thu phí và xác nhận lịch hẹn.')
      }
    } catch (e) {
      const msg = e?.message || 'Không ghi nhận được thanh toán.'
      if (/đã được ghi nhận thanh toán/i.test(msg)) {
        const synced = await refreshPaymentFromServer(activeDetail.ticket)
        if (synced) {
          try {
            const docs = await persistAppointmentStatus('confirmed', { afterPayment: true })
            setPaymentErr('')
            if (docs && printAfterConfirm(docs)) {
              setSaveMsg('Lịch đã thu phí, đã xác nhận và mở in hóa đơn + phiếu khám.')
            } else if (docs?.visitSlip || docs?.invoice) {
              setSaveMsg('Lịch đã thu phí và xác nhận. Không mở được cửa sổ in — bấm «In hóa đơn» hoặc «In phiếu khám».')
              setSaveErr('Không mở được cửa sổ in. Thử lại hoặc kiểm tra trình duyệt.')
            } else {
              setSaveMsg('Lịch đã thu phí — đã xác nhận lịch hẹn.')
            }
          } catch (e2) {
            setPaymentErr('')
            setSaveMsg('Đã thu phí. Chưa xác nhận được lịch — bấm «Hoàn tất xác nhận» bên dưới.')
            setSaveErr(e2?.message || 'Không xác nhận được lịch.')
          }
        } else {
          setPaymentErr(msg)
        }
      } else if (/chưa thu phí|chọn phòng|số thứ tự|chờ xác nhận/i.test(msg)) {
        setSaveErr(msg)
      } else {
        setPaymentErr(msg)
      }
    } finally {
      setPaymentSaving(false)
    }
  }

  async function handleFinishConfirm() {
    if (!canFinishConfirm) return
    setSaveErr('')
    setSaveMsg('')
    setVisitErr('')
    setSaving(true)
    try {
      const docs = await persistAppointmentStatus('confirmed')
      if (docs && printAfterConfirm(docs)) {
        setSaveMsg('Đã xác nhận lịch và mở in hóa đơn + phiếu khám.')
      } else if (docs?.visitSlip || docs?.invoice) {
        setSaveMsg('Đã xác nhận lịch. Không mở được cửa sổ in — bấm «In hóa đơn» hoặc «In phiếu khám».')
        setSaveErr('Không mở được cửa sổ in. Thử lại hoặc kiểm tra trình duyệt.')
      } else {
        setSaveMsg('Đã xác nhận lịch hẹn.')
      }
    } catch (e) {
      setSaveErr(e?.message || 'Không xác nhận được lịch.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelAppointment() {
    if (!activeDetail?.id || !canEditStatus) return
    const ticket = String(activeDetail.ticket || '').trim()
    if (!window.confirm(ticket ? `Hủy lịch hẹn ${ticket}?` : 'Hủy lịch hẹn này?')) return
    setSaveErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      await persistAppointmentStatus('cancelled')
      setSaveMsg('Đã hủy lịch hẹn.')
    } catch (e) {
      setSaveErr(e?.message || 'Không hủy được lịch.')
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
    const cached = detailById[id]
    if (cached && !detailMissingForSlip(cached)) return

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
      <RoleSidebar role="receptionist" active="reception" user={user} onLogout={performLogout} />
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
            onClick={performLogout}
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
              disabled
              title="Dùng «Xác nhận đã thu» (đã chọn phòng) hoặc «Hủy lịch» trong chi tiết"
            >
              Lưu
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
                <div className="tcl-detail-head">
                  <div className="tcl-banner-ok">Bạn đang xem thông tin lịch hẹn</div>
                  {detailErr ? <div className="tcl-banner-err">{detailErr}</div> : null}
                  {detailLoadingId && String(activeDetail?.id) === String(detailLoadingId) ? (
                    <div className="tcl-banner-ok">Đang tải chi tiết…</div>
                  ) : null}
                  {saveErr ? <div className="tcl-banner-err">{saveErr}</div> : null}
                  {saveMsg ? <div className="tcl-banner-ok">{saveMsg}</div> : null}
                </div>

                <div className="tcl-detail-layout">
                  <div className="tcl-detail-col tcl-detail-col--info">
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
                  </div>
                </section>
                  </div>

                  <div className="tcl-detail-col tcl-detail-col--actions">
                <section className="tcl-sec tcl-sec--room">
                  <h2 className="tcl-sec-title tcl-sec-title--plain">Xếp phòng khám</h2>
                  <div className="tcl-grid-form">
                    <div className="tcl-f">
                      <label>Bác sĩ</label>
                      <input readOnly value={doctorDisplayName(activeDetail.doctor)} />
                    </div>
                    <div className="tcl-f">
                      <label>Chuyên khoa</label>
                      <input readOnly value={doctorSpecialtyDisplay(activeDetail.doctor)} />
                    </div>
                    <div
                      className={`tcl-room-queue-row tcl-f--full${
                        currentStatus === 'cancelled' || currentStatus === 'examined'
                          ? ' tcl-room-queue-row--room-only'
                          : ''
                      }`}
                    >
                      <div className="tcl-f tcl-room-queue-row__room">
                        <label htmlFor="reception-clinic-room">Chọn phòng</label>
                        {clinicRoomsErr ? (
                          <div className="tcl-banner-err" style={{ marginBottom: 8 }}>
                            {clinicRoomsErr}
                          </div>
                        ) : null}
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
                      {currentStatus !== 'cancelled' && currentStatus !== 'examined' ? (
                        <div className="tcl-f tcl-room-queue-row__queue">
                          <label htmlFor="reception-visit-queue">Số thứ tự</label>
                          <input
                            id="reception-visit-queue"
                            type="number"
                            min={1}
                            step={1}
                            value={visitQueueDraft}
                            onChange={(e) => setVisitQueueDraft(e.target.value)}
                            disabled={!canEditVisit}
                            placeholder="Tự gán"
                            title="Để trống = tự gán theo phòng"
                            autoComplete="off"
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Triệu chứng / Ghi chú</label>
                      <textarea readOnly rows={2} value={activeDetail.note || ''} placeholder="—" />
                    </div>
                    {currentStatus !== 'cancelled' && currentStatus !== 'examined' ? (
                      <>
                        {currentStatus === 'pending' ? (
                          <div className="tcl-f tcl-f--full">
                            <p className="tcl-muted" style={{ margin: 0, fontSize: '0.86rem' }}>
                              Chọn <strong>phòng khám</strong>, sau đó bấm <strong>Xác nhận đã thu</strong> ở mục Thanh toán để
                              thu phí và xác nhận lịch. <strong>Số thứ tự</strong> có thể để trống (tự gán theo phòng).
                            </p>
                          </div>
                        ) : null}
                        {visitErr ? (
                          <div className="tcl-f tcl-f--full">
                            <div className="tcl-banner-err">{visitErr}</div>
                          </div>
                        ) : null}
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
                          {activeDetail.payment?.invoiceNo ? (
                            <div className="tcl-f">
                              <label>Số hóa đơn</label>
                              <input readOnly value={activeDetail.payment.invoiceNo} />
                            </div>
                          ) : null}
                          {paymentInvoiceView ? (
                            <div className="tcl-f tcl-f--full tcl-payment-actions">
                              <button
                                type="button"
                                className="tcl-btn tcl-btn--print"
                                onClick={() => handlePrintPaymentInvoice()}
                              >
                                In hóa đơn
                              </button>
                            </div>
                          ) : null}
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
                              disabled={paymentSaving || saving || !canRecordPayment}
                              title={
                                !hasClinicRoom && canEditStatus && !isPaid
                                  ? 'Chọn phòng khám trước'
                                  : undefined
                              }
                              onClick={() => void handleRecordPayment()}
                            >
                              {paymentSaving ? 'Đang xử lý…' : 'Xác nhận đã thu'}
                            </button>
                          </div>
                          <p className="tcl-payment-hint">
                            Chọn phòng khám trước. Bấm <strong>Xác nhận đã thu</strong> để thu phí, xác nhận lịch và in{' '}
                            <strong>hóa đơn</strong> + <strong>phiếu khám</strong>.
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
                      {activeDetail.payment?.invoiceNo ? (
                        <div className="tcl-f">
                          <label>Số hóa đơn</label>
                          <input readOnly value={activeDetail.payment.invoiceNo} />
                        </div>
                      ) : null}
                      {paymentInvoiceView ? (
                        <div className="tcl-f tcl-f--full tcl-payment-actions">
                          <button
                            type="button"
                            className="tcl-btn tcl-btn--print"
                            onClick={() => handlePrintPaymentInvoice()}
                          >
                            In hóa đơn
                          </button>
                        </div>
                      ) : null}
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
                    <div className="tcl-status-row tcl-status-row--readonly" aria-readonly="true">
                      <label title="Chỉ hiển thị — thay đổi qua «Xác nhận đã thu» hoặc «Hủy lịch»">
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={currentStatus === 'pending'}
                          disabled
                          readOnly
                        />
                        Chờ xác nhận
                      </label>
                      <label title="Chỉ hiển thị">
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={currentStatus === 'cancelled'}
                          disabled
                          readOnly
                        />
                        Hủy
                      </label>
                      <label title={confirmBlockTitle || 'Chỉ hiển thị — xác nhận qua «Xác nhận đã thu»'}>
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={currentStatus === 'confirmed'}
                          disabled
                          readOnly
                        />
                        Xác nhận
                      </label>
                      <label title="Trạng thái này do bác sĩ/cận lâm sàng cập nhật">
                        <input
                          type="radio"
                          name={`st-${String(activeDetail?.id ?? 'x')}`}
                          checked={currentStatus === 'examined'}
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
                            : 'Trạng thái do hệ thống cập nhật, không chỉnh tay.'
                        }
                      >
                        {canEditStatus ? 'Chỉ xem — dùng nút thu phí / hủy lịch' : `Đã khóa: ${statusLabelVi(currentStatus)}`}
                        {canEditStatus && !hasClinicRoom ? ' · Chưa chọn phòng' : ''}
                        {canEditStatus && hasClinicRoom && !isPaid ? ' · Chưa thu phí' : ''}
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
                            currentStatus === 'confirmed'
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
                            currentStatus === 'confirmed' &&
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
                    {canFinishConfirm ? (
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--pri"
                        disabled={saving || paymentSaving}
                        onClick={() => void handleFinishConfirm()}
                      >
                        {saving ? 'Đang xác nhận…' : 'Hoàn tất xác nhận'}
                      </button>
                    ) : null}
                    {canEditStatus ? (
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--danger"
                        disabled={saving || paymentSaving}
                        onClick={() => void handleCancelAppointment()}
                      >
                        {saving ? 'Đang hủy…' : 'Hủy lịch'}
                      </button>
                    ) : null}
                    {canPrintPaymentInvoice && paymentInvoiceView ? (
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--print"
                        onClick={() => handlePrintPaymentInvoice()}
                      >
                        In hóa đơn
                      </button>
                    ) : null}
                    {canPrintVisitSlip && visitSlipView ? (
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--print"
                        onClick={() => void handlePrintVisitSlip()}
                      >
                        In phiếu khám
                      </button>
                    ) : null}
                  </div>
                </section>
                  </div>
                </div>
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
