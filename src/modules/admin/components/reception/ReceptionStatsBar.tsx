'use client'

import React from 'react'
import { dashFilterLabelVi } from './receptionHelpers'

interface ReceptionStatsBarProps {
  stats: {
    all: number
    pendingCheckin: number
    unpaid: number
    checkedIn: number
    completed: number
    cancelled: number
  }
  dashFilter: string
  setDashFilter: (val: string) => void
  statusFilter?: string
}

export default function ReceptionStatsBar({
  stats,
  dashFilter,
  setDashFilter,
  statusFilter,
}: ReceptionStatsBarProps) {
  const cards = [
    {
      id: '',
      label: 'Tất cả lịch hẹn',
      val: stats.all,
      hint: 'Toàn bộ danh sách',
      activeClass: 'border-slate-800 bg-slate-100/70 shadow-sm',
      badgeClass: 'text-slate-800',
    },
    {
      id: 'pending_checkin',
      label: 'Chờ tiếp đón',
      val: stats.pendingCheckin,
      hint: 'Chờ check-in vào phòng',
      activeClass: 'border-indigo-600 bg-indigo-50/70 shadow-sm',
      badgeClass: 'text-indigo-600',
    },
    {
      id: 'unpaid',
      label: 'Chờ đóng phí',
      val: stats.unpaid,
      hint: 'Cần thu tiền khám',
      activeClass: 'border-amber-600 bg-amber-50/70 shadow-sm',
      badgeClass: 'text-amber-600',
    },
    {
      id: 'checked_in',
      label: 'Đã check-in',
      val: stats.checkedIn,
      hint: 'Đang đợi vào khám',
      activeClass: 'border-emerald-600 bg-emerald-50/70 shadow-sm',
      badgeClass: 'text-emerald-600',
    },
    {
      id: 'completed',
      label: 'Đang / Đã khám',
      val: stats.completed,
      hint: 'Đang khám hoặc xong',
      activeClass: 'border-blue-600 bg-blue-50/70 shadow-sm',
      badgeClass: 'text-blue-600',
    },
    {
      id: 'cancelled',
      label: 'Đã hủy / Quá giờ',
      val: stats.cancelled,
      hint: 'Hết hạn hoặc từ chối',
      activeClass: 'border-rose-600 bg-rose-50/70 shadow-sm',
      badgeClass: 'text-rose-600',
    },
  ]

  return (
    <section className="mb-6" aria-label="Tóm tắt công việc tiếp nhận">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => {
          const isSelected = dashFilter === c.id
          return (
            <button
              key={c.id || 'all'}
              type="button"
              onClick={() => setDashFilter(isSelected && c.id !== '' ? '' : c.id)}
              className={`p-3.5 rounded-lg border text-left transition-all bg-white shadow-xs hover:shadow-sm flex flex-col justify-between ${
                isSelected ? c.activeClass : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-semibold text-slate-500">{c.label}</span>
              </div>
              <div className="flex items-baseline justify-between w-full">
                <span className={`text-2xl font-bold tracking-tight ${c.badgeClass}`}>{c.val}</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{c.hint}</span>
              </div>
            </button>
          )
        })}
      </div>

      {dashFilter ? (
        <div className="mt-3 flex items-center justify-between px-4 py-2 bg-emerald-50/80 border border-emerald-200/60 rounded-lg text-xs text-emerald-800">
          <span>
            Đang lọc danh sách: <strong>{dashFilterLabelVi(dashFilter)}</strong>
          </span>
          <button
            type="button"
            className="font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            onClick={() => setDashFilter('')}
          >
            Xóa lọc nhanh
          </button>
        </div>
      ) : null}
    </section>
  )
}
