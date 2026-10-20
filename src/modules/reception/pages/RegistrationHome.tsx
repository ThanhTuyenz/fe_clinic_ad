'use client'

import { CLINIC_SESSIONS, clinicPeriod } from '@/common/constants/clinic-sessions'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RoleSidebar, { StaffMobileHeader } from '@/modules/portal/components/RoleSidebar'
import { useLocation, useNavigate } from '@/common/hooks/useNextNavigation'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import {
  createAppointmentReception,
  getAvailability,
  listPatientHistoryReception,
  listPatientsReception,
  lookupPatientByCode,
  updateAppointmentStatus,
} from '@/modules/admin/services/appointments'
import { listSpecialties, listSpecialtyServices } from '@/modules/admin/services/specialties'
import { getStaffSession, isReceptionStaff } from '@/modules/admin/utils/staffSession'
import { decodeQrFromImageFile } from '@/modules/admin/utils/imageQrDecoder'
import ReceptionQrScannerModal from '../components/ReceptionQrScannerModal'
import {
  CheckCircle2,
  ChevronLeft,
  X,
  Plus,
  QrCode,
  Search,
  ChevronLeftIcon,
} from 'lucide-react'


import {
  parseCccdQr,
  patientFromQrPayload,
  displayName,
  todayIsoDate,
  clampIsoDateMaxToday,
  isIsoDateNotBeforeToday,
  formatDateVi,
  formatDayOfWeekVi,
  formatSlotRange,
  ageFromIsoDate,
  isoDateFromApi,
  mapGenderToDraft,
  readDisplayNameFromPatient,
  patientDobFromRow,
  genderLabelFromRow,
  formatDateTimeVi,
  isoDateOnly,
  statusLabelVi,
  historyDoctorLabel,
  historySpecialtyLabel,
  historyServicePackageLabel,
  historyIsExamined,
} from '../components/registrationHelpers'
import RegistrationPatientPickerModal from '../components/RegistrationPatientPickerModal'

type ReceptionSlotOption = {
  id: string; startTime: string; endTime: string; branchId: string; branchName: string;
  doctorId: string; doctorName: string; academicRank?: string; roomName?: string;
};

