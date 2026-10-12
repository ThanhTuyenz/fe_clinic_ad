'use client'

import React from 'react'
import {
  Calendar,
  CalendarDays,
  List,
  RefreshCw,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AdminButton } from '@/common/components/ui'
import { formatDoctorDisplayName, formatWeekDisplay, getMonday } from './scheduleUtils'

interface ScheduleToolbarProps {
  viewMode: 'grid' | 'month' | 'table'
  setViewMode: (mode: 'grid' | 'month' | 'table') => void
  currentMonday: Date
  setCurrentMonday: (d: Date) => void
  currentMonthDate: Date
  setCurrentMonthDate: (d: Date) => void
  weekDays: Date[]
  isDoctor: boolean
  isBranchManager: boolean
  assignedBranch: any
  branches: any[]
  specialties: any[]
  availableDoctorsForSelect: any[]
  filterBranch: string
  setFilterBranch: (v: string) => void
  filterSpecialty: string
  setFilterSpecialty: (v: string) => void
  filterDoctor: string
  setFilterDoctor: (v: string) => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  loading: boolean
  onRefresh: () => void
}

export default function ScheduleToolbar({
  viewMode,
  setViewMode,
  currentMonday,
  setCurrentMonday,
  currentMonthDate,
  setCurrentMonthDate,
  weekDays,
  isDoctor,
  isBranchManager,
  assignedBranch,
  branches,
  specialties,
  availableDoctorsForSelect,
  filterBranch,
  setFilterBranch,
  filterSpecialty,
  setFilterSpecialty,
  filterDoctor,
  setFilterDoctor,
  searchTerm,
  setSearchTerm,
  loading,
  onRefresh,
}: ScheduleToolbarProps) {
  return (
    <div
      className={`${
        !isDoctor ? 'mt-4' : 'mt-1'
      } flex flex-wrap items-center justify-between gap-2.5 rounded border border-slate-200 bg-white px-3 py-2 shadow-xs`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {viewMode === 'grid' && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bộ điều hướng tuần: < DD/MM – DD/MM/YYYY > */}
            <div className="flex items-center rounded border border-slate-200 bg-white shadow-2xs">
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
                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800 whitespace-nowrap">
                {formatWeekDisplay(weekDays[0], weekDays[6])}
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
                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nút Hôm nay */}
            <button
              type="button"
              onClick={() => setCurrentMonday(getMonday(new Date()))}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer shadow-2xs whitespace-nowrap transition"
            >
              Hôm nay
            </button>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bộ điều hướng tháng: < Tháng M / YYYY > */}
            <div className="flex items-center rounded border border-slate-200 bg-white shadow-2xs">
              <button
                type="button"
                title="Tháng trước"
                onClick={() =>
                  setCurrentMonthDate(
                    new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
                  )
                }
                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                Tháng {currentMonthDate.getMonth() + 1} / {currentMonthDate.getFullYear()}
              </span>
              <button
                type="button"
                title="Tháng sau"
                onClick={() =>
                  setCurrentMonthDate(
                    new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
                  )
                }
                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nút Tháng này */}
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date())}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer shadow-2xs whitespace-nowrap transition"
            >
              Tháng này
            </button>
          </div>
        )}

        {/* Chú thích màu ca trực */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 shrink-0">
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

        {/* Bộ lọc nâng cao: chỉ dành cho Quản trị viên / Quản lý */}
        {!isDoctor && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Tìm bác sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-28 sm:w-32 rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-xs outline-none focus:border-emerald-600 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Chi nhánh: Nếu là Quản lý chi nhánh có cơ sở chỉ định thì hiển thị Badge cố định */}
            {isBranchManager && assignedBranch ? (
              <div
                className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shrink-0 shadow-2xs"
                title={`Phạm vi cơ sở: ${assignedBranch.name}${assignedBranch.code ? ` (${assignedBranch.code})` : ''}`}
              >
                <Building2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span className="truncate max-w-[150px]">{assignedBranch.name}</span>
              </div>
            ) : (
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="max-w-[130px] truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 shrink-0 cursor-pointer"
              >
                <option value="">Tất cả Chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterSpecialty}
              onChange={(e) => {
                setFilterSpecialty(e.target.value)
                setFilterDoctor('')
              }}
              className="max-w-[125px] truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 shrink-0 cursor-pointer"
            >
              <option value="">Tất cả Chuyên khoa</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="max-w-[130px] truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 shrink-0 cursor-pointer"
            >
              <option value="">Tất cả Bác sĩ</option>
              {availableDoctorsForSelect.map((d) => (
                <option key={d.id} value={d.doctor?.id || d.id}>
                  {formatDoctorDisplayName(d)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Nút chuyển đổi giao diện: Lịch Tuần / Lịch Tháng / Danh Sách */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
            viewMode === 'grid'
              ? 'border border-emerald-600 bg-white text-emerald-700 shadow-2xs'
              : 'border border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-700" />
          <span>Lịch Tuần</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('month')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
            viewMode === 'month'
              ? 'border border-emerald-600 bg-white text-emerald-700 shadow-2xs'
              : 'border border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5 text-emerald-700" />
          <span>Lịch Tháng</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
            viewMode === 'table'
              ? 'border border-emerald-600 bg-white text-emerald-700 shadow-2xs'
              : 'border border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="h-3.5 w-3.5 text-slate-500" />
          <span>Danh Sách</span>
        </button>

        <AdminButton
          variant="ghost"
          size="xs"
          icon={RefreshCw}
          loading={loading}
          onClick={onRefresh}
          title="Làm mới dữ liệu"
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        />
      </div>
    </div>
  )
}
