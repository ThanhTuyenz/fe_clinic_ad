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
import { isPendingAppointmentPastSlot } from '../utils/appointmentExpiry'
import { getStaffSession, staffRole } from '../utils/staffSession'
import { listClinicRooms } from '../services/clinicRooms'
import { recordAppointmentPayment } from '../services/payments'
import { Html5Qrcode } from 'html5-qrcode'
import { resolveConsultationFee } from '../utils/consultationFee'
import { buildPaymentInvoiceView } from '../utils/paymentInvoiceView'
import { printPaymentInvoice, printPaymentThenVisitSlip } from '../utils/printPaymentInvoice'
import { printVisitSlip } from '../utils/printVisitSlip'
import { ticketFromQrPayload } from '../utils/ticketQr'
import { staffCheckInByQr } from '../services/checkIn'

import {
  PAGE_SIZE,
  QR_READER_ELEMENT_ID,
  buildVisitSlipView,
  cameraErrorMessage,
  detailMissingForSlip,
  displayName,
  matchesDashFilter,
  mergePayment,
  mergeReceptionDetail,
  normalizeLookup,
  normalizeStatus,
  readReceptionNavState,
  ymd,
} from '../components/reception/receptionHelpers'
import ReceptionStatsBar from '../components/reception/ReceptionStatsBar'
import ReceptionAppointmentTable from '../components/reception/ReceptionAppointmentTable'
import ReceptionDetailModal from '../components/reception/ReceptionDetailModal'
import ReceptionQrScannerModal from '../components/reception/ReceptionQrScannerModal'
import { PlusIcon } from '../components/reception/ReceptionIcons'

