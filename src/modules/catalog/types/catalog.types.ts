export type Field = [string, string, 'text' | 'date' | 'number' | 'textarea' | 'select' | 'multiselect' | 'image', string?]
export type Config = { title: string; singular: string; fields: Field[]; columns: [string, string][] }

export const CONFIG: Record<string, Config> = {
  branches: {
    title: 'Chi nhánh phòng khám',
    singular: 'chi nhánh',
    fields: [
      ['code', 'Mã chi nhánh', 'text'],
      ['name', 'Tên chi nhánh', 'text'],
      ['imageUrl', 'Hình ảnh cơ sở', 'image'],
      ['address', 'Địa chỉ', 'text'],
      ['phoneNumber', 'Hotline', 'text'],
      ['timezone', 'Múi giờ', 'text'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Tên chi nhánh'],
      ['address', 'Địa chỉ'],
      ['phoneNumber', 'Hotline'],
    ],
  },
  rooms: {
    title: 'Phòng khám',
    singular: 'phòng khám',
    fields: [
      ['branchId', 'Chi nhánh', 'select', 'branches'],
      ['code', 'Mã phòng', 'text'],
      ['name', 'Tên phòng', 'text'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Tên phòng'],
      ['branch.name', 'Chi nhánh'],
      ['isActive', 'Trạng thái'],
    ],
  },
  specialties: {
    title: 'Quản lý chuyên khoa',
    singular: 'chuyên khoa',
    fields: [
      ['name', 'Tên chuyên khoa', 'text'],
      ['slug', 'Slug', 'text'],
      ['iconUrl', 'Biểu tượng chuyên khoa', 'image'],
      ['description', 'Mô tả', 'textarea'],
    ],
    columns: [
      ['id', 'ID'],
      ['name', 'Chuyên khoa'],
      ['slug', 'Slug'],
      ['description', 'Mô tả'],
    ],
  },
  'branch-specialties': {
    title: 'Chuyên khoa theo cơ sở',
    singular: 'chuyên khoa tại cơ sở',
    fields: [
      ['branchId', 'Cơ sở y tế', 'select', 'branches'],
      ['specialtyId', 'Chuyên khoa', 'select', 'specialties'],
    ],
    columns: [
      ['branch.name', 'Cơ sở'],
      ['specialty.name', 'Chuyên khoa'],
    ],
  },
  'room-specialties': {
    title: 'Phòng khám theo chuyên khoa',
    singular: 'phòng khám chuyên khoa',
    fields: [
      ['roomId', 'Phòng khám', 'select', 'rooms'],
      ['specialtyId', 'Chuyên khoa', 'select', 'specialties'],
      ['priority', 'Mức ưu tiên', 'number'],
    ],
    columns: [
      ['room.branch.name', 'Cơ sở'],
      ['room.name', 'Phòng khám'],
      ['specialty.name', 'Chuyên khoa'],
      ['priority', 'Ưu tiên'],
    ],
  },
  'service-packages': {
    title: 'Gói dịch vụ khám',
    singular: 'gói dịch vụ',
    fields: [
      ['name', 'Tên gói', 'text'],
      ['imageUrl', 'Ảnh minh họa gói khám', 'image'],
      ['branchId', 'Chi nhánh', 'select', 'branches'],
      ['branchBookingMethodId', 'Hình thức đặt khám', 'select', 'booking-methods'],
      ['specialtyId', 'Chuyên khoa (không bắt buộc)', 'select', 'specialties'],
      ['price', 'Giá gói', 'number'],
      ['description', 'Mô tả', 'textarea'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Gói dịch vụ'],
      ['branchBookingMethod.bookingMethod.name', 'Hình thức'],
      ['specialty.name', 'Chuyên khoa'],
      ['branchBookingMethod.branch.name', 'Chi nhánh'],
      ['activeDaysOfWeek', 'Ngày trong tuần'],
      ['sessionType', 'Buổi tiếp nhận'],
      ['price', 'Giá gói'],
    ],
  },
}

export const EMPTY_SLOT = { startTime: '08:00', endTime: '11:30' }

export const EMPTY = {
  isActive: true,
  sessionType: 'MORNING',
  activeDaysOfWeek: [1, 2, 3, 4, 5, 6, 0] as number[],
  timezone: 'Asia/Ho_Chi_Minh',
  durationMin: 30,
  price: '',
  unitPrice: '',
  stockQuantity: '',
  medicalServiceIds: [] as string[],
  schedules: [] as any[],
}

export const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

export const at = (row: any, key: string) => key.split('.').reduce((value, part) => value?.[part], row)

export const timeValue = (value: unknown) => {
  const text = String(value || '')
  return text.includes('T') ? text.slice(11, 16) : text.slice(0, 5)
}

export const generateCode = (resource: string) => {
  const prefixMap: Record<string, string> = {
    'service-packages': 'PKG',
    services: 'SVC',
    branches: 'BRC',
    rooms: 'PK',
    medicines: 'MED',
  }
  const prefix = prefixMap[resource] || 'CAT'
  const year = new Date().getFullYear()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${randomNum}`
}

export const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 0, label: 'Chủ Nhật' },
]

export const SESSION_LABELS: Record<string, string> = {
  MORNING: 'Buổi sáng (07:30 - 11:30)',
  AFTERNOON: 'Buổi chiều (13:30 - 17:00)',
  EVENING: 'Ngoài giờ (17:00 - 20:30)',
  OFFICE_HOURS: 'Giờ hành chính (07:30 - 17:00)',
  ALL_DAY: 'Cả ngày & Ngoài giờ',
}

export const formatDaysOfWeek = (days: any) => {
  if (!Array.isArray(days) || days.length === 0 || days.length === 7) return 'Cả tuần (T2 – CN)'
  const sorted = [...days].map(Number).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
  if (sorted.length === 5 && sorted.every((d) => [1, 2, 3, 4, 5].includes(d))) return 'Thứ 2 – Thứ 6'
  if (sorted.length === 2 && sorted.includes(6) && sorted.includes(0)) return 'T7 & Chủ Nhật'
  const labels: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' }
  return sorted.map((d) => labels[d] || d).join(', ')
}
