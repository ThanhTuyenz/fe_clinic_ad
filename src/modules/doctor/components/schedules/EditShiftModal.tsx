'use client'

import React from 'react'
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
} from '@/common/components/ui'
import { SLOT_DURATIONS } from './scheduleUtils'

interface EditShiftModalProps {
  isOpen: boolean
  onClose: () => void
  form: any
  setForm: React.Dispatch<React.SetStateAction<any>>
  branches: any[]
  availableRooms: any[]
  saving: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function EditShiftModal({
  isOpen,
  onClose,
  form,
  setForm,
  branches,
  availableRooms,
  saving,
  onSubmit,
}: EditShiftModalProps) {
  if (!isOpen) return null

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập nhật ca làm việc"
      maxWidth="lg"
      loading={saving}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminSelect
            label="Chi nhánh"
            required
            value={form.branchId}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, branchId: e.target.value, roomId: '' }))
            }
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Phòng khám"
            value={form.roomId}
            onChange={(e) => setForm((prev: any) => ({ ...prev, roomId: e.target.value }))}
          >
            <option value="">-- Để trống hoặc chọn phòng --</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.code}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <AdminInput
            label="Ngày làm việc"
            type="date"
            required
            value={form.workDate}
            onChange={(e) => setForm((prev: any) => ({ ...prev, workDate: e.target.value }))}
          />
          <AdminInput
            label="Bắt đầu"
            type="time"
            required
            value={form.startTime}
            onChange={(e) => setForm((prev: any) => ({ ...prev, startTime: e.target.value }))}
          />
          <AdminInput
            label="Kết thúc"
            type="time"
            required
            value={form.endTime}
            onChange={(e) => setForm((prev: any) => ({ ...prev, endTime: e.target.value }))}
          />
        </div>

        <AdminSelect
          label="Thời lượng / lượt khám"
          value={form.slotDurationMin}
          onChange={(e) => setForm((prev: any) => ({ ...prev, slotDurationMin: e.target.value }))}
        >
          {SLOT_DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} phút / lượt {d === 30 ? '(Chuẩn)' : ''}
            </option>
          ))}
        </AdminSelect>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <AdminButton variant="secondary" disabled={saving} onClick={onClose}>
            Hủy
          </AdminButton>
          <AdminButton variant="primary" type="submit" loading={saving}>
            Cập nhật ca làm việc
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}
