'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useAppointmentsSocket } from '../hooks/useAppointmentsSocket'

import {
  PAGE_SIZE,
  buildVisitSlipView,
  cameraErrorMessage,
  detailMissingForSlip,
  displayName,
  getAppointmentWorkflowBucket,
  matchesDashFilter,
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
import { IdCard, X, Loader2, CheckCircle2 } from 'lucide-react'

async function expireStalePendingInRange({ token, from, to }: { token: string; from?: string; to?: string }) {
  try {
    const pendingRows = await listReceptionAppointments({ token, from, to, status: 'pending' })
    const stale = (pendingRows || []).filter((r: any) => isPendingAppointmentPastSlot(r))
    if (!stale.length) return false
    await Promise.allSettled(
      stale.map((row: any) =>
        updateAppointmentStatus({
          token,
          appointmentId: row.id,
          status: 'cancelled',
          cancelledBySystem: true,
          cancelReason: 'Quá thời gian chờ xác nhận — khung giờ khám đã kết thúc, hệ thống tự hủy lịch.',
        })
      )
    )
    return true
  } catch {
    return false
  }
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
  const [, setQrListFocusTicket] = useState('')
  const qrDecodeHandlerRef = useRef<any>(null)
  const [qrImageLoading, setQrImageLoading] = useState(false)
  const roomSttReqRef = useRef(0)

  const [flashOk, setFlashOk] = useState('')
  const [flashErr, setFlashErr] = useState('')

  const [isCccdModalOpen, setIsCccdModalOpen] = useState(false)
  const [cccdInput, setCccdInput] = useState('')
  const [cccdLoading, setCccdLoading] = useState(false)
  const [cccdErr, setCccdErr] = useState('')

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
      let rows = await listReceptionAppointments({ token, from: fromDate, to: toDate, status: statusFilter })
      const didExpire = await expireStalePendingInRange({ token, from: fromDate, to: toDate })
      if (didExpire) {
        rows = await listReceptionAppointments({ token, from: fromDate, to: toDate, status: statusFilter })
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

  useAppointmentsSocket({
    onAppointmentBooked: useCallback((event) => {
      void loadList()
      const patient = event.patientName ? ` (${event.patientName})` : ''
      const code = event.bookingCode ? `#${event.bookingCode}` : ''
      const service = event.servicePackageName || event.packageName || event.specialtyName || (event.doctorName ? `BS. ${event.doctorName}` : '')
      const serviceInfo = service ? ` · ${service}` : ''
      const dateInfo = event.appointmentDate ? ` [Ngày: ${event.appointmentDate}]` : ''
      setFlashOk(`🔔 Có lịch hẹn mới ${code}${patient}${serviceInfo}${dateInfo} vừa được xác nhận!`)
      setTimeout(() => setFlashOk(''), 8000)
    }, [loadList]),
    onStatusChanged: useCallback(() => {
      void loadList()
    }, [loadList]),
  })

  useEffect(() => {
    if (!token) return
    let active = true
    setClinicRoomsErr('')
    listClinicRooms({ token })
      .then((rows) => {
        if (active) setClinicRooms(Array.isArray(rows) ? rows : [])
      })
      .catch((e: any) => {
        if (active) setClinicRoomsErr(e?.message || 'Không tải được danh sách phòng khám.')
      })
    return () => { active = false }
  }, [token])

  const activeRow = useMemo(() => {
    if (!selectedId) return null
    return list.find((r) => String(r.id) === String(selectedId)) ?? null
  }, [list, selectedId])

  const activeDetail = useMemo(() => {
    if (lookupDetail) return lookupDetail
    if (!selectedId) return null
    return mergeReceptionDetail(detailById[selectedId], activeRow)
  }, [lookupDetail, selectedId, detailById, activeRow])

  useEffect(() => {
    if (!activeDetail) return
    setDetailStatus(normalizeStatus(activeDetail.status))
    setClinicRoomDraft(String(activeDetail.clinicRoom || '').trim())
    const q = activeDetail.visitQueueNumber
    setVisitQueueDraft(q != null && q !== '' ? String(q) : '')
  }, [activeDetail?.id, activeDetail?.status, activeDetail?.clinicRoom, activeDetail?.visitQueueNumber])

  const consultationFee = useMemo(() => activeDetail ? resolveConsultationFee(activeDetail) : 0, [activeDetail])
  const isPaid = useMemo(() => String(activeDetail?.payment?.status || '').toLowerCase() === 'paid', [activeDetail?.payment?.status])
  const currentStatus = normalizeStatus(activeDetail?.status || detailStatus)
  const canEditStatus = currentStatus === 'pending'
  const pastSlotDetail = useMemo(() => isPendingAppointmentPastSlot(activeDetail), [activeDetail])
  const hasClinicRoom = Boolean(String(clinicRoomDraft || activeDetail?.clinicRoom || '').trim())
  const canFinishConfirm = canEditStatus && isPaid && hasClinicRoom
  const printInvoiceDisabled = !activeDetail || !isPaid
  const printSlipDisabled = !activeDetail || currentStatus !== 'confirmed' || !activeDetail.clinicRoom
  const printBothDisabled = printInvoiceDisabled || printSlipDisabled

  const applyPaymentToCaches = useCallback((id: string, payment: any, norm: any = null) => {
    const key = String(id)
    if (!key || !payment) return
    setDetailById((prev) => ({
      ...prev,
      [key]: norm ? { ...(prev[key] || {}), ...norm, payment } : { ...(prev[key] || activeDetail || {}), payment },
    }))
    setList((prev) => prev.map((r) => (String(r.id) === key ? { ...r, payment } : r)))
    setLookupDetail((prev: any) => (prev && String(prev.id) === key ? { ...prev, ...(norm || {}), payment } : prev))
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
        /* ignore */
      }
      return false
    },
    [token, activeDetail?.ticket, applyPaymentToCaches],
  )

  async function persistAppointmentStatus(next: string, options: any = {}) {
    if (!activeDetail?.id) return null
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
      if (!room) throw new Error('Vui lòng chọn phòng khám trước khi xác nhận.')
      visitExtra.clinicRoom = room
      const qStr = String(visitQueueDraft || '').trim()
      if (qStr) {
        const n = parseInt(qStr, 10)
        if (!Number.isFinite(n) || n < 1) throw new Error('Số thứ tự phải là số nguyên dương.')
        visitExtra.visitQueueNumber = n
      }
    }

    const saveRes = await updateAppointmentStatus({ token, appointmentId: activeDetail.id, status, ...visitExtra })
    const ap = saveRes?.appointment
    const key = String(activeDetail.id)
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
      patch = {
        cancelReason: '',
        cancelledAt: null,
        cancelledBy: null,
        confirmedAt: ap?.confirmedAt ?? nowIso,
        confirmedBy: ap?.confirmedBy ?? { displayName: displayName(user), email: String(user?.email || '').trim() },
        visitQueueNumber: ap?.visitQueueNumber ?? (visitQueueDraft ? parseInt(visitQueueDraft, 10) : activeDetail.visitQueueNumber),
        clinicRoom: ap?.clinicRoom ?? clinicRoomDraft ?? activeDetail.clinicRoom,
      }
    }

    setDetailById((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || activeDetail), status, ...paymentPatch, ...patch },
    }))
    setList((prev) =>
      prev.map((r) => (String(r.id) === key ? { ...r, status, ...(status === 'confirmed' ? { payment: options.payment ?? r.payment, ...patch } : patch) } : r))
    )
    setDetailStatus(status)
    await loadList()
    setLookupDetail(null)
    setSelectedId(key)

    if (status !== 'confirmed') return null
    const merged = { ...activeDetail, status, ...paymentPatch, ...patch }
    const slipOverrides = { clinicRoom: patch.clinicRoom, visitQueueNumber: patch.visitQueueNumber }
    return {
      visitSlip: buildVisitSlipView(merged, clinicRooms, slipOverrides),
      invoice: buildPaymentInvoiceView(merged, slipOverrides),
    }
  }

  function printAfterConfirm(docs: any) {
    if (!docs?.invoice || !docs?.visitSlip) return false
    return printPaymentThenVisitSlip({ invoice: docs.invoice, visitSlip: docs.visitSlip })
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
      const paid = data?.appointment?.payment || null
      if (paid) {
        applyPaymentToCaches(activeDetail.id, paid, data.appointment)
      }
      const docs = await persistAppointmentStatus('confirmed', { afterPayment: true, payment: paid })
      if (docs && printAfterConfirm(docs)) {
        setSaveMsg('Đã thu phí, xác nhận lịch và mở in hóa đơn + phiếu khám.')
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
            if (docs && printAfterConfirm(docs)) {
              setSaveMsg('Lịch đã thu phí, đã xác nhận và mở in hóa đơn + phiếu khám.')
            } else {
              setSaveMsg('Lịch đã thu phí — đã xác nhận lịch hẹn.')
            }
          } catch (e2: any) {
            setSaveErr(e2?.message || 'Không xác nhận được lịch.')
          }
        } else {
          setPaymentErr(msg)
        }
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

  const handleManualCheckIn = useCallback(async () => {
    if (!activeDetail?.id || !token) return
    setSaveErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      await updateAppointmentStatus({
        appointmentId: activeDetail.id,
        status: 'checked_in',
        clinicRoom: clinicRoomDraft || undefined,
        visitQueueNumber: visitQueueDraft ? Number(visitQueueDraft) : undefined,
      })
      setSaveMsg('Đã xác nhận Check-in thành công cho bệnh nhân!')
      setFlashOk('Đã xác nhận Check-in thành công!')
      await loadList()
      setDetailById((prev) => ({
        ...prev,
        [String(activeDetail.id)]: {
          ...(prev[String(activeDetail.id)] || activeDetail),
          workflowStatus: 'CHECKED_IN',
          status: 'confirmed',
        },
      }))
    } catch (e: any) {
      setSaveErr(e?.message || 'Không thể check-in lịch hẹn này.')
    } finally {
      setSaving(false)
    }
  }, [activeDetail, token, clinicRoomDraft, visitQueueDraft, loadList])

  const handlePatientProfileUpdated = useCallback((updatedPatient: any) => {
    if (!activeDetail?.id) return
    setSaveMsg('Đã cập nhật thông tin bệnh nhân thành công!')
    setDetailById((prev) => {
      const current = prev[String(activeDetail.id)] || activeDetail
      return {
        ...prev,
        [String(activeDetail.id)]: {
          ...current,
          patient: {
            ...current.patient,
            ...updatedPatient,
            name: updatedPatient.fullName || current.patient?.name,
            fullName: updatedPatient.fullName || current.patient?.fullName,
            phone: updatedPatient.phoneNumber || current.patient?.phone,
            dob: updatedPatient.dateOfBirth || current.patient?.dob,
          },
        },
      }
    })
    void loadList()
  }, [activeDetail, loadList])

  const handleMarkCompleted = useCallback(async () => {
    if (!activeDetail?.id || !token) return
    setSaveErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      await updateAppointmentStatus({ appointmentId: activeDetail.id, status: 'completed' })
      setSaveMsg('Đã cập nhật trạng thái Khám xong!')
      setFlashOk('✅ Đã đánh dấu khám xong cho bệnh nhân!')
      setDetailById((prev) => ({
        ...prev,
        [String(activeDetail.id)]: {
          ...(prev[String(activeDetail.id)] || activeDetail),
          workflowStatus: 'COMPLETED',
          status: 'completed',
        },
      }))
      await loadList()
    } catch (e: any) {
      setSaveErr(e?.message || 'Không thể cập nhật trạng thái khám xong.')
    } finally {
      setSaving(false)
    }
  }, [activeDetail, token, loadList])

  const handleQrDecode = useCallback(async (payload: string) => {
    const raw = String(payload || '').trim()
    setQrErr('')
    try {
      const data = await lookupAppointmentByTicket({ token, ticket: raw })
      const norm = normalizeLookup(data)
      if (!norm?.id) throw new Error('Không tìm thấy thông tin lịch hẹn tương ứng.')

      setQrOpen(false)
      setSelectedId(String(norm.id))
      setLookupDetail(norm)
      setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
      setIsDetailOpen(true)
      setFlashOk(`🔍 Đã tìm thấy lịch hẹn [${norm.ticket || norm.bookingCode}]. Vui lòng đối chiếu thông tin và bấm Xác nhận Check-in.`)
    } catch (e: any) {
      setQrErr(e?.message || 'Mã QR không đúng định dạng hoặc không tìm thấy lịch hẹn.')
    }
  }, [token])

  const handleCccdCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const val = cccdInput.trim()
    if (!val) {
      setCccdErr('Vui lòng nhập số CCCD hoặc quét mã QR thẻ CCCD')
      return
    }
    setCccdLoading(true)
    setCccdErr('')
    try {
      const data = await lookupAppointmentByTicket({ token, ticket: val })
      const norm = normalizeLookup(data)
      if (!norm?.id) throw new Error('Không tìm thấy lịch hẹn nào khớp với số CCCD này.')

      setIsCccdModalOpen(false)
      setCccdInput('')
      setSelectedId(String(norm.id))
      setLookupDetail(norm)
      setDetailById((prev) => ({ ...prev, [String(norm.id)]: norm }))
      setIsDetailOpen(true)
      setFlashOk(`🔍 Đã tìm thấy lịch hẹn [${norm.ticket || norm.bookingCode}] theo CCCD. Vui lòng đối chiếu thông tin và bấm Xác nhận Check-in.`)
    } catch (err: any) {
      setCccdErr(err?.message || 'Không tìm thấy lịch hẹn phù hợp với CCCD này.')
    } finally {
      setCccdLoading(false)
    }
  }

  useEffect(() => {
    qrDecodeHandlerRef.current = handleQrDecode
  }, [handleQrDecode])

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

  async function openRegistrationFromActive() {
    if (!token || !activeDetail?.ticket) return
    setSaveErr('')
    setSaveMsg('')
    setDetailErr('')

    let detail = activeDetail
    const hasNeeded = Boolean(detail?.patient && detail?.doctor?.id && detail?.appointmentDate && detail?.startTime)

    if (!hasNeeded) {
      const id = String(detail?.id || '')
      setDetailLoadingId(id || 'lookup')
      try {
        const data = await lookupAppointmentByTicket({ token, ticket: detail.ticket })
        detail = normalizeLookup(data)
        setDetailById((prev) => ({ ...prev, [String(detail.id)]: detail }))
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
    if (slip) printVisitSlip(slip)
  }, [activeDetail, clinicRooms, clinicRoomDraft, visitQueueDraft])

  const printInvoiceOnly = useCallback(() => {
    if (!activeDetail) return
    const invoice = buildPaymentInvoiceView(activeDetail, {
      clinicRoom: clinicRoomDraft,
      visitQueueNumber: visitQueueDraft,
    })
    if (invoice) printPaymentInvoice(invoice)
  }, [activeDetail, clinicRoomDraft, visitQueueDraft])

  const printBothFromDetail = useCallback(() => {
    if (!activeDetail) return
    const invoice = buildPaymentInvoiceView(activeDetail, { clinicRoom: clinicRoomDraft, visitQueueNumber: visitQueueDraft })
    const visitSlip = buildVisitSlipView(activeDetail, clinicRooms, { clinicRoom: clinicRoomDraft, visitQueueNumber: visitQueueDraft })
    if (invoice && visitSlip) printPaymentThenVisitSlip({ invoice, visitSlip })
  }, [activeDetail, clinicRooms, clinicRoomDraft, visitQueueDraft])

  const filteredList = useMemo(() => {
    return list.filter((row) => {
      if (!matchesDashFilter(row, dashFilter)) return false
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase()
        const ticketMatch = String(row.ticket || '').toLowerCase().includes(q)
        const pCodeMatch = String(row.patient?.patientCode || '').toLowerCase().includes(q)
        const nameMatch = displayName(row.patient).toLowerCase().includes(q)
        const cccdMatch = String(row.patient?.nationalId || '').toLowerCase().includes(q)
        const phoneMatch = String(row.patient?.phone || '').toLowerCase().includes(q)
        if (!ticketMatch && !pCodeMatch && !nameMatch && !cccdMatch && !phoneMatch) return false
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
    let pendingCheckin = 0
    let unpaid = 0
    let checkedIn = 0
    let completed = 0
    let cancelled = 0

    for (const r of list) {
      const bucket = getAppointmentWorkflowBucket(r)
      if (bucket === 'pending_checkin') pendingCheckin++
      else if (bucket === 'unpaid') unpaid++
      else if (bucket === 'checked_in') checkedIn++
      else if (bucket === 'completed') completed++
      else if (bucket === 'cancelled') cancelled++
    }
    return {
      all: list.length,
      pendingCheckin,
      unpaid,
      checkedIn,
      completed,
      cancelled,
    }
  }, [list])

  const handleSelectDashFilter = useCallback((val: string) => {
    setDashFilter(val)
    if (val && statusFilter !== 'all') {
      setStatusFilter('all')
    }
  }, [statusFilter])

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
        {flashOk && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl shadow-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{flashOk}</span>
          </div>
        )}
        {flashErr && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl shadow-xs">
            {flashErr}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tiếp nhận & Điều phối lịch khám</h1>
            <p className="text-xs text-slate-500 mt-0.5">Danh sách lịch hẹn, kiểm tra thanh toán và phân phòng khám</p>
          </div>
        </div>

        <ReceptionStatsBar
          stats={stats}
          dashFilter={dashFilter}
          setDashFilter={handleSelectDashFilter}
          statusFilter={statusFilter}
        />

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
          onOpenCccdCheckIn={() => {
            setCccdErr('')
            setCccdInput('')
            setIsCccdModalOpen(true)
          }}
          handleQrFileInput={handleQrFileInput}
          qrImageLoading={qrImageLoading}
        />
      </div>

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
        handleManualCheckIn={handleManualCheckIn}
        onMarkCompleted={handleMarkCompleted}
        onPatientProfileUpdated={handlePatientProfileUpdated}
      />

      <ReceptionQrScannerModal
        qrOpen={qrOpen}
        setQrOpen={setQrOpen}
        qrErr={qrErr}
        setQrErr={setQrErr}
        qrImageLoading={qrImageLoading}
        handleQrFileInput={handleQrFileInput}
        onScan={handleQrDecode}
      />

      {isCccdModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsCccdModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Check-in bằng CCCD / Mã QR CCCD</span>
              </h2>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                onClick={() => setIsCccdModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Nhập 12 số CCCD gắn chip của bệnh nhân hoặc quét chuỗi mã QR trên thẻ CCCD Bộ Công An.
            </p>

            {cccdErr && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {cccdErr}
              </div>
            )}

            <form onSubmit={handleCccdCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số CCCD / Dữ liệu QR CCCD:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={cccdInput}
                  onChange={(e) => setCccdInput(e.target.value)}
                  placeholder="Ví dụ: 079099012345..."
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                  onClick={() => setIsCccdModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={cccdLoading || !cccdInput.trim()}
                  className="flex-1 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {cccdLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra…</> : 'Xác nhận Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div id="tcl-qr-hidden-reader" className="hidden" />
    </div>
  )
}
