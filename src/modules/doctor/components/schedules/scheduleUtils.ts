import { CLINIC_SESSIONS } from '@/common/constants/clinic-sessions'

export const SLOT_DURATIONS = [15, 20, 30, 45, 60]

export const EMPTY_FORM = {
  doctorId: '',
  branchId: '',
  roomId: '',
  workDate: new Date().toISOString().slice(0, 10),
  startTime: CLINIC_SESSIONS[0].start,
  endTime: CLINIC_SESSIONS[0].end,
  slotDurationMin: '30',
  status: 'OPEN',
}

export const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const getMonday = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

export const formatWeekDisplay = (start: Date, end: Date) => {
  const sDay = String(start.getDate()).padStart(2, '0')
  const sMonth = String(start.getMonth() + 1).padStart(2, '0')
  const eDay = String(end.getDate()).padStart(2, '0')
  const eMonth = String(end.getMonth() + 1).padStart(2, '0')
  const eYear = end.getFullYear()
  return `${sDay}/${sMonth} – ${eDay}/${eMonth}/${eYear}`
}

export const DAY_NAMES = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

export const formatDoctorDisplayName = (doc: any) => {
  let rawName = String(doc?.fullName || doc?.user?.fullName || 'Bác sĩ').trim()
  const rank = String(doc?.academicRank || '').trim()

  // Khử các dạng lặp danh xưng như: "Thạc sĩ, BS ThS. BS Trần Thế Vinh" hoặc "ThS. BS ThS. BS..."
  rawName = rawName.replace(
    /^(?:Thạc sĩ[,\s]*BS|ThS[.]?\s*BS|BS|TS|CK[I12]+)\s+(?:Thạc sĩ[,\s]*BS|ThS[.]?\s*BS|BS|TS|CK[I12]+)\s+/i,
    'ThS. BS '
  )
  rawName = rawName.replace(/^(?:Thạc sĩ,\s*BS)\s+(?:ThS\.\s*BS)/i, 'ThS. BS')

  // Nếu rawName đã bắt đầu bằng danh xưng (ThS, BS, TS, Thạc sĩ...) thì không nối rank nữa
  if (/^(ths|ts|bs|ck1|cki|ck2|ckii|pgs|gs|thạc sĩ|tiến sĩ|bác sĩ)/i.test(rawName)) {
    return rawName
  }

  if (rank) {
    return `${rank} ${rawName}`
  }
  return rawName
}

export const SCHEDULE_TABLE_COLUMNS = [
  { label: 'Bác sĩ' },
  { label: 'Chi nhánh & Phòng' },
  { label: 'Ngày' },
  { label: 'Khung giờ' },
  { label: 'Tiến độ đặt' },
  { label: 'Thời lượng' },
  { label: 'Trạng thái' },
  { label: 'Thao tác', align: 'right' as const },
]
