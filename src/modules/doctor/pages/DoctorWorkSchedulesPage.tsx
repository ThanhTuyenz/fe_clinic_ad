'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from '@/modules/admin/services/schedules'
import { listUsers } from '@/modules/admin/services/users'
import { listCatalog } from '@/modules/catalog/services/catalogService'
import { listClinicRooms } from '@/modules/admin/services/clinicRooms'
import DoctorLeaveModal from '@/modules/admin/components/schedules/DoctorLeaveModal'
import BatchScheduleModal from '@/modules/admin/components/schedules/BatchScheduleModal'
import CopyWeekModal from '@/modules/admin/components/schedules/CopyWeekModal'
import {
  Search,
  Calendar,
  List,
  Plus,
  RefreshCw,
  CalendarOff,
  Copy,
  Layers,
  AlertTriangle,
  Building2,
  Pencil,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react'
import {
  AdminButton,
  AdminPageHeader,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminModal,
  AdminInput,
  AdminSelect,
  StatusBadge,
} from '@/common/components/ui'

const SCHEDULE_TABLE_COLUMNS = [
  { label: 'Bác sĩ' },
  { label: 'Chi nhánh & Phòng' },
  { label: 'Ngày' },
  { label: 'Khung giờ' },
  { label: 'Tiến độ đặt' },
  { label: 'Thời lượng' },
  { label: 'Trạng thái' },
  { label: 'Thao tác', align: 'right' as const },
]

const SLOT_DURATIONS = [15, 20, 30, 45, 60]
const EMPTY_FORM = {
  doctorId: '',
  branchId: '',
  roomId: '',
  workDate: new Date().toISOString().slice(0, 10),
  startTime: '08:00',
  endTime: '12:00',
  slotDurationMin: '30',
  status: 'OPEN',
}

const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const getMonday = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

const formatDayHeader = (d: Date) => {
  const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return `${days[d.getDay()]}\n${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function DoctorWorkSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterBranch, setFilterBranch] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [doctorLeaveOpen, setDoctorLeaveOpen] = useState(false)
  const [copyWeekModalOpen, setCopyWeekModalOpen] = useState(false)

  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const todayStr = useMemo(() => formatYMD(new Date()), [])

  const weekDays = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + i)
      ),
    [currentMonday]
  )
  const startDateStr = formatYMD(weekDays[0])
  const endDateStr = formatYMD(weekDays[6])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [scRes, uRes, bRes, rRes] = await Promise.all([
        listSchedules({
          doctorId: filterDoctor || undefined,
          branchId: filterBranch || undefined,
          startDate: viewMode === 'grid' ? startDateStr : undefined,
          endDate: viewMode === 'grid' ? endDateStr : undefined,
        }),
        listUsers(),
        listCatalog('branches').catch(() => []),
        listClinicRooms().catch(() => []),
      ])
      setSchedules(scRes || [])
      setDoctors(uRes.data?.filter((u: any) => String(u.role || u.userType).toLowerCase() === 'doctor') || [])
      setBranches(bRes || [])
      setRooms(rRes || [])
    } catch (e: any) {
      setError(e?.message || 'Không tải được lịch làm việc.')
    } finally {
      setLoading(false)
    }
  }, [filterDoctor, filterBranch, viewMode, startDateStr, endDateStr])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const availableRooms = useMemo(() => {
    if (!form.branchId) return rooms
    return rooms.filter((rm) => rm.branchId === form.branchId || rm.branch?.id === form.branchId)
  }, [rooms, form.branchId])

  const schedulesMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    schedules.forEach((sc) => {
      if (filterBranch && sc.branchId !== filterBranch) return
      const dStr = String(sc.workDate).slice(0, 10)
      const k1 = `${sc.doctorId}_${dStr}`
      if (!map[k1]) map[k1] = []
      map[k1].push(sc)
      if (sc.doctor?.userId && sc.doctor?.userId !== sc.doctorId) {
        const k2 = `${sc.doctor.userId}_${dStr}`
        if (!map[k2]) map[k2] = []
        map[k2].push(sc)
      }
    })
    return map
  }, [schedules, filterBranch])

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return doctors.filter((d) => {
      const dId = d.doctor?.id || d.id
      const uId = d.id
      const name = (d.fullName || d.doctor?.fullName || '').toLowerCase()
      if (q && !name.includes(q)) return false
      if (filterDoctor && dId !== filterDoctor && uId !== filterDoctor) return false
      if (filterBranch) {
        const hasA = d.branchAssignments?.some(
          (ba: any) => ba.branchId === filterBranch || ba.branch?.id === filterBranch
        )
        const hasS = schedules.some(
          (sc: any) => (sc.doctorId === dId || sc.doctor?.userId === uId) && sc.branchId === filterBranch
        )
        if (!hasA && !hasS) return false
      }
      return true
    })
  }, [doctors, schedules, filterDoctor, filterBranch, searchTerm])

  const openScheduleModal = (doctorId?: string, dateStr?: string) => {
    setSelectedDoctorId(doctorId || filterDoctor || '')
    setSelectedDate(dateStr || '')
    setScheduleModalOpen(true)
  }

  const openEdit = (row: any) => {
    setSelected(row)
    setForm({
      doctorId: row.doctorId,
      branchId: row.branchId,
      roomId: row.roomId || '',
      workDate: row.workDate,
      startTime: row.startTime,
      endTime: row.endTime,
      slotDurationMin: String(row.slotDurationMin || 30),
      status: row.status || 'OPEN',
    })
    setError('')
    setEditModal(true)
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.doctorId || !form.branchId || !form.workDate)
      return setError('Vui lòng chọn bác sĩ, chi nhánh và ngày.')
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        roomId: form.roomId || null,
        slotDurationMin: Number(form.slotDurationMin) || 30,
      }
      await updateSchedule(selected.id, payload)
      setEditModal(false)
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Không lưu được lịch làm việc.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: any) => {
    const occupied = row.occupiedCount || 0
    const warningText =
      occupied > 0
        ? `⚠️ CẢNH BÁO: Ca trực ngày ${row.workDate} (${row.startTime} – ${row.endTime}) đang có ${occupied} bệnh nhân đặt hẹn!\n\nBạn có chắc chắn muốn xóa không?`
        : `Bạn có chắc chắn muốn hủy ca trực ngày ${row.workDate} (${row.startTime} – ${row.endTime})?`

    if (!confirm(warningText)) return

    try {
      await deleteSchedule(row.id)
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Không xóa được ca trực.')
    }
  }

  const toggleStatus = async (row: any) => {
    try {
      await updateSchedule(row.id, { status: row.status === 'OPEN' ? 'CLOSED' : 'OPEN' })
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Không đổi được trạng thái.')
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý lịch làm việc"
        title="Lịch làm việc & Ca trực Bác sĩ"
        description="Phân ca trực định kỳ, điều phối phòng làm việc, theo dõi tiến độ đặt hẹn."
      >
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton
            variant="outline"
            icon={Copy}
            onClick={() => setCopyWeekModalOpen(true)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Sao chép tuần
          </AdminButton>

          <AdminButton
            variant="outline"
            icon={CalendarOff}
            onClick={() => setDoctorLeaveOpen(true)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Báo bác sĩ nghỉ
          </AdminButton>

          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => openScheduleModal()}
          >
            Phân ca làm việc
          </AdminButton>
        </div>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 flex items-center justify-between rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-xs font-bold text-rose-800 hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Toolbar filters & Navigation */}
      <div className="mt-5 flex items-center justify-between gap-2.5 rounded border border-slate-200 bg-white p-2.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          {viewMode === 'grid' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  title="Tuần trước"
                  onClick={() =>
                    setCurrentMonday(
                      new Date(
                        currentMonday.getFullYear(),
                        currentMonday.getMonth(),
                        currentMonday.getDate() - 7
                      )
                    )
                  }
                  className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
                >
                  ‹
                </button>
                <span className="px-1.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                  {startDateStr.split('-').reverse().slice(0, 2).join('/')} – {endDateStr.split('-').reverse().join('/')}
                </span>
                <button
                  type="button"
                  title="Tuần sau"
                  onClick={() =>
                    setCurrentMonday(
                      new Date(
                        currentMonday.getFullYear(),
                        currentMonday.getMonth(),
                        currentMonday.getDate() + 7
                      )
                    )
                  }
                  className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
                >
                  ›
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCurrentMonday(getMonday(new Date()))}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Hôm nay
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              placeholder="Tìm bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32 sm:w-36 rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="max-w-[135px] truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-emerald-600 shrink-0"
          >
            <option value="">Tất cả Chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="max-w-[135px] truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-emerald-600 shrink-0"
          >
            <option value="">Tất cả Bác sĩ</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.doctor?.id || d.id}>
                {d.academicRank ? `${d.academicRank} ` : ''}
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Legend for 3 shifts */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded px-2 py-1">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Sáng</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Chiều</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Tối</span>
            </span>
          </div>

          <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Lịch Tuần
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Danh Sách
            </button>
          </div>

          <AdminButton
            variant="secondary"
            size="xs"
            icon={RefreshCw}
            loading={loading}
            onClick={() => void loadData()}
            title="Làm mới dữ liệu"
          />
        </div>
      </div>

      {/* WEEK GRID VIEW */}
      {viewMode === 'grid' ? (
        <section className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white shadow-xs">
          <div className="grid min-w-[1150px] grid-cols-[250px_repeat(7,1fr)]">
            <div className="bg-slate-100/90 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center border-r-2 border-slate-200 border-b-2 border-slate-200">
              <span>Bác sĩ</span>
              <span className="text-[10px] text-slate-500 font-semibold">({filteredDoctors.length})</span>
            </div>

            {weekDays.map((date) => {
              const dStr = formatYMD(date)
              const isToday = dStr === todayStr
              return (
                <div
                  key={date.toISOString()}
                  className={`p-2.5 text-center text-xs font-bold whitespace-pre-line relative border-r border-slate-200 border-b-2 border-slate-200 ${isToday
                      ? 'bg-emerald-50/90 text-emerald-950 font-bold border-b-emerald-600'
                      : 'bg-slate-50/90 text-slate-700'
                    }`}
                >
                  {isToday && (
                    <span className="absolute top-1 right-1 rounded bg-emerald-600 px-1 py-0.2 text-[8px] font-bold text-white uppercase shadow-2xs">
                      Hôm nay
                    </span>
                  )}
                  {formatDayHeader(date)}
                </div>
              )
            })}

            {loading ? (
              <div className="col-span-8 p-12 text-center text-sm text-slate-400">
                Đang tải lịch làm việc...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="col-span-8 p-12 text-center text-sm text-slate-400">
                Không tìm thấy bác sĩ phù hợp với bộ lọc.
              </div>
            ) : (
              filteredDoctors.map((doc, docIdx) => {
                const docId = doc.doctor?.id || doc.id
                const isEvenRow = docIdx % 2 === 1
                const totalDoctorShifts = weekDays.reduce(
                  (acc, d) => acc + (schedulesMap[`${docId}_${formatYMD(d)}`]?.length || 0),
                  0
                )

                return (
                  <div key={docId} className="contents">
                    {/* Doctor Info Column */}
                    <div
                      className={`p-3 flex items-start gap-2.5 border-r-2 border-slate-200 border-b-2 border-slate-200 ${
                        isEvenRow ? 'bg-slate-50/70' : 'bg-white'
                      }`}
                    >
                      {/* Avatar / Initials */}
                      <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200/80 shrink-0 mt-0.5 shadow-2xs">
                        {doc.avatarUrl ? (
                          <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover rounded" />
                        ) : (
                          doc.fullName
                            ?.split(' ')
                            .slice(-2)
                            .map((w: string) => w[0])
                            .join('')
                            .toUpperCase() || 'BS'
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <b className="block text-xs font-bold text-slate-900 leading-tight truncate" title={doc.fullName}>
                          {doc.academicRank ? `${doc.academicRank} ` : ''}
                          {doc.fullName}
                        </b>

                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 truncate max-w-[110px]">
                            {doc.doctor?.specialties?.[0]?.specialty?.name || 'Đa khoa'}
                          </span>
                          {totalDoctorShifts > 0 ? (
                            <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                              {totalDoctorShifts} ca
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400">0 ca</span>
                          )}
                        </div>

                        {!filterBranch && doc.branchAssignments?.[0]?.branch?.name && (
                          <p
                            className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate"
                            title={doc.branchAssignments[0].branch.name}
                          >
                            <Building2 className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.branchAssignments[0].branch.name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 7 Days of the Week */}
                    {weekDays.map((date) => {
                      const dStr = formatYMD(date)
                      const isToday = dStr === todayStr
                      const daySc = schedulesMap[`${docId}_${dStr}`] || []

                      return (
                        <div
                          key={dStr}
                          className={`min-h-[110px] p-1.5 transition group relative border-r border-slate-200 border-b-2 border-slate-200 ${isToday
                              ? 'bg-emerald-50/25 hover:bg-emerald-50/40'
                              : isEvenRow
                                ? 'bg-slate-50/40 hover:bg-slate-100/50'
                                : 'bg-white hover:bg-slate-50/60'
                            }`}
                        >
                          <div className="space-y-1.5">
                            {daySc.map((sc) => {
                              const isOpen = sc.status === 'OPEN'
                              const isMorning = sc.startTime < '12:00'
                              const isEvening = sc.startTime >= '17:30'
                              const shiftConfig = isMorning
                                ? {
                                    tag: 'Sáng',
                                    accentBorder: 'border-l-amber-500',
                                    tagBadge: 'bg-amber-50 text-amber-800 border-amber-200/80',
                                  }
                                : isEvening
                                ? {
                                    tag: 'Tối',
                                    accentBorder: 'border-l-indigo-500',
                                    tagBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
                                  }
                                : {
                                    tag: 'Chiều',
                                    accentBorder: 'border-l-sky-500',
                                    tagBadge: 'bg-sky-50 text-sky-800 border-sky-200/80',
                                  }

                              const occupied = sc.occupiedCount || 0
                              const capacity = sc.totalCapacity || sc.slots?.length || 0
                              const isFull = occupied >= capacity && capacity > 0

                              return (
                                <div
                                  key={sc.id}
                                  onClick={() => openEdit(sc)}
                                  className={`group/card relative rounded border border-slate-200/90 border-l-[3px] ${
                                    shiftConfig.accentBorder
                                  } bg-white p-2 text-[10px] transition cursor-pointer shadow-2xs hover:shadow-xs hover:border-slate-300 ${
                                    !isOpen ? 'opacity-70 bg-rose-50/20' : ''
                                  }`}
                                >
                                  {/* Row 1: Shift tag + Time + Hover Actions */}
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${shiftConfig.tagBadge}`}
                                      >
                                        {shiftConfig.tag}
                                      </span>
                                      <span className="font-bold text-slate-800 text-[11px] whitespace-nowrap">
                                        {sc.startTime} – {sc.endTime}
                                      </span>
                                    </div>

                                    {/* Hover micro-toolbar */}
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-0.5 bg-white shadow-2xs border border-slate-200 rounded px-1 py-0.5"
                                    >
                                      <button
                                        type="button"
                                        title="Chỉnh sửa ca trực"
                                        onClick={() => openEdit(sc)}
                                        className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition"
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title={isOpen ? 'Khóa ca trực' : 'Mở ca trực'}
                                        onClick={() => void toggleStatus(sc)}
                                        className="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer transition"
                                      >
                                        {isOpen ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                                      </button>
                                      <button
                                        type="button"
                                        title="Xóa ca trực"
                                        onClick={() => void remove(sc)}
                                        className="p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition"
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Row 2: Room name and Occupancy badge */}
                                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100">
                                    <span
                                      className="font-medium text-slate-600 truncate max-w-[85px]"
                                      title={sc.room?.name || sc.room?.code || 'Chưa xếp phòng'}
                                    >
                                      {sc.room?.name || sc.room?.code || 'Chưa xếp P.'}
                                    </span>

                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        occupied === 0
                                          ? 'bg-slate-50 text-slate-500 border border-slate-200/60'
                                          : isFull
                                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      }`}
                                      title={`Đã có ${occupied} / ${capacity} bệnh nhân đặt lịch`}
                                    >
                                      {occupied}/{capacity} slot
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Quick add shift button */}
                          <button
                            onClick={() => openScheduleModal(docId, dStr)}
                            className={`mt-1.5 w-full rounded border border-dashed py-1.5 text-[10px] font-semibold transition cursor-pointer ${daySc.length === 0
                                ? 'border-slate-200 text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                                : 'border-transparent text-slate-400 opacity-0 group-hover:opacity-100 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                          >
                            + Ca
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </section>
      ) : (
        /* TABLE VIEW */
        <AdminTableCard className="mt-4">
          <AdminTable minWidth="min-w-[950px]">
            <AdminTableHead columns={SCHEDULE_TABLE_COLUMNS} />
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableLoading colSpan={8} message="Đang tải lịch…" />
              ) : schedules.length === 0 ? (
                <AdminTableEmpty colSpan={8} message="Chưa có ca trực nào." />
              ) : (
                schedules.map((row) => {
                  const occupied = row.occupiedCount || 0
                  const capacity = row.totalCapacity || row.slots?.length || 0
                  const isFull = occupied >= capacity && capacity > 0

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {row.doctor?.academicRank ? `${row.doctor.academicRank} ` : ''}
                        {row.doctor?.fullName || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <p className="font-semibold text-slate-700">{row.branch?.name || 'Chi nhánh'}</p>
                        <p className="text-emerald-800">{row.room?.name || 'Chưa xếp phòng'}</p>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-800">{row.workDate}</td>
                      <td className="px-5 py-3 text-xs font-bold text-emerald-900">
                        {row.startTime} – {row.endTime}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${occupied === 0
                              ? 'bg-slate-100 text-slate-600'
                              : isFull
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {occupied}/{capacity} slot
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{row.slotDurationMin || 30} ph/ca</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <StatusBadge
                          status={row.status === 'OPEN' ? 'open' : 'closed'}
                          label={row.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                          tone={row.status === 'OPEN' ? 'emerald' : 'rose'}
                        />
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <AdminButton variant="secondary" size="xs" onClick={() => openEdit(row)}>
                            Sửa
                          </AdminButton>
                          <AdminButton
                            variant="outline"
                            size="xs"
                            className={
                              row.status === 'OPEN'
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }
                            onClick={() => void toggleStatus(row)}
                          >
                            {row.status === 'OPEN' ? 'Đóng' : 'Mở'}
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => void remove(row)}
                          >
                            Xóa
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </AdminTable>
        </AdminTableCard>
      )}

      {/* EDIT SINGLE SHIFT MODAL */}
      <AdminModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Cập nhật ca làm việc"
        maxWidth="lg"
        loading={saving}
      >
        <form onSubmit={submitEdit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminSelect
              label="Chi nhánh"
              required
              value={form.branchId}
              onChange={(e) =>
                setForm((prev: any) => ({ ...prev, branchId: e.target.value, roomId: '' }))
              }
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              label="Phòng khám"
              value={form.roomId}
              onChange={(e) => setForm((prev: any) => ({ ...prev, roomId: e.target.value }))}
            >
              <option value="">-- Để trống hoặc chọn phòng --</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || r.code}
                </option>
              ))}
            </AdminSelect>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <AdminInput
              label="Ngày làm việc"
              type="date"
              required
              value={form.workDate}
              onChange={(e) => setForm((prev: any) => ({ ...prev, workDate: e.target.value }))}
            />
            <AdminInput
              label="Bắt đầu"
              type="time"
              required
              value={form.startTime}
              onChange={(e) => setForm((prev: any) => ({ ...prev, startTime: e.target.value }))}
            />
            <AdminInput
              label="Kết thúc"
              type="time"
              required
              value={form.endTime}
              onChange={(e) => setForm((prev: any) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>

          <AdminSelect
            label="Thời lượng / lượt khám"
            value={form.slotDurationMin}
            onChange={(e) => setForm((prev: any) => ({ ...prev, slotDurationMin: e.target.value }))}
          >
            {SLOT_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} phút / lượt {d === 30 ? '(Chuẩn)' : ''}
              </option>
            ))}
          </AdminSelect>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton variant="secondary" disabled={saving} onClick={() => setEditModal(false)}>
              Hủy
            </AdminButton>
            <AdminButton variant="primary" type="submit" loading={saving}>
              Cập nhật ca làm việc
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* PRIMARY SCHEDULE CREATION MODAL */}
      <BatchScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        doctors={doctors}
        branches={branches}
        rooms={rooms}
        initialBranchId={filterBranch}
        initialDoctorId={selectedDoctorId}
        initialDate={selectedDate}
        onSuccess={loadData}
      />

      {/* COPY WEEK MODAL */}
      <CopyWeekModal
        isOpen={copyWeekModalOpen}
        onClose={() => setCopyWeekModalOpen(false)}
        currentMonday={currentMonday}
        branchId={filterBranch}
        branches={branches}
        onSuccess={loadData}
      />

      {/* DOCTOR LEAVE MODAL */}
      <DoctorLeaveModal
        isOpen={doctorLeaveOpen}
        onClose={() => setDoctorLeaveOpen(false)}
        doctors={doctors}
        onSuccess={loadData}
      />
    </>
  )
}
