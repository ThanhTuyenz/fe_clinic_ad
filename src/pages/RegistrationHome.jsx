import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createAppointmentReception,
  getAvailability,
  listPatientHistoryReception,
  listPatientsReception,
  updateAppointmentStatus,
} from '../api/appointments'
import { listDoctors } from '../api/doctors.js'
import { AuthError } from '../api/apiBase.js'
import { clearStaffSession, getStaffSession, isReceptionStaff } from '../utils/staffSession.js'
import { Html5Qrcode } from 'html5-qrcode'
import '../styles/reception-home.css'
import '../styles/registration-home.css'

const QR_READER_ELEMENT_ID = 'reg-patient-qr-reader'

/** Lấy mã BN từ QR (YM…; không nhầm với mã vé YMA…). */
function patientFromQrPayload(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  try {
    const u = new URL(raw)
    for (const key of ['patientCode', 'patient', 'code', 'maBn', 'mabn']) {
      const q = u.searchParams.get(key)
      if (q) return String(q).trim().toUpperCase()
    }
  } catch {
    /* không phải URL */
  }
  const m = raw.match(/\bYM(?!A)[A-Z0-9]+\b/i)
  return (m ? m[0] : raw).trim().toUpperCase()
}

function getSession() {
  return getStaffSession()
}

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

function staffCreatorPayload(user) {
  if (!user) return null
  return {
    id: user.id || user._id || '',
    displayName: displayName(user),
    email: user.email || '',
    userType: user.userType || user.role || '',
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatDateVi(isoOrDate) {
  if (!isoOrDate) return ''
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function ageFromIsoDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  return String(Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))))
}

function isoDateFromApi(dob) {
  if (!dob) return ''
  const d = dob instanceof Date ? dob : new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  return ymd(d)
}

/** Đồng bộ gender từ API (Nam/Nữ, boolean, male/female) → draftGender */
function mapGenderToDraft(g) {
  if (g === true || g === 'true') return 'male'
  if (g === false || g === 'false') return 'female'
  const s = String(g ?? '').trim().toLowerCase()
  if (s === 'nam' || s === 'male' || s === 'm') return 'male'
  if (s === 'nữ' || s === 'nu' || s === 'female' || s === 'f') return 'female'
  return ''
}

/** Gán state form từ object patient (patient-by-code / danh sách / embed). */
function readDisplayNameFromPatient(pat) {
  if (!pat) return ''
  const dn = String(pat.displayName || '').trim()
  if (dn) return dn
  const last = String(pat.lastName || '').trim()
  const first = String(pat.firstName || '').trim()
  return `${last} ${first}`.trim() || `${first} ${last}`.trim() || ''
}

