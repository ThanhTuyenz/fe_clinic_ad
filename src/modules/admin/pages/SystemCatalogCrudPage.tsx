'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  batchBranchSpecialties,
  batchRoomSpecialties,
  createCatalog,
  deleteCatalog,
  listCatalog,
  syncPackageVectors,
  updateCatalog,
  suggestSymptoms,
} from '../services/systemCatalog'
import { X, Loader2, Zap, Plus } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import { resolveMediaUrl } from '../services/media'

type Field = [string, string, 'text' | 'date' | 'number' | 'textarea' | 'select' | 'multiselect' | 'image', string?]
type Config = { title: string; singular: string; fields: Field[]; columns: [string, string][] }

const CONFIG: Record<string, Config> = {
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

const EMPTY_SLOT = { startTime: '08:00', endTime: '11:30' }
const EMPTY = {
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

const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')} đ`


const at = (row: any, key: string) => key.split('.').reduce((value, part) => value?.[part], row)
const timeValue = (value: unknown) => {
  const text = String(value || '')
  return text.includes('T') ? text.slice(11, 16) : text.slice(0, 5)
}

const generateCode = (resource: string) => {
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

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 0, label: 'Chủ Nhật' },
]

const SESSION_LABELS: Record<string, string> = {
  MORNING: 'Buổi sáng (07:30 - 11:30)',
  AFTERNOON: 'Buổi chiều (13:30 - 17:00)',
  EVENING: 'Ngoài giờ (17:00 - 20:30)',
  OFFICE_HOURS: 'Giờ hành chính (07:30 - 17:00)',
  ALL_DAY: 'Cả ngày & Ngoài giờ',
}

const formatDaysOfWeek = (days: any) => {
  if (!Array.isArray(days) || days.length === 0 || days.length === 7) return 'Cả tuần (T2 – CN)'
  const sorted = [...days].map(Number).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
  if (sorted.length === 5 && sorted.every((d) => [1, 2, 3, 4, 5].includes(d))) return 'Thứ 2 – Thứ 6'
  if (sorted.length === 2 && sorted.includes(6) && sorted.includes(0)) return 'T7 & Chủ Nhật'
  const labels: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' }
  return sorted.map((d) => labels[d] || d).join(', ')
}

export default function SystemCatalogCrudPage({ resource }: { resource: keyof typeof CONFIG }) {
  const cfg = CONFIG[resource]
  const [rows, setRows] = useState<any[]>([])
  const [options, setOptions] = useState<Record<string, any[]>>({})
  const [q, setQ] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterMethodCode, setFilterMethodCode] = useState('')
  const [filterSessionType, setFilterSessionType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncingVectors, setSyncingVectors] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [sortKey, setSortKey] = useState<string>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Batch Assignment Modal State
  const [batchModal, setBatchModal] = useState<'branch-specialties' | 'room-specialties' | null>(null)
  const [batchBranchId, setBatchBranchId] = useState<string>('')
  const [batchSpecialtyIds, setBatchSpecialtyIds] = useState<number[]>([])
  const [batchSpecialtyId, setBatchSpecialtyId] = useState<number>(0)
  const [batchRoomIds, setBatchRoomIds] = useState<string[]>([])
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchError, setBatchError] = useState('')

  const openBatchBranchModal = () => {
    const defaultBranchId = options.branches?.[0]?.id || ''
    setBatchBranchId(defaultBranchId)
    const activeIds = rows
      .filter((r) => (r.branchId === defaultBranchId || r.branch?.id === defaultBranchId) && r.isActive !== false)
      .map((r) => Number(r.specialtyId || r.specialty?.id))
    setBatchSpecialtyIds(activeIds)
    setBatchError('')
    setBatchModal('branch-specialties')
  }

  const openBatchRoomModal = () => {
    const defaultSpecialtyId = Number(options.specialties?.[0]?.id || 0)
    setBatchSpecialtyId(defaultSpecialtyId)
    const activeRooms = rows
      .filter((r) => Number(r.specialtyId || r.specialty?.id) === defaultSpecialtyId && r.isActive !== false)
      .map((r) => String(r.roomId || r.room?.id))
    setBatchRoomIds(activeRooms)
    setBatchError('')
    setBatchModal('room-specialties')
  }

  const handleSaveBatchBranch = async () => {
    if (!batchBranchId) {
      setBatchError('Vui lòng chọn cơ sở y tế.')
      return
    }
    setBatchSubmitting(true)
    setBatchError('')
    try {
      await batchBranchSpecialties(batchBranchId, batchSpecialtyIds)
      setSyncMsg('Đã cập nhật danh sách chuyên khoa cho cơ sở thành công.')
      setTimeout(() => setSyncMsg(''), 3500)
      setBatchModal(null)
      await load()
    } catch (err: any) {
      setBatchError(err?.response?.data?.message || err?.message || 'Gán chuyên khoa hàng loạt thất bại.')
    } finally {
      setBatchSubmitting(false)
    }
  }

  const handleSaveBatchRoom = async () => {
    if (!batchSpecialtyId) {
      setBatchError('Vui lòng chọn chuyên khoa.')
      return
    }
    setBatchSubmitting(true)
    setBatchError('')
    try {
      await batchRoomSpecialties(batchSpecialtyId, batchRoomIds)
      setSyncMsg('Đã cập nhật danh sách phòng khám cho chuyên khoa thành công.')
      setTimeout(() => setSyncMsg(''), 3500)
      setBatchModal(null)
      await load()
    } catch (err: any) {
      setBatchError(err?.response?.data?.message || err?.message || 'Gán phòng khám hàng loạt thất bại.')
    } finally {
      setBatchSubmitting(false)
    }
  }

  const handleAddSymptom = (text: string) => {
    if (!text) return
    const parts = text.split(/[,;\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (parts.length === 0) return
    const current: string[] = form.symptomTags || []
    const newTags = parts.filter((p) => !current.includes(p))
    if (newTags.length > 0) {
      setForm((prev: any) => ({ ...prev, symptomTags: [...current, ...newTags] }))
    }
    setSymptomInput('')
    setAiSuggestedSymptoms((prev) => prev.filter((s) => !parts.includes(s.toLowerCase())))
  }

  const handleRemoveSymptom = (tag: string) => {
    const current: string[] = form.symptomTags || []
    setForm((prev: any) => ({ ...prev, symptomTags: current.filter((t) => t !== tag) }))
  }

  const handleAiSuggest = async () => {
    if (!String(form.name || '').trim()) {
      setError('Vui lòng nhập Tên gói khám trước để AI có cơ sở phân tích triệu chứng.')
      return
    }
    setLoadingAiSymptoms(true)
    setError('')
    try {
      const specList = options.specialties || []
      const specObj = specList.find((s: any) => String(s.id) === String(form.specialtyId))
      const specName = specObj?.name || ''
      const res = await suggestSymptoms(form.name, specName)
      const current: string[] = (form.symptomTags || []).map((t: string) => t.toLowerCase())
      const newSuggestions = (res || []).filter((s: string) => !current.includes(s.toLowerCase()))
      setAiSuggestedSymptoms(newSuggestions)
    } catch {
      setError('Không thể lấy gợi ý triệu chứng từ AI lúc này.')
    } finally {
      setLoadingAiSymptoms(false)
    }
  }

  const handleAddAllSuggested = () => {
    const current: string[] = form.symptomTags || []
    const merged = [...new Set([...current, ...aiSuggestedSymptoms.map((s) => s.toLowerCase())])]
    setForm((prev: any) => ({ ...prev, symptomTags: merged }))
    setAiSuggestedSymptoms([])
  }

  useEffect(() => {
    setQ('')
    setFilterBranchId('')
    setFilterMethodCode('')
    setFilterSessionType('')
    setDetailItem(null)
    setSyncMsg('')
    setSortKey(cfg.columns.some(([k]) => k === 'id') ? 'id' : cfg.columns[0]?.[0] || 'name')
    setSortDir('asc')
  }, [resource, cfg])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await listCatalog(resource))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được dữ liệu.')
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setFilterBranchId('')
    setQ('')
    const resources = [
      ...new Set([
        ...cfg.fields.map((field) => field[3]).filter(Boolean),
        ...(resource === 'service-packages' ? ['rooms'] : []),
      ]),
    ] as string[]
    Promise.all(resources.map(async (name) => [name, await listCatalog(name)] as const))
      .then((entries) => setOptions(Object.fromEntries(entries)))
      .catch(() => undefined)
  }, [cfg, resource])

  const filtered = useMemo(() => {
    let list = rows
    const term = q.trim().toLowerCase()
    if (term) {
      list = list.filter((row) => `${row.code || ''} ${row.name || ''}`.toLowerCase().includes(term))
    }
    if (resource === 'rooms' && filterBranchId) {
      list = list.filter((row) => (row.branchId || row.branch?.id) === filterBranchId)
    }
    if (resource === 'service-packages') {
      if (filterBranchId) {
        list = list.filter((row) => {
          const hasInLinks = row.branchBookingMethods?.some(
            (l: any) => (l.branchBookingMethod?.branchId || l.branchBookingMethod?.branch?.id) === filterBranchId
          )
          const bId = row.branchBookingMethod?.branchId || row.branchBookingMethod?.branch?.id || row.branchId
          return hasInLinks || bId === filterBranchId
        })
      }
      if (filterMethodCode) {
        list = list.filter((row) => {
          const hasInLinks = row.branchBookingMethods?.some(
            (l: any) => (l.branchBookingMethod?.bookingMethod?.code) === filterMethodCode
          )
          const mCode = row.branchBookingMethod?.bookingMethod?.code || row.bookingMethodCode
          return hasInLinks || mCode === filterMethodCode
        })
      }
      if (filterSessionType) {
        list = list.filter((row) => (row.sessionType || 'ALL_DAY') === filterSessionType)
      }
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const valA = at(a, sortKey)
        const valB = at(b, sortKey)
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        const numA = Number(valA)
        const numB = Number(valB)
        const isNum =
          !isNaN(numA) &&
          !isNaN(numB) &&
          typeof valA !== 'boolean' &&
          typeof valB !== 'boolean' &&
          String(valA).trim() !== '' &&
          String(valB).trim() !== ''

        const cmp = isNum ? numA - numB : String(valA).localeCompare(String(valB), 'vi')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [q, rows, resource, filterBranchId, filterMethodCode, filterSessionType, sortKey, sortDir])

  const bookingMethodOptions = useMemo(() => {
    const raw = options['booking-methods'] || []
    const map = new Map<string, { code: string; name: string }>()
    raw.forEach((item: any) => {
      const code = item.code || item.type
      const name = item.displayName || item.name
      if (code && !map.has(code)) {
        map.set(code, { code, name })
      }
    })
    if (map.size === 0) {
      return [
        { code: 'HEALTH_PACKAGE', name: 'Gói khám sức khỏe' },
        { code: 'SPECIALTY_EXAM', name: 'Đặt khám theo chuyên khoa' },
        { code: 'CONSULTATION', name: 'Tư vấn khám bệnh' },
        { code: 'AFTER_HOURS', name: 'Đặt khám ngoài giờ' },
      ]
    }
    return Array.from(map.values())
  }, [options])

  const openCreate = () => {
    setSelected(null)
    const autoCode = ['service-packages', 'services', 'branches', 'rooms', 'medicines'].includes(resource)
      ? generateCode(resource)
      : ''
    const branchList = options.branches || []
    setForm({
      ...EMPTY,
      code: autoCode,
      price: '',
      sessionType: 'MORNING',
      activeDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      medicalServiceIds: [],
      schedules: [],
      applyAllBranches: false,
      branchIds: branchList.length > 0 ? [branchList[0].id] : [],
      branchId: filterBranchId || (branchList[0]?.id ?? ''),
      bookingMethodCodes: ['HEALTH_PACKAGE'],
      symptomTags: [],
    })
    setSymptomInput('')
    setAiSuggestedSymptoms([])
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    const branchList = options.branches || []
    const deployedBranchIds: string[] = [
      ...new Set([
        ...(row.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.branchId || l.branchBookingMethod?.branch?.id) || []),
        row.branchBookingMethod?.branchId || row.branchBookingMethod?.branch?.id,
      ].filter(Boolean))
    ] as string[]
    const deployedMethodCodes: string[] = [
      ...new Set([
        ...(row.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.bookingMethod?.code) || []),
        row.branchBookingMethod?.bookingMethod?.code,
      ].filter(Boolean))
    ] as string[]

    // Ưu tiên đọc từ cột riêng symptoms, nếu có dữ liệu cũ trong description thì fallback parse
    let baseDesc = row.description || ''
    let parsedTags: string[] = Array.isArray(row.symptoms) && row.symptoms.length > 0 ? [...row.symptoms] : []
    if (parsedTags.length === 0) {
      const match = baseDesc.match(/(?:Triệu chứng lâm sàng|Triệu chứng liên quan|Tags):\s*([^\n\r]+)/i)
      if (match && match[1]) {
        parsedTags = match[1].split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        baseDesc = baseDesc.replace(match[0], '').trim()
      }
    } else {
      baseDesc = baseDesc.replace(/(?:\r?\n)*Triệu chứng lâm sàng:.*$/s, '').trim()
    }

    setForm({
      ...EMPTY,
      ...row,
      description: baseDesc,
      symptoms: parsedTags,
      symptomTags: parsedTags,
      sessionType: row.sessionType || 'ALL_DAY',
      activeDaysOfWeek: Array.isArray(row.activeDaysOfWeek) && row.activeDaysOfWeek.length > 0 ? row.activeDaysOfWeek : [1, 2, 3, 4, 5, 6, 0],
      branchId: row.branchBookingMethod?.branchId || row.branchBookingMethod?.branch?.id || row.branchId || row.branch?.id || '',
      branchBookingMethodId: row.branchBookingMethodId || row.branchBookingMethod?.id || '',
      applyAllBranches: branchList.length > 0 && deployedBranchIds.length >= branchList.length,
      branchIds: deployedBranchIds.length > 0 ? deployedBranchIds : (branchList.length > 0 ? [branchList[0].id] : []),
      bookingMethodCodes: deployedMethodCodes.length > 0 ? deployedMethodCodes : ['HEALTH_PACKAGE'],
      medicalServiceIds: row.items?.map((item: any) => item.medicalServiceId) || [],
    })
    setSymptomInput('')
    setAiSuggestedSymptoms([])
    setModal('edit')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!['branch-specialties', 'room-specialties'].includes(resource) && !String(form.name || '').trim()) {
      return setError('Tên không được để trống.')
    }
    if (resource === 'rooms' && !String(form.branchId || '').trim()) {
      return setError('Vui lòng chọn chi nhánh.')
    }
    const payload = { ...form }
    // Lưu riêng vào trường symptoms dạng mảng chuẩn hóa
    if (['service-packages', 'specialties'].includes(resource)) {
      payload.symptoms = (form.symptomTags || []).map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      payload.description = String(form.description || '').replace(/(?:\r?\n)*Triệu chứng lâm sàng:.*$/s, '').trim() || null
      delete payload.symptomTags
    }

    if (resource === 'service-packages') {
      payload.activeDaysOfWeek = Array.isArray(form.activeDaysOfWeek) && form.activeDaysOfWeek.length > 0
        ? form.activeDaysOfWeek
        : [1, 2, 3, 4, 5, 6, 0]
      if (!payload.applyAllBranches && (!payload.branchIds || payload.branchIds.length === 0)) {
        return setError('Vui lòng chọn ít nhất một cơ sở y tế áp dụng.')
      }
      if (!payload.bookingMethodCodes || payload.bookingMethodCodes.length === 0) {
        return setError('Vui lòng chọn ít nhất một hình thức đặt khám.')
      }
    }
    if (!payload.code && ['service-packages', 'services', 'branches', 'rooms', 'medicines'].includes(resource)) {
      payload.code = generateCode(resource)
    }
    if (payload.price !== undefined && payload.price !== null) {
      payload.price = Number(payload.price) || 0
    }
    if (payload.unitPrice !== undefined && payload.unitPrice !== null) {
      payload.unitPrice = Number(payload.unitPrice) || 0
    }
    if (!['specialties', 'branch-specialties', 'room-specialties'].includes(resource) && !String(payload.code || '').trim()) {
      return setError('Mã không được để trống.')
    }
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') await createCatalog(resource, payload)
      else await updateCatalog(resource, selected.id, payload)
      setModal(null)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không lưu được dữ liệu.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: any) {
    if (!confirm(`Ngừng sử dụng ${cfg.singular} “${row.name}”?`)) return
    try {
      await deleteCatalog(resource, row.id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không cập nhật được dữ liệu.')
    }
  }

  const display = (key: string, value: any) =>
    key === 'items'
      ? `${value?.length || 0} dịch vụ`
      : key === 'sessionType'
        ? value === 'MORNING'
          ? 'Buổi sáng (07:30 - 11:30)'
          : value === 'AFTERNOON'
            ? 'Buổi chiều (13:30 - 17:00)'
            : value === 'EVENING'
              ? 'Ngoài giờ (17:00 - 20:30)'
              : value === 'OFFICE_HOURS'
                ? 'Giờ hành chính (07:30 - 17:00)'
                : 'Cả ngày & Ngoài giờ'
        : key === 'activeDaysOfWeek'
          ? formatDaysOfWeek(value)
          : key === 'schedules'
            ? `${value?.length || 0} ngày / ${
                value?.reduce((total: number, item: any) => total + (item.slots?.length || 0), 0) || 0
              } khung giờ`
            : key.endsWith('examDate') && value
              ? new Date(value).toLocaleDateString('vi-VN')
              : ['price', 'unitPrice'].includes(key)
                ? money(value)
                : key === 'durationMin'
                  ? `${value || 0} phút`
                  : key === 'isActive'
                    ? value ? 'Đang dùng' : 'Ngừng dùng'
                    : key === 'specialties'
                      ? (value?.map((item: any) => item.specialty?.name).filter(Boolean).join(', ') || '—')
                      : value ?? '—'

  const optionValue = (field: Field, option: any) => (field[3] === 'specialties' ? String(option.id) : option.id)

  const fieldOptions = (source?: string) => {
    const raw = options[source || ''] || []
    if (source === 'booking-methods') {
      if (form.branchId) {
        return raw.filter((option: any) => option.branchId === form.branchId)
      }
      return raw.map((option: any) => ({
        ...option,
        displayName: option.branch?.name ? `${option.displayName} (${option.branch.name})` : option.displayName,
      }))
    }
    return raw
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý danh mục & Cơ sở</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{cfg.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý {cfg.singular} và trạng thái áp dụng.</p>
        </div>
        <div className="flex items-center gap-2">
          {resource === 'branch-specialties' && (
            <button
              type="button"
              onClick={openBatchBranchModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-700" />
              Gán chuyên khoa hàng loạt
            </button>
          )}
          {resource === 'room-specialties' && (
            <button
              type="button"
              onClick={openBatchRoomModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-700" />
              Gán phòng khám hàng loạt
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm {cfg.singular}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {syncMsg && (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        {resource === 'service-packages' ? (
          <div className="border-b p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder="Tìm kiếm tên hoặc mã gói khám..."
                />
              </div>

              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">Tất cả cơ sở</option>
                {(options.branches || []).map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={filterMethodCode}
                onChange={(e) => setFilterMethodCode(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">Tất cả hình thức</option>
                {bookingMethodOptions.map((m: any) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                value={filterSessionType}
                onChange={(e) => setFilterSessionType(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">Tất cả buổi tiếp nhận</option>
                <option value="MORNING">Buổi sáng (07:30 - 11:30)</option>
                <option value="AFTERNOON">Buổi chiều (13:30 - 17:00)</option>
                <option value="EVENING">Ngoài giờ (17:00 - 20:30)</option>
                <option value="OFFICE_HOURS">Giờ hành chính (07:30 - 17:00)</option>
                <option value="ALL_DAY">Cả ngày & Ngoài giờ</option>
              </select>

              {(filterBranchId || filterMethodCode || filterSessionType || q) && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('')
                    setFilterBranchId('')
                    setFilterMethodCode('')
                    setFilterSessionType('')
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Xóa lọc
                </button>
              )}

              <button
                type="button"
                onClick={() => void load()}
                className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Làm mới
              </button>

              <button
                type="button"
                disabled={syncingVectors}
                onClick={async () => {
                  setSyncingVectors(true)
                  setError('')
                  setSyncMsg('')
                  try {
                    const res = await syncPackageVectors()
                    setSyncMsg(res?.message || 'Đã gửi yêu cầu đồng bộ vector vào hàng đợi RabbitMQ!')
                    setTimeout(() => setSyncMsg(''), 6000)
                  } catch (err: any) {
                    setError(err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu đồng bộ vector.')
                  } finally {
                    setSyncingVectors(false)
                  }
                }}
                className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                title="Đồng bộ Vector Embedding cho toàn bộ gói khám vào Redis qua RabbitMQ"
              >
                {syncingVectors ? 'Đang gửi task…' : '⚡ Đồng bộ Vector AI'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 border-b p-4">
            {resource === 'rooms' && (
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tất cả chi nhánh</option>
                {(options.branches || []).map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
              placeholder={`Tìm ${cfg.singular}...`}
            />
            <button onClick={() => void load()} className="rounded-md border px-3 text-xs font-bold">
              Làm mới
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          {resource === 'service-packages' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 w-[36%]">Gói dịch vụ & Mã</th>
                  <th className="px-5 py-3 w-[22%]">Cơ sở & Hình thức</th>
                  <th className="px-5 py-3 w-[22%]">Lịch tiếp nhận</th>
                  <th className="px-5 py-3 w-[10%]">Giá gói</th>
                  <th className="px-5 py-3 w-[10%] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                      Đang tải dữ liệu…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                      Chưa có dữ liệu hoặc không khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-semibold text-slate-900 text-sm leading-snug">{row.name}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                            {row.code}
                          </span>
                          {row.specialty?.name && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {row.specialty.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        {(() => {
                          const branchNames: string[] = [
                            ...new Set([
                              ...(row.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.branch?.name) || []),
                              row.branchBookingMethod?.branch?.name,
                            ].filter(Boolean))
                          ] as string[]
                          const methodNames: string[] = [
                            ...new Set([
                              ...(row.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.bookingMethod?.name) || []),
                              row.branchBookingMethod?.bookingMethod?.name,
                            ].filter(Boolean))
                          ] as string[]
                          return (
                            <>
                              <div className="flex flex-wrap gap-1">
                                {branchNames.length > 0 ? (
                                  branchNames.map((name) => (
                                    <span
                                      key={name}
                                      className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-800"
                                    >
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {methodNames.length > 0 ? (
                                  methodNames.map((name) => (
                                    <span
                                      key={name}
                                      className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200/60"
                                    >
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-400">—</span>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-medium text-slate-800 text-xs">
                          {formatDaysOfWeek(row.activeDaysOfWeek)}
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {SESSION_LABELS[row.sessionType || 'ALL_DAY'] || 'Cả ngày & Ngoài giờ'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-sm">{money(row.price)}</span>
                      </td>
                      <td className="px-5 py-3.5 align-top whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setDetailItem(row)}
                          className="mr-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="mr-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          className="rounded border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                        >
                          Ngừng dùng
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  {cfg.columns.map(([key, label]) => {
                    const isSorted = sortKey === key
                    return (
                      <th
                        key={key}
                        onClick={() => {
                          if (sortKey === key) {
                            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                          } else {
                            setSortKey(key)
                            setSortDir('asc')
                          }
                        }}
                        className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                        title={`Bấm để sắp xếp theo ${label}`}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <span>{label}</span>
                          <span
                            className={`text-[10px] ${isSorted ? 'text-emerald-700 font-bold' : 'text-slate-300'
                              }`}
                          >
                            {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={cfg.columns.length + 1} className="px-5 py-16 text-center text-slate-400">
                      Đang tải dữ liệu…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={cfg.columns.length + 1} className="px-5 py-16 text-center text-slate-400">
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-t">
                      {cfg.columns.map(([key]) => (
                        <td
                          key={key}
                          className={key === 'name' ? 'max-w-xs px-5 py-3 font-bold text-slate-900' : 'max-w-xs px-5 py-3 text-slate-600'}
                        >
                          {display(key, at(row, key))}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDetailItem(row)}
                          className="mr-2 rounded border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Chi tiết
                        </button>
                        <button onClick={() => openEdit(row)} className="mr-2 rounded border px-3 py-1.5 text-xs">
                          Sửa
                        </button>
                        <button onClick={() => void remove(row)} className="rounded border border-rose-200 px-3 py-1.5 text-xs text-rose-700">
                          Ngừng dùng
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <footer className="border-t px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} bản ghi</footer>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4">
          <form onSubmit={submit} className="my-6 w-full max-w-4xl rounded-lg bg-white shadow-2xl">
            <header className="flex justify-between border-b px-5 py-4">
              <b>
                {modal === 'create' ? 'Thêm' : 'Cập nhật'} {cfg.singular}
              </b>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {cfg.fields.map((field) => {
                const [key, label, type, source] = field
                const wide = type === 'textarea' || type === 'multiselect' || type === 'image'

                // Giao diện chọn nhiều cơ sở khi tạo mới hoặc cập nhật gói khám
                if (resource === 'service-packages' && key === 'branchId') {
                  const branchList = options.branches || []
                  return (
                    <div key={key} className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-600">Cơ sở y tế áp dụng</span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-normal text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(form.applyAllBranches)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setForm({
                                ...form,
                                applyAllBranches: checked,
                                branchIds: checked ? branchList.map((b: any) => b.id) : [],
                              })
                            }}
                          />
                          Áp dụng cho tất cả cơ sở
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-md border p-2">
                        {branchList.map((branch: any) => {
                          const isChecked = form.applyAllBranches || (form.branchIds || []).includes(branch.id)
                          return (
                            <label
                              key={branch.id}
                              className="flex items-center gap-2 p-2 rounded text-xs font-normal hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={Boolean(form.applyAllBranches)}
                                onChange={() => {
                                  const current = form.branchIds || []
                                  const next = current.includes(branch.id)
                                    ? current.filter((id: string) => id !== branch.id)
                                    : [...current, branch.id]
                                  setForm({ ...form, branchIds: next })
                                }}
                              />
                              <span className={isChecked ? 'font-medium text-slate-900' : 'text-slate-600'}>{branch.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // Giao diện chọn nhiều hình thức đặt khám khi tạo mới hoặc cập nhật gói khám
                if (resource === 'service-packages' && key === 'branchBookingMethodId') {
                  return (
                    <div key={key} className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-600">Hình thức đặt khám áp dụng</span>
                        <span className="text-[11px] text-slate-400 font-normal">Có thể chọn nhiều hình thức</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-md border p-2">
                        {bookingMethodOptions.map((method) => {
                          const isChecked = (form.bookingMethodCodes || []).includes(method.code)
                          return (
                            <label
                              key={method.code}
                              className="flex items-center gap-2 p-2 rounded text-xs font-normal hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const current = form.bookingMethodCodes || []
                                  const next = current.includes(method.code)
                                    ? current.filter((c: string) => c !== method.code)
                                    : [...current, method.code]
                                  setForm({ ...form, bookingMethodCodes: next })
                                }}
                              />
                              <span className={isChecked ? 'font-medium text-slate-900' : 'text-slate-600'}>{method.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <label key={key} className={`text-xs font-bold text-slate-600 ${wide ? 'sm:col-span-2' : ''}`}>
                    {label}
                    {type === 'textarea' ? (
                      <div className="mt-1.5 space-y-3">
                        <textarea
                          rows={3}
                          value={form[key] || ''}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          placeholder="Nhập nội dung mô tả, quyền lợi và hướng dẫn chuẩn bị..."
                          className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                        />

                        {/* COMPONENT TAGS TRIỆU CHỨNG LÂM SÀNG CHO GÓI KHÁM & CHUYÊN KHOA */}
                        {['service-packages', 'specialties'].includes(resource) && key === 'description' && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <span className="text-xs font-semibold text-slate-700">
                                  Triệu chứng lâm sàng liên quan
                                </span>
                                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                                  Nhập triệu chứng rồi nhấn <span className="font-medium text-slate-600">Enter</span> hoặc bấm Gợi ý triệu chứng.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleAiSuggest}
                                disabled={loadingAiSymptoms}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer disabled:opacity-50"
                              >
                                {loadingAiSymptoms && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
                                <span>{loadingAiSymptoms ? 'Đang phân tích...' : 'Gợi ý triệu chứng'}</span>
                              </button>
                            </div>

                            {/* Khung nhập tag clean tích hợp */}
                            <div className="rounded-lg border border-slate-200 bg-white p-2 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 transition">
                              <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                                {(form.symptomTags || []).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                                  >
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSymptom(tag)}
                                      className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                      title="Xóa triệu chứng"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}

                                <div className="flex-1 min-w-[240px] flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={symptomInput}
                                    onChange={(e) => setSymptomInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault()
                                        handleAddSymptom(symptomInput)
                                      } else if (e.key === 'Backspace' && !symptomInput && (form.symptomTags || []).length > 0) {
                                        const current = form.symptomTags || []
                                        handleRemoveSymptom(current[current.length - 1])
                                      }
                                    }}
                                    placeholder={
                                      (form.symptomTags || []).length > 0
                                        ? 'Thêm triệu chứng khác (nhấn Enter)...'
                                        : 'Nhập triệu chứng (ví dụ: mắc ói, đau đầu, tức ngực...)'
                                    }
                                    className="flex-1 border-none bg-transparent px-1.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                  />
                                  {symptomInput.trim() && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddSymptom(symptomInput)}
                                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer shrink-0"
                                    >
                                      Thêm
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Khay hiển thị gợi ý */}
                            {aiSuggestedSymptoms.length > 0 && (
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-slate-700">
                                    Gợi ý liên quan ({aiSuggestedSymptoms.length}):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleAddAllSuggested}
                                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                  >
                                    + Thêm tất cả
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                  {aiSuggestedSymptoms.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => handleAddSymptom(s)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
                                    >
                                      <span>+ {s}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : type === 'select' ? (
                      <select
                        value={form[key] ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [key]: source === 'specialties' ? Number(e.target.value) : e.target.value,
                            ...(key === 'branchId' ? { branchBookingMethodId: '' } : {}),
                          })
                        }
                        className="mt-1.5 w-full rounded-md border bg-white px-3 py-2.5 text-sm font-normal"
                      >
                        <option value="">Chọn {label.toLowerCase()}</option>
                        {fieldOptions(source).map((option) => (
                          <option key={option.id} value={optionValue(field, option)}>
                            {source === 'booking-methods' ? option.displayName : option.name}
                          </option>
                        ))}
                      </select>
                    ) : type === 'image' ? (
                      <div className="mt-1.5">
                        <ImageUploader
                          label=""
                          value={form[key] || ''}
                          onChange={(url) => setForm({ ...form, [key]: url })}
                          aspectRatio={key === 'iconUrl' ? 'square' : 'wide'}
                        />
                      </div>
                    ) : type === 'multiselect' ? (
                      <div className="mt-1.5 grid max-h-48 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
                        {fieldOptions(source).map((option) => {
                          const checked = (form[key] || []).includes(String(option.id))
                          return (
                            <label key={option.id} className="flex items-center gap-2 rounded p-2 text-xs font-normal hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm({
                                    ...form,
                                    [key]: checked
                                      ? form[key].filter((id: string) => id !== String(option.id))
                                      : [...(form[key] || []), String(option.id)],
                                  })
                                }
                              />
                              {option.name}
                            </label>
                          )
                        })}
                      </div>
                    ) : key === 'code' ? (
                      <div className="mt-1.5 flex gap-2">
                        <input
                          type="text"
                          value={form[key] ?? ''}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          placeholder="Mã tự động..."
                          className="w-full rounded-md border px-3 py-2.5 text-sm font-normal uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, code: generateCode(resource) })}
                          className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          title="Tự động tạo mã mới"
                        >
                          ⚡ Tạo mã
                        </button>
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={form[key] === 0 && modal === 'create' ? '' : (form[key] ?? '')}
                        placeholder={type === 'number' ? '0' : ''}
                        onFocus={(e) => {
                          if (type === 'number') {
                            e.target.select()
                          }
                        }}
                        onChange={(e) => {
                          if (type === 'number') {
                            const raw = e.target.value
                            if (raw === '') {
                              setForm({ ...form, [key]: '' })
                            } else {
                              const cleaned = raw.replace(/^0+(?=\d)/, '')
                              setForm({ ...form, [key]: cleaned === '' ? 0 : Number(cleaned) })
                            }
                          } else {
                            setForm({ ...form, [key]: e.target.value })
                          }
                        }}
                        className="mt-1.5 w-full rounded-md border px-3 py-2.5 text-sm font-normal"
                      />
                    )}
                    {['price', 'unitPrice'].includes(key) && Number(form[key]) > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-emerald-700 leading-normal">
                        <span className="font-semibold">{money(form[key])}</span>
                        {readVietnameseCurrency(form[key]) && (
                          <span className="text-slate-500 font-normal"> — {readVietnameseCurrency(form[key])}</span>
                        )}
                      </p>
                    )}
                  </label>
                )
              })}

              {resource === 'rooms' && (
                <label className="flex items-center gap-2 text-sm font-normal text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Đang sử dụng
                </label>
              )}

              {resource === 'service-packages' && (
                <section className="sm:col-span-2 space-y-4 rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                  {/* 1. Ngày hoạt động trong tuần */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Ngày hoạt động trong tuần</h3>
                        <p className="mt-0.5 text-xs font-normal text-slate-500">
                          Chỉ những ngày được chọn mới mở lịch cho bệnh nhân đặt gói khám.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const activeList: number[] = form.activeDaysOfWeek || [1, 2, 3, 4, 5, 6, 0]
                          const isAll = activeList.length === 7
                          const isWeekdays = activeList.length === 5 && [1, 2, 3, 4, 5].every((d) => activeList.includes(d))
                          const isWeekends = activeList.length === 2 && activeList.includes(6) && activeList.includes(0)
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, activeDaysOfWeek: [1, 2, 3, 4, 5, 6, 0] })}
                                className={`rounded border px-2.5 py-1 text-xs transition-colors ${isAll
                                    ? 'border-slate-500 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                                    : 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                                  }`}
                              >
                                Cả tuần (T2–CN)
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, activeDaysOfWeek: [1, 2, 3, 4, 5] })}
                                className={`rounded border px-2.5 py-1 text-xs transition-colors ${isWeekdays
                                    ? 'border-slate-500 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                                    : 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                                  }`}
                              >
                                Thứ 2 – Thứ 6 (Hành chính)
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, activeDaysOfWeek: [6, 0] })}
                                className={`rounded border px-2.5 py-1 text-xs transition-colors ${isWeekends
                                    ? 'border-slate-500 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                                    : 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                                  }`}
                              >
                                T7 & Chủ Nhật (Cuối tuần)
                              </button>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
                      {DAYS_OF_WEEK.map((day) => {
                        const activeList: number[] = form.activeDaysOfWeek || [1, 2, 3, 4, 5, 6, 0]
                        const isChecked = activeList.includes(day.id)
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              const next = isChecked
                                ? activeList.filter((d) => d !== day.id)
                                : [...activeList, day.id]
                              if (next.length === 0) return
                              setForm({ ...form, activeDaysOfWeek: next })
                            }}
                            className={`flex flex-col items-center justify-center rounded-lg border py-2.5 text-xs transition-all ${isChecked
                                ? 'border-slate-400 bg-white text-slate-900 font-bold shadow-xs ring-1 ring-slate-400/40'
                                : 'border-slate-200 bg-slate-50/70 text-slate-400 font-normal hover:bg-white hover:text-slate-600'
                              }`}
                          >
                            <span className="text-xs">{day.label}</span>
                            <span
                              className={`mt-1 text-[10px] ${isChecked ? 'font-semibold text-slate-700' : 'text-slate-400'
                                }`}
                            >
                              {isChecked ? 'Mở' : 'Nghỉ'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* 2. Khung giờ & Buổi tiếp nhận */}
                  <div>
                    <div className="mb-2">
                      <h3 className="text-sm font-bold text-slate-900">Khung giờ & Buổi tiếp nhận bệnh nhân</h3>
                      <p className="mt-0.5 text-xs font-normal text-slate-500">
                        Chọn buổi tiếp nhận để hệ thống tự động lọc khung giờ và bác sĩ trực phù hợp khi đặt lịch.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      <label
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${(form.sessionType || 'MORNING') === 'MORNING'
                            ? 'border-slate-800 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="MORNING"
                            checked={(form.sessionType || 'MORNING') === 'MORNING'}
                            onChange={() => setForm({ ...form, sessionType: 'MORNING' })}
                          />
                          <span className="text-xs font-bold text-slate-900">Chỉ buổi sáng</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">Khung giờ: 07:30 – 11:30</span>
                        <span className="text-[11px] text-slate-400">
                          Khuyên dùng cho gói tổng quát & xét nghiệm máu (cần nhịn ăn sáng).
                        </span>
                      </label>

                      <label
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${form.sessionType === 'AFTERNOON'
                            ? 'border-slate-800 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="AFTERNOON"
                            checked={form.sessionType === 'AFTERNOON'}
                            onChange={() => setForm({ ...form, sessionType: 'AFTERNOON' })}
                          />
                          <span className="text-xs font-bold text-slate-900">Chỉ buổi chiều</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">Khung giờ: 13:30 – 17:00</span>
                        <span className="text-[11px] text-slate-400">
                          Dành cho các gói khám tư vấn, chuyên sâu không làm xét nghiệm lúc đói.
                        </span>
                      </label>

                      <label
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${form.sessionType === 'EVENING'
                            ? 'border-slate-800 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="EVENING"
                            checked={form.sessionType === 'EVENING'}
                            onChange={() => setForm({ ...form, sessionType: 'EVENING' })}
                          />
                          <span className="text-xs font-bold text-slate-900">Khám ngoài giờ (Tối)</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">Khung giờ: 17:00 – 20:30</span>
                        <span className="text-[11px] text-slate-400">
                          Dành cho người bận rộn khám sau giờ làm việc hành chính.
                        </span>
                      </label>

                      <label
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${form.sessionType === 'OFFICE_HOURS'
                            ? 'border-slate-800 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="OFFICE_HOURS"
                            checked={form.sessionType === 'OFFICE_HOURS'}
                            onChange={() => setForm({ ...form, sessionType: 'OFFICE_HOURS' })}
                          />
                          <span className="text-xs font-bold text-slate-900">Giờ hành chính</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">Sáng & Chiều (07:30 – 17:00)</span>
                        <span className="text-[11px] text-slate-400">
                          Chỉ tiếp nhận trong giờ hành chính ban ngày, không nhận ca tối.
                        </span>
                      </label>

                      <label
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${form.sessionType === 'ALL_DAY'
                            ? 'border-slate-800 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="ALL_DAY"
                            checked={form.sessionType === 'ALL_DAY'}
                            onChange={() => setForm({ ...form, sessionType: 'ALL_DAY' })}
                          />
                          <span className="text-xs font-bold text-slate-900">Cả ngày & Ngoài giờ</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">Tất cả ca trực (07:30 – 20:30)</span>
                        <span className="text-[11px] text-slate-400">
                          Mở tất cả các ca trực của bác sĩ và phòng khám trong ngày.
                        </span>
                      </label>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t px-5 py-4">
              <button type="button" onClick={() => setModal(null)} className="rounded border px-4 py-2 text-sm">
                Hủy
              </button>
              <button disabled={saving} className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white">
                {saving ? 'Đang lưu…' : 'Lưu dữ liệu'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="my-auto w-full max-w-2xl max-h-[88vh] flex flex-col rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-slate-900 text-base">
                  Chi tiết {cfg.singular.toLowerCase()}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {detailItem.code || detailItem.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                aria-label="Đóng"
              >
                ×
              </button>
            </header>

            {/* Content Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {resource === 'service-packages' ? (
                <>
                  {/* Name & Specialty */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{detailItem.name}</h3>
                    {detailItem.specialty?.name && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Chuyên khoa: <span className="font-medium text-slate-700">{detailItem.specialty.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Giá niêm yết</span>
                      <span className="font-bold text-emerald-700 text-sm">{money(detailItem.price)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Thời lượng khám</span>
                      <span className="font-medium text-slate-700">
                        {detailItem.durationMin || detailItem.durationMinutes ? `${detailItem.durationMin || detailItem.durationMinutes} phút` : '30 phút'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phòng khám</span>
                      <span className="font-medium text-slate-700">{detailItem.room?.name || 'Mặc định'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Trạng thái</span>
                      <span className={`font-medium ${detailItem.isActive !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {detailItem.isActive !== false ? 'Đang hoạt động' : 'Tạm ngừng'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <div className="space-y-3 text-xs pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Ngày khám trong tuần</span>
                        <span className="text-slate-600">{formatDaysOfWeek(detailItem.activeDaysOfWeek)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Ca trực tiếp nhận</span>
                        <span className="text-slate-600">
                          {SESSION_LABELS[detailItem.sessionType || 'ALL_DAY'] || 'Cả ngày & Ngoài giờ'}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const branchNames: string[] = [
                        ...new Set([
                          ...(detailItem.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.branch?.name) || []),
                          detailItem.branchBookingMethod?.branch?.name,
                        ].filter(Boolean))
                      ] as string[]
                      const methodNames: string[] = [
                        ...new Set([
                          ...(detailItem.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.bookingMethod?.name) || []),
                          detailItem.branchBookingMethod?.bookingMethod?.name,
                        ].filter(Boolean))
                      ] as string[]
                      return (
                        <>
                          <div className="border-t border-slate-100 pt-3">
                            <span className="font-semibold text-slate-700 block mb-1.5">
                              Cơ sở y tế triển khai ({branchNames.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {branchNames.length > 0 ? (
                                branchNames.map((name) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                                  >
                                    {name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3">
                            <span className="font-semibold text-slate-700 block mb-1.5">
                              Hình thức đặt khám áp dụng ({methodNames.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {methodNames.length > 0 ? (
                                methodNames.map((name) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                                  >
                                    {name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    })()}

                    {detailItem.description && (
                      <div className="border-t border-slate-100 pt-3">
                        <span className="font-semibold text-slate-700 block mb-1">Mô tả & Hướng dẫn chuẩn bị</span>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                          {detailItem.description}
                        </p>
                      </div>
                    )}

                    {Array.isArray(detailItem.items) && detailItem.items.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <span className="font-semibold text-slate-700 block mb-1.5">
                          Dịch vụ y tế đi kèm ({detailItem.items.length})
                        </span>
                        <div className="divide-y divide-slate-100 max-h-32 overflow-y-auto">
                          {detailItem.items.map((it: any, idx: number) => (
                            <div key={idx} className="py-1.5 flex items-center justify-between text-xs text-slate-600">
                              <span>{it.medicalService?.name || it.medicalServiceName || it.medicalServiceId}</span>
                              {it.quantity && <span className="text-slate-400">x{it.quantity}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Generic detail fallback */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  {cfg.columns.map(([key, label]) => (
                    <div key={key}>
                      <span className="text-slate-400 block text-[11px] mb-0.5">{label}</span>
                      <span className="font-medium text-slate-800">{display(key, at(detailItem, key))}</span>
                    </div>
                  ))}
                  {detailItem.description && (
                    <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                      <span className="text-slate-400 block text-[11px] mb-0.5">Mô tả</span>
                      <p className="text-slate-600 whitespace-pre-line">{detailItem.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="rounded border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailItem
                  setDetailItem(null)
                  openEdit(item)
                }}
                className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
              >
                Chỉnh sửa
              </button>
            </footer>
          </div>
        </div>
      )}
      {/* Batch Branch-Specialties Modal */}
      {batchModal === 'branch-specialties' && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !batchSubmitting && setBatchModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gán chuyên khoa theo cơ sở hàng loạt</h2>
                  <p className="text-xs text-slate-500">Chọn cơ sở và tích chọn các chuyên khoa muốn kích hoạt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {batchError && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  {batchError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cơ sở y tế / Chi nhánh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={batchBranchId}
                  onChange={(e) => {
                    const bId = e.target.value
                    setBatchBranchId(bId)
                    const activeIds = rows
                      .filter((r) => String(r.branchId || r.branch?.id) === String(bId))
                      .map((r) => String(r.specialtyId || r.specialty?.id))
                    setBatchSpecialtyIds(activeIds)
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">-- Chọn cơ sở y tế --</option>
                  {(options.branches || []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Danh sách chuyên khoa áp dụng ({batchSpecialtyIds.length}/{(options.specialties || []).length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchSpecialtyIds((options.specialties || []).map((s: any) => String(s.id)))}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setBatchSpecialtyIds([])}
                      className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/50">
                  {(options.specialties || []).map((spec: any) => {
                    const checked = batchSpecialtyIds.includes(String(spec.id))
                    return (
                      <label
                        key={spec.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const id = String(spec.id)
                            if (e.target.checked) {
                              setBatchSpecialtyIds((prev) => [...prev, id])
                            } else {
                              setBatchSpecialtyIds((prev) => prev.filter((x) => x !== id))
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                        />
                        <span className="truncate">{spec.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={batchSubmitting}
                onClick={() => setBatchModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={batchSubmitting || !batchBranchId}
                onClick={handleSaveBatchBranch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer"
              >
                {batchSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu gán chuyên khoa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Room-Specialties Modal */}
      {batchModal === 'room-specialties' && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !batchSubmitting && setBatchModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gán phòng khám theo chuyên khoa hàng loạt</h2>
                  <p className="text-xs text-slate-500">Chọn chuyên khoa và tích chọn các phòng khám tương ứng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {batchError && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  {batchError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chuyên khoa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={batchSpecialtyId}
                  onChange={(e) => {
                    const sId = e.target.value
                    setBatchSpecialtyId(sId)
                    const activeRooms = rows
                      .filter((r) => String(r.specialtyId || r.specialty?.id) === String(sId))
                      .map((r) => String(r.roomId || r.room?.id))
                    setBatchRoomIds(activeRooms)
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">-- Chọn chuyên khoa --</option>
                  {(options.specialties || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Danh sách phòng khám áp dụng ({batchRoomIds.length}/{(options.rooms || []).length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchRoomIds((options.rooms || []).map((r: any) => String(r.id)))}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setBatchRoomIds([])}
                      className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/50">
                  {(options.rooms || []).map((rm: any) => {
                    const checked = batchRoomIds.includes(String(rm.id))
                    const branchName = rm.branch?.name || ''
                    return (
                      <label
                        key={rm.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const id = String(rm.id)
                            if (e.target.checked) {
                              setBatchRoomIds((prev) => [...prev, id])
                            } else {
                              setBatchRoomIds((prev) => prev.filter((x) => x !== id))
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{rm.name}</p>
                          {branchName && <p className="text-[10px] text-slate-400 truncate">{branchName}</p>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={batchSubmitting}
                onClick={() => setBatchModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={batchSubmitting || !batchSpecialtyId}
                onClick={handleSaveBatchRoom}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer"
              >
                {batchSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu gán phòng khám
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
