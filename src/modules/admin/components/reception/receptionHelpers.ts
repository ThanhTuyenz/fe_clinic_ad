import {
  appointmentCreatorName,
  appointmentSourceLabel,
  appointmentSourceTitle,
  appointmentSourceValue,
} from '../../utils/appointmentSource'
import { isPendingAppointmentPastSlot } from '../../utils/appointmentExpiry'

export const QR_READER_ELEMENT_ID = 'tcl-ticket-qr-reader'

export function cameraErrorMessage(error: any): string {
  const name = String(error?.name || '').trim()
  const detail = String(error?.message || error || '').trim()
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'Camera chỉ hoạt động trên HTTPS hoặc localhost.'
  if (name === 'NotAllowedError' || /permission|notallowed/i.test(detail)) return 'Trình duyệt đang chặn camera cho trang này. Hãy cho phép camera trong thanh địa chỉ.'
  if (name === 'NotReadableError' || /could not start|notreadable|track start/i.test(detail)) return 'Trình duyệt không khởi động được camera. Có thể camera/driver chưa sẵn sàng hoặc phiên camera cũ chưa được giải phóng.'
  if (name === 'NotFoundError' || /not found|no camera/i.test(detail)) return 'Không tìm thấy camera trên thiết bị.'
  if (name === 'OverconstrainedError') return 'Camera không hỗ trợ chế độ quét đã yêu cầu.'
  return detail || 'Không mở được camera.'
}