function formatDateTimeNow() {
  const d = new Date()
  return `${formatDateVi(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatDateTimeVi(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${formatDateVi(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function isoDateOnly(value) {
  const s = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return isoDateFromApi(s)
}

/** Mã dự kiến (YM…) khi tạo BN mới tại quầy — chỉ hiển thị; mã thật do CSDL gán sau khi lưu. */
function provisionalPatientCodeWalkIn(phone, displayName) {
  const seed = String(phone || '').trim() || String(displayName || '').trim()
  if (!seed) return ''
  const yy = String(new Date().getFullYear()).slice(-2)
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const pad = (h.toString(16) + '00000000').slice(0, 8).toUpperCase()
  return `YM${yy}${pad}`
}

function statusLabelVi(st) {
  const s = String(st || '').toLowerCase()
  if (s === 'confirmed') return 'Đã xác nhận'
  if (s === 'cancelled') return 'Đã hủy'
  if (s === 'completed' || s === 'done' || s === 'examined') return 'Đã khám'
  return 'Chờ'
}

function historyDoctorLabel(row) {
  const doctor = row?.doctor
  const name = String(
    doctor?.displayName ||
      [doctor?.lastName, doctor?.firstName].filter(Boolean).join(' ').trim() ||
      row?.doctorName ||
      '',
  ).trim()
  return name || '—'
}

function historySpecialtyLabel(row) {
  const name = String(row?.doctor?.specialtyName || row?.specialtyName || '').trim()
  return name || '—'
}

function historyIsExamined(row) {
  const s = String(row?.status || '').toLowerCase()
  return s === 'completed' || s === 'done' || s === 'examined'
}

/** Khớp `buildAppointmentNote` trong handleSave — để load lại từ server vẫn có triệu chứng/ghi chú. */
function parseRegistrationNote(note) {
  const lines = String(note || '').split('\n')
  let symptom = ''
  let regNote = ''
  let priority = false
  for (const line of lines) {
    const t = String(line || '')
    if (t.startsWith('Triệu chứng:')) symptom = t.replace(/^Triệu chứng:\s*/i, '').trim()
    else if (t.startsWith('Ghi chú:')) regNote = t.replace(/^Ghi chú:\s*/i, '').trim()
    else if (t.trim() === 'Ưu tiên') priority = true
  }
  return { symptom, regNote, priority }
}

export default function RegistrationHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, user } = getSession()
  const payload = location.state
  const createNew = payload?.createNew === true
  const hasPatientFromAppointment = Boolean(payload?.patient && payload?.ticket)
  const fromAppointment = !createNew && Boolean(payload?.appointmentId || payload?.ticket || hasPatientFromAppointment)

  const [symptom, setSymptom] = useState(() =>
    createNew ? '' : String(location.state?.note || '').trim(),
  )
  const [regNote, setRegNote] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [priority, setPriority] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [maKcb, setMaKcb] = useState('')
  const [todayIso] = useState(() => ymd(new Date()))
  const [registeredAt] = useState(() => formatDateTimeNow())
  /** null = chưa lưu lần nào; sau mỗi lưu thành công lưu snapshot để so sánh */
  const [lastSaved, setLastSaved] = useState(null)
  const [doctorId, setDoctorId] = useState('')
  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [doctorsErr, setDoctorsErr] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsErr, setSlotsErr] = useState('')
  const [freeSlots, setFreeSlots] = useState([])

  const [draftPatientCode, setDraftPatientCode] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftPatientId, setDraftPatientId] = useState('')
  const [draftDob, setDraftDob] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  /** '' | 'male' | 'female' — khớp User.gender boolean */
  const [draftGender, setDraftGender] = useState('')
  const [draftAddress, setDraftAddress] = useState('')
  const [lookupErr, setLookupErr] = useState('')

  const effectiveDraftPatientCode = useMemo(() => {
    const dc = String(draftPatientCode || '').trim()
    if (dc) return dc
    if (!createNew) return ''
    if (draftPatientId) return ''
    return provisionalPatientCodeWalkIn(draftPhone, draftName)
  }, [createNew, draftPatientCode, draftPatientId, draftPhone, draftName])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerErr, setPickerErr] = useState('')
  const [pickerRows, setPickerRows] = useState([])
  const [pickerTotal, setPickerTotal] = useState(0)
  const [pickerPage, setPickerPage] = useState(1)
  const [pickerPageSize, setPickerPageSize] = useState(10)
  const [pickerFilters, setPickerFilters] = useState({
    patientCode: '',
    name: '',
    phone: '',
    account: '',
  })
  const [pickerSelectedId, setPickerSelectedId] = useState('')
  const [qrOpen, setQrOpen] = useState(false)
  const [qrErr, setQrErr] = useState('')
  const qrScanDoneRef = useRef(false)
  const loadPickerRef = useRef(async () => [])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyErr, setHistoryErr] = useState('')
  const [historyRows, setHistoryRows] = useState([])

  const p = payload?.patient

  const hasUnsavedChanges = useMemo(() => {
    if (lastSaved === null) return true
    if (createNew) {
      return (
        symptom !== lastSaved.symptom ||
        regNote !== lastSaved.regNote ||
        specialtyId !== lastSaved.specialtyId ||
        priority !== lastSaved.priority ||
        doctorId !== lastSaved.doctorId ||
        appointmentDate !== lastSaved.appointmentDate ||
        startTime !== lastSaved.startTime ||
        draftPatientId !== lastSaved.draftPatientId ||
        draftPatientCode !== lastSaved.draftPatientCode ||
        draftName !== lastSaved.draftName ||
        draftDob !== lastSaved.draftDob ||
        draftPhone !== lastSaved.draftPhone ||
        draftGender !== lastSaved.draftGender ||
        draftAddress !== lastSaved.draftAddress
      )
    }
    return (
      symptom !== lastSaved.symptom ||
      regNote !== lastSaved.regNote ||
      specialtyId !== lastSaved.specialtyId ||
      priority !== lastSaved.priority ||
      doctorId !== lastSaved.doctorId ||
      appointmentDate !== lastSaved.appointmentDate ||
      startTime !== lastSaved.startTime
    )
  }, [
    lastSaved,
    createNew,
    symptom,
    regNote,
    specialtyId,
    priority,
    doctorId,
    appointmentDate,
    startTime,
    draftPatientCode,
    draftName,
    draftPatientId,
    draftDob,
    draftPhone,
    draftGender,
    draftAddress,
  ])

  const patientDisplay = useMemo(() => {
    if (p) {
      return {
        id: p.id || '',
        patientCode: p.patientCode || '—',
        displayName: p.displayName || [p.lastName, p.firstName].filter(Boolean).join(' ').trim() || '—',
        dobLabel: p.dob ? formatDateVi(p.dob) : '—',
        age:
          p.age != null && p.age !== ''
            ? String(p.age)
            : p.dob
              ? ageFromIsoDate(isoDateFromApi(p.dob)) || '—'
              : '—',
        phone: p.phone || '—',
        gender: p.gender || '—',
        address: p.address || '—',
        email: p.email || '',
      }
    }
    if (createNew) {
      const ageStr = draftDob ? ageFromIsoDate(draftDob) : ''
      const gLabel = draftGender === 'male' ? 'Nam' : draftGender === 'female' ? 'Nữ' : ''
      return {
        id: draftPatientId,
        patientCode: effectiveDraftPatientCode,
        displayName: draftName,
        dobLabel: draftDob ? formatDateVi(`${draftDob}T12:00:00`) : '',
        age: ageStr,
        phone: draftPhone,
        gender: gLabel,
        address: draftAddress,
        email: '',
      }
    }
    return null
  }, [
    p,
    createNew,
    effectiveDraftPatientCode,
    draftName,
    draftPatientId,
    draftDob,
    draftPhone,
    draftGender,
    draftAddress,
  ])

  const appointmentDoctorDisplay = useMemo(() => {
    const d = payload?.doctor
    return String(
      d?.displayName || [d?.lastName, d?.firstName].filter(Boolean).join(' ').trim() || d?.email || '',
    ).trim()
  }, [payload?.doctor])

  const appointmentSpecialtyDisplay = useMemo(() => {
    const fromPayload = String(payload?.doctor?.specialtyName || payload?.doctor?.specialty || '').trim()
    if (fromPayload) return fromPayload
    const fromDoctorList = doctors.find((d) => String(d?.id || '') === String(doctorId || ''))
    return String(fromDoctorList?.specialtyName || fromDoctorList?.specialty || '').trim()
  }, [doctorId, doctors, payload?.doctor])

  const selectedPatientId = useMemo(() => {
    return String(patientDisplay?.id || '').trim()
  }, [patientDisplay?.id])

  const examinedHistoryRows = useMemo(
    () => historyRows.filter(historyIsExamined),
    [historyRows],
  )

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (!isReceptionStaff(user)) {
      navigate('/doctor', { replace: true })
    }
  }, [token, user, navigate])

  useEffect(() => {
    if (!token || !selectedPatientId) {
      setHistoryRows([])
      setHistoryErr('')
      setHistoryLoading(false)
      return
    }
    let mounted = true
    setHistoryLoading(true)
    setHistoryErr('')
    listPatientHistoryReception({ token, patientId: selectedPatientId })
      .then((rows) => {
        if (!mounted) return
        setHistoryRows(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (!mounted) return
        setHistoryRows([])
        setHistoryErr(e?.message || 'Không lấy được lịch sử khám.')
      })
      .finally(() => {
        if (!mounted) return
        setHistoryLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [token, selectedPatientId])

  useEffect(() => {
    if (!fromAppointment) return
    const did = String(payload?.doctorId || payload?.doctor?.id || '').trim()
    const sid = String(payload?.specialtyId || payload?.doctor?.specialtyID || payload?.doctor?.specialtyId || '').trim()
    const ad = isoDateOnly(payload?.appointmentDate)
    const st = String(payload?.startTime || '').trim()
    if (sid) setSpecialtyId(sid)
    if (did) setDoctorId(did)
    if (ad) setAppointmentDate(ad)
    if (st) setStartTime(st)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAppointment, payload])

  useEffect(() => {
    let mounted = true
    setDoctorsErr('')
    setDoctorsLoading(true)
    listDoctors()
      .then((rows) => {
        if (!mounted) return
        setDoctors(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (!mounted) return
        setDoctors([])
        setDoctorsErr(e?.message || 'Không lấy được danh sách bác sĩ.')
      })
      .finally(() => {
        if (!mounted) return
        setDoctorsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const specialtyOptions = useMemo(() => {
    const byId = new Map()
    for (const d of doctors || []) {
      const sid = String(d?.specialtyID || '').trim()
      const sname = String(d?.specialtyName || '').trim()
      if (!sid) continue
      if (!byId.has(sid)) byId.set(sid, sname || sid)
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'))
  }, [doctors])

  const doctorOptions = useMemo(() => {
    return (doctors || [])
      .filter((d) => (specialtyId ? String(d?.specialtyID || '').trim() === String(specialtyId).trim() : true))
      .map((d) => {
        const name = String(
          d?.displayName || [d?.lastName, d?.firstName].filter(Boolean).join(' ').trim() || d?.email || '',
        ).trim()
        return { id: String(d?.id || ''), label: name }
      })
      .filter((x) => x.id && x.label)
  }, [doctors, specialtyId])

  useEffect(() => {
    if (!doctorId) return
    if (!doctors.length) return
    const hit = doctors.find((d) => String(d?.id) === String(doctorId))
    if (!hit) {
      setDoctorId('')
      return
    }
    const sid = String(hit?.specialtyID || '').trim()
    if (fromAppointment && !specialtyId && sid) {
      setSpecialtyId(sid)
      return
    }
    if (specialtyId && sid && sid !== String(specialtyId).trim()) {
      setDoctorId('')
    }
  }, [doctorId, doctors, fromAppointment, specialtyId])

  useEffect(() => {
    if (fromAppointment) return
    // changing doctor invalidates date/time selection
    setStartTime('')
    setFreeSlots([])
    setSlotsErr('')
    // keep appointmentDate as-is (user may want same date), but it will refetch slots
  }, [doctorId, fromAppointment])

  useEffect(() => {
    if (fromAppointment) return
    if (!token || !doctorId || !appointmentDate) return
    let mounted = true
    setSlotsErr('')
    setSlotsLoading(true)
    getAvailability({ token, doctorId, date: appointmentDate })
      .then((data) => {
        if (!mounted) return
        const slots = Array.isArray(data?.freeSlots) ? data.freeSlots : []
        setFreeSlots(slots)
        if (startTime && !slots.includes(startTime)) {
          setStartTime('')
        }
      })
      .catch((e) => {
        if (!mounted) return
        setFreeSlots([])
        setStartTime('')
        setSlotsErr(e?.message || 'Không lấy được giờ trống.')
      })
      .finally(() => {
        if (!mounted) return
        setSlotsLoading(false)
      })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, doctorId, appointmentDate])

  if (!token || !user || !isReceptionStaff(user)) {
    return null
  }

  function currentPatientSnapshot() {
    if (p) {
      return {
        id: p.id || '',
        patientCode: p.patientCode || '',
        displayName: p.displayName || [p.lastName, p.firstName].filter(Boolean).join(' ').trim() || '',
        dob: p.dob ?? null,
        age: p.age ?? null,
        phone: p.phone || '',
        gender: p.gender || '',
        address: p.address || '',
        email: p.email || '',
        ticket: payload?.ticket || '',
      }
    }
    return {
      id: draftPatientId || '',
      patientCode: effectiveDraftPatientCode || '',
      displayName: draftName || '',
      dob: draftDob ? `${draftDob}T12:00:00` : null,
      age: draftDob ? Number(ageFromIsoDate(draftDob) || 0) || null : null,
      phone: draftPhone || '',
      gender: draftGender === 'male' ? 'Nam' : draftGender === 'female' ? 'Nữ' : '',
      address: draftAddress || '',
      email: '',
      ticket: '',
    }
  }

  function makeSavedSnapshot() {
    return {
      symptom,
      regNote,
      specialtyId,
      priority,
      doctorId,
      appointmentDate,
      startTime,
      ...(createNew
        ? {
            draftPatientCode,
            draftName,
            draftPatientId,
            draftDob,
            draftPhone,
            draftGender,
            draftAddress,
          }
        : {}),
    }
  }

  function buildAppointmentNote() {
    return [
      symptom ? `Triệu chứng: ${symptom}` : '',
      regNote ? `Ghi chú: ${regNote}` : '',
      priority ? 'Ưu tiên' : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  async function handleSave() {
    if (!hasUnsavedChanges || saving) return

    if (fromAppointment) {
      if (!payload?.appointmentId) {
        setSaveMsg('')
        setLookupErr('Không có mã lịch hẹn để tạo đăng ký.')
        return
      }
    } else {
      if (!String(draftName || '').trim()) {
        setSaveMsg('')
        setLookupErr('Vui lòng nhập họ tên bệnh nhân.')
        return
      }
      if (!draftDob) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn ngày sinh.')
        return
      }
      if (!String(draftPhone || '').trim()) {
        setSaveMsg('')
        setLookupErr('Vui lòng nhập số điện thoại.')
        return
      }
      if (!specialtyId) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn chuyên khoa.')
        return
      }
      if (!doctorId) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn bác sĩ.')
        return
      }
      if (!appointmentDate) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn ngày khám.')
        return
      }
      if (!startTime) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn giờ khám còn trống.')
        return
      }
    }

    const patient = currentPatientSnapshot()
    const phoneTrim = String(patient.phone || '').trim()
    const contact = phoneTrim || ''

    setLookupErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      const data = fromAppointment
        ? await updateAppointmentStatus({
            token,
            appointmentId: payload?.appointmentId,
            status: 'confirmed',
            note: buildAppointmentNote(),
          })
        : await createAppointmentReception({
            token,
            patientEmailOrPhone: contact,
            patient,
            createdByStaff: staffCreatorPayload(user),
            doctorId,
            appointmentDate,
            startTime,
            note: buildAppointmentNote(),
          })

      const now = Date.now()
      const savedAppointment = data?.appointment || {}
      const rowId = String(savedAppointment.id || payload?.appointmentId || `LOCAL-${now.toString(36).toUpperCase()}`)
      const stamp = String(data?.ticket || maKcb || payload?.ticket || rowId)

      setMaKcb(stamp)
      setSaveMsg(
        data?.patientCreated
          ? `Đã tạo hồ sơ bệnh nhân tại quầy và lưu lịch hẹn. Mã vé: ${stamp}.`
          : `Đã lưu đăng ký. Mã lịch hẹn: ${stamp}`,
      )
      if (fromAppointment) {
        // Sau khi "Đăng ký" từ lịch hẹn (xác nhận), nhảy về Lịch hẹn và mở chi tiết theo mã vé.
        const t = String(payload?.ticket || stamp).trim()
        if (t) {
          navigate(
            '/reception',
            {
              state: {
                lookupTicket: t,
                flash: { type: 'ok', message: `Đăng ký thành công. Mã lịch hẹn: ${t}` },
              },
              replace: true,
            },
          )
          return
        }
      } else {
        // Sau khi tạo lịch tại quầy, nhảy về Lịch hẹn và mở chi tiết lịch vừa tạo.
        const t = String(stamp || '').trim()
        if (t) {
          navigate(
            '/reception',
            {
              state: {
                lookupTicket: t,
                flash: { type: 'ok', message: `Đăng ký thành công. Mã lịch hẹn: ${t}` },
              },
              replace: true,
            },
          )
          return
        }
      }
      setLastSaved(makeSavedSnapshot())
    } catch (e) {
      const msg = e?.message || 'Không lưu được đăng ký.'
      const hint =
        /Cần bệnh nhân|Không tìm thấy bệnh nhân|chọn bệnh nhân|hồ sơ bệnh nhân mới|Email trùng/i.test(msg) &&
        !draftPatientId
          ? ' Hãy chọn BN từ Danh sách, hoặc nhập SĐT đã đăng ký, hoặc điền đủ họ tên + SĐT + ngày sinh để tạo hồ sơ mới.'
          : ''
      setLookupErr(`${msg}${hint}`)
    } finally {
      setSaving(false)
    }
  }

  function openPicker() {
    if (!token) return
    setPickerOpen(true)
    setPickerErr('')
    setPickerSelectedId('')
    setPickerPage(1)
    const pc = draftPatientId ? String(draftPatientCode || '').trim() : ''
    if (pc) setPickerFilters((s) => ({ ...s, patientCode: pc }))
  }

  function closePicker() {
    setPickerOpen(false)
    setPickerErr('')
  }

  const loadPicker = useCallback(
    async ({ page, pageSize, filters }) => {
      if (!token) return []
      setPickerErr('')
      setPickerLoading(true)
      try {
        const data = await listPatientsReception({
          token,
          page,
          pageSize,
          patientCode: filters.patientCode,
          name: filters.name,
          phone: filters.phone,
          account: filters.account,
        })
        const rows = Array.isArray(data?.patients) ? data.patients : []
        setPickerRows(rows)
        setPickerTotal(Number(data?.total || 0))
        return rows
      } catch (e) {
        const msg = e?.message || 'Không lấy được danh sách bệnh nhân.'
        setPickerErr(msg)
        setPickerRows([])
        setPickerTotal(0)
        if (e instanceof AuthError) {
          navigate('/login', { replace: true, state: { message: msg } })
        }
        return []
      } finally {
        setPickerLoading(false)
      }
    },
    [token, navigate],
  )

  loadPickerRef.current = loadPicker

  useEffect(() => {
    if (!pickerOpen) return
    loadPicker({ page: pickerPage, pageSize: pickerPageSize, filters: pickerFilters })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, pickerPage, pickerPageSize, loadPicker])

  useEffect(() => {
    if (!qrOpen) return undefined
    setQrErr('')
    qrScanDoneRef.current = false
    const html5 = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false })
    const config = { fps: 10, qrbox: { width: 250, height: 250 } }

    const onScan = async (decodedText) => {
      if (qrScanDoneRef.current) return
      const code = patientFromQrPayload(decodedText)
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
      const nextFilters = { ...pickerFilters, patientCode: code }
      setPickerFilters(nextFilters)
      setPickerPage(1)
      setPickerSelectedId('')
      const rows = await loadPickerRef.current({ page: 1, pageSize: pickerPageSize, filters: nextFilters })
      if (rows.length === 1) setPickerSelectedId(String(rows[0].id))
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
  }, [qrOpen, pickerFilters, pickerPageSize])

  function startReExam(row) {
    if (fromAppointment) {
      setSaveMsg('')
      setLookupErr('Không thể tái khám khi đang xác nhận lịch hẹn có sẵn.')
      return
    }
    const did = String(row?.doctorId || row?.doctor?.id || '').trim()
    if (!did) {
      setSaveMsg('')
      setLookupErr('Lịch này chưa gắn bác sĩ, không tái khám được.')
      return
    }
    const hit = doctors.find((d) => String(d?.id) === did)
    if (!hit) {
      setSaveMsg('')
      setLookupErr('Không tìm thấy bác sĩ trong danh sách hiện tại.')
      return
    }
    const sid = String(row?.specialtyId || row?.doctor?.specialtyId || hit?.specialtyID || '').trim()
    if (sid) setSpecialtyId(sid)
    setDoctorId(did)
    setAppointmentDate('')
    setStartTime('')
    setFreeSlots([])
    setSlotsErr('')
    setLookupErr('')
    setSaveMsg('Đã chọn bác sĩ từ lịch cũ. Vui lòng chọn ngày và giờ khám.')
    setLastSaved(null)
    requestAnimationFrame(() => {
      document.getElementById('reg-section-appointment')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function applySelectedPatient(patient) {
    if (!patient) return
    setDraftPatientId(String(patient.id || patient._id || ''))
    setDraftPatientCode(String(patient.patientCode || '').trim())
    setDraftName(readDisplayNameFromPatient(patient))
    setDraftDob(patient.dob ? isoDateFromApi(patient.dob) : '')
    setDraftPhone(String(patient.phone || '').trim())
    setDraftGender(mapGenderToDraft(patient.gender))
    setDraftAddress(String(patient.address || '').trim())
    setLookupErr('')
    setSaveMsg('Đã chọn bệnh nhân từ danh sách.')
    setLastSaved(null)
  }

  function resetDraftForNew() {
    setMaKcb('')
    setSaveMsg('')
    setLookupErr('')
    setLastSaved(null)
    setDoctorId('')
    setAppointmentDate('')
    setStartTime('')
    setFreeSlots([])
    setSlotsErr('')

    if (createNew) {
      setDraftPatientId('')
      setDraftPatientCode('')
      setDraftName('')
      setDraftDob('')
      setDraftPhone('')
      setDraftGender('')
      setDraftAddress('')
    }

    setSymptom('')
    setRegNote('')
    setSpecialtyId('')
    setPriority(false)
  }

  if (!createNew && !hasPatientFromAppointment) {
    return (
      <div className="tcl-shell">
        <header className="tcl-top">
          <div className="tcl-brand">VITACARE</div>
          <nav className="tcl-nav" aria-label="Module">
            <button type="button" onClick={() => navigate('/dashboard')}>
              Thống kê
            </button>
            <button type="button" onClick={() => navigate('/reception')}>
              Lịch hẹn
            </button>
            <button type="button" className="is-active">
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
        <div className="tcl-empty">
          <p>
            Chưa có thông tin đăng ký. Vào <strong>Lịch hẹn</strong> và bấm <strong>+ Thêm</strong>, hoặc chọn lịch khám và bấm{' '}
            <strong>Tạo đăng ký</strong> để mở phiếu.
          </p>
          <div className="tcl-empty-actions">
            <button type="button" className="tcl-btn tcl-btn--pri" onClick={() => navigate('/reception')}>
              Đi tới Lịch hẹn
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tcl-shell">
      <header className="tcl-top">
        <div className="tcl-brand">VITACARE</div>
        <nav className="tcl-nav" aria-label="Module">
          <button type="button" onClick={() => navigate('/dashboard')}>
            Thống kê
          </button>
          <button type="button" onClick={() => navigate('/reception')}>
            Lịch hẹn
          </button>
          <button type="button" className="is-active">
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
        <div className="tcl-bar">
          <h1>Đăng ký khám</h1>
          <div className="tcl-bar-actions">
            <button
              type="button"
              className="tcl-btn tcl-btn--pri"
              onClick={() => {
                resetDraftForNew()
                navigate('/registration', { state: { createNew: true }, replace: true })
              }}
            >
              + Thêm
            </button>
            <button
              type="button"
              className="tcl-btn tcl-btn--pri"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              title={!hasUnsavedChanges ? 'Không có thay đổi so với bản đã lưu' : undefined}
            >
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button type="button" className="tcl-btn tcl-btn--danger" disabled title="Chưa hỗ trợ">
              Xóa
            </button>
          </div>
        </div>

        <main className="tcl-detail">
            <div className="reg-tabs">
              <button type="button" className="reg-tab is-active">
                Thông tin đăng ký
              </button>
              <button type="button" className="reg-tab" disabled>
                Thông tin phòng khám
              </button>
            </div>

            {createNew ? (
              <div className="reg-inner-banner">Bạn đang thêm mới thông tin đăng ký khám — nhập BN có sẵn hoặc thông tin người mới.</div>
            ) : (
              <div className="reg-inner-banner">Đăng ký từ lịch hẹn — thông tin bệnh nhân theo vé.</div>
            )}
            {saveMsg ? <div className="tcl-banner-ok">{saveMsg}</div> : null}
            {lookupErr ? <div className="tcl-banner-err">{lookupErr}</div> : null}

            <section className="tcl-sec">
              <h2 className="tcl-sec-title">
                <span>1</span>
                Thông tin người đăng ký
              </h2>
              <div className="tcl-grid-form">
                {p ? (
                  <>
                    <div className="tcl-f">
                      <label>Mã bệnh nhân</label>
                      <input readOnly value={patientDisplay?.patientCode || ''} title="Mã BN theo lịch hẹn, không chỉnh sửa" />
                    </div>
                    <div className="tcl-f">
                      <label>Họ tên *</label>
                      <input readOnly value={patientDisplay?.displayName || ''} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày sinh *</label>
                      <input readOnly value={patientDisplay?.dobLabel || ''} />
                    </div>
                    <div className="tcl-f">
                      <label>Độ tuổi</label>
                      <input readOnly value={patientDisplay?.age || ''} />
                    </div>
                    <div className="tcl-f">
                      <label>Điện thoại *</label>
                      <input readOnly value={patientDisplay?.phone || ''} />
                    </div>
                    <div className="tcl-f">
                      <label>Giới tính</label>
                      <input readOnly value={patientDisplay?.gender || ''} />
                    </div>
                    <div className="tcl-f">
                      <label>Tài khoản (email)</label>
                      <input readOnly value={patientDisplay?.email || ''} placeholder="—" />
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Địa chỉ</label>
                      <input readOnly value={patientDisplay?.address || ''} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tcl-f">
                      <label>Mã bệnh nhân</label>
                      <div className="reg-code-row">
                        <input
                          readOnly
                          value={effectiveDraftPatientCode}
                          placeholder="Mã bệnh nhân"
                          title="Không nhập tay mã: chọn BN trong Danh sách, hoặc điền họ tên và SĐT để xem mã dự kiến (BN mới tại quầy)."
                          autoComplete="off"
                          className="reg-patient-code-readonly"
                        />
                        <div className="reg-code-row-actions">
                          <button type="button" className="tcl-btn" onClick={openPicker}>
                            Danh sách
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="tcl-f">
                      <label>Họ tên *</label>
                      <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Họ và tên" />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày sinh *</label>
                      <input type="date" value={draftDob} onChange={(e) => setDraftDob(e.target.value)} />
                    </div>
                    <div className="tcl-f">
                      <label>Độ tuổi</label>
                      <input readOnly value={draftDob ? ageFromIsoDate(draftDob) : ''} placeholder="Tự tính từ ngày sinh" />
                    </div>
                    <div className="tcl-f">
                      <label>Điện thoại *</label>
                      <input type="tel" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} placeholder="Số điện thoại" />
                    </div>
                    <div className="tcl-f">
                      <label>Giới tính</label>
                      <select value={draftGender} onChange={(e) => setDraftGender(e.target.value)}>
                        <option value="">—</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    </div>
                    <div className="tcl-f tcl-f--full">
                      <label>Địa chỉ</label>
                      <input value={draftAddress} onChange={(e) => setDraftAddress(e.target.value)} placeholder="Địa chỉ" />
                    </div>
                  </>
                )}
              </div>
            </section>

            {pickerOpen ? (
              <div
                className="reg-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-label="Danh sách bệnh nhân"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closePicker()
                }}
              >
                <div className="reg-modal" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="reg-modal-top">
                    <div className="reg-modal-title">Danh sách bệnh nhân</div>
                    <button type="button" className="reg-modal-x" onClick={closePicker} aria-label="Đóng">
                      ×
                    </button>
                  </div>

                  <div className="reg-modal-filters">
                    <div className="reg-modal-tabs">
                      <button type="button" className="reg-modal-tab is-active">
                        Danh sách bệnh nhân
                      </button>
                      <button type="button" className="reg-modal-tab" disabled>
                        Danh sách hẹn khám
                      </button>
                    </div>
                    <div className="reg-modal-filter-row">
                      <div className="reg-modal-code-field">
                        <input
                          value={pickerFilters.patientCode}
                          onChange={(e) => setPickerFilters((s) => ({ ...s, patientCode: e.target.value }))}
                          placeholder="Mã bệnh nhân"
                        />
                        <button
                          type="button"
                          className="tcl-btn"
                          title="Mở camera để quét mã QR bệnh nhân"
                          onClick={() => {
                            setPickerErr('')
                            setQrErr('')
                            setQrOpen(true)
                          }}
                        >
                          Quét QR
                        </button>
                      </div>
                      <input
                        value={pickerFilters.name}
                        onChange={(e) => setPickerFilters((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Họ tên"
                      />
                      <input
                        value={pickerFilters.phone}
                        onChange={(e) => setPickerFilters((s) => ({ ...s, phone: e.target.value }))}
                        placeholder="Điện thoại"
                      />
                      <input
                        value={pickerFilters.account}
                        onChange={(e) => setPickerFilters((s) => ({ ...s, account: e.target.value }))}
                        placeholder="Tài khoản"
                      />
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--pri"
                        onClick={() => {
                          setPickerPage(1)
                          loadPicker({ page: 1, pageSize: pickerPageSize, filters: pickerFilters })
                        }}
                        disabled={pickerLoading}
                      >
                        {pickerLoading ? '…' : 'Tìm'}
                      </button>
                    </div>
                  </div>

                  {pickerErr ? <div className="reg-modal-err">{pickerErr}</div> : null}

                  <div className="reg-modal-table">
                    <table className="tcl-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }} />
                          <th>Mã BN</th>
                          <th>Họ tên</th>
                          <th>Điện thoại</th>
                          <th>Ngày sinh</th>
                          <th>Giới tính</th>
                          <th>Tài khoản</th>
                          <th>Email</th>
                          <th>CCCD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickerLoading ? (
                          <tr>
                            <td colSpan={9} style={{ padding: '1rem', color: '#64748b' }}>
                              Đang tải…
                            </td>
                          </tr>
                        ) : pickerRows.length ? (
                          pickerRows.map((r) => (
                            <tr
                              key={r.id}
                              className={pickerSelectedId === String(r.id) ? 'is-selected' : undefined}
                              onClick={() => setPickerSelectedId(String(r.id))}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <input
                                  type="radio"
                                  name="pickPatient"
                                  checked={pickerSelectedId === String(r.id)}
                                  onChange={() => setPickerSelectedId(String(r.id))}
                                />
                              </td>
                              <td>{r.patientCode || '—'}</td>
                              <td>{r.displayName || '—'}</td>
                              <td>{r.phone || '—'}</td>
                              <td>{r.dob ? formatDateVi(r.dob) : '—'}</td>
                              <td>{r.gender || '—'}</td>
                              <td>—</td>
                              <td>{r.email || '—'}</td>
                              <td>{r.citizenId || '—'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} style={{ padding: '1rem', color: '#94a3b8' }}>
                              Không có dữ liệu.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="reg-modal-footer">
                    <div className="reg-modal-pager">
                      <span>
                        {pickerTotal ? `${(pickerPage - 1) * pickerPageSize + 1}–${Math.min(pickerPage * pickerPageSize, pickerTotal)} của ${pickerTotal}` : `0 của 0`}
                      </span>
                      <button
                        type="button"
                        className="tcl-btn"
                        onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                        disabled={pickerLoading || pickerPage <= 1}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="tcl-btn"
                        onClick={() => {
                          const maxPage = Math.max(1, Math.ceil(pickerTotal / pickerPageSize))
                          setPickerPage((p) => Math.min(maxPage, p + 1))
                        }}
                        disabled={pickerLoading || pickerPage >= Math.max(1, Math.ceil(pickerTotal / pickerPageSize))}
                      >
                        ›
                      </button>
                      <select
                        value={pickerPageSize}
                        onChange={(e) => {
                          const next = Number(e.target.value || 10)
                          setPickerPageSize(next)
                          setPickerPage(1)
                        }}
                      >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={30}>30 / trang</option>
                      </select>
                    </div>
                    <div className="reg-modal-actions">
                      <button type="button" className="tcl-btn tcl-btn--danger" onClick={closePicker}>
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="tcl-btn tcl-btn--pri"
                        onClick={() => {
                          const chosen = pickerRows.find((x) => String(x.id) === String(pickerSelectedId))
                          if (!chosen) return
                          applySelectedPatient(chosen)
                          closePicker()
                        }}
                        disabled={!pickerSelectedId}
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

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
                  aria-labelledby="reg-patient-qr-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 id="reg-patient-qr-title" className="tcl-qr-modal-title">
                    Quét mã QR bệnh nhân
                  </h2>
                  <p className="tcl-qr-modal-hint">
                    Đưa mã QR hồ sơ bệnh nhân vào khung hình; hệ thống sẽ điền mã BN và tìm kiếm.
                  </p>
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

            <section className="tcl-sec" id="reg-section-appointment">
              <h2 className="tcl-sec-title">
                <span>2</span>
                Thông tin đăng ký
              </h2>
              <div className="tcl-grid-form">
                {fromAppointment ? (
                  <>
                    <div className="tcl-f">
                      <label>Mã lịch hẹn</label>
                      <input readOnly value={payload?.ticket || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày đặt lịch</label>
                      <input readOnly value={payload?.createdAt ? formatDateTimeVi(payload.createdAt) : '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Ngày khám</label>
                      <input readOnly value={appointmentDate ? formatDateVi(`${appointmentDate}T12:00:00`) : '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Giờ khám</label>
                      <input readOnly value={startTime || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Bác sĩ</label>
                      <input readOnly value={appointmentDoctorDisplay || '—'} />
                    </div>
                    <div className="tcl-f">
                      <label>Chuyên khoa</label>
                      <input readOnly value={appointmentSpecialtyDisplay || '—'} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tcl-f">
                      <label>Mã LH</label>
                      <input readOnly value={maKcb || ''} placeholder="Lưu để sinh mã lịch hẹn" />
                    </div>
                    <div className="tcl-f">
                      <label>Chuyên khoa</label>
                      <select
                        value={specialtyId}
                        onChange={(e) => {
                          setSpecialtyId(e.target.value)
                          setDoctorId('')
                        }}
                        disabled={doctorsLoading}
                        title={doctorsErr || undefined}
                      >
                        <option value="">{doctorsLoading ? 'Đang tải…' : '— Chọn chuyên khoa —'}</option>
                        {specialtyOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="tcl-f">
                      <label>Bác sĩ</label>
                      <select
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        disabled={doctorsLoading || !specialtyId}
                        title={doctorsErr || undefined}
                      >
                        <option value="">
                          {doctorsLoading
                            ? 'Đang tải…'
                            : specialtyId
                              ? '— Chọn bác sĩ —'
                              : 'Chọn chuyên khoa trước'}
                        </option>
                        {doctorOptions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="tcl-f">
                      <label>Ngày khám</label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => {
                          setAppointmentDate(e.target.value)
                          setStartTime('')
                          setSlotsErr('')
                        }}
                        min={todayIso}
                        disabled={!doctorId}
                        title={!doctorId ? 'Chọn bác sĩ trước' : undefined}
                      />
                    </div>
                    <div className="tcl-f">
                      <label>Giờ khám (trống)</label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={!doctorId || !appointmentDate || slotsLoading || !freeSlots.length}
                        title={
                          slotsErr ||
                          (!doctorId
                            ? 'Chọn bác sĩ trước'
                            : !appointmentDate
                              ? 'Chọn ngày khám trước'
                              : undefined)
                        }
                      >
                        <option value="">
                          {slotsLoading
                            ? 'Đang tải giờ…'
                            : slotsErr
                              ? 'Không lấy được giờ'
                              : !doctorId || !appointmentDate
                                ? 'Chọn bác sĩ + ngày trước'
                                : freeSlots.length
                                  ? '— Chọn giờ —'
                                  : 'Không còn giờ trống'}
                        </option>
                        {freeSlots.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="tcl-f">
                      <label>Ngày đăng ký</label>
                      <input readOnly value={registeredAt} />
                    </div>
                  </>
                )}
                <div className="tcl-f tcl-f--full">
                  <label>Triệu chứng</label>
                  <textarea rows={2} value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="VD: Đau bụng" />
                </div>
                <div className="tcl-f tcl-f--full">
                  <label>Ghi chú</label>
                  <textarea rows={2} value={regNote} onChange={(e) => setRegNote(e.target.value)} placeholder="Ghi chú thêm" />
                </div>
              </div>
            </section>

            <section className="tcl-sec">
              <h2 className="tcl-sec-title">
                <span>3</span>
                Thông tin lịch sử khám
              </h2>
              <div className="reg-history-wrap">
                <table className="reg-history-table">
                  <thead>
                    <tr>
                      <th>Trạng thái</th>
                      <th>Mã LH</th>
                      <th>Ngày đăng ký</th>
                      <th>Bác sĩ</th>
                      <th>Chuyên khoa</th>
                      <th style={{ width: 96 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {examinedHistoryRows.map((r) => {
                      const canReExam =
                        !fromAppointment &&
                        historyIsExamined(r) &&
                        Boolean(String(r?.doctorId || r?.doctor?.id || '').trim())
                      return (
                        <tr key={r.id}>
                          <td>{statusLabelVi(r.status)}</td>
                          <td>{r.ticket || '—'}</td>
                          <td>{r.createdAt ? formatDateTimeVi(r.createdAt) : '—'}</td>
                          <td>{historyDoctorLabel(r)}</td>
                          <td>{historySpecialtyLabel(r)}</td>
                          <td>
                            {canReExam ? (
                              <button
                                type="button"
                                className="tcl-btn tcl-btn--pri reg-history-reexam-btn"
                                onClick={() => startReExam(r)}
                                disabled={doctorsLoading}
                                title="Điền bác sĩ và chọn ngày, giờ khám mới"
                              >
                                Tái khám
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {historyLoading ? <div className="reg-history-empty">Đang tải lịch sử...</div> : null}
                {historyErr ? <div className="reg-history-empty is-error">{historyErr}</div> : null}
                {!historyLoading && !historyErr && !examinedHistoryRows.length ? (
                  <div className="reg-history-empty">
                    {selectedPatientId ? 'Chưa có lịch sử khám.' : 'Chọn bệnh nhân có sẵn để xem lịch sử khám.'}
                  </div>
                ) : null}
              </div>
            </section>

            <div className="tcl-detail-foot">
              <button type="button" className="tcl-btn" onClick={() => navigate('/reception')}>
                ← Quay lại Lịch hẹn
              </button>
            </div>
        </main>
      </div>
    </div>
  )
}
