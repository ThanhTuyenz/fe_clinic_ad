'use client'

import { clinicPeriod } from '@/common/constants/clinic-sessions'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from '@/modules/admin/services/schedules'
import { listDoctors } from '@/modules/admin/services/doctors'
import { listBranches } from '@/modules/admin/services/branches'
import { listSpecialties } from '@/modules/admin/services/specialties'
import { listClinicRooms } from '@/modules/admin/services/clinicRooms'
import { listUsers } from '@/modules/admin/services/users'
import { listCatalog } from '@/modules/catalog/services/catalogService'
import { getStaffSession, staffRole } from '@/modules/admin/utils/staffSession'
import {
  BatchScheduleModal,
  CopyWeekModal,
  DoctorLeaveModal,
  EditShiftModal,
  EMPTY_FORM,
  formatYMD,
  getMonday,
  ScheduleMonthView,
  ScheduleTableView,
  ScheduleToolbar,
  ScheduleWeekGridView,
  ShiftDetailModal,
} from '../components/schedules'
import { AlertTriangle, CalendarOff, Copy, Plus } from 'lucide-react'
import { usePermission } from '@/common/hooks/usePermission'
import { AppPermission } from '@/common/constants/permissions.constant'
import { AdminButton, AdminPageHeader } from '@/common/components/ui'

export interface DoctorWorkSchedulesPageProps {
  initialDoctorId?: string
  readOnly?: boolean
  isDoctorRole?: boolean
  initialBranchId?: string
}

