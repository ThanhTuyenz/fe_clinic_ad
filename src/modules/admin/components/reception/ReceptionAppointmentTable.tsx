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
  doctorSpecialtyDisplay,
  formatDateTimeVi,
  formatDateVi,
  formatExamTimeLine,
  patientListDisplayName,
  receptionStatusMeta,
} from './receptionHelpers'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  QrCodeIcon,
  SearchIcon,
} from './ReceptionIcons'

interface ReceptionAppointmentTableProps {
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
  onOpenDetail: (row: any) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  listLoading: boolean
  listErr: string
  loadList: () => Promise<void>
}

export default function ReceptionAppointmentTable({
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
  onOpenDetail,
  page,
  setPage,
  totalPages,
  listLoading,
  listErr,
  loadList,
}: ReceptionAppointmentTableProps) {
  return (
    <div className="bg-white border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <input
                id="reception-table-search"
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-xs"
                type="search"
                value={listSearch}
                onChange={(e) => {
                  setListSearch(e.target.value)
                  setQrListFocusTicket('')
                }}
                placeholder="Tìm mã lịch hẹn, mã bệnh nhân hoặc họ tên…"
                autoComplete="off"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon className="w-4 h-4 text-slate-400" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                filtersOpen
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <FilterIcon className={`w-4 h-4 ${filtersOpen ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span>Bộ lọc nâng cao</span>
            </button>

            <button
              type="button"
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-600 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
              disabled={lookupLoading}
              onClick={() => {
                setTicketErr('')
                setQrErr('')
                setQrOpen(true)
              }}
            >
              <QrCodeIcon className="w-4 h-4 text-white" />
              <span>{lookupLoading ? 'Đang đọc…' : 'Quét QR'}</span>
            </button>
          </div>
        </div>

        {ticketErr ? (
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
            {ticketErr}
          </div>
        ) : null}

        {/* Khối lọc mở rộng */}
        {filtersOpen ? (
          <div className="p-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trạng thái khám</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setDashFilter('')
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="examined">Đã khám xong</option>
                  <option value="cancelled">Đã từ chối / Hủy</option>
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  className="w-auto py-2 px-3.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-xs"
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
          </div>
        ) : null}
      </div>

      {/* Thông tin số lượng */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-100/60 border-b border-slate-200">
        <span>
          Hiển thị <strong>{filteredList.length}</strong> lịch hẹn
          {dashFilter ? ` · Đang lọc: ${dashFilterLabelVi(dashFilter)}` : ''}
          {listSearch.trim() ? ` · Từ khóa: «${listSearch.trim()}»` : ''}
        </span>
        {totalPages > 1 ? (
          <span>
            Trang {page + 1} / {totalPages}
          </span>
        ) : null}
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-300 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Mã lịch hẹn</th>
              <th className="py-3 px-4">Bệnh nhân</th>
              <th className="py-3 px-4">Thời gian khám</th>
              <th className="py-3 px-4">Bác sĩ & Chuyên khoa</th>
              <th className="py-3 px-4">Phòng khám / STT</th>
              <th className="py-3 px-4">Thanh toán</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs">
            {paginatedList.map((row) => {
              const id = String(row.id)
              const isRowLoading = detailLoadingId === id
              const patientName = patientListDisplayName(row.patient)
              const doctorName = doctorDisplayName(row.doctor)
              const specialty = doctorSpecialtyDisplay(row.doctor)
              const isPaid = String(row.payment?.status || '').toLowerCase() === 'paid'
              const meta = receptionStatusMeta(row)
              const pastSlot = isPendingAppointmentPastSlot(row)

              return (
                <tr
                  key={id}
                  onClick={() => onOpenDetail(row)}
                  className={`hover:bg-emerald-50/40 transition-colors cursor-pointer group ${
                    pastSlot ? 'bg-rose-50/30' : ''
                  }`}
                >
                  {/* Mã lịch hẹn & Nguồn */}
                  <td className="py-3.5 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[12px] border border-emerald-300/80">
                        {row.ticket || '—'}
                      </span>
                      {pastSlot ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Quá giờ
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-medium">
                      {appointmentSourceLabel(row)} · {formatDateTimeVi(row.createdAt)}
                    </div>
                  </td>

                  {/* Bệnh nhân */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-[13px]">{patientName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {row.patient?.patientCode ? (
                        <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[10px] text-slate-700 font-semibold mr-1.5">
                          {row.patient.patientCode}
                        </span>
                      ) : null}
                      <span>{row.patient?.phone || '—'}</span>
                    </div>
                  </td>

                  {/* Thời gian khám */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{formatDateVi(row.appointmentDate)}</div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      {formatExamTimeLine(row.startTime, row.endTime)}
                    </div>
                  </td>

                  {/* Bác sĩ & Chuyên khoa */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{doctorName}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{specialty}</div>
                  </td>

                  {/* Phòng & STT */}
                  <td className="py-3.5 px-4">
                    {row.clinicRoomName || row.clinicRoom ? (
                      <div className="font-semibold text-slate-800">
                        {row.clinicRoomName || row.clinicRoom}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa chọn phòng</span>
                    )}
                    {row.visitQueueNumber != null && row.visitQueueNumber !== '' ? (
                      <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                        STT: {row.visitQueueNumber}
                      </div>
                    ) : null}
                  </td>

                  {/* Thanh toán */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {isPaid ? 'Đã thu phí' : 'Chưa thu phí'}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        meta.tone === 'booked'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : meta.tone === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : meta.tone === 'cancelled'
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {meta.label}
                    </span>
                  </td>

                  {/* Nút thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDetail(row)
                      }}
                    >
                      <span>{isRowLoading ? 'Đang mở…' : 'Chi tiết'}</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}

            {!paginatedList.length && !listLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-medium text-xs">
                  {list.length === 0
                    ? 'Không có lịch hẹn nào trong khoảng ngày đã chọn.'
                    : 'Không tìm thấy lịch hẹn khớp với từ khóa / bộ lọc.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 ? (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1.5"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Trang trước</span>
          </button>
          <span className="font-semibold text-slate-700">
            Hiển thị {page * PAGE_SIZE + 1} – {Math.min((page + 1) * PAGE_SIZE, filteredList.length)} trong tổng số{' '}
            {filteredList.length} lịch hẹn
          </span>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1.5"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <span>Trang sau</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {listErr ? (
        <div className="p-3.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-800 font-medium">
          <span>{listErr}</span>
          <button type="button" className="font-bold underline cursor-pointer" onClick={loadList}>
            Thử lại
          </button>
        </div>
      ) : null}
    </div>
  )
}
