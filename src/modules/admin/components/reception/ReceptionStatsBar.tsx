'use client'

import React from 'react'
import { dashFilterLabelVi } from './receptionHelpers'

interface ReceptionStatsBarProps {
  stats: {
    pending: number
    unpaid: number
    noRoom: number
    ready: number
    expiring: number
  }
  dashFilter: string
  setDashFilter: (val: string) => void
  statusFilter: string
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
      label: 'Đang chờ xử lý',
      val: stats.pending,
      hint: statusFilter === 'pending' || statusFilter === 'all' ? 'Toàn bộ pending' : 'Theo bộ lọc',
      activeClass: 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10',
      badgeClass: 'text-slate-800',
    },
    {
      id: 'unpaid',
      label: 'Chưa thu phí',
      val: stats.unpaid,
      hint: 'Cần thu tiền khám',
      activeClass: 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20',
      badgeClass: 'text-amber-600',
    },
    {
      id: 'noRoom',
      label: 'Chưa chọn phòng',
      val: stats.noRoom,
      hint: 'Đã đóng tiền, thiếu phòng',
      activeClass: 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20',
      badgeClass: 'text-sky-600',
    },
    {
      id: 'ready',
      label: 'Sẵn sàng xác nhận',
      val: stats.ready,
      hint: 'Đủ phí và phòng',
      activeClass: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20',
      badgeClass: 'text-emerald-600',
    },
    {
      id: 'expiring',
      label: 'Quá giờ slot',
      val: stats.expiring,
      hint: 'Hết khung giờ hẹn',
      activeClass: 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20',
      badgeClass: 'text-rose-600',
    },
  ]

  return (
    <section className="mb-6" aria-label="Tóm tắt công việc tiếp nhận">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => {
          const isSelected = dashFilter === c.id
          return (
            <button
              key={c.id || 'all'}
              type="button"
              onClick={() => setDashFilter(isSelected && c.id !== '' ? '' : c.id)}
              className={`p-3.5 rounded-xl border text-left transition-all bg-white shadow-xs hover:shadow-sm flex flex-col justify-between ${
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
