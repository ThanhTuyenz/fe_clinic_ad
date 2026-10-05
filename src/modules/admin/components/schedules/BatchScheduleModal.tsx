'use client'

import React, { useMemo, useState } from 'react'
import { Calendar, Clock, Layers, Check, AlertCircle } from 'lucide-react'
import { createBatchSchedules } from '../../services/schedules'
import { AdminButton, AdminInput, AdminModal, AdminSelect } from '@/common/components/ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  doctors: any[]
  branches: any[]
  rooms: any[]
  onSuccess?: () => Promise<void> | void
  initialDoctorId?: string
  initialBranchId?: string
  initialDate?: string
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2', short: 'T2' },
  { id: 2, label: 'Thứ 3', short: 'T3' },
  { id: 3, label: 'Thứ 4', short: 'T4' },
  { id: 4, label: 'Thứ 5', short: 'T5' },
  { id: 5, label: 'Thứ 6', short: 'T6' },
  { id: 6, label: 'Thứ 7', short: 'T7' },
  { id: 0, label: 'Chủ Nhật', short: 'CN' },
]

const SHIFT_OPTIONS = [
  { id: 'morning', label: 'Ca Sáng', start: '08:00', end: '12:00' },
  { id: 'afternoon', label: 'Ca Chiều', start: '13:30', end: '17:30' },
  { id: 'evening', label: 'Ca Tối', start: '17:30', end: '20:30' },
]

