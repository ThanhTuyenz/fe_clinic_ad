'use client'

import React from 'react'
import { Zap, X, Loader2 } from 'lucide-react'

interface BatchBranchModalProps {
  open: boolean
  onClose: () => void
  options: Record<string, any[]>
  rows: any[]
  batchBranchId: string
  setBatchBranchId: (id: string) => void
  batchSpecialtyIds: number[]
  setBatchSpecialtyIds: React.Dispatch<React.SetStateAction<number[]>>
  batchSubmitting: boolean
  batchError: string
  onSave: () => void
}

export default function BatchBranchModal({
  open,
  onClose,
  options,
  rows,
  batchBranchId,
  setBatchBranchId,
  batchSpecialtyIds,
  setBatchSpecialtyIds,
  batchSubmitting,
  batchError,
  onSave,
}: BatchBranchModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => !batchSubmitting && onClose()}
    >
      <div
        className="bg-white rounded shadow-2xl max-w-2xl w-full p-6 border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-emerald-50 text-emerald-700">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gán chuyên khoa theo cơ sở hàng loạt</h2>
              <p className="text-xs text-slate-500">Chọn cơ sở và tích chọn các chuyên khoa muốn kích hoạt</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {batchError && (
            <div className="p-3 text-xs rounded bg-rose-50 border border-rose-200 text-rose-700">
              {batchError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cơ sở y tế / Chi nhánh <span className="text-rose-500">*</span>
            </label>
            <select
              value={batchBranchId}
              onChange={(e) => {
                const bId = e.target.value
                setBatchBranchId(bId)
                const activeIds = rows
                  .filter((r) => String(r.branchId || r.branch?.id) === String(bId))
                  .map((r) => Number(r.specialtyId || r.specialty?.id))
                setBatchSpecialtyIds(activeIds)
              }}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">-- Chọn cơ sở y tế --</option>
              {(options.branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Danh sách chuyên khoa áp dụng ({batchSpecialtyIds.length}/{(options.specialties || []).length})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBatchSpecialtyIds((options.specialties || []).map((s: any) => Number(s.id)))
                  }
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setBatchSpecialtyIds([])}
                  className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded p-3 max-h-64 overflow-y-auto bg-slate-50/50">
              {(options.specialties || []).map((spec: any) => {
                const checked = batchSpecialtyIds.includes(Number(spec.id))
                return (
                  <label
                    key={spec.id}
                    className={`flex items-center gap-2.5 p-2 rounded border text-xs font-medium cursor-pointer transition ${
                      checked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const id = Number(spec.id)
                        if (e.target.checked) {
                          setBatchSpecialtyIds((prev) => [...prev, id])
                        } else {
                          setBatchSpecialtyIds((prev) => prev.filter((x) => x !== id))
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="truncate">{spec.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={batchSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={batchSubmitting || !batchBranchId}
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer"
          >
            {batchSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu gán chuyên khoa
          </button>
        </div>
      </div>
    </div>
  )
}
