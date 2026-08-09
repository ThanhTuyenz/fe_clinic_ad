'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@/common/hooks/useNextNavigation'
import { Html5Qrcode } from 'html5-qrcode'
import { finishExamAppointment, listDoctorAppointments, listPatientHistory } from '../services/appointments'
import { listClinicRooms } from '../services/clinicRooms'
import { getExaminationByAppointment, saveExamination } from '../services/examinations'
import { searchMedicines } from '../services/medicines'
import DoctorAppHeader from '../components/DoctorAppHeader'
import IcdDiagnosisField, { formatIcdLabel, parseIcdFromExamination } from '../components/IcdDiagnosisField'
import { runDoctorShortcut } from '../utils/doctorShortcuts'
import { buildPrescriptionPrintViewFromExam, printPrescription } from '../utils/printPrescription'
import {
  RX_FREQUENCY_OPTIONS,
  formatRxDosageLabel,
  formatRxDurationLabel,
  formatRxFrequencyLabel,
  emptyRxLine,
  normalizeRxLines,
  patchRxLine,
  rxLineToApiPayload,
  rxLineToLegacyPrescriptionItem,
  sanitizeDosageAmountInput,
  sanitizeDurationDaysInput,
  sanitizeQuantityInput,
  filterFilledRxLines,
  prescriptionHasMedicines,
  validateRxCatalogPick,
  validateRxLinesForFinish,
} from '../utils/prescriptionLine'
import { formatMedicineLabel, rxLineMedicineName } from '../utils/medicineLabel'
import { appointmentSourceLabel, appointmentSourceTitle, appointmentSourceValue } from '../utils/appointmentSource'
import { getStaffSession } from '../utils/staffSession'
import { ticketFromQrPayload } from '../utils/ticketQr'

const DR_QR_READER_ELEMENT_ID = 'dr-ticket-qr-reader'