export function displayName(user: any): string {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

export function sourceCreatorLabel(appointment: any): string {
  if (!appointment) return '—'
  const src = appointmentSourceValue(appointment)
  if (src === 'online') {
    return 'Bệnh nhân (Đặt online)'
  }
  const creator = appointmentCreatorName(appointment)
  if (creator) {
    return `${creator} (Tại quầy)`
  }
  if (src === 'clinic') {
    return 'Lễ tân (Tại quầy)'
  }
  return 'Bệnh nhân (Đặt online)'
}

export function pad2(n: number | string): string {
  return String(n).padStart(2, '0')
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function formatDateVi(isoOrDate: string | Date): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatDateTimeVi(iso: string | Date): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatVnd(amount: number | string): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('vi-VN')} đ`
}

export function paymentMethodLabel(method: string): string {
  const m = String(method || '').trim().toLowerCase()
  if (m === 'cash') return 'Tiền mặt'
  if (m === 'transfer' || m === 'vietqr') return 'Chuyển khoản (VietQR)'
  if (['online', 'wallet', 'payos', 'momo'].includes(m)) return 'PayOS / Trực tuyến'
  if (['card', 'credit_card', 'pos_card'].includes(m)) return 'Thẻ thanh toán (POS)'
  return '—'
}

export function formatPaidByLine(paidBy: any): string {
  if (!paidBy || typeof paidBy !== 'object') return '—'
  const name = String(paidBy.displayName || '').trim() || String(paidBy.email || '').trim()
  return name || '—'
}

export function mergePayment(primary: any, secondary: any) {
  const isPaid = (p: any) => String(p?.status || 'unpaid').trim().toLowerCase() === 'paid'
  if (isPaid(primary)) return primary
  if (isPaid(secondary)) return secondary
  return primary ?? secondary ?? null
}

export function formatDob(iso: string | Date): string {
  if (!iso) return '—'
  return formatDateVi(iso)
}

export function buildPatientCode(userId: string): string {
  const raw = String(userId || '').replace(/[^a-fA-F0-9]/g, '')
  const yy = String(new Date().getFullYear()).slice(-2)
  const pad = (raw + '00000000').slice(0, 8).toUpperCase()
  return `YM${yy}${pad}`
}

export function doctorDisplayName(d: any): string {
  if (!d) return '—'
  const name = String(d.fullName || d.name || d.displayName || '').trim()
  if (name) return name
  const last = String(d.lastName || '').trim()
  const first = String(d.firstName || '').trim()
  return `${last} ${first}`.trim() || String(d.email || '').trim() || '—'
}

export function clinicRoomLabel(roomId: string, rooms: any[]): string {
  const id = String(roomId || '').trim()
  if (!id) return '—'
  const hit = (rooms || []).find((r: any) => String(r.id || r.roomID) === id)
  return hit?.name ? String(hit.name).trim() : id
}

export function mergeReceptionDetail(cached: any, row: any) {
  if (!row) return cached ?? null
  if (!cached) return row
  const rowRoom = String(row.clinicRoom ?? '').trim()
  const cachedRoom = String(cached.clinicRoom ?? '').trim()
  const rowPatient = row.patient
  const rowDoctor = row.doctor
  return {
    ...cached,
    status: row.status ?? cached.status,
    workflowStatus: row.workflowStatus ?? cached.workflowStatus,
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
    specialty: row.specialty ?? cached.specialty,
    servicePackage: row.servicePackage ?? cached.servicePackage,
    bookingMethod: row.bookingMethod ?? cached.bookingMethod,
    branch: row.branch ?? cached.branch,
    clinicRoomName: row.clinicRoomName || cached.clinicRoomName,
    ticket: row.ticket || cached.ticket,
    appointmentDate: row.appointmentDate || cached.appointmentDate,
    startTime: row.startTime || cached.startTime,
    endTime: row.endTime != null && row.endTime !== '' ? row.endTime : cached.endTime,
  }
}

export function detailMissingForSlip(detail: any): boolean {
  if (!detail) return true
  if (patientListDisplayName(detail.patient) === '—') return true
  if (doctorDisplayName(detail.doctor) === '—') return true
  if (!String(detail.startTime || '').trim()) return true
  return false
}

export function formatExamTimeLine(start: string, end?: string): string {
  const s = String(start || '').trim().slice(0, 5)
  if (!s) return '—'
  const e = String(end || '').trim().slice(0, 5)
  return e && e !== s ? `${s} – ${e}` : s
}

export function buildVisitSlipView(detail: any, rooms: any[], overrides: any = {}) {
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

export function doctorSpecialtyDisplay(d: any): string {
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

export function patientListDisplayName(p: any): string {
  if (!p) return '—'
  const dn = String(p.displayName || p.fullName || p.name || '').trim()
  if (dn) return dn
  const last = String(p.lastName || '').trim()
  const first = String(p.firstName || '').trim()
  const vi = `${last} ${first}`.trim()
  if (vi) return vi
  const en = `${first} ${last}`.trim()
  return en || '—'
}

export function genderLabelVi(value: unknown): string {
  const raw = String(value || '').trim().toUpperCase()
  if (raw === 'MALE' || raw === 'NAM' || raw === 'M') return 'Nam'
  if (raw === 'FEMALE' || raw === 'NỮ' || raw === 'NU' || raw === 'F') return 'Nữ'
  return value ? String(value) : '—'
}

export function patientDobValue(p: any) {
  return p?.dob || p?.dateOfBirth || ''
}

export function toRegistrationPatient(row: any) {
  if (!row) return null
  const dob = patientDobValue(row)
  const phone = String(row.phone || row.phoneNumber || row.account?.phoneNumber || '').trim()
  return {
    ...row,
    id: row.id || row._id,
    patientCode: row.patientCode || row.nationalId || row.id,
    displayName: patientListDisplayName(row),
    fullName: row.fullName || patientListDisplayName(row),
    dob,
    dateOfBirth: dob,
    phone,
    phoneNumber: phone,
    gender: row.gender,
    address: row.address || '',
    email: row.email || row.account?.email || '',
    nationalId: row.nationalId || '',
  }
}

export function ageFromDobField(dob: any): string {
  if (dob == null || dob === '') return ''
  const d = dob instanceof Date ? dob : new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
}

export function statusLabelVi(st: string): string {
  const s = String(st || '').toLowerCase()
  if (s === 'confirmed') return 'Đã xác nhận'
  if (s === 'cancelled') return 'Từ chối'
  if (s === 'examined' || s === 'completed' || s === 'done') return 'Đã khám'
  return 'Chờ'
}

export function receptionStatusMeta(row: any): { label: string; tone: string } {
  const workflow = String(row?.workflowStatus || '').toUpperCase()
  if (workflow === 'HOLD') return { label: 'Chờ thanh toán', tone: 'pending' }
  if (workflow === 'CONFIRMED') return { label: 'Chờ check-in', tone: 'booked' }
  if (workflow === 'CHECKED_IN') return { label: 'Đã check-in', tone: 'checked-in' }
  if (workflow === 'COMPLETED') return { label: 'Đã khám', tone: 'completed' }
  if (workflow === 'CANCELLED') return { label: 'Đã hủy', tone: 'cancelled' }
  if (workflow === 'NO_SHOW') return { label: 'Vắng mặt', tone: 'cancelled' }
  const status = normalizeStatus(row?.status)
  if (status === 'confirmed') return { label: 'Đã xác nhận', tone: 'booked' }
  if (status === 'examined') return { label: 'Đã khám', tone: 'completed' }
  if (status === 'cancelled') return { label: 'Đã hủy', tone: 'cancelled' }
  return { label: 'Chờ xử lý', tone: 'pending' }
}

export const PAGE_SIZE = 10

export function normalizeStatus(st: string): string {
  const s = String(st || '').toLowerCase()
  if (s === 'done' || s === 'completed') return 'examined'
  return s || 'pending'
}

export function readReceptionNavState(location: any) {
  const from = String(location?.state?.fromDate || '').trim()
  const to = String(location?.state?.toDate || '').trim()
  const st = String(location?.state?.statusFilter || '').trim()
  const dashFilter = String(location?.state?.dashFilter || '').trim()
  return {
    fromDate: from,
    toDate: to,
    statusFilter: st || 'all',
    dashFilter,
    filtersOpen: Boolean(from || to || st || dashFilter),
  }
}

export function dashFilterLabelVi(key: string): string {
  if (key === 'pending_checkin') return 'Chờ tiếp đón (Check-in)'
  if (key === 'unpaid') return 'Chờ đóng phí'
  if (key === 'checked_in') return 'Đã check-in (Chờ khám)'
  if (key === 'completed') return 'Đang / Đã khám'
  if (key === 'cancelled') return 'Đã hủy / Quá giờ'
  if (key === 'expiring') return 'Quá giờ hẹn'
  if (key === 'noRoom') return 'Chưa chọn phòng'
  if (key === 'ready') return 'Sẵn sàng xác nhận'
  return ''
}

export function isPaidAppointment(r: any): boolean {
  if (!r) return false
  const pStatus = String(r?.payment?.status || '').toLowerCase()
  if (pStatus === 'paid') return true
  if (r?.payment?.paid === true) return true
  const invStatus = String(r?.invoice?.status || '').toUpperCase()
  if (invStatus === 'PAID') return true
  return false
}

export function isReceptionPending(r: any): boolean {
  if (!r) return false
  const wf = String(r?.workflowStatus || '').toUpperCase()
  if (wf === 'HOLD' || wf === 'CONFIRMED') return true
  const st = normalizeStatus(r?.status)
  return st === 'pending'
}

export function getAppointmentWorkflowBucket(r: any): 'cancelled' | 'completed' | 'checked_in' | 'unpaid' | 'pending_checkin' {
  if (!r) return 'pending_checkin'
  const wf = String(r?.workflowStatus || '').toUpperCase()
  const st = normalizeStatus(r?.status)
  const paid = isPaidAppointment(r)
  const isExp = isPendingAppointmentPastSlot(r)

  // 1. Đã hủy / Hết hạn / Quá giờ slot
  if (wf === 'CANCELLED' || st === 'cancelled' || (isReceptionPending(r) && isExp)) {
    return 'cancelled'
  }

  // 2. Đã khám xong
  if (wf === 'COMPLETED' || st === 'examined') {
    return 'completed'
  }

  // 3. Đã check-in vào phòng (Đang chờ bác sĩ gọi khám)
  if (wf === 'CHECKED_IN' || (st === 'confirmed' && wf !== 'CONFIRMED')) {
    return 'checked_in'
  }

  // 4. Chờ đóng phí khám
  if (wf === 'HOLD' || !paid) {
    return 'unpaid'
  }

  // 5. Chờ tiếp đón / check-in
  return 'pending_checkin'
}

export function matchesDashFilter(row: any, dashFilter: string): boolean {
  const f = String(dashFilter || '').trim()
  if (!f || f === 'all') return true

  // Tương thích ngược với link từ Dashboard
  if (f === 'noRoom') {
    const paid = isPaidAppointment(row)
    const room = String(row?.clinicRoom || '').trim()
    const isExp = isPendingAppointmentPastSlot(row)
    return isReceptionPending(row) && paid && !room && !isExp
  }
  if (f === 'ready') {
    const paid = isPaidAppointment(row)
    const room = String(row?.clinicRoom || '').trim()
    const isExp = isPendingAppointmentPastSlot(row)
    return isReceptionPending(row) && paid && Boolean(room) && !isExp
  }
  if (f === 'expiring') {
    return isPendingAppointmentPastSlot(row)
  }

  const bucket = getAppointmentWorkflowBucket(row)
  return bucket === f
}

export function normalizeLookup(raw: any) {
  if (!raw) return null
  const ap = raw.appointment ?? raw
  return {
    id: ap.id ?? ap._id,
    ticket: ap.ticket,
    status: ap.status,
    workflowStatus: ap.workflowStatus,
    appointmentDate: ap.appointmentDate,
    startTime: ap.startTime,
    endTime: ap.endTime,
    note: ap.note,
    createdAt: ap.createdAt,
    cancelReason: ap.cancelReason,
    cancelledAt: ap.cancelledAt,
    cancelledBy: ap.cancelledBy,
    confirmedAt: ap.confirmedAt,
    confirmedBy: ap.confirmedBy,
    visitQueueNumber: ap.visitQueueNumber,
    clinicRoom: ap.clinicRoom,
    clinicRoomName: ap.clinicRoomName,
    source: ap.source,
    bookingSource: ap.bookingSource,
    createdByStaff: ap.createdByStaff,
    patient: ap.patient,
    doctor: ap.doctor,
    specialty: ap.specialty,
    servicePackage: ap.servicePackage,
    bookingMethod: ap.bookingMethod,
    branch: ap.branch,
    payment: ap.payment ?? raw.payment,
  }
}