export default function DoctorWorkSchedulesPage({
  initialDoctorId,
  readOnly = false,
  isDoctorRole = false,
  initialBranchId,
}: DoctorWorkSchedulesPageProps = {}) {
  const { hasPermission } = usePermission()
  const canCreate = !readOnly && hasPermission(AppPermission.SCHEDULE_CREATE)
  const canUpdate = !readOnly && hasPermission(AppPermission.SCHEDULE_UPDATE)
  const canDelete = !readOnly && hasPermission(AppPermission.SCHEDULE_DELETE)
  const session = getStaffSession()
  const currentRole = staffRole(session?.user)
  const isDoctor = Boolean(isDoctorRole || currentRole === 'doctor')
  const isBranchManager = currentRole === 'branch_manager'

  const assignedBranch = useMemo(() => {
    const user = session?.user
    return (
      user?.branchAssignments?.find((b: any) => b.isPrimary)?.branch ||
      user?.branchAssignments?.[0]?.branch ||
      null
    )
  }, [session?.user])

  const assignedBranchId = useMemo(() => {
    return assignedBranch?.id || session?.user?.branchAssignments?.[0]?.branchId || ''
  }, [assignedBranch, session?.user])

  const defaultBranchId = isBranchManager
    ? assignedBranchId || initialBranchId || ''
    : initialBranchId || ''

  const [schedules, setSchedules] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterBranch, setFilterBranch] = useState(defaultBranchId)
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [filterDoctor, setFilterDoctor] = useState(initialDoctorId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [specialties, setSpecialties] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'month' | 'table'>('grid')
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date())

  useEffect(() => {
    if (initialDoctorId) {
      setFilterDoctor(initialDoctorId)
    }
  }, [initialDoctorId])

  useEffect(() => {
    if (isBranchManager && assignedBranchId) {
      setFilterBranch(assignedBranchId)
    } else if (initialBranchId) {
      setFilterBranch(initialBranchId)
    }
  }, [isBranchManager, assignedBranchId, initialBranchId])

  const effectiveBranch = isBranchManager && assignedBranchId ? assignedBranchId : filterBranch

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [doctorLeaveOpen, setDoctorLeaveOpen] = useState(false)
  const [copyWeekModalOpen, setCopyWeekModalOpen] = useState(false)

  // Shift Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDetailShift, setSelectedDetailShift] = useState<any>(null)

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

  // Các ngày hiển thị trong lịch tháng (tròn các tuần từ thứ 2 đến CN)
  const monthDays = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startMonday = getMonday(firstDay)

    const days: Date[] = []
    const curr = new Date(startMonday)
    while (days.length < 42) {
      days.push(new Date(curr))
      curr.setDate(curr.getDate() + 1)
      if (curr.getMonth() !== month && curr.getDay() === 1 && days.length >= 28) {
        break
      }
    }
    return days
  }, [currentMonthDate])

  const monthStartDateStr = useMemo(() => formatYMD(monthDays[0]), [monthDays])
  const monthEndDateStr = useMemo(() => formatYMD(monthDays[monthDays.length - 1]), [monthDays])

  const currentDoctor = useMemo(() => {
    if (!isDoctor) return null
    const targetId = initialDoctorId || session?.user?.doctor?.id || session?.user?.doctorId || session?.user?.id || ''
    return (
      doctors.find((d: any) => {
        const dId = d.doctor?.id || d.id
        const uId = d.userId || d.user?.id || d.id
        return (
          (targetId && (dId === targetId || uId === targetId)) ||
          (session?.user?.doctor?.id && (dId === session.user.doctor.id || uId === session.user.doctor.id)) ||
          (session?.user?.id && (uId === session.user.id || dId === session.user.id)) ||
          (session?.user?.email && (d.email === session.user.email || d.user?.email === session.user.email)) ||
          (session?.user?.fullName && d.fullName?.toLowerCase() === session.user.fullName?.toLowerCase())
        )
      }) || null
    )
  }, [doctors, isDoctor, initialDoctorId, session?.user])

  const targetDoctorId = useMemo(() => {
    if (isDoctor) {
      return (
        currentDoctor?.id ||
        currentDoctor?.doctor?.id ||
        initialDoctorId ||
        session?.user?.doctor?.id ||
        session?.user?.doctorId ||
        session?.user?.id ||
        ''
      )
    }
    return filterDoctor || ''
  }, [isDoctor, currentDoctor, initialDoctorId, session?.user, filterDoctor])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const activeStartDate = viewMode === 'grid' ? startDateStr : viewMode === 'month' ? monthStartDateStr : undefined
      const activeEndDate = viewMode === 'grid' ? endDateStr : viewMode === 'month' ? monthEndDateStr : undefined

      const [scRes, docRes, bRes, rRes, spRes] = await Promise.all([
        listSchedules({
          doctorId: targetDoctorId || undefined,
          branchId: effectiveBranch || undefined,
          startDate: activeStartDate,
          endDate: activeEndDate,
        }).catch(() => []),
        listDoctors().catch(async () => {
          if (!isDoctor) {
            const u = await listUsers().catch(() => ({ data: [] }))
            return u.data?.filter((x: any) => String(x.role || x.userType).toLowerCase() === 'doctor') || []
          }
          return []
        }),
        listBranches().catch(() => listCatalog('branches')).catch(() => []),
        listClinicRooms().catch(() => []),
        listSpecialties().catch(() => listCatalog('specialties')).catch(() => []),
      ])

      const normalizedDoctors = (docRes || []).map((d: any) => ({
        ...d,
        id: d.id,
        userId: d.userId || d.user?.id,
        fullName: d.fullName || d.user?.fullName || 'Bác sĩ',
        avatarUrl: d.avatarUrl || d.user?.avatarUrl,
        academicRank: d.academicRank,
        specialties: d.specialties || d.doctor?.specialties || [],
        doctor: {
          id: d.id,
          userId: d.userId || d.user?.id,
          fullName: d.fullName || d.user?.fullName || 'Bác sĩ',
          academicRank: d.academicRank,
          specialties: d.specialties || d.doctor?.specialties || [],
        },
        branchAssignments: d.branchAssignments || [],
      }))

      setSchedules(scRes || [])
      setDoctors(normalizedDoctors)
      setBranches(bRes || [])
      setRooms(rRes || [])
      setSpecialties(spRes || [])
    } catch (e: any) {
      setError(e?.message || 'Không tải được lịch làm việc.')
    } finally {
      setLoading(false)
    }
  }, [targetDoctorId, effectiveBranch, viewMode, startDateStr, endDateStr, monthStartDateStr, monthEndDateStr, isDoctor])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const availableRooms = useMemo(() => {
    const bId = form.branchId || effectiveBranch
    if (!bId) return rooms
    return rooms.filter((rm) => rm.branchId === bId || rm.branch?.id === bId)
  }, [rooms, form.branchId, effectiveBranch])

  const schedulesMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    schedules.forEach((sc) => {
      if (effectiveBranch && sc.branchId !== effectiveBranch) return
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
  }, [schedules, effectiveBranch])

  const filteredDoctors = useMemo(() => {
    let list = doctors
    if (isDoctor) {
      if (currentDoctor) {
        list = [currentDoctor]
      } else if (targetDoctorId) {
        const matched = doctors.filter(
          (d) => (d.doctor?.id || d.id) === targetDoctorId || (d.userId || d.id) === targetDoctorId
        )
        if (matched.length > 0) list = matched
      }
    }

    const q = searchTerm.trim().toLowerCase()
    return list.filter((d) => {
      const dId = d.doctor?.id || d.id
      const uId = d.userId || d.id
      const name = (d.fullName || d.doctor?.fullName || '').toLowerCase()
      if (q && !name.includes(q)) return false
      if (!isDoctor && filterDoctor && dId !== filterDoctor && uId !== filterDoctor) return false
      if (filterSpecialty) {
        const hasSpec =
          d.doctor?.specialties?.some(
            (sp: any) =>
              String(sp.specialtyId || sp.specialty?.id || sp.id) === String(filterSpecialty)
          ) ||
          d.specialties?.some(
            (sp: any) =>
              String(sp.specialtyId || sp.specialty?.id || sp.id) === String(filterSpecialty)
          ) ||
          String(d.doctor?.specialtyId) === String(filterSpecialty)
        if (!hasSpec) return false
      }
      if (effectiveBranch) {
        const hasA = d.branchAssignments?.some(
          (ba: any) => ba.branchId === effectiveBranch || ba.branch?.id === effectiveBranch
        )
        const hasS = schedules.some(
          (sc: any) => (sc.doctorId === dId || sc.doctor?.userId === uId) && sc.branchId === effectiveBranch
        )
        if (!hasA && !hasS) return false
      }
      return true
    })
  }, [doctors, schedules, isDoctor, currentDoctor, targetDoctorId, filterDoctor, effectiveBranch, filterSpecialty, searchTerm])

  const availableDoctorsForSelect = useMemo(() => {
    if (isDoctor) {
      return currentDoctor ? [currentDoctor] : (filteredDoctors.length > 0 ? [filteredDoctors[0]] : [])
    }
    if (!filterSpecialty) return doctors
    return doctors.filter((d) => {
      return (
        d.doctor?.specialties?.some(
          (sp: any) =>
            String(sp.specialtyId || sp.specialty?.id || sp.id) === String(filterSpecialty)
        ) ||
        d.specialties?.some(
          (sp: any) =>
            String(sp.specialtyId || sp.specialty?.id || sp.id) === String(filterSpecialty)
        ) ||
        String(d.doctor?.specialtyId) === String(filterSpecialty)
      )
    })
  }, [doctors, filteredDoctors, currentDoctor, isDoctor, filterSpecialty])

  const filteredSchedules = useMemo(() => {
    return schedules.filter((row) => {
      if (effectiveBranch && row.branchId !== effectiveBranch) return false
      const doc = doctors.find(
        (d) => (d.doctor?.id || d.id) === row.doctorId || d.id === row.doctor?.userId
      )
      if (isDoctor) {
        const dId = doc?.doctor?.id || doc?.id || row.doctorId
        const uId = doc?.userId || doc?.id || row.doctor?.userId
        if (targetDoctorId && dId !== targetDoctorId && uId !== targetDoctorId) return false
      } else if (filterDoctor && row.doctorId !== filterDoctor && doc?.id !== filterDoctor) {
        return false
      }
      if (filterSpecialty) {
        const hasSpec =
          doc?.doctor?.specialties?.some(
            (sp: any) =>
              String(sp.specialtyId || sp.specialty?.id || sp.id) === String(filterSpecialty)
          ) ||
          doc?.specialties?.some(
            (sp: any) =>
              String(sp.specialtyId || sp.specialty?.id || sp.id) === String(filterSpecialty)
          ) ||
          String(doc?.doctor?.specialtyId) === String(filterSpecialty)
        if (!hasSpec) return false
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase()
        const docName = (row.doctor?.fullName || doc?.fullName || '').toLowerCase()
        if (!docName.includes(q)) return false
      }
      return true
    })
  }, [schedules, effectiveBranch, filterDoctor, targetDoctorId, isDoctor, filterSpecialty, searchTerm, doctors])

  const activeBranchName = useMemo(() => {
    if (!effectiveBranch) return 'Tất cả cơ sở'
    return branches.find((b) => b.id === effectiveBranch)?.name || assignedBranch?.name || 'VitaCare Clinic'
  }, [effectiveBranch, branches, assignedBranch])

  const weekStats = useMemo(() => {
    let morningCount = 0
    let afternoonCount = 0
    let eveningCount = 0
    let totalOccupied = 0
    let totalCapacity = 0

    filteredSchedules.forEach((sc) => {
      if (clinicPeriod(sc.startTime) === 'MORNING') morningCount++
      else if (clinicPeriod(sc.startTime) === 'EVENING') eveningCount++
      else afternoonCount++

      totalOccupied += sc.occupiedCount || 0
      totalCapacity += sc.totalCapacity || sc.slots?.length || 0
    })

    return {
      totalShifts: filteredSchedules.length,
      morningCount,
      afternoonCount,
      eveningCount,
      totalOccupied,
      totalCapacity,
    }
  }, [filteredSchedules])

  const openScheduleModal = (doctorId?: string, dateStr?: string) => {
    if (!canCreate) return
    setSelectedDoctorId(doctorId || filterDoctor || '')
    setSelectedDate(dateStr || '')
    setScheduleModalOpen(true)
  }

  const handleCardClick = (sc: any) => {
    if (isDoctor || !canUpdate) {
      setSelectedDetailShift(sc)
      setDetailModalOpen(true)
    } else {
      openEdit(sc)
    }
  }

  const openEdit = (row: any) => {
    if (!canUpdate) return
    setSelected(row)
    setForm({
      doctorId: row.doctorId,
      branchId: row.branchId || effectiveBranch,
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
    if (!canDelete) return
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
    if (!canUpdate) return
    try {
      await updateSchedule(row.id, { status: row.status === 'OPEN' ? 'CLOSED' : 'OPEN' })
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Không đổi được trạng thái.')
    }
  }

  return (
    <>
      {/* Header chỉ hiển thị với vai trò Quản trị viên / Quản lý */}
      {!isDoctor && (
        <AdminPageHeader
          eyebrow="Quản lý lịch làm việc"
          title="Lịch làm việc & Ca trực Bác sĩ"
          description="Phân ca trực định kỳ, điều phối phòng làm việc, theo dõi tiến độ đặt hẹn."
        >
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton
              variant="outline"
              icon={Copy}
              disabled={!canCreate}
              onClick={() => setCopyWeekModalOpen(true)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Sao chép tuần
            </AdminButton>

            <AdminButton
              variant="outline"
              icon={CalendarOff}
              disabled={!canUpdate}
              onClick={() => setDoctorLeaveOpen(true)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Báo bác sĩ nghỉ
            </AdminButton>

            <AdminButton
              variant="primary"
              icon={Plus}
              disabled={!canCreate}
              onClick={() => openScheduleModal()}
            >
              Phân ca làm việc
            </AdminButton>
          </div>
        </AdminPageHeader>
      )}

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

      {/* Toolbar bộ lọc & điều hướng tuần/tháng/danh sách */}
      <ScheduleToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentMonday={currentMonday}
        setCurrentMonday={setCurrentMonday}
        currentMonthDate={currentMonthDate}
        setCurrentMonthDate={setCurrentMonthDate}
        weekDays={weekDays}
        isDoctor={isDoctor}
        isBranchManager={isBranchManager}
        assignedBranch={assignedBranch}
        branches={branches}
        specialties={specialties}
        availableDoctorsForSelect={availableDoctorsForSelect}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterSpecialty={filterSpecialty}
        setFilterSpecialty={setFilterSpecialty}
        filterDoctor={filterDoctor}
        setFilterDoctor={setFilterDoctor}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        onRefresh={() => void loadData()}
      />

      {/* VIEW THEO CHẾ ĐỘ: LỊCH TUẦN / LỊCH THÁNG / BẢNG DANH SÁCH */}
      {viewMode === 'grid' ? (
        <ScheduleWeekGridView
          weekDays={weekDays}
          todayStr={todayStr}
          filteredDoctors={filteredDoctors}
          schedulesMap={schedulesMap}
          isDoctor={isDoctor}
          activeBranchName={activeBranchName}
          weekStats={weekStats}
          onCardClick={handleCardClick}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onOpenEdit={openEdit}
          onToggleStatus={toggleStatus}
          onRemove={remove}
          onOpenScheduleModal={openScheduleModal}
        />
      ) : viewMode === 'month' ? (
        <ScheduleMonthView
          monthDays={monthDays}
          todayStr={todayStr}
          currentMonthDate={currentMonthDate}
          schedules={schedules}
          schedulesMap={schedulesMap}
          isDoctor={isDoctor}
          targetDoctorId={targetDoctorId}
          filterDoctor={filterDoctor}
          activeBranchName={activeBranchName}
          weekStats={weekStats}
          onCardClick={handleCardClick}
          onOpenEdit={openEdit}
          onToggleStatus={toggleStatus}
          onRemove={remove}
        />
      ) : (
        <ScheduleTableView
          filteredSchedules={filteredSchedules}
          loading={loading}
          isDoctor={isDoctor}
          onCardClick={handleCardClick}
          onOpenEdit={openEdit}
          onToggleStatus={toggleStatus}
          onRemove={remove}
        />
      )}

      {/* MODAL CHI TIẾT CA TRỰC CHO BÁC SĨ HOẶC CHẾ ĐỘ XEM */}
      <ShiftDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        shift={selectedDetailShift}
      />

      {/* MODAL CẬP NHẬT 1 CA TRỰC */}
      <EditShiftModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        form={form}
        setForm={setForm}
        branches={branches}
        availableRooms={availableRooms}
        saving={saving}
        onSubmit={submitEdit}
      />

      {/* PRIMARY SCHEDULE CREATION MODAL */}
      <BatchScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        doctors={doctors}
        branches={isBranchManager && assignedBranch ? [assignedBranch] : branches}
        rooms={
          isBranchManager && assignedBranch
            ? rooms.filter((r) => r.branchId === assignedBranch.id || r.branch?.id === assignedBranch.id)
            : rooms
        }
        initialBranchId={effectiveBranch}
        initialDoctorId={selectedDoctorId}
        initialDate={selectedDate}
        onSuccess={loadData}
      />

      {/* COPY WEEK MODAL */}
      <CopyWeekModal
        isOpen={copyWeekModalOpen}
        onClose={() => setCopyWeekModalOpen(false)}
        currentMonday={currentMonday}
        branchId={effectiveBranch}
        branches={isBranchManager && assignedBranch ? [assignedBranch] : branches}
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