const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function BatchScheduleModal({
  isOpen,
  onClose,
  doctors,
  branches,
  rooms,
  onSuccess,
  initialDoctorId,
  initialBranchId,
  initialDate,
}: Props) {
  const today = useMemo(() => formatYMD(new Date()), [])
  const defaultEnd = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14) // +2 weeks
    return formatYMD(d)
  }, [])

  const [doctorId, setDoctorId] = useState(initialDoctorId || doctors[0]?.doctor?.id || doctors[0]?.id || '')
  const [branchId, setBranchId] = useState(initialBranchId || branches[0]?.id || '')
  const [roomId, setRoomId] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5])
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>(['morning'])
  const [slotDurationMin, setSlotDurationMin] = useState(30)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultMsg, setResultMsg] = useState('')

  // Sync initial values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const targetDocId = initialDoctorId || doctorId || doctors[0]?.doctor?.id || doctors[0]?.id || ''
      setDoctorId(targetDocId)

      const doc = doctors.find((d) => (d.doctor?.id || d.id) === targetDocId)
      const autoBranchId =
        initialBranchId ||
        doc?.branchAssignments?.[0]?.branchId ||
        doc?.branchAssignments?.[0]?.branch?.id ||
        branchId ||
        branches[0]?.id ||
        ''
      setBranchId(autoBranchId)
      setRoomId('')

      if (initialDate) {
        setStartDate(initialDate)
        setEndDate(initialDate)
        const d = new Date(`${initialDate}T00:00:00`)
        setSelectedDays([d.getDay()])
      } else {
        setStartDate(formatYMD(new Date()))
        setEndDate(defaultEnd)
        setSelectedDays([1, 3, 5])
      }

      setError('')
      setResultMsg('')
    }
  }, [isOpen, initialDoctorId, initialBranchId, initialDate, doctors, branches, defaultEnd])

  const availableRooms = useMemo(() => {
    if (!branchId) return rooms
    return rooms.filter((rm) => rm.branchId === branchId || rm.branch?.id === branchId)
  }, [rooms, branchId])

  const handleDoctorChange = (docId: string) => {
    setDoctorId(docId)
    const doc = doctors.find((d) => (d.doctor?.id || d.id) === docId)
    const autoBranchId =
      doc?.branchAssignments?.[0]?.branchId ||
      doc?.branchAssignments?.[0]?.branch?.id ||
      branchId ||
      branches[0]?.id ||
      ''
    if (autoBranchId) {
      setBranchId(autoBranchId)
      setRoomId('')
    }
  }

  const handleBranchChange = (bId: string) => {
    setBranchId(bId)
    setRoomId('')
  }

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId))
    } else {
      setSelectedDays([...selectedDays, dayId].sort())
    }
  }

  const applyDayPreset = (type: 'all' | 'workdays' | 't246' | 't357') => {
    if (type === 'all') setSelectedDays([1, 2, 3, 4, 5, 6, 0])
    if (type === 'workdays') setSelectedDays([1, 2, 3, 4, 5])
    if (type === 't246') setSelectedDays([1, 3, 5])
    if (type === 't357') setSelectedDays([2, 4, 6])
  }

  const toggleShift = (shiftId: string) => {
    if (selectedShiftIds.includes(shiftId)) {
      if (selectedShiftIds.length === 1) return // Keep at least one shift selected
      setSelectedShiftIds(selectedShiftIds.filter((id) => id !== shiftId))
    } else {
      setSelectedShiftIds([...selectedShiftIds, shiftId])
    }
  }


  const setRangePreset = (weeks: number) => {
    const start = new Date(startDate || today)
    const end = new Date(start)
    if (weeks === 0) {
      setEndDate(formatYMD(start))
      setSelectedDays([start.getDay()])
    } else {
      end.setDate(end.getDate() + weeks * 7)
      setEndDate(formatYMD(end))
    }
  }

  const selectedShifts = useMemo(() => {
    return SHIFT_OPTIONS.filter((s) => selectedShiftIds.includes(s.id))
  }, [selectedShiftIds])

  // Calculate slots per day across selected shifts
  const slotsPerDay = useMemo(() => {
    if (selectedShifts.length === 0) return 0
    return selectedShifts.reduce((acc, s) => {
      const [sh, sm] = s.start.split(':').map(Number)
      const [eh, em] = s.end.split(':').map(Number)
      const diffMin = eh * 60 + em - (sh * 60 + sm)
      if (diffMin <= 0) return acc
      return acc + Math.floor(diffMin / (slotDurationMin || 30))
    }, 0)
  }, [selectedShifts, slotDurationMin])

  // Calculate estimated days in date range matching selected days
  const estimatedDays = useMemo(() => {
    if (!startDate || !endDate || selectedDays.length === 0) return 0
    const s = new Date(`${startDate}T00:00:00`)
    const e = new Date(`${endDate}T00:00:00`)
    if (s > e) return 0
    let count = 0
    const curr = new Date(s)
    while (curr <= e) {
      if (selectedDays.includes(curr.getDay())) count++
      curr.setDate(curr.getDate() + 1)
    }
    return count
  }, [startDate, endDate, selectedDays])

  const totalEstimatedShifts = estimatedDays * selectedShifts.length
  const totalEstimatedSlots = estimatedDays * slotsPerDay

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId || !branchId) return setError('Vui lòng chọn bác sĩ và chi nhánh làm việc.')
    if (selectedDays.length === 0) return setError('Vui lòng chọn ít nhất 1 ngày trong tuần.')
    if (selectedShifts.length === 0) return setError('Vui lòng chọn ít nhất 1 ca làm việc.')
    if (!startDate || !endDate) return setError('Vui lòng chọn khoảng ngày áp dụng.')
    if (startDate > endDate) return setError('Ngày bắt đầu không được sau ngày kết thúc.')

    setLoading(true)
    setError('')
    setResultMsg('')

    try {
      const shiftsPayload = selectedShifts.map((s) => ({
        startTime: s.start,
        endTime: s.end,
      }))

      const res = await createBatchSchedules({
        doctorId,
        branchId,
        roomId: roomId || undefined,
        startDate,
        endDate,
        daysOfWeek: selectedDays,
        shifts: shiftsPayload,
        slotDurationMin,
        capacityPerSlot: 1,
        status: 'OPEN',
      })

      if (res.createdCount === 0) {
        setError(res.message || 'Không có ca làm việc nào được tạo (do trùng lịch hoặc bác sĩ báo nghỉ).')
        return
      }

      setResultMsg(res.message || `Đã tạo thành công ${res.createdCount} ca làm việc.`)
      if (onSuccess) await onSuccess()
      setTimeout(() => {
        onClose()
      }, 1400)
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu ca làm việc.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Phân ca làm việc Bác sĩ"
      maxWidth="3xl"
      loading={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {resultMsg && (
          <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{resultMsg}</span>
          </div>
        )}

        {/* Doctor, Branch, Room */}
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminSelect
            label="Bác sĩ tiếp nhận"
            required
            value={doctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
          >
            <option value="">-- Chọn bác sĩ --</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.doctor?.id || d.id}>
                {d.academicRank ? `${d.academicRank} ` : ''}
                {d.fullName}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Chi nhánh làm việc"
            required
            value={branchId}
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Phòng khám"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">-- Để trống hoặc chọn phòng --</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.code}
              </option>
            ))}
          </AdminSelect>
        </div>

        {/* Days of week */}
        <div className="rounded border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-700" />
              Ngày trực trong tuần:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => applyDayPreset('t246')}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                T2, T4, T6
              </button>
              <button
                type="button"
                onClick={() => applyDayPreset('t357')}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                T3, T5, T7
              </button>
              <button
                type="button"
                onClick={() => applyDayPreset('workdays')}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                T2 – T6
              </button>
              <button
                type="button"
                onClick={() => applyDayPreset('all')}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Cả tuần
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.id)
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`flex flex-col items-center justify-center rounded py-2 text-xs font-bold transition border cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-medium opacity-90">{day.label}</span>
                  <span className="text-xs font-bold">{day.short}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Shift Selection & Slot Duration */}
        <div className="rounded border border-slate-200 bg-slate-50/70 p-3">
          <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-700" />
            Chọn Ca làm việc trong ngày (Có thể chọn nhiều ca):
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_210px] items-start">
            <div className="grid grid-cols-3 gap-2">
              {SHIFT_OPTIONS.map((p) => {
                const isSelected = selectedShiftIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleShift(p.id)}
                    className={`flex flex-col items-center justify-center rounded border py-2 px-2 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-emerald-700 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {p.start} – {p.end}
                    </span>
                  </button>
                )
              })}
            </div>

            <AdminSelect
              label="Thời lượng / lượt khám"
              value={String(slotDurationMin)}
              onChange={(e) => setSlotDurationMin(Number(e.target.value) || 30)}
            >
              <option value="15">15 phút / lượt</option>
              <option value="20">20 phút / lượt</option>
              <option value="30">30 phút / lượt (Chuẩn)</option>
              <option value="45">45 phút / lượt</option>
              <option value="60">60 phút / lượt</option>
            </AdminSelect>
          </div>
        </div>

        {/* Date Range & Quick Presets */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Khoảng thời gian áp dụng:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRangePreset(0)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-white cursor-pointer"
              >
                Chỉ 1 ngày
              </button>
              <button
                type="button"
                onClick={() => setRangePreset(2)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-white cursor-pointer"
              >
                +2 Tuần
              </button>
              <button
                type="button"
                onClick={() => setRangePreset(4)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-white cursor-pointer"
              >
                +4 Tuần (1 Tháng)
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Từ ngày"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <AdminInput
              label="Đến ngày"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Realtime Summary Preview */}
          <div className="mt-3 flex items-center justify-between rounded bg-slate-50 px-3.5 py-2 text-xs text-slate-700 border border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="h-3.5 w-3.5 text-emerald-700" />
              Dự kiến sinh:{' '}
              <b className="text-slate-900">{totalEstimatedShifts} ca làm việc</b>
              <span className="text-slate-500 font-normal">
                ({selectedShifts.length} ca/ngày × {estimatedDays} ngày)
              </span>
            </span>
            <span className="font-bold text-emerald-800 bg-white px-2.5 py-1 rounded border border-slate-200 text-xs shadow-2xs">
              {totalEstimatedSlots} tổng slot khám
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <AdminButton variant="secondary" disabled={loading} onClick={onClose}>
            Đóng
          </AdminButton>
          <AdminButton
            variant="primary"
            type="submit"
            disabled={loading || totalEstimatedShifts === 0}
            loading={loading}
            icon={Layers}
          >
            Lưu {totalEstimatedShifts} ca làm việc
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}