export default function RegistrationHome() {
  const { performLogout } = useStaffLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const { token, user } = getStaffSession()
  const payload = location.state
  const [isFreshNew, setIsFreshNew] = useState(false)
  const createNew = isFreshNew || payload?.createNew === true || !payload?.appointmentId
  const hasPatientFromAppointment = !isFreshNew && Boolean(payload?.patient && payload?.ticket)
  const fromAppointment = !isFreshNew && !createNew && Boolean(payload?.appointmentId || payload?.ticket || hasPatientFromAppointment)
  const p = fromAppointment ? payload?.patient : null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [specialtyId, setSpecialtyId] = useState('')
  const [specialties, setSpecialties] = useState<any[]>([])
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false)
  const [servicePackageId, setServicePackageId] = useState('')
  const [servicePackages, setServicePackages] = useState<any[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [maKcb, setMaKcb] = useState('')
  const todayIso = todayIsoDate()
  const [lastSaved, setLastSaved] = useState<any>(null)
  const [doctorId, setDoctorId] = useState('')
  const [doctors, setDoctors] = useState<any[]>([])

  /** Ngày khám: Có thể chỉnh sửa tự do, mặc định hôm nay */
  const [appointmentDate, setAppointmentDate] = useState(() => (createNew ? todayIsoDate() : ''))
  const [availableWorkDates, setAvailableWorkDates] = useState<string[]>([])

  const [startTime, setStartTime] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsErr, setSlotsErr] = useState('')
  const [freeSlots, setFreeSlots] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<ReceptionSlotOption[]>([])
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState('')
  const selectedReceptionSlot = availableSlots.find(slot => slot.id === selectedScheduleSlotId && slot.startTime === startTime && slot.doctorId === doctorId)
  const selectedService = servicePackages.find(pkg => String(pkg.id) === servicePackageId)
  const [bookingMode, setBookingMode] = useState<'new' | 're_exam'>('new')
  const [reExamDoctorId, setReExamDoctorId] = useState('')
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')

  const [draftPatientCode, setDraftPatientCode] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftPatientId, setDraftPatientId] = useState('')
  const [draftDob, setDraftDob] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftGender, setDraftGender] = useState('')
  const [draftAddress, setDraftAddress] = useState('')
  const [draftNationalId, setDraftNationalId] = useState('')
  const [lookupErr, setLookupErr] = useState('')

  // Trạng thái tra cứu tự động điền và quét QR
  const [lookupKeyword, setLookupKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [lookupSuccessMsg, setLookupSuccessMsg] = useState('')
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [qrScanErr, setQrScanErr] = useState('')
  const [qrImageLoading, setQrImageLoading] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const effectiveDraftPatientCode = useMemo(() => {
    return String(draftPatientCode || '').trim()
  }, [draftPatientCode])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerErr, setPickerErr] = useState('')
  const [pickerRows, setPickerRows] = useState<any[]>([])
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
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyErr, setHistoryErr] = useState('')
  const [historyRows, setHistoryRows] = useState<any[]>([])

  const hasUnsavedChanges = useMemo(() => {
    if (lastSaved === null) return true
    if (createNew) {
      return (
        specialtyId !== lastSaved.specialtyId ||
        servicePackageId !== lastSaved.servicePackageId ||
        selectedScheduleSlotId !== lastSaved.selectedScheduleSlotId ||
        doctorId !== lastSaved.doctorId ||
        appointmentDate !== lastSaved.appointmentDate ||
        startTime !== lastSaved.startTime ||
        draftPatientId !== lastSaved.draftPatientId ||
        draftPatientCode !== lastSaved.draftPatientCode ||
        draftNationalId !== lastSaved.draftNationalId ||
        draftName !== lastSaved.draftName ||
        draftDob !== lastSaved.draftDob ||
        draftPhone !== lastSaved.draftPhone ||
        draftGender !== lastSaved.draftGender ||
        draftAddress !== lastSaved.draftAddress
      )
    }
    return (
      specialtyId !== lastSaved.specialtyId ||
      doctorId !== lastSaved.doctorId ||
      appointmentDate !== lastSaved.appointmentDate ||
      startTime !== lastSaved.startTime
    )
  }, [
    lastSaved,
    createNew,
    specialtyId,
    servicePackageId,
    selectedScheduleSlotId,
    doctorId,
    appointmentDate,
    startTime,
    draftPatientCode,
    draftNationalId,
    draftName,
    draftPatientId,
    draftDob,
    draftPhone,
    draftGender,
    draftAddress,
  ])

  const patientDisplay = useMemo(() => {
    if (p) {
      const dob = patientDobFromRow(p)
      return {
        id: p.id || '',
        patientCode: p.patientCode || p.nationalId || '—',
        nationalId: p.nationalId || '—',
        displayName: readDisplayNameFromPatient(p) || p.displayName || [p.lastName, p.firstName].filter(Boolean).join(' ').trim() || '—',
        dobLabel: dob ? formatDateVi(dob) : p.dob ? formatDateVi(p.dob) : '—',
        age:
          p.age != null && p.age !== ''
            ? String(p.age)
            : dob
              ? ageFromIsoDate(isoDateFromApi(dob)) || '—'
              : p.dob
                ? ageFromIsoDate(isoDateFromApi(p.dob)) || '—'
                : '—',
        phone: p.phone || p.phoneNumber || '—',
        gender: genderLabelFromRow(p.gender) || p.gender || '—',
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
        nationalId: draftNationalId,
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
    draftNationalId,
    draftName,
    draftPatientId,
    draftDob,
    draftPhone,
    draftGender,
    draftAddress,
  ])


  const appointmentSpecialtyDisplay = useMemo(() => {
    const fromPayload = String(payload?.doctor?.specialtyName || payload?.doctor?.specialty || '').trim()
    if (fromPayload) return fromPayload
    const fromSpecialtiesList = specialties.find((s) => String(s?.id) === String(specialtyId))
    if (fromSpecialtiesList?.name) return fromSpecialtiesList.name
    const fromDoctorList = doctors.find((d) => String(d?.id || '') === String(doctorId || ''))
    return String(fromDoctorList?.specialtyName || fromDoctorList?.specialty || '').trim()
  }, [doctorId, doctors, specialties, specialtyId, payload?.doctor])

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

  // Tải Lịch sử khám bệnh nhân
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
      .catch((e: any) => {
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

  // Tải danh sách Chuyên khoa trực tiếp từ API /specialties
  useEffect(() => {
    let mounted = true
    setSpecialtiesLoading(true)
    listSpecialties()
      .then((rows) => {
        if (!mounted) return
        setSpecialties(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        // Fallback: nếu lỗi API /specialties, sẽ trích xuất chuyên khoa từ danh sách bác sĩ
      })
      .finally(() => {
        if (!mounted) return
        setSpecialtiesLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Tải danh sách Dịch vụ / Gói khám theo Chuyên khoa
  useEffect(() => {
    if (!specialtyId) {
      setServicePackages([])
      setServicePackageId('')
      setServicesLoading(false)
      return
    }
    let mounted = true
    setServicesLoading(true)
    listSpecialtyServices(specialtyId)
      .then((rows) => {
        if (!mounted) return
        const services = (Array.isArray(rows) ? rows : []).filter(pkg => pkg.bookingMethod?.code === 'SPECIALTY_EXAM' && Number(pkg.specialtyId) === Number(specialtyId))
        setServicePackages(services)
        setServicePackageId(current => services.some(pkg => String(pkg.id) === current) ? current : '')
      })
      .catch(() => {
        if (!mounted) return
        setServicePackages([])
      })
      .finally(() => {
        if (!mounted) return
        setServicesLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [specialtyId])

  const specialtyOptions = useMemo(() => {
    return specialties.map((s) => ({
      id: String(s.id),
      name: s.name,
    }))
  }, [specialties])

  // Chọn dịch vụ, ngày và giờ trước khi chọn bác sĩ.
  useEffect(() => {
    if (fromAppointment) return;
    if (!specialtyId || !servicePackageId || !appointmentDate) {
      setFreeSlots([]); setAvailableSlots([]); setAvailableWorkDates([]);
      setSlotsLoading(false);
      setSelectedScheduleSlotId('');
      return;
    }
    let mounted = true;
    setSlotsLoading(true); setSlotsErr(''); setFreeSlots([]); setAvailableSlots([]);
    getAvailability({ date: appointmentDate, specialtyId, servicePackageId, doctorId: bookingMode === 're_exam' ? reExamDoctorId || undefined : undefined })
      .then((res: any) => {
        if (!mounted) return;
        const slots: ReceptionSlotOption[] = Array.isArray(res?.slots) ? res.slots : [];
        setAvailableSlots(slots);
        setFreeSlots([...new Set(slots.map(slot => slot.startTime))].sort());
        setAvailableWorkDates(Array.isArray(res?.availableDates) ? res.availableDates : []);
        setDoctors(slots.map(slot => ({ id: slot.doctorId, fullName: slot.doctorName })));
        setSelectedScheduleSlotId(current => slots.some(slot => slot.id === current) ? current : '');
      })
      .catch((error: any) => {
        if (!mounted) return;
        setFreeSlots([]); setAvailableSlots([]); setAvailableWorkDates([]);
        setSlotsErr(error?.message || 'Không lấy được khung giờ của dịch vụ.');
      })
      .finally(() => { if (mounted) setSlotsLoading(false); });
    return () => { mounted = false; };
  }, [specialtyId, servicePackageId, appointmentDate, fromAppointment, bookingMode, reExamDoctorId]);

  const slotsBySession = useMemo(() => CLINIC_SESSIONS.map((session) => ({
    ...session, slots: freeSlots.filter((slot) => clinicPeriod(slot) === session.code),
  })), [freeSlots])

  useEffect(() => {
    if (!fromAppointment) return
    const did = String(payload?.doctorId || payload?.doctor?.id || '').trim()
    const sid = String(payload?.specialtyId || payload?.specialty?.id || payload?.doctor?.specialtyID || payload?.doctor?.specialtyId || '').trim()
    const ad = isoDateOnly(payload?.appointmentDate)
    const st = String(payload?.startTime || '').trim()
    if (sid) setSpecialtyId(sid)
    if (payload?.servicePackage?.id) setServicePackageId(String(payload.servicePackage.id))
    if (did) setDoctorId(did)
    if (ad) setAppointmentDate(ad)
    if (st) setStartTime(st)
  }, [fromAppointment, payload])

  function handleDraftDobChange(val: string) {
    const clamped = clampIsoDateMaxToday(val)
    setDraftDob(clamped)
  }

  function handleAppointmentDateChange(val: string) {
    const today = todayIsoDate()
    const safeDate = val && val < today ? today : val
    setAppointmentDate(safeDate)
    setStartTime('')
    setDoctorId('')
    setSelectedScheduleSlotId('')
  }

  function handleSpecialtyChange(val: string) {
    setSpecialtyId(val)
    setSelectedScheduleSlotId('')
    setAvailableSlots([])
    setServicePackageId('')
    setDoctorId('')
    setStartTime('')
    setFreeSlots([])
  }

  function handleServiceChange(value: string) {
    setServicePackageId(value)
    setStartTime('')
    setDoctorId('')
    setSelectedScheduleSlotId('')
    setAvailableSlots([])
    setFreeSlots([])
  }

  function handleTimeChange(value: string) {
    setStartTime(value)
    setDoctorId('')
    setSelectedScheduleSlotId('')
  }

  function handleDoctorSlotChange(value: string) {
    const slot = availableSlots.find(item => item.id === value && item.startTime === startTime)
    setSelectedScheduleSlotId(slot?.id || '')
    setDoctorId(slot?.doctorId || '')
  }

  function currentPatientSnapshot() {
    if (p) {
      return {
        id: p.id,
        patientCode: p.patientCode,
        nationalId: p.nationalId,
        fullName: p.fullName || p.name || p.displayName,
        displayName: p.displayName || p.fullName || p.name,
        dob: p.dob || p.dateOfBirth,
        dateOfBirth: p.dateOfBirth || p.dob,
        phone: p.phone || p.phoneNumber,
        phoneNumber: p.phoneNumber || p.phone,
        gender: p.gender,
        address: p.address,
      }
    }
    return {
      id: draftPatientId || undefined,
      patientCode: draftPatientCode || undefined,
      nationalId: draftNationalId.trim() || undefined,
      fullName: draftName.trim(),
      displayName: draftName.trim(),
      dob: draftDob || undefined,
      dateOfBirth: draftDob || undefined,
      phone: draftPhone.trim(),
      phoneNumber: draftPhone.trim(),
      gender: draftGender || undefined,
      address: draftAddress.trim(),
    }
  }

  function buildAppointmentNote() {
    const parts = []
    if (servicePackageId) {
      const selectedPkg = servicePackages.find((pkg) => String(pkg.id) === String(servicePackageId))
      if (selectedPkg) parts.push(`Dịch vụ khám: ${selectedPkg.name}`)
    }
    return parts.join('\n')
  }

  function makeSavedSnapshot() {
    return {
      specialtyId,
      servicePackageId,
      selectedScheduleSlotId,
      doctorId,
      appointmentDate,
      startTime,
      draftPatientId,
      draftPatientCode,
      draftNationalId,
      draftName,
      draftDob,
      draftPhone,
      draftGender,
      draftAddress,
    }
  }

  async function handleSave() {
    if (createNew) {
      if (!draftName.trim()) {
        setSaveMsg('')
        setLookupErr('Vui lòng nhập họ tên bệnh nhân.')
        return
      }
      if (!draftDob) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn ngày sinh.')
        return
      }
      if (!draftPhone.trim()) {
        setSaveMsg('')
        setLookupErr('Vui lòng nhập số điện thoại.')
        return
      }
      if (!specialtyId) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn chuyên khoa khám.')
        return
      }
      if (!servicePackageId || !selectedService) {
        setLookupErr('Vui lòng chọn dịch vụ thuộc chuyên khoa khám.')
        return
      }
      if (!doctorId) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn bác sĩ phụ trách.')
        return
      }
      if (!appointmentDate) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn ngày khám.')
        return
      }
      if (!isIsoDateNotBeforeToday(appointmentDate)) {
        setSaveMsg('')
        setLookupErr('Ngày khám phải là hôm nay hoặc ngày trong tương lai.')
        return
      }
      if (!selectedReceptionSlot || slotsLoading) {
        setLookupErr('Vui lòng chọn khung giờ và bác sĩ còn chỗ của dịch vụ.')
        return
      }
      if (!startTime) {
        setSaveMsg('')
        setLookupErr('Vui lòng chọn khung giờ khám còn trống.')
        return
      }
    }

    const patient = currentPatientSnapshot()
    const phoneTrim = String(patient.phone || '').trim()

    setLookupErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      const data = fromAppointment
        ? await updateAppointmentStatus({
          token,
          appointmentId: payload?.appointmentId,
          status: 'pending',
          note: buildAppointmentNote(),
        })
        : await createAppointmentReception({
          token,
          patientEmailOrPhone: phoneTrim,
          patient,
          specialtyId,
          servicePackageId,
          doctorId,
          scheduleSlotId: selectedReceptionSlot?.id,
          branchId: selectedReceptionSlot?.branchId,
          appointmentDate,
          startTime,
          note: buildAppointmentNote(),
        })

      const now = Date.now()
      const savedAppointment = data?.appointment || {}
      const rowId = String(savedAppointment.id || payload?.appointmentId || `LOCAL-${now.toString(36).toUpperCase()}`)
      const stamp = String(savedAppointment.ticket || savedAppointment.bookingCode || data?.ticket || maKcb || payload?.ticket || rowId)

      setMaKcb(stamp)
      setSaveMsg('Đăng ký khám thành công!')

      const t = String(payload?.ticket || stamp).trim()
      if (t) {
        navigate('/reception', {
          state: {
            lookupTicket: t,
            flash: {
              type: 'ok',
              message: `Đăng ký thành công. Vui lòng thu phí và xác nhận tại Lịch hẹn. Mã vé: ${t}`,
            },
          },
          replace: true,
        })
        return
      }
      setLastSaved(makeSavedSnapshot())
    } catch (e: any) {
      const msg = e?.message || 'Không lưu được đăng ký.'
      setLookupErr(msg)
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
    async ({ page, pageSize, filters }: any) => {
      if (!token) return []
      setPickerErr('')
      setPickerLoading(true)
      try {
        const data = await listPatientsReception({
          token,
          page,
          pageSize,
          ...filters,
        })
        setPickerRows(Array.isArray(data?.rows) ? data.rows : [])
        setPickerTotal(Number(data?.total || 0))
      } catch (e: any) {
        setPickerRows([])
        setPickerTotal(0)
        setPickerErr(e?.message || 'Không tải được danh sách bệnh nhân.')
      } finally {
        setPickerLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (pickerOpen) {
      loadPicker({ page: pickerPage, pageSize: pickerPageSize, filters: pickerFilters })
    }
  }, [pickerOpen, pickerPage, pickerPageSize, loadPicker])

  function applySelectedPatient(patient: any) {
    if (!patient) return
    setDraftPatientId(String(patient.id || patient._id || ''))
    setDraftPatientCode(String(patient.patientCode || patient.nationalId || '').trim())
    setDraftName(readDisplayNameFromPatient(patient) || patient.fullName || '')
    const rawDob = patientDobFromRow(patient) || patient.dob || patient.dateOfBirth
    setDraftDob(rawDob ? (typeof rawDob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDob) ? rawDob : isoDateFromApi(rawDob)) : '')
    setDraftPhone(String(patient.phone || patient.phoneNumber || '').trim())
    setDraftGender(mapGenderToDraft(patient.gender))
    setDraftAddress(String(patient.address || '').trim())
    setDraftNationalId(String(patient.nationalId || '').trim())
    setLookupErr('')
    setBookingMode('new')
    setSelectedHistoryId('')
    setLastSaved(null)
  }

  function resetDraftForNew() {
    setSpecialtyId('')
    setServicePackageId('')
    setSelectedScheduleSlotId('')
    setReExamDoctorId('')
    setAvailableSlots([])
    setMaKcb('')
    setSaveMsg('')
    setLookupErr('')
    setLastSaved(null)
    setDoctorId('')
    setAppointmentDate(todayIsoDate())
    setStartTime('')
    setFreeSlots([])
    setSlotsErr('')
    setBookingMode('new')
    setSelectedHistoryId('')

    setDraftPatientId('')
    setDraftPatientCode('')
    setDraftName('')
    setDraftDob('')
    setDraftPhone('')
    setDraftGender('')
    setDraftAddress('')
    setDraftNationalId('')
    setLookupKeyword('')
    setLookupSuccessMsg('')
    setLookupErr('')

    setSpecialtyId('')
  }

  function handleClearPatientData() {
    setDraftPatientId('')
    setDraftPatientCode('')
    setDraftName('')
    setDraftDob('')
    setDraftPhone('')
    setDraftGender('')
    setDraftAddress('')
    setDraftNationalId('')
    setLookupKeyword('')
    setSearchResults([])
    setSearchOpen(false)
    setLookupSuccessMsg('')
  }

  // Tự động tìm kiếm gợi ý hồ sơ bệnh nhân khi người dùng gõ
  useEffect(() => {
    const q = lookupKeyword.trim()
    if (!q || q.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      setSearchOpen(false)
      return
    }

    let active = true
    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await listPatientsReception({ q, pageSize: 6 })
        if (!active) return
        const patients = res?.patients || res?.rows || []
        setSearchResults(patients)
        setSearchOpen(true)
      } catch {
        if (!active) return
        setSearchResults([])
      } finally {
        if (active) setSearchLoading(false)
      }
    }, 280)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [lookupKeyword])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectPatient(pat: any) {
    applySelectedPatient(pat)
    setLookupKeyword('')
    setSearchOpen(false)
    setSearchResults([])
    const name = readDisplayNameFromPatient(pat) || pat.fullName || ''
    const code = pat.patientCode || ''
    setLookupSuccessMsg(`Đã chọn bệnh nhân: ${name}${code ? ` (${code})` : ''}`)
  }

  const handleQrDecoded = useCallback(async (decodedText: string) => {
    setQrScanOpen(false)
    const clean = String(decodedText || '').trim()
    if (!clean) return

    // 1. Nhận diện QR thẻ Căn cước công dân gắn chip (chứa dấu |)
    const cccd = parseCccdQr(clean)
    if (cccd) {
      if (cccd.fullName) setDraftName(cccd.fullName)
      if (cccd.dob) setDraftDob(clampIsoDateMaxToday(cccd.dob))
      if (cccd.gender) setDraftGender(cccd.gender)
      if (cccd.address) setDraftAddress(cccd.address)
      if (cccd.nationalId) setDraftNationalId(cccd.nationalId)

      // Kiểm tra xem CCCD này đã có hồ sơ trong DB chưa
      try {
        const res = await lookupPatientByCode({ code: cccd.nationalId })
        if (res?.patient) {
          applySelectedPatient(res.patient)
          setLookupSuccessMsg(`Đã quét CCCD và nạp hồ sơ: ${readDisplayNameFromPatient(res.patient)} (CCCD: ${cccd.nationalId})`)
          return
        }
      } catch {
        // Chưa có hồ sơ => Bệnh nhân mới với thông tin CCCD đã điền
        setLookupSuccessMsg(`Đã nhận diện thẻ CCCD: ${cccd.fullName}. Vui lòng nhập thêm Số điện thoại.`)
      }
      return
    }

    // 2. Nhận diện QR mã bệnh nhân hoặc URL
    const pCode = patientFromQrPayload(clean) || clean
    try {
      const res = await lookupPatientByCode({ code: pCode })
      if (res?.patient) {
        handleSelectPatient(res.patient)
        return
      }
    } catch {
      setLookupSuccessMsg(`Đã quét mã: "${pCode}". Vui lòng kiểm tra thông tin.`)
    }
  }, [])

  const handleQrFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrImageLoading(true)
    setQrScanErr('')
    try {
      const decodedText = await decodeQrFromImageFile(file)
      await handleQrDecoded(decodedText)
    } catch {
      setQrScanErr('Không thể đọc mã QR từ ảnh này. Vui lòng thử ảnh rõ nét hơn.')
    } finally {
      setQrImageLoading(false)
      e.target.value = ''
    }
  }, [handleQrDecoded])

  function startReExam(row: any) {
    if (fromAppointment) {
      setSaveMsg('')
      setLookupErr('Không thể tái khám khi đang xác nhận lịch hẹn có sẵn.')
      return
    }

    // 1. Luôn cập nhật trạng thái chọn dòng TRƯỚC TIÊN để UI radio check và highlight tức thì
    setSelectedHistoryId(String(row.id))
    setBookingMode('re_exam')
    setLookupErr('')

    const did = String(row?.doctorId || row?.doctor?.id || '').trim()
    const dName = historyDoctorLabel(row)
    const sid = String(row?.specialtyId || row?.doctor?.specialtyId || row?.specialty?.id || '').trim()
    const sName = historySpecialtyLabel(row)
    const pkgId = String(row?.servicePackage?.id || row?.servicePackageId || '').trim()

    // 2. Kế thừa Chuyên khoa
    if (sid) {
      setSpecialtyId(sid)
    }

    // 3. Kế thừa Gói khám nếu có
    setServicePackageId(pkgId)
    setSelectedScheduleSlotId('')

    // Tái khám giữ bác sĩ điều trị; vẫn chọn khung giờ trước khi xác nhận bác sĩ.
    setReExamDoctorId(did)
    setDoctorId('')

    // 5. Khởi tạo ngày khám hôm nay và sẵn sàng chọn khung giờ
    setAppointmentDate(todayIsoDate())
    setStartTime('')
    setFreeSlots([])
    setSlotsErr('')
    setSaveMsg(`Đã chọn tái khám cùng ${dName} (${sName}). Vui lòng chọn khung giờ khám hôm nay.`)
    setLastSaved(null)
  }


  if (!token || !user) return null

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col lg:pl-[244px] transition-all">
      <RoleSidebar
        role="receptionist"
        active="registration"
        user={user}
        onLogout={performLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <StaffMobileHeader onOpenMenu={() => setMobileMenuOpen(true)} roleTitle="Lễ tân & Tiếp nhận" />

      <div className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-[1400px] w-full mx-auto flex flex-col space-y-5">
        {/* Header trang */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/reception')}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Quay lại Lịch hẹn</span>
              </button>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              {fromAppointment ? 'Cập nhật đăng ký khám bệnh' : 'Đăng ký khám bệnh trực tiếp tại quầy'}
            </h1>
          </div>

          {fromAppointment && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFreshNew(true)
                  resetDraftForNew()
                  setSaveMsg('Đã chuyển sang chế độ tạo đăng ký mới.')
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded border border-emerald-600 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo đăng ký mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Thông báo */}
        {saveMsg ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded font-medium shadow-xs">
            {saveMsg}
          </div>
        ) : null}
        {lookupErr ? (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded font-medium shadow-xs">
            {lookupErr}
          </div>
        ) : null}

        {/* Khối 1: Thông tin người đăng ký / Bệnh nhân */}
        <section className="bg-white border border-slate-300/80 rounded shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Thông tin người đăng ký / Bệnh nhân
              </h2>
            </div>
          </div>

          {/* Thanh công cụ Tra cứu gợi ý nhanh & Quét QR / CCCD */}
          {createNew && (
            <div className="bg-slate-50/80 p-3.5 rounded border border-slate-200/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Input tìm kiếm bệnh nhân có live autocomplete dropdown */}
                <div ref={searchContainerRef} className="relative flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                      placeholder="Gõ Tên, Mã BN (VD: BN...), CCCD (12 số) hoặc SĐT để chọn hồ sơ tự động điền..."
                      value={lookupKeyword}
                      onChange={(e) => {
                        setLookupKeyword(e.target.value)
                        setSearchOpen(true)
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0 || lookupKeyword.trim().length >= 2) {
                          setSearchOpen(true)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (searchResults.length > 0) {
                            handleSelectPatient(searchResults[0])
                          }
                        }
                      }}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {searchLoading && (
                      <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Dropdown kết quả tìm kiếm dạng bảng chuyên nghiệp */}
                  {searchOpen && lookupKeyword.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-300 rounded shadow-lg max-h-72 overflow-y-auto overflow-x-auto">
                      {searchLoading ? (
                        <div className="p-3.5 text-center text-xs text-slate-500 font-medium">
                          Đang tra cứu dữ liệu bệnh nhân...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <table className="w-full text-left border-collapse text-xs min-w-[680px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                              <th className="py-2 px-3">Mã BN</th>
                              <th className="py-2 px-3">Họ và tên</th>
                              <th className="py-2 px-3">Giới tính</th>
                              <th className="py-2 px-3">Ngày sinh</th>
                              <th className="py-2 px-3">Số điện thoại</th>
                              <th className="py-2 px-3">Số CCCD</th>
                              <th className="py-2 px-3">Địa chỉ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {searchResults.map((pat) => {
                              const name = readDisplayNameFromPatient(pat) || pat.fullName || pat.name || '—'
                              const code = pat.patientCode || pat.code || '—'
                              const phone = pat.phone || pat.phoneNumber || pat.account?.phoneNumber || '—'
                              const cccd = pat.nationalId || pat.citizenId || '—'
                              const dob = pat.dob || pat.dateOfBirth
                              const dobText = dob ? formatDateVi(dob) : '—'
                              const rawGender = String(pat.gender || '').toLowerCase()
                              const genderText = rawGender === 'male' ? 'Nam' : rawGender === 'female' ? 'Nữ' : pat.gender || '—'
                              const address = pat.address || '—'

                              return (
                                <tr
                                  key={pat.id}
                                  onClick={() => handleSelectPatient(pat)}
                                  className="hover:bg-emerald-50 cursor-pointer transition-colors"
                                  title="Nhấp để điền thông tin bệnh nhân"
                                >
                                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">{code}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{name}</td>
                                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{genderText}</td>
                                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{dobText}</td>
                                  <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">{phone}</td>
                                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{cccd}</td>
                                  <td className="py-2.5 px-3 text-slate-500 max-w-[240px] truncate" title={address}>{address}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-500 font-medium">
                          Không tìm thấy bệnh nhân khớp với từ khóa "{lookupKeyword}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setQrScanErr('')
                      setQrScanOpen(true)
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded border border-indigo-600 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    title="Quét mã QR thẻ CCCD hoặc mã bệnh nhân"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Quét QR / CCCD</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetDraftForNew}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Xóa trắng toàn bộ thông tin để làm mới form"
                  >
                    <span>Làm mới form</span>
                  </button>

                  {(draftPatientId || draftName || draftPhone || draftDob || draftNationalId) && (
                    <button
                      type="button"
                      onClick={handleClearPatientData}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-200 text-xs font-semibold rounded shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Chỉ xóa trắng thông tin bệnh nhân"
                    >
                      <span>✕ Xóa thông tin BN</span>
                    </button>
                  )}
                </div>
              </div>

              {lookupSuccessMsg && (
                <div className="text-xs text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3.5 py-2 rounded flex items-center justify-between font-medium">
                  <span>{lookupSuccessMsg}</span>
                  <button type="button" onClick={() => setLookupSuccessMsg('')} className="text-slate-400 hover:text-slate-700 text-xs font-bold border border-transparent rounded">✕</button>
                </div>
              )}
              {lookupErr && (
                <div className="text-xs text-rose-800 bg-rose-100/70 border border-rose-200 px-3.5 py-2 rounded flex items-center justify-between font-medium">
                  <span>{lookupErr}</span>
                  <button type="button" onClick={() => setLookupErr('')} className="text-slate-400 hover:text-slate-700 text-xs font-bold border border-transparent rounded">✕</button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Mã bệnh nhân</label>
              <input
                readOnly
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800 cursor-not-allowed"
                value={p ? (patientDisplay?.patientCode || '') : (draftPatientId ? draftPatientCode : '')}
                placeholder="Hệ thống tự cấp khi lưu"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Số CCCD / Định danh</label>
              <input
                readOnly={Boolean(p)}
                className={`w-full px-3.5 py-2 rounded text-xs font-mono font-medium focus:outline-none focus:border-emerald-600 ${p
                  ? 'bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
                  }`}
                value={p ? (patientDisplay?.nationalId || '') : draftNationalId}
                onChange={(e) => setDraftNationalId(e.target.value)}
                placeholder="12 chữ số CCCD (nếu có)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Họ và tên <span className="text-rose-600">*</span>
              </label>
              <input
                readOnly={Boolean(p)}
                className={`w-full px-3.5 py-2 rounded text-xs font-medium focus:outline-none focus:border-emerald-600 ${p
                  ? 'bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
                  }`}
                value={p ? patientDisplay?.displayName : draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Ngày sinh <span className="text-rose-600">*</span>
              </label>
              <input
                type={p ? 'text' : 'date'}
                readOnly={Boolean(p)}
                max={todayIso}
                className={`w-full px-3.5 py-2 rounded text-xs font-medium focus:outline-none focus:border-emerald-600 ${p
                  ? 'bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
                  }`}
                value={p ? patientDisplay?.dobLabel : draftDob}
                onChange={(e) => handleDraftDobChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Độ tuổi</label>
              <input
                readOnly
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded font-medium text-slate-800 cursor-not-allowed"
                value={p ? patientDisplay?.age : draftDob ? ageFromIsoDate(draftDob) : ''}
                placeholder="Tự tính từ ngày sinh"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Giới tính</label>
              {p ? (
                <input
                  readOnly
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded font-medium text-slate-800 cursor-not-allowed"
                  value={patientDisplay?.gender || '—'}
                />
              ) : (
                <select
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 shadow-xs"
                  value={draftGender}
                  onChange={(e) => setDraftGender(e.target.value)}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Số điện thoại <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                readOnly={Boolean(p)}
                className={`w-full px-3.5 py-2 rounded text-xs font-medium focus:outline-none focus:border-emerald-600 ${p
                  ? 'bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
                  }`}
                value={p ? patientDisplay?.phone : draftPhone}
                onChange={(e) => setDraftPhone(e.target.value)}
                placeholder="Số điện thoại liên hệ"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Địa chỉ</label>
              <input
                readOnly={Boolean(p)}
                className={`w-full px-3.5 py-2 rounded text-xs font-medium focus:outline-none focus:border-emerald-600 ${p
                  ? 'bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
                  }`}
                value={p ? patientDisplay?.address : draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                placeholder="Địa chỉ nơi ở"
              />
            </div>
          </div>
        </section>

        {/* Khối 2: Thông tin đăng ký khám trực tiếp */}
        <section className="bg-white border border-slate-300/80 rounded shadow-sm p-5 space-y-4" id="reg-section-appointment">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {bookingMode === 're_exam' ? 'Đăng ký Tái khám theo đợt khám cũ' : 'Đăng ký khám chuyên khoa tại quầy'}
              </h2>
            </div>

            {/* TAB CHUYỂN ĐỔI CHẾ ĐỘ: KHÁM MỚI / TÁI KHÁM */}
            {!fromAppointment && (
              <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setBookingMode('new')
                  }}
                  className={`px-3 py-1 font-bold rounded transition-all cursor-pointer ${bookingMode === 'new'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  Khám mới
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (examinedHistoryRows.length > 0) {
                      setBookingMode('re_exam')
                      if (!selectedHistoryId && examinedHistoryRows[0]) {
                        startReExam(examinedHistoryRows[0])
                      }
                    }
                  }}
                  disabled={examinedHistoryRows.length === 0}
                  className={`px-3 py-1 font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${bookingMode === 're_exam'
                    ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                  title={
                    examinedHistoryRows.length === 0
                      ? 'Bệnh nhân chưa có lịch sử khám trước để tái khám'
                      : `Bệnh nhân có ${examinedHistoryRows.length} đợt khám trước`
                  }
                >
                  <span>Tái khám</span>
                  {examinedHistoryRows.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${bookingMode === 're_exam'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                      {examinedHistoryRows.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* CHẾ ĐỘ TÁI KHÁM */}
          {bookingMode === 're_exam' && !fromAppointment ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-bold text-slate-800">
                    Chọn đợt khám trước cần tái khám:
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Chọn đợt khám trước, sau đó chọn dịch vụ, khung giờ và bác sĩ phụ trách
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs bg-white rounded border border-slate-200 min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                        <th className="py-2 px-3 w-10 text-center">Chọn</th>
                        <th className="py-2 px-3">Ngày khám trước</th>
                        <th className="py-2 px-3">Mã phiếu</th>
                        <th className="py-2 px-3">Gói khám / Dịch vụ</th>
                        <th className="py-2 px-3">Bác sĩ phụ trách</th>
                        <th className="py-2 px-3">Chuyên khoa</th>
                        <th className="py-2 px-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {examinedHistoryRows.map((r) => {
                        const isSelected = String(selectedHistoryId) === String(r.id)
                        return (
                          <tr
                            key={r.id}
                            onClick={() => startReExam(r)}
                            className={`cursor-pointer transition-colors ${isSelected
                              ? 'bg-emerald-50/80 font-semibold text-slate-900'
                              : 'hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input
                                type="radio"
                                name="reExamPick"
                                checked={isSelected}
                                onChange={() => startReExam(r)}
                                className="w-3.5 h-3.5 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {r.createdAt ? formatDateTimeVi(r.createdAt) : '—'}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {r.ticket || '—'}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                              {historyServicePackageLabel(r)}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              {historyDoctorLabel(r)}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {historySpecialtyLabel(r)}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {statusLabelVi(r.status)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tóm tắt thông tin đợt tái khám */}
              {selectedHistoryId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">1. Chuyên khoa tái khám</label>
                    <input
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-800 cursor-not-allowed"
                      value={specialties.find((s) => String(s.id) === String(specialtyId))?.name || '—'}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">2. Gói khám / Dịch vụ</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-xs disabled:bg-slate-50"
                      value={servicePackageId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      disabled={servicesLoading || !specialtyId}
                    >
                      <option value="">-- Chọn dịch vụ chuyên khoa --</option>
                      {servicePackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — {Number(pkg.price || 0).toLocaleString('vi-VN')} đ
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CHẾ ĐỘ KHÁM MỚI */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-2">1. Chuyên khoa khám <span className="text-rose-600">*</span></label>
                {fromAppointment ? <p>{appointmentSpecialtyDisplay || '—'}</p> : (
                  <select className="w-full px-3 py-2 border rounded-lg" value={specialtyId} onChange={e => handleSpecialtyChange(e.target.value)} disabled={specialtiesLoading}>
                    <option value="">{specialtiesLoading ? 'Đang tải…' : '-- Chọn chuyên khoa --'}</option>
                    {specialtyOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block font-bold mb-2">2. Dịch vụ chuyên khoa <span className="text-rose-600">*</span></label>
                {fromAppointment ? <p>{payload?.servicePackage?.name || 'Theo lịch hẹn đã đặt'}</p> : (
                  <select className="w-full px-3 py-2 border rounded-lg disabled:bg-slate-100" value={servicePackageId} onChange={e => handleServiceChange(e.target.value)} disabled={servicesLoading || !specialtyId}>
                    <option value="">{servicesLoading ? 'Đang tải dịch vụ…' : '-- Chọn dịch vụ --'}</option>
                    {servicePackages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} — {Number(pkg.price || 0).toLocaleString('vi-VN')} đ</option>)}
                  </select>
                )}
                {selectedService && <p className="mt-2 font-semibold text-emerald-700">Phí khám: {Number(selectedService.price || 0).toLocaleString('vi-VN')} đ</p>}
                {!fromAppointment && specialtyId && !servicesLoading && !servicePackages.length && <p className="mt-2 text-amber-700">Chuyên khoa chưa có dịch vụ đang áp dụng.</p>}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <label className="block text-xs font-bold">3. Ngày và khung giờ khám <span className="text-rose-600">*</span></label>
            <input type="date" min={todayIso} value={appointmentDate} onChange={e => handleAppointmentDateChange(e.target.value)} disabled={fromAppointment || !servicePackageId} className="px-3 py-2 border rounded-lg disabled:bg-slate-100" />
            {!fromAppointment && <div className="flex gap-2 overflow-x-auto pb-1">
              {availableWorkDates.slice(0, 14).map(day => <button key={day} type="button" onClick={() => handleAppointmentDateChange(day)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${appointmentDate === day ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}>{day === todayIso ? 'Hôm nay' : formatDayOfWeekVi(day)} · {formatDateVi(day)}</button>)}
            </div>}
            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
              {fromAppointment ? <p className="text-xs">{formatDateVi(appointmentDate)} · {formatSlotRange(startTime)}</p>
                : slotsLoading ? <p className="text-xs text-slate-500">Đang tải khung giờ…</p>
                : slotsErr ? <p className="text-xs text-rose-700">{slotsErr}</p>
                : !specialtyId || !servicePackageId ? <p className="text-xs text-slate-500">Chọn chuyên khoa và dịch vụ để xem khung giờ.</p>
                : !freeSlots.length ? <p className="text-xs text-amber-700">Dịch vụ chưa có khung giờ còn trống trong ngày này. Vui lòng chọn ngày khác.</p>
                : slotsBySession.filter(session => session.slots.length).map(session => <div key={session.code}>
                    <p className="mb-2 text-xs font-semibold text-slate-500">Ca {session.label.toLowerCase()}</p>
                    <div className="flex flex-wrap gap-2">{session.slots.map(time => <button key={time} type="button" onClick={() => handleTimeChange(time)} className={`rounded-lg border px-3 py-2 text-xs ${startTime === time ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}>{time} – {availableSlots.find(slot => slot.startTime === time)?.endTime}</button>)}</div>
                  </div>)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2">4. Bác sĩ phụ trách <span className="text-rose-600">*</span></label>
            {fromAppointment ? <p className="text-sm">{payload?.doctor?.fullName || '—'}</p> : (
              <select className="w-full px-3 py-2 border rounded-lg text-xs disabled:bg-slate-100" value={selectedScheduleSlotId} onChange={e => handleDoctorSlotChange(e.target.value)} disabled={!startTime || slotsLoading}>
                <option value="">{startTime ? '-- Chọn bác sĩ trong khung giờ --' : 'Chọn khung giờ trước'}</option>
                {availableSlots.filter(slot => slot.startTime === startTime).map(slot => <option key={slot.id} value={slot.id}>{slot.doctorName} · {slot.branchName}{slot.roomName ? ` · ${slot.roomName}` : ''}</option>)}
              </select>
            )}
          </div>
        </section>

        {/* Khối 3: Thông tin lịch sử khám */}
        <section className="bg-white border border-slate-300/80 rounded shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Lịch sử các lần khám trước
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-300 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Trạng thái</th>
                  <th className="py-2.5 px-3.5">Mã lịch hẹn</th>
                  <th className="py-2.5 px-3.5">Gói khám / Dịch vụ</th>
                  <th className="py-2.5 px-3.5">Ngày đăng ký</th>
                  <th className="py-2.5 px-3.5">Bác sĩ phụ trách</th>
                  <th className="py-2.5 px-3.5">Chuyên khoa</th>
                  <th className="py-2.5 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {examinedHistoryRows.map((r) => {
                  const canReExam =
                    !fromAppointment &&
                    historyIsExamined(r) &&
                    Boolean(String(r?.doctorId || r?.doctor?.id || '').trim())

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800">{statusLabelVi(r.status)}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-700">{r.ticket || '—'}</td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">{historyServicePackageLabel(r)}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">{r.createdAt ? formatDateTimeVi(r.createdAt) : '—'}</td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800">{historyDoctorLabel(r)}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">{historySpecialtyLabel(r)}</td>
                      <td className="py-2.5 px-3.5 text-right">
                        {canReExam ? (
                          <button
                            type="button"
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 font-bold rounded text-xs transition-all shadow-xs cursor-pointer"
                            onClick={() => startReExam(r)}
                            disabled={saving}
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

                {!examinedHistoryRows.length && !historyLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                      {selectedPatientId ? 'Bệnh nhân chưa có lịch sử khám trước đây.' : 'Chọn bệnh nhân có sẵn để xem lịch sử khám.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {/* Nút hành động cuối trang */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            onClick={() => navigate('/reception')}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Quay lại Lịch hẹn</span>
          </button>

          <button
            type="button"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm border border-emerald-600 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{saving ? 'Đang xử lý…' : createNew ? 'Tạo đăng ký khám' : 'Lưu cập nhật'}</span>
          </button>
        </div>
      </div>

      {/* Modal Tìm kiếm Bệnh nhân */}
      <RegistrationPatientPickerModal
        isOpen={pickerOpen}
        onClose={closePicker}
        filters={pickerFilters}
        setFilters={setPickerFilters}
        rows={pickerRows}
        selectedId={pickerSelectedId}
        setSelectedId={setPickerSelectedId}
        loading={pickerLoading}
        error={pickerErr}
        page={pickerPage}
        pageSize={pickerPageSize}
        total={pickerTotal}
        setPage={setPickerPage}
        onSearch={() => {
          setPickerPage(1)
          loadPicker({ page: 1, pageSize: pickerPageSize, filters: pickerFilters })
        }}
        onSelectPatient={(chosen) => {
          applySelectedPatient(chosen)
          closePicker()
        }}
        onOpenQrScan={() => {
          setPickerErr('')
          setQrScanErr('')
          setQrScanOpen(true)
        }}
      />

      {/* Hidden element for reading QR from image file */}
      <div id="reg-qr-hidden-reader" className="hidden" />

      {/* Modal Quét QR / CCCD trực tiếp trên màn hình đăng ký */}
      <ReceptionQrScannerModal
        qrOpen={qrScanOpen}
        setQrOpen={setQrScanOpen}
        qrErr={qrScanErr}
        setQrErr={setQrScanErr}
        qrImageLoading={qrImageLoading}
        handleQrFileInput={handleQrFileInput}
        onScan={handleQrDecoded}
        title="Quét mã QR thẻ CCCD / Bệnh nhân"
        description="Đưa mã QR trên thẻ CCCD gắn chip của bệnh nhân hoặc mã QR trên điện thoại vào khung camera, hoặc tải ảnh lên để tự động điền nhanh thông tin."
      />
    </div>
  )
}
