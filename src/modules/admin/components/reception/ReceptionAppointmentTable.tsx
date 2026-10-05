'use client'

import React from 'react'
import { appointmentSourceLabel } from '../../utils/appointmentSource'
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
import { ArrowRight, ChevronLeft, ChevronRight, Image, QrCode, Search } from 'lucide-react'

interface ReceptionAppointmentTableProps {
  listSearch: string
  setListSearch: (val: string) => void
  setQrListFocusTicket: (val: string) => void
  filtersOpen?: boolean
  setFiltersOpen?: React.Dispatch<React.SetStateAction<boolean>>
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
  handleQrFileInput?: (e: React.ChangeEvent<HTMLInputElement>) => void
  qrImageLoading?: boolean
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
  detailLoadingId,
  onOpenDetail,
  page,
  setPage,
  totalPages,
  listLoading,
  listErr,
  loadList,
  handleQrFileInput,
  qrImageLoading,
}: ReceptionAppointmentTableProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-auto flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="reception-table-search"
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded placeholder:text-slate-400 text-slate-800 font-medium focus:border-emerald-600 outline-none"
              type="search"
              value={listSearch}
              onChange={(e) => {
                setListSearch(e.target.value)
                setQrListFocusTicket('')
              }}
              placeholder="Tìm mã lịch hẹn, họ tên, CCCD hoặc SĐT…"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {handleQrFileInput && (
              <label
                className={`px-3 py-2 text-xs font-bold rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  qrImageLoading ? 'opacity-60 pointer-events-none' : ''
                }`}
                title="Tải tệp ảnh chứa mã QR"
              >
                <Image className="w-4 h-4 text-amber-700" />
                <span>{qrImageLoading ? 'Đang đọc…' : 'Ảnh QR'}</span>
                <input type="file" accept="image/*" className="hidden" disabled={qrImageLoading} onChange={handleQrFileInput} />
              </label>
            )}

            <button
              type="button"
              className="px-3.5 py-2 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              disabled={lookupLoading}
              onClick={() => {
                setTicketErr('')
                setQrErr('')
                setQrOpen(true)
              }}
            >
              <QrCode className="w-4 h-4" />
              <span>{lookupLoading ? 'Đang đọc…' : 'Quét QR'}</span>
            </button>
          </div>
        </div>

        {ticketErr && <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded font-medium">{ticketErr}</div>}

        <div className="p-3 bg-white border border-slate-200 rounded text-xs text-slate-700 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Trạng thái khám</label>
                <select
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setDashFilter('')
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã tiếp nhận</option>
                  <option value="examined">Đã khám xong</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="py-1.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-all cursor-pointer shadow-xs"
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

      <div className="px-4 py-2 flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50/50 border-b border-slate-100">
        <span>
          Hiển thị <strong>{filteredList.length}</strong> lịch hẹn
          {dashFilter ? ` · Đang lọc: ${dashFilterLabelVi(dashFilter)}` : ''}
          {listSearch.trim() ? ` · Từ khóa: «${listSearch.trim()}»` : ''}
        </span>
        {totalPages > 1 && <span>Trang {page + 1} / {totalPages}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Mã vé</th>
              <th className="py-2.5 px-4 min-w-[160px]">Bệnh nhân</th>
              <th className="py-2.5 px-4">Thời gian</th>
              <th className="py-2.5 px-4 min-w-[160px]">Bác sĩ / Chuyên khoa</th>
              <th className="py-2.5 px-4">Phòng khám</th>
              <th className="py-2.5 px-4 text-center">Thanh toán</th>
              <th className="py-2.5 px-4 text-center">Trạng thái</th>
              <th className="py-2.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedList.map((row) => {
              const id = String(row.id)
              const isRowLoading = detailLoadingId === id
              const patientName = patientListDisplayName(row.patient)
              const doctorName = doctorDisplayName(row.doctor) !== '—' ? doctorDisplayName(row.doctor) : (row.doctor?.fullName || 'Bác sĩ phụ trách')
              const specialty = row.specialty?.name || row.servicePackage?.name || row.doctor?.specialtyName || doctorSpecialtyDisplay(row.doctor) || 'Chuyên khoa'
              const isPaid = String(row.payment?.status || '').toLowerCase() === 'paid'
              const meta = receptionStatusMeta(row)
              const pastSlot = isPendingAppointmentPastSlot(row)

              return (
                <tr
                  key={id}
                  onClick={() => onOpenDetail(row)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${pastSlot ? 'bg-rose-50/20' : ''}`}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                        {row.ticket || '—'}
                      </span>
                      {pastSlot && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Quá giờ</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {appointmentSourceLabel(row)} · {formatDateTimeVi(row.createdAt)}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <strong className="text-slate-900 text-xs block">{patientName}</strong>
                    <span className="text-[11px] text-slate-500 font-medium">{row.patient?.phone || '—'}</span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{formatDateVi(row.appointmentDate)}</div>
                    <div className="text-[11px] font-bold text-emerald-700">{formatExamTimeLine(row.startTime, row.endTime)}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{doctorName}</div>
                    <div className="text-[11px] text-slate-400">{specialty}</div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {row.clinicRoomName || row.clinicRoom ? (
                      <span className="font-semibold text-slate-800">{row.clinicRoomName || row.clinicRoom}</span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa chọn</span>
                    )}
                    {row.visitQueueNumber != null && row.visitQueueNumber !== '' && (
                      <div className="text-[11px] font-bold text-blue-700">STT: {row.visitQueueNumber}</div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isPaid ? 'Đã thu' : 'Chưa thu'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      meta.tone === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : meta.tone === 'booked'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : meta.tone === 'cancelled'
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {meta.label}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-semibold rounded text-xs transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDetail(row)
                      }}
                    >
                      <span>{isRowLoading ? 'Đang mở…' : 'Chi tiết'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              )
            })}

            {!paginatedList.length && !listLoading && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-xs">
                  {list.length === 0 ? 'Không có lịch hẹn nào trong khoảng ngày đã chọn.' : 'Không tìm thấy lịch hẹn khớp với bộ lọc.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <button
            type="button"
            className="px-3 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Trước
          </button>
          <span className="font-semibold text-slate-700">
            Hiển thị {page * PAGE_SIZE + 1} – {Math.min((page + 1) * PAGE_SIZE, filteredList.length)} / {filteredList.length} lịch hẹn
          </span>
          <button
            type="button"
            className="px-3 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Sau <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {listErr && (
        <div className="p-3 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-800 font-medium">
          <span>{listErr}</span>
          <button type="button" className="font-bold underline cursor-pointer" onClick={loadList}>Thử lại</button>
        </div>
      )}
    </div>
  )
}