function getSession() {
  return getStaffSession()
}

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || user?.fullName || '').trim() || user?.email || 'Bác sĩ'
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toDatetimeLocalValue(d) {
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Bộ lọc từ trang Thống kê (Dashboard). */
function readDoctorNavState(location) {
  const today = ymd(new Date())
  const from = String(location?.state?.fromDate || '').trim()
  const to = String(location?.state?.toDate || '').trim()
  const st = String(location?.state?.statusFilter || '').trim()
  return {
    fromDate: from || today,
    toDate: to || today,
    statusFilter: st || 'confirmed',
    filtersOpen: Boolean(location?.state?.dashNavAt),
  }
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

function formatGenderShort(gender) {
  const g = String(gender || '').trim()
  if (!g) return ''
  if (/^(male|nam)$/i.test(g)) return 'Nam'
  if (/^(female|nữ|nu)$/i.test(g)) return 'Nữ'
  return g
}

function formatPatientAgeShort(dob) {
  if (!dob) return ''
  const d = dob instanceof Date ? dob : new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const md = now.getMonth() - d.getMonth()
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age -= 1
  if (age >= 0 && age <= 120) return `${age} tuổi`
  return String(d.getFullYear())
}

function patientDemographicLine(a) {
  const parts = [
    formatGenderShort(a?.patient?.gender),
    formatPatientAgeShort(a?.patient?.dob),
    timeLabel(a?.startTime),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

function patientIdsLine(a) {
  const ticket = String(a?.ticket || a?.id || '').trim()
  const code = String(a?.patient?.patientCode || '').trim()
  if (code && ticket) return `${code} · ${ticket}`
  return code || ticket || '—'
}

function clinicRoomLabel(roomId, rooms) {
  const id = String(roomId || '').trim()
  if (!id) return ''
  const hit = (rooms || []).find((r) => String(r.roomID) === id)
  return hit?.name ? String(hit.name).trim() : id
}

function isAppointmentExamined(st) {
  const s = String(st || '').toLowerCase()
  return s === 'examined' || s === 'completed' || s === 'done'
}

function isAppointmentPaymentPaid(a) {
  return String(a?.payment?.status || '').toLowerCase() === 'paid'
}

/** Chỉ cho sửa phiên khám khi lễ tân đã xác nhận lịch và thu phí. */
function canDoctorEditExamAppt(a) {
  if (!a) return false
  const st = String(a?.status || '').toLowerCase()
  if (st === 'cancelled' || isAppointmentExamined(st)) return false
  if (st !== 'confirmed') return false
  return isAppointmentPaymentPaid(a)
}

function doctorExamLockMessage(a) {
  if (!a) return 'Chọn một lịch trong danh sách.'
  const st = String(a?.status || '').toLowerCase()
  if (st === 'cancelled') return 'Lịch đã hủy — chỉ xem thông tin.'
  if (isAppointmentExamined(st)) return 'Đã kết thúc khám — chỉ xem, không chỉnh sửa.'
  if (st === 'pending') {
    return 'Lễ tân chưa xác nhận lịch. Chờ tiếp nhận thu phí và xác nhận trước khi khám.'
  }
  if (!isAppointmentPaymentPaid(a)) {
    return 'Chưa thu phí tại quầy. Nhờ lễ tân xác nhận thanh toán trước khi khám.'
  }
  if (st !== 'confirmed') {
    return 'Lịch chưa sẵn sàng khám. Cần trạng thái đã xác nhận sau khi lễ tân thu phí.'
  }
  return ''
}

function statusLabelVi(st) {
  const s = String(st || '').toLowerCase()
  if (s === 'cancelled') return 'Đã hủy'
  if (isAppointmentExamined(s)) return 'Đã khám'
  if (s === 'confirmed') return 'Chờ khám'
  if (s === 'pending') return 'Chờ xác nhận'
  return 'Chờ'
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

function formatDateTimeVi(iso) {
  if (iso == null || iso === '') return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Nhân viên tiếp nhận xác nhận lịch (từ API `confirmedBy`). */
function formatConfirmedByLine(confirmedBy) {
  if (!confirmedBy || typeof confirmedBy !== 'object') return '—'
  const name = String(confirmedBy.displayName || '').trim() || String(confirmedBy.email || '').trim()
  return name || '—'
}

function formatDobVi(iso) {
  if (!iso) return '—'
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatApptDateVi(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function historySortKey(appt) {
  const dk = dateKeyFromAppointmentDate(appt?.appointmentDate) || '0000-00-00'
  const t = timeLabel(appt?.startTime) || '00:00'
  return `${dk}T${t}`
}

function doctorLabelFromAppt(appt) {
  const d = appt?.doctor
  if (d && typeof d === 'object') {
    const fromParts = [d.lastName, d.firstName].filter(Boolean).join(' ').trim()
    return String(d.displayName || '').trim() || fromParts || String(appt?.doctorName || '').trim() || '—'
  }
  return String(appt?.doctorName || '').trim() || '—'
}

function specialtyLabelFromAppt(appt) {
  return String(appt?.doctor?.specialtyName || appt?.doctor?.specialty || '').trim()
}

function historyDiagnosisLabel(ex) {
  if (!ex) return ''
  const code = String(ex.diagnosisCode || ex.icdCode || '').trim()
  const name = String(ex.diagnosisName || '').trim()
  if (code && name) return `${code} – ${name}`
  return String(ex.diagnosis || '').trim()
}

function historyMedicineNames(ex) {
  if (!ex) return []
  const names = []
  const seen = new Set()
  const push = (raw) => {
    const n = String(raw || '').trim()
    if (!n) return
    const key = n.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    names.push(n)
  }
  for (const line of Array.isArray(ex.prescriptionLines) ? ex.prescriptionLines : []) {
    push(rxLineMedicineName(line))
  }
  if (!names.length) {
    for (const row of Array.isArray(ex.prescription) ? ex.prescription : []) {
      push(row?.name)
    }
  }
  return names
}

function isHistoryVisit(appt) {
  const st = String(appt?.status || '').toLowerCase()
  if (isAppointmentExamined(st)) return true
  const ex = appt?.examination
  return Boolean(historyDiagnosisLabel(ex) || String(ex?.symptoms || '').trim())
}

const VITAL_PLACEHOLDER = '--'

/** Khoảng giá trị hợp lệ cho sinh hiệu (để trống = không bắt buộc). */
const VITAL_RULES = {
  temp: { min: 30, max: 45, label: 'Nhiệt độ (°C)' },
  breath: { min: 10, max: 250, label: 'Nhịp thở', integer: true },
  bp: { min: 60, max: 250, label: 'Huyết áp (tâm thu)', type: 'bp' },
  pulse: { min: 10, max: 250, label: 'Mạch', integer: true },
  spo2: { min: 50, max: 100, label: 'SpO₂ (%)', integer: true },
  height: { min: 30, max: 250, label: 'Chiều cao (cm)' },
  weight: { min: 1, max: 300, label: 'Cân nặng (kg)' },
  bmi: { min: 10, max: 60, label: 'BMI' },
}

const VITAL_FIELD_UI = [
  { key: 'temp', label: 'Nhiệt độ (°C)', inputMode: 'decimal' },
  { key: 'breath', label: 'Nhịp thở (L/P)', inputMode: 'numeric' },
  { key: 'bp', label: 'Huyết áp (mmHg)', inputMode: 'text', placeholder: '-- (vd: 120/80)' },
  { key: 'pulse', label: 'Mạch (L/P)', inputMode: 'numeric' },
  { key: 'height', label: 'Chiều cao (cm)', inputMode: 'numeric' },
  { key: 'weight', label: 'Cân nặng (kg)', inputMode: 'decimal' },
  { key: 'bmi', label: 'BMI (kg/m²)', inputMode: 'decimal' },
  { key: 'spo2', label: 'SpO₂ (%)', inputMode: 'numeric' },
]

function parseVitalNumber(raw) {
  const s = String(raw ?? '').trim()
  if (!s || s === VITAL_PLACEHOLDER) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function parseBpSystolic(raw) {
  const s = String(raw ?? '').trim()
  if (!s || s === VITAL_PLACEHOLDER) return null
  const head = s.split('/')[0].trim()
  const n = Number(head.replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function validateVitalField(key, value) {
  const rule = VITAL_RULES[key]
  if (!rule) return ''
  const s = String(value ?? '').trim()
  if (!s || s === VITAL_PLACEHOLDER) return ''

  if (rule.type === 'bp') {
    const sys = parseBpSystolic(s)
    if (Number.isNaN(sys)) return `${rule.label}: nhập số hợp lệ (vd: 120 hoặc 120/80).`
    if (sys < rule.min || sys > rule.max) {
      return `${rule.label}: chỉ cho phép tâm thu ${rule.min}–${rule.max} mmHg.`
    }
    return ''
  }

  const n = parseVitalNumber(s)
  if (Number.isNaN(n)) return `${rule.label}: nhập số hợp lệ.`
  if (rule.integer && !Number.isInteger(n)) return `${rule.label}: nhập số nguyên.`
  if (n < rule.min || n > rule.max) {
    return `${rule.label}: chỉ cho phép ${rule.min}–${rule.max}.`
  }
  return ''
}

function validateAllVitals(vitals) {
  const errors = {}
  for (const key of Object.keys(VITAL_RULES)) {
    const msg = validateVitalField(key, vitals[key])
    if (msg) errors[key] = msg
  }
  return errors
}

function vitalsHasEntry(vitals) {
  return Object.keys(VITAL_RULES).some((key) => {
    const v = String(vitals?.[key] ?? '').trim()
    return v && v !== VITAL_PLACEHOLDER
  })
}

const VITALS_MISSING_MSG =
  'Vui lòng nhập ít nhất một chỉ số sinh hiệu (ví dụ: nhiệt độ, mạch…), hoặc tick “Bỏ qua sinh hiệu”.'

function getVitalsFinishIssue(vitals, vitalsSkipConfirmed) {
  if (vitalsSkipConfirmed) return { ok: true, errors: {}, missing: false }
  const errors = validateAllVitals(vitals)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, missing: false, message: 'Sinh hiệu ngoài khoảng cho phép — kiểm tra lại các ô đỏ.' }
  }
  if (!vitalsHasEntry(vitals)) {
    return { ok: false, errors: {}, missing: true, message: VITALS_MISSING_MSG }
  }
  return { ok: true, errors: {}, missing: false }
}

function vitalsReadyForFinish(vitals, vitalsSkipConfirmed) {
  return getVitalsFinishIssue(vitals, vitalsSkipConfirmed).ok
}

function sanitizeVitalInput(key, raw) {
  const s = String(raw ?? '')
  if (key === 'bp') return s.replace(/[^\d/.,\s]/g, '').slice(0, 14)
  if (VITAL_RULES[key]) return s.replace(/[^\d.,]/g, '').slice(0, 10)
  return s
}

export default function DoctorHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const navInit = useMemo(() => readDoctorNavState(location), [])
  const { token, user } = getSession()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Bác sĩ chỉ thấy lịch sau khi tiếp nhận xác nhận (confirmed/examined), không hiển thị pending/cancelled.
  const [filterStatus, setFilterStatus] = useState(navInit.statusFilter)
  const [filterFrom, setFilterFrom] = useState(navInit.fromDate)
  const [filterTo, setFilterTo] = useState(navInit.toDate)
  /** Tìm nhanh trong danh sách đã tải: mã lịch hẹn, mã BN hoặc tên. */
  const [listSearch, setListSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(navInit.filtersOpen)
  const [qrListFocusTicket, setQrListFocusTicket] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [selectedApptId, setSelectedApptId] = useState(null)
  const [examSubTab, setExamSubTab] = useState('info')

  const [vitals, setVitals] = useState({
    examAt: '',
    clinicRoom: '',
    temp: '',
    breath: '',
    bp: '',
    pulse: '',
    height: '',
    weight: '',
    bmi: '',
    spo2: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  })

  const [prescriptionLines, setPrescriptionLines] = useState([emptyRxLine()])
  const [rxPickOpen, setRxPickOpen] = useState(false)
  const [rxPickRow, setRxPickRow] = useState(0)
  const [medicineQuery, setMedicineQuery] = useState('')
  const [medicineResults, setMedicineResults] = useState([])
  const [medicineSearchLoading, setMedicineSearchLoading] = useState(false)
  const [medicineSearchErr, setMedicineSearchErr] = useState('')

  const [clinicRooms, setClinicRooms] = useState([])
  const [patientHistory, setPatientHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyErr, setHistoryErr] = useState('')

  const [vitalsErrors, setVitalsErrors] = useState({})
  const [vitalsFormError, setVitalsFormError] = useState('')
  const [vitalsSkipConfirmed, setVitalsSkipConfirmed] = useState(false)
  const [diagnosisIcd, setDiagnosisIcd] = useState(null)
  const [diagnosisError, setDiagnosisError] = useState('')

  const [examSaving, setExamSaving] = useState(false)
  const [awaitingPrintLock, setAwaitingPrintLock] = useState(false)
  const [emptyRxConfirmOpen, setEmptyRxConfirmOpen] = useState(false)
  const [examSaveOk, setExamSaveOk] = useState('')
  const [examSaveErr, setExamSaveErr] = useState('')
  const flashTimerRef = useRef(null)
  const examLoadSeqRef = useRef(0)
  const itemsRef = useRef([])
  const qrScanDoneRef = useRef(false)
  const listSearchRef = useRef(null)

  const [qrOpen, setQrOpen] = useState(false)
  const [qrErr, setQrErr] = useState('')

  function clearFlashTimer() {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = null
    }
  }

  function flashOk(msg) {
    clearFlashTimer()
    setExamSaveErr('')
    setExamSaveOk(msg)
    flashTimerRef.current = setTimeout(() => {
      setExamSaveOk('')
      flashTimerRef.current = null
    }, 2000)
  }

  function flashErr(msg) {
    clearFlashTimer()
    setExamSaveOk('')
    setExamSaveErr(msg)
    flashTimerRef.current = setTimeout(() => {
      setExamSaveErr('')
      flashTimerRef.current = null
    }, 2000)
  }

  useEffect(() => {
    return () => clearFlashTimer()
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const applyTicketFromQr = useCallback((raw) => {
    const code = ticketFromQrPayload(raw)
    if (!code) return
    setListSearch(code)
    setQrListFocusTicket(code)
    setPage(1)
    const hit = (itemsRef.current || []).find(
      (a) => String(a?.ticket || '').trim().toLowerCase() === code.toLowerCase(),
    )
    if (hit) {
      setSelectedApptId(String(hit?.id || hit?._id || ''))
      flashOk(`Đã mở lịch ${code}`)
    } else {
      flashErr(`Không thấy lịch ${code} trong danh sách của bạn. Kiểm tra ngày khám hoặc bộ lọc.`)
    }
  }, [])

  useEffect(() => {
    if (!qrOpen) return undefined
    setQrErr('')
    qrScanDoneRef.current = false
    const html5 = new Html5Qrcode(DR_QR_READER_ELEMENT_ID, { verbose: false })
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
      applyTicketFromQr(code)
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
          if (!cancelled) setQrErr(e2?.message || 'Không mở được camera.')
        }
      }
    })()

    return () => {
      cancelled = true
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
  }, [qrOpen, applyTicketFromQr])

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (user.userType === 'receptionist' || user.userType === 'registration') {
      navigate('/dashboard', { replace: true })
    }
  }, [token, user, navigate])

  useEffect(() => {
    void listClinicRooms()
      .then((rows) => setClinicRooms(Array.isArray(rows) ? rows : []))
      .catch(() => setClinicRooms([]))
  }, [])

  // Bộ lọc từ Thống kê — mỗi lần bấm thẻ KPI áp dụng lại
  useEffect(() => {
    const navAt = location.state?.dashNavAt
    if (navAt == null || navAt === '') return
    const n = readDoctorNavState(location)
    setFilterFrom(n.fromDate)
    setFilterTo(n.toDate)
    setFilterStatus(n.statusFilter)
    setFiltersOpen(n.filtersOpen)
    setListSearch('')
    setQrListFocusTicket('')
    setPage(1)
  }, [location.state?.dashNavAt])

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
        setItems(rows || [])
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

    // Chỉ hiển thị lịch lễ tân đã xác nhận + thu phí, hoặc đã khám xong (xem lại).
    rows = rows.filter((a) => {
      const st = String(a?.status || '').toLowerCase()
      if (st === 'cancelled' || st === 'pending') return false
      if (st === 'confirmed' && !isAppointmentPaymentPaid(a)) return false
      return st === 'confirmed' || isAppointmentExamined(st)
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
    if (filterStatus !== 'all') {
      rows = rows.filter((a) => String(a?.status || '').toLowerCase() === filterStatus)
    }

    const focus = qrListFocusTicket.trim().toLowerCase()
    if (focus) {
      const hits = rows.filter((a) => String(a?.ticket || '').toLowerCase() === focus)
      return hits.length ? hits : []
    }

    const q = listSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter((a) => {
        const ticket = String(a?.ticket || a?.id || '').toLowerCase()
        const code = String(a?.patient?.patientCode || '').toLowerCase()
        const name = patientLabel(a).toLowerCase()
        return ticket.includes(q) || code.includes(q) || name.includes(q)
      })
    }
    return rows
  }, [items, filterFrom, filterTo, filterStatus, listSearch, qrListFocusTicket])

  const totalFiltered = filteredQueue.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(page, pageCount)
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredQueue.slice(start, start + pageSize)
  }, [filteredQueue, safePage])

  useEffect(() => {
    setPage(1)
  }, [filterFrom, filterTo, filterStatus, listSearch, qrListFocusTicket])

  const selectedAppt = useMemo(() => {
    if (!selectedApptId) return null
    return items.find((a) => String(a?.id || a?._id) === String(selectedApptId)) || null
  }, [items, selectedApptId])

  const receptionClinicRoomId = useMemo(
    () => String(selectedAppt?.clinicRoom || '').trim(),
    [selectedAppt?.clinicRoom],
  )

  const receptionClinicRoomDisplay = useMemo(() => {
    if (!receptionClinicRoomId) {
      return { label: '—', hint: 'Lễ tân chưa chọn phòng tiếp nhận' }
    }
    return {
      label: clinicRoomLabel(receptionClinicRoomId, clinicRooms) || receptionClinicRoomId,
      hint: 'Phòng do lễ tân gán khi xác nhận lịch',
    }
  }, [receptionClinicRoomId, clinicRooms])

  const examLocked = useMemo(() => {
    if (!selectedAppt) return true
    if (awaitingPrintLock) return true
    return !canDoctorEditExamAppt(selectedAppt)
  }, [selectedAppt, awaitingPrintLock])

  const examLockMessage = useMemo(() => doctorExamLockMessage(selectedAppt), [selectedAppt])

  const rxHasMedicines = prescriptionHasMedicines(prescriptionLines)
  const rxDisplayLines = useMemo(() => {
    if (!examLocked) return prescriptionLines
    return filterFilledRxLines(prescriptionLines)
  }, [examLocked, prescriptionLines])
  const showRxEmptyReadonly = examLocked && !rxHasMedicines

  const historyTimeline = useMemo(() => {
    return [...patientHistory]
      .filter(isHistoryVisit)
      .sort((a, b) => historySortKey(b).localeCompare(historySortKey(a)))
  }, [patientHistory])

  const finishExamCheck = useMemo(() => {
    const reasons = []
    if (!diagnosisIcd?.code) {
      reasons.push('Chọn chẩn đoán ICD-10 từ danh sách gợi ý.')
    }
    const vitalIssue = getVitalsFinishIssue(vitals, vitalsSkipConfirmed)
    if (!vitalIssue.ok && vitalIssue.message) {
      reasons.push(vitalIssue.message)
    }
    if (prescriptionHasMedicines(prescriptionLines)) {
      const rxCheck = validateRxLinesForFinish(prescriptionLines)
      if (!rxCheck.ok) reasons.push(rxCheck.message)
      const rxCatalog = validateRxCatalogPick(prescriptionLines)
      if (!rxCatalog.ok) reasons.push(rxCatalog.message)
    }
    return { ok: reasons.length === 0, reasons }
  }, [diagnosisIcd?.code, vitals, vitalsSkipConfirmed, prescriptionLines])

  const canFinishExam = finishExamCheck.ok

  /** Gợi ý vàng theo tab — tab Đơn thuốc không nhắc sinh hiệu (checkbox ở tab Thông tin). */
  const finishHintsForTab = useMemo(() => {
    if (examSubTab === 'info') return finishExamCheck.reasons
    return finishExamCheck.reasons.filter((r) => {
      const s = String(r).toLowerCase()
      if (s.includes('sinh hiệu') || s.includes('bỏ qua sinh hiệu')) return false
      return true
    })
  }, [finishExamCheck.reasons, examSubTab])

  const finishDisabledTitle = finishHintsForTab[0] || finishExamCheck.reasons[0] || undefined

  function applyVitalsFinishFeedback(issue) {
    if (!issue || issue.ok) {
      setVitalsFormError('')
      setVitalsErrors({})
      return
    }
    if (issue.missing) {
      setVitalsFormError(issue.message || VITALS_MISSING_MSG)
      setVitalsErrors({})
    } else {
      setVitalsFormError('')
      setVitalsErrors(issue.errors || {})
    }
    setExamSubTab('info')
  }

  function setVitalField(key, raw) {
    const value = sanitizeVitalInput(key, raw)
    setVitals((s) => ({ ...s, [key]: value }))
    setVitalsErrors((errs) => ({ ...errs, [key]: validateVitalField(key, value) }))
    if (value && value !== VITAL_PLACEHOLDER) {
      setVitalsSkipConfirmed(false)
      setVitalsFormError('')
    }
  }

  function blurVitalField(key) {
    const value = String(vitals[key] ?? '').trim()
    if (value === VITAL_PLACEHOLDER) {
      setVitals((s) => ({ ...s, [key]: '' }))
      setVitalsErrors((errs) => ({ ...errs, [key]: '' }))
      return
    }
    setVitalsErrors((errs) => ({ ...errs, [key]: validateVitalField(key, value) }))
  }

  function buildExamPayload() {
    const icdCode = String(diagnosisIcd?.code || '').trim()
    const icdName = String(diagnosisIcd?.name || '').trim()
    const roomFromReception = receptionClinicRoomId
    return {
      examAt: vitals.examAt,
      clinicRoom: roomFromReception,
      temp: vitals.temp,
      breath: vitals.breath,
      bp: vitals.bp,
      pulse: vitals.pulse,
      height: vitals.height,
      weight: vitals.weight,
      bmi: vitals.bmi,
      spo2: vitals.spo2,
      symptoms: vitals.symptoms,
      diagnosis: icdCode && icdName ? formatIcdLabel(icdCode, icdName) : '',
      diagnosisCode: icdCode,
      diagnosisName: icdName,
      treatment: vitals.treatment,
      notes: vitals.notes,
      treat: vitals.treatment,
      vitalsSkipped: vitalsSkipConfirmed,
      prescriptionLines: prescriptionLines.map(rxLineToApiPayload).filter(Boolean),
      prescription: prescriptionLines.map(rxLineToLegacyPrescriptionItem).filter(Boolean),
    }
  }

  async function handleSaveExamination() {
    if (!token || examLocked || examSaving) return
    const appointmentId = String(selectedAppt?.id || selectedAppt?._id || '').trim()
    if (!appointmentId) {
      flashErr('Chưa chọn lịch khám.')
      return
    }

    const vitalIssue = getVitalsFinishIssue(vitals, vitalsSkipConfirmed)
    if (!vitalIssue.ok) {
      applyVitalsFinishFeedback(vitalIssue)
      flashErr(vitalIssue.message || 'Sinh hiệu không hợp lệ.')
      return
    }

    if (!diagnosisIcd?.code) {
      setDiagnosisError('Vui lòng chọn chẩn đoán ICD-10 từ danh sách gợi ý.')
      flashErr('Vui lòng chọn chẩn đoán ICD-10 từ danh sách gợi ý.')
      return
    }
    setDiagnosisError('')

    setExamSaving(true)
    clearFlashTimer()
    setExamSaveOk('')
    setExamSaveErr('')
    try {
      await saveExamination({ token, appointmentId, payload: buildExamPayload() })
      flashOk('Đã lưu phiên khám.')
    } catch (e) {
      flashErr(e?.message || 'Không lưu được.')
    } finally {
      setExamSaving(false)
    }
  }

  function openPrescriptionPrint() {
    if (!selectedAppt) return false
    const view = buildPrescriptionPrintViewFromExam({
      selectedAppt,
      vitals,
      diagnosisIcd,
      prescriptionLines,
      doctorUser: user,
    })
    const ok = printPrescription(view)
    if (!ok) flashErr('Không mở được hộp thoại in. Cho phép popup/in trên trình duyệt.')
    return ok
  }

  function flashFinishBlockers() {
    if (finishExamCheck.ok) return true
    if (!diagnosisIcd?.code) {
      setDiagnosisError('Bắt buộc chọn chẩn đoán ICD-10 (tab Thông tin khám bệnh).')
      setExamSubTab('info')
    }
    applyVitalsFinishFeedback(getVitalsFinishIssue(vitals, vitalsSkipConfirmed))
    const msg = finishExamCheck.reasons.join(' ')
    flashErr(msg || 'Chưa đủ điều kiện kết thúc khám.')
    return false
  }

  function requestFinishAndPrint() {
    if (examLocked || examSaving) return
    if (!flashFinishBlockers()) return
    if (!prescriptionHasMedicines(prescriptionLines)) {
      setEmptyRxConfirmOpen(true)
      return
    }
    void handleFinishExam({ withPrint: true })
  }

  async function handleFinishExam({ withPrint = false, skipEmptyRxConfirm = false } = {}) {
    if (!token || !selectedAppt || examLocked || examSaving) return
    const appointmentId = String(selectedAppt?.id || selectedAppt?._id || '').trim()
    if (!appointmentId) return

    if (withPrint && !skipEmptyRxConfirm && !prescriptionHasMedicines(prescriptionLines)) {
      setEmptyRxConfirmOpen(true)
      return
    }

    if (!finishExamCheck.ok) {
      const msg = finishExamCheck.reasons[0] || 'Chưa đủ điều kiện kết thúc khám.'
      if (!diagnosisIcd?.code) {
        setDiagnosisError('Bắt buộc chọn chẩn đoán ICD-10 trước khi kết thúc khám.')
      }
      applyVitalsFinishFeedback(getVitalsFinishIssue(vitals, vitalsSkipConfirmed))
      flashErr(msg)
      return
    }
    setDiagnosisError('')
    setVitalsFormError('')

    const printView = withPrint
      ? buildPrescriptionPrintViewFromExam({
          selectedAppt,
          vitals,
          diagnosisIcd,
          prescriptionLines,
          doctorUser: user,
        })
      : null

    setExamSaving(true)
    clearFlashTimer()
    setExamSaveOk('')
    setExamSaveErr('')
    try {
      await saveExamination({ token, appointmentId, payload: buildExamPayload() })

      if (withPrint && printView) {
        setAwaitingPrintLock(true)
        flashOk(
          printView.hasMedicines
            ? 'Đã lưu. Đang mở in đơn thuốc (02 bản) — sau khi in hồ sơ sẽ khóa.'
            : 'Đã lưu. Đang mở phiếu khám bệnh (02 bản) — sau khi in hồ sơ sẽ khóa.',
        )
        window.setTimeout(() => {
          const ok = printPrescription(printView, {
            onPrintInvoked: async () => {
              try {
                await finishExamAppointment({ token, appointmentId })
                await loadAppointments({ silent: true })
                flashOk(
                  printView.hasMedicines
                    ? 'Đã in đơn và kết thúc khám — hồ sơ chỉ xem.'
                    : 'Đã in phiếu khám và kết thúc — hồ sơ chỉ xem.',
                )
              } catch (e) {
                flashErr(e?.message || 'Đã in nhưng không khóa hồ sơ được. Liên hệ IT.')
              } finally {
                setAwaitingPrintLock(false)
                setExamSaving(false)
              }
            },
          })
          if (!ok) {
            setAwaitingPrintLock(false)
            setExamSaving(false)
            flashErr('Không mở được hộp thoại in. Hồ sơ chưa kết thúc — thử lại hoặc kiểm tra popup.')
          }
        }, 300)
        return
      }

      await finishExamAppointment({ token, appointmentId })
      await loadAppointments({ silent: true })
      flashOk('Đã kết thúc khám.')
    } catch (e) {
      flashErr(e?.message || 'Không kết thúc khám được.')
      setAwaitingPrintLock(false)
      setExamSaving(false)
    } finally {
      if (!withPrint) setExamSaving(false)
    }
  }

  useEffect(() => {
    setAwaitingPrintLock(false)
    setExamSaving(false)
  }, [selectedApptId])

  useEffect(() => {
    if (!token || !selectedAppt) return undefined
    const appointmentId = String(selectedAppt?.id || selectedAppt?._id || '').trim()
    if (!appointmentId) return undefined

    const d = dateKeyFromAppointmentDate(selectedAppt?.appointmentDate)
    const t = timeLabel(selectedAppt?.startTime)
    const fallbackExamAt =
      d && t
        ? `${formatDobVi(`${d}T12:00:00`)} ${t}`
        : formatDobVi(new Date()) + ` ${pad2(new Date().getHours())}:${pad2(new Date().getMinutes())}`

    const seq = ++examLoadSeqRef.current

    void (async () => {
      try {
        const data = await getExaminationByAppointment({ token, appointmentId })
        if (seq !== examLoadSeqRef.current) return
        const ex = data?.examination
        setVitals((s) => ({
          ...s,
          examAt: String(ex?.examAt || '').trim() || fallbackExamAt,
          clinicRoom: receptionClinicRoomId || String(ex?.clinicRoom || '').trim() || s.clinicRoom,
          temp: String(ex?.temp || '').trim() || '',
          breath: String(ex?.breath || '').trim() || '',
          bp: String(ex?.bp || '').trim() || '',
          pulse: String(ex?.pulse || '').trim() || '',
          height: String(ex?.height || '').trim() || '',
          weight: String(ex?.weight || '').trim() || '',
          bmi: String(ex?.bmi || '').trim() || '',
          spo2: String(ex?.spo2 || '').trim() || '',
          symptoms: String(ex?.symptoms || '').trim() || String(selectedAppt?.note || '').trim() || '',
          diagnosis: String(ex?.diagnosis || '').trim() || '',
          treatment: String(ex?.treatment || '').trim() || '',
          notes: String(ex?.notes ?? ex?.note ?? '').trim() || '',
        }))
        const icd = parseIcdFromExamination(ex)
        setDiagnosisIcd(icd ? { code: icd.code, name: icd.name } : null)
        setDiagnosisError('')
        setPrescriptionLines(normalizeRxLines(ex?.prescriptionLines, ex?.prescription))
        setVitalsSkipConfirmed(Boolean(ex?.vitalsSkipped))
        setVitalsErrors({})
        setVitalsFormError('')
      } catch {
        if (seq !== examLoadSeqRef.current) return
        setVitals((s) => ({
          ...s,
          examAt: s.examAt || fallbackExamAt,
          symptoms: String(selectedAppt?.note || '').trim() || s.symptoms,
        }))
        setDiagnosisIcd(null)
        setDiagnosisError('')
        setPrescriptionLines([emptyRxLine()])
        setVitalsSkipConfirmed(false)
        setVitalsErrors({})
        setVitalsFormError('')
      }
    })()

    return () => {
      // invalidates in-flight response
      examLoadSeqRef.current += 1
    }
  }, [token, selectedApptId, receptionClinicRoomId])

  useEffect(() => {
    setVitalsSkipConfirmed(false)
    setVitalsFormError('')
  }, [selectedApptId])

  useEffect(() => {
    if (!token || examSubTab !== 'history' || !selectedAppt) {
      setPatientHistory([])
      setHistoryErr('')
      return undefined
    }
    const patientId = String(selectedAppt?.patient?.id || selectedAppt?.patientId || '').trim()
    if (!patientId) {
      setPatientHistory([])
      setHistoryErr('Lịch này thiếu mã bệnh nhân.')
      return undefined
    }

    let cancelled = false
    setHistoryLoading(true)
    setHistoryErr('')
    void listPatientHistory({ token, patientId })
      .then((rows) => {
        if (cancelled) return
        setPatientHistory(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (cancelled) return
        setPatientHistory([])
        setHistoryErr(e?.message || 'Không tải được lịch sử.')
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, examSubTab, selectedApptId])

  useEffect(() => {
    if (!rxPickOpen) return undefined

    const q = String(medicineQuery || '').trim()
    let cancelled = false
    const delay = q.length > 0 ? 280 : 0

    const timer = setTimeout(() => {
      setMedicineSearchLoading(true)
      setMedicineSearchErr('')
      void searchMedicines({ token, q, limit: q ? 30 : 50 })
        .then((rows) => {
          if (cancelled) return
          setMedicineResults(Array.isArray(rows) ? rows : [])
        })
        .catch((e) => {
          if (cancelled) return
          setMedicineResults([])
          setMedicineSearchErr(e?.message || 'Không tải được danh mục thuốc. Kiểm tra API be_clinic đang chạy.')
        })
        .finally(() => {
          if (!cancelled) setMedicineSearchLoading(false)
        })
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [rxPickOpen, medicineQuery, token])

  function openMedicinePicker(rowIndex) {
    setRxPickRow(rowIndex)
    setMedicineQuery('')
    setMedicineResults([])
    setMedicineSearchErr('')
    setRxPickOpen(true)
  }

  function applyMedicineToRow(med) {
    const row = Number(rxPickRow)
    if (!Number.isFinite(row) || row < 0) return
    setPrescriptionLines((lines) =>
      lines.map((line, i) =>
        i === row
          ? patchRxLine(
              {
                ...line,
                medicineId: String(med?.id || '').trim(),
                medicineCode: String(med?.code || '').trim(),
                medicineName: formatMedicineLabel(med),
                medicineDisplayName: formatMedicineLabel(med),
                medicineGeneric: String(
                  med?.genericName ?? med?.activeIngredient ?? med?.hoatChat ?? med?.notes ?? '',
                ).trim(),
                medicineBrand: String(med?.brandName ?? med?.brand ?? med?.name ?? '').trim(),
                unit: String(med?.unit || '').trim(),
              },
              {},
            )
          : line,
      ),
    )
    setRxPickOpen(false)
  }

  function updateRxLine(index, patch) {
    setPrescriptionLines((lines) => lines.map((line, i) => (i === index ? patchRxLine(line, patch) : line)))
  }

  function addRxLine() {
    setPrescriptionLines((lines) => [...lines, emptyRxLine()])
  }

  function removeRxLine(index) {
    setPrescriptionLines((lines) => {
      if (lines.length <= 1) return lines
      return lines.filter((_, i) => i !== index)
    })
  }

  const selectRelativePatient = useCallback(
    (delta) => {
      const ids = filteredQueue
        .map((a) => String(a?.id || a?._id || '').trim())
        .filter(Boolean)
      if (!ids.length) return
      const cur = String(selectedApptId || '')
      let idx = ids.indexOf(cur)
      if (idx < 0) {
        const pick = delta > 0 ? 0 : ids.length - 1
        setSelectedApptId(ids[pick])
        setPage(Math.floor(pick / pageSize) + 1)
        return
      }
      const next = Math.max(0, Math.min(ids.length - 1, idx + delta))
      setSelectedApptId(ids[next])
      setPage(Math.floor(next / pageSize) + 1)
    },
    [filteredQueue, selectedApptId, pageSize],
  )

  const shortcutActionsRef = useRef({})
  shortcutActionsRef.current = {
    save: () => {
      if (!examLocked && !examSaving) void handleSaveExamination()
    },
    finishAndPrint: () => {
      if (!examLocked && !examSaving) requestFinishAndPrint()
    },
    focusSearch: () => {
      listSearchRef.current?.focus()
      listSearchRef.current?.select?.()
    },
    qr: () => {
      setQrErr('')
      setQrOpen(true)
    },
    refresh: () => {
      if (!refreshing) void loadAppointments({ silent: true })
    },
    tab: (tabId) => setExamSubTab(tabId),
    prevPatient: () => selectRelativePatient(-1),
    nextPatient: () => selectRelativePatient(1),
    escape: () => {
      if (emptyRxConfirmOpen) setEmptyRxConfirmOpen(false)
      else if (rxPickOpen) setRxPickOpen(false)
      else if (qrOpen) setQrOpen(false)
    },
    modalOpen: rxPickOpen || qrOpen || emptyRxConfirmOpen,
    canFinishExam,
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      const a = shortcutActionsRef.current
      runDoctorShortcut(
        e,
        {
          onSave: () => a.save?.(),
          onFinish: () => {
            if (!examLocked && !examSaving) a.finishAndPrint?.()
          },
          onFocusSearch: () => a.focusSearch?.(),
          onQr: () => a.qr?.(),
          onRefresh: () => a.refresh?.(),
          onTab: (tabId) => a.tab?.(tabId),
          onPrevPatient: () => a.prevPatient?.(),
          onNextPatient: () => a.nextPatient?.(),
          onEscape: () => a.escape?.(),
        },
        { modalOpen: a.modalOpen },
      )
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
      <DoctorAppHeader activeTab="exam" user={user} onLogout={logout} />

      <main className="dr-view dr-view--exam" role="main">
        {error ? (
          <div className="dr-banner dr-banner--error dr-banner--flush" role="alert">
            {error}
          </div>
        ) : null}
        <div className="dr-split">
            <aside className="dr-side" aria-label="Danh sách đăng ký">
              <div className="dr-filters">
                <div className="dr-search-filter-row">
                  <input
                    ref={listSearchRef}
                    id="doctor-list-search"
                    className="dr-list-search-input"
                    type="search"
                    value={listSearch}
                    onChange={(e) => {
                      setListSearch(e.target.value)
                      setQrListFocusTicket('')
                    }}
                    placeholder="Tìm mã, mã BN, tên…"
                    autoComplete="off"
                    enterKeyHint="search"
                    aria-label="Tìm trong danh sách đã tải"
                  />
                  <button
                    type="button"
                    className={`dr-btn dr-btn--filter-toggle${filtersOpen ? ' is-open' : ''}`}
                    aria-expanded={filtersOpen}
                    aria-controls="doctor-advanced-filters"
                    onClick={() => setFiltersOpen((o) => !o)}
                  >
                    Lọc
                  </button>
                  <button
                    type="button"
                    className="dr-btn"
                    title="Mở camera để quét mã QR lịch hẹn"
                    onClick={() => {
                      setQrErr('')
                      setQrOpen(true)
                    }}
                  >
                    Quét QR
                  </button>
                </div>
                {filtersOpen ? (
                  <div
                    id="doctor-advanced-filters"
                    className="dr-filters-advanced"
                    role="region"
                    aria-label="Lọc theo trạng thái và khoảng ngày"
                  >
                    <p className="dr-filters-advanced-hint">
                      Trạng thái và khoảng ngày lọc trong dữ liệu đã tải; ô phía trên tìm nhanh theo mã, mã BN hoặc tên.
                    </p>
                    <div className="dr-filters-body dr-filters-body--advanced">
                      <div className="dr-filter-field">
                        <label htmlFor="doctor-status-filter">Trạng thái</label>
                        <select
                          id="doctor-status-filter"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="all">Tất cả</option>
                          <option value="confirmed">Chờ khám</option>
                          <option value="examined">Đã khám</option>
                        </select>
                      </div>
                      <div className="dr-filter-field">
                        <label htmlFor="doctor-from-date">Từ ngày</label>
                        <input
                          id="doctor-from-date"
                          type="date"
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                        />
                      </div>
                      <div className="dr-filter-field">
                        <label htmlFor="doctor-to-date">Đến ngày</label>
                        <input
                          id="doctor-to-date"
                          type="date"
                          value={filterTo}
                          onChange={(e) => setFilterTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="dr-list-panel">
              <div className="dr-list-head">
                <div>
                  <h3 className="dr-list-title">Danh sách đăng ký</h3>
                  <p className="dr-list-meta">
                    {loading
                      ? 'Đang tải…'
                      : `${totalFiltered} lịch${listSearch.trim() ? ' · tìm kiếm' : ''}${refreshing ? ' · đang làm mới' : ''}`}
                  </p>
                </div>
                <div className="dr-list-head-actions">
                  <span className="dr-list-page">
                    Trang {safePage}/{pageCount}
                  </span>
                  <button
                    type="button"
                    className="dr-icon-btn"
                    title="Làm mới"
                    aria-label="Làm mới"
                    disabled={refreshing}
                    onClick={() => void loadAppointments({ silent: true })}
                  >
                    ↻
                  </button>
                </div>
              </div>

              <div className="dr-queue-wrap" role="region" aria-label="Danh sách bệnh nhân">
                {loading ? (
                  <p className="dr-queue-empty">Đang tải…</p>
                ) : pagedRows.length === 0 ? (
                  <p className="dr-queue-empty">Không có bản ghi phù hợp.</p>
                ) : (
                  <ul className="dr-queue-list">
                    {pagedRows.map((a, i) => {
                      const id = String(a?.id || a?._id || '')
                      const st = String(a?.status || '').toLowerCase()
                      const sel = selectedApptId && id === String(selectedApptId)
                      const isCancelled = st === 'cancelled'
                      const dotClass = sel
                        ? 'is-active'
                        : st === 'confirmed'
                          ? 'is-wait'
                          : st === 'cancelled'
                            ? 'is-cancelled'
                            : isAppointmentExamined(st)
                              ? 'is-examined'
                              : st === 'pending'
                                ? 'is-pending'
                                : ''
                      const dotTitle = sel ? 'Đang khám' : statusLabelVi(st)
                      const queueNo = (safePage - 1) * pageSize + i + 1
                      const tip = [
                        `STT ${queueNo}`,
                        patientLabel(a),
                        patientDemographicLine(a),
                        patientIdsLine(a),
                        st === 'confirmed' ? `Tiếp nhận: ${formatConfirmedByLine(a.confirmedBy)}` : '',
                        statusLabelVi(st),
                      ]
                        .filter(Boolean)
                        .join(' · ')
                      return (
                        <li key={id || `${i}`}>
                          <button
                            type="button"
                            className={`dr-queue-item${sel ? ' is-selected' : ''}${isCancelled ? ' is-cancelled' : ''}`}
                            onClick={() => setSelectedApptId(id)}
                            title={tip}
                            aria-current={sel ? 'true' : undefined}
                          >
                            <span className={`dr-dot ${dotClass}`} aria-hidden title={dotTitle} />
                            <span className="dr-queue-item-inner">
                              <span className="dr-queue-main">
                                <span className="dr-queue-name" title={patientLabel(a)}>
                                  {patientLabel(a)}
                                </span>
                                <span className="dr-queue-chip dr-queue-chip--demo">
                                  {patientDemographicLine(a)}
                                </span>
                                <span className="dr-queue-chip dr-queue-chip--id">{patientIdsLine(a)}</span>
                              </span>
                              <span className="dr-queue-aside">
                                <span className="dr-queue-stt" aria-label={`Số thứ tự ${queueNo}`}>
                                  STT: <strong>{pad2(queueNo)}</strong>
                                </span>
                                <span
                                  className={`dr-source-pill dr-source-pill--${appointmentSourceValue(a)}`}
                                  title={appointmentSourceTitle(a)}
                                >
                                  {appointmentSourceLabel(a)}
                                </span>
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="dr-pager">
                <span className="dr-pager-summary">
                  {totalFiltered} lịch — trang {safePage}/{pageCount}
                </span>
                <div className="dr-pager-actions">
                  <button
                    type="button"
                    className="dr-btn"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="dr-btn"
                    disabled={safePage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              </div>
              </div>
            </aside>

            <section className="dr-panel" aria-label="Khám bệnh">
              <div className="dr-panel-top">
                <div className="dr-subtabs" role="tablist">
                  {[
                    { id: 'info', label: 'Thông tin khám bệnh' },
                    { id: 'prescription', label: 'Kê đơn thuốc' },
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
                  <button
                    type="button"
                    className="dr-btn dr-btn--primary"
                    disabled={examLocked || examSaving}
                    onClick={() => void handleSaveExamination()}
                  >
                    {examSaving ? 'Đang lưu…' : 'Lưu'}
                  </button>
                  {!examLocked ? (
                    <button
                      type="button"
                      className="dr-btn dr-btn--solid"
                      disabled={examSaving}
                      title={
                        canFinishExam
                          ? 'Lưu, in 02 bản và kết thúc khám'
                          : finishDisabledTitle || 'Chưa đủ điều kiện — bấm để xem chi tiết'
                      }
                      onClick={() => requestFinishAndPrint()}
                    >
                      {examSaving ? 'Đang xử lý…' : 'Kết thúc & In'}
                    </button>
                  ) : selectedAppt && isAppointmentExamined(selectedAppt.status) ? (
                    <button
                      type="button"
                      className="dr-btn dr-btn--solid"
                      disabled={examSaving}
                      title="In lại đơn thuốc (2 bản)"
                      onClick={() => openPrescriptionPrint()}
                    >
                      In đơn
                    </button>
                  ) : null}
                </div>
                {!examLocked && !canFinishExam && finishHintsForTab.length > 0 ? (
                  <ul className="dr-finish-hint" role="status">
                    {finishHintsForTab.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {examSaveOk ? (
                <div className="dr-panel-flash dr-panel-flash--ok" role="status">
                  {examSaveOk}
                </div>
              ) : null}
              {examSaveErr ? (
                <div className="dr-panel-flash dr-panel-flash--err" role="alert">
                  {examSaveErr}
                </div>
              ) : null}

              <div
                className={`dr-panel-alert${
                  examLocked && selectedAppt ? ' dr-panel-alert--readonly' : ''
                }`}
                role="status"
              >
                {examLocked && examLockMessage ? (
                  <>
                    {examLockMessage}
                    {selectedAppt ? ` — ${patientLabel(selectedAppt)}` : ''}
                  </>
                ) : (
                  <>
                    Bạn đang khám bệnh
                    {selectedAppt ? ` — ${patientLabel(selectedAppt)}` : ''}
                  </>
                )}
              </div>

              {examSubTab === 'prescription' ? (
                <div className="dr-section">
                  <div className="dr-section-title">Đơn thuốc</div>
                  {!showRxEmptyReadonly ? (
                    <div className="dr-rx-toolbar">
                      <button type="button" className="dr-btn dr-btn--ghost" disabled={examLocked} onClick={addRxLine}>
                        + Thêm dòng
                      </button>
                    </div>
                  ) : null}
                  {showRxEmptyReadonly ? (
                    <div className="dr-rx-empty" role="status">
                      <p className="dr-rx-empty-title">Không kê thuốc</p>
                      <p className="dr-rx-empty-hint">Ca khám này chỉ có chẩn đoán — không có đơn thuốc.</p>
                    </div>
                  ) : (
                  <div className="dr-table-wrap">
                    <table className={`dr-table dr-table--rx${examLocked ? ' dr-table--rx-readonly' : ''}`}>
                      <thead>
                        <tr>
                          <th className="dr-rx-col-ix">#</th>
                          <th className="dr-rx-col-name">Hoạt chất (biệt dược)</th>
                          <th className="dr-rx-col-unit">ĐVT</th>
                          <th className="dr-rx-col-dose">Liều / lần</th>
                          <th className="dr-rx-col-freq">Tần suất</th>
                          <th className="dr-rx-col-days">Số ngày</th>
                          <th className="dr-rx-col-qty">SL</th>
                          {!examLocked ? <th className="dr-rx-col-act" aria-label="Xóa" /> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {rxDisplayLines.map((line, idx) => (
                          <tr key={idx}>
                            <td className="dr-rx-col-ix">{idx + 1}</td>
                            <td className="dr-rx-col-name">
                              {examLocked ? (
                                <span className="dr-rx-readonly-name">
                                  {line.medicineDisplayName || line.medicineName}
                                </span>
                              ) : (
                                <div className="dr-rx-name-cell">
                                  <input
                                    className="dr-input dr-input--in-table dr-input--rx-name"
                                    value={line.medicineDisplayName || line.medicineName}
                                    readOnly
                                    placeholder="Bấm Tìm để chọn"
                                    title="Chọn từ danh mục — hiển thị Hoạt chất (Biệt dược)"
                                  />
                                  <button
                                    type="button"
                                    className="dr-btn dr-btn--ghost"
                                    style={{ flexShrink: 0, padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}
                                    onClick={() => openMedicinePicker(idx)}
                                  >
                                    Tìm
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="dr-rx-col-unit">
                              <span className="dr-rx-unit" title="Lấy từ danh mục thuốc">
                                {line.unit || '—'}
                              </span>
                            </td>
                            <td className="dr-rx-col-dose">
                              {examLocked ? (
                                <span className="dr-rx-readonly-cell">
                                  {formatRxDosageLabel(line) || '—'}
                                </span>
                              ) : (
                                <div className="dr-rx-dose">
                                  <input
                                    className="dr-input dr-input--in-table"
                                    type="text"
                                    inputMode="decimal"
                                    value={line.dosageAmount}
                                    onChange={(e) =>
                                      updateRxLine(idx, {
                                        dosageAmount: sanitizeDosageAmountInput(e.target.value),
                                      })
                                    }
                                    placeholder="1"
                                    aria-label="Liều mỗi lần"
                                  />
                                  {line.unit ? (
                                    <span className="dr-rx-dose-unit">{line.unit}</span>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td className="dr-rx-col-freq">
                              {examLocked ? (
                                <span className="dr-rx-readonly-cell">
                                  {formatRxFrequencyLabel(line) || '—'}
                                </span>
                              ) : (
                                <select
                                  className="dr-input dr-input--in-table dr-rx-select"
                                  value={line.frequencyPerDay}
                                  onChange={(e) =>
                                    updateRxLine(idx, { frequencyPerDay: e.target.value })
                                  }
                                  aria-label="Tần suất"
                                >
                                  <option value="">Chọn…</option>
                                  {RX_FREQUENCY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="dr-rx-col-days">
                              {examLocked ? (
                                <span className="dr-rx-readonly-cell">
                                  {line.durationDays ? formatRxDurationLabel(line) : '—'}
                                </span>
                              ) : (
                                <input
                                  className="dr-input dr-input--in-table"
                                  type="text"
                                  inputMode="numeric"
                                  value={line.durationDays}
                                  onChange={(e) =>
                                    updateRxLine(idx, {
                                      durationDays: sanitizeDurationDaysInput(e.target.value),
                                    })
                                  }
                                  placeholder="5"
                                  aria-label="Số ngày"
                                />
                              )}
                            </td>
                            <td className="dr-rx-col-qty">
                              {examLocked ? (
                                <span className="dr-rx-readonly-cell">
                                  {line.quantity ? String(line.quantity) : '—'}
                                </span>
                              ) : (
                                <input
                                  className="dr-input dr-input--in-table"
                                  type="text"
                                  inputMode="decimal"
                                  value={line.quantity}
                                  onChange={(e) =>
                                    updateRxLine(idx, {
                                      quantity: sanitizeQuantityInput(e.target.value),
                                      quantityManual: true,
                                    })
                                  }
                                  placeholder="—"
                                  title={
                                    line.quantityManual
                                      ? 'Đã chỉnh tay — đổi liều/tần suất/ngày để tính lại tự động'
                                      : 'Tự tính: liều × tần suất × số ngày'
                                  }
                                  aria-label="Số lượng"
                                />
                              )}
                            </td>
                            {!examLocked ? (
                              <td className="dr-rx-col-act">
                                {prescriptionLines.length >= 2 ? (
                                  <button
                                    type="button"
                                    className="dr-icon-btn dr-icon-btn--danger"
                                    onClick={() => removeRxLine(idx)}
                                    aria-label="Xóa dòng"
                                  >
                                    ×
                                  </button>
                                ) : null}
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                  {!examLocked ? (
                    <p className="dr-modal-hint" style={{ marginTop: '0.5rem' }}>
                      Chọn thuốc bằng <strong>Tìm</strong> — tên in dạng <em>Hoạt chất hàm lượng (Biệt dược)</em>. Nhấn{' '}
                      <strong>Kết thúc &amp; In</strong> để lưu, in 02 bản và khóa hồ sơ.
                    </p>
                  ) : null}
                </div>
              ) : examSubTab === 'history' ? (
                <div className="dr-section">
                  <div className="dr-section-title">Lịch sử khám</div>
                  {historyLoading ? <div className="dr-placeholder">Đang tải…</div> : null}
                  {historyErr ? (
                    <div className="dr-panel-flash dr-panel-flash--err" role="alert">
                      {historyErr}
                    </div>
                  ) : null}
                  {!historyLoading && !historyErr && historyTimeline.length === 0 ? (
                    <div className="dr-placeholder">Chưa có lịch sử khám đã hoàn thành.</div>
                  ) : null}
                  {!historyLoading && historyTimeline.length > 0 ? (
                    <div className="dr-history-timeline" role="list">
                      {historyTimeline.map((h) => {
                        const ex = h?.examination
                        const diagnosis = historyDiagnosisLabel(ex)
                        const symptoms = String(ex?.symptoms || h?.note || '').trim()
                        const meds = historyMedicineNames(ex)
                        const specialty = specialtyLabelFromAppt(h)
                        const when = formatApptDateVi(h.appointmentDate)
                        const at = timeLabel(h.startTime)
                        return (
                          <article
                            key={String(h.id || h._id)}
                            className="dr-history-card"
                            role="listitem"
                          >
                            <header className="dr-history-card-head">
                              <div className="dr-history-card-when">
                                <strong>{when}</strong>
                                {at ? <span className="dr-history-card-time">{at}</span> : null}
                              </div>
                              <div className="dr-history-card-meta">
                                <span className="dr-history-card-doctor">{doctorLabelFromAppt(h)}</span>
                                {specialty ? (
                                  <span className="dr-history-card-specialty">{specialty}</span>
                                ) : null}
                              </div>
                            </header>
                            {diagnosis ? (
                              <div className="dr-history-diagnosis">
                                <span className="dr-history-label">Chẩn đoán</span>
                                <p className="dr-history-diagnosis-text">{diagnosis}</p>
                              </div>
                            ) : null}
                            {symptoms ? (
                              <div className="dr-history-symptoms">
                                <span className="dr-history-label">Triệu chứng</span>
                                <p>{symptoms}</p>
                              </div>
                            ) : null}
                            {meds.length > 0 ? (
                              <div className="dr-history-meds">
                                <span className="dr-history-label">Đơn thuốc</span>
                                <ul className="dr-history-med-badges">
                                  {meds.map((name) => (
                                    <li key={name}>
                                      <span className="dr-history-med-badge">{name}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="dr-section">
                    <div className="dr-section-title">Thông tin người đăng ký</div>
                    <div className="dr-info-grid">
                      <div className="dr-kv">
                        <span className="dr-k">Mã lịch hẹn</span>
                        <span className="dr-v">{selectedAppt?.ticket || '—'}</span>
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
                      <div className="dr-kv dr-kv--full">
                        <span className="dr-k">Địa chỉ</span>
                        <span className="dr-v">{selectedAppt?.patient?.address || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedAppt && String(selectedAppt.status || '').toLowerCase() === 'cancelled' ? (
                    <div className="dr-section dr-section--cancelled">
                      <div className="dr-section-title">Thông tin hủy lịch</div>
                      <div className="dr-info-grid">
                        <div className="dr-kv">
                          <span className="dr-k">Hủy bởi</span>
                          <span className="dr-v">{formatCancelledByLine(selectedAppt.cancelledBy)}</span>
                        </div>
                        <div className="dr-kv">
                          <span className="dr-k">Thời điểm hủy</span>
                          <span className="dr-v">{formatDateTimeVi(selectedAppt.cancelledAt)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="dr-section">
                    <div className="dr-section-title">Khám lâm sàng</div>
                    <div className="dr-info-grid dr-info-grid--tight">
                      <label className="dr-field">
                        <span className="dr-field-label">Ngày khám</span>
                        <input
                          className="dr-input"
                          value={vitals.examAt}
                          onChange={(e) => setVitals((s) => ({ ...s, examAt: e.target.value }))}
                          disabled={examLocked}
                        />
                      </label>
                      <label className="dr-field">
                        <span className="dr-field-label">Bác sĩ</span>
                        <select className="dr-input" disabled={examLocked}>
                          <option>{displayName(user)}</option>
                        </select>
                      </label>
                      <label className="dr-field">
                        <span className="dr-field-label">Phòng khám</span>
                        <input
                          className="dr-input dr-input--readonly"
                          value={receptionClinicRoomDisplay.label}
                          readOnly
                          disabled
                          title={receptionClinicRoomDisplay.hint}
                        />
                        <span className="dr-field-hint">{receptionClinicRoomDisplay.hint}</span>
                      </label>
                    </div>

                    {!examLocked ? (
                      <label className="dr-vitals-skip">
                        <input
                          type="checkbox"
                          checked={vitalsSkipConfirmed}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setVitalsSkipConfirmed(checked)
                            if (checked) {
                              setVitalsErrors({})
                              setVitalsFormError('')
                            }
                          }}
                        />
                        <span>Bỏ qua sinh hiệu (không đo lần này)</span>
                      </label>
                    ) : null}

                    {vitalsFormError ? (
                      <div className="dr-vitals-form-error" role="alert">
                        {vitalsFormError}
                      </div>
                    ) : null}

                    <div className={`dr-vitals${vitalsSkipConfirmed ? ' dr-vitals--skipped' : ''}`}>
                      {VITAL_FIELD_UI.map(({ key, label, inputMode, placeholder }) => {
                        const err = vitalsSkipConfirmed ? '' : vitalsErrors[key]
                        const rule = VITAL_RULES[key]
                        const hint =
                          rule?.type === 'bp'
                            ? `Tâm thu ${rule.min}–${rule.max} mmHg`
                            : rule
                              ? `${rule.min}–${rule.max}`
                              : ''
                        const vitalsDisabled = examLocked || vitalsSkipConfirmed
                        return (
                          <label key={key} className="dr-field">
                            <span className="dr-field-label">{label}</span>
                            <input
                              className={`dr-input${err ? ' dr-input--invalid' : ''}`}
                              type="text"
                              inputMode={inputMode || 'text'}
                              placeholder={placeholder || VITAL_PLACEHOLDER}
                              value={vitals[key]}
                              onChange={(e) => setVitalField(key, e.target.value)}
                              onBlur={() => blurVitalField(key)}
                              disabled={vitalsDisabled}
                              aria-invalid={err ? 'true' : undefined}
                              aria-disabled={vitalsDisabled ? 'true' : undefined}
                              title={hint}
                            />
                            {err ? (
                              <span className="dr-field-error" role="alert">
                                {err}
                              </span>
                            ) : null}
                          </label>
                        )
                      })}
                    </div>

                    <label className="dr-field dr-field--block">
                      <span className="dr-field-label">Triệu chứng</span>
                      <textarea
                        className="dr-textarea"
                        rows={2}
                        value={vitals.symptoms}
                        onChange={(e) => setVitals((s) => ({ ...s, symptoms: e.target.value }))}
                        disabled={examLocked}
                      />
                    </label>
                    <IcdDiagnosisField
                      token={token}
                      value={diagnosisIcd}
                      onChange={(pick) => {
                        setDiagnosisIcd(pick)
                        setDiagnosisError('')
                        setVitals((s) => ({
                          ...s,
                          diagnosis: pick ? formatIcdLabel(pick.code, pick.name) : '',
                        }))
                      }}
                      disabled={examLocked}
                      error={diagnosisError}
                    />
                    <label className="dr-field dr-field--block">
                      <span className="dr-field-label">Hướng điều trị</span>
                      <textarea
                        className="dr-textarea"
                        rows={2}
                        value={vitals.treatment}
                        onChange={(e) => setVitals((s) => ({ ...s, treatment: e.target.value }))}
                        disabled={examLocked}
                        placeholder="Theo dõi, tái khám, lời dặn…"
                      />
                    </label>
                    <label className="dr-field dr-field--block">
                      <span className="dr-field-label">Ghi chú</span>
                      <textarea
                        className="dr-textarea"
                        rows={2}
                        value={vitals.notes}
                        onChange={(e) => setVitals((s) => ({ ...s, notes: e.target.value }))}
                        disabled={examLocked}
                      />
                    </label>
                  </div>
                </>
              )}
            </section>
          </div>
      </main>

      {rxPickOpen ? (
        <div
          className="dr-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRxPickOpen(false)
          }}
        >
          <div className="dr-modal" role="dialog" aria-modal="true" aria-labelledby="dr-rx-pick-title">
            <div className="dr-modal-head">
              <h2 id="dr-rx-pick-title" className="dr-modal-title">
                Chọn thuốc
              </h2>
              <button type="button" className="dr-btn dr-btn--ghost" onClick={() => setRxPickOpen(false)}>
                Đóng
              </button>
            </div>
            <input
              className="dr-input"
              value={medicineQuery}
              onChange={(e) => setMedicineQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mã thuốc…"
              autoFocus
            />
            {medicineSearchErr ? <div className="dr-modal-err">{medicineSearchErr}</div> : null}
            <div className="dr-modal-list">
              {medicineSearchLoading ? <div className="dr-modal-empty">Đang tìm…</div> : null}
              {!medicineSearchLoading && medicineResults.length === 0 ? (
                <div className="dr-modal-empty">
                  {String(medicineQuery || '').trim()
                    ? 'Không có kết quả — thử từ khóa khác.'
                    : 'Danh mục trống hoặc chưa import thuốc vào MongoDB.'}
                </div>
              ) : null}
              {!medicineSearchLoading
                ? medicineResults.map((m) => (
                    <button
                      key={String(m.id)}
                      type="button"
                      className="dr-modal-row"
                      onClick={() => applyMedicineToRow(m)}
                    >
                      <span className="dr-modal-code">{m.code || '—'}</span>
                      <span className="dr-modal-name">{formatMedicineLabel(m)}</span>
                      <span className="dr-modal-meta">
                        {[m.strength, m.unit].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : null}

      {emptyRxConfirmOpen ? (
        <div
          className="dr-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEmptyRxConfirmOpen(false)
          }}
        >
          <div
            className="dr-modal dr-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dr-empty-rx-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dr-empty-rx-title" className="dr-modal-title">
              Đơn thuốc đang trống
            </h2>
            <p className="dr-modal-confirm-text">
              Bạn có chắc chắn kết thúc ca khám này mà không kê đơn thuốc? Hệ thống sẽ in{' '}
              <strong>phiếu khám bệnh</strong> (không có danh sách thuốc).
            </p>
            <div className="dr-modal-confirm-actions">
              <button type="button" className="dr-btn dr-btn--ghost" onClick={() => setEmptyRxConfirmOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="dr-btn dr-btn--solid"
                onClick={() => {
                  setEmptyRxConfirmOpen(false)
                  void handleFinishExam({ withPrint: true, skipEmptyRxConfirm: true })
                }}
              >
                Xác nhận (Không kê đơn)
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {qrOpen ? (
        <div
          className="dr-qr-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQrOpen(false)
          }}
        >
          <div
            className="dr-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dr-qr-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dr-qr-title" className="dr-qr-modal-title">
              Quét phiếu khám
            </h2>
            <p className="dr-qr-modal-hint">Quét mã QR trên phiếu — hệ thống tìm lịch theo mã vé (YMA…).</p>
            <div id={DR_QR_READER_ELEMENT_ID} className="dr-qr-reader-wrap" />
            {qrErr ? <div className="dr-banner dr-banner--error" style={{ marginTop: 8 }}>{qrErr}</div> : null}
            <div className="dr-qr-modal-actions">
              <button type="button" className="dr-btn dr-btn--ghost" onClick={() => setQrOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
