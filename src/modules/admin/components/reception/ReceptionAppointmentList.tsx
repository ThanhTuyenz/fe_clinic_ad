'use client'

import React from 'react'
import {
  appointmentSourceLabel,
  appointmentSourceTitle,
  appointmentSourceValue,
} from '../../utils/appointmentSource'
import { isPendingAppointmentPastSlot } from '../../utils/appointmentExpiry'
import {
  PAGE_SIZE,
  dashFilterLabelVi,
  doctorDisplayName,
  formatDateTimeVi,
  formatDateVi,
  formatExamTimeLine,
  patientListDisplayName,
  receptionStatusMeta,
} from './receptionHelpers'

interface ReceptionAppointmentListProps {
  listSearch: string
  setListSearch: (val: string) => void
  setQrListFocusTicket: (val: string) => void
  filtersOpen: boolean
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
  lookupLoading: boolean
  setTicketErr: (val: string) => void
  setQrErr: (val: string) => void
  setQrOpen: (val: boolean) => void
  ticketErr: string
  statusFilter: string
  setStatusFilter: (val: string) => void
  setDashFilter: (val: string) => void
  fromDate: string
  setFromDate: (val: string) => void
  toDate: string
  setToDate: (val: string) => void
  list: any[]
  filteredList: any[]
  dashFilter: string
  paginatedList: any[]
  selectedId: string | null
  detailLoadingId: string | null
  selectRow: (row: any) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  listLoading: boolean
  listErr: string
  loadList: () => Promise<void>
}

export default function ReceptionAppointmentList({
  listSearch,
  setListSearch,
  setQrListFocusTicket,
  filtersOpen,
  setFiltersOpen,
  lookupLoading,
  setTicketErr,
  setQrErr,
  setQrOpen,
  ticketErr,
  statusFilter,
  setStatusFilter,
  setDashFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  list,
  filteredList,
  dashFilter,
  paginatedList,
  selectedId,
  detailLoadingId,
  selectRow,
  page,
  setPage,
  totalPages,
  listLoading,
  listErr,
  loadList,
}: ReceptionAppointmentListProps) {
  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden shrink-0 h-[calc(100vh-160px)]">
      {/* Bộ lọc & Tìm kiếm */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="reception-list-search"
              className="w-full pl-3 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              type="search"
              value={listSearch}
              onChange={(e) => {
                setListSearch(e.target.value)
                setQrListFocusTicket('')
              }}
              placeholder="Tìm mã lịch, mã BN hoặc tên…"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              filtersOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            Lọc
          </button>
          <button
            type="button"
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
            disabled={lookupLoading}
            onClick={() => {
              setTicketErr('')
              setQrErr('')
              setQrOpen(true)
            }}
          >
            {lookupLoading ? '…' : 'Quét QR'}
          </button>
        </div>

        {ticketErr ? (
          <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {ticketErr}
          </div>
        ) : null}

        {filtersOpen ? (
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 shadow-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Trạng thái</label>
                <select
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-emerald-500"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setDashFilter('')
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="examined">Đã khám</option>
                  <option value="cancelled">Từ chối</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full py-1 text-center font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-all cursor-pointer"
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                    setStatusFilter('all')
                    setDashFilter('')
                  }}
                >
                  Đặt lại
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Tiêu đề & Đếm */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] font-medium text-slate-500 bg-slate-50/30 border-b border-slate-100">
        <span>
          {filteredList.length} lịch hẹn
          {dashFilter ? ` · ${dashFilterLabelVi(dashFilter)}` : ''}
        </span>
        {totalPages > 1 ? (
          <span>
            Trang {page + 1}/{totalPages}
          </span>
        ) : null}
      </div>

      {/* Danh sách cuộn */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100/50">
        {paginatedList.map((row) => {
          const id = String(row.id)
          const isSel = selectedId === id
          const isRowLoading = detailLoadingId === id
          const patientName = patientListDisplayName(row.patient)
          const doctorName = doctorDisplayName(row.doctor)
          const isPaid = String(row.payment?.status || '').toLowerCase() === 'paid'
          const meta = receptionStatusMeta(row)
          const pastSlot = isPendingAppointmentPastSlot(row)

          return (
            <div
              key={id}
              onClick={() => selectRow(row)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative text-xs ${
                isSel
                  ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 shadow-xs'
                  : pastSlot
                  ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-[13px]">{row.ticket || '—'}</span>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {pastSlot ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                      Quá giờ
                    </span>
                  ) : null}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                    {appointmentSourceLabel(row)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      meta.tone === 'booked'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        : meta.tone === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : meta.tone === 'cancelled'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-800 text-[13px] truncate">{patientName}</span>
                {row.patient?.patientCode ? (
                  <span className="text-[11px] font-mono text-slate-400">{row.patient.patientCode}</span>
                ) : null}
              </div>

              <div className="space-y-0.5 text-slate-500 text-[11px]">
                <p>
                  <strong>Khám:</strong> {formatDateVi(row.appointmentDate)} · {formatExamTimeLine(row.startTime, row.endTime)}
                </p>
                <p>
                  <strong>Bác sĩ:</strong> {doctorName}
                </p>
                {row.clinicRoomName || row.clinicRoom ? (
                  <p>
                    <strong>Phòng:</strong> {row.clinicRoomName || row.clinicRoom}
                  </p>
                ) : null}
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{formatDateTimeVi(row.createdAt)}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  {isPaid ? 'Đã thanh toán' : 'Chưa thu phí'}
                </span>
              </div>

              {isRowLoading ? (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl text-xs font-semibold text-emerald-700">
                  Đang tải…
                </div>
              ) : null}
            </div>
          )
        })}

        {!paginatedList.length && !listLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {list.length === 0 ? 'Không có lịch hẹn trong khoảng ngày này.' : 'Không khớp với bộ lọc nhanh.'}
          </div>
        ) : null}
      </div>

      {/* Phân trang */}
      {totalPages > 1 ? (
        <div className="p-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <button
            type="button"
            className="px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Trước
          </button>
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredList.length)} / {filteredList.length}
          </span>
          <button
            type="button"
            className="px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Sau
          </button>
        </div>
      ) : null}

      {listErr ? (
        <div className="p-3 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700">
          <span>{listErr}</span>
          <button type="button" className="font-semibold underline cursor-pointer" onClick={loadList}>
            Thử lại
          </button>
        </div>
      ) : null}
    </aside>
  )
}
