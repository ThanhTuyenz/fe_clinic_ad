'use client'

import React from 'react'
import { AdminButton, AdminModal, StatusBadge } from '@/common/components/ui'

interface ShiftDetailModalProps {
  isOpen: boolean
  onClose: () => void
  shift: any
}

export default function ShiftDetailModal({
  isOpen,
  onClose,
  shift,
}: ShiftDetailModalProps) {
  if (!isOpen || !shift) return null

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết ca làm việc"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200/80">
          <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-200 shrink-0">
            {shift.doctor?.avatarUrl ? (
              <img
                src={shift.doctor.avatarUrl}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ) : (
              'BS.'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-slate-900">
              {shift.doctor?.academicRank ? `${shift.doctor.academicRank} ` : ''}
              {shift.doctor?.fullName || 'Bác sĩ'}
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {shift.doctor?.specialties?.[0]?.specialty?.name || 'Bác sĩ chuyên khoa'}
            </p>
          </div>
          <StatusBadge
            status={shift.status === 'OPEN' ? 'open' : 'closed'}
            label={shift.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
            tone={shift.status === 'OPEN' ? 'emerald' : 'rose'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded border border-slate-200 bg-white">
            <p className="text-slate-500 text-[11px]">Chi nhánh</p>
            <p className="font-semibold text-slate-900 mt-1">
              {shift.branch?.name || 'Chi nhánh'}
            </p>
          </div>
          <div className="p-3 rounded border border-slate-200 bg-white">
            <p className="text-slate-500 text-[11px]">Phòng khám</p>
            <p className="font-semibold text-slate-900 mt-1">
              {shift.room?.name || shift.room?.code || 'Chưa xếp phòng'}
            </p>
          </div>
          <div className="p-3 rounded border border-slate-200 bg-white">
            <p className="text-slate-500 text-[11px]">Ngày làm việc</p>
            <p className="font-semibold text-slate-900 mt-1">
              {shift.workDate}
            </p>
          </div>
          <div className="p-3 rounded border border-slate-200 bg-white">
            <p className="text-slate-500 text-[11px]">Khung giờ</p>
            <p className="font-semibold text-emerald-800 mt-1">
              {shift.startTime} – {shift.endTime}
            </p>
          </div>
          <div className="p-3 rounded border border-slate-200 bg-white">
            <p className="text-slate-500 text-[11px]">Thời lượng slot</p>
            <p className="font-semibold text-slate-900 mt-1">
              {shift.slotDurationMin || 30} phút / ca
            </p>
          </div>
          <div className="p-3 rounded border border-slate-200 bg-white">
            <p className="text-slate-500 text-[11px]">Tiến độ đặt hẹn</p>
            <p className="font-semibold text-slate-900 mt-1">
              {shift.occupiedCount || 0} /{' '}
              {shift.totalCapacity || shift.slots?.length || 0} slot
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <AdminButton variant="secondary" onClick={onClose}>
            Đóng
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}