/** Quét pending trong khoảng ngày; hủy các lịch đã quá hết khung giờ mà chưa được xác nhận. */
async function expireStalePendingInRange({ token, from, to }: { token: string; from?: string; to?: string }) {
  const pendingRows = await listReceptionAppointments({
    token,
    from,
    to,
    status: 'pending',
  })
  const stale = (pendingRows || []).filter((r: any) => isPendingAppointmentPastSlot(r))
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
  const { token, user } = getStaffSession()
  const navInit = useMemo(() => readReceptionNavState(location), [])

  const [fromDate, setFromDate] = useState(navInit.fromDate)
  const [toDate, setToDate] = useState(navInit.toDate)
  const [statusFilter, setStatusFilter] = useState(navInit.statusFilter)
  const [dashFilter, setDashFilter] = useState(navInit.dashFilter)
  const [listSearch, setListSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(navInit.filtersOpen)

  const [list, setList] = useState<any[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listErr, setListErr] = useState('')
  const [page, setPage] = useState(0)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [lookupDetail, setLookupDetail] = useState<any>(null)
  const [detailById, setDetailById] = useState<Record<string, any>>(() => ({}))
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [detailErr, setDetailErr] = useState('')

  const [detailStatus, setDetailStatus] = useState('pending')
  const [saveMsg, setSaveMsg] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [saving, setSaving] = useState(false)

  const [visitQueueDraft, setVisitQueueDraft] = useState('')
  const [clinicRoomDraft, setClinicRoomDraft] = useState('')
  const [clinicRooms, setClinicRooms] = useState<any[]>([])
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
  const qrDecodeHandlerRef = useRef<any>(null)
  const [qrImageLoading, setQrImageLoading] = useState(false)
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
    } catch (e: any) {
      setListErr(e?.message || 'Không tải được danh sách.')
    } finally {
      setListLoading(false)
    }
  }, [token, fromDate, toDate, statusFilter])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (!token) return
    let c = false
    setClinicRoomsErr('')
    listClinicRooms({ token })
      .then((rows) => {
        if (c) return
        setClinicRooms(Array.isArray(rows) ? rows : [])
      })
      .catch((e: any) => {
        if (c) return
        setClinicRoomsErr(e?.message || 'Không tải được danh sách phòng khám.')
      })
    return () => {
      c = true
    }
  }, [token])

  const activeRow = useMemo(() => {
    if (!selectedId) return null
    return list.find((r) => String(r.id) === String(selectedId)) ?? null
  }, [list, selectedId])

  const activeDetail = useMemo(() => {
    if (lookupDetail) return lookupDetail
    if (!selectedId) return null
    const cached = detailById[selectedId]
    return mergeReceptionDetail(cached, activeRow)
  }, [lookupDetail, selectedId, detailById, activeRow])

  useEffect(() => {
    if (!activeDetail) return
    const st = normalizeStatus(activeDetail.status)
    setDetailStatus(st)
    setClinicRoomDraft(String(activeDetail.clinicRoom || '').trim())
    const q = activeDetail.visitQueueNumber
    setVisitQueueDraft(q != null && q !== '' ? String(q) : '')
  }, [activeDetail?.id, activeDetail?.status, activeDetail?.clinicRoom, activeDetail?.visitQueueNumber])

  const consultationFee = useMemo(() => {
    if (!activeDetail) return 0
    return resolveConsultationFee(activeDetail)
  }, [activeDetail])

  const isPaid = useMemo(() => {
    return String(activeDetail?.payment?.status || '').toLowerCase() === 'paid'
  }, [activeDetail?.payment?.status])

  const currentStatus = normalizeStatus(activeDetail?.status || detailStatus)
  const canEditStatus = currentStatus === 'pending'
  const pastSlotDetail = useMemo(() => isPendingAppointmentPastSlot(activeDetail), [activeDetail])
  const hasClinicRoom = Boolean(String(clinicRoomDraft || activeDetail?.clinicRoom || '').trim())
  const canFinishConfirm = canEditStatus && isPaid && hasClinicRoom

  const printInvoiceDisabled = useMemo(() => {
    return !activeDetail || !isPaid
  }, [activeDetail, isPaid])

  const printSlipDisabled = useMemo(() => {
    return !activeDetail || currentStatus !== 'confirmed' || !activeDetail.clinicRoom
  }, [activeDetail, currentStatus])

  const printBothDisabled = printInvoiceDisabled || printSlipDisabled

  const applyPaymentToCaches = useCallback((id: string, payment: any, norm: any = null) => {
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
    async (ticketCode: string) => {
      const t = String(ticketCode || activeDetail?.ticket || '').trim()
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

  async function persistAppointmentStatus(next: string, options: any = {}) {
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

    const visitExtra: any = {}
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
    let patch: any = {}
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

  function printAfterConfirm(docs: any) {
    if (!docs?.invoice || !docs?.visitSlip) return false
    return printPaymentThenVisitSlip({
      invoice: docs.invoice,
      visitSlip: docs.visitSlip,
    })
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
    } catch (e: any) {
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
          } catch (e2: any) {
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
    } catch (e: any) {
      setSaveErr(e?.message || 'Không xác nhận được lịch.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelAppointment() {
    if (!activeDetail?.id || !canEditStatus) return
    const ticketCode = String(activeDetail.ticket || '').trim()
    if (!window.confirm(ticketCode ? `Hủy lịch hẹn ${ticketCode}?` : 'Hủy lịch hẹn này?')) return
    setSaveErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      await persistAppointmentStatus('cancelled')
      setSaveMsg('Đã hủy lịch hẹn.')
    } catch (e: any) {
      setSaveErr(e?.message || 'Không hủy được lịch.')
    } finally {
      setSaving(false)
    }
  }

  async function handleOpenDetail(row: any) {
    if (!row) return
    const id = String(row.id)
    setLookupDetail(null)
    setSelectedId(id)
    setIsDetailOpen(true)
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
    } catch (e: any) {
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
      } catch (e: any) {
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

  const handleClinicRoomChange = useCallback(
    async (newRoomId: string) => {
      setClinicRoomDraft(newRoomId)
      setVisitErr('')
      const reqId = ++roomSttReqRef.current
      if (!newRoomId || !token || !activeDetail?.appointmentDate) {
        setVisitQueueDraft('')
        return
      }
      try {
        const nextQ = await getNextVisitQueueNumber({
          token,
          clinicRoom: newRoomId,
          appointmentDate: ymd(new Date(activeDetail.appointmentDate)),
        })
        if (reqId === roomSttReqRef.current) {
          setVisitQueueDraft(String(nextQ))
        }
      } catch {
        /* giữ nguyên draft */
      }
    },
    [token, activeDetail?.appointmentDate],
  )

  const printSlipOnly = useCallback(() => {
    if (!activeDetail) return
    const slip = buildVisitSlipView(activeDetail, clinicRooms, {
      clinicRoom: clinicRoomDraft,
      visitQueueNumber: visitQueueDraft,
    })
    if (!slip) return
    printVisitSlip(slip)
  }, [activeDetail, clinicRooms, clinicRoomDraft, visitQueueDraft])

  const printInvoiceOnly = useCallback(() => {
    if (!activeDetail) return
    const invoice = buildPaymentInvoiceView(activeDetail, {
      clinicRoom: clinicRoomDraft,
      visitQueueNumber: visitQueueDraft,
    })
    if (!invoice) return
    printPaymentInvoice(invoice)
  }, [activeDetail, clinicRoomDraft, visitQueueDraft])

  const printBothFromDetail = useCallback(() => {
    if (!activeDetail) return
    const invoice = buildPaymentInvoiceView(activeDetail, {
      clinicRoom: clinicRoomDraft,
      visitQueueNumber: visitQueueDraft,
    })
    const visitSlip = buildVisitSlipView(activeDetail, clinicRooms, {
      clinicRoom: clinicRoomDraft,
      visitQueueNumber: visitQueueDraft,
    })
    if (!invoice || !visitSlip) return
    printPaymentThenVisitSlip({ invoice, visitSlip })
  }, [activeDetail, clinicRooms, clinicRoomDraft, visitQueueDraft])

  const filteredList = useMemo(() => {
    return list.filter((row) => {
      if (!matchesDashFilter(row, dashFilter)) return false
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase()
        const ticketMatch = String(row.ticket || '').toLowerCase().includes(q)
        const pCodeMatch = String(row.patient?.patientCode || '').toLowerCase().includes(q)
        const nameMatch = displayName(row.patient).toLowerCase().includes(q)
        if (!ticketMatch && !pCodeMatch && !nameMatch) return false
      }
      return true
    })
  }, [list, dashFilter, listSearch])

  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE) || 1
  const paginatedList = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredList.slice(start, start + PAGE_SIZE)
  }, [filteredList, page])

  const stats = useMemo(() => {
    let pending = 0
    let unpaid = 0
    let noRoom = 0
    let ready = 0
    let expiring = 0

    for (const r of list) {
      if (normalizeStatus(r?.status) === 'pending') {
        pending++
        const paid = String(r?.payment?.status || '').toLowerCase() === 'paid'
        const room = String(r?.clinicRoom || '').trim()
        const isExp = isPendingAppointmentPastSlot(r)
        if (isExp) expiring++
        else if (!paid) unpaid++
        else if (!room) noRoom++
        else ready++
      }
    }
    return { pending, unpaid, noRoom, ready, expiring }
  }, [list])

  const handleQrFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrImageLoading(true)
    setQrErr('')
    try {
      const html5QrCode = new Html5Qrcode('tcl-qr-hidden-reader')
      const decodedText = await html5QrCode.scanFile(file, true)
      if (qrDecodeHandlerRef.current) {
        await qrDecodeHandlerRef.current(decodedText)
      }
    } catch (err: any) {
      setQrErr(cameraErrorMessage(err))
    } finally {
      setQrImageLoading(false)
    }
  }, [])

  if (!token || !user || staffRole(user) !== 'receptionist') return null

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col pl-0 md:pl-[232px] transition-all">
      <RoleSidebar role="receptionist" active="reception" user={user} onLogout={performLogout} />

      <div className="flex-1 p-5 md:p-6 max-w-[1600px] w-full mx-auto flex flex-col">
        {flashOk ? (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl shadow-xs">
            {flashOk}
          </div>
        ) : null}
        {flashErr ? (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl shadow-xs">
            {flashErr}
          </div>
        ) : null}

        {/* Header trang */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tiếp nhận & Điều phối lịch khám</h1>
            <p className="text-xs text-slate-500 mt-0.5">Danh sách lịch hẹn, kiểm tra thanh toán và phân phòng khám</p>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm border border-emerald-600 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98]"
            onClick={handleAdd}
          >
            <PlusIcon className="w-4 h-4 text-white" />
            <span>Tạo đăng ký mới</span>
          </button>
        </div>

        {/* Thanh Thống kê */}
        <ReceptionStatsBar
          stats={stats}
          dashFilter={dashFilter}
          setDashFilter={setDashFilter}
          statusFilter={statusFilter}
        />

        {/* Bảng danh sách lịch hẹn toàn màn hình */}
        <ReceptionAppointmentTable
          listSearch={listSearch}
          setListSearch={setListSearch}
          setQrListFocusTicket={setQrListFocusTicket}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          lookupLoading={lookupLoading}
          setTicketErr={setTicketErr}
          setQrErr={setQrErr}
          setQrOpen={setQrOpen}
          ticketErr={ticketErr}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setDashFilter={setDashFilter}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          list={list}
          filteredList={filteredList}
          dashFilter={dashFilter}
          paginatedList={paginatedList}
          selectedId={selectedId}
          detailLoadingId={detailLoadingId}
          onOpenDetail={handleOpenDetail}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          listLoading={listLoading}
          listErr={listErr}
          loadList={loadList}
        />
      </div>

      {/* Modal Chi tiết lịch hẹn */}
      <ReceptionDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedId(null)
        }}
        activeDetail={activeDetail}
        detailStatus={detailStatus}
        canEditStatus={canEditStatus}
        pastSlotDetail={pastSlotDetail}
        canFinishConfirm={canFinishConfirm}
        hasClinicRoom={hasClinicRoom}
        isPaid={isPaid}
        consultationFee={consultationFee}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentSaving={paymentSaving}
        handleRecordPayment={handleRecordPayment}
        paymentErr={paymentErr}
        clinicRoomDraft={clinicRoomDraft}
        setClinicRoomDraft={setClinicRoomDraft}
        handleClinicRoomChange={handleClinicRoomChange}
        clinicRooms={clinicRooms}
        clinicRoomsErr={clinicRoomsErr}
        visitQueueDraft={visitQueueDraft}
        setVisitQueueDraft={setVisitQueueDraft}
        saving={saving}
        handleFinishConfirm={handleFinishConfirm}
        handleCancelAppointment={handleCancelAppointment}
        openRegistrationFromActive={openRegistrationFromActive}
        printInvoiceDisabled={printInvoiceDisabled}
        printSlipDisabled={printSlipDisabled}
        printBothDisabled={printBothDisabled}
        printInvoiceOnly={printInvoiceOnly}
        printSlipOnly={printSlipOnly}
        printBothFromDetail={printBothFromDetail}
        saveMsg={saveMsg}
        saveErr={saveErr}
        visitErr={visitErr}
        detailErr={detailErr}
      />

      {/* Modal Quét QR */}
      <ReceptionQrScannerModal
        qrOpen={qrOpen}
        setQrOpen={setQrOpen}
        qrErr={qrErr}
        qrImageLoading={qrImageLoading}
        handleQrFileInput={handleQrFileInput}
      />
    </div>
  )
}
