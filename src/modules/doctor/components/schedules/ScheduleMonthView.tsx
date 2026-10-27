'use client'

import { clinicPeriod } from '@/common/constants/clinic-sessions'

import React from 'react'
import {
  Building2,
  CalendarCheck,
  Clock,
  Users,
  Pencil,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react'
import { formatYMD } from './scheduleUtils'

interface ScheduleMonthViewProps {
  monthDays: Date[]
  todayStr: string
  currentMonthDate: Date
  schedules: any[]
  schedulesMap: Record<string, any[]>
  canUpdate?: boolean
  canDelete?: boolean
  isDoctor: boolean
  targetDoctorId: string
  filterDoctor: string
  activeBranchName: string
  weekStats: {
    totalShifts: number
    morningCount: number
    afternoonCount: number
    eveningCount: number
    totalOccupied: number
    totalCapacity: number
  }
  onCardClick: (shift: any) => void
  onOpenEdit: (shift: any) => void
  onToggleStatus: (shift: any) => void
  onRemove: (shift: any) => void
}

export default function ScheduleMonthView({
  monthDays,
  todayStr,
  currentMonthDate,
  schedules,
  schedulesMap,
  isDoctor,
  canUpdate = false,
  canDelete = false,
  targetDoctorId,
  filterDoctor,
  activeBranchName,
  weekStats,
  onCardClick,
  onOpenEdit,
  onToggleStatus,
  onRemove,
}: ScheduleMonthViewProps) {
  return (
    <div className="space-y-3">
      <section className="mt-3 overflow-hidden rounded border border-slate-200 bg-white shadow-xs">
        {/* Header 7 Thứ trong tuần */}
        <div className="grid grid-cols-7 w-full border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700 text-center">
          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((dayName, idx) => (
            <div
              key={dayName}
              className={`py-2 px-1 border-r border-slate-200 last:border-r-0 ${
                idx >= 5 ? 'text-amber-800' : ''
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Lưới các ô ngày trong tháng */}
        <div className="grid grid-cols-7 w-full text-slate-800">
          {monthDays.map((date) => {
            const dStr = formatYMD(date)
            const isToday = dStr === todayStr
            const isCurrentMonth = date.getMonth() === currentMonthDate.getMonth()

            // Lấy ca trực trong ngày của bác sĩ đang xem
            const daySc = isDoctor
              ? schedulesMap[`${targetDoctorId}_${dStr}`] ||
                schedules.filter((sc) => String(sc.workDate).slice(0, 10) === dStr)
              : filterDoctor
              ? schedulesMap[`${filterDoctor}_${dStr}`] || []
              : schedules.filter((sc) => String(sc.workDate).slice(0, 10) === dStr)

            return (
              <div
                key={dStr}
                className={`min-h-[110px] p-1.5 border-r border-b border-slate-200 flex flex-col justify-between transition ${
                  !isCurrentMonth
                    ? 'bg-slate-50/50 text-slate-400'
                    : isToday
                    ? 'bg-emerald-50/30'
                    : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                {/* Header ô ngày */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded ${
                      isToday
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {daySc.length > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded">
                      {daySc.length} ca
                    </span>
                  )}
                </div>

                {/* Danh sách ca trực trong ngày */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[105px] [scrollbar-width:none]">
                  {daySc.map((sc) => {
                    const isOpen = sc.status === 'OPEN'
                    const isMorning = clinicPeriod(sc.startTime) === 'MORNING'
                    const isEvening = clinicPeriod(sc.startTime) === 'EVENING'
                    const shiftConfig = isMorning
                      ? {
                          tag: 'Sáng',
                          accentBorder: 'border-l-amber-500',
                          badge: 'bg-amber-50 text-amber-700 border-amber-200',
                        }
                      : isEvening
                      ? {
                          tag: 'Tối',
                          accentBorder: 'border-l-indigo-500',
                          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        }
                      : {
                          tag: 'Chiều',
                          accentBorder: 'border-l-sky-500',
                          badge: 'bg-sky-50 text-sky-700 border-sky-200',
                        }

                    const occupied = sc.occupiedCount || 0
                    const capacity = sc.totalCapacity || sc.slots?.length || 0

                    return (
                      <div
                        key={sc.id}
                        onClick={() => onCardClick(sc)}
                        className={`p-1.5 rounded bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer relative group/monthCard border-l-2 ${
                          shiftConfig.accentBorder
                        } ${!isOpen ? 'opacity-60 bg-slate-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className={`px-1 py-0.2 rounded text-[7px] font-bold border shrink-0 ${shiftConfig.badge}`}
                            >
                              {shiftConfig.tag}
                            </span>
                            <span className="font-bold text-[10px] text-slate-800 tracking-tight truncate">
                              {sc.startTime}–{sc.endTime}
                            </span>
                          </div>

                          {!isDoctor && (canUpdate || canDelete) && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover/monthCard:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-200 rounded px-0.5 py-0.2 shadow-2xs shrink-0"
                            >
                              <button
                                type="button"
                                title="Sửa ca trực"
                                disabled={!canUpdate}
                                onClick={() => onOpenEdit(sc)}
                                className="p-0.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                              >
                                <Pencil className="h-2 w-2" />
                              </button>
                              <button
                                type="button"
                                title={isOpen ? 'Khóa' : 'Mở'}
                                disabled={!canUpdate}
                                onClick={() => onToggleStatus(sc)}
                                className="p-0.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                              >
                                {isOpen ? <Lock className="h-2 w-2" /> : <Unlock className="h-2 w-2" />}
                              </button>
                              <button
                                type="button"
                                title="Xóa"
                                disabled={!canDelete}
                                onClick={() => onRemove(sc)}
                                className="p-0.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-slate-500 mt-0.5">
                          <span className="truncate max-w-[60px]">
                            {sc.doctor?.fullName || 'Bác sĩ'}
                          </span>
                          <span className="text-slate-600 font-medium">
                            {occupied}/{capacity}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* KHỐI THỐNG KÊ TỔNG QUAN THÁNG */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded border border-slate-200 bg-white p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Tổng ca trực tháng</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {weekStats.totalShifts}{' '}
              <span className="text-xs font-normal text-slate-500">ca làm việc</span>
            </p>
          </div>
          <span className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Phân bổ ca trực</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold">
              <span className="text-amber-700">{weekStats.morningCount} Sáng</span>
              <span className="text-slate-300">·</span>
              <span className="text-sky-700">{weekStats.afternoonCount} Chiều</span>
              {weekStats.eveningCount > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-indigo-700">{weekStats.eveningCount} Tối</span>
                </>
              )}
            </div>
          </div>
          <span className="p-2 rounded bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
            <Clock className="w-4 h-4" />
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Tiến độ đặt hẹn</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {weekStats.totalOccupied}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {weekStats.totalCapacity} slot
              </span>
            </p>
          </div>
          <span className="p-2 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
            <Users className="w-4 h-4" />
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Cơ sở làm việc</p>
            <p
              className="text-xs font-bold text-slate-900 mt-1 truncate max-w-[170px]"
              title={activeBranchName}
            >
              {activeBranchName}
            </p>
          </div>
          <span className="p-2 rounded bg-slate-50 text-slate-600 border border-slate-200/60 shrink-0">
            <Building2 className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  )
}
