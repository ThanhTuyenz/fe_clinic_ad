export function parseCccdQr(qrText: string) {
  const text = String(qrText || '').trim()
  if (!text.includes('|')) return null
  const parts = text.split('|').map((p) => p.trim())
  if (parts.length >= 5) {
    const nationalId = parts[0]
    if (/^\d{9,12}$/.test(nationalId)) {
      const fullName = parts[2] || ''
      const rawDob = parts[3] || '' // DDMMYYYY
      let dob = ''
      if (rawDob.length === 8 && /^\d{8}$/.test(rawDob)) {
        const d = rawDob.slice(0, 2)
        const m = rawDob.slice(2, 4)
        const y = rawDob.slice(4, 8)
        dob = `${y}-${m}-${d}`
      }
      const rawGender = (parts[4] || '').toLowerCase()
      const gender = rawGender === 'nam' ? 'male' : (rawGender === 'nữ' || rawGender === 'nu' ? 'female' : '')
      const address = parts[5] || ''
      return { nationalId, fullName, dob, gender, address }
    }
  }
  return null
}

export function patientFromQrPayload(text: string) {
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

export function displayName(user: any) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

export function staffCreatorPayload(user: any) {
  if (!user) return null
  return {
    id: user.id || user._id || '',
    displayName: displayName(user),
    email: user.email || '',
    userType: user.userType || user.role || '',
  }
}

export function pad2(n: number | string) {
  return String(n).padStart(2, '0')
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayIsoDate() {
  return ymd(new Date())
}

export function clampIsoDateMaxToday(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const today = todayIsoDate()
  return iso > today ? today : iso
}

export function isIsoDateNotBeforeToday(iso: string) {
  return Boolean(iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= todayIsoDate())
}

export function formatDateVi(isoOrDate: any) {
  if (!isoOrDate) return ''
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatDayOfWeekVi(isoDate: string) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return days[d.getDay()]
}

export function formatSlotRange(startTimeStr: string, durationMinutes = 30) {
  if (!startTimeStr || !startTimeStr.includes(':')) return startTimeStr
  const [hStr, mStr] = startTimeStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return startTimeStr
  const totalMin = h * 60 + m + durationMinutes
  const endH = Math.floor(totalMin / 60)
  const endM = totalMin % 60
  const endStr = `${pad2(endH)}:${pad2(endM)}`
  return `${startTimeStr} - ${endStr}`
}

export function ageFromIsoDate(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const today = new Date()
  let age = today.getFullYear() - y
  const monthDiff = today.getMonth() + 1 - m
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age -= 1
  return age >= 0 ? String(age) : ''
}

export function isoDateFromApi(dob: any) {
  if (!dob) return ''
  const d = dob instanceof Date ? dob : new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  return ymd(d)
}

export function mapGenderToDraft(g: any) {
  if (g === true || g === 'true') return 'male'
  if (g === false || g === 'false') return 'female'
  const s = String(g ?? '').trim().toLowerCase()
  if (s === 'nam' || s === 'male' || s === 'm') return 'male'
  if (s === 'nữ' || s === 'nu' || s === 'female' || s === 'f') return 'female'
  return ''
}

export function readDisplayNameFromPatient(pat: any) {
  if (!pat) return ''
  const dn = String(pat.displayName || pat.fullName || pat.name || '').trim()
  if (dn) return dn
  const last = String(pat.lastName || '').trim()
  const first = String(pat.firstName || '').trim()
  return `${last} ${first}`.trim() || `${first} ${last}`.trim() || ''
}

export function patientDobFromRow(pat: any) {
  return pat?.dob || pat?.dateOfBirth || ''
}

export function genderLabelFromRow(g: any) {
  const mapped = mapGenderToDraft(g)
  if (mapped === 'male') return 'Nam'
  if (mapped === 'female') return 'Nữ'
  return g ? String(g) : '—'
}

export function formatDateTimeVi(value: any) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${formatDateVi(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function isoDateOnly(value: any) {
  const s = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return isoDateFromApi(s)
}

export function statusLabelVi(st: string) {
  const s = String(st || '').toLowerCase()
  if (s === 'confirmed') return 'Đã xác nhận'
  if (s === 'cancelled') return 'Đã hủy'
  if (s === 'completed' || s === 'done' || s === 'examined') return 'Đã khám'
  return 'Chờ'
}

export function historyDoctorLabel(row: any) {
  const doctor = row?.doctor
  const name = String(
    doctor?.displayName ||
    [doctor?.lastName, doctor?.firstName].filter(Boolean).join(' ').trim() ||
    row?.doctorName ||
    '',
  ).trim()
  return name || '—'
}

export function historySpecialtyLabel(row: any) {
  const name = String(row?.doctor?.specialtyName || row?.specialtyName || '').trim()
  return name || '—'
}

export function historyServicePackageLabel(row: any) {
  if (row?.servicePackage?.name) return row.servicePackage.name
  if (row?.servicePackageName) return row.servicePackageName
  const note = String(row?.note || row?.symptoms || '')
  const match = note.match(/Dịch vụ khám:\s*([^\n]+)/)
  if (match && match[1]) return match[1].trim()
  return 'Khám chuyên khoa tiêu chuẩn'
}

export function historyIsExamined(row: any) {
  const s = String(row?.status || '').toLowerCase()
  return s === 'completed' || s === 'done' || s === 'examined'
}
