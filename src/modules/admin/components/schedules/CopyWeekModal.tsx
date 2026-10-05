'use client'

import React, { useMemo, useState } from 'react'
import { ArrowRight, Copy, Check, AlertCircle, Info, Calendar } from 'lucide-react'
import { copyWeekSchedules } from '../../services/schedules'
import { AdminButton, AdminModal, AdminSelect } from '@/common/components/ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentMonday: Date
  branchId?: string
  branches: any[]
  onSuccess?: () => Promise<void> | void
}

const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const formatDMY = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

export default function CopyWeekModal({
  isOpen,
  onClose,
  currentMonday,
  branchId: initialBranchId,
  branches,
  onSuccess,
}: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || '')
  const [offsetWeeks, setOffsetWeeks] = useState(1) // +1 week
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultMsg, setResultMsg] = useState('')

  React.useEffect(() => {
    if (isOpen) {
      setSelectedBranchId(initialBranchId || '')
      setError('')
      setResultMsg('')
      setOffsetWeeks(1)
    }
  }, [isOpen, initialBranchId])

  // Source week
  const sourceStart = useMemo(
    () => new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate()),
    [currentMonday]
  )
  const sourceEnd = useMemo(
    () => new Date(sourceStart.getFullYear(), sourceStart.getMonth(), sourceStart.getDate() + 6),
    [sourceStart]
  )

  // Target week
  const targetStart = useMemo(
    () => new Date(sourceStart.getFullYear(), sourceStart.getMonth(), sourceStart.getDate() + offsetWeeks * 7),
    [sourceStart, offsetWeeks]
  )
  const targetEnd = useMemo(
    () => new Date(targetStart.getFullYear(), targetStart.getMonth(), targetStart.getDate() + 6),
    [targetStart]
  )

  const handleCopy = async () => {
    setLoading(true)
    setError('')
    setResultMsg('')

    try {
      const res = await copyWeekSchedules({
        sourceMonday: formatYMD(sourceStart),
        targetMonday: formatYMD(targetStart),
        branchId: selectedBranchId || undefined,
      })

      setResultMsg(res.message || `Đã sao chép thành công ${res.copiedCount} ca trực.`)
      if (onSuccess) await onSuccess()
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Không thể sao chép lịch làm việc.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sao chép lịch làm việc sang tuần mới"
      maxWidth="lg"
      loading={loading}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {resultMsg && (
          <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{resultMsg}</span>
          </div>
        )}

        {/* Visual comparison */}
        <div className="rounded border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="rounded border border-slate-200 bg-white p-3 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tuần nguồn
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800">
                {formatDMY(sourceStart)}
              </p>
              <p className="text-[11px] text-slate-500">đến {formatDMY(sourceEnd)}</p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shadow-2xs">
              <ArrowRight className="h-4 w-4" />
            </div>

            <div className="rounded border border-emerald-300 bg-emerald-50/60 p-3 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Tuần đích
              </span>
              <p className="mt-1 text-xs font-bold text-emerald-950">
                {formatDMY(targetStart)}
              </p>
              <p className="text-[11px] text-emerald-700">đến {formatDMY(targetEnd)}</p>
            </div>
          </div>
        </div>

        {/* Target week offset selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Sao chép sang tuần:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOffsetWeeks(1)}
              className={`rounded border py-2 text-xs font-bold transition cursor-pointer ${
                offsetWeeks === 1
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              +1 Tuần kế tiếp
            </button>
            <button
              type="button"
              onClick={() => setOffsetWeeks(2)}
              className={`rounded border py-2 text-xs font-bold transition cursor-pointer ${
                offsetWeeks === 2
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              +2 Tuần sau
            </button>
            <button
              type="button"
              onClick={() => setOffsetWeeks(3)}
              className={`rounded border py-2 text-xs font-bold transition cursor-pointer ${
                offsetWeeks === 3
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              +3 Tuần sau
            </button>
          </div>
        </div>

        {/* Branch Filter */}
        <AdminSelect
          label="Phạm vi chi nhánh"
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
        >
          <option value="">Tất cả các chi nhánh</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </AdminSelect>

        {/* Notice note */}
        <div className="flex items-start gap-2 rounded border border-blue-100 bg-blue-50/70 p-2.5 text-xs text-blue-800">
          <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="leading-relaxed">
            Hệ thống sẽ giữ nguyên bác sĩ, phòng khám, khung giờ và thời lượng khám. Các ca trực đã trùng hoặc ngày bác sĩ xin nghỉ phép sẽ tự động được bỏ qua an toàn.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <AdminButton variant="secondary" disabled={loading} onClick={onClose}>
            Đóng
          </AdminButton>
          <AdminButton
            variant="primary"
            disabled={loading}
            loading={loading}
            onClick={handleCopy}
            icon={Copy}
          >
            Tiến hành sao chép
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}
