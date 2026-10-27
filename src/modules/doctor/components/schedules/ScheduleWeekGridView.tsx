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
import {
  DAY_NAMES,
  formatDoctorDisplayName,
  formatYMD,
} from './scheduleUtils'

interface ScheduleWeekGridViewProps {
  weekDays: Date[]
  todayStr: string
  filteredDoctors: any[]
  schedulesMap: Record<string, any[]>
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  isDoctor: boolean
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
  onOpenScheduleModal: (doctorId?: string, dateStr?: string) => void
}

export default function ScheduleWeekGridView({
  weekDays,
  todayStr,
  filteredDoctors,
  schedulesMap,
  isDoctor,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
  activeBranchName,
  weekStats,
  onCardClick,
  onOpenEdit,
  onToggleStatus,
  onRemove,
  onOpenScheduleModal,
}: ScheduleWeekGridViewProps) {
  return (
    <div className="space-y-3">
      <section className="mt-3 overflow-hidden rounded border border-slate-200 bg-white shadow-xs">
        <div
          className={`grid w-full ${
            isDoctor ? 'grid-cols-7' : 'grid-cols-[145px_repeat(7,minmax(0,1fr))]'
          } text-slate-800`}
        >
          {/* Header cột Bác sĩ: chỉ hiển thị cho Quản trị viên/Quản lý */}
          {!isDoctor && (
            <div className="bg-slate-50/70 p-2 text-xs font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center border-r border-b border-slate-200">
              <span>BÁC SĨ</span>
              <span className="text-xs text-sky-600 font-semibold">({filteredDoctors.length})</span>
            </div>
          )}

          {/* Header 7 ngày trong tuần */}
          {weekDays.map((date) => {
            const dStr = formatYMD(date)
            const isToday = dStr === todayStr
            const dayIndex = date.getDay()
            const dayName = DAY_NAMES[dayIndex]
            const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(
              date.getMonth() + 1
            ).padStart(2, '0')}`

            return (
              <div
                key={date.toISOString()}
                className={`p-2 text-center text-xs font-bold relative border-r border-b border-slate-200 ${
                  isToday
                    ? 'bg-emerald-50/70 text-emerald-950 border-b-2 border-b-emerald-600'
                    : 'bg-slate-50/70 text-slate-800'
                }`}
              >
                {isToday && (
                  <span className="absolute top-1 right-1 rounded bg-emerald-600 px-1 py-0.2 text-[8px] font-bold text-white uppercase shadow-2xs">
                    Hôm nay
                  </span>
                )}
                <div>{dayName}</div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">{dateStr}</div>
              </div>
            )
          })}

          {/* Thân bảng lịch tuần */}
          {filteredDoctors.length === 0 ? (
            <div
              className={`p-10 text-center text-slate-400 text-xs italic ${
                isDoctor ? 'col-span-7' : 'col-span-8'
              }`}
            >
              Chưa có dữ liệu bác sĩ hoặc ca làm việc nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredDoctors.map((doc) => {
              const docId = doc.doctor?.id || doc.id
              const totalDoctorShifts = weekDays.reduce(
                (acc, d) => acc + (schedulesMap[`${docId}_${formatYMD(d)}`]?.length || 0),
                0
              )
              const branchName = activeBranchName
              const docDisplayName = formatDoctorDisplayName(doc)

              return (
                <div key={docId} className="contents">
                  {/* Cột thông tin Bác sĩ: chỉ hiển thị cho Quản trị viên/Quản lý */}
                  {!isDoctor && (
                    <div className="p-2 flex flex-col justify-center gap-1 border-r border-b border-slate-200 bg-white">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Avatar Bác sĩ */}
                        <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200/80 shrink-0 shadow-2xs overflow-hidden">
                          {doc.avatarUrl ? (
                            <img
                              src={doc.avatarUrl}
                              alt={docDisplayName}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">BS.</span>
                          )}
                        </div>

                        <b
                          className="text-xs font-bold text-slate-900 leading-tight truncate min-w-0"
                          title={docDisplayName}
                        >
                          {docDisplayName}
                        </b>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 truncate max-w-[80px]">
                          {doc.doctor?.specialties?.[0]?.specialty?.name ||
                            doc.specialties?.[0]?.specialty?.name ||
                            'Đa khoa'}
                        </span>
                        <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/60 shrink-0">
                          {totalDoctorShifts} ca
                        </span>
                      </div>

                      {branchName && (
                        <p
                          className="text-[9px] text-slate-400 flex items-center gap-0.5 truncate"
                          title={branchName}
                        >
                          <Building2 className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">{branchName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* 7 Ngày trong tuần */}
                  {weekDays.map((date) => {
                    const dStr = formatYMD(date)
                    const isToday = dStr === todayStr
                    const daySc = schedulesMap[`${docId}_${dStr}`] || []

                    return (
                      <div
                        key={dStr}
                        className={`min-h-[80px] p-1.5 transition group relative border-r border-b border-slate-200 flex flex-col justify-center ${
                          isToday
                            ? 'bg-emerald-50/20 hover:bg-emerald-50/35'
                            : 'bg-white hover:bg-slate-50/40'
                        }`}
                      >
                        {daySc.length === 0 ? (
                          <div className="h-full min-h-[50px] flex items-center justify-center text-[10px] text-slate-300 font-medium select-none">
                            —
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {daySc.map((sc) => {
                              const isOpen = sc.status === 'OPEN'
                              const isMorning = clinicPeriod(sc.startTime) === 'MORNING'
                              const isEvening = clinicPeriod(sc.startTime) === 'EVENING'

                              const shiftConfig = isMorning
                                ? {
                                    tag: 'Sáng',
                                    border: 'border-amber-200',
                                    badge: 'bg-amber-50 text-amber-700 border-amber-200',
                                    accentBorder: 'border-l-amber-500',
                                  }
                                : isEvening
                                ? {
                                    tag: 'Tối',
                                    border: 'border-indigo-200',
                                    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                                    accentBorder: 'border-l-indigo-500',
                                  }
                                : {
                                    tag: 'Chiều',
                                    border: 'border-sky-200',
                                    badge: 'bg-sky-50 text-sky-700 border-sky-200',
                                    accentBorder: 'border-l-sky-500',
                                  }

                              const occupied = sc.occupiedCount || 0
                              const capacity = sc.totalCapacity || sc.slots?.length || 0

                              return (
                                <div
                                  key={sc.id}
                                  onClick={() => onCardClick(sc)}
                                  className={`p-1.5 rounded bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer relative group/card border-l-2 ${
                                    shiftConfig.accentBorder
                                  } ${!isOpen ? 'opacity-60 bg-slate-50' : ''}`}
                                >
                                  {/* Hàng 1: Giờ khám + Tag buổi + Nút thao tác nhanh */}
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span
                                        className={`px-1 py-0.2 rounded text-[8px] font-bold border shrink-0 ${shiftConfig.badge}`}
                                      >
                                        {shiftConfig.tag}
                                      </span>
                                      <span className="font-bold text-[11px] text-slate-800 tracking-tight whitespace-nowrap">
                                        {sc.startTime}–{sc.endTime}
                                      </span>
                                    </div>

                                    {/* Action buttons cho quản trị viên/quản lý */}
                                    {!isDoctor && (canUpdate || canDelete) && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-0.5 bg-white shadow-2xs border border-slate-200 rounded px-0.5 py-0.2"
                                      >
                                        <button
                                          type="button"
                                          title="Chỉnh sửa ca trực"
                                          disabled={!canUpdate}
                                onClick={() => onOpenEdit(sc)}
                                          className="p-0.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition"
                                        >
                                          <Pencil className="h-2.5 w-2.5" />
                                        </button>
                                        <button
                                          type="button"
                                          title={isOpen ? 'Khóa ca trực' : 'Mở ca trực'}
                                          disabled={!canUpdate}
                                onClick={() => onToggleStatus(sc)}
                                          className="p-0.5 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer transition"
                                        >
                                          {isOpen ? (
                                            <Lock className="h-2.5 w-2.5" />
                                          ) : (
                                            <Unlock className="h-2.5 w-2.5" />
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          title="Xóa ca trực"
                                          disabled={!canDelete}
                                onClick={() => onRemove(sc)}
                                          className="p-0.5 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition"
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Hàng 2: Phòng khám & Số slot */}
                                  <div className="flex items-center justify-between text-[9px] pt-0.5 border-t border-slate-100 gap-1">
                                    <span
                                      className="font-normal text-slate-500 truncate max-w-[65px]"
                                      title={sc.room?.name || sc.room?.code || 'Chưa xếp phòng'}
                                    >
                                      {sc.room?.name || sc.room?.code || 'Chưa xếp P.'}
                                    </span>

                                    <span
                                      className="px-1 py-0.2 rounded text-[8px] font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
                                      title={`Đã có ${occupied} / ${capacity} bệnh nhân đặt lịch`}
                                    >
                                      {occupied}/{capacity} slot
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Nút thêm ca nhanh chỉ dành cho Quản trị viên / Quản lý */}
                        {!isDoctor && canCreate && (
                          <button
                            disabled={!canCreate}
                            onClick={() => onOpenScheduleModal(docId, dStr)}
                            className={`mt-1 w-full rounded border border-dashed py-0.5 text-[9px] font-semibold transition cursor-pointer ${
                              daySc.length === 0
                                ? 'border-slate-200 text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                                : 'border-transparent text-slate-400 opacity-0 group-hover:opacity-100 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            + Ca
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* KHỐI THỐNG KÊ TỔNG QUAN CA TRỰC TUẦN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded border border-slate-200 bg-white p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Tổng ca trực tuần</p>
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
