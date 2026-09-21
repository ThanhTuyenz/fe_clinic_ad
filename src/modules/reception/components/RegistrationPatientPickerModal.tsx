import React from 'react'
import { X, Search, QrCode } from 'lucide-react'
import {
  readDisplayNameFromPatient,
  patientDobFromRow,
  genderLabelFromRow,
  formatDateVi,
} from './registrationHelpers'

interface RegistrationPatientPickerModalProps {
  isOpen: boolean
  onClose: () => void
  filters: { patientCode: string; name: string; phone: string }
  setFilters: React.Dispatch<React.SetStateAction<{ patientCode: string; name: string; phone: string }>>
  rows: any[]
  selectedId: string
  setSelectedId: (id: string) => void
  loading: boolean
  error: string
  page: number
  pageSize: number
  total: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  onSearch: () => void
  onSelectPatient: (patient: any) => void
  onOpenQrScan?: () => void
}

export default function RegistrationPatientPickerModal({
  isOpen,
  onClose,
  filters,
  setFilters,
  rows,
  selectedId,
  setSelectedId,
  loading,
  error,
  page,
  pageSize,
  total,
  setPage,
  onSearch,
  onSelectPatient,
  onOpenQrScan,
}: RegistrationPatientPickerModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-2xl max-w-4xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Danh sách tìm kiếm bệnh nhân</h2>
          <button
            type="button"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bộ lọc tìm kiếm bệnh nhân */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="flex gap-1.5 sm:col-span-1">
            <input
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded placeholder:text-slate-400 font-medium"
              value={filters.patientCode}
              onChange={(e) => setFilters((s) => ({ ...s, patientCode: e.target.value }))}
              placeholder="Mã BN (YM...)"
            />
            {onOpenQrScan && (
              <button
                type="button"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 cursor-pointer shadow-xs"
                title="Quét QR camera"
                onClick={onOpenQrScan}
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded placeholder:text-slate-400 font-medium text-xs"
            value={filters.name}
            onChange={(e) => setFilters((s) => ({ ...s, name: e.target.value }))}
            placeholder="Họ tên bệnh nhân"
          />

          <input
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded placeholder:text-slate-400 font-medium text-xs"
            value={filters.phone}
            onChange={(e) => setFilters((s) => ({ ...s, phone: e.target.value }))}
            placeholder="Số điện thoại"
          />

          <button
            type="button"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs border border-emerald-600 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            onClick={onSearch}
            disabled={loading}
          >
            <Search className="w-4 h-4 text-white" />
            <span>{loading ? 'Đang tìm…' : 'Tìm kiếm'}</span>
          </button>
        </div>

        {error ? (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded font-medium">
            {error}
          </div>
        ) : null}

        {/* Bảng kết quả tìm kiếm */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3 w-10">Chọn</th>
                <th className="py-2.5 px-3">Mã BN</th>
                <th className="py-2.5 px-3">Họ tên</th>
                <th className="py-2.5 px-3">Điện thoại</th>
                <th className="py-2.5 px-3">Ngày sinh</th>
                <th className="py-2.5 px-3">Giới tính</th>
                <th className="py-2.5 px-3">Email / CCCD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(String(r.id))}
                  className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                    selectedId === String(r.id) ? 'bg-emerald-50 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <input
                      type="radio"
                      name="pickPatient"
                      checked={selectedId === String(r.id)}
                      onChange={() => setSelectedId(String(r.id))}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{r.patientCode || r.nationalId || '—'}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{readDisplayNameFromPatient(r) || '—'}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{r.phone || r.phoneNumber || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{patientDobFromRow(r) ? formatDateVi(patientDobFromRow(r)) : '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{genderLabelFromRow(r.gender)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.email || r.citizenId || '—'}</td>
                </tr>
              ))}

              {!rows.length && !loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Không tìm thấy bệnh nhân nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Phân trang modal */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            {total
              ? `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(
                  page * pageSize,
                  total,
                )} trong tổng số ${total} bệnh nhân`
              : '0 kết quả'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Trước
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs"
              onClick={() => {
                const maxPage = Math.max(1, Math.ceil(total / pageSize))
                setPage((p) => Math.min(maxPage, p + 1))
              }}
              disabled={loading || page >= Math.max(1, Math.ceil(total / pageSize))}
            >
              Sau
            </button>
            <button
              type="button"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow-xs border border-emerald-600 cursor-pointer disabled:opacity-40"
              onClick={() => {
                const chosen = rows.find((x) => String(x.id) === String(selectedId))
                if (!chosen) return
                onSelectPatient(chosen)
                onClose()
              }}
              disabled={!selectedId}
            >
              Chọn bệnh nhân
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
